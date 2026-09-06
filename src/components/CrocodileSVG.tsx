"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// 12 clickable lower teeth
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 118 + i * 46);

// 11 decorative upper teeth (between lower teeth)
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 141 + i * 46);

// Jaw hinge — back-left where both jaws meet
const HINGE_X = 62;
const HINGE_Y = 228;

// Upper jaw rotates around the hinge:
//   open  → -25°  (mouth clearly open)
//   closed →  0°  (only on trigger tooth snap)
const OPEN_ANGLE = -25;

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
      jawControls.start({
        rotate: 0,
        transition: { type: "spring", stiffness: 350, damping: 25 },
      });
      wrapperControls.start({
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.5, delay: 0.15 },
      });
    } else {
      jawControls.start({
        rotate: OPEN_ANGLE,
        transition: { type: "spring", stiffness: 200, damping: 22 },
      });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-2xl mx-auto select-none mt-20">
      {/* overflow:visible lets the rotated upper jaw render above the SVG box */}
      <svg
        viewBox="0 0 720 300"
        className="w-full"
        style={{ overflow: "visible" }}
        aria-label="Crocodile"
      >
        {/* ── LOWER TEETH (rendered before lower jaw — sink behind it when pressed) ── */}
        {LOWER_TEETH_X.map((x, i) => {
          const pressed = pressedTeeth.includes(i);
          const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
          return (
            <g key={i}>
              <motion.polygon
                points={`${x - 13},248 ${x},206 ${x + 13},248`}
                fill={pressed ? "#6b7280" : "#ffffff"}
                stroke={pressed ? "#4b5563" : "#374151"}
                strokeWidth="2"
                strokeLinejoin="round"
                animate={{ y: pressed ? 68 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
              <rect
                x={x - 22}
                y={202}
                width={44}
                height={54}
                fill="transparent"
                style={{ cursor: canPress ? "pointer" : "default" }}
                onClick={() => canPress && onPressTooth(i)}
                role={canPress ? "button" : undefined}
                aria-label={canPress ? `Press tooth ${i + 1}` : undefined}
              />
            </g>
          );
        })}

        {/* ── LOWER JAW (static, flat) — covers pressed teeth ── */}
        <path
          d="M 85 300 L 85 250 Q 106 240 662 240 Q 682 244 678 300 Z"
          fill="#2e7d32"
        />

        {/* ── UPPER JAW — starts at OPEN_ANGLE, rotates to 0° only on snap ── */}
        <motion.g
          animate={jawControls}
          initial={{ rotate: OPEN_ANGLE }}
          style={{ transformOrigin: `${HINGE_X}px ${HINGE_Y}px` }}
        >
          {/* Upper jaw body (drawn in closed/flat position, rotation opens it) */}
          <path
            d="
              M 42 228
              L 42 108
              Q 44 58 84 62
              Q 100 40 122 62
              Q 138 40 158 62
              Q 172 54 660 130
              Q 682 138 675 172
              L 675 200
              Q 670 208 652 208
              L 158 208
              Q 120 214 96 224
              L 42 228 Z
            "
            fill="#2e7d32"
          />

          {/* Decorative upper teeth — rotate with jaw, angle into gap when open */}
          {UPPER_TEETH_X.map((x, i) => (
            <polygon
              key={i}
              points={`${x - 11},208 ${x},236 ${x + 11},208`}
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

          {/* Nostril */}
          <ellipse cx="638" cy="154" rx="9" ry="6" fill="#1b5e20" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
