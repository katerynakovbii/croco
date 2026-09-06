import { describe, it, expect } from "vitest";
import {
  createInitialState,
  addPlayer,
  handlePress,
  handlePlayAgain,
  addChatMessage,
  toClientState,
  type RoomState,
} from "./game-logic";

function twoPlayerPlaying(triggerTooth: number): RoomState {
  return {
    players: ["p1", "p2"],
    currentTurn: "p1",
    triggerTooth,
    pressedTeeth: [],
    phase: "playing",
    loser: null,
    chat: [],
    playAgainVotes: [],
    paused: false,
  };
}

describe("addPlayer", () => {
  it("adds first player and stays in waiting", () => {
    const state = createInitialState();
    const result = addPlayer(state, "p1");
    expect(result).not.toBe("full");
    if (result === "full") return;
    expect(result.players).toEqual(["p1"]);
    expect(result.phase).toBe("waiting");
  });

  it("starts game when second player joins", () => {
    let state = createInitialState();
    state = addPlayer(state, "p1") as RoomState;
    const result = addPlayer(state, "p2");
    expect(result).not.toBe("full");
    if (result === "full") return;
    expect(result.phase).toBe("playing");
    expect(result.currentTurn).toBe("p1");
    expect(result.triggerTooth).toBeGreaterThanOrEqual(0);
    expect(result.triggerTooth).toBeLessThan(12);
  });

  it("returns 'full' when third player tries to join", () => {
    let state = createInitialState();
    state = addPlayer(state, "p1") as RoomState;
    state = addPlayer(state, "p2") as RoomState;
    expect(addPlayer(state, "p3")).toBe("full");
  });
});

describe("handlePress", () => {
  it("returns 'wrong-turn' when it is not the player's turn", () => {
    expect(handlePress(twoPlayerPlaying(5), "p2", 0)).toBe("wrong-turn");
  });

  it("returns 'already-pressed' for a tooth already pressed", () => {
    const state = { ...twoPlayerPlaying(5), pressedTeeth: [3] };
    expect(handlePress(state, "p1", 3)).toBe("already-pressed");
  });

  it("returns state unchanged when game is paused", () => {
    const state = { ...twoPlayerPlaying(5), paused: true };
    expect(handlePress(state, "p1", 0)).toEqual(state);
  });

  it("alternates turn on safe tooth press", () => {
    const result = handlePress(twoPlayerPlaying(5), "p1", 0);
    if (typeof result === "string") throw new Error("unexpected");
    expect(result.pressedTeeth).toContain(0);
    expect(result.currentTurn).toBe("p2");
    expect(result.phase).toBe("playing");
  });

  it("ends game when trigger tooth is pressed", () => {
    const result = handlePress(twoPlayerPlaying(5), "p1", 5);
    if (typeof result === "string") throw new Error("unexpected");
    expect(result.phase).toBe("ended");
    expect(result.loser).toBe("p1");
  });
});

describe("handlePlayAgain", () => {
  function endedState(): RoomState {
    return {
      ...twoPlayerPlaying(5),
      phase: "ended",
      loser: "p1",
      pressedTeeth: [0, 1, 2],
    };
  }

  it("records single vote without resetting the game", () => {
    const result = handlePlayAgain(endedState(), "p1");
    expect(result.phase).toBe("ended");
    expect(result.playAgainVotes).toContain("p1");
  });

  it("resets game when both players vote; loser goes first", () => {
    let state = handlePlayAgain(endedState(), "p1");
    state = handlePlayAgain(state, "p2");
    expect(state.phase).toBe("playing");
    expect(state.pressedTeeth).toHaveLength(0);
    expect(state.loser).toBeNull();
    expect(state.currentTurn).toBe("p1");
  });

  it("ignores duplicate votes from the same player", () => {
    let state = handlePlayAgain(endedState(), "p1");
    state = handlePlayAgain(state, "p1");
    expect(state.playAgainVotes).toHaveLength(1);
  });

  it("generates a new random trigger tooth on reset", () => {
    const results = new Set<number>();
    for (let i = 0; i < 30; i++) {
      let s = handlePlayAgain(endedState(), "p1");
      s = handlePlayAgain(s, "p2");
      results.add(s.triggerTooth);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("toClientState", () => {
  it("omits triggerTooth from client state", () => {
    const state = twoPlayerPlaying(7);
    const client = toClientState(state);
    expect("triggerTooth" in client).toBe(false);
  });

  it("converts playAgainVotes array to a count", () => {
    const state = { ...twoPlayerPlaying(5), playAgainVotes: ["p1"] };
    expect(toClientState(state).playAgainVotes).toBe(1);
  });
});

describe("addChatMessage", () => {
  it("caps chat history at 100 messages", () => {
    let state = twoPlayerPlaying(0);
    for (let i = 0; i < 105; i++) {
      state = addChatMessage(state, "p1", `msg ${i}`);
    }
    expect(state.chat).toHaveLength(100);
  });
});
