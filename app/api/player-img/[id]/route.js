import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const FUTBIN_HEADERS = {
  'User-Agent': UA,
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.futbin.com/',
  'Connection': 'keep-alive',
};

async function tryFetch(url, headers, timeoutMs = 5000) {
  try {
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') && !ct.includes('octet-stream')) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 500) return null;
    return buf;
  } catch {
    return null;
  }
}

// Crop face from FIFA futbin card (512×512 full card art)
async function cropFaceFromCard(cardBuf) {
  try {
    const buf = Buffer.from(cardBuf);
    const meta = await sharp(buf).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    // Crop face+shoulders: skip top card frame (~3%), take 55% of height, 80% width centered
    const left   = Math.floor(w * 0.10);
    const top    = Math.floor(h * 0.03);
    const width  = Math.floor(w * 0.80);
    const height = Math.floor(h * 0.55);

    const cropped = await sharp(buf)
      .extract({ left, top, width, height })
      .resize(120, 120, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();

    // Reject if result is suspiciously small (blank/generic card)
    if (cropped.byteLength < 3000) return null;
    return cropped;
  } catch {
    return null;
  }
}

// Check sofifa image is a real face (not generic silhouette)
// Generic sofifa silhouettes at 120px are typically < 6 KB
const MIN_REAL_FACE_BYTES = 6000;

export async function GET(req, { params }) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) return new NextResponse(null, { status: 400 });

  const ok = (buf, type = 'image/png') => new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });

  // 1. Futbin card → sharp crop (best quality: real face, unique per player)
  for (const v of ['25', '26']) {
    const cardBuf = await tryFetch(
      `https://cdn.futbin.com/content/fifa${v}/img/players/${id}.png`,
      FUTBIN_HEADERS,
      6000
    );
    if (cardBuf && cardBuf.byteLength > 5000) {
      const face = await cropFaceFromCard(cardBuf);
      if (face) return ok(face);
    }
  }

  // 2. Sofifa 120px via wsrv.nl proxy (bypasses CDN hotlink, good quality)
  for (const v of ['25', '26']) {
    const buf = await tryFetch(
      `https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/${v}_120.png&output=png`,
      { 'User-Agent': UA },
      5000
    );
    if (buf && buf.byteLength > MIN_REAL_FACE_BYTES) return ok(buf);
  }

  // 3. Sofifa 120px direct (server-side, may be blocked by CDN)
  for (const v of ['26', '25']) {
    const buf = await tryFetch(
      `https://cdn.sofifa.net/players/${id}/${v}_120.png`,
      { 'User-Agent': UA, 'Referer': 'https://sofifa.com/' },
      4000
    );
    if (buf && buf.byteLength > MIN_REAL_FACE_BYTES) return ok(buf);
  }

  // 4. Sofifa 60px as last resort — only return if it looks like a real face
  for (const v of ['25', '26']) {
    const buf = await tryFetch(
      `https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/${v}_60.png&output=png`,
      { 'User-Agent': UA },
      4000
    );
    if (buf && buf.byteLength > 2500) return ok(buf);
  }

  // Nothing found → 404 (PlayerAvatar will show initials fallback)
  return new NextResponse(null, { status: 404 });
}
