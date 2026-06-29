export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';
import RankingList from '@/components/RankingList';

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

      <RankingList equipos={equipos} />
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
