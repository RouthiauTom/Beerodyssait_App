import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {issueCode} from '../../src/access/codes';
async function redeem(page,language='fr',nonce='12345678'){
 const expires=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
 await page.getByLabel(language==='fr'?'Code du ticket':'Ticket code',{exact:true}).fill(issueCode('BEER',expires,nonce));
 await page.getByRole('button',{name:language==='fr'?'Valider le ticket':'Validate ticket'}).click();
}
const questions=JSON.parse(readFileSync(new URL('../../data/questions.json',import.meta.url),'utf-8'));

test('mobile setup, settings, zoom and reprise',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto('/');
  await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
  await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');
  await page.getByRole('button',{name:'Commencer la partie'}).click();
  await page.getByRole('button',{name:'Lancer le dé'}).click();
  await expect(page.locator('.turn-context')).toContainText('Belgique');
  await page.getByRole('button',{name:'Zoom +',exact:true}).click();await expect(page.locator('.board-tools output')).toHaveText('150%');
  await page.getByRole('button',{name:'Tirer une question'}).click();
  await expect(page.getByRole('timer')).toContainText('60s');
  await expect(page.locator('.question-text')).toBeVisible();
  await expect.poll(async()=>page.locator('.save-note').last().textContent()).toContain('sauvegardée');
  const text=await page.locator('.question-text').textContent();
  await page.reload();await page.getByRole('button',{name:'Reprendre la partie'}).click();
  await expect(page.locator('.question-text')).toHaveText(text!);
  await page.getByRole('button',{name:'Paramètres',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth',390);
  await page.screenshot({path:'docs/interface-mobile.png',fullPage:true});
});

for(const count of [2,10])test(`partie complète dans l’interface à ${count} joueurs`,async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.99999;});
  await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
  for(let i=2;i<count;i++)await page.getByRole('button',{name:'Ajouter un joueur'}).click();
  for(let i=0;i<count;i++)await page.getByLabel(`Joueur ${i+1}`,{exact:true}).fill(`Joueur ${i+1}`);
  await page.getByRole('button',{name:'Commencer la partie'}).click();
  for(let turn=0;turn<100;turn++){
    await page.getByRole('button',{name:'Lancer le dé'}).click();
    if(await page.locator('.levels').count())await page.getByRole('button',{name:'Maître brasseur'}).click();
    await page.getByRole('button',{name:'Tirer une question'}).click();
    const id=Number(await page.locator('.question-text').getAttribute('data-question-id'));
    const q=questions.questions.find(q=>q.id===id);expect(q).toBeDefined();
    if(q!.type==='open'){
      await page.getByRole('button',{name:'Voir la réponse'}).click();await page.getByRole('button',{name:'Correct',exact:true}).click();
    }else{
      for(const id of q!.correctChoiceIds){
        const label=q!.type==='true_false'?(id==='true'?'Vrai':'Faux'):q!.translations.fr.choices.find(c=>c.id===id)!.text;
        await page.locator('.choices label').filter({hasText:label}).click();
      }
      await page.getByRole('button',{name:'Valider ma réponse'}).click();
    }
    await expect(page.locator('.result')).toHaveText('Correct');
    await expect(page.locator('.consequence')).toHaveText('Tu restes sur ta case.');
    await page.getByRole('button',{name:'Continuer',exact:false}).click();
    if(await page.locator('.victory').count())break;
    await page.getByRole('button',{name:'Joueur suivant'}).click();
  }
  await expect(page.locator('.victory')).toContainText('Grand Maître Brasseur');
  await expect(page.locator('.victory')).toContainText('Joueur 1');
});

