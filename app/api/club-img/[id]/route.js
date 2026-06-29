import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Referer': 'https://sofifa.com/',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
};

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') && !ct.includes('octet-stream')) return null;
    const buf = await res.arrayBuffer();
    // Reject tiny/transparent images (under 300 bytes)
    if (buf.byteLength < 300) return null;
    return buf;
  } catch {
    return null;
  }
}

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) return new NextResponse(null, { status: 400 });

  // Try multiple URL patterns for sofifa team logos
  const urls = [
    `https://cdn.sofifa.net/teams/${id}/light_60.png`,
    `https://cdn.sofifa.net/teams/${id}/60.png`,
    `https://cdn.sofifa.net/teams/${id}/dark_60.png`,
    `https://cdn.sofifa.net/teams/${id}/light_120.png`,
  ];

  for (const url of urls) {
    const buf = await tryFetch(url);
    if (buf) {
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=604800, immutable',
        },
      });
    }
  }

  // Try wsrv.nl proxy as last resort
  const buf2 = await tryFetch(
    `https://wsrv.nl/?url=cdn.sofifa.net/teams/${id}/light_60.png&w=60&h=60`
  );
  if (buf2) {
    return new NextResponse(buf2, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  // Return 404 — NOT a transparent PNG — so ClubLogo's onError fires
  // and the component falls back to the styled text abbreviation
  return new NextResponse(null, { status: 404 });
}
