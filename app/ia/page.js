'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const SUGGESTIONS = [
  '¿Cuál es la mejor alineación táctica contra un equipo defensivo?',
  '¿Qué posición debería reforzar primero en el mercado?',
  'Analiza el estado de mi plantilla y dime qué necesito',
  '¿Cómo negocio una cláusula de 30M estando al límite de presupuesto?',
  '¿Qué rival de la CAYR es el más peligroso tácticamente?',
  'Dame una estrategia para la segunda vuelta de la liga',
];

export default function IAPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const [hasKey, setHasKey] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load team context from Supabase
  useEffect(() => {
    async function loadContext() {
      const [jug, tras, eco] = await Promise.all([
        supabase.from('liga_jugadores').select('jugador,posicion,ovr,clausula').ilike('equipo','DORTMUND').order('ovr',{ascending:false}),
        supabase.from('bvb_traspasos').select('jugador,tipo,precio,equipo_origen,equipo_destino').order('id',{ascending:false}).limit(10),
        supabase.from('bvb_economia').select('budget_inicial').eq('equipo','DORTMUND').single(),
      ]);

      const plantilla = (jug.data||[]).map(j=>`${j.posicion} ${j.jugador} (OVR:${j.ovr}, C:${j.clausula}M)`).join(', ');
      const gastos = (tras.data||[]).filter(t=>t.equipo_destino?.toUpperCase()==='DORTMUND').reduce((s,t)=>s+(parseFloat(t.precio)||0),0);
      const ingresos = (tras.data||[]).filter(t=>t.equipo_origen?.toUpperCase()==='DORTMUND').reduce((s,t)=>s+(parseFloat(t.precio)||0),0);
      const budget = eco.data?.budget_inicial || 82;
      const disponible = budget + ingresos - gastos - 10;

      setContext(`Plantilla BVB: ${plantilla || 'Sin datos'}. Presupuesto disponible: ${disponible.toFixed(1)}M. Últimas operaciones: ${
        (tras.data||[]).slice(0,5).map(t=>`${t.jugador} (${t.tipo}, ${t.precio}M)`).join(', ') || 'ninguna'
      }`);
    }
    loadContext();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}`, isError: true }]);
        if (data.error.includes('API_KEY') || data.error.includes('clave') || data.error.includes('configurada')) setHasKey(false);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (hasKey === null) setHasKey(true);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error de conexión', isError: true }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="display-text text-3xl text-bvb-yellow">ASISTENTE IA</h1>
          <p className="text-bvb-muted text-xs mt-1">Powered by Groq · Llama 3.3 · Análisis táctico BVB</p>
        </div>
        <div className="flex items-center gap-2">
          {hasKey === false && (
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer"
              className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded border border-bvb-yellow/40 text-bvb-yellow bg-bvb-yellow/10 hover:bg-bvb-yellow/20 transition-colors">
              Obtener API Key gratis →
            </a>
          )}
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="text-xs font-bold text-bvb-muted hover:text-white px-3 py-1.5 rounded border border-bvb-border hover:border-bvb-border-bright transition-colors">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* No API key warning */}
      {hasKey === false && (
        <div className="flex-shrink-0 mb-4 p-4 rounded-xl border border-bvb-yellow/30 bg-bvb-yellow/8">
          <p className="font-black text-bvb-yellow text-sm">⚡ Configura tu API Key gratuita</p>
          <p className="text-bvb-muted text-xs mt-1">
            1. Ve a <a href="https://console.groq.com" target="_blank" className="text-bvb-yellow underline">console.groq.com</a> → "Create API Key" (gratis, sin tarjeta)<br/>
            2. Añade la key a <code className="bg-bvb-black px-1 rounded">.env.local</code>:<br/>
            <code className="bg-bvb-black px-2 py-0.5 rounded text-bvb-yellow block mt-1">GROQ_API_KEY=gsk_...tukey</code>
            3. Reinicia el servidor (<span className="text-white">npm run dev</span>)
          </p>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="mb-3 flex justify-center">
                <img src="/ia/IA.png" alt="Asistente IA BVB" className="w-24 h-24 object-contain" />
              </div>
              <p className="font-black text-white text-lg">Asistente táctico BVB</p>
              <p className="text-bvb-muted text-sm mt-1">
                Pregúntame sobre estrategia, fichajes, análisis de rivales o gestión del equipo.
                <br/>Tengo acceso a tu plantilla y economía en tiempo real.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-xl border border-bvb-border bg-bvb-card hover:border-bvb-yellow/40 hover:bg-bvb-card-hover text-bvb-muted-bright text-xs transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-bvb-yellow flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <span className="text-black text-[10px] font-black">IA</span>
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-bvb-yellow text-black font-semibold rounded-tr-sm'
                  : m.isError
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 rounded-tl-sm'
                    : 'bg-bvb-card border border-bvb-border text-white rounded-tl-sm'
              }`}
                style={{ whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-bvb-yellow flex items-center justify-center flex-shrink-0 mr-2">
              <span className="text-black text-[10px] font-black">IA</span>
            </div>
            <div className="bg-bvb-card border border-bvb-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <div className="w-1.5 h-1.5 rounded-full bg-bvb-yellow animate-bounce" style={{animationDelay:'0ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-bvb-yellow animate-bounce" style={{animationDelay:'150ms'}}/>
                <div className="w-1.5 h-1.5 rounded-full bg-bvb-yellow animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pregunta al asistente táctico BVB... (Enter para enviar)"
          rows={1}
          className="flex-1 bg-bvb-card border border-bvb-border text-white px-4 py-3 rounded-xl text-sm focus:border-bvb-yellow outline-none resize-none leading-relaxed"
          style={{ minHeight: '48px', maxHeight: '120px' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-bvb-yellow text-black font-black disabled:opacity-40 hover:bg-bvb-yellow-dim transition-colors flex-shrink-0">
          {loading ? '⋯' : '→'}
        </button>
      </div>
    </div>
  );
}