test('English interface and source question, replacing a save needs confirmation',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await page.goto('/');
  await page.getByLabel('Langue / Language').selectOption('en');
  await page.getByRole('button',{name:'New game'}).click();await redeem(page,'en');await page.getByLabel('Player 1',{exact:true}).fill('Ada');await page.getByLabel('Player 2',{exact:true}).fill('Lin');
  await page.getByRole('button',{name:'Start game'}).click();await expect(page.locator('.board-map img')).toHaveAttribute('src',/plateau-en\.svg$/);await page.getByRole('button',{name:'Roll the die'}).click();await page.getByRole('button',{name:'Draw a question'}).click();
  const text=await page.locator('.question-text').textContent();expect(questions.questions.some(q=>q.translations.en.question===text)).toBe(true);
  await page.locator('.wordmark').click();await page.getByRole('button',{name:'New game'}).click();await expect(page.getByRole('dialog')).toContainText('Replace it');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Resume game'}).click();await expect(page.locator('.question-text')).toHaveText(text!);
});


test('failed answer shows correction before returning to the previous position',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0;});await page.goto('/');
 await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');
 await page.getByRole('button',{name:'Commencer la partie'}).click();await page.getByRole('button',{name:'Lancer le dé'}).click();await page.getByRole('button',{name:'Tirer une question'}).click();
 await page.getByText('La NASA',{exact:true}).click();await page.getByRole('button',{name:'Valider ma réponse'}).click();
 await expect(page.locator('.result')).toHaveText('Incorrect');await expect(page.locator('.turn-context')).toContainText('Étape 1 / 60');
 await expect(page.locator('.answer-text')).toContainText('UNESCO');await expect(page.locator('.question-source')).toHaveAttribute('href',/unesco/);
 await page.getByRole('button',{name:'Continuer'}).click();await expect(page.locator('.turn-context')).toContainText('Étape 0 / 60');
 await page.getByRole('button',{name:'Joueur suivant'}).click();await expect(page.locator('.active-player h1')).toHaveText('Bob');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('beerodyssait.preferences'))).not.toBeNull();
 expect(await page.evaluate(()=>localStorage.getItem('vinodyssait.preferences'))).toBeNull();
});

test('ticket validation rejects invalid codes and does not consume a ticket before starting',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();
 await page.getByLabel('Code du ticket',{exact:true}).fill('B1-BEER-FAUX');await page.getByRole('button',{name:'Valider le ticket'}).click();
 await expect(page.getByRole('alert')).toContainText('invalide');await expect(page.getByLabel('Joueur 1',{exact:true})).toHaveCount(0);
 await redeem(page);await expect(page.locator('.ticket-accepted')).toContainText('Ticket accepté');
 await page.getByRole('button',{name:'Annuler',exact:true}).click();await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');await page.getByRole('button',{name:'Commencer la partie'}).click();
 await expect(page.locator('.game-layout')).toBeVisible();
 await page.locator('.wordmark').click();await page.getByRole('button',{name:'Nouvelle partie'}).click();await page.getByRole('button',{name:'Remplacer la partie',exact:true}).click();await redeem(page);
 await expect(page.getByRole('alert')).toContainText('déjà été utilisé');
 await page.getByRole('button',{name:'Retour',exact:true}).click();await page.getByRole('button',{name:'Reprendre la partie'}).click();await expect(page.locator('.active-player h1')).toHaveText('Alice');
 await page.getByRole('button',{name:'Paramètres',exact:true}).click();await page.getByRole('button',{name:'Effacer la sauvegarde',exact:true}).click();await page.getByRole('button',{name:'Effacer la sauvegarde',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Reprendre la partie'})).toHaveCount(0);
 await page.reload();await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);await expect(page.getByRole('alert')).toContainText('déjà été utilisé');
});

