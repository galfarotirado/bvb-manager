'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';
import PlayerAvatar from '@/components/PlayerAvatar';

/* ── Shared data ─────────────────────────────────────────────── */
const ALL_TEAMS = [
  'DORTMUND','PSG','REAL MADRID','FC BARCELONA','LIVERPOOL','ARSENAL',
  'BAYERN MUNICH','MAN CITY','INTER MILAN','ATLETICO MADRID','NAPOLI',
  'CHELSEA','MILÁN','BILBAO','NEWCASTLE','JUVENTUS','MAN UNITED',
];

const POSICIONES = ['POR','DEF','MC','DEL'];

/* ── Toast ────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl animate-slide-up transition-all ${
      msg.type === 'ok' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
    }`}>
      {msg.text}
    </div>
  );
}

/* ── Field ────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label className="section-label block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', step, placeholder, autoFocus }) {
  return (
    <input
      type={type} step={step} value={value ?? ''} onChange={onChange}
      placeholder={placeholder} autoFocus={autoFocus}
      className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded-lg text-xs focus:border-bvb-yellow outline-none"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: TRASPASOS
   Move any player in liga_jugadores to any team
   ═══════════════════════════════════════════════════════════════ */
function TabTraspasos() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [moving, setMoving]       = useState(null); // player being moved
  const [destTeam, setDestTeam]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);

  useEffect(() => {
    supabase.from('liga_jugadores')
      .select('id, jugador, equipo, ovr, posicion, clausula, sofifa_id')
      .order('equipo')
      .order('ovr', { ascending: false })
      .then(({ data }) => { setJugadores(data || []); setLoading(false); });
  }, []);

  function toast(text, type = 'ok') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function mover() {
    if (!moving || !destTeam) return;
    setSaving(true);

    // Update liga_jugadores
    const { error } = await supabase.from('liga_jugadores')
      .update({ equipo: destTeam })
      .eq('id', moving.id);

    if (!error) {
      setJugadores(prev => prev.map(j => j.id === moving.id ? { ...j, equipo: destTeam } : j));

      // Sync bvb_plantilla: remove if coming FROM Dortmund
      if (moving.equipo === 'DORTMUND') {
        await supabase.from('bvb_plantilla')
          .delete()
          .or(`nombre.ilike.${moving.jugador},sofifa_id.eq.${moving.sofifa_id || 0}`);
      }

      // Sync bvb_plantilla: add if going TO Dortmund
      if (destTeam === 'DORTMUND') {
        // Check if not already in plantilla
        const { data: exists } = await supabase.from('bvb_plantilla')
          .select('id')
          .or(`nombre.ilike.${moving.jugador}${moving.sofifa_id ? `,sofifa_id.eq.${moving.sofifa_id}` : ''}`)
          .maybeSingle();
        if (!exists) {
          await supabase.from('bvb_plantilla').insert({
            nombre:     moving.jugador,
            posicion:   moving.posicion,
            ovr:        moving.ovr,
            clausula:   parseFloat(moving.clausula) || 1,
            sofifa_id:  moving.sofifa_id || null,
            es_fichaje: true,
            tipo_fichaje: 'compra',
          });
          toast(`${moving.jugador} → DORTMUND + añadido a plantilla ✓`);
        } else {
          toast(`${moving.jugador} → ${destTeam}`);
        }
      } else {
        toast(`${moving.jugador} → ${destTeam}`);
      }
    } else {
      toast('Error al mover', 'err');
    }
    setMoving(null);
    setDestTeam('');
    setSaving(false);
  }

  const filtered = useMemo(() =>
    jugadores
      .filter(j => !filterTeam || j.equipo === filterTeam)
      .filter(j => !search || j.jugador?.toLowerCase().includes(search.toLowerCase()))
  , [jugadores, filterTeam, search]);

  return (
    <div className="space-y-4">
      <Toast msg={msg} />
      <p className="text-bvb-muted text-xs">Mueve jugadores de <strong className="text-white">liga_jugadores</strong> entre equipos. Actualiza el scout y estadísticas de equipos.</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar jugador…"
          className="flex-1 bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-sm focus:border-bvb-yellow outline-none" />
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="bg-bvb-card border border-bvb-border text-white px-3 py-2 rounded-lg text-xs focus:border-bvb-yellow outline-none">
          <option value="">Todos los equipos</option>
          {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <p className="text-bvb-muted text-[10px]">{filtered.length} jugadores</p>

      {loading ? (
        <div className="text-bvb-yellow animate-pulse text-center py-8 font-black tracking-widest">CARGANDO…</div>
      ) : (
        <div className="bg-bvb-card border border-bvb-border rounded-xl divide-y divide-bvb-border overflow-hidden">
          {filtered.slice(0, 150).map(j => (
            <div key={j.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bvb-card-hover transition-colors">
              <PlayerAvatar sofifa_id={j.sofifa_id} nombre={j.jugador} posicion={j.posicion} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs truncate">{j.jugador}</p>
                <p className="text-bvb-muted text-[10px] truncate">{j.equipo} · {j.posicion} · OVR {j.ovr}</p>
              </div>

              {moving?.id === j.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <select value={destTeam} onChange={e => setDestTeam(e.target.value)}
                    className="bg-bvb-black border border-bvb-yellow text-white px-2 py-1 rounded text-[10px] outline-none">
                    <option value="">Seleccionar…</option>
                    {ALL_TEAMS.filter(t => t !== j.equipo).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={mover} disabled={!destTeam || saving}
                    className="px-2 py-1 bg-bvb-yellow text-black text-[10px] font-black uppercase rounded disabled:opacity-40">
                    {saving ? '…' : '✓'}
                  </button>
                  <button onClick={() => { setMoving(null); setDestTeam(''); }}
                    className="text-bvb-muted hover:text-white text-xs px-1">✕</button>
                </div>
              ) : (
                <button onClick={() => { setMoving(j); setDestTeam(''); }}
                  className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-bvb-yellow transition-colors flex-shrink-0">
                  Mover →
                </button>
              )}
            </div>
          ))}
          {filtered.length > 150 && (
            <p className="text-center text-bvb-muted text-xs py-3">
              Mostrando 150 de {filtered.length}. Usa el buscador para filtrar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PLANTILLA BVB
   Edit bvb_plantilla players
   ═══════════════════════════════════════════════════════════════ */
function TabPlantilla() {
  const [plantilla, setPlantilla] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState(null);

  useEffect(() => {
    supabase.from('bvb_plantilla').select('*').order('ovr', { ascending: false })
      .then(({ data }) => { setPlantilla(data || []); setLoading(false); });
  }, []);

  function toast(text, type = 'ok') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('bvb_plantilla')
      .update({
        nombre:    editing.nombre,
        ovr:       parseInt(editing.ovr) || editing.ovr,
        posicion:  editing.posicion,
        clausula:  parseFloat(editing.clausula) || editing.clausula,
        sofifa_id: editing.sofifa_id ? parseInt(editing.sofifa_id) : null,
      })
      .eq('id', editing.id);
    if (!error) {
      setPlantilla(prev => prev.map(p => p.id === editing.id ? { ...p, ...editing } : p));
      toast('Guardado ✓');
      setEditing(null);
    } else {
      toast('Error al guardar', 'err');
    }
    setSaving(false);
  }

  if (loading) return <div className="text-bvb-yellow animate-pulse text-center py-8 font-black tracking-widest">CARGANDO…</div>;

  return (
    <div className="space-y-3">
      <Toast msg={msg} />
      <p className="text-bvb-muted text-xs">Edita los datos de la plantilla del Dortmund: OVR, cláusula, posición y Sofifa ID para las fotos.</p>

      {plantilla.map(p => (
        <div key={p.id} className="bg-bvb-card border border-bvb-border rounded-xl p-4">
          {editing?.id === p.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Field label="Nombre">
                  <Input value={editing.nombre} onChange={e => setEditing(x => ({ ...x, nombre: e.target.value }))} autoFocus />
                </Field>
                <Field label="OVR">
                  <Input type="number" value={editing.ovr} onChange={e => setEditing(x => ({ ...x, ovr: e.target.value }))} />
                </Field>
                <Field label="Posición">
                  <select value={editing.posicion} onChange={e => setEditing(x => ({ ...x, posicion: e.target.value }))}
                    className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded-lg text-xs focus:border-bvb-yellow outline-none">
                    {POSICIONES.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </Field>
                <Field label="Cláusula (M)">
                  <Input type="number" step="0.1" value={editing.clausula} onChange={e => setEditing(x => ({ ...x, clausula: e.target.value }))} />
                </Field>
                <Field label="Sofifa ID">
                  <Input type="number" value={editing.sofifa_id || ''} onChange={e => setEditing(x => ({ ...x, sofifa_id: e.target.value || null }))} />
                </Field>
                {editing.sofifa_id && (
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar sofifa_id={editing.sofifa_id} nombre={editing.nombre} posicion={editing.posicion} size="lg" />
                      <span className="text-bvb-muted text-[10px]">Preview cara</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="px-4 py-1.5 bg-bvb-yellow text-black font-black text-xs uppercase rounded-lg disabled:opacity-40">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(null)}
                  className="px-4 py-1.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.nombre} posicion={p.posicion} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{p.nombre}</p>
                <p className="text-bvb-muted text-xs">{p.posicion} · OVR {p.ovr} · Cláusula {p.clausula}M · ID {p.sofifa_id || '—'}</p>
              </div>
              <button onClick={() => setEditing({ ...p })}
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-bvb-yellow transition-colors flex-shrink-0">
                Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: EQUIPOS
   Edit bvb_equipos data (ranking, OVR, budget, manager…)
   ═══════════════════════════════════════════════════════════════ */
function TabEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    supabase.from('bvb_equipos').select('*').order('ranking')
      .then(({ data }) => { setEquipos(data || []); setLoading(false); });
  }, []);

  function toast(text, type = 'ok') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('bvb_equipos')
      .update({
        ranking:       parseInt(editing.ranking) || editing.ranking,
        ovr_medio:     parseFloat(editing.ovr_medio) || editing.ovr_medio,
        budget:        parseFloat(editing.budget) || editing.budget,
        manager:       editing.manager,
        mejor_jugador: editing.mejor_jugador,
      })
      .eq('id', editing.id);
    if (!error) {
      setEquipos(prev => prev.map(e => e.id === editing.id ? { ...e, ...editing } : e));
      toast('Guardado ✓');
      setEditing(null);
    } else {
      toast('Error al guardar', 'err');
    }
    setSaving(false);
  }

  if (loading) return <div className="text-bvb-yellow animate-pulse text-center py-8 font-black tracking-widest">CARGANDO…</div>;

  return (
    <div className="space-y-3">
      <Toast msg={msg} />
      <p className="text-bvb-muted text-xs">Edita ranking, OVR medio, budget, manager y mejor jugador de cada equipo de la liga.</p>

      {equipos.map(e => (
        <div key={e.id} className="bg-bvb-card border border-bvb-border rounded-xl p-4">
          {editing?.id === e.id ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <ClubLogo equipo={e.equipo} sofifa_team_id={e.sofifa_team_id} size="sm" />
                <p className="font-black text-white text-sm">{e.equipo}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Field label="Ranking">
                  <Input type="number" value={editing.ranking} onChange={ev => setEditing(x => ({ ...x, ranking: ev.target.value }))} autoFocus />
                </Field>
                <Field label="OVR Medio">
                  <Input type="number" step="0.1" value={editing.ovr_medio} onChange={ev => setEditing(x => ({ ...x, ovr_medio: ev.target.value }))} />
                </Field>
                <Field label="Budget (M)">
                  <Input type="number" step="0.1" value={editing.budget} onChange={ev => setEditing(x => ({ ...x, budget: ev.target.value }))} />
                </Field>
                <Field label="Manager">
                  <Input value={editing.manager || ''} onChange={ev => setEditing(x => ({ ...x, manager: ev.target.value }))} />
                </Field>
                <Field label="Mejor jugador">
                  <Input value={editing.mejor_jugador || ''} onChange={ev => setEditing(x => ({ ...x, mejor_jugador: ev.target.value }))} />
                </Field>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="px-4 py-1.5 bg-bvb-yellow text-black font-black text-xs uppercase rounded-lg disabled:opacity-40">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(null)}
                  className="px-4 py-1.5 bg-bvb-card border border-bvb-border text-bvb-muted font-black text-xs uppercase rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-bvb-muted font-black text-xs w-6 text-center flex-shrink-0">#{e.ranking}</span>
              <ClubLogo equipo={e.equipo} sofifa_team_id={e.sofifa_team_id} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{e.equipo}</p>
                <p className="text-bvb-muted text-xs">OVR {e.ovr_medio} · {e.budget}M · {e.manager} · Mejor: {e.mejor_jugador}</p>
              </div>
              <button onClick={() => setEditing({ ...e })}
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-bvb-yellow transition-colors flex-shrink-0">
                Editar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: PRESUPUESTO
   Edit BVB economy + add manual transactions
   ═══════════════════════════════════════════════════════════════ */
function TabPresupuesto() {
  const [economia, setEconomia] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editVal, setEditVal]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);

  // New manual transaction
  const [txForm, setTxForm]         = useState({ jugador: '', precio: '', tipo: 'venta', equipo_destino: '', equipo_origen: 'DORTMUND' });
  const [addingTx, setAddingTx]     = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    Promise.all([
      supabase.from('bvb_economia').select('*').eq('id', 1).single(),
      supabase.from('bvb_traspasos').select('*').order('id', { ascending: false }).limit(20),
    ]).then(([eco, tx]) => {
      setEconomia(eco.data);
      setEditVal(String(eco.data?.budget_inicial || ''));
      setTransactions(tx.data || []);
      setLoading(false);
    });
  }, []);

  function toast(text, type = 'ok') {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  }

  async function saveBudget() {
    const val = parseFloat(editVal);
    if (isNaN(val)) { toast('Valor inválido', 'err'); return; }
    setSaving(true);
    const { error } = await supabase.from('bvb_economia').update({ budget_inicial: val }).eq('id', 1);
    if (!error) {
      setEconomia(prev => ({ ...prev, budget_inicial: val }));
      toast('Presupuesto actualizado ✓');
    }
    setSaving(false);
  }

  async function addTransaction() {
    const precio = parseFloat(txForm.precio);
    if (!txForm.jugador || isNaN(precio)) { toast('Completa jugador y precio', 'err'); return; }
    setAddingTx(true);
    const payload = {
      jugador:        txForm.jugador,
      precio,
      tipo:           txForm.tipo,
      equipo_origen:  txForm.tipo === 'venta' || txForm.tipo === 'clausulazo' ? 'DORTMUND' : txForm.equipo_origen,
      equipo_destino: txForm.tipo === 'compra' ? 'DORTMUND' : txForm.equipo_destino,
    };
    const { data, error } = await supabase.from('bvb_traspasos').insert(payload).select().single();
    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
      setTxForm({ jugador: '', precio: '', tipo: 'venta', equipo_destino: '', equipo_origen: 'DORTMUND' });
      toast('Movimiento añadido ✓');
    } else {
      toast('Error al añadir', 'err');
    }
    setAddingTx(false);
  }

  if (loading) return <div className="text-bvb-yellow animate-pulse text-center py-8 font-black tracking-widest">CARGANDO…</div>;

  return (
    <div className="space-y-5">
      <Toast msg={msg} />

      {/* Budget editor */}
      <div className="bg-bvb-card border border-bvb-border rounded-xl p-5">
        <p className="section-label mb-3">Presupuesto inicial de temporada</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input type="number" step="0.1" value={editVal} onChange={e => setEditVal(e.target.value)}
              className="w-36 bg-bvb-black border border-bvb-yellow text-white px-4 py-3 rounded-lg text-2xl font-black outline-none focus:ring-1 focus:ring-bvb-yellow" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-bvb-muted font-black text-lg">M</span>
          </div>
          <button onClick={saveBudget} disabled={saving}
            className="px-6 py-3 bg-bvb-yellow text-black font-black text-sm uppercase tracking-widest rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity">
            {saving ? '…' : 'Guardar'}
          </button>
        </div>
        <p className="text-bvb-muted text-xs mt-2">Actual en DB: <strong className="text-white">{economia?.budget_inicial}M</strong></p>
      </div>

      {/* Add manual transaction */}
      <div className="bg-bvb-card border border-bvb-border rounded-xl p-5">
        <p className="section-label mb-3">Añadir movimiento manual</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <Field label="Jugador">
            <Input value={txForm.jugador} onChange={e => setTxForm(p => ({ ...p, jugador: e.target.value }))} placeholder="Nombre" />
          </Field>
          <Field label="Precio (M)">
            <Input type="number" step="0.1" value={txForm.precio} onChange={e => setTxForm(p => ({ ...p, precio: e.target.value }))} placeholder="0.0" />
          </Field>
          <Field label="Tipo">
            <select value={txForm.tipo} onChange={e => setTxForm(p => ({ ...p, tipo: e.target.value }))}
              className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded-lg text-xs focus:border-bvb-yellow outline-none">
              <option value="venta">Venta (ingreso)</option>
              <option value="compra">Compra (gasto)</option>
              <option value="clausulazo">Clausulazo recibido</option>
            </select>
          </Field>
          {txForm.tipo !== 'compra' && (
            <Field label="Equipo destino">
              <select value={txForm.equipo_destino} onChange={e => setTxForm(p => ({ ...p, equipo_destino: e.target.value }))}
                className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded-lg text-xs focus:border-bvb-yellow outline-none">
                <option value="">Seleccionar…</option>
                {ALL_TEAMS.filter(t => t !== 'DORTMUND').map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
          {txForm.tipo === 'compra' && (
            <Field label="Equipo origen">
              <select value={txForm.equipo_origen} onChange={e => setTxForm(p => ({ ...p, equipo_origen: e.target.value }))}
                className="w-full bg-bvb-black border border-bvb-border text-white px-2 py-1.5 rounded-lg text-xs focus:border-bvb-yellow outline-none">
                <option value="">Seleccionar…</option>
                {ALL_TEAMS.filter(t => t !== 'DORTMUND').map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          )}
        </div>
        <button onClick={addTransaction} disabled={addingTx}
          className="px-5 py-2 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded-lg disabled:opacity-40">
          {addingTx ? 'Añadiendo…' : '+ Añadir movimiento'}
        </button>
      </div>

      {/* Recent transactions */}
      <div className="bg-bvb-card border border-bvb-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-bvb-border">
          <p className="section-label">Últimos movimientos (20)</p>
        </div>
        {transactions.length === 0 ? (
          <p className="text-bvb-muted text-xs text-center py-6">Sin movimientos registrados</p>
        ) : transactions.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-bvb-border last:border-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              t.equipo_destino?.toUpperCase() === 'DORTMUND' ? 'bg-red-400' : 'bg-green-400'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-xs truncate">{t.jugador}</p>
              <p className="text-bvb-muted text-[10px]">
                {t.equipo_origen} → {t.equipo_destino}
                {t.tipo === 'clausulazo' ? ' · CLAUSULAZO' : ''}
                {t.liberado === false ? ' · INACTIVO' : ''}
              </p>
            </div>
            <span className={`font-black text-sm flex-shrink-0 ${
              t.equipo_destino?.toUpperCase() === 'DORTMUND' ? 'text-red-400' : 'text-green-400'
            }`}>
              {t.equipo_destino?.toUpperCase() === 'DORTMUND' ? '-' : '+'}{t.precio}M
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'traspasos',   label: '⇄ Traspasos Liga' },
  { key: 'plantilla',   label: '🛡 Plantilla BVB' },
  { key: 'equipos',     label: '🏟 Equipos' },
  { key: 'presupuesto', label: '💰 Presupuesto' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('traspasos');

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <div className="section-label mb-1">Panel de Control · CAYR Season 1</div>
        <h1 className="display-text text-3xl text-white">
          Panel de <span className="text-bvb-yellow">Administración</span>
        </h1>
        <p className="text-bvb-muted text-xs mt-1">Edita jugadores, equipos, presupuesto y traspasos directamente desde aquí.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-bvb-border overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === t.key
                ? 'border-bvb-yellow text-bvb-yellow'
                : 'border-transparent text-bvb-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'traspasos'   && <TabTraspasos />}
        {tab === 'plantilla'   && <TabPlantilla />}
        {tab === 'equipos'     && <TabEquipos />}
        {tab === 'presupuesto' && <TabPresupuesto />}
      </div>
    </div>
  );
}
