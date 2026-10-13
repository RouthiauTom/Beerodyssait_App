import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const questions=JSON.parse(readFileSync(new URL('../../data/questions.json',import.meta.url),'utf-8'));

test('mobile setup, settings, zoom and reprise',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto('/');
  await page.getByRole('button',{name:'Nouvelle partie'}).click();
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
  await page.goto('/');await page.getByRole('button',{name:'Nouvelle partie'}).click();
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
  await page.getByRole('button',{name:'New game'}).click();await page.getByLabel('Player 1',{exact:true}).fill('Ada');await page.getByLabel('Player 2',{exact:true}).fill('Lin');
  await page.getByRole('button',{name:'Start game'}).click();await expect(page.locator('.board-map img')).toHaveAttribute('src',/plateau-en\.svg$/);await page.getByRole('button',{name:'Roll the die'}).click();await page.getByRole('button',{name:'Draw a question'}).click();
  const text=await page.locator('.question-text').textContent();expect(questions.questions.some(q=>q.translations.en.question===text)).toBe(true);
  await page.locator('.wordmark').click();await page.getByRole('button',{name:'New game'}).click();await expect(page.getByRole('dialog')).toContainText('Replace it');await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Resume game'}).click();await expect(page.locator('.question-text')).toHaveText(text!);
});


test('failed answer shows correction before returning to the previous position',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0;});await page.goto('/');
 await page.getByRole('button',{name:'Nouvelle partie'}).click();
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
