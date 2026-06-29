'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';
import PlayerAvatar from '@/components/PlayerAvatar';

function ovrColor(ovr) {
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  if (ovr >= 78) return '#c084fc';
  return '#f87171';
}

const POS_ICONS  = { POR:'🧤', DEF:'🛡️', MC:'⚙️', DEL:'⚡' };
const POS_COLORS = { POR:'#f59e0b', DEF:'#3b82f6', MC:'#8b5cf6', DEL:'#ef4444' };

function ScoutCard({ o }) {
  const negMin = (parseFloat(o.clausula) * 2).toFixed(1);
  const negMax = (parseFloat(o.clausula) * 4).toFixed(1);
  const posColor = POS_COLORS[o.posicion] || '#6b7280';
  const clausulaHigh = parseFloat(o.clausula) >= 2;

  return (
    <div className="relative overflow-hidden bg-bvb-card border border-bvb-border rounded-xl p-4 hover:border-bvb-yellow/50 transition-all group hover:bg-bvb-card-hover hover:-translate-y-0.5">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: posColor }} />

      <div className="flex items-start gap-3 mb-3">
        <PlayerAvatar sofifa_id={o.sofifa_id} nombre={o.jugador} posicion={o.posicion} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm uppercase tracking-wide leading-tight truncate">{o.jugador}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ClubLogo equipo={o.equipo} size="xs" />
            <p className="text-bvb-muted text-[10px] truncate">{o.equipo}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-black text-2xl leading-none" style={{ color: ovrColor(o.ovr) }}>{o.ovr}</span>
          {o.potencial && <p className="text-green-400 text-[10px] font-bold">↑{o.potencial}</p>}
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
            style={{ background: `${posColor}20`, color: posColor }}>
            {o.posicion}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-bvb-border pt-3">
        <div>
          <p className="text-[9px] font-black text-bvb-muted uppercase tracking-widest mb-0.5">Cláusula</p>
          <p className={`font-black text-base ${clausulaHigh ? 'text-amber-400' : 'text-bvb-yellow'}`}>{o.clausula}M</p>
        </div>
        <div>
          <p className="text-[9px] font-black text-bvb-muted uppercase tracking-widest mb-0.5">Negociación</p>
          <p className="font-bold text-white text-xs">{negMin}M — {negMax}M</p>
        </div>
      </div>

      {o.sofifa_id && (
        <a href={`https://sofifa.com/player/${o.sofifa_id}`} target="_blank" rel="noopener noreferrer"
          className="absolute top-2 right-2 text-[9px] text-bvb-muted hover:text-bvb-yellow transition-colors font-bold opacity-0 group-hover:opacity-100 uppercase tracking-widest">
          SOFIFA ↗
        </a>
      )}
    </div>
  );
}

function ScoutRow({ o }) {
  const negMin = (parseFloat(o.clausula) * 2).toFixed(1);
  const negMax = (parseFloat(o.clausula) * 4).toFixed(1);
  const posColor = POS_COLORS[o.posicion] || '#6b7280';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-bvb-border last:border-0 hover:bg-bvb-card-hover transition-colors group">
      <PlayerAvatar sofifa_id={o.sofifa_id} nombre={o.jugador} posicion={o.posicion} size="sm" />
      <ClubLogo equipo={o.equipo} size="xs" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-xs truncate">{o.jugador}</p>
        <p className="text-bvb-muted text-[10px] truncate">{o.equipo}</p>
      </div>
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0"
        style={{ background: `${posColor}20`, color: posColor }}>{o.posicion}</span>
      <span className="font-black text-sm w-8 text-right shrink-0" style={{ color: ovrColor(o.ovr) }}>{o.ovr}</span>
      <div className="hidden sm:block text-right shrink-0 w-28">
        <p className="font-black text-bvb-yellow text-sm">{o.clausula}M</p>
        <p className="text-bvb-muted text-[10px]">{negMin}–{negMax}M neg.</p>
      </div>
    </div>
  );
}

