# Crocodile Dentist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time 2-player web game where players take turns pressing crocodile teeth; one hidden trigger tooth snaps the mouth shut and that player loses.

**Architecture:** Next.js App Router frontend deployed on Vercel. PartyKit WebSocket server (single file, Cloudflare) manages per-room game state in memory. Players join via shared URL — no accounts, no database.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, PartyKit, partysocket, Vitest

---

## File Map

| File | Purpose |
|------|---------|
| `party/game-logic.ts` | Pure state functions — no I/O, fully testable |
| `party/game-logic.test.ts` | Vitest unit tests for all game logic |
| `party/index.ts` | PartyKit server class — WebSocket lifecycle, calls game-logic |
| `src/types/game.ts` | Shared TypeScript types for client and server |
| `src/hooks/useGameRoom.ts` | React hook — PartyKit connection, state, actions |
| `src/app/page.tsx` | Home page — create game button |
| `src/app/game/[roomId]/page.tsx` | Game room — assembles all components |
| `src/components/CrocodileSVG.tsx` | Animated SVG crocodile with 12 clickable teeth |
| `src/components/TurnIndicator.tsx` | Whose turn it is |
| `src/components/ChatPanel.tsx` | Text chat + emoji reactions |
| `src/components/GameOverOverlay.tsx` | Win/lose display + play again |
| `partykit.json` | PartyKit project config |
| `vitest.config.ts` | Vitest config scoped to party/ tests |
| `.env.local` | `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999` |

---

## Task 1: Scaffold Next.js project and install dependencies

**Files:**
- Create: `package.json` (modified), `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`

- [ ] **Step 1: Scaffold Next.js in the current directory**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

