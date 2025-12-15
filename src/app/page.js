"use client";
import { useState } from "react";
import { Send, Music, Loader2, ExternalLink, Headphones } from "lucide-react";

export default function Home() {
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    setRecommendations([]); // Clear old results

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
    <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col items-center p-6">
      
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Headphones className="text-purple-500 w-8 h-8" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            VibeSync
          </h1>
        </div>
        <p className="text-gray-400">Describe your mood, pick your genre, get the perfect playlist.</p>
      </header>

      {/* Input Section */}
      <div className="w-full max-w-2xl bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl mb-8">
        <div className="flex flex-col gap-4">
          
          {/* Mood Input */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider ml-1">How are you feeling?</label>
            <textarea
              className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-1 focus:outline-none focus:border-purple-500 transition text-sm min-h-[80px]"
              placeholder="Ex: I'm feeling overwhelmed with work but optimistic about the future..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </div>

          {/* Genre Input */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider ml-1">Preferred Genre (Optional)</label>
            <input
              className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-1 focus:outline-none focus:border-purple-500 transition text-sm"
              placeholder="Ex: Lo-Fi, Rock, 90s Rap, Acoustic..."
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Search Button */}
          <button 
            onClick={handleSearch}
            disabled={loading || !mood}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            {loading ? "Curating Playlist..." : "Find Songs"}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full max-w-2xl space-y-4">
        {recommendations.length > 0 && (
          <h2 className="text-xl font-bold text-white mb-4 pl-1">Your Vibe Playlist</h2>
        )}

        {recommendations.map((song, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-center justify-between hover:bg-gray-800 transition group">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <Music size={16} className="text-purple-400" />
                <h3 className="font-bold text-lg text-white">{song.title}</h3>
              </div>
              <p className="text-purple-300 text-sm font-medium mb-2">{song.artist}</p>
              <p className="text-gray-400 text-sm italic">"{song.reason}"</p>
            </div>
            
            <a 
              href={song.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full shadow-lg transition transform group-hover:scale-110"
              title="Listen on YouTube"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        ))}
        
        {!loading && recommendations.length === 0 && mood && (
          <div className="text-center text-gray-500 mt-10">
            Results will appear here...
          </div>
        )}
      </div>

    </div>
  );
}