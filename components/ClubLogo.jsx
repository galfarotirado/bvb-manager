'use client';

import { useState } from 'react';

const TEAM_COLORS = {
  'DORTMUND':        '#FFE500',
  'PSG':             '#004170',
  'REAL MADRID':     '#FEBE10',
  'FC BARCELONA':    '#A50044',
  'LIVERPOOL':       '#C8102E',
  'ARSENAL':         '#EF0107',
  'BAYERN MUNICH':   '#DC052D',
  'MAN CITY':        '#6CABDD',
  'INTER MILAN':     '#010E80',
  'ATLETICO MADRID': '#CB3524',
  'NAPOLI':          '#12A0D7',
  'CHELSEA':         '#034694',
  'MILÁN':           '#FB090B',
  'BILBAO':          '#EE2523',
  'NEWCASTLE':       '#241F20',
  'JUVENTUS':        '#333333',
  'MAN UNITED':      '#DA291C',
};

const TEAM_ABBR = {
  'DORTMUND':        'BVB',
  'PSG':             'PSG',
  'REAL MADRID':     'RMA',
  'FC BARCELONA':    'FCB',
  'LIVERPOOL':       'LIV',
  'ARSENAL':         'ARS',
  'BAYERN MUNICH':   'BAY',
  'MAN CITY':        'MCI',
  'INTER MILAN':     'INT',
  'ATLETICO MADRID': 'ATM',
  'NAPOLI':          'NAP',
  'CHELSEA':         'CFC',
  'MILÁN':           'ACM',
  'BILBAO':          'ATH',
  'NEWCASTLE':       'NEW',
  'JUVENTUS':        'JUV',
  'MAN UNITED':      'MUN',
};

const TEAM_SLUG = {
  'DORTMUND':        'dortmund',
  'PSG':             'psg',
  'REAL MADRID':     'real-madrid',
  'FC BARCELONA':    'fc-barcelona',
  'LIVERPOOL':       'liverpool',
  'ARSENAL':         'arsenal',
  'BAYERN MUNICH':   'bayern-munich',
  'MAN CITY':        'man-city',
  'INTER MILAN':     'inter-milan',
  'ATLETICO MADRID': 'atletico-madrid',
  'NAPOLI':          'napoli',
  'CHELSEA':         'chelsea',
  'MILÁN':           'milan',
  'BILBAO':          'bilbao',
  'NEWCASTLE':       'newcastle',
  'JUVENTUS':        'juventus',
  'MAN UNITED':      'man-united',
};

const SOFIFA_IDS = {
  'PSG':             73,
  'REAL MADRID':     665,
  'FC BARCELONA':    241,
  'LIVERPOOL':       9,
  'ARSENAL':         1,
  'BAYERN MUNICH':   21,
  'MAN CITY':        10,
  'INTER MILAN':     44,
  'ATLETICO MADRID': 240,
  'NAPOLI':          48,
  'CHELSEA':         5,
  'MILÁN':           45,
  'DORTMUND':        243,
  'BILBAO':          333,
  'NEWCASTLE':       23,
  'JUVENTUS':        87,
  'MAN UNITED':      11,
};

const SIZE_CLS = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const TEXT_SIZE = {
  xs: 'text-[8px]',
  sm: 'text-[9px]',
  md: 'text-[10px]',
  lg: 'text-xs',
  xl: 'text-sm',
};

// Build ordered source list for club logos
function getSources(equipo, sofifa_team_id) {
  const slug   = TEAM_SLUG[equipo];
  const teamId = sofifa_team_id || SOFIFA_IDS[equipo];
  const sources = [];

  // 1. Local escudo (works when files are committed to git / deployed)
  if (slug) sources.push(`/escudos/${slug}.png`);

  // 2. Sofifa CDN direct (fast, works when browser isn't hotlink-blocked)
  if (teamId) {
    sources.push(`https://cdn.sofifa.net/teams/${teamId}/light/25_60.png`);
    sources.push(`https://cdn.sofifa.net/teams/${teamId}/light/24_60.png`);
  }

  // 3. wsrv.nl proxy (bypasses CDN hotlink protection)
  if (teamId) {
    sources.push(`https://wsrv.nl/?url=cdn.sofifa.net/teams/${teamId}/light/25_60.png`);
  }

  return sources;
}

export default function ClubLogo({ equipo, sofifa_team_id, size = 'md', className = '' }) {
  const color    = TEAM_COLORS[equipo] || '#555555';
  const abbr     = TEAM_ABBR[equipo]   || (equipo || '?').slice(0, 3).toUpperCase();
  const sizeCls  = SIZE_CLS[size]  || SIZE_CLS.md;
  const textSize = TEXT_SIZE[size] || TEXT_SIZE.md;

  const sources = getSources(equipo, sofifa_team_id);

  const [idx, setIdx]       = useState(0);
  const [failed, setFailed] = useState(false);

  function handleError() {
    const next = idx + 1;
    if (next < sources.length) {
      setIdx(next);
    } else {
      setFailed(true);
    }
  }

  // Styled abbreviation fallback
  if (failed || sources.length === 0) {
    const isLight = ['#FFE500', '#FEBE10', '#6CABDD', '#12A0D7'].includes(color);
    return (
      <div
        className={`${sizeCls} rounded-xl flex-shrink-0 flex items-center justify-center font-black ${textSize} tracking-wider select-none ${className}`}
        style={{
          background: `${color}22`,
          border: `1.5px solid ${color}60`,
          color: isLight ? '#000' : color,
        }}
        title={equipo}>
        {abbr}
      </div>
    );
  }

  return (
    <div
      className={`${sizeCls} rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: `${color}15`, border: `1px solid ${color}35` }}>
      <img
        key={sources[idx]}
        src={sources[idx]}
        alt={equipo || ''}
        className="w-full h-full object-contain p-0.5"
        onError={handleError}
      />
    </div>
  );
}
