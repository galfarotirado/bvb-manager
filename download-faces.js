/**
 * download-faces.js
 * Descarga las caras de jugadores a public/players/
 *
 * NO necesita el servidor local. Usa wsrv.nl como proxy.
 * EJECUTAR desde bvb-manager/:  node download-faces.js
 */

const fs   = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'players');
const DELAY_MS   = 400;

// ── Lista de jugadores ────────────────────────────────────────────────────────
const PLAYERS = [
  // DORTMUND
  { id: 257279, name: 'Álex Baena' },
  { id: 241050, name: 'Alexander Meyer' },
  { id: 259356, name: 'Carney Chukwuemeka' },
  { id: 242516, name: 'Cody Gakpo' },
  { id: 259716, name: 'Daniel Svensson' },
  { id: 235794, name: 'Eberechi Eze' },
  { id: 235073, name: 'Gregor Kobel' },
  { id: 270964, name: 'Jobe Bellingham' },
  { id: 251517, name: 'Joško Gvardiol' },
  { id: 266127, name: 'Lewis Hall' },
  { id: 83751,  name: 'Luca Reggiani' },
  { id: 222077, name: 'Manuel Locatelli' },
  { id: 204923, name: 'Marcel Sabitzer' },
  { id: 254117, name: 'Maximilian Beier' },
  { id: 247819, name: 'Nico Schlotterbeck' },
  { id: 241096, name: 'Sandro Tonali' },
  { id: 215441, name: 'Serhou Guirassy' },
  { id: 229476, name: 'Waldemar Anton' },
  { id: 259075, name: 'Yan Couto' },
  // ARSENAL
  { id: 246669, name: 'Bukayo Saka' },
  { id: 210697, name: 'Christian Nørgaard' },
  { id: 220901, name: 'David Raya' },
  { id: 234378, name: 'Declan Rice' },
  { id: 251566, name: 'Gabriel Martinelli' },
  { id: 272834, name: 'João Neves' },
  { id: 251805, name: 'Jurriën Timber' },
  { id: 235790, name: 'Kai Havertz' },
  { id: 206585, name: 'Kepa Arrizabalaga' },
  { id: 207421, name: 'Leandro Trossard' },
  { id: 222665, name: 'Martin Ødegaard' },
  { id: 225193, name: 'Mikel Merino' },
  { id: 264846, name: 'Mosquera' },
  { id: 254796, name: 'Noni Madueke' },
  { id: 256197, name: 'Piero Hincapié' },
  { id: 224196, name: 'Ramy Bensebaini' },
  { id: 257711, name: 'Riccardo Calafiori' },
  { id: 241651, name: 'Viktor Gyökeres' },
  // ATLETICO MADRID
  { id: 216549, name: 'Alexander Sørloth' },
  { id: 194765, name: 'Antoine Griezmann' },
  { id: 247103, name: 'Dávid Hancko' },
  { id: 248243, name: 'Eduardo Camavinga' },
  { id: 279731, name: 'Gabriel Moscardo' },
  { id: 200389, name: 'Jan Oblak' },
  { id: 216460, name: 'José María Giménez' },
  { id: 214979, name: 'Juan Musso' },
  { id: 229891, name: 'Julian Ryerson' },
  { id: 277643, name: 'Lamine Yamal' },
  { id: 264880, name: 'Loum Tchaouna' },
  { id: 266039, name: 'Marc Pubill' },
  { id: 233084, name: 'Nahuel Molina' },
  { id: 272449, name: 'Pablo Barrios' },
  { id: 233486, name: 'Robin Le Normand' },
  { id: 245371, name: 'Thiago Almada' },
  { id: 234060, name: 'Yangel Herrera' },
  // BAYERN MUNICH
  { id: 275298, name: 'Aleksandar Pavlović' },
  { id: 234396, name: 'Alphonso Davies' },
  { id: 229558, name: 'Dayot Upamecano' },
  { id: 236772, name: 'Dominik Szoboszlai' },
  { id: 226271, name: 'Fabián Ruiz' },
  { id: 202126, name: 'Harry Kane' },
  { id: 234205, name: 'Hiroki Ito' },
  { id: 263887, name: 'Jonas Urbig' },
  { id: 250955, name: 'Josip Stanišić' },
  { id: 237086, name: 'Kim Min-jae' },
  { id: 225375, name: 'Konrad Laimer' },
  { id: 236613, name: 'Lennart Grill' },
  { id: 209658, name: 'Leon Goretzka' },
  { id: 241084, name: 'Luis Díaz' },
  { id: 167495, name: 'Manuel Neuer' },
  { id: 247827, name: 'Michael Olise' },
  { id: 259197, name: 'Nicolas Jackson' },
  { id: 263765, name: 'Noah Bischof' },
  { id: 206113, name: 'Serge Gnabry' },
  // BILBAO
  { id: 259524, name: 'Aitor Paredes' },
  { id: 271034, name: 'Álex Padilla' },
  { id: 241049, name: 'Andoni Gorosabel' },
  { id: 212218, name: 'Aymeric Laporte' },
  { id: 248550, name: 'Dani Vivian' },
  { id: 231184, name: 'Gorka Guruzeta' },
  { id: 225523, name: 'Iker Lekue' },
  { id: 216201, name: 'Iñaki Williams' },
  { id: 225201, name: 'Jon Ander Berenguer' },
  { id: 226161, name: 'Marcos Llorente' },
  { id: 256516, name: 'Nico Williams' },
  { id: 212190, name: 'Niklas Süle' },
  { id: 244675, name: 'Oihan Sancet' },
  { id: 238616, name: 'Pedro Neto' },
  { id: 230869, name: 'Unai Simón' },
  { id: 270673, name: 'Warren Zaïre-Emery' },
  { id: 183512, name: 'Yuri Berchiche' },
  // CHELSEA
  { id: 252371, name: 'Cole Palmer' },
  { id: 244698, name: 'Enzo Fernández' },
  { id: 257607, name: 'Levi Colwill' },
  { id: 257354, name: 'Malo Gusto' },
  { id: 261598, name: 'Marc Cucurella' },
  { id: 258923, name: 'Moises Caicedo' },
  { id: 260640, name: 'Mykhaylo Mudryk' },
  { id: 263074, name: 'Pedro Neto (CHE)' },
  { id: 248057, name: 'Reece James' },
  { id: 258049, name: 'Robert Sanchez' },
  { id: 258565, name: 'Wesley Fofana' },
  { id: 241245, name: 'Christopher Nkunku' },
  { id: 261077, name: 'Kiernan Dewsbury-Hall' },
  { id: 260491, name: 'Jadon Sancho' },
  { id: 263316, name: 'Renato Veiga' },
  { id: 262318, name: 'Tosin Adarabioyo' },
  { id: 273018, name: 'Andrey Santos' },
  // FC BARCELONA
  { id: 263287, name: 'Pau Cubarsí' },
  { id: 243277, name: 'Pedri' },
  { id: 268773, name: 'Gavi' },
  { id: 222737, name: 'Robert Lewandowski' },
  { id: 239085, name: 'Raphinha' },
  { id: 234584, name: 'Frenkie de Jong' },
  { id: 261147, name: 'Ferran Torres' },
  { id: 258065, name: 'Alejandro Balde' },
  { id: 263159, name: 'Fermín López' },
  { id: 237907, name: 'Marc Casado' },
  { id: 265462, name: 'Dani Olmo' },
  { id: 247277, name: 'Eric García' },
  { id: 226318, name: 'Iñigo Martínez' },
  { id: 253353, name: 'Jules Koundé' },
  { id: 252400, name: 'Ronald Araújo' },
  { id: 253082, name: 'Wojciech Szczęsny' },
  { id: 256924, name: 'Pau Víctor' },
  // INTER MILAN
  { id: 200104, name: 'Lautaro Martínez' },
  { id: 228093, name: 'Marcus Thuram' },
  { id: 230621, name: 'Nicolo Barella' },
  { id: 196491, name: 'Henrikh Mkhitaryan' },
  { id: 250708, name: 'Yann Bisseck' },
  { id: 244286, name: 'Denzel Dumfries' },
  { id: 229440, name: 'Federico Dimarco' },
  { id: 247074, name: 'Francesco Acerbi' },
  { id: 249751, name: 'Stefan de Vrij' },
  { id: 231460, name: 'Alessandro Bastoni' },
  { id: 261131, name: 'Josep Martínez' },
  { id: 232461, name: 'Kristjan Asllani' },
  { id: 234200, name: 'Mehdi Taremi' },
  { id: 243278, name: 'Piotr Zieliński' },
  { id: 261855, name: 'Tomas Palacios' },
  { id: 241093, name: 'Carlos Augusto' },
  { id: 245369, name: 'Davide Frattesi' },
  // JUVENTUS
  { id: 192985, name: 'Dusan Vlahovic' },
  { id: 231677, name: 'Federico Chiesa' },
  { id: 234700, name: 'Gleison Bremer' },
  { id: 215073, name: 'Adrien Rabiot' },
  { id: 233369, name: 'Timothy Weah' },
  { id: 239462, name: 'Andrea Cambiaso' },
  { id: 227482, name: 'Arkadiusz Milik' },
  { id: 257532, name: 'Francisco Conceiçao' },
  { id: 241916, name: 'Nicolo Fagioli' },
  { id: 241070, name: 'Weston McKennie' },
  { id: 247435, name: 'Kenan Yildiz' },
  { id: 251768, name: 'Pierre Kalulu' },
  { id: 248369, name: 'Khephren Thuram' },
  { id: 258490, name: 'Alberto Costa' },
  { id: 263490, name: 'Randal Kolo Muani' },
  { id: 207648, name: 'Michele Di Gregorio' },
  { id: 222542, name: 'Douglas Luiz' },
  // LIVERPOOL
  { id: 209331, name: 'Mohamed Salah' },
  { id: 214794, name: 'Virgil van Dijk' },
  { id: 251698, name: 'Alexis Mac Allister' },
  { id: 243713, name: 'Darwin Núñez' },
  { id: 250225, name: 'Ryan Gravenberch' },
  { id: 231866, name: 'Alisson Becker' },
  { id: 230477, name: 'Andrew Robertson' },
  { id: 230474, name: 'Ibrahima Konaté' },
  { id: 257982, name: 'Jarell Quansah' },
  { id: 244643, name: 'Luis Díaz' },
  { id: 264559, name: 'Giorgi Mamardashvili' },
  { id: 265456, name: 'Florent Luis' },
  // MAN CITY
  { id: 239538, name: 'Erling Haaland' },
  { id: 230435, name: 'Ederson' },
  { id: 192985, name: 'Kevin De Bruyne' },
  { id: 209659, name: 'Phil Foden' },
  { id: 231866, name: 'Rodri' },
  { id: 212085, name: 'Manuel Akanji' },
  { id: 254644, name: 'Savinho' },
  { id: 261028, name: 'Omar Marmoush' },
  { id: 209585, name: 'Ruben Dias' },
  { id: 265234, name: 'James McAtee' },
  // MAN UNITED
  { id: 231461, name: 'Bruno Fernandes' },
  { id: 258186, name: 'Kobbie Mainoo' },
  { id: 256922, name: 'Rasmus Højlund' },
  { id: 264199, name: 'Alejandro Garnacho' },
  { id: 262712, name: 'Patrick Dorgu' },
  { id: 233509, name: 'André Onana' },
  { id: 254268, name: 'Diogo Dalot' },
  { id: 265234, name: 'Amad Diallo' },
  // MILÁN
  { id: 246488, name: 'Rafael Leão' },
  { id: 237077, name: 'Theo Hernández' },
  { id: 236502, name: 'Christian Pulisic' },
  { id: 240182, name: 'Tijjani Reijnders' },
  { id: 243052, name: 'Youssouf Fofana' },
  { id: 209331, name: 'Álvaro Morata' },
  { id: 256598, name: 'Matteo Gabbia' },
  { id: 256390, name: 'Malick Thiaw' },
  { id: 231659, name: 'Emerson Royal' },
  { id: 216054, name: 'Mike Maignan' },
  { id: 248769, name: 'Strahinja Pavlović' },
  { id: 260491, name: 'Samuel Chukwueze' },
  // NAPOLI
  { id: 213042, name: 'Alex Meret' },
  { id: 212085, name: 'Giovanni Di Lorenzo' },
  { id: 224505, name: 'Stanislav Lobotka' },
  { id: 237924, name: 'Khvicha Kvaratskhelia' },
  { id: 200389, name: 'Romelu Lukaku' },
  { id: 221591, name: 'Matteo Politano' },
  { id: 233150, name: 'Amir Rrahmani' },
  { id: 250710, name: 'Alessandro Buongiorno' },
  { id: 253368, name: 'Billy Gilmour' },
  // NEWCASTLE
  { id: 245291, name: 'Alexander Isak' },
  { id: 249086, name: 'Bruno Guimarães' },
  { id: 230469, name: 'Joelinton' },
  { id: 262315, name: 'Anthony Gordon' },
  { id: 244069, name: 'Fabian Schär' },
  { id: 243413, name: 'Dan Burn' },
  { id: 220830, name: 'Nick Pope' },
  { id: 236686, name: 'Jacob Murphy' },
  { id: 265234, name: 'Tino Livramento' },
  { id: 248831, name: 'Kieran Trippier' },
  // PSG
  { id: 231747, name: 'Ousmane Dembélé' },
  { id: 263540, name: 'Bradley Barcola' },
  { id: 203460, name: 'Marquinhos' },
  { id: 222492, name: 'Achraf Hakimi' },
  { id: 230621, name: 'Gianluigi Donnarumma' },
  { id: 261598, name: 'Willian Pacho' },
  { id: 226271, name: 'Fabian Ruiz (PSG)' },
  { id: 270673, name: 'Warren Zaïre-Emery (PSG)' },
  { id: 275015, name: 'Desirée Doué' },
  { id: 272834, name: 'João Neves (PSG)' },
  // REAL MADRID
  { id: 231747, name: 'Kylian Mbappé' },
  { id: 238794, name: 'Vinicius Jr.' },
  { id: 246169, name: 'Jude Bellingham' },
  { id: 192119, name: 'Thibaut Courtois' },
  { id: 213560, name: 'Rodrygo' },
  { id: 208722, name: 'Antonio Rüdiger' },
  { id: 239085, name: 'Aurélien Tchouaméni' },
  { id: 242180, name: 'Éder Militão' },
  { id: 236672, name: 'Federico Valverde' },
  { id: 227400, name: 'Ferland Mendy' },
  { id: 177003, name: 'Luka Modric' },
  { id: 261865, name: 'Miguel Gutiérrez' },
  { id: 264497, name: 'Endrick' },
  { id: 255752, name: 'Brahim Díaz' },
];

