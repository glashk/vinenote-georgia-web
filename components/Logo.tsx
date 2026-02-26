"use client";

import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export default function Logo({ size = 48, className = "", animated = true, style }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const logoSrc = size <= 72 ? "/logo-144.png" : "/logo.png";

  return (
    <div
      className={`relative shrink-0 ${className} transition-transform duration-300 ${
        animated && isHovered ? "rotate-3" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: size, height: size, minWidth: size, minHeight: size, ...style }}
    >
      <Image
        src={logoSrc}
        alt="VineNote Georgia Logo"
        width={size}
        height={size}
        className="drop-shadow-lg"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        priority
        sizes={`${size}px`}
      />
      {animated && (
        <div
          className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
