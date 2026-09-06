"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

// Single hinge point where upper and lower jaw meet
const HX = 80;
const HY = 238;

// 12 clickable lower teeth — start at x=200 so they're in the visible gap when open
const LOWER_TEETH_X = Array.from({ length: 12 }, (_, i) => 200 + i * 38);

// 11 decorative upper teeth along upper jaw interior
const UPPER_TEETH_X = Array.from({ length: 11 }, (_, i) => 219 + i * 38);

// Upper jaw: open at -27° around hinge, closes to 0° only on trigger tooth snap
const OPEN_ANGLE = -27;

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
        transition: { type: "spring", stiffness: 180, damping: 22 },
      });
    }
  }, [snapped, jawControls, wrapperControls]);

  return (
    <motion.div animate={wrapperControls} className="w-full max-w-2xl mx-auto select-none mt-28">
      {/* overflow:visible so rotated snout renders above SVG bounds */}
      <svg viewBox="0 0 720 295" className="w-full" style={{ overflow: "visible" }} aria-label="Crocodile">

        {/* Lower teeth — rendered BEFORE lower jaw so pressed ones hide behind it */}
        {LOWER_TEETH_X.map((x, i) => {
          const pressed = pressedTeeth.includes(i);
          const canPress = isMyTurn && phase === "playing" && !pressed && !snapped && !paused;
          return (
            <g key={i}>
              <motion.polygon
                points={`${x - 13},${HY} ${x},${HY - 43} ${x + 13},${HY}`}
                fill={pressed ? "#6b7280" : "#ffffff"}
                stroke={pressed ? "#4b5563" : "#374151"}
                strokeWidth="2"
                strokeLinejoin="round"
                animate={{ y: pressed ? 72 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              />
              <rect
                x={x - 22}
                y={HY - 47}
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

        {/* Lower jaw body — static, flat, rendered ON TOP of teeth */}
        <path
          d={`M ${HX} ${HY} L ${HX} ${HY + 18} Q 105 ${HY + 10} 660 ${HY + 10} Q 682 ${HY + 14} 676 295 L ${HX} 295 Z`}
          fill="#2e7d32"
        />

        {/* Upper jaw — tapers to single hinge point, no left wall */}
        <motion.g
          animate={jawControls}
          initial={{ rotate: OPEN_ANGLE }}
          style={{ transformOrigin: `${HX}px ${HY}px` }}
        >
          {/*
            Path tapers to a POINT at (HX, HY) — no vertical left wall.
            In closed position (rotate=0) the bottom edge aligns with lower jaw top.
            The jaw wedges open by rotating around the hinge.
          */}
          <path
            d={`
              M ${HX} ${HY}
              L ${HX} 112
              Q 82 62 108 65
              Q 124 43 150 65
              Q 170 47 200 65
              Q 220 57 658 185
              Q 679 193 672 220
              L 656 ${HY}
              Q 420 ${HY} ${HX} ${HY} Z
            `}
            fill="#2e7d32"
          />

          {/* Decorative upper teeth along bottom interior of snout */}
          {UPPER_TEETH_X.map((x, i) => (
            <polygon
              key={i}
              points={`${x - 10},${HY} ${x},${HY + 26} ${x + 10},${HY}`}
              fill="#ffffff"
              stroke="#374151"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ))}

          {/* Left eye */}
          <ellipse cx="110" cy="77" rx="21" ry="19" fill="white" />
          <circle cx="116" cy="79" r="12" fill="#1a237e" />
          <circle cx="121" cy="74" r="4.5" fill="white" />

          {/* Right eye */}
          <ellipse cx="162" cy="71" rx="19" ry="17" fill="white" />
          <circle cx="168" cy="73" r="11" fill="#1a237e" />
          <circle cx="173" cy="68" r="4" fill="white" />

          {/* Nostril near snout tip */}
          <ellipse cx="640" cy="158" rx="9" ry="6" fill="#1b5e20" />
        </motion.g>

      </svg>
    </motion.div>
  );
}
