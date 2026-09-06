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
