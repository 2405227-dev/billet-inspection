"use client";

import React from "react";

interface IndustrialHeroBackgroundProps {
  children?: React.ReactNode;
  imageSrc?: string;
  className?: string;
  accent?: "red" | "amber" | "emerald" | "blue" | string;
}

export const IndustrialHeroBackground: React.FC<IndustrialHeroBackgroundProps> = ({
  children,
  imageSrc = "/images/industrial/steel-mill-dark.jpg",
  className = "",
  accent = "red",
}) => {
  const accentGlow = {
    red: "rgba(237, 28, 39, 0.08)",
    amber: "rgba(245, 158, 11, 0.08)",
    emerald: "rgba(16, 185, 129, 0.08)",
    blue: "rgba(56, 189, 248, 0.08)",
  }[accent as "red" | "amber" | "emerald" | "blue"] || "rgba(237, 28, 39, 0.08)";

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Darkened Industrial Photography Layer */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity filter brightness-75 contrast-125"
        style={{
          backgroundImage: `url('${imageSrc}')`,
        }}
      />

      {/* Dark Gradient Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07080b]/85 via-[#07080b]/92 to-[#07080b]" />

      {/* Subtle Technical Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% -20%, ${accentGlow}, rgba(255,255,255,0))`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
};
