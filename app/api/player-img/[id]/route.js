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

// Sofifa 120px portrait images are clean face shots — no cropping needed,
// just resize to 120x120 centered so the face is perfectly framed.
async function processPortrait(buf) {
  try {
    const resized = await sharp(Buffer.from(buf))
      .resize(120, 120, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
    return resized;
  } catch {
    return null;
  }
}

// Crop face from FIFA futbin card (512×512 full card art).
// Used only as fallback when sofifa has no image.
async function cropFaceFromCard(cardBuf) {
  try {
    const buf = Buffer.from(cardBuf);
    const meta = await sharp(buf).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    // Skip the dark card header frame (≈15% from top), take the face region (40% height)
    // This avoids capturing dark card art and focuses on the player face
    const left   = Math.floor(w * 0.15);
    const top    = Math.floor(h * 0.12);
    const width  = Math.floor(w * 0.70);
    const height = Math.floor(h * 0.45);

    const cropped = await sharp(buf)
      .extract({ left, top, width, height })
      .resize(120, 120, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();

    // Reject if too small (blank/generic card) or likely a dark frame
    if (cropped.byteLength < 4000) return null;

    // Check average brightness — reject if image is mostly dark (card frame artifact)
    const { data } = await sharp(cropped).grayscale().raw().toBuffer({ resolveWithObject: true });
    const avg = data.reduce((s, v) => s + v, 0) / data.length;
    if (avg < 40) return null; // too dark = card frame, not a face

    return cropped;
  } catch {
    return null;
  }
}

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

  // 1. Sofifa 120px via wsrv.nl (best: clean face portrait, CDN-bypass)
  for (const v of ['25', '26']) {
    const buf = await tryFetch(
      `https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/${v}_120.png&output=png`,
      { 'User-Agent': UA },
      5000
    );
    if (buf && buf.byteLength > MIN_REAL_FACE_BYTES) {
      const processed = await processPortrait(buf);
      if (processed) return ok(processed);
    }
  }

  // 2. Sofifa 120px direct (may be blocked by CDN hotlinking)
  for (const v of ['26', '25']) {
    const buf = await tryFetch(
      `https://cdn.sofifa.net/players/${id}/${v}_120.png`,
      { 'User-Agent': UA, 'Referer': 'https://sofifa.com/' },
      4000
    );
    if (buf && buf.byteLength > MIN_REAL_FACE_BYTES) {
      const processed = await processPortrait(buf);
      if (processed) return ok(processed);
    }
  }

  // 3. Futbin card → sharp crop (fallback: may have dark card art)
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

  // Nothing found → 404 (PlayerAvatar shows initials)
  return new NextResponse(null, { status: 404 });
}
