'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* ── Route map ──────────────────────────────────────────────── */
const PAGE_META = {
  '/':             { label: 'Inicio',      group: 'primary',   icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  '/plantilla':    { label: 'Plantilla',   group: 'primary',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  '/partidos':     { label: 'Partidos',    group: 'primary',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  '/ranking':      { label: 'Ranking',     group: 'primary',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  '/once':         { label: 'Alineación',  group: 'secondary', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  '/mercado':      { label: 'Mercado',     group: 'secondary', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  '/oportunidades':{ label: 'Scout',       group: 'secondary', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  '/economia':     { label: 'Economía',    group: 'secondary', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  '/ia':           { label: 'IA Táctica',  group: 'secondary', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  '/galeria':      { label: 'Galería',     group: 'secondary', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  '/estadisticas': { label: 'Stats',       group: 'secondary', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  '/admin':        { label: 'Admin',       group: 'secondary', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
};

const PRIMARY   = ['/', '/plantilla', '/partidos', '/ranking'];
const SECONDARY = ['/once', '/mercado', '/oportunidades', '/economia', '/estadisticas', '/ia', '/galeria', '/admin'];

/* ── SVG icon ──────────────────────────────────────────────── */
function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── BVB Shield ─────────────────────────────────────────────── */
function BVBShield({ size = 28 }) {
  return (
    <img src="/escudos/dortmund.png" alt="BVB"
      style={{ width: size, height: size }}
      className="object-contain flex-shrink-0 drop-shadow-[0_0_6px_rgba(255,229,0,0.5)]"
      onError={e => {
        e.target.style.display = 'none';
        const fb = document.createElement('div');
        fb.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:#FFE500;display:flex;align-items:center;justify-content:center;flex-shrink:0`;
        fb.innerHTML = '<span style="font-weight:900;font-size:10px;color:#000">BVB</span>';
        e.target.parentNode.appendChild(fb);
      }}
    />
  );
}

/* ── Desktop NavLink ───────────────────────────────────────── */
function DeskLink({ href, label, icon, active }) {
  return (
    <a href={href}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 group ${
        active
          ? 'bg-bvb-yellow/15 text-bvb-yellow'
          : 'text-bvb-muted hover:text-white hover:bg-white/5'
      }`}>
      {active && (
        <span className="absolute inset-0 rounded-lg border border-bvb-yellow/30 pointer-events-none" />
      )}
      <span className={`transition-colors duration-150 ${active ? 'text-bvb-yellow' : 'text-bvb-muted group-hover:text-bvb-muted-bright'}`}>
        <Icon d={icon} size={13} />
      </span>
      {label}
      {active && (
        <span className="absolute bottom-0.5 left-3 right-3 h-px bg-bvb-yellow/60 rounded-full" />
      )}
    </a>
  );
}

/* ── Mobile Tab ─────────────────────────────────────────────── */
function MobileTab({ href, label, icon, active, onClick }) {
  const inner = (
    <span className={`relative flex flex-col items-center justify-center gap-1 py-1 h-full w-full transition-all duration-150 ${
      active ? 'text-bvb-yellow' : 'text-bvb-muted'
    }`}>
      {active && (
        <span className="absolute top-0 left-4 right-4 h-0.5 rounded-b-full bg-bvb-yellow"
          style={{ boxShadow: '0 3px 10px rgba(255,229,0,0.7)' }} />
      )}
      <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
        <Icon d={icon} size={20} />
      </span>
      <span className="text-[9px] font-black tracking-widest uppercase leading-none">
        {label}
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex-1 h-full active:scale-95 transition-transform duration-100">
        {inner}
      </button>
    );
  }
  return (
    <a href={href} className="flex-1 h-full active:scale-95 transition-transform duration-100">
      {inner}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN NAVBAR
   ═══════════════════════════════════════════════════════════ */
export default function Navbar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [stats, setStats]       = useState(null);
  const pathname                = usePathname();

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [moreOpen]);

  /* Live BVB stats for info bar */
  useEffect(() => {
    fetch('/api/bvb-quick-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStats(d))
      .catch(() => null);
  }, []);

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const currentMeta        = PAGE_META[pathname] || { label: 'BVB Manager', group: 'primary' };
  const anySecondaryActive = SECONDARY.some(h => isActive(h));

  return (
    <>
      {/* ══════════════════════════════════════
          DESKTOP HEADER
          ══════════════════════════════════════ */}
      <header className="hidden md:block sticky top-0 z-50"
        style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)' }}>

        {/* Animated yellow stripe */}
        <div className="h-px nav-top-stripe" />

        {/* Info bar */}
        <div className="border-b border-white/5" style={{ background: 'rgba(255,229,0,0.02)' }}>
          <div className="max-w-7xl mx-auto px-4 h-7 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-bvb-muted font-semibold tracking-wider uppercase select-none">
              <span className="text-bvb-yellow/80 font-black">CAYR</span>
              <span className="text-bvb-border">·</span>
              <span>Football Manager League</span>
              <span className="text-bvb-border">·</span>
              <span>Season 1</span>
              <span className="text-bvb-border">·</span>
              <span>17 Equipos</span>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <>
                  <span className="text-[10px] font-bold flex items-center gap-1.5">
                    <span className="text-bvb-muted uppercase tracking-wider">Liga</span>
                    <span className="text-bvb-yellow font-black">#{stats.ranking}</span>
                  </span>
                  <span className="w-px h-3 bg-bvb-border" />
                  <span className="text-[10px] font-bold flex items-center gap-1.5">
                    <span className="text-bvb-muted uppercase tracking-wider">OVR</span>
                    <span className="text-white font-black">{stats.ovr}</span>
                  </span>
                  <span className="w-px h-3 bg-bvb-border" />
                </>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-black text-bvb-muted-bright tracking-wide uppercase">Alfaro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="border-b border-bvb-border">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-2">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group mr-1">
              <BVBShield size={26} />
              <div className="hidden lg:flex flex-col leading-none">
                <span className="font-black text-white text-[10px] tracking-widest uppercase leading-tight">Borussia</span>
                <span className="font-black text-bvb-yellow text-[10px] tracking-widest uppercase leading-tight">Dortmund</span>
              </div>
            </a>

            <div className="w-px h-6 bg-bvb-border mx-1 flex-shrink-0" />

            {/* Primary */}
            <nav className="flex items-center gap-0.5">
              {PRIMARY.map(href => (
                <DeskLink key={href} href={href}
                  label={PAGE_META[href].label}
                  icon={PAGE_META[href].icon}
                  active={isActive(href)} />
              ))}
            </nav>

            <div className="w-px h-6 bg-bvb-border mx-1 flex-shrink-0" />

            {/* Secondary */}
            <nav className="flex items-center gap-0.5 flex-1">
              {SECONDARY.map(href => (
                <DeskLink key={href} href={href}
                  label={PAGE_META[href].label}
                  icon={PAGE_META[href].icon}
                  active={isActive(href)} />
              ))}
            </nav>

            {/* Ranking badge */}
            {stats && (
              <a href="/ranking"
                className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg border border-bvb-yellow/30 hover:border-bvb-yellow/55 transition-all"
                style={{ background: 'rgba(255,229,0,0.06)' }}>
                <Icon d={PAGE_META['/ranking'].icon} size={11} />
                <span className="text-bvb-yellow font-black text-xs tracking-wide">#{stats.ranking}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE TOP BAR
          ══════════════════════════════════════ */}
      <header className="md:hidden sticky top-0 z-50 border-b border-bvb-border"
        style={{ background: 'rgba(8,8,8,0.98)', backdropFilter: 'blur(20px)' }}>
        <div className="h-px nav-top-stripe" />
        <div className="flex items-center px-4 gap-3" style={{ height: '52px' }}>

          <a href="/" className="flex-shrink-0 active:scale-95 transition-transform">
            <BVBShield size={30} />
          </a>

          {/* Current page – centered */}
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold text-bvb-yellow/50 uppercase tracking-[0.2em] leading-none">
              {currentMeta.group === 'secondary' ? 'Gestión' : 'Principal'}
            </span>
            <span className="font-black text-white text-sm uppercase tracking-wider leading-none">
              {currentMeta.label}
            </span>
          </div>

          {/* Stats + manager */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {stats && (
              <span className="text-bvb-yellow font-black text-sm">#{stats.ranking}</span>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-bvb-yellow/25"
              style={{ background: 'rgba(255,229,0,0.05)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-bvb-yellow font-black text-[10px] tracking-wide">Alfaro</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV
          ══════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-bvb-border/70"
        style={{
          background: 'rgba(5,5,5,0.99)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex items-stretch h-14">
          {PRIMARY.map(href => (
            <MobileTab key={href}
              href={href}
              label={PAGE_META[href].label}
              icon={PAGE_META[href].icon}
              active={isActive(href)} />
          ))}
          <MobileTab
            label="Más"
            icon="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            active={anySecondaryActive}
            onClick={() => setMoreOpen(true)} />
        </div>
      </nav>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM SHEET
          ══════════════════════════════════════ */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-bvb-border overflow-hidden animate-slide-up"
            style={{
              background: '#0a0a0a',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 3.5rem)',
            }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-bvb-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[10px] font-black text-bvb-muted uppercase tracking-[0.2em]">Gestión</span>
              <button onClick={() => setMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-bvb-card border border-bvb-border flex items-center justify-center text-bvb-muted hover:text-white transition-colors">
                <Icon d="M6 18L18 6M6 6l12 12" size={12} />
              </button>
            </div>

            {/* Links */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-3">
              {SECONDARY.map(href => {
                const active = isActive(href);
                return (
                  <a key={href} href={href}
                    className={`relative flex flex-col items-center gap-2.5 py-5 rounded-xl border transition-all ${
                      active
                        ? 'bg-bvb-yellow/10 border-bvb-yellow/40 text-bvb-yellow'
                        : 'bg-bvb-card border-bvb-border text-bvb-muted'
                    }`}>
                    {active && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-bvb-yellow" />
                    )}
                    <span className={active ? 'text-bvb-yellow' : ''}>
                      <Icon d={PAGE_META[href].icon} size={22} />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {PAGE_META[href].label}
                    </span>
                  </a>
                );
              })}
            </div>

            {/* Stats strip */}
            {stats && (
              <div className="mx-4 mb-2 px-4 py-3 rounded-xl border border-bvb-border bg-bvb-card flex items-center justify-between">
                <span className="text-[10px] text-bvb-muted uppercase tracking-widest font-bold">Liga</span>
                <span className="font-black text-bvb-yellow">#{stats.ranking}</span>
                <span className="w-px h-4 bg-bvb-border" />
                <span className="text-[10px] text-bvb-muted uppercase tracking-widest font-bold">OVR</span>
                <span className="font-black text-white">{stats.ovr}</span>
                <span className="w-px h-4 bg-bvb-border" />
                <span className="text-[10px] text-bvb-yellow font-black tracking-widest">CAYR S1</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
