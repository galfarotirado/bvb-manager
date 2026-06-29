'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import PlayerAvatar from '@/components/PlayerAvatar';

const POS_COLORS = { POR: '#f59e0b', DEF: '#3b82f6', MC: '#8b5cf6', DEL: '#ef4444' };
const POS_ICONS  = { POR: '🧤', DEF: '🛡️', MC: '⚙️', DEL: '⚡' };

const FORMATIONS = {
  '4-2-3-1': { label: '4-2-3-1', slots: [
    { id:'POR',  pos:'POR', x:50, y:88, label:'POR' },
    { id:'LD',   pos:'DEF', x:16, y:70, label:'LD'  },
    { id:'DFC1', pos:'DEF', x:35, y:72, label:'DFC' },
    { id:'DFC2', pos:'DEF', x:65, y:72, label:'DFC' },
    { id:'LI',   pos:'DEF', x:84, y:70, label:'LI'  },
    { id:'MCD1', pos:'MC',  x:36, y:52, label:'MCD' },
    { id:'MCD2', pos:'MC',  x:64, y:52, label:'MCD' },
    { id:'MD',   pos:'MC',  x:16, y:33, label:'MD'  },
    { id:'MC',   pos:'MC',  x:50, y:31, label:'CAM' },
    { id:'MI',   pos:'MC',  x:84, y:33, label:'MI'  },
    { id:'DEL',  pos:'DEL', x:50, y:13, label:'DC'  },
  ]},
  '4-3-3': { label: '4-3-3', slots: [
    { id:'POR',  pos:'POR', x:50, y:88, label:'POR' },
    { id:'LD',   pos:'DEF', x:16, y:70, label:'LD'  },
    { id:'DFC1', pos:'DEF', x:35, y:72, label:'DFC' },
    { id:'DFC2', pos:'DEF', x:65, y:72, label:'DFC' },
    { id:'LI',   pos:'DEF', x:84, y:70, label:'LI'  },
    { id:'MCL',  pos:'MC',  x:25, y:47, label:'MC'  },
    { id:'MCC',  pos:'MC',  x:50, y:45, label:'MC'  },
    { id:'MCR',  pos:'MC',  x:75, y:47, label:'MC'  },
    { id:'EXI',  pos:'DEL', x:15, y:18, label:'EXT' },
    { id:'DC',   pos:'DEL', x:50, y:13, label:'DC'  },
    { id:'EXD',  pos:'DEL', x:85, y:18, label:'EXT' },
  ]},
  '4-4-2': { label: '4-4-2', slots: [
    { id:'POR',  pos:'POR', x:50, y:88, label:'POR' },
    { id:'LD',   pos:'DEF', x:16, y:70, label:'LD'  },
    { id:'DFC1', pos:'DEF', x:35, y:72, label:'DFC' },
    { id:'DFC2', pos:'DEF', x:65, y:72, label:'DFC' },
    { id:'LI',   pos:'DEF', x:84, y:70, label:'LI'  },
    { id:'ML',   pos:'MC',  x:16, y:49, label:'ML'  },
    { id:'MCI',  pos:'MC',  x:38, y:49, label:'MC'  },
    { id:'MCD',  pos:'MC',  x:62, y:49, label:'MC'  },
    { id:'MR',   pos:'MC',  x:84, y:49, label:'MR'  },
    { id:'DL1',  pos:'DEL', x:34, y:16, label:'DEL' },
    { id:'DL2',  pos:'DEL', x:66, y:16, label:'DEL' },
  ]},
  '3-5-2': { label: '3-5-2', slots: [
    { id:'POR',  pos:'POR', x:50, y:88, label:'POR'  },
    { id:'DFC1', pos:'DEF', x:25, y:72, label:'DFC'  },
    { id:'DFC2', pos:'DEF', x:50, y:73, label:'DFC'  },
    { id:'DFC3', pos:'DEF', x:75, y:72, label:'DFC'  },
    { id:'CL',   pos:'DEF', x:10, y:49, label:'CD'   },
    { id:'MCI1', pos:'MC',  x:30, y:46, label:'MC'   },
    { id:'MCC',  pos:'MC',  x:50, y:43, label:'MC'   },
    { id:'MCI2', pos:'MC',  x:70, y:46, label:'MC'   },
    { id:'CR',   pos:'DEF', x:90, y:49, label:'CD'   },
    { id:'DL1',  pos:'DEL', x:34, y:16, label:'DEL'  },
    { id:'DL2',  pos:'DEL', x:66, y:16, label:'DEL'  },
  ]},
  '5-3-2': { label: '5-3-2', slots: [
    { id:'POR',  pos:'POR', x:50, y:88, label:'POR'  },
    { id:'CLD',  pos:'DEF', x:10, y:70, label:'CL'   },
    { id:'DFC1', pos:'DEF', x:28, y:72, label:'DFC'  },
    { id:'DFC2', pos:'DEF', x:50, y:74, label:'DFC'  },
    { id:'DFC3', pos:'DEF', x:72, y:72, label:'DFC'  },
    { id:'CLI',  pos:'DEF', x:90, y:70, label:'CR'   },
    { id:'MCL',  pos:'MC',  x:25, y:47, label:'MC'   },
    { id:'MCC',  pos:'MC',  x:50, y:45, label:'MC'   },
    { id:'MCR',  pos:'MC',  x:75, y:47, label:'MC'   },
    { id:'DL1',  pos:'DEL', x:34, y:16, label:'DEL'  },
    { id:'DL2',  pos:'DEL', x:66, y:16, label:'DEL'  },
  ]},
};

