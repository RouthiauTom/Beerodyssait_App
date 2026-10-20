import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {issueCode} from '../src/access/codes.ts';
const prefix='/beerodyssait/';let revision=0;let missing=false;
const types={html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',svg:'image/svg+xml',ttf:'font/ttf',webmanifest:'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith(prefix)||path.includes('..')){res.writeHead(404).end();return;}
  const file=path.slice(prefix.length)||'index.html';
  if(missing&&file==='assets/logo.svg'){res.writeHead(503).end();return;}
  let body=await readFile(`dist/${file}`);
  if(file==='sw.js'&&revision)body=Buffer.from(body.toString().replace(/const CACHE=PREFIX\+'([^']+)'/,`const CACHE=PREFIX+'test-${revision}'`));
  res.writeHead(200,{'Content-Type':types[file.split('.').pop()]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}${prefix}`;
let browser;
async function waitForSaved(page){await page.waitForFunction(()=>document.querySelector('.save-note')?.textContent?.includes('sauvegardée'));}
try{
 browser=await chromium.launch({channel:'chromium'});
 const context=await browser.newContext();let page=await context.newPage();
 await page.addInitScript(()=>{Math.random=()=>0;});
 await page.goto(url);await page.locator('[data-offline-ready="true"]').waitFor();
 const manifest=await page.evaluate(async()=>await (await fetch('manifest.webmanifest')).json());
 assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons)assert.equal(await page.evaluate(async src=>(await fetch(src)).status,icon.src),200);
 await page.getByRole('button',{name:'Nouvelle partie'}).click();
 await page.getByLabel('Code du ticket',{exact:true}).fill(issueCode('BEER',new Date(Date.now()+30*86400000).toISOString().slice(0,10),'12345678'));
 await page.getByRole('button',{name:'Valider le ticket'}).click();
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');
 await page.getByRole('button',{name:'Commencer la partie'}).click();await page.getByRole('button',{name:'Lancer le dé'}).click();
 await page.getByRole('button',{name:'Tirer une question'}).click();await waitForSaved(page);
 const question=await page.locator('.question-text').textContent();
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Reprendre la partie'}).click();
 assert.equal(await page.locator('.question-text').textContent(),question);
 for(const selector of ['.board-map img','.wordmark img'])assert.equal(await page.locator(selector).evaluate(img=>img.complete&&img.naturalWidth>0),true);
 await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.fonts.check('16px Jost')),true);
 console.log('PASS : rechargement hors ligne, question, sauvegarde, plateau, logo et police sous un sous-chemin.');
 await context.setOffline(false);revision=1;
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
 await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
 await page.waitForFunction(()=>document.querySelector('.offline-status')?.textContent?.includes('mise à jour est prête'));
 assert.equal(await page.locator('.question-text').textContent(),question);
 const before=await page.evaluate(async()=>await caches.keys());assert.equal(before.length,2);
 await page.close();page=await context.newPage();await page.goto(url);await page.locator('[data-offline-ready="true"]').waitFor();
 await page.waitForFunction(async()=>(await caches.keys()).length===1);
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Reprendre la partie'}).click();assert.equal(await page.locator('.question-text').textContent(),question);
 console.log('PASS : mise à jour différée, ancien cache nettoyé, partie conservée et reprise hors ligne.');
 // Expiry still uses the saved deadline after offline closing/reopening.
 await page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('beerodyssait');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const storeName=db.objectStoreNames[0];
  await new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readwrite');const store=tx.objectStore(storeName);const r=store.openCursor();r.onsuccess=()=>{const cursor=r.result;if(cursor){if(cursor.key==='game'){const value=cursor.value;value.deadline=Date.now()-1000;cursor.update(value);}cursor.continue();}};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
 });
 await page.reload();await page.getByRole('button',{name:'Reprendre la partie'}).click();await page.locator('.result.incorrect').waitFor();assert.equal(await page.locator('.consequence').textContent(),'Tu reviens à ta position avant le lancer.');
 console.log('PASS : chronomètre expiré pendant la fermeture, correction et pénalité hors ligne.');
 await context.setOffline(false);missing=true;revision=2;
 await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
 await page.waitForFunction(async()=>{const reg=await navigator.serviceWorker.getRegistration();return !reg.installing&&!reg.waiting;});
 assert.equal((await page.evaluate(async()=>await caches.keys())).length,1);
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Reprendre la partie'}).click();await page.locator('.result.incorrect').waitFor();
 console.log('PASS : installation incomplète rejetée, version précédente encore jouable hors ligne.');
 const offlineStart=await browser.newContext();const startPage=await offlineStart.newPage();
 missing=false;
 await startPage.goto(url);await startPage.locator('[data-offline-ready="true"]').waitFor();await offlineStart.setOffline(true);
 await startPage.getByRole('button',{name:'Nouvelle partie'}).click();
 await startPage.getByLabel('Code du ticket',{exact:true}).fill(issueCode('BEER',new Date(Date.now()+30*86400000).toISOString().slice(0,10),'87654321'));
 await startPage.getByRole('button',{name:'Valider le ticket'}).click();
 await startPage.getByLabel('Joueur 1',{exact:true}).fill('Offline');await startPage.getByLabel('Joueur 2',{exact:true}).fill('Table');await startPage.getByRole('button',{name:'Commencer la partie'}).click();await startPage.locator('.game-layout').waitFor();
 await startPage.reload();await startPage.getByRole('button',{name:'Reprendre la partie'}).click();assert.equal(await startPage.locator('.active-player h1').textContent(),'Offline');
 await offlineStart.close();missing=true;
 console.log('PASS : activation d’un nouveau ticket et reprise sans connexion après installation.');
 await context.close();
 const first=await browser.newContext();const broken=await first.newPage();await broken.goto(url);await broken.waitForFunction(()=>document.querySelector('.offline-status')?.textContent?.includes('indisponible'));assert.equal((await broken.evaluate(async()=>await caches.keys())).length,0);await first.close();console.log('PASS : premier téléchargement incomplet, aucun état hors ligne annoncé à tort.');
}catch(error){console.error(error);process.exitCode=1;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
