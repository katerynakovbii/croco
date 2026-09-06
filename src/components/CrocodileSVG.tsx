"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// 12 clickable lower teeth
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 118 + i * 46);

// 11 decorative upper teeth (sit between lower teeth)
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 141 + i * 46);

// Gap between upper jaw bottom (y=206) and lower jaw top (y=260) = 54px
// Snap moves upper jaw down exactly 54px to close mouth
const SNAP_Y = 54;

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
      jawControls.start({ y: SNAP_Y, transition: { type: "spring", stiffness: 350, damping: 25 } });
      wrapperControls.start({
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.5, delay: 0.15 },
      });
    } else {
      // Mouth open — initial state, no animation on first render
      jawControls.start({ y: 0, transition: { type: "spring", stiffness: 200, damping: 30 } });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-2xl mx-auto select-none">
      <svg viewBox="0 0 720 340" className="w-full" aria-label="Crocodile">

        {/* ── LOWER TEETH (rendered before lower jaw body — pressed teeth hide behind it) ── */}
        {LOWER_TEETH_X.map((x, i) => {
          const pressed = pressedTeeth.includes(i);
          const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
          return (
            <g key={i}>
              <motion.polygon
                points={`${x - 13},262 ${x},214 ${x + 13},262`}
                fill={pressed ? "#6b7280" : "#ffffff"}
                stroke={pressed ? "#4b5563" : "#374151"}
                strokeWidth="2"
                strokeLinejoin="round"
                animate={{ y: pressed ? 68 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
              <rect
                x={x - 22}
                y={208}
                width={44}
                height={60}
                fill="transparent"
                style={{ cursor: canPress ? "pointer" : "default" }}
                onClick={() => canPress && onPressTooth(i)}
                role={canPress ? "button" : undefined}
                aria-label={canPress ? `Press tooth ${i + 1}` : undefined}
              />
            </g>
          );
        })}

        {/* ── LOWER JAW — rendered on top of teeth so pressed ones disappear behind it ── */}
        <path
          d="M 88 334 L 88 262 Q 108 252 662 252 Q 682 256 678 334 Z"
          fill="#2e7d32"
        />

        {/* ── UPPER JAW group — starts open (y=0), only closes on snap ── */}
        <motion.g animate={jawControls}>

          {/* Upper jaw body */}
          <path
            d="
              M 42 242
              L 42 108
              Q 44 58 84 62
              Q 100 40 122 62
              Q 138 40 158 62
              Q 172 54 660 128
              Q 682 136 675 170
              L 675 200
              Q 670 208 652 208
              L 158 208
              Q 120 214 96 226
              L 42 242 Z
            "
            fill="#2e7d32"
          />

          {/* Decorative upper teeth — pointing DOWN into the open gap */}
          {UPPER_TEETH_X.map((x, i) => (
            <polygon
              key={i}
              points={`${x - 11},208 ${x},238 ${x + 11},208`}
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ))}

          {/* Left eye */}
          <ellipse cx="98" cy="76" rx="21" ry="19" fill="white" />
          <circle cx="104" cy="78" r="12" fill="#1a237e" />
          <circle cx="109" cy="73" r="4.5" fill="white" />

          {/* Right eye */}
          <ellipse cx="146" cy="70" rx="19" ry="17" fill="white" />
          <circle cx="152" cy="72" r="11" fill="#1a237e" />
          <circle cx="157" cy="67" r="4" fill="white" />

          {/* Nostril near snout tip */}
          <ellipse cx="638" cy="154" rx="9" ry="6" fill="#1b5e20" />

        </motion.g>
      </svg>
    </motion.div>
  );
}
