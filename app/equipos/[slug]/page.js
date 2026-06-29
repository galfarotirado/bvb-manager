'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ClubLogo from '@/components/ClubLogo';
import PlayerAvatar from '@/components/PlayerAvatar';

const TEAM_COLORS = {
  'DORTMUND':'#FFE500','PSG':'#004170','REAL MADRID':'#FEBE10','FC BARCELONA':'#A50044',
  'LIVERPOOL':'#C8102E','ARSENAL':'#EF0107','BAYERN MUNICH':'#DC052D','MAN CITY':'#6CABDD',
  'INTER MILAN':'#010E80','ATLETICO MADRID':'#CB3524','NAPOLI':'#12A0D7','CHELSEA':'#034694',
  'MILÁN':'#FB090B','BILBAO':'#EE2523','NEWCASTLE':'#241F20','JUVENTUS':'#888','MAN UNITED':'#DA291C',
};
const POS_ORDER = ['POR','DEF','MC','DEL'];
const POS_ICONS = { POR:'🧤', DEF:'🛡️', MC:'⚙️', DEL:'⚡' };

function ovrColor(ovr) {
  if (!ovr) return '#777';
  if (ovr >= 88) return '#FFE500';
  if (ovr >= 85) return '#4ade80';
  if (ovr >= 82) return '#60a5fa';
  if (ovr >= 78) return '#c084fc';
  return '#f87171';
}

// Canonical slug → DB team name (handles any old URL variants)
const SLUG_MAP = {
  // Bayern
  'bayer-de-munich':'BAYERN MUNICH','bayer-munich':'BAYERN MUNICH','bayer':'BAYERN MUNICH','bayern-munich':'BAYERN MUNICH',
  // Atletico
  'atletico-de-madrid':'ATLETICO MADRID','atletico-madrid':'ATLETICO MADRID','atletico':'ATLETICO MADRID',
  // Inter
  'inter-de-milan':'INTER MILAN','inter-milan':'INTER MILAN','inter':'INTER MILAN',
  // Man City
  'man-city':'MAN CITY','manchester-city':'MAN CITY',
  // Man United
  'man-united':'MAN UNITED','manchester-united':'MAN UNITED','man-utd':'MAN UNITED',
  // Newcastle
  'newcastle':'NEWCASTLE','newcastle-united':'NEWCASTLE',
  // Dortmund
  'dortmund':'DORTMUND','bvb':'DORTMUND','borussia-dortmund':'DORTMUND',
  // Milan
  'milan':'MILÁN','ac-milan':'MILÁN','ac-milan-milan':'MILÁN',
  // Others
  'psg':'PSG','paris-saint-germain':'PSG',
  'real-madrid':'REAL MADRID',
  'fc-barcelona':'FC BARCELONA','barcelona':'FC BARCELONA',
  'liverpool':'LIVERPOOL',
  'arsenal':'ARSENAL',
  'chelsea':'CHELSEA',
  'napoli':'NAPOLI',
  'bilbao':'BILBAO','athletic-bilbao':'BILBAO',
  'juventus':'JUVENTUS',
};

