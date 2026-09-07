"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// Hinge point — where both jaws meet (single connection point)
const HX = 80;
const HY = 250;

// Upper jaw is DRAWN at 15° open angle (not flat).
// Snap rotates +15° around the hinge to close it — mathematically exact closure.
const SNAP_ANGLE = 15;

// Lower teeth: 12 teeth starting where the gap is wide enough to see them
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 265 + i * 32);

// Upper decorative teeth along the bottom interior of the upper jaw
// y_base for each: 250 - (x - 80) * tan(15°)
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 281 + i * 32);

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
      // Rotate +15° around hinge → bottom edge swings to y=250, mouth closed
      jawControls.start({
        rotate: SNAP_ANGLE,
        transition: { type: "spring", stiffness: 350, damping: 25 },
      });
      wrapperControls.start({
        x: [0, -10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.5, delay: 0.15 },
      });
    } else {
      jawControls.start({
        rotate: 0,
        transition: { type: "spring", stiffness: 180, damping: 22 },
      });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-2xl mx-auto select-none">
      <svg viewBox="0 0 700 280" className="w-full" style={{ overflow: "visible" }} aria-label="Crocodile">

        {/* Clip teeth to y < HY: tooth sinks into jaw and vanishes exactly at the jaw edge */}
        <defs>
          <clipPath id="jaw-clip">
            <rect x="0" y="-200" width="700" height={HY + 200} />
          </clipPath>
        </defs>

        <g clipPath="url(#jaw-clip)">
          {LOWER_TEETH_X.map((x, i) => {
            const pressed = pressedTeeth.includes(i);
            const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
            return (
              <g key={i}>
                <motion.polygon
                  points={`${x - 12},${HY} ${x},${HY - 44} ${x + 12},${HY}`}
                  fill={pressed ? "#6b7280" : "#ffffff"}
                  stroke={pressed ? "#4b5563" : "#374151"}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  animate={{ y: pressed ? 48 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
                <rect
                  x={x - 20}
                  y={HY - 48}
                  width={40}
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
        </g>

        {/* Lower jaw — static, covers pressed teeth */}
        <path
          d={`M ${HX} ${HY} Q 120 ${HY} 648 ${HY} Q 670 ${HY + 4} 665 280 L ${HX} 280 Z`}
          fill="#2e7d32"
        />

        {/* Upper jaw — DRAWN already open at 15° above horizontal.
            Snap rotates +15° around hinge, closing bottom edge exactly to y=250. */}
        <motion.g
          animate={jawControls}
          initial={{ rotate: 0 }}
          style={{ transformOrigin: `${HX}px ${HY}px` }}
        >
          {/*
            Upper jaw wedge shape — open mouth position:
            Bottom edge: (80,250) → (650,97)   [15° above horizontal = 250 - dx*tan15°]
            Top edge:    (62,182) → (632,29)    [offset ~70px above bottom edge, perpendicular]
            Head section rises higher on the left for body/eye area.
          */}
          <path
            d="
              M 80 250
              L 62 182
              Q 62 100 102 102
              Q 120 80 148 102
              Q 168 86 196 102
              Q 228 94 632 29
              Q 652 24 656 50
              L 648 97
              L 80 250 Z
            "
            fill="#2e7d32"
          />

          {/* Decorative upper teeth along the bottom edge of upper jaw */}
          {UPPER_TEETH_X.map((x) => {
            const yBase = HY - (x - HX) * Math.tan((15 * Math.PI) / 180);
            return (
              <polygon
                key={x}
                points={`${x - 10},${yBase} ${x},${yBase + 26} ${x + 10},${yBase}`}
                fill="#ffffff"
                stroke="#374151"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Left eye */}
          <ellipse cx="112" cy="94" rx="20" ry="18" fill="white" />
          <circle cx="118" cy="96" r="11" fill="#1a237e" />
          <circle cx="123" cy="91" r="4" fill="white" />

          {/* Right eye */}
          <ellipse cx="160" cy="88" rx="18" ry="16" fill="white" />
          <circle cx="166" cy="90" r="10" fill="#1a237e" />
          <circle cx="171" cy="85" r="3.5" fill="white" />

          {/* Nostril near snout tip */}
          <ellipse cx="628" cy="52" rx="8" ry="5" fill="#1b5e20" />
        </motion.g>

      </svg>
    </motion.div>
  );
}
