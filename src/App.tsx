import {useEffect,useRef,useState} from 'react';
import rawBoard from '../data/board.json';
import rawBank from '../data/questions.json';
import destinations from '../data/regions.json';
import {createGame,transition,type Game,type Action,type Language,type Question} from './game/engine';
import {loadGame,saveGame,checkTicket,startTicketGame} from './storage/save';
import {TicketError,type Ticket} from './access/codes';
import {accessMessages} from './access/messages';
import barConfig from '../data/bar-access.json';
import {ui} from './i18n/ui';
import Board from './components/Board';
import OfflineStatus from './components/OfflineStatus';

const bank=rawBank.questions as Question[];
const colors=['#702632','#086e51','#155a86','#9a550e','#653ca0','#9c3c16','#245f66','#6c562c','#484848','#973963'];
type Payload = Action extends infer A ? A extends Action ? Omit<A,'revision'> : never : never;


export default function App(){
  const [game,setGame]=useState<Game|null>(null), current=useRef<Game|null>(null);
  const [screen,setScreen]=useState<'home'|'access'|'setup'|'game'>('home');
  const [language,setLanguage]=useState<Language>('fr');
  const [names,setNames]=useState(['','']);
  const [ticketCode,setTicketCode]=useState(''),[ticket,setTicket]=useState<Ticket|null>(null);
  const [busy,setBusy]=useState(false);const starting=useRef(false);
  const [ticketError,setTicketError]=useState('');
  const [loaded,setLoaded]=useState(false),[saved,setSaved]=useState(false),[storageError,setStorageError]=useState(false);
  const [dialog,setDialog]=useState<'rules'|'settings'|'replace'|'delete'|null>(null);
  const [error,setError]=useState(''),[choices,setChoices]=useState<string[]>([]),[now,setNow]=useState(Date.now());
  const [sound,setSound]=useState(false),[timerSound,setTimerSound]=useState(false);
  const audio=useRef<AudioContext|null>(null);
  const modal=useRef<HTMLElement|null>(null);
  const t=ui[language],a=accessMessages[language];
  const regions=['',...destinations.map(r=>r[language])];
  function beep(frequency=480){
    try{const ctx=audio.current??(audio.current=new AudioContext());void ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.06);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+.07);}catch{/* Audio is optional. */}
  }
  function commit(next:Game|null){
    if(next===current.current)return;
    current.current=next;setGame(next);setSaved(false);
    void saveGame(next).then(()=>{if(current.current===next){setSaved(true);setStorageError(false);}}).catch(()=>setStorageError(true));
  }
  function dispatch(payload:Payload){
    const before=current.current;if(!before)return;
    try{const next=transition(before,{...payload,revision:before.revision} as Action,rawBoard,bank);commit(next);setError('');}catch{setError(t.questionError);}
  }
  useEffect(()=>{
    let alive=true;
    try{const prefs=JSON.parse(localStorage.getItem('beerodyssait.preferences')??'{}');if(prefs.language==='en')setLanguage('en');setSound(prefs.sound===true);setTimerSound(prefs.timerSound===true);}catch{/* Default settings. */}
    void loadGame().then(value=>{if(alive){current.current=value;setGame(value);setSaved(Boolean(value));}}).catch(()=>{if(alive)setStorageError(true);}).finally(()=>{if(alive)setLoaded(true);});
    return()=>{alive=false;};
  },[]);
  useEffect(()=>{document.documentElement.lang=language;if(loaded)try{localStorage.setItem('beerodyssait.preferences',JSON.stringify({language,sound,timerSound}));}catch{/* Game storage errors are reported separately. */}},[language,sound,timerSound,loaded]);
  useEffect(()=>{setChoices([]);},[game?.activeQuestionId,game?.phase]);
  useEffect(()=>{
    if(!dialog)return;
    const previous=document.activeElement as HTMLElement|null;
    modal.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const trap=(e:KeyboardEvent)=>{
      if(e.key==='Escape'){if(!starting.current)setDialog(null);return;}
      if(e.key!=='Tab')return;
      const controls=[...modal.current!.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]')].filter(el=>!el.hasAttribute('disabled'));
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',trap);
    return()=>{document.removeEventListener('keydown',trap);previous?.focus();};
  },[dialog]);
  useEffect(()=>{
    if(screen!=='game'||game?.phase!=='question')return;
    const tick=()=>{setNow(Date.now());dispatch({type:'tick',now:Date.now()});};
    tick();const timer=setInterval(tick,250);document.addEventListener('visibilitychange',tick);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
  },[screen,game?.phase,game?.activeQuestionId]);
  const remaining=game?.deadline===null||!game?0:Math.max(0,Math.ceil((game.deadline-now)/1000));
  useEffect(()=>{if(timerSound&&screen==='game'&&game?.phase==='question'&&remaining>0&&remaining<=10)beep(700);},[remaining,timerSound,screen,game?.phase]);
  function showAccess(){setTicket(null);setTicketCode('');setTicketError('');setError('');setScreen('access');}
  function newGame(){if(game&&game.phase!=='finished'){setDialog('replace');}else showAccess();}
  function accessError(error:unknown){return a[error instanceof TicketError?error.reason:'storage'];}
  async function acceptTicket(){
    if(starting.current)return;starting.current=true;setBusy(true);setTicketError('');
    try{const value=await checkTicket(ticketCode);setTicket(value);setNames(['','']);setScreen('setup');}
    catch(error){setTicketError(accessError(error));}
    finally{starting.current=false;setBusy(false);}
  }
  async function begin(){
    if(starting.current)return;
    if(!ticket){showAccess();return;}
    if(names.some(n=>!n.trim())){setError(t.namesError);return;}
    starting.current=true;setBusy(true);setError('');setTicketError('');
    try{
      const next=createGame(names.map((name,i)=>({id:`p${i}`,name:name.trim(),tokenId:String(i+1),color:colors[i]})),language,rawBoard);
      await startTicketGame(next,ticket.code);
      current.current=next;setGame(next);setSaved(true);setStorageError(false);setScreen('game');setTicket(null);
    }catch(error){setTicketError(accessError(error));}
    finally{starting.current=false;setBusy(false);}
  }
  async function deleteSavedGame(){
    if(starting.current)return;starting.current=true;setBusy(true);
    try{await saveGame(null);current.current=null;setGame(null);setSaved(false);setStorageError(false);setDialog(null);setScreen('home');setError('');setTicketError('');}
    catch{setStorageError(true);}
    finally{starting.current=false;setBusy(false);}
  }
  function resume(){if(!game)return;setLanguage(game.language);setScreen('game');dispatch({type:'tick',now:Date.now()});}
  const active=game?.players[game.currentPlayerIndex];
  const question=bank.find(q=>q.id===game?.activeQuestionId);
  const questionText=question?.translations[game?.language??language];
  const landed=rawBoard.spaces.find(s=>s.id===active?.position);
  const questionTitle=landed?.categoryId===5?regions[landed.regionId!]:t.categories[landed?.categoryId??0];
  const interactive=(action:()=>void)=>()=>{if(sound)beep();action();};

  return <div className="app-shell">
    <header className="site-header"><button className="wordmark" disabled={busy} onClick={()=>{setScreen('home');setTicketError('');}}><img src={`${import.meta.env.BASE_URL}assets/logo.svg`} alt="Beerodys’Sait"/></button><nav aria-label="Menu"><button onClick={()=>setDialog('rules')}>{t.rules}</button><button disabled={busy} onClick={()=>setDialog('settings')}>{t.settings}</button><select aria-label="Langue / Language" value={language} disabled={screen==='game'||busy} onChange={e=>setLanguage(e.target.value as Language)}><option value="fr">FR</option><option value="en">EN</option></select></nav></header>
    {storageError&&<div role="alert" className="notice error">{t.storageError}</div>}
    {ticketError&&<div role="alert" className="notice error">{ticketError}</div>}
    {error&&<div role="alert" className="notice error">{error}</div>}
    {!loaded?<main className="hero"><p>{t.loading}</p></main>:screen==='home'?<main className="hero">
      <div className="hero-copy"><span className="eyebrow">{language==='fr'?'LE GRAND VOYAGE BRASSICOLE':'THE GREAT BEER JOURNEY'}</span>
      <h1>{language==='fr'?<>Un dé. Des amis.<br/><em>Tout un monde<br/>à découvrir.</em></>:<>One die. Good friends.<br/><em>A whole world<br/>to discover.</em></>}</h1>
      <p>{language==='fr'?'Des traditions belges aux saveurs nordiques, embarquez pour une odyssée de questions autour de la bière.':'From Belgian traditions to Nordic flavours, set off on a question-filled journey through the world of beer.'}</p>
      <div className="hero-actions"><button className="primary" onClick={newGame}>{t.newGame} <span>↗</span></button>{game&&<button className="secondary" onClick={resume}>{t.resume}</button>}</div>
      <p className="access-purchase">{a.purchase}</p>
      <div className="hero-facts"><span>{language==='fr'?'2–10 joueurs':'2–10 players'}</span><span>{bank.length} questions · FR / EN</span><span>{language==='fr'?'Sur un appareil partagé':'On one shared device'}</span></div>
      {saved&&game&&<p className="save-note">{t.saved}</p>}</div>
      <div className="journey-preview"><div className="passport-heading"><span>BEERODYS’SAIT</span><span>01 — 10</span></div><img src={`${import.meta.env.BASE_URL}assets/plateau-${language}.svg`} alt={language==='fr'?'Aperçu du parcours international':'International journey preview'}/><div className="passport-footer"><span>{language==='fr'?'LE PASSEPORT DE VOTRE PROCHAINE SOIRÉE':'YOUR NEXT GAME NIGHT PASSPORT'}</span><span>↗</span></div></div>

    </main>:screen==='access'?<main className="setup card access-card"><span className="eyebrow">BEERODYS’SAIT · {language==='fr'?'AU COMPTOIR':'AT THE COUNTER'}</span><h1>{a.title}</h1><p>{a.intro}</p><form onSubmit={e=>{e.preventDefault();void acceptTicket();}}><label className="ticket-label" htmlFor="ticket-code">{a.label}</label><input id="ticket-code" className="ticket-input" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="B1-BEER-XXXX-XXXX-XXXX-XXXX" maxLength={60} required disabled={busy} value={ticketCode} onChange={e=>{setTicketCode(e.target.value);setTicketError('');}}/><p className="fine">{a.hint}</p><div className="setup-actions"><button type="button" disabled={busy} onClick={()=>{setScreen('home');setTicketError('');}}>{a.back}</button><button className="primary" type="submit" disabled={busy}>{busy?a.busy:a.check} →</button></div></form><p className="fine access-resume">{a.resume}</p></main>:screen==='setup'?<main className="setup card"><span className="eyebrow">BEERODYS’SAIT</span><h1>{t.players}</h1>{ticket&&<p className="ticket-accepted">✓ {a.ready} · {barConfig.bars.find(b=>b.id===ticket.barId)?.name}<br/><small>{a.until} {ticket.expiresOn} (UTC)</small></p>}<p>{t.setupHint}</p><form onSubmit={e=>{e.preventDefault();begin();}}><fieldset className="setup-fields" disabled={busy}><ol className="setup-list">{names.map((name,i)=><li key={i}><span className="token" style={{background:colors[i]}}>{i+1}</span><label>{t.player} {i+1}<input autoComplete="off" maxLength={32} required value={name} onChange={e=>setNames(ns=>ns.map((n,j)=>j===i?e.target.value:n))}/></label>{names.length>2&&<button type="button" aria-label={`${t.remove} ${i+1}`} onClick={()=>setNames(ns=>ns.filter((_,j)=>j!==i))}>×</button>}</li>)}</ol>{names.length<10&&<button type="button" className="secondary" onClick={()=>setNames(ns=>[...ns,''])}>+ {t.add}</button>}<div className="setup-actions"><button type="button" onClick={()=>{setScreen('home');setTicketError('');}}>{t.cancel}</button><button className="primary" type="submit">{busy?a.starting:t.start} →</button></div></fieldset></form></main>:game&&active?<main className="game-layout">
      <div className="board-column"><Board players={game.players} active={active.id} label={t.board} reset={t.resetZoom} language={language}/><ul className="player-strip">{game.players.map((p,i)=><li key={p.id} className={p.id===active.id?'selected':''}><span className="token" style={{background:p.color}}>{i+1}</span><span>{p.name}<small>{p.position===0?t.departure:(rawBoard.spaces.find(s=>s.id===p.position)?.categoryId===5?regions[rawBoard.spaces.find(s=>s.id===p.position)!.regionId!]:t.categories[rawBoard.spaces.find(s=>s.id===p.position)?.categoryId??0])}</small></span></li>)}</ul></div>
      <section className="turn-card card" aria-live="polite"><div className="active-player"><span className="token big" style={{background:active.color}}>{game.currentPlayerIndex+1}</span><div><span className="eyebrow">{t.turn}</span><h1>{active.name}</h1></div>{game.diceRoll!==null&&<div className="dice" aria-label={`${game.diceRoll}`}>{['','⚀','⚁','⚂','⚃','⚄','⚅'][game.diceRoll]}</div>}</div>
        <div className="turn-context"><strong>{active.position===0?t.departure:questionTitle}</strong><span>{language==='fr'?'Étape':'Space'} {active.position} / 60</span></div>
        {game.phase==='ready'&&<button className="primary full" onClick={interactive(()=>dispatch({type:'roll',value:Math.floor(Math.random()*6)+1}))}>{t.roll} 🎲</button>}
        {game.phase==='level_choice'&&<><h2>{t.level}</h2><div className="levels">{([1,2,3] as const).map((d,i)=><button key={d} className={`level level-${d}`} onClick={interactive(()=>dispatch({type:'choose_level',value:d}))}><span>0{d}</span>{t.levels[i]}</button>)}</div></>}
        {game.phase==='awaiting_question'&&<button className="primary full" onClick={interactive(()=>{setNow(Date.now());dispatch({type:'draw',random:Math.random(),now:Date.now()});})}>{t.draw} →</button>}
        {game.phase==='question'&&question&&questionText&&<><div className={`timer ${remaining<=10?'urgent':''}`} role="timer" aria-label={t.time}><span>{t.time}</span><strong>{remaining}s</strong><progress max={60} value={remaining}/></div><h2 className="question-text" data-question-id={question.id}>{questionText.question}</h2>{question.type==='open'?<><p>{t.oral}</p><button className="primary full" onClick={interactive(()=>dispatch({type:'reveal',now:Date.now()}))}>{t.reveal}</button></>:<><p className="fine">{question.correctChoiceIds.length>1?t.multiple:t.single}</p><fieldset className="choices"><legend className="sr-only">{t.submit}</legend>{(question.type==='true_false'?[{id:'true',text:t.true},{id:'false',text:t.false}]:questionText.choices).map(c=><label key={c.id} className={choices.includes(c.id)?'checked':''}><input type={question.correctChoiceIds.length>1?'checkbox':'radio'} name="answer" checked={choices.includes(c.id)} onChange={()=>setChoices(old=>question.correctChoiceIds.length>1?(old.includes(c.id)?old.filter(id=>id!==c.id):[...old,c.id]):[c.id])}/><span>{c.text}</span></label>)}</fieldset><button className="primary full" disabled={!choices.length} onClick={interactive(()=>dispatch({type:'submit',choices,now:Date.now()}))}>{t.submit}</button></>}</>}
        {(game.phase==='oral_judgement'||game.phase==='correction')&&questionText&&<><span className={`result ${game.answerStatus==='incorrect'?'incorrect':''}`}>{game.phase==='oral_judgement'?t.answer:game.answerStatus==='correct'?t.correct:t.incorrect}</span><h2>{t.answer}</h2><p className="answer-text">{questionText.expectedAnswer}</p>{game.phase==='oral_judgement'?<div className="judge"><button className="primary" onClick={interactive(()=>dispatch({type:'judge',correct:true}))}>{t.correct}</button><button className="secondary" onClick={interactive(()=>dispatch({type:'judge',correct:false}))}>{t.incorrect}</button></div>:<><p className="consequence">{game.answerStatus==='incorrect'?t.returnTo:game.pendingPosition!==active.position?t.conveyor:t.stay}</p><button className="primary full" onClick={interactive(()=>dispatch({type:'continue'}))}>{t.continue} →</button></>}</>}
        {game.phase==='turn_end'&&<><h2>{t.finishedTurn}</h2><button className="primary full" onClick={interactive(()=>dispatch({type:'next_player'}))}>{t.next} →</button></>}
        {game.phase==='finished'&&<div className="victory"><span aria-hidden="true">♛</span><h2>{t.won}</h2><p>{active.name}</p><button className="primary full" onClick={newGame}>{t.replay}</button></div>}
        {saved&&<p className="save-note">{t.saved}</p>}
      </section>
    </main>:null}
    <OfflineStatus language={language}/><footer>Beerodys’Sait <span>·</span> {language==='fr'?'Le jeu culturel autour de la bière':'A cultural game about beer'}</footer>
    {dialog&&<div className="modal-backdrop" onClick={()=>{if(!starting.current)setDialog(null);}}><section ref={modal} role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="modal card" onClick={e=>e.stopPropagation()}><button className="modal-close" disabled={busy} aria-label={t.close} onClick={()=>setDialog(null)}>×</button><h2 id="dialog-title">{dialog==='rules'?t.rules:dialog==='settings'?t.settings:dialog==='delete'?t.clear:t.replace}</h2>{dialog==='rules'?t.rulesText.map((p,i)=><p key={i}>{p}</p>):dialog==='settings'?<><label className="setting"><span>{t.sound}</span><input type="checkbox" checked={sound} onChange={e=>{setSound(e.target.checked);if(e.target.checked)beep();}}/></label><label className="setting"><span>{t.timerSound}</span><input type="checkbox" checked={timerSound} onChange={e=>setTimerSound(e.target.checked)}/></label>{(game||storageError)&&<button className="secondary" onClick={()=>setDialog('delete')}>{t.clear}</button>}</>:<div className="judge"><button disabled={busy} onClick={()=>setDialog(null)}>{t.cancel}</button><button className="primary" disabled={busy} onClick={()=>{setError('');if(dialog==='replace'){setDialog(null);showAccess();}else void deleteSavedGame();}}>{dialog==='delete'?t.clear:t.confirm}</button></div>}</section></div>}
  </div>;
}
