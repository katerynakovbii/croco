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
