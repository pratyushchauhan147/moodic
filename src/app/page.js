"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BrainCircuit, Database, Music, List } from "lucide-react";
import MoodBackground from "@/components/MoodBackground";

export default function LandingPage() {
  return (
    <MoodBackground>
      <div className="min-h-screen flex flex-col font-sans text-white">
        
        {/* Navigation */}
        <nav className="p-6 flex justify-between items-center animate-in fade-in duration-1000">
          <div className="flex items-center gap-2">
            <Music className="text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tighter">VibeSync.</h1>
          </div>
          <div className="flex gap-4 text-sm font-medium">
             <Link href="/simplelist" className="hover:text-purple-300 transition">Lite Mode</Link>
             <Link href="/moodplayer" className="hover:text-purple-300 transition">Immersive Player</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium uppercase tracking-widest text-purple-300 mb-6">
              <Sparkles size={12} />
              <span>Next-Gen Music Discovery</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
              Music that understands <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                how you feel.
              </span>
            </h1>

            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              VibeSync uses semantic AI to translate your raw emotions into the perfect sonic landscape. Choose your experience below.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Option 1: The Immersive Player */}
                <Link href="/moodplayer">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg tracking-wide shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_-15px_rgba(168,85,247,0.7)] transition-all"
                >
                    Start Immersive
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                </Link>

                {/* Option 2: The Simple List */}
                <Link href="/simplelist">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold text-lg tracking-wide hover:bg-white/20 transition-all backdrop-blur-md"
                >
                    <List size={20} />
                    Quick List
                </motion.button>
                </Link>
            </div>

          </motion.div>
        </main>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 max-w-6xl mx-auto w-full mb-12">
          <FeatureCard 
            icon={<BrainCircuit className="text-blue-400"/>} 
            title="Gemini AI Reasoning" 
            desc="We don't just match tags. Our AI reads your prompt to understand the nuance of your mood."
          />
          <FeatureCard 
            icon={<Database className="text-green-400"/>} 
            title="Vector Search" 
            desc="Powered by Supabase Embeddings to find songs that match the semantic meaning of your words."
          />
          <FeatureCard 
            icon={<Music className="text-pink-400"/>} 
            title="Smart Curation" 
            desc="Filters 10,000+ songs down to the perfect 5 that match both your Vibe and Genre."
          />
        </div>

        <footer className="p-6 text-center text-white/20 text-xs">
          © 2025 VibeSync Project. Powered by Google Gemini & Supabase.
        </footer>

      </div>
    </MoodBackground>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-colors">
      <div className="mb-4 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </div>
  );
}