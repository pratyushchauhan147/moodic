import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* ======================================================
   CONFIG
====================================================== */

// 🔁 Switch provider: "gemini" | "groq"
const PROVIDER = "groq";

/* ======================================================
   CLIENTS
====================================================== */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);


function cleanAndParseJSON(text) {
  try {
    // 1. Remove markdown code blocks
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "");

    // 2. Find the first '{' and the last '}' to strip outside noise
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 3. Attempt parse
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parsing Failed on text:", text);
    throw new Error("Model returned invalid JSON structure");
  }
}
/* ======================================================
   GEMINI HELPER
====================================================== */

async function getThemeAndRecommendationsGemini(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return cleanAndParseJSON(text);
}



/* ======================================================
   GROQ HELPER
====================================================== */

async function getThemeAndRecommendationsGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You are a strict JSON API. Respond ONLY with valid raw JSON. No markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = completion.choices[0].message.content;
  return cleanAndParseJSON(text);
}

/* ======================================================
   PROVIDER ROUTER
====================================================== */

async function getThemeAndRecommendations(prompt) {
  if (PROVIDER === "groq") {
    return getThemeAndRecommendationsGroq(prompt);
  }
  return getThemeAndRecommendationsGemini(prompt);
}

/* ======================================================
   MAIN API HANDLER
====================================================== */

export async function POST(req) {
  try {
    const { mood, genre } = await req.json();

    /* ---------- 1. CREATE USER EMBEDDING ---------- */
    // Convert the user's mood text into a vector
    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const embeddingResult = await embeddingModel.embedContent(mood);
    const userVector = embeddingResult.embedding.values;

    /* ---------- 2. HYBRID VECTOR SEARCH (Optimized) ---------- */
    // We call the single SQL function we created.
    // This searches both lyrics and overall vibe in one go.
    
    const { data: songs, error } = await supabase.rpc("match_hybrid_songs", {
      query_embedding: userVector,
      match_threshold: 0.20, // Adjust sensitivity
      match_count: 20,       // Pool of candidates
      lyrics_weight: 1.1     // 10% score boost if matched via lyrics
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      throw new Error(`Database search failed: ${error.message}`);
    }

    if (!songs || songs.length === 0) {
      // Return 200 with empty list if no songs found (handled gracefully by UI)
      return NextResponse.json({
         theme: { moodName: "Neutral", hexColor: "#1f2937" },
         recommendations: [] 
      });
    }

    /* ---------- 3. PROMPT BUILD ---------- */
    // Sort candidates by the weighted similarity score returned by DB
    const sortedSongs = songs.sort((a, b) => b.similarity - a.similarity);

    const candidates = sortedSongs
      .map((s, i) => `ID ${i}: "${s.title}" by "${s.artist}" [Matched via: ${s.source}]`)
      .join("\n");

    const prompt = `
User Input: "${mood}"
Preferred Genre: "${genre || "pop"}"
Preferred Language: "english"

Candidate Songs (ranked by similarity):
${candidates}

Task 1: Analyze the user's input and determine a clear visual and emotional "vibe".
Task 2: Select the TOP 8 songs from the candidates that best match this vibe.

Color Rules (VERY IMPORTANT):
- Return ONLY a BACKGROUND color.
- Must have high contrast with white text (#FFFFFF).
- Use deep, dark, or saturated colors.
- Avoid light, pastel, neon colors.

Song Rules:
- Strong emotional match only.
- ONE short sentence explaining why each song fits.

Output Rules:
- STRICT raw JSON
- NO markdown
- EXACT format below

{
  "theme": {
    "moodName": "Short mood name",
    "hexColor": "#RRGGBB"
  },
  "recommendations": [
    {
      "title": "Exact Title",
      "artist": "Exact Artist",
      "reason": "Short reason"
    }
  ]
}
`;

    /* ---------- 4. LLM CALL ---------- */

    const data = await getThemeAndRecommendations(prompt);

    return NextResponse.json(data);

  } catch (error) {
    console.error("API Error:", error);

    // 🚨 Return a 500 status so the frontend knows to Retry or Show Error
    return NextResponse.json(
      { 
        message: error.message || "Internal Server Error",
        code: error.code || "UNKNOWN_ERROR"
      },
      { status: 500 }
    );
  }
}