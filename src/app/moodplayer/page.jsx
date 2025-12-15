"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Loader2, Disc, Music, X, Play, Sparkles 
} from "lucide-react";
import MoodBackground from "@/components/MoodBackground"; 

export default function MoodPlayerPage() {
  // --- STATES ---
  const [moodInput, setMoodInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [songs, setSongs] = useState([]);
  
  // Theme State
  const [themeState, setThemeState] = useState({
    moodName: "neutral",
    hexColor: "#1f2937"
  });

  const [loadingList, setLoadingList] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [videoOptions, setVideoOptions] = useState([]);   
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null); 

  // --- API 1: GET RECOMMENDATIONS ---
  const handleAiSearch = async () => {
    if (!moodInput.trim()) return;
    setLoadingList(true);
    setSongs([]);
    setVideoOptions([]);
    setSelectedSong(null);
    setActiveVideoId(null);
    
    try {
      const res = await fetch("/api/libeplay/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: moodInput, genre: genreInput }),
      });
      const data = await res.json();
      
      if (data.recommendations) setSongs(data.recommendations);
      if (data.theme) {
        setThemeState({
          moodName: data.theme.moodName || moodInput,
          hexColor: data.theme.hexColor
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  // --- API 2: SEARCH YOUTUBE ---
  const handleSongClick = async (song) => {
    if (selectedSong?.title === song.title) {
        setSelectedSong(null);
        return;
    }
    setSelectedSong(song);
    setVideoOptions([]);
    setLoadingOptions(true);

    try {
      const res = await fetch("/api/libeplay/search-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: song.title, artist: song.artist }),
      });
      const data = await res.json();
      if (data.results) setVideoOptions(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const playVideo = (videoId) => {
    setActiveVideoId(videoId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <MoodBackground mood={themeState.moodName} hexColor={themeState.hexColor}>
      <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans text-white">

        {/* --- 1. MINIMAL HEADER --- */}
        <header className="mb-8 mt-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 ${activeVideoId ? "animate-spin-slow" : ""}`}>
               <Disc size={24} className="text-white" />
             </div>
             <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
               Moodic.
             </h1>
          </div>
          
          {/* Subtle Mood Badge (Only shows if active) */}
          {themeState.moodName !== "neutral" && (
             <span className="text-sm font-medium tracking-widest uppercase text-white/60 bg-white/5 px-3 py-1 rounded-full">
               {themeState.moodName}
             </span>
          )}
        </header>

        {/* --- 2. ACTIVE PLAYER (Floats on top) --- */}
        <AnimatePresence>
          {activeVideoId && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl mb-8 z-50 sticky top-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl">
                <button 
                  onClick={() => setActiveVideoId(null)}
                  className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-white hover:text-black transition"
                >
                  <X size={16} />
                </button>

                <div className="aspect-video w-full bg-black">
                  <iframe 
                    width="100%" height="100%" 
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`} 
                    title="YouTube" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 3. SEARCH BAR (Glassmorphism) --- */}
        <div className={`w-full max-w-xl transition-all duration-700 ${activeVideoId ? "opacity-60 hover:opacity-100" : "opacity-100"}`}>
            <div className="relative group">
                {/* Glow Effect behind input */}
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 opacity-50 blur group-hover:opacity-75 transition" />
                
                <div className="relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur-xl">
                    <input
                        className="w-full bg-transparent p-4 text-xl font-medium text-white placeholder-white/50 outline-none text-center"
                        placeholder="How are you feeling?"
                        value={moodInput}
                        onChange={e => setMoodInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                    />
                    <div className="flex items-center gap-2 border-t border-white/10 pt-2 px-2 pb-1">
                        <Sparkles size={14} className="text-white/40" />
                        <input 
                            className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/40 outline-none"
                            placeholder="Add a genre? (Optional)"
                            value={genreInput}
                            onChange={e => setGenreInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                        />
                        <button 
                            onClick={handleAiSearch}
                            disabled={loadingList}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
                        >
                            {loadingList ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 4. RESULTS LIST --- */}
        <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {songs.map((song, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:-translate-y-1"
              >
                <div onClick={() => handleSongClick(song)} className="cursor-pointer p-5">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-full bg-white/5 group-hover:bg-white group-hover:text-black transition">
                           <Play size={16} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">{song.genre}</span>
                    </div>
                    
                    <h3 className="font-bold text-lg leading-tight mb-1">{song.title}</h3>
                    <p className="text-sm text-white/60 mb-3">{song.artist}</p>
                    <p className="text-xs text-white/40 italic">"{song.reason}"</p>
                </div>

                {/* Sub-menu for Video Selection */}
                <AnimatePresence>
                    {selectedSong?.title === song.title && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="bg-black/20 border-t border-white/5"
                        >
                            <div className="p-3 space-y-2">
                                {loadingOptions && <div className="flex justify-center p-2"><Loader2 size={16} className="animate-spin text-white/50"/></div>}
                                {!loadingOptions && videoOptions.length === 0 && <p className="text-center text-xs text-white/30">No videos found</p>}
                                
                                {videoOptions.map((video) => (
                                    <div 
                                        key={video.id}
                                        onClick={() => playVideo(video.id)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition"
                                    >
                                        <img src={video.thumbnail} className="w-12 h-8 object-cover rounded" />
                                        <div className="overflow-hidden">
                                            <p className="truncate text-xs font-bold text-white">{video.title}</p>
                                            <p className="text-[10px] text-white/50">{video.channel}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </MoodBackground>
  );
}