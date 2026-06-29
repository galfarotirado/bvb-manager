/**
 * download-faces-v2.js
 * ─────────────────────────────────────────────────────────────────
 * Descarga caras de jugadores con crop real usando sharp.
 * Fuente: futbin CDN (512×512 carta completa) → crop cara → 60×60 PNG
 * Fallback: wsrv.nl → sofifa 60px
 *
 * Obtiene los sofifa_ids directamente de Supabase (liga_jugadores + bvb_plantilla)
 * para evitar IDs hardcodeados incorrectos.
 *
 * REQUISITOS:
 *   - Node.js 18+
 *   - .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - npm install (para tener sharp en node_modules)
 *
 * EJECUTAR desde bvb-manager/:
 *   node download-faces-v2.js
 *
 * Para re-descargar solo los que faltan:
 *   node download-faces-v2.js --skip-existing
 *
 * Para forzar re-descarga de todo:
 *   node download-faces-v2.js --force
 * ─────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────
const OUTPUT_DIR    = path.join(__dirname, 'public', 'players');
const DELAY_MS      = 350;           // delay entre peticiones (ms)
const MIN_VALID_BYTES = 1500;        // imágenes < 1.5KB = silhoueta genérica (descartar)
const FORCE         = process.argv.includes('--force');
const SKIP_EXISTING = !FORCE;        // por defecto saltar existentes

// Face crop coords para carta FIFA 512×512:
// la cabeza del jugador ocupa aprox. la zona superior-central del área de arte
const CROP = {
  leftPct:   0.13,   // 13% desde la izquierda
  topPct:    0.03,   //  3% desde arriba
  widthPct:  0.74,   // 74% de ancho
  heightPct: 0.42,   // 42% de alto  → cubre cabeza + hombros
};

// ── Load .env.local ───────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encuentra .env.local');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

// ── Supabase fetch ─────────────────────────────────────────────────
async function fetchAllIds(url, key) {
  const ids = new Map(); // sofifa_id → nombre

  // liga_jugadores
  const res1 = await fetch(`${url}/rest/v1/liga_jugadores?select=jugador,sofifa_id&sofifa_id=not.is.null`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (res1.ok) {
    const data = await res1.json();
    for (const p of data) if (p.sofifa_id) ids.set(p.sofifa_id, p.jugador);
  }

  // bvb_plantilla
  const res2 = await fetch(`${url}/rest/v1/bvb_plantilla?select=nombre,sofifa_id&sofifa_id=not.is.null`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  if (res2.ok) {
    const data = await res2.json();
    for (const p of data) if (p.sofifa_id) ids.set(p.sofifa_id, p.nombre);
  }

  return ids;
}

// ── HTTP fetch helper ─────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function tryFetch(url, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'image/*', ...extraHeaders },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/') && !ct.includes('octet-stream')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length >= MIN_VALID_BYTES ? buf : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Face crop using sharp ─────────────────────────────────────────
async function cropFace(cardBuf) {
  try {
    // Lazy-load sharp (available in Next.js node_modules)
    const sharp = require('sharp');
    const meta = await sharp(cardBuf).metadata();
    const w = meta.width || 512;
    const h = meta.height || 512;

    const left   = Math.floor(w * CROP.leftPct);
    const top    = Math.floor(h * CROP.topPct);
    const width  = Math.floor(w * CROP.widthPct);
    const height = Math.floor(h * CROP.heightPct);

    return await sharp(cardBuf)
      .extract({ left, top, width, height })
      .resize(60, 60, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ── Download one player ───────────────────────────────────────────
async function downloadPlayer(sofifa_id) {
  // 1. Futbin 512×512 card → crop face
  for (const ver of ['25', '26']) {
    const cardBuf = await tryFetch(
      `https://cdn.futbin.com/content/fifa${ver}/img/players/${sofifa_id}.png`,
      { 'Referer': 'https://www.futbin.com/' }
    );
    if (cardBuf) {
      const face = await cropFace(cardBuf);
      if (face) return { buf: face, source: `futbin-fc${ver}` };
      // Card downloaded but crop failed → return raw (better than nothing)
      return { buf: cardBuf, source: `futbin-fc${ver}-raw` };
    }
  }

  // 2. wsrv.nl → sofifa 60px (bypasses hotlink protection)
  for (const ver of ['25', '26', '24']) {
    const buf = await tryFetch(
      `https://wsrv.nl/?url=cdn.sofifa.net/players/${sofifa_id}/${ver}_60.png&w=60&h=60&output=png`
    );
    if (buf) return { buf, source: `wsrv-fc${ver}` };
  }

  // 3. Sofifa direct
  for (const ver of ['25', '26']) {
    const buf = await tryFetch(
      `https://cdn.sofifa.net/players/${sofifa_id}/${ver}_60.png`,
      { 'Referer': 'https://sofifa.com/' }
    );
    if (buf) return { buf, source: `sofifa-fc${ver}` };
  }

  return null;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚡ BVB Manager — Descarga de caras v2 (con crop real)');
  console.log('─────────────────────────────────────────────────────');

  const env = loadEnv();
  const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
  const SUPABASE_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
    process.exit(1);
  }

  console.log('📡 Obteniendo IDs de Supabase...');
  const players = await fetchAllIds(SUPABASE_URL, SUPABASE_KEY);
  console.log(`👥 ${players.size} jugadores únicos con sofifa_id`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Destino: public/players/`);
  if (FORCE) console.log('⚠️  Modo --force: re-descargando todo');
  console.log('─────────────────────────────────────────────────────\n');

  let ok = 0, skipped = 0, failed = 0;
  const failedList = [];
  const entries = Array.from(players.entries());

  for (let i = 0; i < entries.length; i++) {
    const [sofifa_id, nombre] = entries[i];
    const dest = path.join(OUTPUT_DIR, `${sofifa_id}.png`);
    const prefix = `[${String(i + 1).padStart(3)}/${entries.length}]`;

    // Skip if exists and valid
    if (SKIP_EXISTING && fs.existsSync(dest)) {
      const sz = fs.statSync(dest).size;
      if (sz > MIN_VALID_BYTES) {
        process.stdout.write(`${prefix} ⏭  ${nombre} (${(sz/1024).toFixed(1)}KB)\n`);
        skipped++;
        ok++;
        continue;
      }
      // Exists but too small → re-download
      fs.unlinkSync(dest);
    }

    process.stdout.write(`${prefix} ⬇  ${nombre} (${sofifa_id})... `);

    try {
      const result = await downloadPlayer(sofifa_id);
      if (result) {
        fs.writeFileSync(dest, result.buf);
        const sz = fs.statSync(dest).size;
        process.stdout.write(`✓ ${result.source} (${(sz/1024).toFixed(1)}KB)\n`);
        ok++;
      } else {
        process.stdout.write(`✗ sin imagen\n`);
        failedList.push({ id: sofifa_id, nombre });
        failed++;
      }
    } catch (e) {
      if (fs.existsSync(dest)) try { fs.unlinkSync(dest); } catch {}
      process.stdout.write(`✗ ${e.message}\n`);
      failedList.push({ id: sofifa_id, nombre });
      failed++;
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('\n─────────────────────────────────────────────────────');
  console.log(`✅ Descargadas:   ${ok} (${skipped} ya existían)`);
  console.log(`❌ Sin imagen:    ${failed}`);
  console.log('─────────────────────────────────────────────────────');

  if (failedList.length > 0) {
    console.log('\n⚠️  Jugadores sin imagen (sofifa_id posiblemente incorrecto en DB):');
    for (const p of failedList) {
      console.log(`   ${p.nombre.padEnd(28)} ID: ${p.id}  → buscar en sofifa.com/player/${p.id}`);
    }
    console.log('\nPara corregir IDs, ve a Admin → Plantilla BVB o usa la SQL en Supabase.');
  }
}

main().catch(console.error);
