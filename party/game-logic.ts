import type { ChatMessage, ClientGameState, Phase } from "../src/types/game";

export interface RoomState {
  players: string[];
  currentTurn: string;
  triggerTooth: number;
  pressedTeeth: number[];
  phase: Phase;
  loser: string | null;
  chat: ChatMessage[];
  playAgainVotes: string[];
  paused: boolean;
}

export function createInitialState(): RoomState {
  return {
    players: [],
    currentTurn: "",
    triggerTooth: -1,
    pressedTeeth: [],
    phase: "waiting",
    loser: null,
    chat: [],
    playAgainVotes: [],
    paused: false,
  };
}

export function addPlayer(state: RoomState, playerId: string): RoomState | "full" {
  if (state.players.length >= 2) return "full";
  const players = [...state.players, playerId];
  if (players.length === 2) {
    return {
      ...state,
      players,
      phase: "playing",
      currentTurn: players[0],
      triggerTooth: Math.floor(Math.random() * 12),
      paused: false,
    };
  }
  return { ...state, players };
}

export function handlePress(
  state: RoomState,
  playerId: string,
  toothIndex: number
): RoomState | "wrong-turn" | "already-pressed" {
  if (state.phase !== "playing" || state.paused) return state;
  if (state.currentTurn !== playerId) return "wrong-turn";
  if (state.pressedTeeth.includes(toothIndex)) return "already-pressed";

  if (toothIndex === state.triggerTooth) {
    return { ...state, phase: "ended", loser: playerId };
  }

  const nextPlayer = state.players.find((p) => p !== playerId)!;
  return {
    ...state,
    pressedTeeth: [...state.pressedTeeth, toothIndex],
    currentTurn: nextPlayer,
  };
}

export function handlePlayAgain(state: RoomState, playerId: string): RoomState {
  if (state.phase !== "ended") return state;
  const votes = state.playAgainVotes.includes(playerId)
    ? state.playAgainVotes
    : [...state.playAgainVotes, playerId];

  if (votes.length >= 2) {
    return {
      ...state,
      phase: "playing",
      currentTurn: state.loser!,
      triggerTooth: Math.floor(Math.random() * 12),
      pressedTeeth: [],
      loser: null,
      playAgainVotes: [],
      paused: false,
    };
  }

  return { ...state, playAgainVotes: votes };
}

export function addChatMessage(
  state: RoomState,
  from: string,
  ts: number,
  text?: string,
  emoji?: string
): RoomState {
  const message: ChatMessage = { from, ts, text, emoji };
  return { ...state, chat: [...state.chat.slice(-99), message] };
}

export function toClientState(state: RoomState): ClientGameState {
  return {
    players: state.players,
    currentTurn: state.currentTurn,
    pressedTeeth: state.pressedTeeth,
    phase: state.phase,
    loser: state.loser,
    chat: state.chat,
    playAgainVotes: state.playAgainVotes.length,
    paused: state.paused,
  };
}
