export type Phase = "waiting" | "playing" | "ended";

export interface ChatMessage {
  from: string;
  text?: string;
  emoji?: string;
  ts: number;
}

export interface ClientGameState {
  players: string[];
  currentTurn: string;
  pressedTeeth: number[];
  phase: Phase;
  loser: string | null;
  chat: ChatMessage[];
  playAgainVotes: number;
  paused: boolean;
}

export type ClientMessage =
  | { type: "press"; toothIndex: number }
  | { type: "chat"; text: string }
  | { type: "emoji"; emoji: string }
  | { type: "playAgain" };

export type ServerMessage =
  | { type: "joined"; yourId: string }
  | { type: "state"; state: ClientGameState }
  | { type: "snap"; loser: string }
  | { type: "partnerLeft" }
  | { type: "partnerRejoined" }
  | { type: "roomFull" };