Expected: Next.js project created in current directory with src/, App Router, Tailwind, TypeScript.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install partysocket framer-motion
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D partykit vitest concurrently
```

- [ ] **Step 4: Update package.json scripts**

Replace the `scripts` section in `package.json` with:

```json
"scripts": {
  "dev": "concurrently \"next dev --turbopack\" \"partykit dev\"",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["party/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Create partykit.json**

```json
{
  "name": "croco-dentist",
  "main": "party/index.ts",
  "compatibilityDate": "2023-10-01"
}
```

- [ ] **Step 7: Create .env.local**

```
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

- [ ] **Step 8: Create party/ directory**

```bash
mkdir party
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with PartyKit and dependencies"
```

---

## Task 2: Shared TypeScript types

**Files:**
- Create: `src/types/game.ts`

- [ ] **Step 1: Create src/types/game.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add shared game types"
```

---

## Task 3: Pure game logic with tests (TDD)

**Files:**
- Create: `party/game-logic.ts`
- Create: `party/game-logic.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `party/game-logic.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests and verify they all fail**

```bash
npm test
```

Expected: All tests fail with "Cannot find module './game-logic'".

- [ ] **Step 3: Implement party/game-logic.ts**

```typescript
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
  text?: string,
  emoji?: string
): RoomState {
  const message: ChatMessage = { from, ts: Date.now(), text, emoji };
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
```

- [ ] **Step 4: Run tests and verify they all pass**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add party/game-logic.ts party/game-logic.test.ts
git commit -m "feat: add pure game logic with tests"
```

---

## Task 4: PartyKit server

**Files:**
- Create: `party/index.ts`

- [ ] **Step 1: Create party/index.ts**

```typescript
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
    const msg = JSON.parse(message) as ClientMessage;

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
        this.state = addChatMessage(this.state, sender.id, msg.text, undefined);
        this.broadcastState();
        break;
      }
      case "emoji": {
        this.state = addChatMessage(this.state, sender.id, undefined, msg.emoji);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add party/index.ts
git commit -m "feat: add PartyKit game room server"
```

---

## Task 5: useGameRoom hook

**Files:**
- Create: `src/hooks/useGameRoom.ts`

- [ ] **Step 1: Create src/hooks/useGameRoom.ts**

```typescript
"use client";

import usePartySocket from "partysocket/react";
import { useState, useEffect } from "react";
import type { ClientGameState, ServerMessage } from "@/types/game";

export function useGameRoom(roomId: string) {
  const [yourId, setYourId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [snapped, setSnapped] = useState(false);
  const [roomFull, setRoomFull] = useState(false);

  useEffect(() => {
    if (gameState?.phase === "playing" && snapped) {
      setSnapped(false);
    }
  }, [gameState?.phase]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: roomId,
    onMessage(event: MessageEvent) {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      switch (msg.type) {
        case "joined":
          setYourId(msg.yourId);
          break;
        case "state":
          setGameState(msg.state);
          break;
        case "snap":
          setSnapped(true);
          break;
        case "roomFull":
          setRoomFull(true);
          break;
        case "partnerLeft":
        case "partnerRejoined":
          break;
      }
    },
  });

  const send = (msg: object) => socket.send(JSON.stringify(msg));

  return {
    yourId,
    gameState,
    snapped,
    roomFull,
    pressTooth: (toothIndex: number) => send({ type: "press", toothIndex }),
    sendChat: (text: string) => send({ type: "chat", text }),
    sendEmoji: (emoji: string) => send({ type: "emoji", emoji }),
    playAgain: () => send({ type: "playAgain" }),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useGameRoom.ts
git commit -m "feat: add useGameRoom WebSocket hook"
```

---

## Task 6: Home page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace src/app/page.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const createGame = () => {
    const roomId = crypto.randomUUID().slice(0, 8);
    router.push(`/game/${roomId}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 gap-8 p-8">
      <div className="text-center">
        <div className="text-8xl mb-4">🐊</div>
        <h1 className="text-4xl font-bold text-green-800 mb-2">Crocodile Dentist</h1>
        <p className="text-green-600 text-lg">Take turns pressing teeth. Don&apos;t wake the croc!</p>
      </div>

      <button
        onClick={createGame}
        className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-xl px-10 py-4 rounded-2xl shadow-lg transition-colors"
      >
        Create Game
      </button>

      <p className="text-green-500 text-sm text-center max-w-xs">
        After creating, share the link with your partner. First to 2 players starts automatically.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with create game button"
```

---

## Task 7: CrocodileSVG component

**Files:**
- Create: `src/components/CrocodileSVG.tsx`

- [ ] **Step 1: Create src/components/CrocodileSVG.tsx**

```tsx
"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const TEETH_X = Array.from({ length: 12 }, (_, i) => 66 + i * 34);
// [66, 100, 134, 168, 202, 236, 270, 304, 338, 372, 406, 440]

interface Props {
  pressedTeeth: number[];
  isMyTurn: boolean;
  phase: "waiting" | "playing" | "ended";
  snapped: boolean;
  paused: boolean;
  onPressTooth: (index: number) => void;
}

export function CrocodileSVG({ pressedTeeth, isMyTurn, phase, snapped, paused, onPressTooth }: Props) {
  const jawControls = useAnimation();
  const wrapperControls = useAnimation();

  useEffect(() => {
    if (snapped) {
      jawControls.start({ y: 85, transition: { type: "spring", stiffness: 350, damping: 25 } });
      wrapperControls.start({
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.5, delay: 0.15 },
      });
    } else {
      jawControls.start({ y: 0, transition: { duration: 0.4 } });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-lg mx-auto select-none">
      <svg viewBox="0 0 500 310" className="w-full" aria-label="Crocodile">
        {/* Lower jaw */}
        <ellipse cx="250" cy="265" rx="190" ry="55" fill="#16a34a" />
        {/* Tongue */}
        <ellipse cx="250" cy="235" rx="85" ry="28" fill="#f472b6" />

        {/* Mouth gap background */}
        <rect x="52" y="178" width="396" height="32" fill="#dcfce7" rx="4" />

        {/* Upper jaw group — animated on snap */}
        <motion.g animate={jawControls}>
          {/* Head */}
          <path
            d="M 50 150 L 50 85 Q 50 40 250 40 Q 450 40 450 85 L 450 150 Q 450 182 250 182 Q 50 182 50 150 Z"
            fill="#4ade80"
          />

          {/* Scale texture */}
          <circle cx="200" cy="110" r="13" fill="#22c55e" opacity="0.45" />
          <circle cx="250" cy="95" r="15" fill="#22c55e" opacity="0.45" />
          <circle cx="300" cy="110" r="13" fill="#22c55e" opacity="0.45" />

          {/* Left eye socket */}
          <ellipse cx="155" cy="68" rx="28" ry="22" fill="#4ade80" />
          <circle cx="155" cy="65" r="20" fill="white" />
          <circle cx="158" cy="67" r="10" fill="#1f2937" />
          <circle cx="162" cy="63" r="4" fill="white" />

          {/* Right eye socket */}
          <ellipse cx="345" cy="68" rx="28" ry="22" fill="#4ade80" />
          <circle cx="345" cy="65" r="20" fill="white" />
          <circle cx="348" cy="67" r="10" fill="#1f2937" />
          <circle cx="352" cy="63" r="4" fill="white" />

          {/* Nostrils */}
          <ellipse cx="215" cy="55" rx="10" ry="6" fill="#15803d" />
          <ellipse cx="285" cy="55" rx="10" ry="6" fill="#15803d" />

          {/* 12 teeth */}
          {TEETH_X.map((x, i) => {
            const pressed = pressedTeeth.includes(i);
            const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
            return (
              <g key={i}>
                <motion.g
                  animate={{ y: pressed ? 10 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <path
                    d={`M${x - 11} 158 L${x - 11} 185 L${x} 198 L${x + 11} 185 L${x + 11} 158 Z`}
                    fill={pressed ? "#9ca3af" : "#ffffff"}
                    stroke={pressed ? "#6b7280" : "#d1d5db"}
                    strokeWidth="1"
                  />
                </motion.g>
                {/* Larger transparent hit area for mobile */}
                <rect
                  x={x - 20}
                  y={140}
                  width={40}
                  height={70}
                  fill="transparent"
                  style={{ cursor: canPress ? "pointer" : "default" }}
                  onClick={() => canPress && onPressTooth(i)}
                  role={canPress ? "button" : undefined}
                  aria-label={canPress ? `Press tooth ${i + 1}` : undefined}
                />
              </g>
            );
          })}
        </motion.g>
      </svg>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CrocodileSVG.tsx
git commit -m "feat: add animated CrocodileSVG component"
```

---

## Task 8: TurnIndicator component

**Files:**
- Create: `src/components/TurnIndicator.tsx`

- [ ] **Step 1: Create src/components/TurnIndicator.tsx**

```tsx
interface Props {
  phase: "waiting" | "playing" | "ended";
  isMyTurn: boolean;
  paused: boolean;
}

export function TurnIndicator({ phase, isMyTurn, paused }: Props) {
  if (phase === "waiting") {
    return (
      <div className="text-center text-green-600 font-medium text-lg animate-pulse">
        Waiting for partner to join...
      </div>
    );
  }

  if (paused) {
    return (
      <div className="text-center text-amber-600 font-medium text-lg animate-pulse">
        Partner disconnected — waiting for them to return...
      </div>
    );
  }

  if (phase === "ended") return null;

  return (
    <div
      className={`text-center font-bold text-xl px-6 py-2 rounded-full ${
        isMyTurn
          ? "bg-green-100 text-green-700 border-2 border-green-400"
          : "bg-gray-100 text-gray-500 border-2 border-gray-200"
      }`}
    >
      {isMyTurn ? "Your turn — press a tooth!" : "Partner's turn..."}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TurnIndicator.tsx
git commit -m "feat: add TurnIndicator component"
```

---

## Task 9: ChatPanel component

**Files:**
- Create: `src/components/ChatPanel.tsx`

- [ ] **Step 1: Create src/components/ChatPanel.tsx**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/game";

const PRESET_EMOJIS = ["😄", "😱", "😬", "💀", "😂", "🐊", "❤️", "😤"];

interface Props {
  messages: ChatMessage[];
  yourId: string | null;
  onSendChat: (text: string) => void;
  onSendEmoji: (emoji: string) => void;
}

export function ChatPanel({ messages, yourId, onSendChat, onSendEmoji }: Props) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendChat(trimmed);
    setText("");
  };

  return (
    <div className="flex flex-col h-full border border-green-200 rounded-2xl bg-white overflow-hidden">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.from === yourId;
          return (
            <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-sm ${
                  msg.emoji
                    ? "text-2xl bg-transparent shadow-none px-1"
                    : isMe
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.emoji ?? msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Emoji row */}
      <div className="flex gap-1 px-3 py-2 border-t border-green-100 overflow-x-auto">
        {PRESET_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendEmoji(emoji)}
            className="text-xl hover:scale-125 transition-transform flex-shrink-0"
            aria-label={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex gap-2 p-3 border-t border-green-100">
        <input
          type="text"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat: add ChatPanel with text and emoji support"
```

---

## Task 10: GameOverOverlay component

**Files:**
- Create: `src/components/GameOverOverlay.tsx`

- [ ] **Step 1: Create src/components/GameOverOverlay.tsx**

```tsx
"use client";

import { motion } from "framer-motion";

interface Props {
  loser: string | null;
  yourId: string | null;
  playAgainVotes: number;
  onPlayAgain: () => void;
}

export function GameOverOverlay({ loser, yourId, playAgainVotes, onPlayAgain }: Props) {
  const iLost = loser === yourId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.6 }}
      className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 rounded-2xl"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4 text-center max-w-sm w-full">
        <div className="text-6xl mb-3">{iLost ? "😬" : "🎉"}</div>
        <h2 className="text-3xl font-bold mb-1 text-gray-800">
          {iLost ? "Ouch!" : "Safe!"}
        </h2>
        <p className="text-gray-500 mb-6 text-lg">
          {iLost ? "The croc got your finger!" : "Your partner woke the croc!"}
        </p>

        <button
          onClick={onPlayAgain}
          disabled={playAgainVotes >= 1}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-lg py-3 rounded-2xl transition-colors mb-3"
        >
          {playAgainVotes === 0 ? "Play Again" : "Waiting for partner..."}
        </button>

        {playAgainVotes === 1 && (
          <p className="text-green-600 text-sm animate-pulse">
            1 / 2 ready — waiting for your partner
          </p>
        )}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameOverOverlay.tsx
git commit -m "feat: add GameOverOverlay with play again flow"
```

---

## Task 11: Game room page

**Files:**
- Create: `src/app/game/[roomId]/page.tsx`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/app/game/\[roomId\]
```

- [ ] **Step 2: Create src/app/game/[roomId]/page.tsx**

```tsx
"use client";

import { use } from "react";
import { useGameRoom } from "@/hooks/useGameRoom";
import { CrocodileSVG } from "@/components/CrocodileSVG";
import { TurnIndicator } from "@/components/TurnIndicator";
import { ChatPanel } from "@/components/ChatPanel";
import { GameOverOverlay } from "@/components/GameOverOverlay";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default function GamePage({ params }: Props) {
  const { roomId } = use(params);
  const { yourId, gameState, snapped, roomFull, pressTooth, sendChat, sendEmoji, playAgain } =
    useGameRoom(roomId);

  if (roomFull) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🐊</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Game is full</h1>
          <p className="text-gray-500">This game already has 2 players. Ask for a new link!</p>
        </div>
      </main>
    );
  }

  const isMyTurn = gameState?.currentTurn === yourId;
  const inviteUrl =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-800">🐊 Croc Dentist</h1>
          <button
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="text-sm bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            Copy invite link
          </button>
        </div>

        {/* Turn indicator */}
        {gameState && (
          <TurnIndicator
            phase={gameState.phase}
            isMyTurn={isMyTurn}
            paused={gameState.paused}
          />
        )}

        {/* Game area + chat */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Crocodile */}
          <div className="relative flex-1 bg-white rounded-2xl shadow p-4 min-h-64">
            {gameState && (
              <CrocodileSVG
                pressedTeeth={gameState.pressedTeeth}
                isMyTurn={isMyTurn}
                phase={gameState.phase}
                snapped={snapped}
                paused={gameState.paused}
                onPressTooth={pressTooth}
              />
            )}
            {!gameState && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-green-400 animate-pulse">Connecting...</p>
              </div>
            )}
            {gameState?.phase === "ended" && (
              <GameOverOverlay
                loser={gameState.loser}
                yourId={yourId}
                playAgainVotes={gameState.playAgainVotes}
                onPlayAgain={playAgain}
              />
            )}
          </div>

          {/* Chat */}
          <div className="lg:w-72 h-80 lg:h-auto">
            <ChatPanel
              messages={gameState?.chat ?? []}
              yourId={yourId}
              onSendChat={sendChat}
              onSendEmoji={sendEmoji}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/game/
git commit -m "feat: add game room page assembling all components"
```

---

## Task 12: Polish globals and verify full flow

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update globals.css — keep Tailwind base, add smooth scrolling**

Replace `src/app/globals.css` content with:

```css
@import "tailwindcss";

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

- [ ] **Step 2: Update layout.tsx metadata**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crocodile Dentist",
  description: "Take turns pressing teeth. Don't wake the croc!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Run all tests one final time**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Start both servers locally**

```bash
npm run dev
```

Expected: Next.js starts on `http://localhost:3000`, PartyKit starts on `http://localhost:1999`.

- [ ] **Step 6: Manual smoke test**

1. Open `http://localhost:3000` in two browser tabs (or two browsers)
2. In Tab 1: click "Create Game" — note the URL room ID, game shows "Waiting for partner..."
3. In Tab 2: paste the same URL — both tabs should now show "Your turn" / "Partner's turn"
4. Take turns clicking teeth — verify turn alternates
5. Find the trigger tooth — verify mouth snaps, overlay appears
6. Click "Play Again" in both tabs — verify game resets, loser goes first
7. Test chat: send text and an emoji, verify both appear in both tabs

- [ ] **Step 7: Final commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: complete Crocodile Dentist multiplayer game"
```

---

## Deploy (after local testing passes)

**PartyKit deploy:**

```bash
npx partykit deploy
```

Expected output includes: `Deployed to https://croco-dentist.<your-username>.partykit.dev`

**Vercel deploy:**

Add the production PartyKit host as an environment variable in Vercel:

```
NEXT_PUBLIC_PARTYKIT_HOST=croco-dentist.<your-username>.partykit.dev
```

Then deploy:

```bash
npx vercel --prod
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|-----------------|------|
| Share-by-link rooms, no auth | Task 6 (home page generates UUID room ID) |
| Real-time 2-player sync | Tasks 4, 5 (PartyKit server + hook) |
| One hidden trigger tooth, random per round | Task 3 (handlePress, handlePlayAgain in game-logic) |
| Turn alternation | Task 3 (handlePress alternates currentTurn) |
| Cute/cartoon crocodile SVG | Task 7 (CrocodileSVG) |
| 12 clickable teeth | Task 7 (TEETH_X array, tooth paths + hit areas) |
| Tooth press animation | Task 7 (motion.g with y translate) |
| Mouth snap animation + screen shake | Task 7 (jawControls, wrapperControls) |
| Turn indicator | Task 8 (TurnIndicator) |
| Chat text messages | Task 9 (ChatPanel) |
| Emoji reactions (8 presets) | Task 9 (PRESET_EMOJIS) |
| Game over overlay | Task 10 (GameOverOverlay) |
| Play again — loser goes first | Task 3 (handlePlayAgain: currentTurn = loser) |
| Both players must confirm play again | Task 3 (playAgainVotes ≥ 2), Task 10 (overlay UX) |
| Third player rejected as room full | Task 4 (onConnect sends roomFull, closes conn) |
| Partner disconnects → paused overlay | Tasks 4, 8 (paused field, TurnIndicator paused state) |
| 60s reconnect window | Task 4 (setTimeout 60_000 in onClose) |
| Reconnect restores game state | Task 4 (ID swap in onConnect when disconnectedPlayerId set) |
| Mobile touch-friendly | Tasks 7, 9 (large hit areas, responsive layout) |
| Responsive layout | Task 11 (flex-col lg:flex-row) |
