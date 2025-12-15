import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title, artist } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // Official YouTube Search
    const query = `${title} ${artist} official audio`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      return NextResponse.json({ videoId: data.items[0].id.videoId });
    } else {
      return NextResponse.json({ error: "Not found" });
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed" });
  }
}