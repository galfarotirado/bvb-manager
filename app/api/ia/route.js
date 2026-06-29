import { NextResponse } from 'next/server';

const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Groq: gratis, sin cuota diaria real (14.400 req/día)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

// Gemini: fallback si no hay Groq
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

const SYSTEM_PROMPT = `Eres el asistente táctico y de gestión del Borussia Dortmund en la CAYR Football Manager League (Season 1).
La CAYR es una liga de 17 equipos gestionados por personas reales, basada en EA FC 26.

Reglas clave:
- Las cláusulas se activan en ventanas de fichajes controladas por el admin
- Para comprar a un jugador: negocias entre 2× y 4× su cláusula
- El BVB tiene un presupuesto de 82M y una reserva obligatoria de 10M por temporada
- Cuando te hacen un clausulazo, ese dinero es INACTIVO hasta la próxima ventana
- El manager del BVB es Alfaro

Eres conciso, directo y apasionado. Hablas en español. Usas terminología de fútbol y Football Manager.
Cuando analices rivales, plantillas o estrategias, sé específico y práctico.`;

// ── Groq (OpenAI-compatible) ──────────────────────────────────────────────────
async function callGroq(messages, context) {
  const sysContent = context
    ? `${SYSTEM_PROMPT}\n\n[CONTEXTO ACTUAL DEL EQUIPO:\n${context}]`
    : SYSTEM_PROMPT;

  const openaiMessages = [
    { role: 'system', content: sysContent },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  for (const model of GROQ_MODELS) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (res.status === 429) continue;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'Sin respuesta';
    return { reply: text, model: `groq/${model}` };
  }
  throw new Error('Rate limit de Groq, reintentando...');
}

// ── Gemini (fallback) ─────────────────────────────────────────────────────────
async function callGemini(messages, context) {
  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  if (contents.length > 0 && contents[0].role === 'user') {
    const ctxText = context ? `\n\n[CONTEXTO ACTUAL DEL EQUIPO:\n${context}]\n\n` : '';
    contents[0].parts[0].text =
      `${SYSTEM_PROMPT}${ctxText}\n\nPregunta del manager: ${contents[0].parts[0].text}`;
  }

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (res.status === 429 || res.status === 503) continue;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
    return { reply: text, model: `gemini/${model}` };
  }
  throw new Error('Cuota diaria de Gemini agotada');
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req) {
  if (!GROQ_API_KEY && !GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Sin clave de IA. Añade GROQ_API_KEY en .env.local\n' +
          '→ Gratis en https://console.groq.com (sin tarjeta)',
      },
      { status: 503 }
    );
  }

  const { messages, context } = await req.json();

  // 1. Groq primero
  if (GROQ_API_KEY) {
    try {
      return NextResponse.json(await callGroq(messages, context));
    } catch (e) {
      console.warn('[IA] Groq falló:', e.message);
    }
  }

  // 2. Gemini como fallback
  if (GEMINI_API_KEY) {
    try {
      return NextResponse.json(await callGemini(messages, context));
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }
  }

  return NextResponse.json(
    { error: 'Todos los proveedores de IA fallaron.' },
    { status: 503 }
  );
}
