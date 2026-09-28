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
  'Firekeeper Theory': ['firekeeper theory', 'ทฤษฎี firekeeper', 'ทฤษฎีไฟร์คีปเปอร์'],
  'Practical Guide': ['practical guide', 'firekeeper practical guide'],
  'Case Studies': ['case studies', 'firekeeper case studies'],
  'Quick Start': ['quick start', 'firekeeper quick start'],
  'AI Governance': ['ai governance', 'firekeeper ai governance'],
};

export function detectNamedPublication(query: string): string | null {
  const q = normalize(query);
  const firekeeperContext = /fire\s*keeper|ไฟร์คีปเปอร์|\bpunn\b|ปุญญ์/i.test(q);
  for (const [source, aliases] of Object.entries(PUBLICATION_ALIASES)) {
    if (aliases.some(alias => {
      const title = normalize(alias);
      const genericTitle = ['Practical Guide', 'Case Studies', 'Quick Start', 'AI Governance'].includes(source);
      return q.includes(title) && (!genericTitle || firekeeperContext || q.trim() === title);
    })) return source;
  }
  return null;
}

export function hasExplicitPublicationIntent(query: string): boolean {
  const q = normalize(query).trim();
  if (!q) return false;

  // A named Firekeeper publication is an explicit request for that corpus.
  if (detectNamedPublication(q)) return true;

  // A question about Firekeeper inside "RAG" refers to this corpus, while a
  // standalone question about RAG as a technology does not.
  if (/\b(?:rag|retrieval augmented generation)\b/i.test(q)
      && /\bfire\s*keeper\b|ไฟร์คีปเปอร์/i.test(q)) return true;

  // Keep Publication RAG opt-in: generic questions must not be pulled toward
  // Firekeeper publications merely because semantic similarity exists.
  return [
    /firekeeper\s+official\s+publication/i,
    /firekeeper\s+publication/i,
    /publication\s+(?:ของ|จาก)\s*(?:firekeeper|punn|ปุญญ์)/i,
    /(?:หนังสือ|บทความ|งานเขียน|เอกสาร)(?:\s+ของ)?\s*(?:firekeeper|punn|ปุญญ์)/i,
    /(?:ใน|จาก|ตาม)\s*(?:หนังสือ|บทความ|งานเขียน|เอกสาร)\s*(?:firekeeper|ของ\s*punn|ของ\s*ปุญญ์)/i,
    /(?:บทที่|chapter)\s*\d+.*(?:firekeeper|หนังสือ|publication)/i,
  ].some(pattern => pattern.test(q));
}

export function shouldSupplementPublicationWithWeb(query: string, chunks: PublicationKnowledgeChunk[], hasInventory = false): boolean {
  // An explicit request for public/current sources still gets live evidence.
  if (/(?:ค้น(?:หา)?เว็บ|ค้น(?:หา)?จากเว็บ|search (?:the )?web|latest|ล่าสุด|ปัจจุบัน|วันนี้)/i.test(query)) return true;
  return chunks.length === 0 && !hasInventory;
}

