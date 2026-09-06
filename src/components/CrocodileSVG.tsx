"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// 12 clickable lower teeth (bottom jaw, pointing up)
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 66 + i * 34);

// 11 decorative upper teeth (top jaw, pointing down) — sit between lower teeth
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 83 + i * 34);

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
      jawControls.start({ y: 42, transition: { type: "spring", stiffness: 350, damping: 25 } });
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
      <svg viewBox="0 0 500 320" className="w-full" aria-label="Crocodile">

        {/* Lower jaw (static) */}
        <ellipse cx="250" cy="282" rx="188" ry="58" fill="#16a34a" />

        {/* Tongue */}
        <ellipse cx="250" cy="248" rx="78" ry="26" fill="#f472b6" />

        {/* Mouth gap background */}
        <rect x="58" y="182" width="384" height="44" fill="#dcfce7" rx="4" />

        {/* Lower teeth — clickable, pointing UP */}
        {LOWER_TEETH_X.map((x, i) => {
          const pressed = pressedTeeth.includes(i);
          const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
          return (
            <g key={i}>
              <motion.path
                d={`M${x - 11} 226 L${x} 193 L${x + 11} 226 Z`}
                fill={pressed ? "#9ca3af" : "#ffffff"}
                stroke={pressed ? "#6b7280" : "#d1d5db"}
                strokeWidth="1"
                animate={{ y: pressed ? 8 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              {/* Larger hit area for mobile */}
              <rect
                x={x - 20}
                y={188}
                width={40}
                height={46}
                fill="transparent"
                style={{ cursor: canPress ? "pointer" : "default" }}
                onClick={() => canPress && onPressTooth(i)}
                role={canPress ? "button" : undefined}
                aria-label={canPress ? `Press tooth ${i + 1}` : undefined}
              />
            </g>
          );
        })}

        {/* Upper jaw group — animated on snap */}
        <motion.g animate={jawControls}>

          {/* Head */}
          <path
            d="M 58 168 L 58 86 Q 58 26 250 26 Q 442 26 442 86 L 442 168 Q 442 184 250 184 Q 58 184 58 168 Z"
            fill="#4ade80"
          />

          {/* Scale texture */}
          <circle cx="185" cy="118" r="16" fill="#22c55e" opacity="0.45" />
          <circle cx="250" cy="98" r="19" fill="#22c55e" opacity="0.45" />
          <circle cx="315" cy="118" r="16" fill="#22c55e" opacity="0.45" />
          <circle cx="218" cy="145" r="11" fill="#22c55e" opacity="0.35" />
          <circle cx="282" cy="145" r="11" fill="#22c55e" opacity="0.35" />

          {/* Left eye socket */}
          <ellipse cx="146" cy="72" rx="34" ry="30" fill="#4ade80" />
          {/* Left eye white */}
          <circle cx="146" cy="67" r="26" fill="white" />
          {/* Left pupil */}
          <circle cx="150" cy="69" r="14" fill="#1f2937" />
          {/* Left shine */}
          <circle cx="155" cy="63" r="5.5" fill="white" />
          <circle cx="147" cy="75" r="2.5" fill="white" opacity="0.6" />
          {/* Left eyebrow */}
          <path d="M 128 47 Q 146 40 164 47" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Left blush */}
          <ellipse cx="116" cy="90" rx="18" ry="11" fill="#f9a8d4" opacity="0.55" />

          {/* Right eye socket */}
          <ellipse cx="354" cy="72" rx="34" ry="30" fill="#4ade80" />
          {/* Right eye white */}
          <circle cx="354" cy="67" r="26" fill="white" />
          {/* Right pupil */}
          <circle cx="358" cy="69" r="14" fill="#1f2937" />
          {/* Right shine */}
          <circle cx="363" cy="63" r="5.5" fill="white" />
          <circle cx="355" cy="75" r="2.5" fill="white" opacity="0.6" />
          {/* Right eyebrow */}
          <path d="M 336 47 Q 354 40 372 47" stroke="#15803d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Right blush */}
          <ellipse cx="384" cy="90" rx="18" ry="11" fill="#f9a8d4" opacity="0.55" />

          {/* Nostrils */}
          <ellipse cx="214" cy="62" rx="13" ry="9" fill="#15803d" />
          <ellipse cx="286" cy="62" rx="13" ry="9" fill="#15803d" />
          <ellipse cx="215" cy="61" rx="5.5" ry="4" fill="#0f6b32" />
          <ellipse cx="287" cy="61" rx="5.5" ry="4" fill="#0f6b32" />

          {/* Decorative upper teeth — pointing DOWN, not clickable */}
          {UPPER_TEETH_X.map((x, i) => (
            <path
              key={i}
              d={`M${x - 10} 182 L${x} 214 L${x + 10} 182 Z`}
              fill="#ffffff"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
        </motion.g>
      </svg>
    </motion.div>
  );
}
