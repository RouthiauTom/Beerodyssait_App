import {describe, it, expect} from 'vitest';
import rawBoard from '../../data/board.json';
import rawBank from '../../data/questions.json';
import {createGame, transition, correctChoices, type Board, type Question, type Game, type Action} from '../../src/game/engine';

const board: Board = rawBoard;
const bank = rawBank.questions as Question[];
const players = Array.from({length: 10}, (_,i) => ({id: `p${i}`, name: `Joueur ${i}`, tokenId: `t${i}`, color: '#000'}));
const fresh = (count = 2) => createGame(players.slice(0,count), 'fr', board);
const act = (s: Game, a: Omit<Action,'revision'> | Record<string,unknown>) => transition(s, {...a, revision:s.revision} as Action, board, bank);
function questionAt(position: number, dice: number, difficulty: 1|2|3 = 1): Game {
  let s = fresh();
  s = {...s, players:s.players.map((p,i) => i === 0 ? {...p,position} : p)};
  s = act(s,{type:'roll',value:dice});
  if (s.phase === 'level_choice') s=act(s,{type:'choose_level',value:difficulty});
  return act(s,{type:'draw',random:0,now:1000});
}
function answer(s: Game, correct: boolean): Game {
  const q=bank.find(q => q.id === s.activeQuestionId)!;
  if(q.type === 'open') return act(act(s,{type:'reveal',now:2000}),{type:'judge',correct});
  return act(s,{type:'submit',choices:correct ? q.correctChoiceIds : ['invalid'],now:2000});
}

