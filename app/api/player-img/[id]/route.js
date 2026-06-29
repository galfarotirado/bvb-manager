import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.futbin.com/',
  'Connection': 'keep-alive',
};

async function tryFetch(url, headers) {
  try {
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') && !ct.includes('octet-stream')) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 200) return null;
    return buf;
  } catch {
    return null;
  }
}

// Crop the face area from a 512x512 FIFA card image using sharp
// FIFA cards have the player's head roughly in the top-center portion
async function cropFaceFromCard(cardBuf) {
  try {
    const buf = Buffer.from(cardBuf);
    const meta = await sharp(buf).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    // Face+shoulders area: top ~60% of card, wide crop to avoid over-zoom
    const left   = Math.floor(w * 0.05);
    const top    = 0;
    const width  = Math.floor(w * 0.90);
    const height = Math.floor(h * 0.60);

    return await sharp(buf)
      .extract({ left, top, width, height })
      .resize(120, 120, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) return new NextResponse(null, { status: 400 });

  const ok = (buf) => new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });

  // 1. Futbin card → crop face with sharp (most reliable actual face source)
  for (const v of ['25', '26']) {
    const cardBuf = await tryFetch(
      `https://cdn.futbin.com/content/fifa${v}/img/players/${id}.png`,
      { ...BROWSER_HEADERS, 'Referer': 'https://www.futbin.com/' }
    );
    if (cardBuf) {
      const face = await cropFaceFromCard(cardBuf);
      if (face) return ok(face);
      // If crop fails, return the raw card (better than nothing)
      return ok(cardBuf);
    }
  }

  // 2. wsrv.nl → sofifa 60px face (bypasses CDN hotlink protection)
  for (const v of ['25', '26']) {
    const buf = await tryFetch(
      `https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/${v}_60.png&w=60&h=60&output=png`,
      { 'User-Agent': BROWSER_HEADERS['User-Agent'] }
    );
    if (buf && buf.byteLength > 1500) return ok(buf); // skip tiny generic silhouettes
  }

  // 3. Sofifa direct (server-side)
  for (const v of ['26', '25']) {
    const buf = await tryFetch(`https://cdn.sofifa.net/players/${id}/${v}_60.png`, BROWSER_HEADERS);
    if (buf && buf.byteLength > 1500) return ok(buf);
  }

  // 4. No image found
  return new NextResponse(null, { status: 404 });
}
