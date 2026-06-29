export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';

async function getEquipos() {
  const { data } = await supabase.from('bvb_equipos').select('*').order('ranking');
  return data || [];
}

const TEAM_COLORS = {
  'DORTMUND':'#FFE500','PSG':'#004170','REAL MADRID':'#FEBE10','FC BARCELONA':'#A50044',
  'LIVERPOOL':'#C8102E','ARSENAL':'#EF0107','BAYERN MUNICH':'#DC052D','MAN CITY':'#6CABDD',
  'INTER MILAN':'#010E80','ATLETICO MADRID':'#CB3524','NAPOLI':'#12A0D7','CHELSEA':'#034694',
  'MILÁN':'#FB090B','BILBAO':'#EE2523','NEWCASTLE':'#241F20','JUVENTUS':'#888888','MAN UNITED':'#DA291C',
};
const TEAM_ABBR = {
  'DORTMUND':'BVB','PSG':'PSG','REAL MADRID':'RMA','FC BARCELONA':'BAR','LIVERPOOL':'LIV',
  'ARSENAL':'ARS','BAYERN MUNICH':'BAY','MAN CITY':'MCI','INTER MILAN':'INT',
  'ATLETICO MADRID':'ATL','NAPOLI':'NAP','CHELSEA':'CHE','MILÁN':'ACM','BILBAO':'ATH',
  'NEWCASTLE':'NEW','JUVENTUS':'JUV','MAN UNITED':'MUN',
};

// Canonical slugs — must match SLUG_MAP in /equipos/[slug]/page.js
const CANONICAL_SLUG = {
  'ATLETICO MADRID': 'atletico-madrid',
  'INTER MILAN':     'inter-milan',
  'MAN CITY':        'man-city',
  'MAN UNITED':      'man-united',
  'NEWCASTLE':       'newcastle',
  'DORTMUND':        'dortmund',
  'MILÁN':           'milan',
  'FC BARCELONA':    'fc-barcelona',
  'REAL MADRID':     'real-madrid',
  'PSG':             'psg',
  'LIVERPOOL':       'liverpool',
  'ARSENAL':         'arsenal',
  'CHELSEA':         'chelsea',
  'NAPOLI':          'napoli',
  'BILBAO':          'bilbao',
  'JUVENTUS':        'juventus',
  'BAYERN MUNICH':   'bayern-munich',
};

function teamSlug(name) {
  return CANONICAL_SLUG[name] || name.toLowerCase().replace(/ /g, '-');
}

export default async function Ranking() {
  const equipos = await getEquipos();
  const bvb = equipos.find(e => e.equipo === 'DORTMUND');
  const bvbPos = equipos.indexOf(bvb) + 1;
  const maxOvr = Math.max(...equipos.map(e => parseFloat(e.ovr_medio) || 0));

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <div className="section-label mb-1">CAYR Season 1 · 17 Equipos</div>
        <h1 className="display-text text-3xl text-white"><span className="text-bvb-yellow">Ranking</span> de Equipos</h1>
      </div>

      {bvb && (
        <a href={`/equipos/${teamSlug(bvb.equipo)}`}
          className="block relative overflow-hidden rounded-xl border border-bvb-yellow/40 p-5 hover:border-bvb-yellow/70 transition-all animate-glow-pulse hover-lift"
          style={{ background: 'linear-gradient(135deg, #1a1a00 0%, #0f0f00 100%)' }}>
          <div className="animate-stripe-march absolute inset-0 opacity-70" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="display-text text-6xl text-bvb-yellow leading-none">#{bvbPos}</div>
              <div>
                <div className="section-label mb-1">Tu posición · Ver detalle →</div>
                <h2 className="font-black text-white uppercase text-lg tracking-wide">Borussia Dortmund</h2>
                <p className="text-bvb-muted text-sm">Manager: <span className="text-white font-bold">{bvb.manager}</span></p>
              </div>
            </div>
            <div className="sm:ml-auto grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="section-label">OVR</p>
                <p className="font-black text-2xl text-bvb-yellow">{bvb.ovr_medio}</p>
              </div>
              <div>
                <p className="section-label">Budget</p>
                <p className="font-black text-2xl text-white">{bvb.budget}M</p>
              </div>
              <div>
                <p className="section-label">Mejor</p>
                <p className="font-black text-sm text-white">{bvb.mejor_jugador}</p>
                <p className="text-bvb-yellow text-xs font-black">{bvb.ovr_mejor} OVR</p>
              </div>
            </div>
          </div>
        </a>
      )}

      <div className="space-y-1.5">
        {equipos.map((e, i) => {
          const isBVB = e.equipo === 'DORTMUND';
          const color = TEAM_COLORS[e.equipo] || '#555';
          const abbr = TEAM_ABBR[e.equipo] || e.equipo.slice(0, 3);
          const ovrPct = ((parseFloat(e.ovr_medio) || 0) / maxOvr) * 100;

          return (
            <a key={e.id} href={`/equipos/${teamSlug(e.equipo)}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer hover-lift ${
                isBVB
                  ? 'bg-bvb-yellow/5 border-bvb-yellow/30 hover:border-bvb-yellow/60'
                  : 'bg-bvb-card border-bvb-border hover:border-bvb-border-bright hover:bg-bvb-card-hover'
              }`}>
              <div className="w-8 text-center flex-shrink-0">
                <span className={`font-black text-lg ${
                  i === 0 ? 'text-bvb-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : isBVB ? 'text-bvb-yellow' : 'text-bvb-muted'
                }`}>{e.ranking}</span>
              </div>

              <ClubLogo equipo={e.equipo} sofifa_team_id={e.sofifa_team_id} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm uppercase tracking-wide ${isBVB ? 'text-bvb-yellow' : 'text-white'}`}>{e.equipo}</span>
                  {isBVB && <span className="text-[9px] badge-yellow px-1.5 py-0.5 rounded font-black tracking-widest">TÚ</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-bvb-muted text-xs">Manager: <span className="text-white">{e.manager}</span></span>
                  <span className="text-bvb-muted text-xs hidden sm:inline">Mejor: <span className="text-white">{e.mejor_jugador}</span> <span style={{ color: ovrColor(e.ovr_mejor) }}>{e.ovr_mejor}</span></span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3 w-40 flex-shrink-0">
                <div className="flex-1 h-1.5 bg-bvb-dark rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${ovrPct}%`, background: isBVB ? '#FFE500' : color }} />
                </div>
                <span className={`font-black text-sm w-10 text-right ${isBVB ? 'text-bvb-yellow' : 'text-white'}`}>{e.ovr_medio}</span>
              </div>

              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-bvb-muted text-[10px] uppercase tracking-widest">Budget</p>
                <p className="font-bold text-white text-sm">{e.budget}M</p>
              </div>

              <span className="text-bvb-muted text-xs hidden lg:block">→</span>
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-bvb-muted">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bvb-yellow" /> Tú (BVB)</div>
        <div className="flex items-center gap-1.5"><span className="text-bvb-yellow font-black">#1-3</span> Top 3</div>
        <div className="flex items-center gap-1.5"><span className="text-green-400 font-bold">#4-6</span> Europa</div>
        <div className="ml-auto text-bvb-muted">Haz clic en un equipo para ver su plantilla</div>
      </div>
    </div>
  );
}

function ovrColor(ovr) {
  if (!ovr) return '#777';
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  return '#f87171';
}
