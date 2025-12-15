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
   GEMINI CURATION
====================================================== */

async function curateWithGemini(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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
   GROQ CURATION
====================================================== */

async function curateWithGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.6,
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

async function curateSongs(prompt) {
  if (PROVIDER === "groq") {
    return curateWithGroq(prompt);
  }

  return curateWithGemini(prompt);
}

/* ======================================================
   API HANDLER
====================================================== */

export async function POST(req) {
  try {
    /* ---------- 1. INPUT ---------- */

    const { mood, genre } = await req.json();

    if (!mood) {
      return NextResponse.json(
        { error: "Mood is required" },
        { status: 400 }
      );
    }

    /* ---------- 2. EMBEDDINGS (Gemini only) ---------- */

    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const embeddingResult = await embeddingModel.embedContent(mood);
    const userVector = embeddingResult.embedding.values;

    /* ---------- 3. VECTOR SEARCH ---------- */

    const { data: songs, error } = await supabase.rpc("match_songs", {
      query_embedding: userVector,
      match_threshold: 0.25,
      match_count: 50,
    });

    if (error) throw error;
    if (!songs || songs.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    /* ---------- 4. PROMPT ---------- */

    const candidates = songs
      .map((s, i) => `ID ${i}: "${s.title}" by "${s.artist}"`)
      .join("\n");

    const prompt = `
You are an expert Music Curator.

User Mood: "${mood}"
User Preferred Genre: "${genre || "Any"}"

Here are 50 candidate songs selected based on lyrical similarity:
${candidates}

TASK:
1. Select the BEST 5-10 songs that match BOTH the user's mood AND genre preference.
2. If the user prefers a genre, STRICTLY exclude songs from other genres.
3. For each selected song, write a single-sentence explanation describing the vibe match.
4. Return ONLY valid raw JSON in this format:

[
  {
    "title": "Song Name",
    "artist": "Artist Name",
    "reason": "Why this song fits the mood and genre"
  }
]
`;

    /* ---------- 5. LLM CURATION ---------- */

    const recommendations = await curateSongs(prompt);

    /* ---------- 6. ADD YOUTUBE LINKS ---------- */

    const finalRecommendations = recommendations.map((rec) => ({
      ...rec,
      link: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${rec.title} ${rec.artist} official audio`
      )}`,
    }));

    return NextResponse.json({ recommendations: finalRecommendations });

  } catch (error) {
    console.error("Mood Curator API Error:", error);

    return NextResponse.json(
      { error: "Failed to curate playlist." },
      { status: 500 }
    );
  }
}
