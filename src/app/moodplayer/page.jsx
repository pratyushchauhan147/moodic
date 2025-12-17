"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Loader2, Disc, X, Play, Sparkles, Mic, Layers, AlertCircle 
} from "lucide-react";
import MoodBackground from "@/components/MoodBackground"; 

export default function MoodPlayerPage() {
  // --- STATES ---
  const [moodInput, setMoodInput] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [songs, setSongs] = useState([]);
  
  const [searchMode, setSearchMode] = useState("overall"); 

  // Theme State
  const [themeState, setThemeState] = useState({
    moodName: "neutral",
    hexColor: "#1f2937"
  });

  // Loading & Error States
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(""); // Dynamic status text
  const [errorMessage, setErrorMessage] = useState(null);   // Final error message

  const [selectedSong, setSelectedSong] = useState(null);
  const [videoOptions, setVideoOptions] = useState([]);   
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null); 

  // --- API HANDLER WITH RETRY LOGIC ---
  const handleAiSearch = async () => {
    if (!moodInput.trim()) return;
    
    // Reset UI states
    setLoadingList(true);
    setLoadingMessage("");
    setErrorMessage(null);
    setSongs([]);
    setVideoOptions([]);
    setSelectedSong(null);
    setActiveVideoId(null);
    
    const endpoint = searchMode === "lyrics" 
        ? "/api/lyricsembopt"       
        : "/api/libeplay/list";

    // --- RETRY FUNCTION ---
    const fetchWithRetry = async (retries = 3, delay = 1500) => {
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mood: moodInput, genre: genreInput }),
            });

            // If API returns 500 range or specific timeout errors, throw to trigger catch block
            if (!res.ok) {
                const errData = await res.json().catch(() => ({})); 
                throw new Error(errData.message || `HTTP ${res.status}`);
            }

            return await res.json();
            
        } catch (err) {
            if (retries > 1) {
                // If failed, wait and try again
                setLoadingMessage("Taking a little longer, please wait...");
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(retries - 1, delay); // Recursive retry
            } else {
                // No retries left
                throw err;
            }
        }
    };

    try {
      // Start the fetch process
      const data = await fetchWithRetry();
      
      if (data.recommendations) setSongs(data.recommendations);
      
      if (data.theme) {
        setThemeState({
          moodName: data.theme.moodName || moodInput,
          hexColor: data.theme.hexColor || "#1f2937"
        });
      }

    } catch (e) {
      console.error("Search failed after retries:", e);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoadingList(false);
      setLoadingMessage("");
    }
  };

  // --- YOUTUBE SEARCH ---
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

        {/* --- 1. HEADER --- */}
        <header className="mb-6 mt-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 ${activeVideoId ? "animate-spin-slow" : ""}`}>
               <Disc size={24} className="text-white" />
             </div>
             <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
               Moodic.
             </h1>
          </div>
          {themeState.moodName !== "neutral" && (
             <span className="text-sm font-medium tracking-widest uppercase text-white/60 bg-white/5 px-3 py-1 rounded-full">
               {themeState.moodName}
             </span>
          )}
        </header>

        {/* --- 2. ACTIVE PLAYER --- */}
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

        {/* --- 3. SEARCH SECTION --- */}
        <div className={`w-full max-w-xl flex flex-col gap-4 transition-all duration-700 ${activeVideoId ? "opacity-60 hover:opacity-100" : "opacity-100"}`}>
            
            {/* --- TOGGLE --- */}
            <div className="flex justify-center">
                <div className="flex p-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-full relative">
                    <button
                        onClick={() => setSearchMode("overall")}
                        className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            searchMode === "overall" ? "text-white" : "text-white/50 hover:text-white/80"
                        }`}
                    >
                        <Layers size={14} />
                        <span>Overall</span>
                        {searchMode === "overall" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setSearchMode("lyrics")}
                        className={`relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                            searchMode === "lyrics" ? "text-white" : "text-white/50 hover:text-white/80"
                        }`}
                    >
                        <Mic size={14} />
                        <span>Lyrics</span>
                        {searchMode === "lyrics" && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* --- INPUT BOX --- */}
            <div className="relative group">
                <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r opacity-50 blur transition ${errorMessage ? "from-red-500/50 to-orange-500/50" : "from-white/20 to-white/10 group-hover:opacity-75"}`} />
                <div className="relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur-xl">
                    <input
                        className="w-full bg-transparent p-4 text-xl font-medium text-white placeholder-white/50 outline-none text-center"
                        placeholder={searchMode === "overall" ? "How are you feeling? (General Vibe)" : "How are you feeling? (Lyrical Match)"}
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
            
            {/* --- STATUS / ERROR MESSAGE --- */}
            <div className="h-6 flex justify-center items-center">
                {loadingMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-yellow-300/80">
                         <Loader2 size={12} className="animate-spin" />
                         {loadingMessage}
                    </motion.div>
                )}
                {errorMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-red-400">
                         <AlertCircle size={12} />
                         {errorMessage}
                    </motion.div>
                )}
            </div>
        </div>

        {/* --- 4. RESULTS LIST --- */}
        <div className="mt-8 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                        <img src={video.thumbnail} className="w-12 h-8 object-cover rounded" alt="thumb" />
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