export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import PlayerAvatar from '@/components/PlayerAvatar';
import ClubLogo from '@/components/ClubLogo';

async function getData() {
  const [plantilla, equipos, traspasos, liga] = await Promise.all([
    supabase.from('bvb_plantilla').select('*').order('ovr', { ascending: false }),
    supabase.from('bvb_equipos').select('*').eq('equipo', 'DORTMUND').single(),
    supabase.from('bvb_traspasos').select('*').or('equipo_destino.eq.DORTMUND,equipo_origen.eq.DORTMUND').order('id', { ascending: false }).limit(8),
    supabase.from('bvb_equipos').select('ranking,equipo,manager,ovr_medio,ovr_mejor,mejor_jugador,sofifa_team_id').order('ranking').limit(5),
  ]);
  return { plantilla: plantilla.data || [], equipo: equipos.data, traspasos: traspasos.data || [], liga: liga.data || [] };
}

function ovrColor(ovr) {
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  if (ovr >= 78) return '#c084fc';
  return '#f87171';
}

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 border transition-all ${
      accent
        ? 'bg-bvb-yellow border-bvb-yellow/50'
        : 'bg-bvb-card border-bvb-border hover:border-bvb-border-bright'
    }`}>
      <div className="stripe-yellow absolute inset-0 opacity-50" />
      <div className="relative">
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accent ? 'text-black/60' : 'section-label'}`}>{label}</p>
        <p className={`text-3xl font-black ${accent ? 'text-black' : 'text-white'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${accent ? 'text-black/50' : 'text-bvb-muted'}`}>{sub}</p>}
      </div>
    </div>
  );
}

const TEAM_COLORS_HOME = {
  'DORTMUND':'#FFE500','PSG':'#004170','REAL MADRID':'#FEBE10','FC BARCELONA':'#A50044',
  'LIVERPOOL':'#C8102E','ARSENAL':'#EF0107','BAYERN MUNICH':'#DC052D','MAN CITY':'#6CABDD',
  'INTER MILAN':'#010E80','ATLETICO MADRID':'#CB3524','NAPOLI':'#12A0D7','CHELSEA':'#034694',
  'MILÁN':'#FB090B','BILBAO':'#EE2523','NEWCASTLE':'#241F20','JUVENTUS':'#888888','MAN UNITED':'#DA291C',
};
const CANONICAL_SLUG_HOME = {
  'ATLETICO MADRID':'atletico-madrid','INTER MILAN':'inter-milan','MAN CITY':'man-city',
  'MAN UNITED':'man-united','NEWCASTLE':'newcastle','DORTMUND':'dortmund','MILÁN':'milan',
  'FC BARCELONA':'fc-barcelona','REAL MADRID':'real-madrid','PSG':'psg','LIVERPOOL':'liverpool',
  'ARSENAL':'arsenal','CHELSEA':'chelsea','NAPOLI':'napoli','BILBAO':'bilbao',
  'JUVENTUS':'juventus','BAYERN MUNICH':'bayern-munich',
};

