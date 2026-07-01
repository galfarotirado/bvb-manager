'use client';
import { useState } from 'react';
import ClubLogo from '@/components/ClubLogo';

const TEAM_COLORS = {
  'DORTMUND':'#FFE500','PSG':'#004170','REAL MADRID':'#FEBE10','FC BARCELONA':'#A50044',
  'LIVERPOOL':'#C8102E','ARSENAL':'#EF0107','BAYERN MUNICH':'#DC052D','MAN CITY':'#6CABDD',
  'INTER MILAN':'#010E80','ATLETICO MADRID':'#CB3524','NAPOLI':'#12A0D7','CHELSEA':'#034694',
  'MILÁN':'#FB090B','BILBAO':'#EE2523','NEWCASTLE':'#241F20','JUVENTUS':'#888888','MAN UNITED':'#DA291C',
};
const CANONICAL_SLUG = {
  'ATLETICO MADRID':'atletico-madrid','INTER MILAN':'inter-milan','MAN CITY':'man-city',
  'MAN UNITED':'man-united','NEWCASTLE':'newcastle','DORTMUND':'dortmund','MILÁN':'milan',
  'FC BARCELONA':'fc-barcelona','REAL MADRID':'real-madrid','PSG':'psg','LIVERPOOL':'liverpool',
  'ARSENAL':'arsenal','CHELSEA':'chelsea','NAPOLI':'napoli','BILBAO':'bilbao',
  'JUVENTUS':'juventus','BAYERN MUNICH':'bayern-munich',
};
function teamSlug(name) { return CANONICAL_SLUG[name] || name.toLowerCase().replace(/ /g, '-'); }
function ovrColor(ovr) {
  if (!ovr) return '#777';
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  return '#f87171';
}

export default function RankingList({ equipos, forma = {} }) {
  const [search, setSearch] = useState('');
  const maxOvr = Math.max(...equipos.map(e => parseFloat(e.ovr_medio) || 0));
  const filtered = search
    ? equipos.filter(e =>
        e.equipo.toLowerCase().includes(search.toLowerCase()) ||
        (e.manager || '').toLowerCase().includes(search.toLowerCase())
      )
    : equipos;

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar equipo o manager..."
        className="w-full bg-bvb-card border border-bvb-border text-white px-4 py-2.5 rounded-xl text-sm focus:border-bvb-yellow outline-none placeholder-bvb-muted"
      />
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-bvb-muted text-center py-8">No se encontraron equipos</p>
        )}
        {filtered.map((e, i) => {
          const realIdx = equipos.indexOf(e);
          const isBVB = e.equipo === 'DORTMUND';
          const color = TEAM_COLORS[e.equipo] || '#555';
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
                  realIdx === 0 ? 'text-bvb-yellow' : realIdx === 1 ? 'text-gray-300' : realIdx === 2 ? 'text-amber-600' : isBVB ? 'text-bvb-yellow' : 'text-bvb-muted'
                }`}>{e.ranking}</span>
              </div>
              <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-0.5 w-10">
                {realIdx < 4 && <span className="text-[8px] font-black px-1 py-0.5 rounded bg-bvb-yellow/20 text-bvb-yellow">UCL</span>}
                {realIdx >= 4 && realIdx < 8 && <span className="text-[8px] font-black px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">UEL</span>}
                {realIdx >= 13 && <span className="text-[8px] font-black px-1 py-0.5 rounded bg-red-500/20 text-red-400">Peligro</span>}
              </div>

              <ClubLogo equipo={e.equipo} sofifa_team_id={e.sofifa_team_id} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm uppercase tracking-wide ${isBVB ? 'text-bvb-yellow' : 'text-white'}`}>{e.equipo}</span>
                  {isBVB && <span className="text-[9px] badge-yellow px-1.5 py-0.5 rounded font-black tracking-widest">TÚ</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-bvb-muted text-xs">Manager: <span className="text-white">{e.manager}</span></span>
                  {e.n_jugadores && <span className="text-bvb-muted text-[10px]">· {e.n_jugadores} jug.</span>}
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
      <div className="flex flex-wrap gap-4 text-xs text-bvb-muted pt-2">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bvb-yellow" /> Tú (BVB)</div>
        <div className="flex items-center gap-1.5"><span className="text-bvb-yellow font-black">UCL</span> Top 4</div>
        <div className="flex items-center gap-1.5"><span className="text-blue-400 font-black">UEL</span> Pos 5–8</div>
        <div className="flex items-center gap-1.5"><span className="text-red-400 font-black">Peligro</span> Pos 14+</div>
        <div className="ml-auto">Haz clic para ver plantilla</div>
      </div>
    </div>
  );
}
