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
function tokens(s:string){ return normalize(s).split(/[^\p{L}\p{N}_]+/u).filter(x=>x.length>1); }
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

export function loadPublicationKnowledge(): PublicationKnowledgeChunk[] {
  if(cache) return cache;
  cache=PUBLICATIONS.flatMap(([s,f,u])=>chunkMarkdown(s,f,u));
  return cache;
}

export function retrievePublicationKnowledge(query:string, limit=6): PublicationKnowledgeChunk[] {
  const q=tokens(query); if(!q.length) return [];
  return loadPublicationKnowledge().map(c=>{
    const hay=normalize(c.section+' '+c.content);
    let score=0;
    for(const t of q){ if(hay.includes(t)) score+=t.length>=5?3:1; }
    if(normalize(c.section).includes(normalize(query))) score+=8;
    return {...c,score};
  }).filter(c=>(c.score||0)>0).sort((a,b)=>(b.score||0)-(a.score||0)).slice(0,limit);
}

export function formatPublicationContext(chunks:PublicationKnowledgeChunk[]): string {
  if(!chunks.length) return '';
  return chunks.map((c,i)=>`[FK-PUB-${i+1}] ${c.source} — ${c.section}\nURL: ${c.canonicalUrl}\nHASH: ${c.hash}\n${c.content}`).join('\n\n---\n\n');
}
