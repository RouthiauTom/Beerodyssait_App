import {describe,it,expect} from 'vitest';
import bank from '../../data/questions.json';
import board from '../../data/board.json';
import regions from '../../data/regions.json';
import {createGame,transition,type Question,type Action} from '../../src/game/engine';
const questions=bank.questions as Question[];
describe('original bilingual bank and international board',()=>{
 it('has 220 unique questions, ten destinations and all three formats',()=>{
  expect(questions).toHaveLength(220);expect(new Set(questions.map(q=>q.id)).size).toBe(220);
  expect(regions).toHaveLength(10);expect(new Set(questions.map(q=>q.type))).toEqual(new Set(['qcm','true_false','open']));
  for(const language of ['fr','en'] as const)expect(new Set(questions.map(q=>q.translations[language].question)).size).toBe(220);
 });
 it('provides complete translations, valid answers and source attribution',()=>{
  for(const q of questions){
   expect(q.sources.length).toBeGreaterThan(0);q.sources.forEach(s=>expect(s).toMatch(/^(https:\/\/|La Bière pour les Nuls)/));
   for(const language of ['fr','en'] as const){
    const t=q.translations[language];expect(t.question.trim().length).toBeGreaterThan(10);expect(t.expectedAnswer.trim().length).toBeGreaterThan(0);
    const ids=t.choices.map(c=>c.id);expect(new Set(ids).size).toBe(ids.length);expect(new Set(t.choices.map(c=>c.text)).size).toBe(ids.length);
    if(q.type==='qcm'){expect(ids).toHaveLength(3);expect(q.correctChoiceIds.every(id=>ids.includes(id))).toBe(true);}
    if(q.type==='true_false')expect(['true','false']).toContain(q.correctChoiceIds[0]);
    if(q.type==='open')expect(q.correctChoiceIds).toEqual([]);
   }
   expect(q.translations.fr.choices.map(c=>c.id)).toEqual(q.translations.en.choices.map(c=>c.id));
  }
 });
 it('covers every general category and level with thirteen questions and every destination with at least four',()=>{
  for(let category=1;category<=4;category++)for(let level=1;level<=3;level++)expect(questions.filter(q=>q.categoryId===category&&q.difficulty===level)).toHaveLength(13);
  for(const region of regions)expect(questions.filter(q=>q.categoryId===5&&q.regionId===region.id&&q.difficulty===null).length).toBeGreaterThanOrEqual(4);
 });
 it('draws successfully from every space and level in both languages',()=>{
  const players=[{id:'a',name:'A',tokenId:'1',color:'#000'},{id:'b',name:'B',tokenId:'2',color:'#fff'}];
  for(const language of ['fr','en'] as const)for(const space of board.spaces)for(const level of [1,2,3] as const){
   let game=createGame(players,language,board);
   game={...game,phase:'awaiting_question',difficulty:space.categoryId===5?null:level,positionBeforeRoll:0,players:game.players.map(p=>({...p,position:space.id}))};
   const next=transition(game,{revision:game.revision,type:'draw',random:.5,now:0} as Action,board,questions);
   expect(next.phase).toBe('question');expect(next.activeQuestionId).not.toBeNull();
  }
 });
 it('keeps a contiguous sixty-space path, aligned coordinates and original special effects',()=>{
  expect(board.spaces.map(s=>s.id)).toEqual(Array.from({length:60},(_,i)=>i+1));
  for(const point of [board.start,...board.spaces]){expect(point.x).toBeGreaterThan(0);expect(point.x).toBeLessThan(1);expect(point.y).toBeGreaterThan(0);expect(point.y).toBeLessThan(1);}
  expect(board.effects.map(e=>[e.fromSpaceId,e.toSpaceId])).toEqual([[4,19],[27,38],[56,33]]);
  expect(board.spaces.at(-1)?.regionId).toBe(10);
 });
});
