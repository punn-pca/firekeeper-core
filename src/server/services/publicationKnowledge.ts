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

function chunkMarkdown(source:string, file:string, canonicalUrl:string): PublicationKnowledgeChunk[] {
  const filePath=path.join(process.cwd(),'firekeeper_publication',file);
  if(!fs.existsSync(filePath)) return [];
  const text=fs.readFileSync(filePath,'utf8');
  const lines=text.split(/\r?\n/);
  let section=source, buf:string[]=[];
  const out:PublicationKnowledgeChunk[]=[];
  const flush=()=>{
    const body=buf.join('\n').trim(); buf=[];
    if(body.length<80) return;
    for(let i=0;i<body.length;i+=1800){
      const content=body.slice(i,i+2200).trim();
      if(content.length<60) continue;
      out.push({id:`pub-${hash(source+section+content).slice(0,16)}`,source,title:source,section,content,canonicalUrl,sourceType:'OFFICIAL_PUBLICATION',author:'PUNN',hash:hash(content)});
    }
  };
  for(const line of lines){
    const m=line.match(/^#{1,4}\s+(.+)$/);
    if(m){ flush(); section=m[1].replace(/\*\*/g,'').trim(); }
    else buf.push(line);
  }
  flush(); return out;
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
      out.push({id:`pub-${hash('Sacred Flame'+page+section+content).slice(0,16)}`,source:'Sacred Flame',title:'Sacred Flame',section,content,canonicalUrl,page,sourceType:'OFFICIAL_PUBLICATION',author:'PUNN',hash:hash(content)});
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
  return chunks.map((c,i)=>`[FK-PUB-${i+1}] ${c.source} — ${c.section}\nURL: ${c.canonicalUrl}\nHASH: ${c.hash}\n${c.content}`).join('\n\n---\n\n');
}
