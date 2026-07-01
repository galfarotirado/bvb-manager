'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import PlayerAvatar from '@/components/PlayerAvatar';
import ClubLogo from '@/components/ClubLogo';

const POSITIONS = ['TODOS', 'POR', 'DEF', 'MC', 'DEL'];
const SORT_OPTS = [
  { key: 'goles',              label: 'Goles' },
  { key: 'asistencias',        label: 'Asistencias' },
  { key: 'partidos',           label: 'Partidos' },
  { key: 'tarjetas_amarillas', label: 'Amarillas' },
  { key: 'tarjetas_rojas',     label: 'Rojas' },
  { key: 'clean_sheets',       label: 'Porterías imbatidas' },
];

function ovrColor(v) {
  if (v >= 10) return '#FFE500';
  if (v >= 6)  return '#4ade80';
  if (v >= 3)  return '#60a5fa';
  return '#f87171';
}

export default function EstadisticasPage() {
  const [stats, setStats]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sortKey, setSortKey]     = useState('goles');
  const [posFilter, setPosFilter] = useState('TODOS');
  const [search, setSearch]       = useState('');
  const [editing, setEditing]     = useState(null); // {id, field, value}
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ jugador:'', equipo:'', sofifa_id:'', posicion:'DEL', partidos:0, goles:0, asistencias:0, tarjetas_amarillas:0, tarjetas_rojas:0, clean_sheets:0 });
  const [equipos, setEquipos]     = useState([]);

  useEffect(() => {
    Promise.all([
      supabase.from('liga_stats').select('*').order('goles', { ascending: false }),
      supabase.from('bvb_equipos').select('equipo,sofifa_team_id').order('ranking'),
    ]).then(([s, e]) => {
      setStats(s.data || []);
      setEquipos(e.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let rows = [...stats];
    if (posFilter !== 'TODOS') rows = rows.filter(r => r.posicion === posFilter);
    if (search) rows = rows.filter(r =>
      r.jugador.toLowerCase().includes(search.toLowerCase()) ||
      r.equipo.toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
    return rows;
  }, [stats, sortKey, posFilter, search]);

  async function saveCell(id, field, raw) {
    const val = isNaN(Number(raw)) ? 0 : Number(raw);
    await supabase.from('liga_stats').update({ [field]: val }).eq('id', id);
    setStats(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
    setEditing(null);
  }

  async function addPlayer() {
    const payload = { ...addForm, sofifa_id: addForm.sofifa_id ? parseInt(addForm.sofifa_id) : null };
    const { data } = await supabase.from('liga_stats').insert(payload).select().single();
    if (data) { setStats(prev => [...prev, data]); setShowAdd(false); setAddForm({ jugador:'', equipo:'', sofifa_id:'', posicion:'DEL', partidos:0, goles:0, asistencias:0, tarjetas_amarillas:0, tarjetas_rojas:0, clean_sheets:0 }); }
  }

  async function deletePlayer(id) {
    if (!confirm('¿Eliminar jugador de estadísticas?')) return;
    await supabase.from('liga_stats').delete().eq('id', id);
    setStats(prev => prev.filter(r => r.id !== id));
  }

  // Top stats
  const topGoleador   = [...stats].sort((a,b) => b.goles - a.goles)[0];
  const topAsistente  = [...stats].sort((a,b) => b.asistencias - a.asistencias)[0];
  const topPortero    = [...stats].filter(r => r.posicion === 'POR').sort((a,b) => b.clean_sheets - a.clean_sheets)[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest">CARGANDO...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <div className="section-label mb-1">CAYR Season 1</div>
        <h1 className="display-text text-3xl sm:text-4xl text-bvb-yellow">ESTADÍSTICAS</h1>
      </div>

      {/* Top 3 cards */}
      {(topGoleador || topAsistente || topPortero) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: '⚽ Goleador', player: topGoleador, stat: topGoleador?.goles, unit: 'goles' },
            { label: '🅰 Asistente', player: topAsistente, stat: topAsistente?.asistencias, unit: 'asist.' },
            { label: '🧤 Portero imbatido', player: topPortero, stat: topPortero?.clean_sheets, unit: 'CS' },
          ].map(({ label, player, stat, unit }) => player && (
            <div key={label} className="relative overflow-hidden rounded-xl border border-bvb-yellow/30 p-4 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(255,229,0,0.06) 0%, #111 100%)' }}>
              <PlayerAvatar sofifa_id={player.sofifa_id} nombre={player.jugador} posicion={player.posicion} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-bvb-muted text-[10px] uppercase tracking-widest font-black">{label}</p>
                <p className="font-black text-white text-sm truncate">{player.jugador}</p>
                <p className="text-bvb-muted text-xs">{player.equipo}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-bvb-yellow">{stat}</p>
                <p className="text-bvb-muted text-[10px]">{unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar jugador o equipo..."
          className="flex-1 bg-bvb-card border border-bvb-border text-white px-4 py-2.5 rounded-xl text-sm focus:border-bvb-yellow outline-none placeholder-bvb-muted" />
        <div className="flex gap-1 flex-wrap">
          {POSITIONS.map(p => (
            <button key={p} onClick={() => setPosFilter(p)}
              className={`px-3 py-2 text-xs font-black rounded-lg transition-all ${posFilter===p ? 'bg-bvb-yellow text-black' : 'bg-bvb-card border border-bvb-border text-bvb-muted hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-bvb-yellow-dim transition-colors">
          + Añadir
        </button>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 border-b border-bvb-border overflow-x-auto no-scrollbar">
        {SORT_OPTS.map(o => (
          <button key={o.key} onClick={() => setSortKey(o.key)}
            className={`px-3 py-2 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${sortKey===o.key ? 'border-bvb-yellow text-bvb-yellow' : 'border-transparent text-bvb-muted hover:text-white'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bvb-card border border-bvb-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bvb-border">
                <th className="px-4 py-3 text-left text-bvb-muted text-[10px] uppercase tracking-widest w-8">#</th>
                <th className="px-4 py-3 text-left text-bvb-muted text-[10px] uppercase tracking-widest">Jugador</th>
                <th className="px-3 py-3 text-center text-bvb-muted text-[10px] uppercase tracking-widest">PJ</th>
                <th className="px-3 py-3 text-center text-bvb-yellow text-[10px] uppercase tracking-widest font-black">⚽</th>
                <th className="px-3 py-3 text-center text-green-400 text-[10px] uppercase tracking-widest font-black">🅰</th>
                <th className="px-3 py-3 text-center text-bvb-muted text-[10px] uppercase tracking-widest hidden sm:table-cell">🟡</th>
                <th className="px-3 py-3 text-center text-bvb-muted text-[10px] uppercase tracking-widest hidden sm:table-cell">🔴</th>
                <th className="px-3 py-3 text-center text-blue-400 text-[10px] uppercase tracking-widest hidden md:table-cell">CS</th>
                <th className="px-2 py-3 w-8 hidden sm:table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-bvb-muted">
                  No hay estadísticas. Añade jugadores con el botón +.
                </td></tr>
              )}
              {filtered.map((r, i) => {
                const eq = equipos.find(e => e.equipo === r.equipo);
                return (
                  <tr key={r.id} className="border-b border-bvb-border/50 hover:bg-bvb-card-hover transition-colors">
                    <td className="px-4 py-3 text-bvb-muted text-xs font-black">{i+1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar sofifa_id={r.sofifa_id} nombre={r.jugador} posicion={r.posicion} size="sm" />
                        <div>
                          <p className="font-black text-white text-xs">{r.jugador}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <ClubLogo equipo={r.equipo} sofifa_team_id={eq?.sofifa_team_id} size="xs" />
                            <p className="text-bvb-muted text-[10px]">{r.equipo} · {r.posicion}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    {['partidos','goles','asistencias','tarjetas_amarillas','tarjetas_rojas','clean_sheets'].map((field, fi) => (
                      <td key={field} className={`px-3 py-3 text-center ${fi >= 3 ? (fi===5?'hidden md:table-cell':'hidden sm:table-cell') : ''}`}>
                        {editing?.id === r.id && editing?.field === field ? (
                          <input autoFocus type="number" min="0"
                            defaultValue={r[field] || 0}
                            className="w-12 bg-bvb-black border border-bvb-yellow text-white text-center rounded px-1 py-0.5 text-xs outline-none"
                            onBlur={e => saveCell(r.id, field, e.target.value)}
                            onKeyDown={e => { if(e.key==='Enter') saveCell(r.id, field, e.target.value); if(e.key==='Escape') setEditing(null); }}
                          />
                        ) : (
                          <span onClick={() => setEditing({id:r.id, field})}
                            className={`font-black cursor-pointer hover:text-bvb-yellow transition-colors ${
                              field==='goles' ? 'text-bvb-yellow text-base' :
                              field==='asistencias' ? 'text-green-400 text-base' :
                              field==='clean_sheets' ? 'text-blue-400' :
                              field==='tarjetas_amarillas' ? 'text-yellow-400' :
                              field==='tarjetas_rojas' ? 'text-red-400' : 'text-white'
                            }`}>
                            {r[field] || 0}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-3 hidden sm:table-cell">
                      <button onClick={() => deletePlayer(r.id)} className="text-bvb-muted hover:text-red-400 transition-colors text-xs">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-bvb-muted text-xs">Haz clic en cualquier número para editarlo directamente.</p>

      {/* Add player modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)' }}>
          <div className="bg-bvb-card border border-bvb-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-black text-white text-lg">Añadir jugador a estadísticas</h3>
            {[
              { label:'Jugador', key:'jugador', type:'text' },
              { label:'Equipo', key:'equipo', type:'text' },
              { label:'Sofifa ID', key:'sofifa_id', type:'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <p className="section-label mb-1">{label}</p>
                <input type={type} value={addForm[key]} onChange={e => setAddForm(f=>({...f,[key]:e.target.value}))}
                  className="w-full bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
              </div>
            ))}
            <div>
              <p className="section-label mb-1">Posición</p>
              <div className="flex gap-2">
                {['POR','DEF','MC','DEL'].map(p => (
                  <button key={p} onClick={() => setAddForm(f=>({...f,posicion:p}))}
                    className={`flex-1 py-2 text-xs font-black rounded-lg border transition-all ${addForm.posicion===p?'bg-bvb-yellow text-black border-bvb-yellow':'bg-bvb-black border-bvb-border text-bvb-muted'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['PJ','partidos'],['Goles','goles'],['Asist.','asistencias'],['Amarillas','tarjetas_amarillas'],['Rojas','tarjetas_rojas'],['CS','clean_sheets']].map(([label,key])=>(
                <div key={key}>
                  <p className="section-label mb-1 text-[9px]">{label}</p>
                  <input type="number" min="0" value={addForm[key]} onChange={e=>setAddForm(f=>({...f,[key]:parseInt(e.target.value)||0}))}
                    className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded text-sm text-center focus:border-bvb-yellow outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={addPlayer} disabled={!addForm.jugador||!addForm.equipo}
                className="flex-1 py-2.5 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 hover:bg-bvb-yellow-dim transition-colors">
                Añadir jugador
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 bg-bvb-card border border-bvb-border text-bvb-muted rounded-xl text-xs font-black hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
