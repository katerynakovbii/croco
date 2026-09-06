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