test('starting the same ticket concurrently in two tabs creates exactly one game',async({context})=>{
 const pages=await Promise.all([context.newPage(),context.newPage()]);
 for(const [index,page] of pages.entries()){
  await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
  await page.getByLabel('Joueur 1',{exact:true}).fill('Table '+index);await page.getByLabel('Joueur 2',{exact:true}).fill('Guest '+index);
 }
 await Promise.all(pages.map(page=>page.getByRole('button',{name:'Commencer la partie'}).click()));
 await expect.poll(async()=>Promise.all(pages.map(page=>page.locator('.game-layout').count())).then(counts=>counts.reduce((a,b)=>a+b,0))).toBe(1);
 const loser=await pages[0].locator('.game-layout').count()?pages[1]:pages[0];await expect(loser.getByRole('alert')).toContainText('déjà été utilisé');
 for(const page of pages)await page.close();
});

test('abandoning a replacement preserves the previous paid game',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');await page.getByRole('button',{name:'Commencer la partie'}).click();await expect(page.locator('.game-layout')).toBeVisible();
 await page.locator('.wordmark').click();await page.getByRole('button',{name:'Nouvelle partie'}).click();await page.getByRole('button',{name:'Remplacer la partie',exact:true}).click();await redeem(page,'fr','87654321');
 await page.getByRole('button',{name:'Annuler',exact:true}).click();await page.getByRole('button',{name:'Reprendre la partie'}).click();await expect(page.locator('.active-player h1')).toHaveText('Alice');
});

test('expired and wrong-venue codes are refused in English',async({page})=>{
 await page.goto('/');await page.getByLabel('Langue / Language').selectOption('en');await page.getByRole('button',{name:'New game'}).click();
 await page.getByLabel('Ticket code',{exact:true}).fill(issueCode('BEER','2020-01-01','12345678'));await page.getByRole('button',{name:'Validate ticket'}).click();await expect(page.getByRole('alert')).toContainText('expired');
 await page.getByLabel('Ticket code',{exact:true}).fill(issueCode('CAFE','2030-01-01','12345678'));await page.getByRole('button',{name:'Validate ticket'}).click();await expect(page.getByRole('alert')).toContainText('not for a venue');
});

test('a ticket that expires during setup cannot start a game',async({page})=>{
 await page.addInitScript(()=>{Date.now=()=>Date.parse('2026-10-19T12:00:00Z');});
 await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();
 await page.getByLabel('Code du ticket',{exact:true}).fill(issueCode('BEER','2026-10-20','12345678'));await page.getByRole('button',{name:'Valider le ticket'}).click();
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');
 await page.evaluate(()=>{Date.now=()=>Date.parse('2026-10-21T00:00:00Z');});
 await page.getByRole('button',{name:'Commencer la partie'}).click();await expect(page.getByRole('alert')).toContainText('date limite');await expect(page.locator('.game-layout')).toHaveCount(0);
});

test('unavailable local storage prevents ticket activation',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'indexedDB',{value:{open(){throw new Error('Storage disabled');}}});});
 await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
 await expect(page.getByRole('alert').last()).toContainText('sauvegarde fiable');await expect(page.getByLabel('Joueur 1',{exact:true})).toHaveCount(0);
});

test('a failed game write rolls back ticket consumption and allows a retry',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();await redeem(page);
 await page.getByLabel('Joueur 1',{exact:true}).fill('Alice');await page.getByLabel('Joueur 2',{exact:true}).fill('Bob');
 await page.evaluate(()=>{
  const put=IDBObjectStore.prototype.put;
  (window as any).restoreTicketPut=()=>{IDBObjectStore.prototype.put=put;};
  IDBObjectStore.prototype.put=function(value,key){if(key==='game'){this.transaction.abort();return {} as IDBRequest;}return put.call(this,value,key);};
 });
 await page.getByRole('button',{name:'Commencer la partie'}).click();await expect(page.getByRole('alert')).toContainText('sauvegarde fiable');await expect(page.locator('.game-layout')).toHaveCount(0);
 await page.evaluate(()=>(window as any).restoreTicketPut());
 await page.getByRole('button',{name:'Commencer la partie'}).click();await expect(page.locator('.game-layout')).toBeVisible();
});
