import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type PublicationKnowledgeChunk = {
  id: string;
  source: string;
  title: string;
  section: string;
  content: string;
  canonicalUrl: string;
  page?: number;
  sourceFile: string;
  startOffset: number;
  endOffset: number;
  sourceType: 'OFFICIAL_PUBLICATION';
  author: 'PUNN';
  hash: string;
  score?: number;
  lexicalScore?: number;
  semanticScore?: number;
  retrievalMode?: 'LEXICAL' | 'HYBRID';
};

const PUBLICATIONS = [
  ['Firekeeper Theory','Firekeeper_Theory.md','/firekeeper_publication/Firekeeper_Theory.html'],
  ['Practical Guide','Firekeeper_Practical_Guide.md','/firekeeper_publication/Firekeeper_Practical_Guide.html'],
  ['Case Studies','Firekeeper_Case_Studies.md','/firekeeper_publication/Firekeeper_Case_Studies.html'],
  ['Quick Start','Firekeeper_Quick_Start.md','/firekeeper_publication/Firekeeper_Quick_Start.html'],
  ['AI Governance','Firekeeper_AI_Governance.md','/firekeeper_publication/Firekeeper_AI_Governance.html'],
] as const;

let cache: PublicationKnowledgeChunk[] | null = null;

const PUBLICATION_ALIASES: Record<string, string[]> = {
  'Sacred Flame': ['sacred flame', 'firekeeper and the sacred flame', 'ผู้เฝ้าไฟและเปลวไฟศักดิ์สิทธิ์', 'เปลวไฟศักดิ์สิทธิ์'],
  'Firekeeper Theory': ['firekeeper theory'],
  'Practical Guide': ['practical guide', 'firekeeper practical guide'],
  'Case Studies': ['case studies', 'firekeeper case studies'],
  'Quick Start': ['quick start', 'firekeeper quick start'],
  'AI Governance': ['ai governance', 'firekeeper ai governance'],
};

export function detectNamedPublication(query: string): string | null {
  const q = normalize(query);
  for (const [source, aliases] of Object.entries(PUBLICATION_ALIASES)) {
    if (aliases.some(alias => q.includes(normalize(alias)))) return source;
  }
  return null;
}

export function hasExplicitPublicationIntent(query: string): boolean {
  const q = normalize(query).trim();
  if (!q) return false;

  // A named Firekeeper publication is an explicit request for that corpus.
  if (detectNamedPublication(q)) return true;

  // Keep Publication RAG opt-in: generic questions must not be pulled toward
  // Firekeeper publications merely because semantic similarity exists.
  return [
    /firekeeper\s+official\s+publication/i,
    /official\s+publication/i,
    /firekeeper\s+publication/i,
    /publication\s+(?:ของ|จาก)\s*(?:firekeeper|punn|ปุญญ์)/i,
    /(?:หนังสือ|บทความ|งานเขียน|เอกสาร)(?:\s+ของ)?\s*(?:firekeeper|punn|ปุญญ์)/i,
    /(?:ใน|จาก|ตาม)\s*(?:หนังสือ|บทความ|งานเขียน|เอกสาร)\s*(?:firekeeper|ของ\s*punn|ของ\s*ปุญญ์)/i,
    /(?:บทที่|chapter)\s*\d+.*(?:firekeeper|หนังสือ|publication)/i,
  ].some(pattern => pattern.test(q));
}


function normalize(s:string){ return s.toLowerCase().normalize('NFKC'); }
function tokens(s:string){
  const n=normalize(s);
  const out=new Set<string>();
  try {
    const Segmenter=(Intl as any).Segmenter;
    if(Segmenter){
      const seg=new Segmenter('th',{granularity:'word'});
      for(const x of seg.segment(n)) if(x.isWordLike && x.segment.length>1) out.add(x.segment);
    }
  } catch {}
  for(const x of n.split(/[^\\p{L}\\p{N}_]+/u)) if(x.length>1) out.add(x);
  const compact=n.replace(/\s+/g,'');
  for(let i=0;i<compact.length-2;i++) out.add(compact.slice(i,i+3));
  return [...out];
}
function hash(s:string){ return crypto.createHash('sha256').update(s).digest('hex'); }

