'use client';

import { useState } from 'react';

const POS_COLORS = {
  POR: '#f59e0b',
  DEF: '#3b82f6',
  MC:  '#8b5cf6',
  DEL: '#ef4444',
};

const SIZES = {
  xs: { wrap: 'w-7 h-7',   text: 'text-[8px]'  },
  sm: { wrap: 'w-8 h-8',   text: 'text-[10px]' },
  md: { wrap: 'w-10 h-10', text: 'text-xs'      },
  lg: { wrap: 'w-14 h-14', text: 'text-sm'      },
  xl: { wrap: 'w-20 h-20', text: 'text-xl'      },
};

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Source order: API proxy (futbin crop or sofifa 120px server-side),
// then sofifa 120px in browser, then wsrv.nl proxy.
// If API returns 404, it means no real face was found → show initials.
function getSources(id) {
  if (!id) return [];
  return [
    `/players/${id}.png`,                                                        // 1. Local image (public/players/)
    `https://cdn.sofifa.net/players/${id}/25_120.png`,                          // 2. Sofifa 120px FC25 direct
    `https://cdn.sofifa.net/players/${id}/26_120.png`,                          // 3. Sofifa 120px FC26 direct
    `https://wsrv.nl/?url=cdn.sofifa.net/players/${id}/25_120.png&output=png`,  // 4. wsrv.nl 120px proxy
  ];
}

export default function PlayerAvatar({ sofifa_id, nombre, posicion, size = 'md' }) {
  const sources             = getSources(sofifa_id);
  const [idx, setIdx]       = useState(0);
  const [failed, setFailed] = useState(false);

  const { wrap, text } = SIZES[size] || SIZES.md;
  const color    = POS_COLORS[posicion] || '#6b7280';
  const initials = getInitials(nombre);

  function handleError() {
    const next = idx + 1;
    if (next < sources.length) {
      setIdx(next);
    } else {
      setFailed(true);
    }
  }

  if (failed || sources.length === 0) {
    return (
      <div
        className={`${wrap} rounded-full flex-shrink-0 flex items-center justify-center font-black border ${text}`}
        style={{ background: `${color}22`, borderColor: `${color}55`, color }}
        title={nombre}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${wrap} rounded-full bg-bvb-dark overflow-hidden flex-shrink-0 border border-bvb-border`}>
      <img
        key={sources[idx]}
        src={sources[idx]}
        alt={nombre || ''}
        className="w-full h-full object-cover object-center"
        onError={handleError}
      />
    </div>
  );
}
