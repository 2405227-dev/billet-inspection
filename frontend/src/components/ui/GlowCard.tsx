"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "amber" | "emerald" | "rose" | "blue";
  onClick?: () => void;
}

const glowColorMap = {
  cyan: { base: 195, spread: 200 },
  amber: { base: 38, spread: 40 },
  emerald: { base: 155, spread: 180 },
  rose: { base: 355, spread: 20 },
  blue: { base: 220, spread: 200 },
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "cyan",
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;
        cardRef.current.style.setProperty("--x", relativeX.toFixed(2));
        cardRef.current.style.setProperty("--y", relativeY.toFixed(2));
      }
    };

    const element = cardRef.current;
    if (element) {
      element.addEventListener("pointermove", syncPointer);
    }
    return () => {
      if (element) {
        element.removeEventListener("pointermove", syncPointer);
      }
    };
  }, []);

  const { base } = glowColorMap[glowColor];

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        // @ts-ignore
        "--base": base,
      }}
      className={`
        relative rounded-xl border border-white/10 bg-[#0b0f19]/90 p-5 backdrop-blur-md transition-all duration-300
        hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        before:pointer-events-none before:absolute before:-inset-px before:rounded-xl before:opacity-0 before:transition-opacity before:duration-300
        hover:before:opacity-100
        before:bg-[radial-gradient(400px_circle_at_var(--x,0px)_var(--y,0px),hsla(var(--base),100%,50%,0.08),transparent_80%)]
        ${className}
      `}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};
