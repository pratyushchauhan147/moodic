"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Music, Loader2, ExternalLink, Disc, ArrowLeft, Sparkles } from "lucide-react";
import MoodBackground from "@/components/MoodBackground";

export default function SimpleList() {
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    setRecommendations([]); 

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ mood, genre }),
      });
      const data = await res.json();
      
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Wrap in MoodBackground to match the rest of the app
    <MoodBackground mood={mood}>
      <div className="min-h-screen flex flex-col items-center p-6 font-sans text-white">
        
        {/* --- NAVIGATION --- */}
        <nav className="w-full max-w-4xl flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
             <Link 
                href="/" 
                className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition group"
             >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                Back to Home
            </Link>
            <div className="flex items-center gap-2">
                <Disc className="text-white/80" size={20} />
                <span className="font-bold text-xl tracking-tighter">MOODic.</span>
            </div>
        </nav>

        {/* --- INPUT CARD (Glassmorphism) --- */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-black/30 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden"
        >
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-6">
                <div>
                    <label className="text-xs text-white/50 font-bold uppercase tracking-widest ml-1 flex items-center gap-2 mb-2">
                        <Sparkles size={12} /> How are you feeling?
                    </label>
                    <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-white/30 focus:bg-black/60 transition text-lg placeholder-white/20 min-h-[100px] resize-none"
                        placeholder="I'm feeling nostalgic about summer nights..."
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-white/50 font-bold uppercase tracking-widest ml-1 mb-2 block">Genre (Optional)</label>
                        <input
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-white/30 focus:bg-black/60 transition text-sm placeholder-white/20"
                            placeholder="e.g. Lo-Fi, Jazz, Rock"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    
                    <button 
                        onClick={handleSearch}
                        disabled={loading || !mood}
                        className="self-end w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-bold h-[54px] px-8 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2 shadow-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        {loading ? "Curating..." : "Find"}
                    </button>
                </div>
            </div>
        </motion.div>

        {/* --- RESULTS LIST --- */}
        <div className="w-full max-w-2xl space-y-4 pb-12">
            {recommendations.length > 0 && (
                <motion.h2 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-xl font-bold text-white mb-6 pl-1 tracking-tight"
                >
                    Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">MOODic</span> Playlist
                </motion.h2>
            )}

            <AnimatePresence>
                {recommendations.map((song, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 p-5 rounded-2xl flex items-center justify-between transition-all"
                    >
                        <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white transition-colors">
                                    <Music size={14} />
                                </div>
                                <h3 className="font-bold text-lg text-white">{song.title}</h3>
                            </div>
                            <p className="text-white/60 text-sm font-medium mb-2 ml-11">{song.artist}</p>
                            <p className="text-white/30 text-xs italic ml-11 border-l-2 border-white/10 pl-3 leading-relaxed">
                                "{song.reason}"
                            </p>
                        </div>
                        
                        <a 
                            href={song.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/5 hover:bg-red-600 hover:text-white rounded-full flex items-center justify-center text-white/40 transition-all shadow-lg hover:scale-110"
                            title="Listen on YouTube"
                        >
                            <ExternalLink size={18} />
                        </a>
                    </motion.div>
                ))}
            </AnimatePresence>

            {!loading && recommendations.length === 0 && mood && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white/20 mt-12 text-sm">
                    Results will appear here...
                </motion.div>
            )}
        </div>

      </div>
    </MoodBackground>
  );
}