export default async function Dashboard() {
  const { plantilla, equipo, traspasos, liga } = await getData();
  const fichajes = plantilla.filter(p => p.es_fichaje);
  const avgOvr = plantilla.length ? (plantilla.reduce((s, p) => s + p.ovr, 0) / plantilla.length).toFixed(1) : 0;
  const top11Ovr = plantilla.length >= 11
    ? (plantilla.slice(0, 11).reduce((s, p) => s + p.ovr, 0) / 11).toFixed(1)
    : avgOvr;
  const clausulas = plantilla.reduce((s, p) => s + (parseFloat(p.clausula) || 0), 0);

  return (
    <div className="space-y-7 animate-slide-up">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-bvb-yellow/25 animate-glow-pulse"
        style={{ background: '#0a0a0a' }}>
        {/* Banner BVB como fondo */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/bvb-banner.png)', opacity: 0.25 }} />
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,0,0.85) 0%, rgba(10,10,10,0.6) 55%, rgba(13,13,0,0.85) 100%)' }} />
        {/* Dot pattern overlay */}
        <div className="dot-pattern absolute inset-0 opacity-40" />
        {/* Big yellow radial glow top-right */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,229,0,0.12) 0%, transparent 65%)' }} />
        {/* Bottom yellow line accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #FFE500, transparent)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <div className="section-label mb-2 animate-fade-in stagger-1">CAYR Football Manager League · Season 1</div>
            <h1 className="display-text text-4xl sm:text-6xl leading-none mb-1 animate-slide-left stagger-2">
              BORUSSIA<br />
              <span className="shimmer-text">DORTMUND</span>
            </h1>
            <div className="accent-line w-32 mt-3 mb-3 animate-slide-left stagger-3" />
            <div className="flex items-center gap-3 animate-fade-in stagger-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/managers/alfaro.png" alt="Manager"
                className="w-10 h-10 rounded-full object-cover border-2 border-bvb-yellow/50 flex-shrink-0"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255,229,0,0.5))' }}
              />
              <p className="text-bvb-muted text-sm">
                Manager: <span className="text-white font-bold">{equipo?.manager || 'Alfaro'}</span>
                <span className="mx-2 text-bvb-yellow/40">·</span>
                <span className="text-bvb-yellow font-bold tracking-widest text-xs uppercase">Echte Liebe</span>
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-5 animate-slide-right stagger-2">
            <div className="text-right">
              <p className="section-label">Ranking Liga</p>
              <p className="display-text text-7xl text-bvb-yellow leading-none yellow-glow-text">
                #{equipo?.ranking || '—'}
              </p>
            </div>
            <img src="/escudos/dortmund.png" alt="BVB"
              className="w-24 h-24 object-contain flex-shrink-0 animate-bounce-subtle"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,229,0,0.6)) drop-shadow(0 0 40px rgba(255,229,0,0.2))' }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="OVR Top 11" value={top11Ovr} sub="Media titular" accent />
        <StatCard label="OVR Plantilla" value={avgOvr} sub={`${plantilla.length} jugadores`} />
        <StatCard label="Cláusulas totales" value={`${clausulas.toFixed(0)}M`} sub="Suma cláusulas plantilla" />
        <StatCard label="Fichajes S1" value={fichajes.length} sub="Nuevas incorporaciones" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Squad */}
        <div className="lg:col-span-2 bg-bvb-card border border-bvb-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-bvb-border">
            <h2 className="font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-bvb-yellow">◉</span> Plantilla
            </h2>
            <a href="/plantilla" className="text-xs text-bvb-yellow hover:underline font-bold tracking-wide uppercase">Ver todo →</a>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {plantilla.map(p => (
              <div key={p.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  p.es_fichaje ? 'bg-bvb-yellow/5 border border-bvb-yellow/20' : 'hover:bg-bvb-card-hover'
                }`}>
                <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.nombre} posicion={p.posicion} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-xs text-white truncate">{p.nombre}</p>
                    {p.es_fichaje && <span className="text-bvb-yellow text-[10px] flex-shrink-0">✦</span>}
                  </div>
                  <p className="text-bvb-muted text-[10px]">{p.posicion}</p>
                </div>
                <span className="font-black text-sm flex-shrink-0" style={{ color: ovrColor(p.ovr) }}>{p.ovr}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-bvb-border text-bvb-muted text-[10px]">✦ = Fichaje S1</div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent transfers */}
          <div className="bg-bvb-card border border-bvb-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-bvb-border">
              <h2 className="font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span className="text-bvb-yellow">⇄</span> Movimientos
              </h2>
              <a href="/mercado" className="text-xs text-bvb-yellow hover:underline font-bold tracking-wide uppercase">Ver todo →</a>
            </div>
            <div className="px-4 py-3 space-y-0">
              {traspasos.map(t => {
                const isBVBIn = t.equipo_destino === 'DORTMUND';
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-bvb-border last:border-0">
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isBVBIn ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white truncate">{t.jugador}</p>
                      <p className="text-bvb-muted text-[10px] truncate">{t.equipo_origen} → {t.equipo_destino}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                        t.tipo === 'clausulazo' ? 'badge-yellow' : t.tipo === 'intercambio' ? 'badge-purple' : 'badge-blue'
                      }`}>{t.tipo}</span>
                      {parseFloat(t.precio) > 0 && <span className="text-bvb-yellow font-black text-xs">{t.precio}M</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/once',         icon: '⬡', label: 'Mi Once' },
              { href: '/partidos',     icon: '◷', label: 'Partidos' },
              { href: '/ranking',      icon: '▲', label: 'Ranking' },
              { href: '/oportunidades',icon: '◎', label: 'Scout' },
              { href: '/economia',     icon: '💰', label: 'Economía' },
              { href: '/mercado',      icon: '⇄', label: 'Mercado' },
              { href: '/galeria',      icon: '🖼', label: 'Galería' },
              { href: '/ia',           icon: '🤖', label: 'IA Táctica' },
            ].map(({ href, icon, label }) => (
              <a key={href} href={href}
                className="flex flex-col items-center justify-center gap-1 py-4 bg-bvb-card border border-bvb-border rounded-xl hover:border-bvb-yellow/40 hover:bg-bvb-card-hover transition-all group">
                <span className="text-bvb-yellow text-xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="text-xs font-black uppercase tracking-widest text-bvb-muted group-hover:text-white transition-colors">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Liga */}
      {liga.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-bvb-yellow">▲</span> Top Liga
            </h2>
            <a href="/ranking" className="text-xs text-bvb-yellow hover:underline font-bold tracking-wide uppercase">Ver completo →</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {liga.map((e, i) => {
              const color = TEAM_COLORS_HOME[e.equipo] || '#888';
              const slug = CANONICAL_SLUG_HOME[e.equipo] || e.equipo.toLowerCase().replace(/ /g,'-');
              const isBVB = e.equipo === 'DORTMUND';
              return (
                <a key={e.equipo} href={`/equipos/${slug}`}
                  className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border transition-all hover-lift text-center ${
                    isBVB ? 'border-bvb-yellow/40 bg-bvb-yellow/5' : 'border-bvb-border bg-bvb-card hover:border-bvb-border-bright'
                  }`}>
                  <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                    <span className={`font-black text-xl sm:text-3xl leading-none ${i===0?'text-bvb-yellow':i===1?'text-gray-300':i===2?'text-amber-600':'text-bvb-muted'}`}>
                      #{e.ranking}
                    </span>
                    <ClubLogo equipo={e.equipo} sofifa_team_id={e.sofifa_team_id} size="md" />
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <p className={`font-black text-xs uppercase tracking-wide leading-tight ${isBVB?'text-bvb-yellow':'text-white'}`}>
                      {e.equipo === 'FC BARCELONA' ? 'BARÇA' : e.equipo.split(' ')[0]}
                    </p>
                    <p className="text-bvb-muted text-[10px] mt-0.5">{e.manager}</p>
                    <p className="font-black text-sm mt-1" style={{color}}>{e.ovr_medio}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Fichajes spotlight */}
      {fichajes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span className="text-bvb-yellow">✦</span> Fichajes Temporada
            </h2>
            <div className="section-label">NEW SIGNINGS</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {fichajes.map(p => (
              <div key={p.id}
                className="relative overflow-hidden rounded-xl border border-bvb-yellow/20 hover:border-bvb-yellow/50 transition-all group"
                style={{ background: 'linear-gradient(135deg, #1a1a00 0%, #161616 100%)' }}>
                <div className="stripe-yellow absolute inset-0 opacity-30" />
                <div className="relative p-4 text-center">
                  <div className="flex justify-center mb-3">
                    <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.nombre} posicion={p.posicion} size="lg" />
                  </div>
                  <p className="font-black text-white text-xs leading-tight uppercase tracking-wide truncate">{p.nombre}</p>
                  <p className="text-bvb-muted text-[10px] mt-0.5">{p.posicion}</p>
                  <p className="font-black text-2xl mt-2" style={{ color: ovrColor(p.ovr) }}>{p.ovr}</p>
                  <span className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                    p.tipo_fichaje === 'clausulazo' ? 'badge-yellow' :
                    p.tipo_fichaje === 'intercambio' ? 'badge-purple' : 'badge-blue'
                  }`}>
                    {p.tipo_fichaje === 'clausulazo' ? '⚡ Clausulazo' :
                     p.tipo_fichaje === 'intercambio' ? '🔀 Swap' : '💰 Traspaso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