// Deduplica por id
const seen = new Set();
const UNIQUE = PLAYERS.filter(p => {
  if (seen.has(p.id)) return false;
  seen.add(p.id);
  return true;
});

// ── Descarga con fetch (Node.js 18+) ─────────────────────────────────────────
// Fuentes en orden de fiabilidad:
//   1. futbin CDN  — mismos IDs de EA FC, sin Cloudflare agresivo
//   2. sofifa CDN  — con headers de Chrome (a veces pasa)
//   3. wsrv.nl     — proxy público

async function tryFetch(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        ...headers,
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 300 ? buf : null;  // < 300 bytes = placeholder
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadPlayer(id, dest) {
  const sources = [
    // 1. Futbin (EA FC 25) — menos protegido
    [`https://cdn.futbin.com/content/fifa25/img/players/${id}.png`,      {}],
    [`https://cdn.futbin.com/content/fifa26/img/players/${id}.png`,      {}],
    // 2. sofifa CDN con referer
    [`https://cdn.sofifa.net/players/${id}/25_60.png`, { 'Referer': 'https://sofifa.com/' }],
    [`https://cdn.sofifa.net/players/${id}/26_60.png`, { 'Referer': 'https://sofifa.com/' }],
    // 3. wsrv.nl proxy (sin https:// en url param — su formato nativo)
    [`https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/25_60.png&output=png&w=60`, {}],
    [`https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/26_60.png&output=png&w=60`, {}],
  ];

  for (const [url, hdrs] of sources) {
    try {
      const buf = await tryFetch(url, hdrs);
      if (buf) {
        fs.writeFileSync(dest, buf);
        return true;
      }
    } catch {}
  }
  return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n⚡ BVB Manager — Descarga de caras (${UNIQUE.length} jugadores únicos)`);
  console.log(`📁 Destino: public/players/`);
  console.log(`🌐 Usando wsrv.nl como proxy (sin servidor local)\n`);

  let ok = 0, skip = 0, fail = 0;

  for (let i = 0; i < UNIQUE.length; i++) {
    const p   = UNIQUE[i];
    const dest = path.join(OUTPUT_DIR, `${p.id}.png`);

    // Saltar si ya existe y es válida
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      process.stdout.write(`[${String(i+1).padStart(3)}/${UNIQUE.length}] ⏭  ${p.name}\n`);
      skip++;
      ok++;
      continue;
    }

    process.stdout.write(`[${String(i+1).padStart(3)}/${UNIQUE.length}] ⬇  ${p.name}... `);

    try {
      const ok2 = await downloadPlayer(p.id, dest);
      if (ok2) {
        const size = fs.statSync(dest).size;
        process.stdout.write(`✓ (${(size/1024).toFixed(1)}KB)\n`);
        ok++;
      } else {
        process.stdout.write(`✗ sin imagen\n`);
        fail++;
      }
    } catch (e) {
      if (fs.existsSync(dest)) try { fs.unlinkSync(dest); } catch {}
      process.stdout.write(`✗ ${e.message}\n`);
      fail++;
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\n──────────────────────────────────────`);
  console.log(`✅ Descargadas:  ${ok} (${skip} ya existían)`);
  console.log(`❌ Sin imagen:   ${fail}`);
  console.log(`──────────────────────────────────────`);
  if (fail > 0) {
    console.log(`ℹ️  Los jugadores sin imagen no tienen foto en EA FC 25/26.`);
  }
}

main().catch(console.error);