describe('validated game rules', () => {
  it.each([2,10])('accepts %i players in entry order', count => {
    const s=fresh(count);expect(s.players.map(p=>p.id)).toEqual(players.slice(0,count).map(p=>p.id));expect(s.currentPlayerIndex).toBe(0);
  });
  it.each([1,11])('rejects %i players', count => expect(()=>createGame(Array.from({length:count},(_,i)=>({...players[0],id:String(i)})),'fr',board)).toThrow());
  it.each([0,7,1.5])('rejects dice %i',value=>expect(()=>act(fresh(),{type:'roll',value})).toThrow());
  it('roll 1 reaches Belgium and draws without a level',()=>{
    const s=questionAt(0,1);const q=bank.find(q=>q.id===s.activeQuestionId)!;
    expect(s.players[0].position).toBe(1);expect(s.difficulty).toBeNull();expect(q.categoryId).toBe(5);expect(q.regionId).toBe(1);
  });
  it.each([[3,1,19],[26,1,38]])('ladder from %i + %i arrives at %i', (position,dice,destination)=>{
    const s=questionAt(position,dice);expect(s.players[0].position).toBe(destination);
    expect(bank.find(q=>q.id===s.activeQuestionId)!.categoryId).toBe(board.spaces.find(x=>x.id===destination)!.categoryId);
    const correction=answer(s,false);expect(correction.players[0].position).toBe(destination);
    expect(act(correction,{type:'continue'}).players[0].position).toBe(position);
  });
  it('passing an effect start has no effect',()=>expect(act(fresh(),{type:'roll',value:5}).players[0].position).toBe(5));
  it('correct ordinary answer stays, incorrect returns only after correction',()=>{
    const s=questionAt(0,2);expect(act(answer(s,true),{type:'continue'}).players[0].position).toBe(2);
    const c=answer(s,false);expect(c.players[0].position).toBe(2);expect(c.currentPlayerIndex).toBe(0);
    const end=act(c,{type:'continue'});expect(end.players[0].position).toBe(0);expect(end.phase).toBe('turn_end');
    expect(act(end,{type:'next_player'}).currentPlayerIndex).toBe(1);
  });
  it.each([1,2,3] as const)('conveyor correct at level %i',difficulty=>{
    const s=questionAt(55,1,difficulty);const end=act(answer(s,true),{type:'continue'});
    expect(end.players[0].position).toBe(difficulty===3 ? 56 :33);expect(end.phase).toBe('turn_end');
  });
  it.each([1,2,3] as const)('conveyor failure at level %i returns before roll',difficulty=>{
    const s=questionAt(55,1,difficulty);expect(act(answer(s,false),{type:'continue'}).players[0].position).toBe(55);
    expect(act(act(s,{type:'tick',now:61000}),{type:'continue'}).players[0].position).toBe(55);
  });
  it.each([1,6])('Finland clamps and requires final success for roll %i',dice=>{
    const s=questionAt(59,dice);expect(s.players[0].position).toBe(60);expect(s.winnerId).toBeNull();
    const end=act(answer(s,true),{type:'continue'});expect(end.phase).toBe('finished');expect(end.winnerId).toBe('p0');
    expect(act(answer(s,false),{type:'continue'}).players[0].position).toBe(59);
  });
  it('requires the exact multiple-choice set',()=>{
    expect(correctChoices(['C','B'],['B','C'])).toBe(true);expect(correctChoices(['B'],['B','C'])).toBe(false);
    expect(correctChoices(['A','B','C'],['B','C'])).toBe(false);expect(correctChoices(['B','B'],['B'])).toBe(false);
  });
  it('timeout at deadline is irreversible and resolved once',()=>{
    const s=questionAt(0,2);expect(act(s,{type:'tick',now:60999})).toBe(s);
    const timed=act(s,{type:'tick',now:61000});expect(timed.answerStatus).toBe('incorrect');
    expect(act(timed,{type:'judge',correct:true})).toBe(timed);expect(act(timed,{type:'tick',now:80000})).toBe(timed);
  });
  it('open reveal stops timer before deadline and survives JSON resume',()=>{
    const q=bank.find(q=>q.type==='open')!;
    let s=questionAt(0,2);s={...s,activeQuestionId:q.id};
    const revealed=act(s,{type:'reveal',now:60999});expect(revealed.phase).toBe('oral_judgement');expect(revealed.deadline).toBeNull();
    const resumed=JSON.parse(JSON.stringify(revealed));expect(act(resumed,{type:'tick',now:999999})).toBe(resumed);
    expect(act(resumed,{type:'judge',correct:true}).answerStatus).toBe('correct');
    expect(act(s,{type:'reveal',now:61000}).answerStatus).toBe('incorrect');
  });
  it('resume after closure resolves elapsed absolute deadline',()=>{
    const resumed=JSON.parse(JSON.stringify(questionAt(0,2)));
    expect(act(resumed,{type:'tick',now:100000}).answerStatus).toBe('incorrect');
  });
  it('does not repeat until requested filter is exhausted',()=>{
    let s=questionAt(0,2);const first=s.activeQuestionId;
    s={...s,phase:'awaiting_question'};s=act(s,{type:'draw',random:0,now:0});expect(s.activeQuestionId).not.toBe(first);
    const filter=bank.filter(q=>q.categoryId===1&&q.difficulty===1);
    s={...s,phase:'awaiting_question',usedQuestionIds:filter.map(q=>q.id)};
    s=act(s,{type:'draw',random:0,now:0});expect(filter.some(q=>q.id===s.activeQuestionId)).toBe(true);
  });
  it('empty filter reports unavailability rather than changing category',()=>{
    const s={...questionAt(0,2),phase:'awaiting_question' as const};
    expect(()=>transition(s,{revision:s.revision,type:'draw',random:0,now:0},board,[])).toThrow('No compatible');
  });
  it('rejects stale double clicks and actions outside phase',()=>{
    const s=fresh();const action={revision:0,type:'roll' as const,value:2};const moved=transition(s,action,board,bank);
    expect(transition(moved,action,board,bank)).toBe(moved);expect(act(moved,{type:'roll',value:3})).toBe(moved);
    const end=act(answer(questionAt(0,2),true),{type:'continue'});const next={revision:end.revision,type:'next_player' as const};
    const n=transition(end,next,board,bank);expect(transition(n,next,board,bank)).toBe(n);expect(act(n,{type:'next_player'})).toBe(n);
  });
  it.each([2,10])('simulates a complete game with %i players',count=>{
    let s=fresh(count);let turns=0;
    while(s.phase!=='finished' && turns++<1000){
      s=act(s,{type:'roll',value:6});if(s.phase==='level_choice')s=act(s,{type:'choose_level',value:3});
      s=act(s,{type:'draw',random:0,now:0});s=act(answer(s,true),{type:'continue'});
      if(s.phase==='turn_end')s=act(s,{type:'next_player'});
    }
    expect(s.phase).toBe('finished');expect(s.winnerId).not.toBeNull();
  });
});