function ovrColor(ovr) {
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  if (ovr >= 78) return '#c084fc';
  return '#f87171';
}

export default function OncePage() {
  const [plantilla, setPlantilla]     = useState([]);
  const [formation, setFormation]     = useState('4-2-3-1');
  const [slots, setSlots]             = useState({});
  const [selected, setSelected]       = useState(null); // player selected for tap-assign
  const [pendingSlot, setPendingSlot] = useState(null); // slot awaiting player tap
  const [loading, setLoading]         = useState(true);
  const [saved, setSaved]             = useState(false);
  const [alinName, setAlinName]       = useState('Mi Once Ideal');

  useEffect(() => {
    supabase.from('bvb_plantilla').select('*').order('ovr', { ascending: false }).then(({ data }) => {
      const loadedPlantilla = data || [];
      setPlantilla(loadedPlantilla);
      setLoading(false);
      // Hydrate saved lineup with fresh player data (so sofifa_id is always up-to-date)
      try {
        const s = JSON.parse(localStorage.getItem('bvb_alineacion') || '{}');
        if (s.formation) setFormation(s.formation);
        if (s.nombre)    setAlinName(s.nombre);
        if (s.slots) {
          const hydratedSlots = {};
          for (const [slotId, player] of Object.entries(s.slots)) {
            if (player) {
              const fresh = loadedPlantilla.find(p => p.id === player.id);
              hydratedSlots[slotId] = fresh || player;
            } else {
              hydratedSlots[slotId] = null;
            }
          }
          setSlots(hydratedSlots);
        }
      } catch {}
    });
  }, []);

  const currentSlots = FORMATIONS[formation].slots;
  const assignedIds  = Object.values(slots).filter(Boolean).map(p => p.id);
  const bench        = plantilla.filter(p => !assignedIds.includes(p.id));
  const oncePlayers  = Object.values(slots).filter(Boolean);
  const avgOvr       = oncePlayers.length
    ? (oncePlayers.reduce((s, p) => s + p.ovr, 0) / oncePlayers.length).toFixed(1)
    : null;

  // ── Drag handlers ──────────────────────────────────────────
  function handleDragStart(e, player) {
    e.dataTransfer.setData('playerId', player.id);
  }
  function handleDropOnSlot(e, slotId) {
    e.preventDefault();
    const pid = parseInt(e.dataTransfer.getData('playerId'));
    const player = plantilla.find(p => p.id === pid);
    if (!player) return;
    // If dragging from another field slot → swap
    const fromSlot = Object.keys(slots).find(k => slots[k]?.id === pid);
    if (fromSlot && fromSlot !== slotId && slots[slotId]) {
      swapSlots(fromSlot, slotId);
    } else {
      assignToSlot(slotId, player);
    }
  }

  // ── Tap / click assign ─────────────────────────────────────
  function handleSlotClick(slotId) {
    const existing = slots[slotId];

    // A bench player is selected → place here (existing returns to bench automatically)
    if (selected) {
      assignToSlot(slotId, selected);
      setSelected(null);
      setPendingSlot(null);
      return;
    }

    // A field slot is already marked (pendingSlot) → swap the two field players
    if (pendingSlot && pendingSlot !== slotId) {
      swapSlots(pendingSlot, slotId);
      setPendingSlot(null);
      return;
    }

    // Same slot clicked again → deselect
    if (pendingSlot === slotId) {
      setPendingSlot(null);
      return;
    }

    // Select this slot (either has player to swap, or empty to fill)
    setPendingSlot(slotId);
  }

  function handleBenchClick(player) {
    // If a field slot is pending → fill it with this bench player
    if (pendingSlot) {
      assignToSlot(pendingSlot, player);
      setPendingSlot(null);
      setSelected(null);
      return;
    }
    // Toggle bench player selection
    if (selected?.id === player.id) { setSelected(null); return; }
    setSelected(player);
    setPendingSlot(null);
  }

  function assignToSlot(slotId, player) {
    setSlots(prev => {
      const next = { ...prev };
      // Remove player from old slot (if any)
      for (const [k, v] of Object.entries(next)) {
        if (v?.id === player.id) { next[k] = null; break; }
      }
      next[slotId] = player;
      return next;
    });
    setSelected(null);
    setPendingSlot(null);
  }

  // Swap two field players between slots
  function swapSlots(slotA, slotB) {
    setSlots(prev => {
      const next = { ...prev };
      const tmp = next[slotA];
      next[slotA] = next[slotB] ?? null;
      next[slotB] = tmp ?? null;
      return next;
    });
    setSelected(null);
    setPendingSlot(null);
  }

  function removeFromSlot(slotId) {
    setSlots(prev => ({ ...prev, [slotId]: null }));
  }
  function handleFormationChange(f) { setFormation(f); setSlots({}); }
  function autoFill() {
    const next = {}; const used = new Set();
    for (const slot of FORMATIONS[formation].slots) {
      const match = plantilla.find(p => !used.has(p.id) && p.posicion === slot.pos);
      if (match) { next[slot.id] = match; used.add(match.id); }
    }
    setSlots(next);
  }
  function saveLineup() {
    localStorage.setItem('bvb_alineacion', JSON.stringify({ slots, formation, nombre: alinName }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse text-lg font-black tracking-widest">CARGANDO...</div>
    </div>
  );

  const pendingHasPlayer = pendingSlot && slots[pendingSlot];
  const pendingName = pendingHasPlayer ? slots[pendingSlot].nombre.split(' ').slice(-1)[0] : null;
  const hint = selected
    ? `Toca un hueco del campo para colocar a ${selected.nombre.split(' ').slice(-1)[0]}`
    : pendingHasPlayer
    ? `${pendingName} seleccionado — toca otro jugador en el campo para intercambiar`
    : pendingSlot
    ? 'Toca un jugador del banquillo para colocarlo'
    : null;

  return (
    <div className="space-y-4 animate-slide-up">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="section-label mb-1">Creador de Alineación · BVB</div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            <span className="text-bvb-yellow">Mi</span> Once Ideal
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={alinName} onChange={e => setAlinName(e.target.value)}
            className="bg-bvb-card border border-bvb-border text-white text-sm px-3 py-2 rounded font-semibold w-40 focus:border-bvb-yellow outline-none" />
          <button onClick={autoFill}
            className="px-3 py-2 text-xs font-black uppercase tracking-wider text-black bg-bvb-yellow rounded hover:opacity-90">
            ⚡ Auto
          </button>
          <button onClick={() => setSlots({})}
            className="px-3 py-2 text-xs font-black uppercase tracking-wider text-bvb-muted border border-bvb-border rounded hover:border-bvb-yellow hover:text-bvb-yellow transition-colors">
            Limpiar
          </button>
          <button onClick={saveLineup}
            className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded transition-all ${saved ? 'bg-green-500 text-black' : 'bg-bvb-card border border-bvb-yellow text-bvb-yellow hover:bg-bvb-yellow hover:text-black'}`}>
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Formation + OVR bar ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="section-label shrink-0">Formación:</span>
        {Object.keys(FORMATIONS).map(f => (
          <button key={f} onClick={() => handleFormationChange(f)}
            className={`px-3 py-1.5 text-xs font-black rounded transition-all ${
              formation === f ? 'bg-bvb-yellow text-black' : 'bg-bvb-card border border-bvb-border text-bvb-muted hover:border-bvb-yellow hover:text-white'
            }`}>
            {f}
          </button>
        ))}
        {avgOvr && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-bvb-muted text-xs">{oncePlayers.length}/11</span>
            <span className="font-black text-2xl leading-none" style={{ color: ovrColor(parseFloat(avgOvr)) }}>{avgOvr}</span>
          </div>
        )}
      </div>

      {/* ── Hint bar ─────────────────────────────────────────── */}
      {hint && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-bvb-yellow/40 bg-bvb-yellow/8 text-bvb-yellow text-xs font-bold animate-pulse">
          <span>👆</span> {hint}
          <button onClick={() => { setSelected(null); setPendingSlot(null); }} className="ml-auto text-bvb-muted hover:text-white">✕</button>
        </div>
      )}

      {/* ── Field + Bench ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Soccer field */}
        <div className="lg:col-span-3">
          <div className="relative rounded-xl overflow-hidden border border-bvb-border select-none"
            style={{
              aspectRatio: '2/3',
              background: 'linear-gradient(180deg, #145214 0%, #0d3d0d 35%, #0a3010 65%, #0d3d0d 100%)',
            }}>

            {/* Grass stripes */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute inset-x-0" style={{
                top: `${i * 12.5}%`, height: '12.5%',
                background: i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent',
              }} />
            ))}

            {/* Field lines SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 300" preserveAspectRatio="none">
              <rect x="8" y="6" width="184" height="288" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" rx="2"/>
              <line x1="8" y1="150" x2="192" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
              <circle cx="100" cy="150" r="28" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
              <circle cx="100" cy="150" r="2" fill="rgba(255,255,255,0.3)"/>
              {/* Penalty area top */}
              <rect x="52" y="6" width="96" height="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
              <rect x="76" y="6" width="48" height="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              <circle cx="100" cy="36" r="1.5" fill="rgba(255,255,255,0.25)"/>
              {/* Penalty area bottom */}
              <rect x="52" y="242" width="96" height="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2"/>
              <rect x="76" y="272" width="48" height="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              <circle cx="100" cy="264" r="1.5" fill="rgba(255,255,255,0.25)"/>
              {/* Goals */}
              <rect x="80" y="2" width="40" height="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              <rect x="80" y="290" width="40" height="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              {/* Corner arcs */}
              <path d="M8,6 Q12,6 12,10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              <path d="M192,6 Q188,6 188,10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              <path d="M8,294 Q12,294 12,290" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              <path d="M192,294 Q188,294 188,290" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
            </svg>

            {/* Direction label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest text-white/25 uppercase pointer-events-none">▲ Ataque</div>

            {/* Slots */}
            {currentSlots.map(slot => {
              const player = slots[slot.id];
              const isHighlighted = pendingSlot === slot.id;
              const isSwapTarget = pendingHasPlayer && pendingSlot !== slot.id && !!player;
              const color = POS_COLORS[slot.pos] || '#fff';

              return (
                <div key={slot.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  draggable={!!player}
                  onDragStart={player ? e => handleDragStart(e, player) : undefined}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnSlot(e, slot.id)}
                  onClick={() => handleSlotClick(slot.id)}
                >
                  {player ? (
                    <div className="flex flex-col items-center gap-0.5 cursor-pointer group">
                      <div className={`relative w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg transition-all ${
                        isHighlighted
                          ? 'scale-115 ring-2 ring-bvb-yellow ring-offset-1 ring-offset-transparent'
                          : isSwapTarget
                          ? 'scale-105 ring-1 ring-bvb-yellow/60'
                          : 'group-hover:scale-110 active:scale-95'
                      }`}
                        style={{
                          borderColor: isHighlighted ? '#FFE500' : ovrColor(player.ovr),
                          boxShadow: isHighlighted
                            ? '0 0 16px rgba(255,229,0,0.7)'
                            : `0 2px 12px ${ovrColor(player.ovr)}55`,
                        }}>
                        <PlayerAvatar sofifa_id={player.sofifa_id} nombre={player.nombre} posicion={player.posicion} size="md" />
                        {/* Overlay hint on hover */}
                        {!isHighlighted && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-black text-[11px]">⇄ swap</span>
                          </div>
                        )}
                        {isHighlighted && (
                          <div className="absolute inset-0 bg-bvb-yellow/20 flex items-center justify-center">
                            <span className="text-bvb-yellow font-black text-[11px]">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-center" style={{ maxWidth: 68 }}>
                        <div className={`text-[9px] font-bold truncate leading-tight ${isHighlighted ? 'text-bvb-yellow' : 'text-white'}`}>
                          {player.nombre.split(' ').slice(-1)[0]}
                        </div>
                        <div className="text-[9px] font-black leading-none" style={{ color: ovrColor(player.ovr) }}>
                          {player.ovr}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-full border-2 border-dashed cursor-pointer transition-all ${
                      isHighlighted
                        ? 'border-bvb-yellow bg-bvb-yellow/30 scale-110 shadow-[0_0_12px_rgba(255,229,0,0.4)]'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                      style={{
                        borderColor: isHighlighted ? '#FFE500' : `${color}60`,
                        background: isHighlighted ? 'rgba(255,229,0,0.2)' : `${color}15`,
                      }}>
                      <span className="text-[9px] font-black uppercase" style={{ color: isHighlighted ? '#FFE500' : `${color}cc` }}>
                        {slot.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bench ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="section-label">Banquillo · {bench.length} disponibles</span>
            {selected && (
              <span className="text-[10px] text-bvb-yellow font-black animate-pulse">
                {selected.nombre.split(' ').slice(-1)[0]} seleccionado
              </span>
            )}
          </div>

          <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight: 'min(560px, 70vh)' }}>
            {['POR','DEF','MC','DEL'].map(pos => {
              const group = bench.filter(p => p.posicion === pos);
              if (!group.length) return null;
              return (
                <div key={pos}>
                  <div className="flex items-center gap-2 px-1 py-1.5">
                    <span className="text-sm">{POS_ICONS[pos]}</span>
                    <span className="text-[10px] font-black tracking-widest text-bvb-muted uppercase">{pos}</span>
                    <div className="flex-1 h-px bg-bvb-border" />
                  </div>
                  {group.map(player => {
                    const isSelected = selected?.id === player.id;
                    return (
                      <div key={player.id}
                        draggable
                        onDragStart={e => handleDragStart(e, player)}
                        onClick={() => handleBenchClick(player)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all cursor-pointer mb-0.5 ${
                          isSelected
                            ? 'bg-bvb-yellow/10 border-bvb-yellow text-bvb-yellow'
                            : 'bg-bvb-card border-bvb-border hover:border-bvb-yellow/40 hover:bg-bvb-card-hover'
                        }`}>
                        <PlayerAvatar sofifa_id={player.sofifa_id} nombre={player.nombre} posicion={player.posicion} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-bvb-yellow' : 'text-white'}`}>
                            {player.nombre}
                          </p>
                          <p className="text-bvb-muted text-[10px] truncate">{player.nacionalidad}</p>
                        </div>
                        {player.es_fichaje && (
                          <span className="text-[9px] badge-yellow px-1.5 py-0.5 rounded font-black tracking-wider shrink-0">
                            {player.tipo_fichaje === 'clausulazo' ? '⚡' : player.tipo_fichaje === 'intercambio' ? '🔀' : '💰'}
                          </span>
                        )}
                        <span className="text-sm font-black shrink-0" style={{ color: ovrColor(player.ovr) }}>
                          {player.ovr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* On-field players */}
            {assignedIds.length > 0 && (
              <div className="mt-2 pt-2 border-t border-bvb-border">
                <div className="flex items-center gap-2 px-1 py-1">
                  <span className="text-[10px] font-black tracking-widest text-bvb-yellow/50 uppercase">En el campo</span>
                  <div className="flex-1 h-px bg-bvb-border" />
                </div>
                {plantilla.filter(p => assignedIds.includes(p.id)).map(p => (
                  <div key={p.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg opacity-40 mb-0.5">
                    <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.nombre} posicion={p.posicion} size="xs" />
                    <span className="text-bvb-muted text-xs truncate flex-1">{p.nombre}</span>
                    <span className="text-xs font-black text-bvb-muted">{p.ovr}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats cuando el once está completo ───────────────── */}
      {oncePlayers.length === 11 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
          {[
            { label:'OVR Titular', value: avgOvr, color: ovrColor(parseFloat(avgOvr)) },
            { label:'Élite (85+)',  value: oncePlayers.filter(p => p.ovr >= 85).length, color:'#FFE500' },
            { label:'Fichajes',    value: oncePlayers.filter(p => p.es_fichaje).length,  color:'#c084fc' },
            { label:'Naciones',    value: new Set(oncePlayers.map(p => p.nacionalidad)).size, color:'#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-bvb-card border border-bvb-border rounded-xl p-4 text-center">
              <p className="section-label mb-1">{label}</p>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-bvb-muted text-[10px] text-center pb-2">
        Arrastra jugadores al campo · Toca un hueco para seleccionar posición · Toca un jugador para seleccionarlo
      </p>
    </div>
  );
}
