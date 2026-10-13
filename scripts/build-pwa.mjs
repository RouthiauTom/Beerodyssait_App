import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function files(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(`${dir}/${e.name}`):`${dir}/${e.name}`))).flat();}
const paths=(await files('dist')).filter(p=>!p.endsWith('/sw.js')).sort();
const hash=createHash('sha256');hash.update(await readFile(new URL(import.meta.url)));for(const p of paths){hash.update(p);hash.update(await readFile(p));}
const version=hash.digest('hex').slice(0,20);
await writeFile('dist/sw.js',`
const BASE=self.registration.scope;
const PREFIX='beerodyssait:'+new URL(BASE).pathname+':';
const CACHE=PREFIX+'${version}';
const FILES=${JSON.stringify(paths.map(p=>p.slice(5)))}.map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const cache=await caches.open(CACHE);await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));}
 catch(error){await caches.delete(CACHE);throw error;}
})()));
// Never skipWaiting: a running game keeps its original application version.
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(BASE))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(event.request.mode==='navigate')return (await cache.match(new URL('index.html',BASE).href))||fetch(event.request);
  return (await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request);
 })());
});
`);
console.log(`PWA: ${paths.length} fichiers précachés, version ${version}`);