export default function Oportunidades() {
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterPos, setFilterPos]         = useState('ALL');
  const [sortBy, setSortBy]               = useState('ovr');
  const [search, setSearch]               = useState('');
  const [viewMode, setViewMode]           = useState('cards');
  const [minOvr, setMinOvr]               = useState(75);

  useEffect(() => {
    // Cargar TODOS los jugadores de la liga excepto el BVB
    supabase.from('liga_jugadores')
      .select('id, jugador, posicion, ovr, clausula, equipo, sofifa_id, potencial, edad')
      .neq('equipo', 'DORTMUND')
      .order('ovr', { ascending: false })
      .then(({ data }) => {
        setOportunidades(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => oportunidades
    .filter(o => filterPos === 'ALL' || o.posicion === filterPos)
    .filter(o => !search || o.jugador?.toLowerCase().includes(search.toLowerCase()) || o.equipo?.toLowerCase().includes(search.toLowerCase()))
    .filter(o => (o.ovr || 0) >= minOvr)
    .sort((a, b) => {
      if (sortBy === 'ovr')      return (b.ovr || 0) - (a.ovr || 0);
      if (sortBy === 'clausula') return parseFloat(a.clausula) - parseFloat(b.clausula);
      return (a.jugador || '').localeCompare(b.jugador || '');
    }),
    [oportunidades, filterPos, search, sortBy, minOvr]
  );

  const stats = useMemo(() => ({
    total: oportunidades.length,
    byPos: ['POR','DEF','MC','DEL'].map(pos => ({ pos, count: oportunidades.filter(o => o.posicion === pos).length })),
    topOvr: oportunidades.reduce((max, o) => o.ovr > (max?.ovr || 0) ? o : max, null),
    cheapCount: oportunidades.filter(o => parseFloat(o.clausula) <= 1).length,
  }), [oportunidades]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest text-lg">CARGANDO SCOUT...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">

      <div>
        <div className="section-label mb-1">Mercado CAYR · {oportunidades.length} jugadores disponibles</div>
        <h1 className="display-text text-3xl text-white"><span className="text-bvb-yellow">Scout</span> de Mercado</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-bvb-card border border-bvb-border rounded-xl p-3 text-center">
          <p className="section-label mb-0.5">Disponibles</p>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>
        {stats.byPos.map(({ pos, count }) => (
          <div key={pos} className="bg-bvb-card border border-bvb-border rounded-xl p-3 text-center">
            <p className="section-label mb-0.5">{POS_ICONS[pos]} {pos}</p>
            <p className="text-2xl font-black" style={{ color: POS_COLORS[pos] }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Top pick */}
      {stats.topOvr && (
        <div className="relative overflow-hidden rounded-xl border border-bvb-yellow/30 px-5 py-4 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1a1600 0%, #0e0e00 100%)' }}>
          <div className="stripe-yellow absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-4 w-full">
            <PlayerAvatar sofifa_id={stats.topOvr.sofifa_id} nombre={stats.topOvr.jugador} posicion={stats.topOvr.posicion} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-bvb-yellow tracking-widest uppercase mb-0.5">⭐ Mejor disponible</p>
              <p className="font-black text-white text-lg uppercase tracking-wide leading-none truncate">{stats.topOvr.jugador}</p>
              <p className="text-bvb-muted text-xs mt-0.5">{stats.topOvr.equipo} · Cláusula {stats.topOvr.clausula}M</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-4xl leading-none" style={{ color: ovrColor(stats.topOvr.ovr) }}>{stats.topOvr.ovr}</p>
              <p className="text-bvb-muted text-[10px]">OVR</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar jugador o equipo..."
          className="flex-1 bg-bvb-card border border-bvb-border text-white px-4 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
        <div className="flex gap-1.5 flex-wrap">
          {['ALL','POR','DEF','MC','DEL'].map(pos => (
            <button key={pos} onClick={() => setFilterPos(pos)}
              className={`px-3 py-2 text-xs font-black uppercase rounded transition-all ${
                filterPos === pos ? 'bg-bvb-yellow text-black' : 'bg-bvb-card border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-white'
              }`}>
              {pos === 'ALL' ? 'Todos' : `${POS_ICONS[pos]} ${pos}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-bvb-card border border-bvb-border text-bvb-muted px-3 py-2 rounded-lg text-xs font-bold focus:border-bvb-yellow outline-none">
            <option value="ovr">OVR ↓</option>
            <option value="clausula">Cláusula ↑</option>
            <option value="jugador">Nombre A–Z</option>
          </select>
          <button onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
            className="px-3 py-2 bg-bvb-card border border-bvb-border text-bvb-muted rounded-lg text-xs font-black hover:border-bvb-yellow hover:text-white transition-all">
            {viewMode === 'cards' ? '☰ Lista' : '⊞ Cards'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="section-label text-[10px] whitespace-nowrap">OVR mín:</label>
          <input type="number" min="60" max="95" value={minOvr} onChange={e=>setMinOvr(Number(e.target.value))}
            className="w-16 bg-bvb-card border border-bvb-border text-white px-2 py-1.5 rounded text-sm text-center focus:border-bvb-yellow outline-none" />
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="section-label">{filtered.length} jugadores</span>
        {filtered.length !== oportunidades.length && <span className="text-bvb-muted text-xs">de {oportunidades.length}</span>}
        <div className="flex-1 h-px bg-bvb-border mx-2" />
        <span className="text-bvb-muted text-xs">{stats.cheapCount} con cláusula ≤1M</span>
      </div>

      {/* Results */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(o => <ScoutCard key={o.id} o={o} />)}
        </div>
      ) : (
        <div className="bg-bvb-card border border-bvb-border rounded-xl overflow-hidden">
          {filtered.map(o => <ScoutRow key={o.id} o={o} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-bvb-muted">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-bold text-white">Sin resultados</p>
          <p className="text-sm mt-1">Prueba con otros filtros</p>
        </div>
      )}

      <p className="text-bvb-muted text-xs text-center pb-2">
        Reglas CAYR: precio mínimo = cláusula × 2 · máximo = cláusula × 4
      </p>
    </div>
  );
}
