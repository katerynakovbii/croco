# Crocodile Dentist — Multiplayer Web Game Design

## Overview

A real-time 2-player web game based on the Crocodile Dentist toy. Players take turns pressing teeth on a cartoon crocodile. One random tooth is the trigger — pressing it snaps the mouth shut and that player loses. Built for long-distance couples to play together via shared link.

---

## Architecture

**Frontend:** Next.js (App Router), deployed on Vercel.
**Backend:** PartyKit server (single file), deployed on Cloudflare via PartyKit.
**Communication:** WebSockets managed by PartyKit.

### Pages

- `/` — Home. "Create game" button generates a room ID and displays the shareable URL.
- `/game/[roomId]` — Game room. Connects to PartyKit room on mount.

### PartyKit Room

Each room is an isolated in-memory WebSocket server. Rooms are keyed by `roomId`. State lives only in memory — no database, no persistence.

---

## Game State (server-side)

```ts
{
  players: string[],           // max 2 connection IDs
  currentTurn: string,         // connection ID of active player
  triggerTooth: number,        // random 0–11, never sent to clients
  pressedTeeth: number[],      // indices of safe pressed teeth
  phase: "waiting" | "playing" | "ended",
  loser: string | null,        // connection ID of loser
  chat: Array<{
    from: string,              // connection ID
    text?: string,
    emoji?: string,
    ts: number
  }>
}
```

`triggerTooth` is generated fresh each round with `Math.floor(Math.random() * 12)` and is never included in any message sent to clients.

---

## WebSocket Message Protocol

### Client → Server

| type | payload | description |
|------|---------|-------------|
| `press` | `{ toothIndex: number }` | Player presses a tooth |
| `chat` | `{ text: string }` | Send chat message |
| `emoji` | `{ emoji: string }` | Send emoji reaction |
| `playAgain` | — | Request new round (both must send) |

### Server → Client (broadcast)

| type | payload | description |
|------|---------|-------------|
| `joined` | `{ yourId: string }` | Sent only to the connecting client; allows client to identify itself in subsequent messages |
| `state` | full game state (minus `triggerTooth`) | Sent on join and after every change |
| `snap` | `{ loser: string }` | Trigger tooth pressed — game over; client compares `loser` to its `yourId` |
| `partnerLeft` | — | Other player disconnected |
| `partnerRejoined` | — | Other player reconnected within 60s |
| `roomFull` | — | Third player tried to join |

---

## Client Components

### `CrocodileSVG`
- Animated SVG of crocodile with open mouth
- 12 teeth rendered as clickable elements
- Pressed teeth shown grayed out / pushed down
- On `snap`: plays mouth-closing animation, shakes briefly

### `ToothButton`
- Enabled only when `phase === "playing"` and it is this client's turn
- Disabled if tooth index is in `pressedTeeth`
- Sends `{ type: "press", toothIndex }` on click

### `TurnIndicator`
- "Your turn" (green) or "Partner's turn" (muted)
- Shows player count: "Waiting for partner..." when `phase === "waiting"`

### `ChatPanel`
- Scrollable message list, newest at bottom
- Text input (max 200 chars, Enter to send)
- Emoji picker: 8 preset emojis (😄 😱 😬 💀 😂 🐊 ❤️ 😤)
- Messages labeled "You" / "Partner"

### `GameOverOverlay`
- Shown when `phase === "ended"`
- Displays winner / loser
- "Play again" button — sends `playAgain`; waits for both players to confirm before resetting

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Third player opens link | Server sends `roomFull`; client shows "Sorry, this game is full" page |
| Player disconnects mid-game | Server broadcasts `partnerLeft`; game pauses; client shows "Waiting for partner..." overlay |
| Disconnected player reconnects within 60s | Server broadcasts `partnerRejoined`; game resumes from same state |
| Disconnected player doesn't return after 60s | Room resets to `phase: "waiting"` |
| Room created but never filled after 10 min | PartyKit room self-destructs (no connections = no activity) |
| Out-of-turn press received by server | Server ignores; no state change |
| "Play again" — who goes first? | Loser of previous round starts next round |

---

## Visual Design Notes

- Style: cute/cartoon — bright greens, friendly rounded shapes
- Crocodile SVG: expressive eyes, visible teeth row along open jaw
- Tooth press: subtle push-down CSS transform + sound (optional)
- Snap animation: mouth closes fast, screen shakes, red flash
- Responsive: playable on mobile browser (touch-friendly tooth targets)

---

## Out of Scope (v1)

- User accounts / authentication
- Score history / persistence
- More than 2 players
- Spectator mode
- Custom tooth counts
- Sound effects (nice-to-have, not required)
