import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
const svg=await readFile('public/icons/icon.svg','utf8');
const browser=await chromium.launch({channel:'chromium'});
try{
 const page=await browser.newPage();
 for(const size of [192,512]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent(`<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>${svg}`);
  await page.screenshot({path:`public/icons/icon-${size}.png`,omitBackground:false});
 }
}finally{await browser.close();}
console.log('Icônes PWA 192 et 512 créées.');
