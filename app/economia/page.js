'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';


export default function EconomiaPage() {
  const [economia, setEconomia] = useState(null);
  const [traspasos, setTraspasos] = useState([]);
  const [ventanas, setVentanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);
  const [newVentana, setNewVentana] = useState({ nombre: '', fecha_inicio: '', fecha_fin: '' });
  const [addingVentana, setAddingVentana] = useState(false);
  const [tab, setTab] = useState('resumen');
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetVal, setEditBudgetVal] = useState('');
  const [savingBudget, setSavingBudget]   = useState(false);
  const [editingDisp, setEditingDisp]     = useState(false);
  const [editDispVal, setEditDispVal]     = useState('');
  const [editingInact, setEditingInact]   = useState(false);
  const [editInactVal, setEditInactVal]   = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [eco, tras, vent] = await Promise.all([
      supabase.from('bvb_economia').select('*').eq('id', 1).single(),
      supabase.from('bvb_traspasos').select('*').order('id', { ascending: false }),
      supabase.from('bvb_ventanas').select('*').order('fecha_inicio', { ascending: false }),
    ]);
    setEconomia(eco.data);
    setNotas(eco.data?.notas || '');
    setTraspasos(tras.data || []);
    setVentanas(vent.data || []);
    setLoading(false);
  }

  // BVB income/expense calculations
  const bvbVentas = traspasos.filter(t =>
    t.equipo_origen?.toUpperCase() === 'DORTMUND' && t.tipo !== 'clausulazo' && t.liberado !== false
  );
  const bvbCompras = traspasos.filter(t =>
    t.equipo_destino?.toUpperCase() === 'DORTMUND'
  );
  // Clausulazos RECIBIDOS (alguien nos compró un jugador activando cláusula)
  const clausulazosRecibidos = traspasos.filter(t =>
    t.equipo_origen?.toUpperCase() === 'DORTMUND' && t.tipo === 'clausulazo'
  );
  // Inactive = clausulazos not yet liberated
  const clausulazosInactivos = clausulazosRecibidos.filter(t => t.liberado === false);
  const clausulazosActivos   = clausulazosRecibidos.filter(t => t.liberado !== false);

  const ingresos = bvbVentas.reduce((s, t) => s + (parseFloat(t.precio) || 0), 0)
                 + clausulazosActivos.reduce((s, t) => s + (parseFloat(t.precio) || 0), 0);
  const gastos   = bvbCompras.reduce((s, t) => s + (parseFloat(t.precio) || 0), 0);
  const pendiente = clausulazosInactivos.reduce((s, t) => s + (parseFloat(t.precio) || 0), 0);

  // Si hay presupuesto_actual manual, usarlo directamente; si no, calcular desde budget_inicial
  const presupuestoManual = economia?.presupuesto_actual != null ? parseFloat(economia.presupuesto_actual) : null;
  const inactivoManual    = economia?.inactivo_manual    != null ? parseFloat(economia.inactivo_manual)    : null;
  const budgetInicial = parseFloat(economia?.budget_inicial || 82);
  const disponible = presupuestoManual != null ? presupuestoManual : (budgetInicial + ingresos - gastos);
  const pendienteTotal = inactivoManual != null ? inactivoManual : pendiente;
  const pct = Math.max(0, Math.min(100, (disponible / (disponible + pendienteTotal)) * 100));

  async function liberarClausulazo(id) {
    await supabase.from('bvb_traspasos').update({ liberado: true }).eq('id', id);
    setTraspasos(prev => prev.map(t => t.id === id ? { ...t, liberado: true } : t));
  }

  async function marcarInactivo(id) {
    await supabase.from('bvb_traspasos').update({ liberado: false }).eq('id', id);
    setTraspasos(prev => prev.map(t => t.id === id ? { ...t, liberado: false } : t));
  }

  async function saveBudget() {
    const val = parseFloat(editBudgetVal);
    if (isNaN(val) || val < 0) return;
    setSavingBudget(true);
    await supabase.from('bvb_economia').update({ budget_inicial: val }).eq('id', 1);
    setEconomia(prev => ({ ...prev, budget_inicial: val }));
    setEditingBudget(false);
    setSavingBudget(false);
  }

  async function saveDisponible() {
    const val = parseFloat(editDispVal);
    if (isNaN(val) || val < 0) return;
    await supabase.from('bvb_economia').update({ presupuesto_actual: val }).eq('id', 1);
    setEconomia(prev => ({ ...prev, presupuesto_actual: val }));
    setEditingDisp(false);
  }

  async function saveInactivo() {
    const val = parseFloat(editInactVal);
    if (isNaN(val) || val < 0) return;
    await supabase.from('bvb_economia').update({ inactivo_manual: val }).eq('id', 1);
    setEconomia(prev => ({ ...prev, inactivo_manual: val }));
    setEditingInact(false);
  }

  async function saveNotas() {
    setSavingNotas(true);
    if (economia?.id) {
      await supabase.from('bvb_economia').update({ notas }).eq('id', economia.id);
    } else {
      await supabase.from('bvb_economia').insert({ notas, budget_inicial: 31.8 });
    }
    setSavingNotas(false);
  }

  async function addVentana() {
    if (!newVentana.nombre) return;
    setAddingVentana(true);
    const { data } = await supabase.from('bvb_ventanas').insert({
      nombre: newVentana.nombre,
      fecha_inicio: newVentana.fecha_inicio || null,
      fecha_fin: newVentana.fecha_fin || null,
      activa: false,
    }).select().single();
    if (data) setVentanas(prev => [data, ...prev]);
    setNewVentana({ nombre: '', fecha_inicio: '', fecha_fin: '' });
    setAddingVentana(false);
  }

  async function toggleVentana(id, activa) {
    await supabase.from('bvb_ventanas').update({ activa: !activa }).eq('id', id);
    setVentanas(prev => prev.map(v => v.id === id ? { ...v, activa: !activa } : v));
  }

  async function deleteVentana(id) {
    await supabase.from('bvb_ventanas').delete().eq('id', id);
    setVentanas(prev => prev.filter(v => v.id !== id));
  }

  const budgetColor = disponible > 20 ? '#4ade80' : disponible > 5 ? '#FFE500' : '#f87171';
  const ventanaActiva = ventanas.find(v => v.activa);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest">CARGANDO...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="display-text text-3xl sm:text-4xl text-bvb-yellow">ECONOMÍA</h1>
          <p className="text-bvb-muted text-sm mt-1">BVB · CAYR Season 1</p>
        </div>
        {ventanaActiva ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-500/30 bg-green-500/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-black uppercase tracking-widest">
              Ventana activa: {ventanaActiva.nombre}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">Sin ventana activa</span>
          </div>
        )}
      </div>

      {/* Budget overview */}
      <div className="relative overflow-hidden rounded-2xl border border-bvb-border p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(255,229,0,0.07) 0%, #111 100%)' }}>
        <div className="stripe-yellow absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* Disponible — editable directo */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="section-label">Disponible</p>
                <button onClick={() => { setEditDispVal(String(disponible.toFixed(1))); setEditingDisp(true); }}
                  className="text-bvb-muted hover:text-bvb-yellow transition-colors text-[10px]" title="Editar">✏️</button>
              </div>
              {editingDisp ? (
                <div className="flex items-center justify-center gap-1">
                  <input type="number" step="0.1" value={editDispVal} onChange={e => setEditDispVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDisponible(); if (e.key === 'Escape') setEditingDisp(false); }}
                    autoFocus className="w-20 bg-bvb-black border border-bvb-yellow text-white text-center font-black text-lg rounded px-1 py-0.5 outline-none" />
                  <button onClick={saveDisponible} className="text-[10px] font-black px-1.5 py-1 rounded bg-bvb-yellow text-black">✓</button>
                  <button onClick={() => setEditingDisp(false)} className="text-[10px] px-1.5 py-1 rounded bg-bvb-card border border-bvb-border text-bvb-muted">✕</button>
                </div>
              ) : (
                <p className="font-black text-2xl sm:text-3xl" style={{ color: budgetColor }}>{disponible.toFixed(1)}M</p>
              )}
            </div>
            {/* Reserva info */}
            <div className="text-center">
              <p className="section-label mb-1">Reserva (en inactivo)</p>
              <p className="font-black text-2xl sm:text-3xl text-amber-400">10M</p>
            </div>
            {/* Inactivo — editable */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="section-label">Inactivo 🔒</p>
                <button onClick={() => { setEditInactVal(String(pendienteTotal.toFixed(1))); setEditingInact(true); }}
                  className="text-bvb-muted hover:text-bvb-yellow transition-colors text-[10px]" title="Editar">✏️</button>
              </div>
              {editingInact ? (
                <div className="flex items-center justify-center gap-1">
                  <input type="number" step="0.1" value={editInactVal} onChange={e => setEditInactVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveInactivo(); if (e.key === 'Escape') setEditingInact(false); }}
                    autoFocus className="w-20 bg-bvb-black border border-bvb-yellow text-white text-center font-black text-lg rounded px-1 py-0.5 outline-none" />
                  <button onClick={saveInactivo} className="text-[10px] font-black px-1.5 py-1 rounded bg-bvb-yellow text-black">✓</button>
                  <button onClick={() => setEditingInact(false)} className="text-[10px] px-1.5 py-1 rounded bg-bvb-card border border-bvb-border text-bvb-muted">✕</button>
                </div>
              ) : (
                <p className="font-black text-2xl sm:text-3xl text-amber-400">+{pendienteTotal.toFixed(1)}M</p>
              )}
            </div>
          </div>

          {/* Budget bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="section-label">Disponible para fichajes</span>
              <span className="font-black text-lg" style={{ color: budgetColor }}>{disponible.toFixed(1)}M</span>
            </div>
            <div className="h-3 bg-bvb-black rounded-full overflow-hidden flex">
              <div className="h-full transition-all duration-700"
                style={{ width: `${Math.max(0,(pendienteTotal/(disponible+pendienteTotal))*100)}%`, background: '#f59e0b' }} />
              <div className="h-full transition-all duration-700"
                style={{ width: `${Math.max(0,(disponible/(disponible+pendienteTotal))*100)}%`, background: budgetColor, boxShadow: `0 0 10px ${budgetColor}60` }} />
            </div>
            <div className="flex justify-between text-[10px] text-bvb-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Inactivo (incl. 10M reserva) {pendienteTotal.toFixed(1)}M</span>
              <span className="flex items-center gap-1" style={{ color: budgetColor }}><span className="w-2 h-2 rounded-full inline-block" style={{ background: budgetColor }} />Libre {disponible.toFixed(1)}M</span>
            </div>
            {disponible < 5 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                <span className="text-red-400">⚠</span>
                <span className="text-red-400 text-sm font-bold">Presupuesto bajo — quedan menos de 5M disponibles</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clausulazos pendientes banner */}
      {clausulazosInactivos.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-400 text-sm">🔒</span>
            </div>
            <div className="flex-1">
              <p className="font-black text-amber-400 text-sm uppercase tracking-widest">
                Dinero clausulazo inactivo — próxima ventana
              </p>
              <p className="text-bvb-muted text-xs mt-1">
                Este dinero no puede usarse en la ventana actual. Disponible en la siguiente ventana de fichajes.
              </p>
              <div className="mt-3 space-y-2">
                {clausulazosInactivos.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 bg-black/30 rounded-lg px-3 py-2">
                    <div>
                      <p className="font-bold text-white text-sm">{t.jugador}</p>
                      <p className="text-bvb-muted text-xs">{t.equipo_destino} activó clausulazo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400">{t.precio}M</span>
                      <button onClick={() => liberarClausulazo(t.id)}
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                        Liberar →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-amber-400 font-black mt-2">
                Total pendiente: +{pendienteTotal.toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bvb-border overflow-x-auto no-scrollbar">
        {[
          { key: 'resumen',   label: 'Movimientos' },
          { key: 'clausulas', label: `Clausulazos recibidos (${clausulazosRecibidos.length})` },
          { key: 'ventanas',  label: `Ventanas (${ventanas.length})` },
          { key: 'notas',     label: 'Notas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
              tab === t.key ? 'border-bvb-yellow text-bvb-yellow' : 'border-transparent text-bvb-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Movimientos tab */}
      {tab === 'resumen' && (
        <div className="space-y-2">
          {traspasos.filter(t =>
            t.equipo_origen?.toUpperCase() === 'DORTMUND' || t.equipo_destino?.toUpperCase() === 'DORTMUND'
          ).map(t => {
            const isIn = t.equipo_destino?.toUpperCase() === 'DORTMUND';
            const isClausulazo = t.tipo === 'clausulazo';
            // clausulazo recibido = alguien nos compró activando cláusula
            const isClausulazoRecibido = isClausulazo && t.equipo_origen?.toUpperCase() === 'DORTMUND';
            const inactivo = isClausulazoRecibido && t.liberado === false;
            return (
              <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                inactivo ? 'bg-amber-500/5 border-amber-500/20' :
                isIn ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  inactivo ? 'bg-amber-500/20 text-amber-400' :
                  isIn ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>{inactivo ? '🔒' : isIn ? '−' : '+'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm truncate">{t.jugador}</p>
                    {inactivo && <span className="badge-inactive text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Pendiente</span>}
                  </div>
                  <p className="text-bvb-muted text-xs">{t.equipo_origen} → {t.equipo_destino}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                    isClausulazo ? 'badge-yellow' : t.tipo === 'intercambio' ? 'badge-purple' : t.tipo === 'libre' ? 'badge-red' : 'badge-blue'
                  }`}>{t.tipo}</span>
                  {parseFloat(t.precio) > 0 && (
                    <span className={`text-sm font-black ${inactivo ? 'text-amber-400' : isIn ? 'text-red-400' : 'text-green-400'}`}>
                      {isIn ? '-' : '+'}{t.precio}M
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {traspasos.filter(t => t.equipo_origen?.toUpperCase()==='DORTMUND'||t.equipo_destino?.toUpperCase()==='DORTMUND').length === 0 && (
            <div className="text-center py-12 text-bvb-muted">
              <div className="text-4xl mb-3">💰</div>
              <p className="font-bold">Sin movimientos BVB</p>
            </div>
          )}
        </div>
      )}

      {/* Clausulazos recibidos tab */}
      {tab === 'clausulas' && (
        <div className="space-y-3">
          <div className="bg-bvb-card border border-bvb-border rounded-xl p-4">
            <p className="section-label mb-2">Regla CAYR</p>
            <p className="text-white text-sm">
              Cuando un club activa una cláusula de tus jugadores, ese dinero queda <span className="text-amber-400 font-black">bloqueado</span> durante 
              la ventana actual. Solo estará disponible en la <span className="text-bvb-yellow font-black">próxima ventana</span>.
            </p>
          </div>

          {clausulazosRecibidos.length === 0 ? (
            <div className="text-center py-12 text-bvb-muted">
              <div className="text-4xl mb-3">🔓</div>
              <p className="font-bold">Nadie ha activado tus cláusulas aún</p>
            </div>
          ) : clausulazosRecibidos.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              t.liberado === false ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/20 bg-green-500/5'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                t.liberado === false ? 'bg-amber-500/20' : 'bg-green-500/20'
              }`}>{t.liberado === false ? '🔒' : '✅'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{t.jugador}</p>
                <p className="text-bvb-muted text-xs">{t.equipo_destino} activó clausulazo</p>
                <p className={`text-xs font-bold mt-0.5 ${t.liberado === false ? 'text-amber-400' : 'text-green-400'}`}>
                  {t.liberado === false ? '🔒 Inactivo — próxima ventana' : '✓ Activo — disponible'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-black text-bvb-yellow">{t.precio}M</span>
                {t.liberado === false ? (
                  <button onClick={() => liberarClausulazo(t.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                    Liberar
                  </button>
                ) : (
                  <button onClick={() => marcarInactivo(t.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                    Bloquear
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-bvb-card border border-amber-500/30 rounded-xl p-3 text-center">
              <p className="section-label mb-1">Pendiente próxima ventana</p>
              <p className="font-black text-xl text-amber-400">+{pendienteTotal.toFixed(1)}M</p>
            </div>
            <div className="bg-bvb-card border border-green-500/20 rounded-xl p-3 text-center">
              <p className="section-label mb-1">Clausulazo activo</p>
              <p className="font-black text-xl text-green-400">
                +{clausulazosActivos.reduce((s,t)=>s+(parseFloat(t.precio)||0),0).toFixed(1)}M
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ventanas tab */}
      {tab === 'ventanas' && (
        <div className="space-y-4">
          <div className="bg-bvb-card border border-bvb-border rounded-xl p-4 space-y-3">
            <p className="section-label">Nueva ventana de fichajes</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input value={newVentana.nombre} onChange={e => setNewVentana(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre (ej: Mercado Invierno 2025)"
                className="col-span-1 sm:col-span-1 bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
              <input type="date" value={newVentana.fecha_inicio} onChange={e => setNewVentana(p => ({ ...p, fecha_inicio: e.target.value }))}
                className="bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
              <input type="date" value={newVentana.fecha_fin} onChange={e => setNewVentana(p => ({ ...p, fecha_fin: e.target.value }))}
                className="bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
            </div>
            <button onClick={addVentana} disabled={addingVentana || !newVentana.nombre}
              className="w-full sm:w-auto py-2 px-6 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded disabled:opacity-50 hover:bg-bvb-yellow-dim transition-colors">
              {addingVentana ? 'Añadiendo...' : '+ Añadir Ventana'}
            </button>
          </div>

          <div className="space-y-2">
            {ventanas.map(v => (
              <div key={v.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                v.activa ? 'border-green-500/40 bg-green-500/8' : 'border-bvb-border bg-bvb-card'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${v.activa ? 'bg-green-400 animate-pulse' : 'bg-bvb-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{v.nombre}</p>
                  {(v.fecha_inicio || v.fecha_fin) && (
                    <p className="text-bvb-muted text-xs">
                      {v.fecha_inicio || '?'} → {v.fecha_fin || '?'}
                    </p>
                       )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleVentana(v.id, v.activa)}
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-colors ${
                      v.activa
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                        : 'bg-bvb-black text-bvb-muted border-bvb-border hover:border-bvb-yellow hover:text-bvb-yellow'
                    }`}>
                    {v.activa ? '✓ Activa' : 'Activar'}
                  </button>
                  <button onClick={() => deleteVentana(v.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                    Borrar
                  </button>
                </div>
              </div>
            ))}
            {ventanas.length === 0 && (
              <p className="text-bvb-muted text-sm text-center py-6">No hay ventanas de fichajes registradas</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