export default function EquipoPage({ params }) {
  const rawSlug  = decodeURIComponent(params.slug).toLowerCase();
  const teamName = SLUG_MAP[rawSlug] || rawSlug.toUpperCase().replace(/-/g,' ');
  const [equipo, setEquipo] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [traspasos, setTraspasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('plantilla');
  const [posFilter, setPosFilter] = useState('TODOS');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [eq, jug, tras] = await Promise.all([
      supabase.from('bvb_equipos').select('*').ilike('equipo', teamName).single(),
      supabase.from('liga_jugadores').select('*').ilike('equipo', teamName).order('ovr', { ascending: false }),
      supabase.from('bvb_traspasos').select('*').or(`equipo_origen.ilike.${teamName},equipo_destino.ilike.${teamName}`).order('id', { ascending: false }),
    ]);
    setEquipo(eq.data);
    setJugadores(jug.data || []);
    setTraspasos(tras.data || []);
    if (eq.data) setEditForm(eq.data);
    setLoading(false);
  }

  async function saveEdit() {
    setSaving(true);
    await supabase.from('bvb_equipos').update({
      manager: editForm.manager,
      ovr_medio: editForm.ovr_medio,
      budget: editForm.budget,
      mejor_jugador: editForm.mejor_jugador,
      ovr_mejor: editForm.ovr_mejor,
      discord_url: editForm.discord_url || null,
      whatsapp: editForm.whatsapp || null,
      ranking: editForm.ranking,
    }).eq('id', editForm.id);
    setEquipo({ ...equipo, ...editForm });
    setSaving(false);
    setEditing(false);
    // Forzar recarga para reflejar cambios en páginas server-side (ranking, dashboard)
    window.location.reload();
  }

  const color = TEAM_COLORS[teamName] || '#888';
  const isBVB = teamName === 'DORTMUND';
  const sorted = [...jugadores].sort((a,b) => (b.ovr||0)-(a.ovr||0));
  const top11 = sorted.slice(0,11);
  const top11Ovr = top11.length ? (top11.reduce((s,j)=>s+(j.ovr||0),0)/top11.length).toFixed(1) : '—';
  const clausulasTotal = jugadores.reduce((s,j)=>s+(parseFloat(j.clausula)||0),0);
  const gastos = traspasos.filter(t=>t.equipo_destino?.toUpperCase()===teamName).reduce((s,t)=>s+(parseFloat(t.precio)||0),0);
  const ingresos = traspasos.filter(t=>t.equipo_origen?.toUpperCase()===teamName).reduce((s,t)=>s+(parseFloat(t.precio)||0),0);
  const grouped = POS_ORDER.reduce((acc,pos)=>{ acc[pos]=jugadores.filter(j=>j.posicion===pos); return acc; },{});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-bvb-yellow animate-pulse font-black tracking-widest">CARGANDO...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back */}
      <a href="/ranking" className="inline-flex items-center gap-2 text-bvb-muted hover:text-bvb-yellow text-sm font-bold uppercase tracking-widest transition-colors">
        ← Ranking
      </a>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
        style={{ borderColor:`${color}40`, background:`linear-gradient(135deg,${color}12 0%,#080808 60%)` }}>
        <div className="dot-pattern absolute inset-0 opacity-20" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ClubLogo equipo={teamName} sofifa_team_id={equipo?.sofifa_team_id} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="section-label mb-1">CAYR Season 1</div>
            <h1 className="display-text text-3xl sm:text-4xl leading-none" style={{color}}>
              {teamName === 'FC BARCELONA' ? 'BARCELONA' : teamName}
            </h1>
            <p className="text-bvb-muted mt-2 text-sm">
              Manager: <span className="text-white font-bold">{equipo?.manager || '—'}</span>
              {equipo?.ranking && <span> · Ranking: <span className="font-bold" style={{color}}>#{equipo.ranking}</span></span>}
            </p>
            {isBVB && <p className="text-bvb-yellow text-xs font-bold mt-1 uppercase tracking-widest">← Este eres tú</p>}

            {/* Social buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              {equipo?.discord_url && (
                <a href={equipo.discord_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all"
                  style={{ background:'rgba(88,101,242,0.15)', border:'1px solid rgba(88,101,242,0.4)', color:'#5865F2' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Discord
                </a>
              )}
              {equipo?.whatsapp && (
                <a href={`https://wa.me/${equipo.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all"
                  style={{ background:'rgba(37,211,102,0.15)', border:'1px solid rgba(37,211,102,0.4)', color:'#25D366' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide bg-bvb-card border border-bvb-border hover:border-bvb-yellow/40 hover:text-bvb-yellow text-bvb-muted transition-all">
                ✎ Editar
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-5 text-center flex-shrink-0 w-full sm:w-auto">
            {[
              { label:'OVR Top 11', value: top11Ovr, color },
              { label:'Jugadores',  value: jugadores.length },
              { label:'Σ Cláusulas', value: clausulasTotal.toFixed(0)+'M' },
            ].map(({label,value,color:c})=>(
              <div key={label} className="bg-black/30 rounded-xl p-3">
                <p className="section-label mb-1">{label}</p>
                <p className="font-black text-xl" style={{color:c||'white'}}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={()=>setEditing(false)}>
          <div className="bg-bvb-dark border border-bvb-yellow/30 rounded-2xl p-6 w-full max-w-lg animate-slide-up" onClick={e=>e.stopPropagation()}>
            <h3 className="font-black text-bvb-yellow uppercase tracking-wide mb-5 flex items-center gap-2">
              ✎ Editar — {teamName}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {label:'Manager', key:'manager', type:'text'},
                {label:'Ranking', key:'ranking', type:'number'},
                {label:'OVR Medio', key:'ovr_medio', type:'number', step:'0.1'},
                {label:'Budget (M)', key:'budget', type:'number', step:'0.1'},
                {label:'Mejor jugador', key:'mejor_jugador', type:'text'},
                {label:'OVR mejor', key:'ovr_mejor', type:'number'},
              ].map(({label,key,type,step})=>(
                <div key={key}>
                  <label className="section-label block mb-1">{label}</label>
                  <input type={type} step={step} value={editForm[key]||''} onChange={e=>setEditForm(p=>({...p,[key]:e.target.value}))}
                    className="w-full bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="section-label block mb-1">Discord URL</label>
                <input type="url" value={editForm.discord_url||''} onChange={e=>setEditForm(p=>({...p,discord_url:e.target.value}))}
                  placeholder="https://discord.com/users/..." className="w-full bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
              </div>
              <div className="col-span-2">
                <label className="section-label block mb-1">WhatsApp (número con prefijo)</label>
                <input type="tel" value={editForm.whatsapp||''} onChange={e=>setEditForm(p=>({...p,whatsapp:e.target.value}))}
                  placeholder="+34612345678" className="w-full bg-bvb-black border border-bvb-border text-white px-3 py-2 rounded text-sm focus:border-bvb-yellow outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 bg-bvb-yellow text-black font-black text-xs uppercase tracking-widest rounded disabled:opacity-50 hover:bg-bvb-yellow-dim transition-colors">
                {saving?'Guardando...':'Guardar Cambios'}
              </button>
              <button onClick={()=>setEditing(false)}
                className="px-5 py-2.5 border border-bvb-border text-bvb-muted text-xs rounded hover:border-bvb-yellow hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Economy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {label:'Presupuesto', value:`${equipo?.budget||'—'}M`, cls:'text-white'},
          {label:'Cláusulas totales', value:`${clausulasTotal}M`, cls:'text-bvb-yellow'},
          {label:'Gastos', value:`${gastos}M`, cls:'text-red-400'},
          {label:'Ingresos', value:`+${ingresos}M`, cls:'text-green-400'},
        ].map(({label,value,cls})=>(
          <div key={label} className="bg-bvb-card border border-bvb-border rounded-xl p-3 sm:p-4 text-center">
            <p className="section-label mb-1">{label}</p>
            <p className={`text-xl sm:text-2xl font-black ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-bvb-border overflow-x-auto no-scrollbar">
        {[
          {key:'plantilla', label:`Plantilla (${jugadores.length})`},
          {key:'top', label:'Top 5'},
          {key:'movimientos', label:`Movimientos (${traspasos.length})`},
          {key:'stats', label:'Estadísticas'},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-3 sm:px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
              tab===t.key?'border-bvb-yellow text-bvb-yellow':'border-transparent text-bvb-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Plantilla tab */}
      {tab==='plantilla' && (
        <div className="space-y-3">
          <div className="flex gap-1 mb-3 flex-wrap">
            {['TODOS','POR','DEF','MC','DEL'].map(p => (
              <button key={p} onClick={() => setPosFilter(p)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${posFilter===p?'bg-bvb-yellow text-black':'bg-bvb-card border border-bvb-border text-bvb-muted hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
          {POS_ORDER.filter(pos => posFilter==='TODOS' || posFilter===pos).map(pos=>{
            const group = grouped[pos];
            if (!group?.length) return null;
            return (
              <div key={pos}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span>{POS_ICONS[pos]}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-bvb-muted">{pos} ({group.length})</span>
                  <div className="flex-1 h-px bg-bvb-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.map(j=>(
                    <div key={j.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bvb-card border border-bvb-border hover:border-bvb-border-bright transition-all">
                      <PlayerAvatar sofifa_id={j.sofifa_id} nombre={j.jugador} posicion={j.posicion} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-xs truncate">{j.jugador}</p>
                        {j.clausula && <p className="text-bvb-muted text-[10px]">Cláusula: {j.clausula}M</p>}
                        {j.potencial && <p className="text-green-400 text-[10px]">POT: {j.potencial} {j.edad ? `· ${j.edad}a` : ''}</p>}
                      </div>
                      <span className="font-black text-sm flex-shrink-0" style={{color:ovrColor(j.ovr)}}>{j.ovr}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top 5 tab */}
      {tab==='top' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {sorted.slice(0,5).map((j,i)=>(
            <div key={j.id} className="relative overflow-hidden rounded-xl border p-4 text-center"
              style={{ borderColor:`${color}30`, background:`linear-gradient(135deg,${color}10 0%,#161616 100%)` }}>
              {i===0 && <div className="absolute top-2 right-2 text-bvb-yellow text-xs">★</div>}
              <PlayerAvatar sofifa_id={j.sofifa_id} nombre={j.jugador} posicion={j.posicion} size="lg" />
              <p className="font-black text-white text-xs uppercase leading-tight">{j.jugador}</p>
              <p className="text-bvb-muted text-[10px] mt-0.5">{j.posicion}</p>
              <p className="font-black text-2xl mt-1" style={{color:ovrColor(j.ovr)}}>{j.ovr}</p>
              {j.clausula && <p className="text-bvb-muted text-[10px] mt-0.5">Cláusula: {j.clausula}M</p>}
            </div>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {tab==='stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POS_ORDER.map(pos => {
            const g = jugadores.filter(j => j.posicion===pos);
            const avg = g.length ? (g.reduce((s,j)=>s+(j.ovr||0),0)/g.length).toFixed(1) : '—';
            return (
              <div key={pos} className="bg-bvb-card border border-bvb-border rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">{POS_ICONS[pos]}</p>
                <p className="text-bvb-yellow font-black text-xl">{g.length}</p>
                <p className="section-label">{pos}</p>
                <p className="text-white text-sm font-bold mt-1">{avg} OVR</p>
              </div>
            );
          })}
          {[
            { label: 'Mayor clausula', value: jugadores.length ? `${jugadores.reduce((a,b) => parseFloat(a.clausula||0)>parseFloat(b.clausula||0)?a:b, jugadores[0])?.jugador} (${jugadores.reduce((a,b) => parseFloat(a.clausula||0)>parseFloat(b.clausula||0)?a:b, jugadores[0])?.clausula}M)` : '—' },
            { label: 'Mayor potencial', value: jugadores.length ? `${[...jugadores].sort((a,b)=>(b.potencial||0)-(a.potencial||0))[0]?.jugador} (${[...jugadores].sort((a,b)=>(b.potencial||0)-(a.potencial||0))[0]?.potencial})` : '—' },
            { label: 'Más joven', value: jugadores.filter(j=>j.edad).length ? `${[...jugadores].filter(j=>j.edad).sort((a,b)=>a.edad-b.edad)[0]?.jugador} (${[...jugadores].filter(j=>j.edad).sort((a,b)=>a.edad-b.edad)[0]?.edad}a)` : '—' },
          ].map(s => (
            <div key={s.label} className="bg-bvb-card border border-bvb-border rounded-xl p-4">
              <p className="section-label mb-1">{s.label}</p>
              <p className="text-white text-xs font-bold leading-tight">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Movimientos tab */}
      {tab==='movimientos' && (
        <div className="space-y-2">
          {traspasos.length===0 ? (
            <div className="text-center py-12 text-bvb-muted">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-bold">Sin movimientos registrados</p>
            </div>
          ) : traspasos.map(t=>{
            const isIn = t.equipo_destino?.toUpperCase()===teamName;
            return (
              <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                isIn?'bg-green-500/5 border-green-500/20':'bg-red-500/5 border-red-500/20'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  isIn?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>{isIn?'↓':'↑'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{t.jugador}</p>
                  <p className="text-bvb-muted text-xs">{t.equipo_origen} → {t.equipo_destino}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                    t.tipo==='clausulazo'?'badge-yellow':t.tipo==='intercambio'?'badge-purple':'badge-blue'}`}>{t.tipo}</span>
                  {parseFloat(t.precio)>0 && <span className="text-bvb-yellow text-xs font-black">{t.precio}M</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
