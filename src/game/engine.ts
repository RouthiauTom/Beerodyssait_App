export type Language = 'fr' | 'en';
export type Difficulty = 1 | 2 | 3;
export interface Question {
  sources: string[];
  id: number; categoryId: number; regionId: number | null; difficulty: Difficulty | null;
  type: 'qcm' | 'true_false' | 'open'; correctChoiceIds: string[];
  translations: Record<Language, { question: string; expectedAnswer: string; choices: {id: string; text: string}[] }>;
}
export interface Board {
  startSpaceId: number; finishSpaceId: number;
  spaces: {id: number; categoryId: number; regionId: number | null}[];
  effects: {id: string; type: string; fromSpaceId: number; toSpaceId: number}[];
}
export interface Player { id: string; name: string; tokenId: string; color: string; position: number }
export interface Game {
  schemaVersion: 1; revision: number; language: Language; players: Player[]; currentPlayerIndex: number;
  phase: 'ready' | 'level_choice' | 'awaiting_question' | 'question' | 'oral_judgement' | 'correction' | 'turn_end' | 'finished';
  positionBeforeRoll: number | null; diceRoll: number | null; difficulty: Difficulty | null;
  activeQuestionId: number | null; deadline: number | null; usedQuestionIds: number[];
  answerStatus: 'correct' | 'incorrect' | null; pendingPosition: number | null; winnerId: string | null;
}
export type Action = {revision: number} & (
  {type: 'roll'; value: number} | {type: 'choose_level'; value: Difficulty} |
  {type: 'draw'; random: number; now: number} | {type: 'submit'; choices: string[]; now: number} |
  {type: 'reveal'; now: number} | {type: 'judge'; correct: boolean} |
  {type: 'tick'; now: number} | {type: 'continue'} | {type: 'next_player'}
);

export function createGame(players: Omit<Player, 'position'>[], language: Language, board: Board): Game {
  if (players.length < 2 || players.length > 10 || new Set(players.map(p => p.id)).size !== players.length || players.some(p => !p.name.trim() || !p.id)) throw new Error('Invalid players');
  if (language !== 'fr' && language !== 'en') throw new Error('Invalid language');
  return {schemaVersion: 1, revision: 0, language, players: players.map(p => ({...p, position: board.startSpaceId})), currentPlayerIndex: 0, phase: 'ready', positionBeforeRoll: null, diceRoll: null, difficulty: null, activeQuestionId: null, deadline: null, usedQuestionIds: [], answerStatus: null, pendingPosition: null, winnerId: null};
}

export function correctChoices(selected: string[], expected: string[]): boolean {
  return new Set(selected).size === selected.length && selected.length === expected.length && expected.every(id => selected.includes(id));
}

export function transition(state: Game, action: Action, board: Board, bank: Question[]): Game {
  // A stale action includes a second click sent before the UI has rendered the new revision.
  if (action.revision !== state.revision) return state;
  const player = state.players[state.currentPlayerIndex];
  const space = () => {
    const found = board.spaces.find(s => s.id === player.position);
    if (!found) throw new Error('Unknown board space');
    return found;
  };
  const activeQuestion = () => {
    const question = bank.find(q => q.id === state.activeQuestionId);
    if (!question) throw new Error('Question content unavailable');
    return question;
  };
  const moved = (position: number) => state.players.map((p,i) => i === state.currentPlayerIndex ? {...p, position} : p);
  const update = (changes: Partial<Game>): Game => ({...state, ...changes, revision: state.revision + 1});
  const result = (correct: boolean): Game => {
    const conveyor = board.effects.find(e => e.type === 'conveyor' && e.fromSpaceId === player.position);
    const target = !correct ? state.positionBeforeRoll : conveyor && state.difficulty !== 3 ? conveyor.toSpaceId : player.position;
    if (target === null) throw new Error('Missing position before roll');
    return update({phase: 'correction', deadline: null, answerStatus: correct ? 'correct' : 'incorrect', pendingPosition: target});
  };
  const expired = (now: number) => {
    if (!Number.isFinite(now)) throw new Error('Invalid time');
    return state.deadline !== null && now >= state.deadline;
  };
  switch (action.type) {
    case 'roll': {
      if (state.phase !== 'ready') return state;
      if (!Number.isInteger(action.value) || action.value < 1 || action.value > 6) throw new Error('Invalid dice');
      let destination = Math.min(player.position + action.value, board.finishSpaceId);
      const ladder = board.effects.find(e => e.type === 'ladder' && e.fromSpaceId === destination);
      if (ladder) destination = ladder.toSpaceId;
      const arrived = board.spaces.find(s => s.id === destination);
      if (!arrived) throw new Error('Unknown destination');
      // No effect endpoint in the validated board leads to another effect start.
      return update({players: moved(destination), positionBeforeRoll: player.position, diceRoll: action.value, difficulty: null, activeQuestionId: null, answerStatus: null, pendingPosition: null, phase: arrived.categoryId === 5 ? 'awaiting_question' : 'level_choice'});
    }
    case 'choose_level':
      if (state.phase !== 'level_choice') return state;
      if (![1,2,3].includes(action.value)) throw new Error('Invalid difficulty');
      return update({difficulty: action.value, phase: 'awaiting_question'});
    case 'draw': {
      if (state.phase !== 'awaiting_question') return state;
      if (!Number.isFinite(action.random) || action.random < 0 || action.random >= 1 || !Number.isFinite(action.now)) throw new Error('Invalid draw inputs');
      const landed = space();
      const candidates = bank.filter(q => q.categoryId === landed.categoryId && (landed.categoryId === 5 ? q.regionId === landed.regionId && q.difficulty === null : q.difficulty === state.difficulty) && q.translations[state.language]);
      if (!candidates.length) throw new Error('No compatible question: filter unchanged');
      const unused = candidates.filter(q => !state.usedQuestionIds.includes(q.id));
      const pool = unused.length ? unused : candidates;
      const question = pool[Math.floor(action.random * pool.length)];
      return update({phase: 'question', activeQuestionId: question.id, deadline: action.now + 60_000, usedQuestionIds: state.usedQuestionIds.includes(question.id) ? state.usedQuestionIds : [...state.usedQuestionIds, question.id]});
    }
    case 'submit': {
      if (state.phase !== 'question') return state;
      if (expired(action.now)) return result(false);
      const question = activeQuestion();
      if (question.type === 'open') return state;
      return result(correctChoices(action.choices, question.correctChoiceIds));
    }
    case 'reveal':
      if (state.phase !== 'question') return state;
      if (expired(action.now)) return result(false);
      if (activeQuestion().type !== 'open') return state;
      return update({phase: 'oral_judgement', deadline: null});
    case 'judge':
      if (state.phase !== 'oral_judgement') return state;
      return result(action.correct);
    case 'tick':
      if (state.phase !== 'question') return state;
      return expired(action.now) ? result(false) : state;
    case 'continue': {
      if (state.phase !== 'correction') return state;
      if (state.pendingPosition === null) throw new Error('Missing correction consequence');
      const won = state.answerStatus === 'correct' && state.pendingPosition === board.finishSpaceId;
      return update({players: moved(state.pendingPosition), phase: won ? 'finished' : 'turn_end', winnerId: won ? player.id : null, pendingPosition: null});
    }
    case 'next_player':
      if (state.phase !== 'turn_end') return state;
      return update({phase: 'ready', currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length, diceRoll: null, positionBeforeRoll: null, activeQuestionId: null, deadline: null, difficulty: null, answerStatus: null});
  }
}
