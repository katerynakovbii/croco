import type * as Party from "partykit/server";
import {
  createInitialState,
  addPlayer,
  handlePress,
  handlePlayAgain,
  addChatMessage,
  toClientState,
  type RoomState,
} from "./game-logic";
import type { ClientMessage, ServerMessage } from "../src/types/game";

export default class GameRoom implements Party.Server {
  private state: RoomState = createInitialState();
  private disconnectedPlayerId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    const joinedMsg: ServerMessage = { type: "joined", yourId: conn.id };
    conn.send(JSON.stringify(joinedMsg));

    if (this.disconnectedPlayerId !== null) {
      const oldId = this.disconnectedPlayerId;
      this.disconnectedPlayerId = null;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.state = {
        ...this.state,
        players: this.state.players.map((p) => (p === oldId ? conn.id : p)),
        currentTurn: this.state.currentTurn === oldId ? conn.id : this.state.currentTurn,
        loser: this.state.loser === oldId ? conn.id : this.state.loser,
        playAgainVotes: this.state.playAgainVotes.map((p) => (p === oldId ? conn.id : p)),
        paused: false,
      };
      this.broadcast({ type: "partnerRejoined" });
      this.broadcastState();
      return;
    }

    const result = addPlayer(this.state, conn.id);
    if (result === "full") {
      const fullMsg: ServerMessage = { type: "roomFull" };
      conn.send(JSON.stringify(fullMsg));
      conn.close();
      return;
    }

    this.state = result;
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case "press": {
        const result = handlePress(this.state, sender.id, msg.toothIndex);
        if (typeof result === "string") return;
        const wasPlaying = this.state.phase === "playing";
        this.state = result;
        if (wasPlaying && this.state.phase === "ended") {
          this.broadcast({ type: "snap", loser: this.state.loser! });
        }
        this.broadcastState();
        break;
      }
      case "chat": {
        this.state = addChatMessage(this.state, sender.id, Date.now(), msg.text, undefined);
        this.broadcastState();
        break;
      }
      case "emoji": {
        this.state = addChatMessage(this.state, sender.id, Date.now(), undefined, msg.emoji);
        this.broadcastState();
        break;
      }
      case "playAgain": {
        this.state = handlePlayAgain(this.state, sender.id);
        this.broadcastState();
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (!this.state.players.includes(conn.id)) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.disconnectedPlayerId = conn.id;
    this.state = { ...this.state, paused: true };
    this.broadcast({ type: "partnerLeft" });

    this.reconnectTimer = setTimeout(() => {
      this.state = createInitialState();
      this.disconnectedPlayerId = null;
      this.reconnectTimer = null;
      this.broadcastState();
    }, 60_000);
  }

  private broadcastState() {
    const msg: ServerMessage = { type: "state", state: toClientState(this.state) };
    this.room.broadcast(JSON.stringify(msg));
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }
}