/**
 * Chunk only at paragraph boundaries. Offsets refer to UTF-16 positions in the
 * original Markdown file; they allow exact local provenance checks.
 */
function chunkMarkdown(source:string, file:string, canonicalUrl:string): PublicationKnowledgeChunk[] {
  const filePath=path.join(process.cwd(),'firekeeper_publication',file);
  if(!fs.existsSync(filePath)) return [];
  const text=fs.readFileSync(filePath,'utf8');
  const lines=text.split(/\r?\n/);
  const out:PublicationKnowledgeChunk[]=[];
  let section=source, sectionStart=0, cursor=0;
  const flush=(end:number)=>{
    const region=text.slice(sectionStart,end);
    const paragraphs=[...region.matchAll(/\S[\s\S]*?(?=\r?\n\s*\r?\n|$)/g)]
      .map(m=>({value:m[0].trim(),start:sectionStart+(m.index||0)+m[0].indexOf(m[0].trim())}))
      .filter(p=>p.value.length>0);
    let group:typeof paragraphs=[];
    const emit=()=>{
      if(!group.length)return;
      const start=group[0].start;
      const last=group[group.length-1];
      const finish=last.start+last.value.length;
      const content=text.slice(start,finish);
      if(content.length>=60)out.push({
        id:`pub-${hash(file+section+start+finish+content).slice(0,16)}`,
        source,title:source,section,content,canonicalUrl,sourceFile:file,
        startOffset:start,endOffset:finish,sourceType:'OFFICIAL_PUBLICATION',
        author:'PUNN',hash:hash(content)
      });
      group=[];
    };
    for(const paragraph of paragraphs){
      if(group.length && paragraph.start+paragraph.value.length-group[0].start>2200)emit();
      // A single long paragraph stays intact rather than being cut mid-word.
      group.push(paragraph);
    }
    emit();
  };
  for(const line of lines){
    const lineStart=cursor;
    cursor+=line.length+(cursor+line.length<text.length?(text.slice(cursor+line.length).startsWith('\r\n')?2:1):0);
    const heading=line.match(/^#{1,4}\s+(.+)$/);
    if(heading){
      flush(lineStart);
      section=heading[1].replace(/\*\*/g,'').trim();
      sectionStart=cursor;
    }
  }
  flush(text.length);
  return out;
}

function stripHtml(html:string){
  return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\s+/g,' ').trim();
}

function chunkSacredFlameMarkdown(): PublicationKnowledgeChunk[] {
  return chunkMarkdown('Sacred Flame','Firekeeper_Sacred_Flame.md','/firekeeper_publication/Firekeeper_Sacred_Flame.html');
}

function chunkSacredFlame(): PublicationKnowledgeChunk[] {
  const filePath=path.join(process.cwd(),'firekeeper_publication','Firekeeper_Sacred_Flame.html');
  if(!fs.existsSync(filePath)) return [];
  const html=fs.readFileSync(filePath,'utf8');
  const sections=[...html.matchAll(/<section class="page" id="page-(\d+)">([\s\S]*?)<\/section>/gi)];
  const out:PublicationKnowledgeChunk[]=[];
  for(const m of sections){
    const page=Number(m[1]); const block=m[2];
    const heading=(block.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)||[])[1];
    const section=heading?stripHtml(heading):`Page ${page}`;
    const body=stripHtml(block.replace(/<div class="page-no">[\s\S]*?<\/div>/i,''));
    if(body.length<60) continue;
    for(let i=0;i<body.length;i+=1800){
      const content=body.slice(i,i+2200).trim(); if(content.length<60) continue;
      const canonicalUrl=`/firekeeper_publication/Firekeeper_Sacred_Flame.html#page-${page}`;
      out.push({id:`pub-${hash('Sacred Flame'+page+section+content).slice(0,16)}`,source:'Sacred Flame',title:'Sacred Flame',section,content,canonicalUrl,page,sourceFile:'Firekeeper_Sacred_Flame.html',startOffset:i,endOffset:i+content.length,sourceType:'OFFICIAL_PUBLICATION',author:'PUNN',hash:hash(content)});
    }
  }
  return out;
}

