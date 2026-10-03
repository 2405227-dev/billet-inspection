"use client";

import React from "react";

export const IndustrialGridBackground = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`relative w-full overflow-hidden bg-[#030712] ${className}`}>
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-cyan-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[400px] w-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-[450px] w-[550px] rounded-full bg-cyan-500/5 blur-[130px]" />

      {/* Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />

      {children}
    </div>
  );
};
