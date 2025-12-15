import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title, artist } = await req.json();
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Clean, YouTube-friendly music query
    const query = `"${artist}" "${title}" official"`;

    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&type=video` +
      `&videoCategoryId=10` +
      `&videoEmbeddable=true` +
      `&maxResults=5` +
      `&q=${encodeURIComponent(query)}` +
      `&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    const bannedWords = [
      "short", "reel", "edit", "reaction",
      "interview", "meme", "slowed", "8d",
      "cover", "remix", "live"
    ];

    const results = (data.items || [])
      .filter(item => {
        const t = item.snippet.title.toLowerCase();
        return !bannedWords.some(w => t.includes(w));
      })
      .slice(0, 3)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channel: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

    return NextResponse.json({ results });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ results: [] });
  }
}