export function loadPublicationKnowledge(): PublicationKnowledgeChunk[] {
  if(cache) return cache;
  cache=[...PUBLICATIONS.flatMap(([s,f,u])=>chunkMarkdown(s,f,u)),...chunkSacredFlameMarkdown()];
  if (process.env.NODE_ENV === 'production' && cache.length === 0) {
    throw new Error('[PUBLICATION_CORPUS_MISSING] Production runtime contains no Firekeeper publication chunks. Ensure firekeeper_publication/ is copied into the runtime image.');
  }
  return cache;
}

function lexicalCandidates(query:string, limit=18): PublicationKnowledgeChunk[] {
  const q=tokens(query); if(!q.length) return [];
  return loadPublicationKnowledge().map(c=>{
    const hay=normalize(c.section+' '+c.content);
    const source=normalize(c.source);
    const title=normalize(c.title);
    let score=0;
    for(const t of q){ if(hay.includes(t)) score+=t.length>=5?3:1; }
    const nq=normalize(query).trim();
    if(nq.length>2 && hay.includes(nq)) score+=12;
    if(normalize(c.section).includes(nq)) score+=8;

    // Exact publication-name intent is stronger than incidental body-text matches.
    // Boost source/title matches without bypassing normal lexical or semantic ranking.
    if(nq.length>2){
      if(source===nq || title===nq) score+=40;
      else if(source.includes(nq) || title.includes(nq)) score+=24;
    }

    return {...c,score};
  }).filter(c=>(c.score||0)>0).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,limit)
    .map(c=>({...c,lexicalScore:c.score,retrievalMode:'LEXICAL'}));
}

export function retrievePublicationKnowledge(query:string, limit=6): PublicationKnowledgeChunk[] {
  return lexicalCandidates(query,Math.max(limit,18)).slice(0,limit);
}

function cosine(a:number[],b:number[]){
  if(a.length!==b.length || !a.length) return 0;
  let dot=0,aa=0,bb=0;
  for(let i=0;i<a.length;i++){ dot+=a[i]*b[i]; aa+=a[i]*a[i]; bb+=b[i]*b[i]; }
  return aa&&bb?dot/(Math.sqrt(aa)*Math.sqrt(bb)):0;
}

