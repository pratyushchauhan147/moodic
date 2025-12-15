"use client";
import { useEffect, useState } from "react";

// YOUR ORIGINAL PALETTE (Source of Truth)
const SOLID_COLORS = {
  neutral:    "#1f2937",
  party:      "#db2777",
  sad:        "#1e3a8a",
  happy:      "#eab308",
  calm:       "#059669",
  love:       "#e11d48",
  excitement: "#ea580c",
  success:    "#ca8a04",
};

export default function MoodBackground({ mood, hexColor, children }) {
  const [activeColor, setActiveColor] = useState(SOLID_COLORS.neutral);
  
  // Helper to get a lighter variant for the gradient
  const [secondaryColor, setSecondaryColor] = useState("#374151"); 

  useEffect(() => {
    let selected = SOLID_COLORS.neutral;
    const normalized = mood?.toLowerCase().trim();

    // 1. Logic: Map -> Hex -> Default
    if (SOLID_COLORS[normalized]) {
      selected = SOLID_COLORS[normalized];
    } else if (hexColor && /^#[0-9A-F]{6}$/i.test(hexColor)) {
      selected = hexColor;
    }

    setActiveColor(selected);
    
    // Create a slightly different shade for the gradient movement
    // (Simple hack: just use the same color but rely on opacity blending)
    setSecondaryColor(selected);
  }, [mood, hexColor]);

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden transition-colors duration-[2000ms] ease-in-out"
      style={{ backgroundColor: activeColor }}
    >
      {/* --- DEBUG BADGE --- */}
      <div className="fixed top-0 left-0 z-50 bg-black/20 text-white px-2 py-1 text-[10px] font-mono opacity-20 hover:opacity-100">
        MOOD: {mood || "None"}
      </div>

      {/* --- LAYER 1: The "Breathing" Gradient --- */}
      {/* This uses pure CSS animation (efficient) instead of JS (heavy) */}
      <div 
        className="absolute inset-0 z-0 opacity-60 mix-blend-overlay"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${secondaryColor}, transparent 70%)`,
          animation: "pulse-glow 8s ease-in-out infinite alternate"
        }}
      />
      
      {/* --- LAYER 2: Moving Light Beam --- */}
      <div 
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background: "conic-gradient(from 0deg at 50% 50%, transparent 180deg, white 360deg)",
          filter: "blur(80px)",
          animation: "spin-slow 20s linear infinite"
        }}
      />

      {/* --- LAYER 3: Noise Grain (Texture) --- */}
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>

      {/* --- GLOBAL STYLES FOR ANIMATION --- */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.2); opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg) scale(1.5); }
          to { transform: rotate(360deg) scale(1.5); }
        }
      `}</style>
    </div>
  );
}