export function isPublicationInventoryQuestion(query: string): boolean {
  return hasExplicitPublicationIntent(query)
    && !/(?:บทที่|chapter\s*\d+|อธิบาย|วิเคราะห์|สรุปเนื้อหา)/i.test(query)
    && /(?:มีข้อมูล|มีเอกสาร|มีอะไร(?:บ้าง)?|what(?:'s| is) in|do (?:you|we) have)/i.test(query)
    && /(?:rag|คลัง|เอกสาร|publication)/i.test(query);
}

export function getPublicationInventory(): Array<{ source: string; url: string; chunkCount: number }> {
  const sources = new Map<string, { source: string; url: string; chunkCount: number }>();
  for (const chunk of loadPublicationKnowledge()) {
    const entry = sources.get(chunk.source);
    if (entry) entry.chunkCount++;
    else sources.set(chunk.source, { source: chunk.source, url: chunk.canonicalUrl, chunkCount: 1 });
  }
  return [...sources.values()];
}

export async function resolvePublicationEvidence(query: string) {
  const intent = hasExplicitPublicationIntent(query);
  const inventory = intent && isPublicationInventoryQuestion(query) ? getPublicationInventory() : [];
  const chunks = intent && inventory.length === 0
    ? await retrievePublicationKnowledgeHybrid(query, 6)
    : [];
  return {
    intent,
    inventory,
    chunks,
    corpusStats: getPublicationCorpusStats(),
    needsWeb: intent && shouldSupplementPublicationWithWeb(query, chunks, inventory.length > 0)
  };
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
  for(const x of n.split(/[^\p{L}\p{N}_]+/u)) if(x.length>1) out.add(x);
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
    const paragraphs=[...region.matchAll(/[^\S\r\n]*\S[^\r\n]*(?:\r?\n(?!\s*\r?\n)[^\r\n]*)*/g)]
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

function chunkSacredFlameMarkdown(): PublicationKnowledgeChunk[] {
  return chunkMarkdown('Sacred Flame','Firekeeper_Sacred_Flame.md','/firekeeper_publication/Firekeeper_Sacred_Flame.html');
}

export function loadPublicationKnowledge(): PublicationKnowledgeChunk[] {
  if(cache) return cache;
  cache=[...PUBLICATIONS.flatMap(([s,f,u])=>chunkMarkdown(s,f,u)),...chunkSacredFlameMarkdown()];
  if (process.env.NODE_ENV === 'production' && cache.length === 0) {
    throw new Error('[PUBLICATION_CORPUS_MISSING] Production runtime contains no Firekeeper publication chunks. Ensure firekeeper_publication/ is copied into the runtime image.');
  }
  return cache;
}

/** Observable corpus scope for audit/UI disclosure; retrieval must not be treated as full-corpus proof. */
export function getPublicationCorpusStats() {
  const chunks = loadPublicationKnowledge();
  const bySource = new Map<string, number>();
  for (const chunk of chunks) bySource.set(chunk.source, (bySource.get(chunk.source) || 0) + 1);
  return { totalChunks: chunks.length, sources: [...bySource.entries()].map(([source, chunkCount]) => ({ source, chunkCount })) };
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
  const requestedChapter = query.match(/(?:บทที่|chapter)\s*(\d+)(?:\s*(?:-|–|ถึง)\s*(\d+))?/i);
  if (requestedChapter) {
    const source = namedPublication || (/fire\s*keeper|ไฟร์คีปเปอร์/i.test(query) ? 'Firekeeper Theory' : null);
    if (source) {
      const first = Number(requestedChapter[1]);
      const last = requestedChapter[2] ? Number(requestedChapter[2]) : first;
      const chapters = last >= first && last - first <= 10
        ? Array.from({ length: last - first + 1 }, (_, i) => first + i)
        : [first];
      const chapterPatterns = chapters.map(n => new RegExp(`(?:บทที่|chapter)\\s*${n}(?!\\d)`, 'i'));
      const matching = loadPublicationKnowledge()
        .filter(c => c.source === source && chapterPatterns.some(pattern => pattern.test(c.section)));
      const firstPerChapter = chapterPatterns
        .map(pattern => matching.find(c => pattern.test(c.section)))
        .filter((c): c is PublicationKnowledgeChunk => Boolean(c));
      return [...firstPerChapter, ...matching.filter(c => !firstPerChapter.includes(c))].slice(0, limit);
    }
  }
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
  // Only bare markers are rewritten; do not corrupt existing Markdown link URLs.
  const text = response.replace(/\[FK-PUB-(\d+)\](?!\()/g, (matched, number: string) => {
    const id = `FK-PUB-${number}`;
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
      return `[${id}](${chunk.canonicalUrl})`;
    } catch {
      invalidIds.add(id);
      return '[อ้างอิง Publication ไม่สามารถอ่านต้นฉบับได้]';
    }
  });
  return { text, invalidIds: [...invalidIds], verifiedIds: [...verifiedIds] };
}
