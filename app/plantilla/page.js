'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import PlayerAvatar from '@/components/PlayerAvatar';
import { useToast } from '@/components/Toast';

const POS_ORDER  = ['POR', 'DEF', 'MC', 'DEL'];
const POS_LABELS = { POR: 'Porteros', DEF: 'Defensas', MC: 'Mediocampistas', DEL: 'Delanteros' };
const POS_ICONS  = { POR: '🧤', DEF: '🛡️', MC: '⚙️', DEL: '⚡' };
const POS_COLORS = { POR: '#f59e0b', DEF: '#3b82f6', MC: '#8b5cf6', DEL: '#ef4444' };

function ovrColor(ovr) {
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  if (ovr >= 78) return '#c084fc';
  return '#f87171';
}

/* ── Toast ─────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl animate-slide-up pointer-events-none ${
      msg.type === 'ok' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
    }`}>{msg.text}</div>
  );
}

/* ── OVR Badge ─────────────────────────────────────────────────── */
function OvrRing({ ovr, size = 'md' }) {
  const s = size === 'lg' ? 'w-14 h-14 text-2xl' : 'w-11 h-11 text-lg';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-black border-2 flex-shrink-0`}
      style={{ borderColor: ovrColor(ovr), color: ovrColor(ovr), boxShadow: `0 0 12px ${ovrColor(ovr)}30` }}>
      {ovr}
    </div>
  );
}

/* ── Player Card ───────────────────────────────────────────────── */
function PlayerCard({ p, onEdit, onRemove, onDetail }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
        p.es_fichaje
          ? 'bg-bvb-card border-bvb-yellow/20 hover:border-bvb-yellow/40'
          : 'bg-bvb-card border-bvb-border hover:border-bvb-yellow/30 hover:bg-bvb-card-hover'
      }`}
      onClick={onDetail}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {p.es_fichaje && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-bvb-yellow rounded-full" />
      )}

      <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.nombre} posicion={p.posicion} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <h3 className="font-black text-white text-sm uppercase tracking-wide">{p.nombre}</h3>
          {p.es_fichaje && (
            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
              p.tipo_fichaje === 'clausulazo' ? 'badge-yellow' :
              p.tipo_fichaje === 'intercambio' ? 'badge-purple' : 'badge-blue'
            }`}>
              {p.tipo_fichaje === 'clausulazo' ? '⚡ Clausulazo' :
               p.tipo_fichaje === 'intercambio' ? '🔀 Swap' : '💰 Fichaje'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
          <span className="text-bvb-muted text-xs">Cláusula: <span className="text-white font-bold">{p.clausula}M</span></span>
          {p.sofifa_id && (
            <a href={`https://sofifa.com/player/${p.sofifa_id}`} target="_blank" rel="noopener noreferrer"
              className="text-bvb-muted text-xs hover:text-bvb-yellow transition-colors">
              sofifa ↗
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`flex gap-1 transition-all ${hover ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-bvb-yellow transition-colors"
            title="Editar">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg border border-bvb-border text-bvb-muted hover:border-red-500 hover:text-red-400 transition-colors"
            title="Eliminar">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <OvrRing ovr={p.ovr} />
      </div>
    </div>
  );
}

/* ── Edit Modal ───────────────────────────────────────────────── */
function EditModal({ player, onSave, onClose, saving }) {
  const [form, setForm] = useState({ ...player });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bvb-dark border border-bvb-border rounded-2xl p-6 z-50 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-white uppercase tracking-widest text-sm">Editar jugador</h3>
          <button onClick={onClose} className="text-bvb-muted hover:text-white text-xl">✕</button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-bvb-card rounded-xl border border-bvb-border">
          <PlayerAvatar sofifa_id={form.sofifa_id} nombre={form.nombre} posicion={form.posicion} size="lg" />
          <div>
            <p className="font-black text-white text-sm">{form.nombre}</p>
            <p className="text-bvb-muted text-xs">Sofifa ID: {form.sofifa_id || 'no asignado'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="section-label block mb-1">Nombre</label>
            <input value={form.nombre || ''} onChange={f('nombre')}
              className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
          </div>
          <div>
            <label className="section-label block mb-1">OVR</label>
            <input type="number" value={form.ovr || ''} onChange={f('ovr')}
              className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
          </div>
          <div>
            <label className="section-label block mb-1">Posición</label>
            <select value={form.posicion || ''} onChange={f('posicion')}
              className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none">
              {POS_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="section-label block mb-1">Cláusula (M)</label>
            <input type="number" step="0.1" value={form.clausula || ''} onChange={f('clausula')}
              className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
          </div>
          <div>
            <label className="section-label block mb-1">Sofifa ID</label>
            <input type="number" value={form.sofifa_id || ''} onChange={f('sofifa_id')}
              className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex-1 py-2.5 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded-lg disabled:opacity-40">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase rounded-lg">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Player Drawer ────────────────────────────────────────── */
function AddDrawer({ plantillaIds, onAdd, onClose, saving }) {
  const [ligaPlayers, setLigaPlayers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(null);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [form, setForm]               = useState({ ovr: '', clausula: '', posicion: 'DEL', tipo_fichaje: 'compra' });

  useEffect(() => {
    supabase.from('liga_jugadores')
      .select('id, jugador, ovr, posicion, clausula, sofifa_id')
      .eq('equipo', 'DORTMUND')
      .order('ovr', { ascending: false })
      .then(({ data }) => {
        // Filter out players already in plantilla by sofifa_id match or name match
        const available = (data || []).filter(lp =>
          !plantillaIds.sofifaSet.has(lp.sofifa_id) && !plantillaIds.nameSet.has(lp.jugador?.toLowerCase())
        );
        setLigaPlayers(available);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() =>
    ligaPlayers.filter(p => !search || p.jugador?.toLowerCase().includes(search.toLowerCase()))
  , [ligaPlayers, search]);

  function selectPlayer(p) {
    setSelected(p);
    setForm({ ovr: String(p.ovr), clausula: String(parseFloat(p.clausula) || 1), posicion: p.posicion, tipo_fichaje: 'compra' });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-bvb-dark border border-bvb-border rounded-t-2xl sm:rounded-2xl z-50 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-bvb-border flex-shrink-0">
          <h3 className="font-black text-white uppercase tracking-widest text-sm">Añadir jugador</h3>
          <button onClick={onClose} className="text-bvb-muted hover:text-white text-xl">✕</button>
        </div>

        {selected ? (
          /* Confirm form */
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-bvb-card rounded-xl border border-bvb-yellow/20">
              <PlayerAvatar sofifa_id={selected.sofifa_id} nombre={selected.jugador} posicion={selected.posicion} size="md" />
              <div>
                <p className="font-black text-white text-sm">{selected.jugador}</p>
                <p className="text-bvb-muted text-xs">Liga: OVR {selected.ovr} · {selected.posicion}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="section-label block mb-1">OVR</label>
                <input type="number" value={form.ovr}
                  onChange={e => setForm(f => ({ ...f, ovr: e.target.value }))}
                  className="w-full bg-bvb-card border border-bvb-border text-white px-2 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
              </div>
              <div>
                <label className="section-label block mb-1">Cláusula (M)</label>
                <input type="number" step="0.1" value={form.clausula}
                  onChange={e => setForm(f => ({ ...f, clausula: e.target.value }))}
                  className="w-full bg-bvb-card border border-bvb-border text-white px-2 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
              </div>
              <div>
                <label className="section-label block mb-1">Posición</label>
                <select value={form.posicion}
                  onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}
                  className="w-full bg-bvb-card border border-bvb-border text-white px-2 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none">
                  {POS_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="section-label block mb-1">Tipo de fichaje</label>
              <select value={form.tipo_fichaje}
                onChange={e => setForm(f => ({ ...f, tipo_fichaje: e.target.value }))}
                className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none">
                <option value="compra">💰 Compra</option>
                <option value="clausulazo">⚡ Clausulazo</option>
                <option value="intercambio">🔀 Intercambio</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAdd(selected, form)}
                disabled={saving || !form.ovr}
                className="flex-1 py-2.5 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded-lg disabled:opacity-40">
                {saving ? 'Añadiendo…' : '✓ Confirmar fichaje'}
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase rounded-lg">
                ← Volver
              </button>
            </div>
          </div>
        ) : (
          /* Player list */
          <>
            <div className="p-4 border-b border-bvb-border flex-shrink-0">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar jugador del Dortmund…"
                className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
              <p className="text-bvb-muted text-[10px] mt-2">
                {loading ? 'Cargando…' : `${filtered.length} jugadores disponibles del Dortmund`}
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <p className="text-bvb-muted text-sm">No hay nuevos jugadores para añadir.</p>
                  <p className="text-bvb-muted text-xs mt-1">
                    Mueve jugadores al Dortmund desde <a href="/admin" className="text-bvb-yellow hover:underline">Admin → Traspasos</a>.
                  </p>
                </div>
              )}
              {filtered.map(p => (
                <button key={p.id} onClick={() => selectPlayer(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-bvb-border hover:bg-bvb-card transition-colors text-left">
                  <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.jugador} posicion={p.posicion} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{p.jugador}</p>
                    <p className="text-bvb-muted text-xs">{p.posicion} · OVR {p.ovr} · Cláusula {p.clausula}M</p>
                  </div>
                  <span className="text-bvb-yellow text-xs font-black flex-shrink-0">Seleccionar →</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Plantilla() {
  const [plantilla, setPlantilla]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [msg, setMsg]               = useState(null);
  const [search, setSearch]         = useState('');
  const [detailPlayer, setDetailPlayer] = useState(null);
  const globalToast                 = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('bvb_plantilla').select('*').order('ovr', { ascending: false });
    setPlantilla(data || []);
    setLoading(false);
  }

  function toast(text, type = 'ok') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function saveEdit(form) {
    setSaving(true);
    const { error } = await supabase.from('bvb_plantilla').update({
      nombre:    form.nombre,
      ovr:       parseInt(form.ovr) || 0,
      posicion:  form.posicion,
      clausula:  parseFloat(form.clausula) || 0,
      sofifa_id: form.sofifa_id ? parseInt(form.sofifa_id) : null,
    }).eq('id', editing.id);
    if (!error) {
      setPlantilla(prev => prev.map(p =>
        p.id === editing.id
          ? { ...p, nombre: form.nombre, ovr: parseInt(form.ovr), posicion: form.posicion, clausula: parseFloat(form.clausula), sofifa_id: form.sofifa_id ? parseInt(form.sofifa_id) : null }
          : p
      ).sort((a, b) => b.ovr - a.ovr));
      toast('Guardado ✓');
      globalToast('Jugador guardado correctamente', 'success');
      setEditing(null);
    } else {
      toast('Error al guardar', 'err');
      globalToast('Error al guardar', 'error');
    }
    setSaving(false);
  }

  async function removePlayer(p) {
    if (!confirm(`¿Eliminar a ${p.nombre} de la plantilla?`)) return;
    const { error } = await supabase.from('bvb_plantilla').delete().eq('id', p.id);
    if (!error) {
      setPlantilla(prev => prev.filter(x => x.id !== p.id));
      toast(`${p.nombre} eliminado`);
      globalToast('Jugador eliminado', 'success');
    }
  }

  async function addPlayer(ligaPlayer, form) {
    setSaving(true);
    const { data, error } = await supabase.from('bvb_plantilla').insert({
      nombre:       ligaPlayer.jugador,
      posicion:     form.posicion || ligaPlayer.posicion,
      ovr:          parseInt(form.ovr) || ligaPlayer.ovr,
      clausula:     parseFloat(form.clausula) || parseFloat(ligaPlayer.clausula) || 1,
      sofifa_id:    ligaPlayer.sofifa_id || null,
      es_fichaje:   true,
      tipo_fichaje: form.tipo_fichaje || 'compra',
    }).select().single();
    if (!error && data) {
      setPlantilla(prev => [...prev, data].sort((a, b) => b.ovr - a.ovr));
      setShowAdd(false);
      toast(`${ligaPlayer.jugador} añadido ✓`);
      globalToast('Jugador añadido correctamente', 'success');
    } else {
      toast('Error al añadir', 'err');
      globalToast('Error al guardar', 'error');
    }
    setSaving(false);
  }

  // Set for de-duplication in AddDrawer
  const plantillaIds = useMemo(() => ({
    sofifaSet: new Set(plantilla.map(p => p.sofifa_id).filter(Boolean)),
    nameSet:   new Set(plantilla.map(p => p.nombre?.toLowerCase()).filter(Boolean)),
  }), [plantilla]);

  const filteredPlantilla = plantilla.filter(p => p.nombre?.toLowerCase().includes(search.toLowerCase()));

  const grouped = POS_ORDER.reduce((acc, pos) => {
    acc[pos] = filteredPlantilla.filter(p => p.posicion === pos);
    return acc;
  }, {});

  const totalClausula = plantilla.reduce((s, p) => s + (parseFloat(p.clausula) || 0), 0);
  const avgOvr        = plantilla.length ? (plantilla.reduce((s, p) => s + p.ovr, 0) / plantilla.length).toFixed(1) : 0;
  const fichajes      = plantilla.filter(p => p.es_fichaje);
  const top           = plantilla[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest">CARGANDO...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <Toast msg={msg} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="section-label mb-1">Borussia Dortmund · CAYR S1</div>
          <h1 className="display-text text-3xl text-white">
            <span className="text-bvb-yellow">Mi</span> Plantilla
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded hover:bg-bvb-yellow-dim transition-colors">
            + Añadir Jugador
          </button>
          <a href="/once"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bvb-card border border-bvb-border text-white font-black text-xs uppercase tracking-widest rounded hover:border-bvb-yellow transition-colors">
            ⬡ Alineación
          </a>
          <a href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase tracking-widest rounded hover:border-bvb-yellow hover:text-white transition-colors">
            ⚙ Admin
          </a>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase tracking-widest rounded hover:border-bvb-yellow hover:text-white transition-colors">
            📄 PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jugadores',  value: plantilla.length },
          { label: 'OVR Medio',  value: avgOvr },
          { label: 'Fichajes S1', value: fichajes.length },
          { label: 'Σ Cláusulas', value: totalClausula.toFixed(0) + 'M' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bvb-card border border-bvb-border rounded-xl p-4 text-center hover-lift hover:border-bvb-yellow/30 transition-all">
            <p className="section-label mb-1">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Best player */}
      {top && (
        <div className="relative overflow-hidden rounded-xl border border-bvb-yellow/40 p-5 flex items-center gap-5 animate-glow-pulse"
          style={{ background: 'linear-gradient(135deg, #1a1a00 0%, #0f0f00 100%)' }}>
          <div className="animate-stripe-march absolute inset-0 opacity-70" />
          <div className="relative flex flex-col sm:flex-row items-center gap-5 w-full">
            <PlayerAvatar sofifa_id={top.sofifa_id} nombre={top.nombre} posicion={top.posicion} size="xl" />
            <div className="flex-1">
              <div className="section-label mb-1">Mejor jugador</div>
              <h2 className="display-text text-3xl text-white leading-none">{top.nombre}</h2>
              <p className="text-bvb-muted text-sm mt-1">{top.posicion} · Cláusula {top.clausula}M</p>
            </div>
            <div className="text-right">
              <div className="section-label mb-1">OVR</div>
              <div className="display-text text-5xl" style={{ color: ovrColor(top.ovr) }}>{top.ovr}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Buscar jugador..."
        className="w-full bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none mb-3" />

      {/* Players by position */}
      {POS_ORDER.map(pos => {
        const group = grouped[pos];
        if (!group?.length) return null;
        return (
          <div key={pos}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">{POS_ICONS[pos]}</span>
              <h2 className="font-black text-white uppercase tracking-wider text-sm">{POS_LABELS[pos]}</h2>
              <span className="text-bvb-muted text-xs">({group.length})</span>
              <div className="flex-1 h-px bg-bvb-border" />
            </div>
            <div className="space-y-2">
              {group.map(p => (
                <PlayerCard
                  key={p.id} p={p}
                  onEdit={() => setEditing(p)}
                  onRemove={() => removePlayer(p)}
                  onDetail={() => setDetailPlayer(p)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {plantilla.length === 0 && (
        <div className="text-center py-16">
          <p className="text-bvb-muted text-lg font-bold">Plantilla vacía</p>
          <p className="text-bvb-muted text-sm mt-1">Pulsa "+ Añadir Jugador" para empezar</p>
        </div>
      )}
      {plantilla.length > 0 && filteredPlantilla.length === 0 && search && (
        <div className="text-center py-10">
          <p className="text-bvb-muted font-bold">Sin resultados para "{search}"</p>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          player={editing}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      )}

      {/* Add drawer */}
      {showAdd && (
        <AddDrawer
          plantillaIds={plantillaIds}
          onAdd={addPlayer}
          onClose={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* Player detail modal */}
      {detailPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setDetailPlayer(null)}>
          <div className="bg-bvb-card border border-bvb-border rounded-2xl p-6 w-full max-w-sm space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <PlayerAvatar sofifa_id={detailPlayer.sofifa_id} nombre={detailPlayer.nombre} posicion={detailPlayer.posicion} size="xl" />
                <div>
                  <h3 className="font-black text-white text-base uppercase tracking-wide">{detailPlayer.nombre}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                    detailPlayer.posicion==='POR'?'text-amber-400 bg-amber-400/10':
                    detailPlayer.posicion==='DEF'?'text-blue-400 bg-blue-400/10':
                    detailPlayer.posicion==='MC'?'text-purple-400 bg-purple-400/10':'text-red-400 bg-red-400/10'
                  }`}>{detailPlayer.posicion}</span>
                </div>
              </div>
              <button onClick={() => setDetailPlayer(null)} className="text-bvb-muted hover:text-white text-lg">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'OVR',      value: detailPlayer.ovr,       color: '#FFE500' },
                { label: 'Potencial',value: detailPlayer.potencial || '—', color: '#4ade80' },
                { label: 'Edad',     value: detailPlayer.edad ? `${detailPlayer.edad}a` : '—', color: '#60a5fa' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-bvb-black rounded-xl p-3">
                  <p className="section-label text-[9px] mb-1">{label}</p>
                  <p className="font-black text-xl" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 bg-bvb-black rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-bvb-muted text-xs">Cláusula</span>
                <span className="font-black text-white text-sm">{detailPlayer.clausula}M</span>
              </div>
              {detailPlayer.es_fichaje && (
                <div className="flex justify-between items-center">
                  <span className="text-bvb-muted text-xs">Tipo fichaje</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${
                    detailPlayer.tipo_fichaje==='clausulazo'?'badge-yellow':
                    detailPlayer.tipo_fichaje==='intercambio'?'badge-purple':'badge-blue'
                  }`}>{detailPlayer.tipo_fichaje}</span>
                </div>
              )}
              {detailPlayer.sofifa_id && (
                <div className="flex justify-between items-center">
                  <span className="text-bvb-muted text-xs">Sofifa ID</span>
                  <a href={`https://sofifa.com/player/${detailPlayer.sofifa_id}`} target="_blank"
                    className="text-bvb-yellow text-xs font-bold hover:underline">{detailPlayer.sofifa_id} ↗</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
