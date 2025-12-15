// app/api/recommend/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/* ======================================================
   CONFIG
====================================================== */

// 🔁 Switch provider here: "gemini" | "groq"
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

    /* ---------- 1. EMBEDDINGS (Gemini only) ---------- */

    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const embeddingResult = await embeddingModel.embedContent(mood);
    const userVector = embeddingResult.embedding.values;

    /* ---------- 2. VECTOR SEARCH (SUPABASE) ---------- */

    const { data: songs, error } = await supabase.rpc("match_songs", {
      query_embedding: userVector,
      match_threshold: 0.2,
      match_count: 20,
    });

    if (error) throw error;

    /* ---------- 3. PROMPT ---------- */

    const candidates = songs
      .map((s, i) => `ID ${i}: "${s.title}" by "${s.artist}"`)
      .join("\n");

    const prompt = `
User Input: "${mood}"
Preferred Genre: "${genre || "Any"}"

Candidate Songs:
${candidates}

Task 1: Analyze the user's input and determine a clear visual and emotional "vibe".
Task 2: Select the TOP 8 songs that best match this vibe.

Color Rules (VERY IMPORTANT):
- You must return a BACKGROUND color only.
- The background color MUST have high contrast with white text (#FFFFFF).
- Choose deep, dark, or saturated colors (avoid light, pastel, or neon shades).
- The color should visually represent the mood (e.g. dark blue for calm, deep purple for mysterious, charcoal for melancholic, deep red for intense, forest green for grounded).
- Do NOT choose colors where white text would be hard to read.

Song Rules:
- Pick songs that strongly match the emotional vibe.
- For each song, write ONE short sentence explaining why it fits the vibe.

Output Rules:
- Return STRICTLY raw JSON.
- Do NOT include markdown, comments, or extra text.
- Follow the EXACT structure below.

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

    // Safe fallback
    return NextResponse.json({
      theme: { moodName: "Neutral", hexColor: "#1a1a1a" },
      recommendations: [],
    });
  }
}
