import {randomBytes} from 'node:crypto';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {alphabet,issueCode,validateCode} from '../src/access/codes.ts';
const args=process.argv.slice(2);
if(args.includes('--help')){
 console.log('npm run tickets -- --bar BEER --expires 2026-12-31 --count 20 [--out .tickets/lot-1]');
 console.log('Produit CSV et tickets HTML imprimables. Prototype à règle publique : aucun contrôle global de réutilisation.');
 process.exit(0);
}
try{
 const opts={};
 for(let i=0;i<args.length;i+=2){if(!['--bar','--expires','--count','--out'].includes(args[i])||!args[i+1]||opts[args[i]]!==undefined)throw new Error('Arguments invalides. Utiliser --help.');opts[args[i]]=args[i+1];}
 const config=JSON.parse(await readFile(new URL('../data/bar-access.json',import.meta.url),'utf8'));
 const barId=(opts['--bar']??'BEER').toUpperCase(),bar=config.bars.find(b=>b.id===barId);
 if(!bar)throw new Error('Bar inconnu : ajouter son identifiant dans data/bar-access.json.');
 const count=Number(opts['--count']??20);
 if(!Number.isInteger(count)||count<1||count>1000)throw new Error('Le nombre doit être compris entre 1 et 1000.');
 const expires=opts['--expires'];if(!expires)throw new Error('Indiquer --expires AAAA-MM-JJ (fin de journée UTC).');
 const codes=new Set();
 while(codes.size<count){const nonce=[...randomBytes(8)].map(n=>alphabet[n&31]).join('');const code=issueCode(barId,expires,nonce);validateCode(code,[barId]);codes.add(code);}
 const output=resolve(opts['--out']??`.tickets/${barId}-${Date.now()}`);
 await mkdir(output,{recursive:true});
 for(const file of ['codes.csv','tickets.html']){let exists=false;try{await access(`${output}/${file}`);exists=true;}catch{}if(exists)throw new Error('Ce lot existe déjà. Choisir un autre dossier --out.');}
 const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const csv=['bar,expires_utc,code',...[...codes].map(code=>`${barId},${expires},${code}`)].join('\n')+'\n';
 const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Tickets Beerodys’Sait — ${escape(bar.name)}</title><style>body{font:15px system-ui;color:#173e32;margin:20px}header{margin-bottom:20px}.tickets{display:grid;grid-template-columns:1fr 1fr;gap:14px}article{border:1px dashed #91866e;padding:20px;break-inside:avoid}h2{margin:0 0 10px}code{display:block;font-size:17px;font-weight:bold;margin:22px 0;overflow-wrap:anywhere}small{font-size:12px}@media print{header{display:none}body{margin:0}article{min-height:190px}}</style><header><h1>${escape(bar.name)} · ${count} tickets</h1><p>Prototype sans registre partagé. Ne pas publier ce fichier. Imprimer puis remettre un ticket après encaissement.</p><button onclick="window.print()">Imprimer les tickets</button></header><main class="tickets">${[...codes].map(code=>`<article><h2>Beerodys’Sait</h2><strong>${escape(bar.name)} · Une partie pour la table</strong><code>${code}</code><small>Ouvrez le jeu, choisissez « Nouvelle partie » puis saisissez ce code.<br><a href="${escape(config.gameUrl)}">${escape(config.gameUrl)}</a><br>À activer jusqu’au ${expires} inclus, en UTC.<br>Après démarrage, reprenez la partie sur le même navigateur.</small></article>`).join('')}</main></html>`;
 await writeFile(`${output}/codes.csv`,csv,{flag:'wx',mode:0o600});await writeFile(`${output}/tickets.html`,html,{flag:'wx',mode:0o600});
 console.log(`${count} tickets créés pour ${bar.name}.\nCSV : ${output}/codes.csv\nImpression : ${output}/tickets.html`);
}catch(error){console.error(error.message);process.exitCode=1;}
