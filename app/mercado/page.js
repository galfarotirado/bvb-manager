'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const EQUIPOS = [
  'PSG','REAL MADRID','FC BARCELONA','LIVERPOOL','ARSENAL',
  'BAYERN MUNICH','MAN CITY','INTER MILAN','ATLETICO MADRID',
  'NAPOLI','CHELSEA','MILÁN','DORTMUND','BILBAO',
  'NEWCASTLE','JUVENTUS','MAN UNITED',
];

const TIPO_CONFIG = {
  traspaso:   { label: 'Traspaso',   cls: 'badge-blue',   icon: '💰' },
  clausulazo: { label: 'Clausulazo', cls: 'badge-yellow',  icon: '⚡' },
  intercambio:{ label: 'Swap',       cls: 'badge-purple',  icon: '🔀' },
  libre:      { label: 'Libre',      cls: 'badge-green',   icon: '🆓' },
};

const FORM_EMPTY = {
  jugador: '', jugador_id: null,
  equipo_origen: 'DORTMUND', equipo_destino: '',
  tipo: 'traspaso', precio: '',
  jugador_intercambio: '', jugador_intercambio_id: null,
  detalle: '', temporada: 'S1',
};

function TransferCard({ t, onDelete }) {
  const isBVBIn  = t.equipo_destino === 'DORTMUND';
  const isBVBOut = t.equipo_origen  === 'DORTMUND';
  const cfg = TIPO_CONFIG[t.tipo] || TIPO_CONFIG.traspaso;

  return (
    <div className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all group ${
      isBVBIn  ? 'bg-bvb-card border-green-500/20 hover:border-green-500/40' :
      isBVBOut ? 'bg-bvb-card border-red-500/20 hover:border-red-500/40' :
                 'bg-bvb-card border-bvb-border hover:border-bvb-border-bright'
    }`}>
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${isBVBIn ? 'bg-green-400' : isBVBOut ? 'bg-red-400' : 'bg-bvb-border'}`} />
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base ${
        isBVBIn ? 'bg-green-500/15 text-green-400' : isBVBOut ? 'bg-red-500/15 text-red-400' : 'bg-bvb-dark text-bvb-muted'
      }`}>
        {isBVBIn ? '↓' : isBVBOut ? '↑' : '⇄'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-black text-white text-sm uppercase tracking-wide">{t.jugador}</span>
          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${cfg.cls}`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-bvb-muted">
          <span className={isBVBOut ? 'text-bvb-yellow font-bold' : ''}>{t.equipo_origen}</span>
          <span>→</span>
          <span className={isBVBIn ? 'text-bvb-yellow font-bold' : ''}>{t.equipo_destino}</span>
        </div>
        {t.detalle && <p className="text-bvb-muted text-[10px] mt-0.5 truncate">{t.detalle}</p>}
        {t.jugador_intercambio && <p className="text-purple-400 text-[10px] mt-0.5">+ {t.jugador_intercambio}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {parseFloat(t.precio) > 0 && (
          <span className="font-black text-bvb-yellow text-lg leading-none">{t.precio}M</span>
        )}
        <span className="text-bvb-muted text-[10px]">{t.temporada}</span>
      </div>
      <button onClick={() => onDelete(t.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 w-7 h-7 flex items-center justify-center rounded-lg text-bvb-muted hover:text-red-400 hover:bg-red-400/10 text-xs">
        ✕
      </button>
    </div>
  );
}

// ── Helpers de sincronización ──────────────────────────────────────────────────

async function syncPlantillaAdd(jugadorRow) {
  if (!jugadorRow) return;
  // Evitar duplicados: borrar si existe primero
  await supabase.from('bvb_plantilla').delete().eq('nombre', jugadorRow.jugador);
  await supabase.from('bvb_plantilla').insert({
    nombre:    jugadorRow.jugador,
    posicion:  jugadorRow.posicion,
    ovr:       jugadorRow.ovr,
    sofifa_id: jugadorRow.sofifa_id,
    es_fichaje: true,
  });
}

async function syncPlantillaRemove(nombre) {
  await supabase.from('bvb_plantilla').delete().eq('nombre', nombre);
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Mercado() {
  const [traspasos, setTraspasos]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('bvb');
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState(FORM_EMPTY);
  const [jugadoresOrigen, setJugadoresOrigen]   = useState([]);
  const [jugadoresDestino, setJugadoresDestino] = useState([]);

  useEffect(() => { fetchTraspasos(); }, []);

  // Cargar jugadores del equipo origen al cambiar
  useEffect(() => {
    if (!form.equipo_origen) return;
    supabase.from('liga_jugadores')
      .select('id, jugador, posicion, ovr')
      .eq('equipo', form.equipo_origen)
      .order('ovr', { ascending: false })
      .then(({ data }) => setJugadoresOrigen(data || []));
    // Resetear selección de jugador al cambiar equipo
    setForm(p => ({ ...p, jugador: '', jugador_id: null }));
  }, [form.equipo_origen]);

  // Cargar jugadores del equipo destino al cambiar (para intercambios)
  useEffect(() => {
    if (!form.equipo_destino) { setJugadoresDestino([]); return; }
    supabase.from('liga_jugadores')
      .select('id, jugador, posicion, ovr')
      .eq('equipo', form.equipo_destino)
      .order('ovr', { ascending: false })
      .then(({ data }) => setJugadoresDestino(data || []));
    setForm(p => ({ ...p, jugador_intercambio: '', jugador_intercambio_id: null }));
  }, [form.equipo_destino]);

  async function fetchTraspasos() {
    const { data } = await supabase.from('bvb_traspasos').select('*').order('id', { ascending: false });
    setTraspasos(data || []);
    setLoading(false);
  }

  async function saveTraspaso() {
    if (!form.jugador_id || !form.equipo_destino) return;
    setSaving(true);

    // 1. Registrar el movimiento
    await supabase.from('bvb_traspasos').insert({
      jugador:              form.jugador,
      equipo_origen:        form.equipo_origen,
      equipo_destino:       form.equipo_destino,
      tipo:                 form.tipo,
      precio:               parseFloat(form.precio) || 0,
      jugador_intercambio:  form.jugador_intercambio || null,
      detalle:              form.detalle || null,
      temporada:            form.temporada,
      fecha:                new Date().toISOString().split('T')[0],
    });

    // 2. Mover jugador en liga_jugadores (por ID — infalible)
    await supabase.from('liga_jugadores')
      .update({ equipo: form.equipo_destino })
      .eq('id', form.jugador_id);

    // 3. Sincronizar bvb_plantilla
    if (form.equipo_destino === 'DORTMUND') {
      const { data: jug } = await supabase.from('liga_jugadores')
        .select('*').eq('id', form.jugador_id).single();
      await syncPlantillaAdd(jug);
    }
    if (form.equipo_origen === 'DORTMUND') {
      await syncPlantillaRemove(form.jugador);
    }

    // 4. Intercambio: mover jugador en sentido inverso
    if (form.tipo === 'intercambio' && form.jugador_intercambio_id) {
      await supabase.from('liga_jugadores')
        .update({ equipo: form.equipo_origen })
        .eq('id', form.jugador_intercambio_id);

      if (form.equipo_origen === 'DORTMUND') {
        const { data: jug2 } = await supabase.from('liga_jugadores')
          .select('*').eq('id', form.jugador_intercambio_id).single();
        await syncPlantillaAdd(jug2);
      }
      if (form.equipo_destino === 'DORTMUND') {
        await syncPlantillaRemove(form.jugador_intercambio);
      }
    }

    await fetchTraspasos();
    setShowForm(false);
    setSaving(false);
    setForm(FORM_EMPTY);
  }

  async function deleteTraspaso(id) {
    const t = traspasos.find(x => x.id === id);
    if (!confirm(`¿Eliminar este movimiento? Se revertirá el equipo de ${t?.jugador || 'el jugador'}.`)) return;

    if (t) {
      // Revertir liga_jugadores
      await supabase.from('liga_jugadores')
        .update({ equipo: t.equipo_origen })
        .eq('jugador', t.jugador)
        .eq('equipo', t.equipo_destino);

      // Revertir bvb_plantilla
      if (t.equipo_destino === 'DORTMUND') {
        await syncPlantillaRemove(t.jugador);
      }
      if (t.equipo_origen === 'DORTMUND') {
        const { data: jug } = await supabase.from('liga_jugadores')
          .select('*').eq('jugador', t.jugador).eq('equipo', 'DORTMUND').maybeSingle();
        if (jug) await syncPlantillaAdd({ ...jug, es_fichaje: false });
      }

      // Revertir intercambio
      if (t.tipo === 'intercambio' && t.jugador_intercambio) {
        await supabase.from('liga_jugadores')
          .update({ equipo: t.equipo_destino })
          .eq('jugador', t.jugador_intercambio)
          .eq('equipo', t.equipo_origen);

        if (t.equipo_origen === 'DORTMUND') await syncPlantillaRemove(t.jugador_intercambio);
        if (t.equipo_destino === 'DORTMUND') {
          const { data: jug2 } = await supabase.from('liga_jugadores')
            .select('*').eq('jugador', t.jugador_intercambio).eq('equipo', 'DORTMUND').maybeSingle();
          if (jug2) await syncPlantillaAdd({ ...jug2, es_fichaje: false });
        }
      }
    }

    await supabase.from('bvb_traspasos').delete().eq('id', id);
    setTraspasos(prev => prev.filter(x => x.id !== id));
  }

  const bvbIn     = traspasos.filter(t => t.equipo_destino === 'DORTMUND');
  const bvbOut    = traspasos.filter(t => t.equipo_origen  === 'DORTMUND');
  const liga      = traspasos.filter(t => t.equipo_origen !== 'DORTMUND' && t.equipo_destino !== 'DORTMUND');
  const gastoTotal   = bvbIn.reduce((s, t)  => s + (parseFloat(t.precio) || 0), 0);
  const ingresoTotal = bvbOut.reduce((s, t) => s + (parseFloat(t.precio) || 0), 0);

  const selectCls = 'w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none';
  const inputCls  = 'w-full bg-bvb-dark border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest text-lg">CARGANDO MERCADO...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-label mb-1">CAYR Season 1</div>
          <h1 className="display-text text-3xl text-white"><span className="text-bvb-yellow">Mercado</span> de Fichajes</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-bvb-yellow text-black text-xs font-black uppercase tracking-widest rounded hover:bg-bvb-yellow-dim transition-colors flex items-center gap-2">
          <span className="text-lg">+</span> Registrar Movimiento
        </button>
      </div>

      {/* Balance BVB */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bvb-card border border-green-500/20 rounded-xl p-4 text-center">
          <p className="section-label mb-1" style={{ color: '#4ade80' }}>Entradas</p>
          <p className="text-2xl font-black text-green-400">{bvbIn.length}</p>
          <p className="text-bvb-muted text-xs mt-1">{gastoTotal}M gastados</p>
        </div>
        <div className="bg-bvb-card border border-bvb-border rounded-xl p-4 text-center">
          <p className="section-label mb-1">Balance</p>
          <p className={`text-2xl font-black ${ingresoTotal - gastoTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {ingresoTotal - gastoTotal > 0 ? '+' : ''}{(ingresoTotal - gastoTotal).toFixed(1)}M
          </p>
          <p className="text-bvb-muted text-xs mt-1">ingresos - gastos</p>
        </div>
        <div className="bg-bvb-card border border-red-500/20 rounded-xl p-4 text-center">
          <p className="section-label mb-1" style={{ color: '#f87171' }}>Salidas</p>
          <p className="text-2xl font-black text-red-400">{bvbOut.length}</p>
          <p className="text-bvb-muted text-xs mt-1">{ingresoTotal}M recibidos</p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-bvb-card border border-bvb-yellow/30 rounded-xl p-5 animate-slide-up">
          <h3 className="font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-bvb-yellow">+</span> Nuevo Movimiento
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

            {/* Tipo */}
            <div>
              <label className="section-label block mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className={selectCls}>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>

            {/* Equipo origen */}
            <div>
              <label className="section-label block mb-1">Equipo origen</label>
              <select value={form.equipo_origen} onChange={e => setForm(p => ({ ...p, equipo_origen: e.target.value }))} className={selectCls}>
                {EQUIPOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Equipo destino */}
            <div>
              <label className="section-label block mb-1">Equipo destino</label>
              <select value={form.equipo_destino} onChange={e => setForm(p => ({ ...p, equipo_destino: e.target.value }))} className={selectCls}>
                <option value="">Seleccionar...</option>
                {EQUIPOS.filter(e => e !== form.equipo_origen).map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* Jugador — dropdown cargado desde liga_jugadores */}
            <div>
              <label className="section-label block mb-1">
                Jugador {jugadoresOrigen.length > 0 && <span className="text-bvb-muted">({jugadoresOrigen.length} disponibles)</span>}
              </label>
              <select
                value={form.jugador_id || ''}
                onChange={e => {
                  const id = parseInt(e.target.value);
                  const jug = jugadoresOrigen.find(j => j.id === id);
                  setForm(p => ({ ...p, jugador_id: id, jugador: jug?.jugador || '' }));
                }}
                className={selectCls}
              >
                <option value="">— Seleccionar jugador —</option>
                {jugadoresOrigen.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.jugador} ({j.posicion} · {j.ovr})
                  </option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div>
              <label className="section-label block mb-1">Precio (M€)</label>
              <input type="number" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                placeholder="0" className={inputCls} />
            </div>

            {/* Detalle */}
            <div>
              <label className="section-label block mb-1">Detalle</label>
              <input type="text" value={form.detalle} onChange={e => setForm(p => ({ ...p, detalle: e.target.value }))}
                placeholder="Descripción opcional" className={inputCls} />
            </div>

            {/* Temporada */}
            <div>
              <label className="section-label block mb-1">Temporada</label>
              <input type="text" value={form.temporada} onChange={e => setForm(p => ({ ...p, temporada: e.target.value }))}
                placeholder="S1" className={inputCls} />
            </div>

            {/* Jugador intercambio (solo si tipo === intercambio) */}
            {form.tipo === 'intercambio' && (
              <div>
                <label className="section-label block mb-1">
                  Jugador intercambio {jugadoresDestino.length > 0 && <span className="text-bvb-muted">({jugadoresDestino.length})</span>}
                </label>
                <select
                  value={form.jugador_intercambio_id || ''}
                  onChange={e => {
                    const id = parseInt(e.target.value);
                    const jug = jugadoresDestino.find(j => j.id === id);
                    setForm(p => ({ ...p, jugador_intercambio_id: id, jugador_intercambio: jug?.jugador || '' }));
                  }}
                  className={selectCls}
                >
                  <option value="">— Seleccionar jugador —</option>
                  {jugadoresDestino.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.jugador} ({j.posicion} · {j.ovr})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={saveTraspaso}
              disabled={saving || !form.jugador_id || !form.equipo_destino || (form.tipo === 'intercambio' && !form.jugador_intercambio_id)}
              className="px-6 py-2 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded disabled:opacity-50 hover:bg-bvb-yellow-dim transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-bvb-border text-bvb-muted text-xs rounded hover:border-bvb-yellow hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bvb-border">
        {[
          { key: 'bvb',  label: `BVB (${bvbIn.length + bvbOut.length})` },
          { key: 'in',   label: `Entradas (${bvbIn.length})` },
          { key: 'out',  label: `Salidas (${bvbOut.length})` },
          { key: 'liga', label: `Liga (${liga.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              tab === t.key ? 'border-bvb-yellow text-bvb-yellow' : 'border-transparent text-bvb-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {(() => {
          const list = tab === 'bvb' ? [...bvbIn, ...bvbOut] : tab === 'in' ? bvbIn : tab === 'out' ? bvbOut : liga;
          if (!list.length) return (
            <div className="text-center py-14 text-bvb-muted">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-bold">Sin movimientos en esta categoría</p>
            </div>
          );
          return list.map(t => <TransferCard key={t.id} t={t} onDelete={deleteTraspaso} />);
        })()}
      </div>
    </div>
  );
}
