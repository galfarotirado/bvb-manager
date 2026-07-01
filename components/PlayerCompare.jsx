'use client';

import { useState } from 'react';
import PlayerAvatar from './PlayerAvatar';

const STATS = [
  { key: 'ovr',       label: 'OVR',        higher: true },
  { key: 'potencial', label: 'Potencial',   higher: true },
  { key: 'edad',      label: 'Edad',        higher: false },
  { key: 'clausula',  label: 'Cláusula (M)',higher: false },
];

function StatRow({ label, a, b, higher }) {
  const va = parseFloat(a) || 0;
  const vb = parseFloat(b) || 0;
  const aWins = higher ? va > vb : (va !== 0 && va < vb);
  const bWins = higher ? vb > va : (vb !== 0 && vb < va);
  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-bvb-border/40 last:border-0">
      <span className={`text-right font-black text-sm pr-3 ${aWins ? 'text-bvb-yellow' : 'text-white'}`}>
        {a ?? '—'}
      </span>
      <span className="text-center text-bvb-muted text-[10px] uppercase tracking-widest">{label}</span>
      <span className={`text-left font-black text-sm pl-3 ${bWins ? 'text-bvb-yellow' : 'text-white'}`}>
        {b ?? '—'}
      </span>
    </div>
  );
}

export default function PlayerCompare({ playerA, playerB, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.9)' }}
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bvb-card border border-bvb-border rounded-2xl p-5 w-full max-w-md space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-black text-bvb-yellow uppercase tracking-widest text-sm">Comparador</h3>
          <button onClick={onClose} className="text-bvb-muted hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Player headers */}
        <div className="grid grid-cols-2 gap-4">
          {[playerA, playerB].map((p, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-2">
                <PlayerAvatar sofifa_id={p.sofifa_id} nombre={p.jugador || p.nombre} posicion={p.posicion} size="lg" />
              </div>
              <p className="font-black text-white text-xs uppercase truncate">{p.jugador || p.nombre}</p>
              <p className="text-bvb-muted text-[10px]">{p.equipo || 'BVB'} · {p.posicion}</p>
            </div>
          ))}
        </div>

        {/* Stats comparison */}
        <div className="bg-bvb-black rounded-xl px-4 py-2">
          {STATS.map(s => (
            <StatRow key={s.key} label={s.label}
              a={playerA[s.key]} b={playerB[s.key]} higher={s.higher} />
          ))}
        </div>

        {/* Verdict */}
        {(() => {
          let aScore = 0, bScore = 0;
          STATS.forEach(s => {
            const va = parseFloat(playerA[s.key]) || 0;
            const vb = parseFloat(playerB[s.key]) || 0;
            if (s.higher) { if (va > vb) aScore++; else if (vb > va) bScore++; }
            else { if (va > 0 && va < vb) aScore++; else if (vb > 0 && vb < va) bScore++; }
          });
          const winner = aScore > bScore ? (playerA.jugador || playerA.nombre) : aScore < bScore ? (playerB.jugador || playerB.nombre) : null;
          return (
            <div className={`rounded-xl p-3 text-center text-xs font-black uppercase tracking-widest ${winner ? 'bg-bvb-yellow/10 border border-bvb-yellow/30 text-bvb-yellow' : 'bg-bvb-border/20 text-bvb-muted'}`}>
              {winner ? `★ ${winner} gana el duelo` : 'Empate técnico'}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
