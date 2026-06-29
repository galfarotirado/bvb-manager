import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [{ data: equipo }, { data: plantilla }] = await Promise.all([
      supabase.from('bvb_equipos').select('ranking, ovr_promedio').eq('equipo', 'DORTMUND').single(),
      supabase.from('bvb_plantilla').select('ovr').order('ovr', { ascending: false }).limit(11),
    ]);

    const top11Ovr = plantilla?.length
      ? (plantilla.reduce((s, p) => s + p.ovr, 0) / plantilla.length).toFixed(1)
      : null;

    return NextResponse.json({
      ranking: equipo?.ranking ?? null,
      ovr: top11Ovr ?? equipo?.ovr_promedio ?? null,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ ranking: null, ovr: null });
  }
}
