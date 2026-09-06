"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// 12 clickable lower teeth (x-center positions across lower jaw)
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 118 + i * 46);

// 11 decorative upper teeth (between lower teeth)
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 141 + i * 46);

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
      jawControls.start({ y: 40, transition: { type: "spring", stiffness: 350, damping: 25 } });
      wrapperControls.start({
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.5, delay: 0.15 },
      });
    } else {
      jawControls.start({ y: 0, transition: { duration: 0.4 } });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-2xl mx-auto select-none">
      <svg viewBox="0 0 720 330" className="w-full" aria-label="Crocodile">

        {/* ── LOWER TEETH (rendered before lower jaw so jaw covers them when pressed) ── */}
        {LOWER_TEETH_X.map((x, i) => {
          const pressed = pressedTeeth.includes(i);
          const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
          return (
            <g key={i}>
              <motion.polygon
                points={`${x - 13},248 ${x},205 ${x + 13},248`}
                fill={pressed ? "#6b7280" : "#ffffff"}
                stroke={pressed ? "#4b5563" : "#374151"}
                strokeWidth="2"
                strokeLinejoin="round"
                animate={{ y: pressed ? 52 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
              <rect
                x={x - 22}
                y={200}
                width={44}
                height={55}
                fill="transparent"
                style={{ cursor: canPress ? "pointer" : "default" }}
                onClick={() => canPress && onPressTooth(i)}
                role={canPress ? "button" : undefined}
                aria-label={canPress ? `Press tooth ${i + 1}` : undefined}
              />
            </g>
          );
        })}

        {/* ── LOWER JAW — rendered ON TOP of teeth so pressed teeth hide behind it ── */}
        <path
          d="M 88 325 L 88 248 Q 105 238 660 238 Q 680 242 675 325 Z"
          fill="#2e7d32"
        />

        {/* ── UPPER JAW (animated on snap) ── */}
        <motion.g animate={jawControls}>

          {/* Upper jaw body — side profile, head left, snout right */}
          <path
            d="
              M 42 238
              L 42 112
              Q 44 62 84 66
              Q 100 44 122 66
              Q 138 44 158 66
              Q 172 58 660 136
              Q 682 144 675 178
              L 675 204
              Q 670 212 652 212
              L 158 212
              Q 120 216 96 226
              L 42 238 Z
            "
            fill="#2e7d32"
          />

          {/* Decorative upper teeth — pointing DOWN, not clickable */}
          {UPPER_TEETH_X.map((x, i) => (
            <polygon
              key={i}
              points={`${x - 11},212 ${x},238 ${x + 11},212`}
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ))}

          {/* Left eye (back of head) */}
          <ellipse cx="98" cy="78" rx="20" ry="18" fill="white" />
          <circle cx="104" cy="80" r="11" fill="#1a237e" />
          <circle cx="108" cy="76" r="4" fill="white" />

          {/* Right eye (slightly forward) */}
          <ellipse cx="146" cy="72" rx="18" ry="16" fill="white" />
          <circle cx="152" cy="74" r="10" fill="#1a237e" />
          <circle cx="156" cy="70" r="3.5" fill="white" />

          {/* Nostril near snout tip */}
          <ellipse cx="635" cy="158" rx="9" ry="6" fill="#1b5e20" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
