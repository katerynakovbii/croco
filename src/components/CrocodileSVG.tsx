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
