import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    // 1. Receive Mood AND Genre
    const { mood, genre } = await req.json();

    // 2. Vectorize the MOOD (Lyrics matching)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(mood);
    const userVector = embeddingResult.embedding.values;

    // 3. Search Supabase (Fetch a larger pool - 20 songs - to give Gemini room to filter by genre)
    const { data: songs, error } = await supabase.rpc('match_songs', {
      query_embedding: userVector,
      match_threshold: 0.25, // Lower threshold to ensure we get enough candidates
      match_count: 20
    });

    if (error) throw error;

    // 4. The "Genre & Vibe Check" (Gemini Filtering)
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const candidates = songs.map((s, i) => 
      `ID ${i}: "${s.title}" by "${s.artist}"`
    ).join("\n");

    const prompt = `
      You are an expert Music Curator.
      User Mood: "${mood}"
      User Preferred Genre: "${genre || "Any"}"
      
      Here are 20 song candidates found based on lyrics:
      ${candidates}
      
      TASK:
      1. Filter this list. Select the top 3-5 songs that match the User's Genre preference AND the Mood.
      2. If the user asked for "Rock" and a song is "Pop", DO NOT include it, even if the lyrics are good.
      3. For each selected song, write a 1-sentence "Vibe Match" explaining why the lyrics and sound fit the user's specific request.
      4. Return the result as a strictly formatted JSON list:
      [
        {
          "title": "Song Name",
          "artist": "Artist Name",
          "reason": "Why it fits..."
        }
      ]
    `;

    const result = await chatModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const recommendations = JSON.parse(result.response.text());

    // 5. Add YouTube Links to the result
    // We construct a "Search URL" which is 100% reliable (never broken)
    const finalRecs = recommendations.map(rec => ({
      ...rec,
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.title + " " + rec.artist + " official audio")}`
    }));

    return NextResponse.json({ recommendations: finalRecs });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to curate playlist." }, { status: 500 });
  }
}