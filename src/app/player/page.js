"use client";
import { useState } from "react";
import { 
  Send, Loader2, Disc, Search, Music, X
} from "lucide-react";

export default function Home() {
  // --- STATES ---
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [songs, setSongs] = useState([]);
  
  // Selection
  const [selectedSong, setSelectedSong] = useState(null);
  const [videoOptions, setVideoOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Player
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [loadingList, setLoadingList] = useState(false);

  // --- API CALLS ---
  const handleAiSearch = async () => {
    if (!mood.trim()) return;
    setLoadingList(true);
    setSongs([]);
    setVideoOptions([]);
    setSelectedSong(null);
    setCurrentVideoId(null);
    
    try {
      const res = await fetch("/api/libeplay/list", {
        method: "POST",
        body: JSON.stringify({ mood, genre }),
      });
      const data = await res.json();
      if (data.recommendations) setSongs(data.recommendations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSongClick = async (song) => {
    if (selectedSong?.title === song.title) return;
    setSelectedSong(song);
    setVideoOptions([]);
    setLoadingOptions(true);

    try {
      // --- THE FIX IS HERE ---
      // We do NOT send 'query'. We send 'title' and 'artist'.
      const res = await fetch("/api/libeplay/search-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: song.title, 
          artist: song.artist 
        }),
      });
      // -----------------------

      const data = await res.json();
      if (data.results) setVideoOptions(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const playVideo = (videoId) => {
    setCurrentVideoId(videoId);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closePlayer = () => {
    setCurrentVideoId(null);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col items-center p-4">
      
      {/* HEADER */}
      <header className="mb-6 flex items-center gap-2 mt-4">
        <Disc className={`text-purple-500 ${currentVideoId ? "animate-spin-slow" : ""}`} />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          VibeSync
        </h1>
      </header>

      {/* --- CINEMATIC VIDEO PLAYER (Standard Iframe) --- */}
      {currentVideoId && (
        <div className="w-full max-w-4xl mb-10 animate-in slide-in-from-top-4 z-50">
          
          <div className="bg-gray-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={closePlayer}
              className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {/* THE VIDEO SCREEN (16:9 Aspect Ratio) */}
            <div className="aspect-video w-full bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0&modestbranding=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>

            {/* Video Info Bar */}
            <div className="p-4 bg-gray-900 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                    <Music className="text-purple-500" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-white">{selectedSong?.title}</h2>
                   <p className="text-purple-400 text-sm">{selectedSong?.artist}</p>
                 </div>
               </div>
               <div className="text-xs text-gray-500 font-mono hidden sm:block">
                 NOW PLAYING
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SEARCH INPUTS --- */}
      <div className="w-full max-w-xl space-y-3 mb-8">
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 focus:outline-none focus:border-purple-500 transition"
          placeholder="How are you feeling? (e.g., Hyped up for gym)"
          rows={2}
          value={mood}
          onChange={e => setMood(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
             className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3"
             placeholder="Genre (Optional)"
             value={genre}
             onChange={e => setGenre(e.target.value)}
          />
          <button 
            onClick={handleAiSearch}
            disabled={loadingList}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-xl font-bold flex items-center gap-2"
          >
            {loadingList ? <Loader2 className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* --- LIST & VERSIONS --- */}
      <div className="w-full max-w-2xl space-y-3 pb-20">
        {songs.map((song, i) => (
          <div key={i} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <div 
              onClick={() => handleSongClick(song)}
              className="p-4 cursor-pointer hover:bg-gray-800 transition flex justify-between items-center"
            >
              <div>
                <h3 className={`font-bold ${selectedSong?.title === song.title ? "text-purple-400" : "text-white"}`}>
                  {song.title}
                </h3>
                <p className="text-sm text-gray-400">{song.artist}</p>
              </div>
              <Search size={16} className="text-gray-600" />
            </div>

            {selectedSong?.title === song.title && (
              <div className="bg-black/50 p-4 border-t border-gray-800 animate-in slide-in-from-top-2">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-bold">Select Video Version:</p>
                {loadingOptions ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-purple-500"/></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {videoOptions.map((video) => (
                      <div 
                        key={video.id}
                        onClick={() => playVideo(video.id)}
                        className={`
                          cursor-pointer group relative rounded-lg overflow-hidden border 
                          ${currentVideoId === video.id ? "border-purple-500 ring-2 ring-purple-500/30" : "border-gray-700 hover:border-gray-500"}
                        `}
                      >
                        <img src={video.thumbnail} alt="thumb" className="w-full h-24 object-cover opacity-80 group-hover:opacity-100 transition" />
                        <div className="absolute bottom-0 w-full bg-black/80 p-2 text-xs truncate text-gray-300">
                          {video.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}