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

/* ======================================================
   GEMINI IMPLEMENTATION
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

  let text = result.response.text();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}

/* ======================================================
   GROQ IMPLEMENTATION
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

  let text = completion.choices[0].message.content;
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
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
   API HANDLER
====================================================== */

export async function POST(req) {
  try {
    const { mood, genre } = await req.json();

    /* ---------- 1. CREATE USER EMBEDDING ---------- */

    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const embeddingResult = await embeddingModel.embedContent(mood);
    const userVector = embeddingResult.embedding.values;

    /* ---------- 2. VECTOR SEARCH (MERGED STRATEGY) ---------- */

    // 2.1 Lyrics-heavy search (primary)
    const lyricsSearch = await supabase.rpc("match_songs_lyrics", {
      query_embedding: userVector,
      match_threshold: 0.25,
      match_count: 20,
    });

    if (lyricsSearch.error) throw lyricsSearch.error;

    // 2.2 Normal embedding search (fallback)
    const normalSearch = await supabase.rpc("match_songs", {
      query_embedding: userVector,
      match_threshold: 0.2,
      match_count: 20,
    });

    if (normalSearch.error) throw normalSearch.error;

    // 2.3 Merge + dedupe (lyrics results have priority)
    const mergedMap = new Map();

    (lyricsSearch.data || []).forEach((song) => {
      mergedMap.set(song.id, {
        ...song,
        source: "lyrics",
      });
    });

    (normalSearch.data || []).forEach((song) => {
      if (!mergedMap.has(song.id)) {
        mergedMap.set(song.id, {
          ...song,
          source: "normal",
        });
      }
    });

    // 2.4 Final ranked list
    const songs = Array.from(mergedMap.values())
      .sort((a, b) => {
        if (a.source !== b.source) {
          return a.source === "lyrics" ? -1 : 1;
        }
        return b.similarity - a.similarity;
      })
      .slice(0, 20);

    /* ---------- 3. PROMPT BUILD ---------- */

    const candidates = songs
      .map((s, i) => `ID ${i}: "${s.title}" by "${s.artist}"`)
      .join("\n");

    const prompt = `
User Input: "${mood}"
Preferred Genre: "${genre || "pop"}"
Preferred Language: "english"

Candidate Songs:
${candidates}

Task 1: Analyze the user's input and determine a clear visual and emotional "vibe".
Task 2: Select the TOP 8 songs that best match this vibe.

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

    return NextResponse.json({
      theme: { moodName: "Neutral", hexColor: "#1a1a1a" },
      recommendations: [],
    });
  }
}
