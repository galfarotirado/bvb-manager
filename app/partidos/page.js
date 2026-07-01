'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';

const EQUIPOS = [
  'PSG','REAL MADRID','FC BARCELONA','LIVERPOOL','ARSENAL',
  'BAYERN MUNICH','MAN CITY','INTER MILAN','ATLETICO MADRID',
  'NAPOLI','CHELSEA','MILÁN','DORTMUND','BILBAO',
  'NEWCASTLE','JUVENTUS','MAN UNITED',
];

const TEAM_COLORS = {
  'DORTMUND': '#FFE500',
  'PSG': '#004170',
  'REAL MADRID': '#FEBE10',
  'FC BARCELONA': '#A50044',
  'LIVERPOOL': '#C8102E',
  'ARSENAL': '#EF0107',
  'BAYERN MUNICH': '#DC052D',
  'MAN CITY': '#6CABDD',
  'INTER MILAN': '#010E80',
  'ATLETICO MADRID': '#CB3524',
  'NAPOLI': '#12A0D7',
  'CHELSEA': '#034694',
  'MILÁN': '#FB090B',
  'BILBAO': '#EE2523',
  'NEWCASTLE': '#241F20',
  'JUVENTUS': '#888888',
  'MAN UNITED': '#DA291C',
};

function calcStandings(partidos) {
  const table = {};
  EQUIPOS.forEach(e => {
    table[e] = { equipo: e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });
  (partidos || []).filter(p => p.jugado && p.goles_local != null && p.goles_visitante != null).forEach(p => {
    const h = table[p.equipo_local];
    const a = table[p.equipo_visitante];
    if (!h || !a) return;
    h.pj++; a.pj++;
    h.gf += p.goles_local; h.gc += p.goles_visitante;
    a.gf += p.goles_visitante; a.gc += p.goles_local;
    if (p.goles_local > p.goles_visitante) { h.pg++; h.pts += 3; a.pp++; }
    else if (p.goles_local < p.goles_visitante) { a.pg++; a.pts += 3; h.pp++; }
    else { h.pe++; a.pe++; h.pts++; a.pts++; }
  });
  return Object.values(table).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
}

export default function PartidosPage() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('clasificacion');
  const [filterJornada, setFilterJornada] = useState('all');
  const [form, setForm] = useState({
    jornada: 1, equipo_local: 'DORTMUND', equipo_visitante: '', goles_local: '', goles_visitante: '', jugado: true, fecha: '', notas: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPartidos(); }, []);

  async function fetchPartidos() {
    const { data } = await supabase.from('bvb_partidos').select('*').order('jornada').order('id');
    setPartidos(data || []);
    setLoading(false);
  }

  async function savePartido() {
    if (!form.equipo_visitante) return;
    setSaving(true);
    const payload = {
      jornada: parseInt(form.jornada),
      equipo_local: form.equipo_local,
      equipo_visitante: form.equipo_visitante,
      goles_local: form.goles_local !== '' ? parseInt(form.goles_local) : null,
      goles_visitante: form.goles_visitante !== '' ? parseInt(form.goles_visitante) : null,
      jugado: form.jugado,
      fecha: form.fecha || null,
      notas: form.notas || null,
    };
    await supabase.from('bvb_partidos').insert(payload);
    await fetchPartidos();
    setShowForm(false);
    setSaving(false);
    setForm({ jornada: parseInt(form.jornada) + 1, equipo_local: 'DORTMUND', equipo_visitante: '', goles_local: '', goles_visitante: '', jugado: true, fecha: '', notas: '' });
  }

  async function deletePartido(id) {
    if (!confirm('¿Eliminar este partido?')) return;
    await supabase.from('bvb_partidos').delete().eq('id', id);
    setPartidos(prev => prev.filter(p => p.id !== id));
  }

  const standings = calcStandings(partidos);
  const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a,b) => a-b);
  const bvbPartidos = partidos.filter(p => p.equipo_local === 'DORTMUND' || p.equipo_visitante === 'DORTMUND');
  const filteredPartidos = filterJornada === 'all' ? partidos : partidos.filter(p => p.jornada === parseInt(filterJornada));
  const bvbStanding = standings.find(s => s.equipo === 'DORTMUND');
  const proximosBVB = partidos
    .filter(p => !p.jugado && (p.equipo_local === 'DORTMUND' || p.equipo_visitante === 'DORTMUND'))
    .sort((a,b) => a.jornada - b.jornada)
    .slice(0, 5);
  const proximosTodos = partidos
    .filter(p => !p.jugado)
    .sort((a,b) => a.jornada - b.jornada)
    .slice(0, 10);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest text-lg">CARGANDO PARTIDOS...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1">CAYR Season 1</div>
          <h1 className="text-2xl font-black uppercase tracking-wide">
            <span className="text-bvb-yellow">Partidos</span> & Clasificación
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-bvb-yellow text-black text-xs font-black uppercase tracking-widest rounded hover:bg-bvb-yellow-dim transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span> Añadir Partido
        </button>
      </div>

      {/* BVB quick stats */}
      {bvbStanding && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[
            { label: 'Pos', value: `#${standings.indexOf(bvbStanding) + 1}`, color: 'text-bvb-yellow' },
            { label: 'PJ', value: bvbStanding.pj },
            { label: 'G', value: bvbStanding.pg, color: 'text-green-400' },
            { label: 'E', value: bvbStanding.pe, color: 'text-blue-400' },
            { label: 'P', value: bvbStanding.pp, color: 'text-red-400' },
            { label: 'GF', value: bvbStanding.gf },
            { label: 'GD', value: bvbStanding.gf - bvbStanding.gc > 0 ? `+${bvbStanding.gf - bvbStanding.gc}` : bvbStanding.gf - bvbStanding.gc },
            { label: 'PTS', value: bvbStanding.pts, color: 'text-bvb-yellow text-2xl' },
          ].map(({ label, value, color = 'text-white' }) => (
            <div key={label} className="bg-bvb-card border border-bvb-yellow/20 rounded-lg p-2 text-center">
              <p className="text-bvb-muted text-[10px] font-bold uppercase tracking-widest">{label}</p>
              <p className={`font-black text-xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-bvb-card border border-bvb-yellow/30 rounded-xl p-5 animate-slide-up">
          <h3 className="font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-bvb-yellow">+</span> Nuevo Partido
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="section-label block mb-1">Jornada</label>
              <input type="number" min="1" value={form.jornada} onChange={e => setForm(p => ({ ...p, jornada: e.target.value }))}
                className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <div>
              <label className="section-label block mb-1">Local</label>
              <select value={form.equipo_local} onChange={e => setForm(p => ({ ...p, equipo_local: e.target.value }))}
                className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none">
                {EQUIPOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">Visitante</label>
              <select value={form.equipo_visitante} onChange={e => setForm(p => ({ ...p, equipo_visitante: e.target.value }))}
                className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none">
                <option value="">Seleccionar...</option>
                {EQUIPOS.filter(e => e !== form.equipo_local).map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <div>
              <label className="section-label block mb-1">Goles local</label>
              <input type="number" min="0" value={form.goles_local} onChange={e => setForm(p => ({ ...p, goles_local: e.target.value }))}
                placeholder="–" className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <div>
              <label className="section-label block mb-1">Goles visitante</label>
              <input type="number" min="0" value={form.goles_visitante} onChange={e => setForm(p => ({ ...p, goles_visitante: e.target.value }))}
                placeholder="–" className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <div>
              <label className="section-label block mb-1">Notas</label>
              <input value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                placeholder="Opcional..." className="w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={savePartido} disabled={saving || !form.equipo_visitante}
                className="flex-1 py-2 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded disabled:opacity-50 hover:bg-bvb-yellow-dim transition-colors">
                {saving ? '...' : 'Guardar'}
              </button>
              <button onClick={() => setShowForm(false)} className="py-2 px-3 border border-bvb-border text-bvb-muted text-xs rounded hover:border-bvb-yellow hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bvb-border">
        {[
          { key: 'clasificacion', label: 'Clasificación' },
          { key: 'partidos', label: `Partidos (${partidos.length})` },
          { key: 'bvb', label: `BVB (${bvbPartidos.length})` },
          { key: 'proximos', label: `Próximos (${proximosTodos.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              tab === t.key ? 'border-bvb-yellow text-bvb-yellow' : 'border-transparent text-bvb-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Clasificación */}
      {tab === 'clasificacion' && (
        <div className="overflow-x-auto rounded-xl border border-bvb-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bvb-border">
                <th className="text-left px-4 py-3 text-bvb-muted font-bold text-xs uppercase tracking-widest w-8">#</th>
                <th className="text-left px-4 py-3 text-bvb-muted font-bold text-xs uppercase tracking-widest">Equipo</th>
                {['PJ','G','E','P','GF','GC','GD','PTS'].map(h => (
                  <th key={h} className="text-center px-3 py-3 text-bvb-muted font-bold text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => {
                const isBVB = row.equipo === 'DORTMUND';
                const gd = row.gf - row.gc;
                return (
                  <tr key={row.equipo}
                    className={`border-b border-bvb-border transition-colors ${
                      isBVB ? 'bg-bvb-yellow/5 border-bvb-yellow/20' : 'hover:bg-bvb-card'
                    }`}>
                    <td className="px-4 py-3">
                      <span className={`font-black text-sm ${i < 3 ? 'text-bvb-yellow' : i < 6 ? 'text-green-400' : 'text-bvb-muted'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ClubLogo equipo={row.equipo} size="sm" />
                        <span className={`font-bold ${isBVB ? 'text-bvb-yellow' : 'text-white'}`}>{row.equipo}</span>
                        {isBVB && <span className="text-[9px] font-black bg-bvb-yellow/20 text-bvb-yellow px-1.5 py-0.5 rounded tracking-widest">TÚ</span>}
                      </div>
                    </td>
                    <td className="text-center px-3 py-3 text-bvb-muted">{row.pj}</td>
                    <td className="text-center px-3 py-3 text-green-400 font-semibold">{row.pg}</td>
                    <td className="text-center px-3 py-3 text-blue-400 font-semibold">{row.pe}</td>
                    <td className="text-center px-3 py-3 text-red-400 font-semibold">{row.pp}</td>
                    <td className="text-center px-3 py-3 text-white">{row.gf}</td>
                    <td className="text-center px-3 py-3 text-white">{row.gc}</td>
                    <td className={`text-center px-3 py-3 font-semibold ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-bvb-muted'}`}>
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                    <td className="text-center px-3 py-3">
                      <span className={`font-black text-base ${isBVB ? 'text-bvb-yellow' : 'text-white'}`}>{row.pts}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* All Partidos */}
      {tab === 'partidos' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="section-label">Jornada:</span>
            {['all', ...jornadas].map(j => (
              <button key={j} onClick={() => setFilterJornada(String(j))}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                  filterJornada === String(j) ? 'bg-bvb-yellow text-black' : 'bg-bvb-card text-bvb-muted border border-bvb-border hover:border-bvb-yellow hover:text-white'
                }`}>
                {j === 'all' ? 'Todas' : `J${j}`}
              </button>
            ))}
          </div>
          <PartidosList partidos={filteredPartidos} onDelete={deletePartido} />
        </div>
      )}

      {/* BVB Partidos */}
      {tab === 'bvb' && (
        bvbPartidos.length === 0 ? (
          <div className="text-center py-12 text-bvb-muted">
            <div className="text-4xl mb-3">⚽</div>
            <p className="font-bold">No hay partidos de BVB registrados</p>
            <p className="text-sm mt-1">Añade el primer resultado</p>
          </div>
        ) : <PartidosList partidos={bvbPartidos} onDelete={deletePartido} highlight="DORTMUND" />
      )}
    </div>
  );
}

function PartidosList({ partidos, onDelete, highlight }) {
  if (!partidos.length) return (
    <div className="text-center py-12 text-bvb-muted">
      <div className="text-4xl mb-3">📋</div>
      <p className="font-bold">Sin partidos en esta selección</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {partidos.map(p => {
        const hlLocal = highlight && p.equipo_local === highlight;
        const hlVisit = highlight && p.equipo_visitante === highlight;
        const winnerLocal = p.jugado && p.goles_local > p.goles_visitante;
        const winnerVisit = p.jugado && p.goles_visitante > p.goles_local;
        const draw = p.jugado && p.goles_local === p.goles_visitante;

        return (
          <div key={p.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              (hlLocal || hlVisit) ? 'bg-bvb-yellow/5 border-bvb-yellow/25' : 'bg-bvb-card border-bvb-border hover:border-bvb-border-bright'
            }`}>
            {/* Jornada */}
            <div className="flex-shrink-0 w-8 text-center">
              <span className="text-bvb-muted text-[10px] font-bold">J{p.jornada}</span>
            </div>
            {/* Local */}
            <div className={`flex-1 flex items-center justify-end gap-2 font-bold text-sm ${winnerLocal ? 'text-white' : draw ? 'text-bvb-muted-bright' : 'text-bvb-muted'} ${hlLocal ? 'text-bvb-yellow' : ''}`}>
              <span className="hidden sm:inline truncate">{p.equipo_local}</span>
              <ClubLogo equipo={p.equipo_local} size="sm" className="flex-shrink-0" />
            </div>
            {/* Score */}
            <div className="flex-shrink-0 flex items-center gap-1">
              {p.jugado ? (
                <div className={`flex items-center gap-1 px-3 py-1 rounded font-black text-base ${draw ? 'text-blue-400' : 'text-white'}`}
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className={winnerLocal ? 'text-green-400' : ''}>{p.goles_local}</span>
                  <span className="text-bvb-muted">–</span>
                  <span className={winnerVisit ? 'text-green-400' : ''}>{p.goles_visitante}</span>
                </div>
              ) : (
                <div className="px-3 py-1 rounded text-bvb-muted text-xs font-bold border border-bvb-border">
                  vs
                </div>
              )}
            </div>
            {/* Visitante */}
            <div className={`flex-1 flex items-center gap-2 font-bold text-sm ${winnerVisit ? 'text-white' : draw ? 'text-bvb-muted-bright' : 'text-bvb-muted'} ${hlVisit ? 'text-bvb-yellow' : ''}`}>
              <ClubLogo equipo={p.equipo_visitante} size="sm" className="flex-shrink-0" />
              <span className="hidden sm:inline truncate">{p.equipo_visitante}</span>
            </div>
            {/* Delete */}
            <button onClick={() => onDelete(p.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-bvb-muted hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs">
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
