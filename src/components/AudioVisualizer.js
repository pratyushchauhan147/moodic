"use client";
import { motion } from "framer-motion";

export default function AudioVisualizer({ isPlaying, color }) {
  // If not playing, just show a flat line
  if (!isPlaying) {
    return (
      <div className="flex h-6 items-end gap-1 opacity-50">
        <div className="h-1 w-1 rounded-full bg-white/50"></div>
        <div className="h-1 w-1 rounded-full bg-white/50"></div>
        <div className="h-1 w-1 rounded-full bg-white/50"></div>
      </div>
    );
  }

  // If playing, show jumping bars
  return (
    <div className="flex h-6 items-end justify-center gap-[3px]">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: "10%" }}
          animate={{
            height: ["20%", "80%", "40%", "90%", "30%"],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            delay: i * 0.1, // Stagger the animation so they don't move in unison
          }}
          className="w-1.5 rounded-t-sm shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ backgroundColor: color || "#fff" }}
        />
      ))}
    </div>
  );
}