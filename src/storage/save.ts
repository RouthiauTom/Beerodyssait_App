import type {Game} from '../game/engine';
import bank from '../../data/questions.json';

const phases = ['ready','level_choice','awaiting_question','question','oral_judgement','correction','turn_end','finished'];
export function validSave(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false;
  const s = value as Game;
  const ids = new Set(bank.questions.map(q => q.id));
  const validPosition = (p: unknown) => Number.isInteger(p) && typeof p === 'number' && p >= 0 && p <= 60;
  return s.schemaVersion === 1 && Number.isInteger(s.revision) && s.revision >= 0 &&
    (s.language === 'fr' || s.language === 'en') && phases.includes(s.phase) &&
    Array.isArray(s.players) && s.players.length >= 2 && s.players.length <= 10 &&
    s.players.every(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim().length > 0 && typeof p.color === 'string' && typeof p.tokenId === 'string' && validPosition(p.position)) &&
    new Set(s.players.map(p => p.id)).size === s.players.length && Number.isInteger(s.currentPlayerIndex) && s.currentPlayerIndex >= 0 && s.currentPlayerIndex < s.players.length &&
    Array.isArray(s.usedQuestionIds) && s.usedQuestionIds.every(id => ids.has(id)) &&
    (s.positionBeforeRoll === null || validPosition(s.positionBeforeRoll)) &&
    (s.activeQuestionId === null || ids.has(s.activeQuestionId)) &&
    (s.difficulty === null || [1,2,3].includes(s.difficulty)) &&
    (s.answerStatus === null || s.answerStatus === 'correct' || s.answerStatus === 'incorrect') &&
    (s.deadline === null || Number.isFinite(s.deadline)) &&
    (s.phase !== 'question' || (typeof s.activeQuestionId === 'number' && s.deadline !== null)) &&
    (!['oral_judgement','correction'].includes(s.phase) || (s.activeQuestionId !== null && s.positionBeforeRoll !== null)) &&
    (s.phase !== 'correction' || (validPosition(s.pendingPosition) && s.answerStatus !== null)) &&
    (s.phase !== 'finished' || s.players.some(p => p.id === s.winnerId && p.position === 60));
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open('beerodyssait',1);
    request.onupgradeneeded = () => request.result.createObjectStore('local');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Storage blocked'));
  });
}
async function transaction(mode: IDBTransactionMode, value?: Game | null): Promise<unknown> {
  const db = await open();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('local',mode), store = tx.objectStore('local');
    const req = mode === 'readonly' ? store.get('game') : value === null ? store.delete('game') : store.put(value,'game');
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
export async function loadGame(): Promise<Game | null> {
  const value = await transaction('readonly');
  if (value === undefined) return null;
  if (!validSave(value)) throw new Error('Invalid saved game');
  return value;
}
let queue: Promise<unknown> = Promise.resolve();
export function saveGame(game: Game | null): Promise<unknown> {
  queue = queue.catch(() => undefined).then(() => transaction('readwrite',game));
  return queue;
}