async function embedGemini(texts:string[]):Promise<number[][]|null>{
  const key=process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if(!key) return null;
  const model=process.env.FIREKEEPER_EMBEDDING_MODEL || 'gemini-embedding-001';
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(key)}`,{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({requests:texts.map(text=>({model:`models/${model}`,content:{parts:[{text}]},taskType:'RETRIEVAL_DOCUMENT'}))})
    });
    if(!res.ok) return null;
    const data:any=await res.json();
    return (data.embeddings||[]).map((e:any)=>e.values||[]);
  }catch{return null;}
}

let semanticIndexPromise:Promise<{chunks:PublicationKnowledgeChunk[],vectors:number[][]}|null>|null=null;
async function semanticIndex(){
  if(semanticIndexPromise) return semanticIndexPromise;
  semanticIndexPromise=(async()=>{
    const chunks=loadPublicationKnowledge();
    const vectors:number[][]=[];
    for(let i=0;i<chunks.length;i+=32){
      const batch=chunks.slice(i,i+32).map(c=>`${c.source}\n${c.section}\n${c.content}`);
      const v=await embedGemini(batch); if(!v || v.length!==batch.length) return null;
      vectors.push(...v);
    }
    return {chunks,vectors};
  })();
  return semanticIndexPromise;
}

export async function retrievePublicationKnowledgeHybrid(query:string,limit=6):Promise<PublicationKnowledgeChunk[]>{
  const namedPublication = detectNamedPublication(query);
  const lexical=lexicalCandidates(query,Math.max(18,limit*3));

  // Explicit publication identity is deterministic metadata, not a semantic guess.
  // Restrict retrieval to that canonical corpus before hybrid ranking so similarly
  // named web concepts or other Firekeeper books cannot displace the requested book.
  if (namedPublication) {
    const corpus = loadPublicationKnowledge().filter(c => c.source === namedPublication);
    const queryTokens = tokens(query);
    const ranked = corpus.map(c => {
      const hay = normalize(c.section + ' ' + c.content);
      let score = 100;
      for (const t of queryTokens) if (hay.includes(t)) score += t.length >= 5 ? 3 : 1;
      return {...c, score, lexicalScore: score, retrievalMode: 'LEXICAL' as const};
    }).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,limit);
    if (ranked.length) return ranked;
  }
  const idx=await semanticIndex();
  if(!idx) return lexical.slice(0,limit);
  const key=process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model=process.env.FIREKEEPER_EMBEDDING_MODEL || 'gemini-embedding-001';
  if(!key) return lexical.slice(0,limit);
  let qv:number[]|null=null;
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(key)}`,{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({content:{parts:[{text:query}]},taskType:'RETRIEVAL_QUERY'})
    });
    if(res.ok){const d:any=await res.json();qv=d.embedding?.values||null;}
  }catch{}
  if(!qv) return lexical.slice(0,limit);
  const lexMax=Math.max(1,...lexical.map(c=>c.lexicalScore||0));
  const lexMap=new Map(lexical.map(c=>[c.id,(c.lexicalScore||0)/lexMax]));
  const ranked=idx.chunks.map((c,i)=>{
    const semanticScore=Math.max(0,cosine(qv!,idx.vectors[i]||[]));
    const lexicalScore=lexMap.get(c.id)||0;
    const score=0.72*semanticScore+0.28*lexicalScore;
    return {...c,score,semanticScore,lexicalScore,retrievalMode:'HYBRID' as const};
  }).filter(c=>(c.semanticScore||0)>=0.42 || (c.lexicalScore||0)>0)
    .sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,limit);
  return ranked.length?ranked:lexical.slice(0,limit);
}

export function formatPublicationContext(chunks:PublicationKnowledgeChunk[]): string {
  if(!chunks.length) return '';
  return chunks.map((c,i)=>`[FK-PUB-${i+1}] ${c.source} — ${c.section}\nURL: ${c.canonicalUrl}\nSOURCE_FILE: ${c.sourceFile}\nSOURCE_OFFSETS: ${c.startOffset}-${c.endOffset}\nHASH: ${c.hash}\n${c.content}`).join('\n\n---\n\n');
}

/** Validate publication citation IDs against the exact excerpts sent for this turn.
 * This verifies reference identity and local source integrity, not factual entailment.
 */
export function validatePublicationCitations(
  response: string,
  chunks: PublicationKnowledgeChunk[],
  readSource: (file: string) => string = file =>
    fs.readFileSync(path.join(process.cwd(), 'firekeeper_publication', file), 'utf8')
): { text: string; invalidIds: string[]; verifiedIds: string[] } {
  const registry = new Map(chunks.map((chunk, index) => [`FK-PUB-${index + 1}`, chunk]));
  const verifiedIds = new Set<string>();
  const invalidIds = new Set<string>();
  const text = response.replace(/\[?(FK-PUB-\d+)\]?/g, (matched, id: string) => {
    const chunk = registry.get(id);
    if (!chunk) {
      invalidIds.add(id);
      return '[อ้างอิง Publication ไม่ตรงกับหลักฐานที่ดึงมา]';
    }
    try {
      const original = readSource(chunk.sourceFile);
      const excerpt = original.slice(chunk.startOffset, chunk.endOffset);
      if (excerpt !== chunk.content || hash(excerpt) !== chunk.hash) {
        invalidIds.add(id);
        return '[อ้างอิง Publication ตรวจสอบต้นฉบับไม่ผ่าน]';
      }
      verifiedIds.add(id);
      return matched;
    } catch {
      invalidIds.add(id);
      return '[อ้างอิง Publication ไม่สามารถอ่านต้นฉบับได้]';
    }
  });
  return { text, invalidIds: [...invalidIds], verifiedIds: [...verifiedIds] };
}
