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
