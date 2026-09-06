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
