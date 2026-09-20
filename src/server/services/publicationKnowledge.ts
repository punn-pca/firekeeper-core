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
};

const PUBLICATIONS = [
  ['Firekeeper Theory','Firekeeper_Theory.md','/firekeeper_publication/Firekeeper_Theory.html'],
  ['Practical Guide','Firekeeper_Practical_Guide.md','/firekeeper_publication/Firekeeper_Practical_Guide.html'],
  ['Case Studies','Firekeeper_Case_Studies.md','/firekeeper_publication/Firekeeper_Case_Studies.html'],
  ['Quick Start','Firekeeper_Quick_Start.md','/firekeeper_publication/Firekeeper_Quick_Start.html'],
  ['AI Governance','Firekeeper_AI_Governance.md','/firekeeper_publication/Firekeeper_AI_Governance.html'],
] as const;

let cache: PublicationKnowledgeChunk[] | null = null;

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
  const compact=n.replace(/\\s+/g,'');
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
  return html.replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\\s+/g,' ').trim();
}

function chunkSacredFlame(): PublicationKnowledgeChunk[] {
  const filePath=path.join(process.cwd(),'firekeeper_publication','Firekeeper_Sacred_Flame.html');
  if(!fs.existsSync(filePath)) return [];
  const html=fs.readFileSync(filePath,'utf8');
  const sections=[...html.matchAll(/<section class="page" id="page-(\\d+)">([\\s\\S]*?)<\\/section>/gi)];
  const out:PublicationKnowledgeChunk[]=[];
  for(const m of sections){
    const page=Number(m[1]); const block=m[2];
    const heading=(block.match(/<h[23][^>]*>([\\s\\S]*?)<\\/h[23]>/i)||[])[1];
    const section=heading?stripHtml(heading):`Page ${page}`;
    const body=stripHtml(block.replace(/<div class="page-no">[\\s\\S]*?<\\/div>/i,''));
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
  cache=[...PUBLICATIONS.flatMap(([s,f,u])=>chunkMarkdown(s,f,u)),...chunkSacredFlame()];
  return cache;
}

export function retrievePublicationKnowledge(query:string, limit=6): PublicationKnowledgeChunk[] {
  const q=tokens(query); if(!q.length) return [];
  return loadPublicationKnowledge().map(c=>{
    const hay=normalize(c.section+' '+c.content);
    let score=0;
    for(const t of q){ if(hay.includes(t)) score+=t.length>=5?3:1; }
    const nq=normalize(query).trim();
    if(nq.length>2 && hay.includes(nq)) score+=12;
    if(normalize(c.section).includes(nq)) score+=8;
    return {...c,score};
  }).filter(c=>(c.score||0)>0).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,limit);
}

export function formatPublicationContext(chunks:PublicationKnowledgeChunk[]): string {
  if(!chunks.length) return '';
  return chunks.map((c,i)=>`[FK-PUB-${i+1}] ${c.source} — ${c.section}\nURL: ${c.canonicalUrl}\nHASH: ${c.hash}\n${c.content}`).join('\n\n---\n\n');
}
