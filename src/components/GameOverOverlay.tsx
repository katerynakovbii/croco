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
