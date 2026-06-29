'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'galeria';

const CATEGORIAS = [
  { id: 'all',       label: 'Todas',     color: '#FFE500' },
  { id: 'fichaje',   label: 'Fichajes',  color: '#4ade80' },
  { id: 'salida',    label: 'Salidas',   color: '#f87171' },
  { id: 'plantilla', label: 'Plantilla', color: '#60a5fa' },
  { id: 'partido',   label: 'Partidos',  color: '#c084fc' },
  { id: 'momento',   label: 'Momentos',  color: '#fb923c' },
];

const CAT_COLORS = Object.fromEntries(CATEGORIAS.map(c => [c.id, c.color]));

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function GaleriaPage() {
  const [fotos, setFotos]           = useState([]);
  const [filtro, setFiltro]         = useState('all');
  const [uploading, setUploading]   = useState(false);
  const [dragging, setDragging]     = useState(false);
  const [pendingFiles, setPending]  = useState([]); // files waiting for category
  const [catPending, setCatPending] = useState('momento');
  const [captionMap, setCaptions]   = useState({});
  const [lightbox, setLightbox]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const inputRef = useRef(null);

  // Load photos from Supabase Storage
  async function loadFotos() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.storage.from(BUCKET).list('', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (err) throw err;

      const items = (data || [])
        .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f.name))
        .map(f => {
          // Filename format: {timestamp}_{categoria}_{caption}.ext
          const parts = f.name.replace(/\.[^.]+$/, '').split('_');
          const cat  = parts[1] || 'momento';
          const cap  = parts.slice(2).join(' ') || '';
          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
          return { name: f.name, url: publicUrl, cat, caption: cap, created_at: f.created_at };
        });

      setFotos(items);
    } catch (e) {
      setError('No se puede acceder al bucket de Supabase. Crea un bucket público llamado "galeria" en Supabase Storage.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFotos(); }, []);

  // Drag & drop
  const onDragOver = useCallback(e => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) setPending(files);
  }, []);

  function onFileInput(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length) setPending(files);
    e.target.value = '';
  }

  async function uploadPending() {
    if (!pendingFiles.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of pendingFiles) {
      const caption = (captionMap[file.name] || '').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-áéíóúÁÉÍÓÚñÑ]/g, '') || 'foto';
      const ext     = file.name.split('.').pop().toLowerCase();
      const fname   = `${Date.now()}_${catPending}_${caption}.${ext}`;
      const { error: err } = await supabase.storage.from(BUCKET).upload(fname, file, { upsert: false });
      if (!err) ok++;
    }
    setUploading(false);
    setPending([]);
    setCaptions({});
    if (ok > 0) loadFotos();
  }

  async function deleteFoto(name) {
    if (!confirm('¿Borrar esta foto?')) return;
    await supabase.storage.from(BUCKET).remove([name]);
    setFotos(prev => prev.filter(f => f.name !== name));
    if (lightbox?.name === name) setLightbox(null);
  }

  const visible = filtro === 'all' ? fotos : fotos.filter(f => f.cat === filtro);
  const counts  = CATEGORIAS.reduce((acc, c) => {
    acc[c.id] = c.id === 'all' ? fotos.length : fotos.filter(f => f.cat === c.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="section-label mb-1">CAYR S1 · BVB Manager</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wide">
            <span className="text-bvb-yellow">Galería</span> de Fotos
          </h1>
        </div>
        <div className="flex items-center gap-2 text-bvb-muted text-sm">
          <span className="font-black text-white text-xl">{fotos.length}</span> fotos
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          dragging
            ? 'border-bvb-yellow bg-bvb-yellow/10 scale-[1.01]'
            : 'border-bvb-border hover:border-bvb-yellow/50 hover:bg-bvb-yellow/5'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !pendingFiles.length && inputRef.current?.click()}>
        <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={onFileInput} />

        {pendingFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 select-none">
            <div className="w-14 h-14 rounded-2xl bg-bvb-yellow/10 border border-bvb-yellow/30 flex items-center justify-center text-bvb-yellow">
              <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={28} />
            </div>
            <div className="text-center">
              <p className="font-black text-white">Arrastra fotos aquí o haz click</p>
              <p className="text-bvb-muted text-sm mt-0.5">JPG, PNG, GIF, WEBP · Múltiples archivos</p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4" onClick={e => e.stopPropagation()}>
            {/* Preview grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {pendingFiles.map(f => (
                <div key={f.name} className="aspect-square rounded-lg overflow-hidden bg-bvb-card border border-bvb-border relative group">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Category + captions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <p className="text-xs font-black text-bvb-muted uppercase tracking-wider mb-2">Categoría para todas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIAS.filter(c => c.id !== 'all').map(c => (
                    <button key={c.id} onClick={() => setCatPending(c.id)}
                      className={`px-3 py-1 rounded-full text-xs font-black border transition-all ${
                        catPending === c.id
                          ? 'text-black border-transparent'
                          : 'bg-transparent border-bvb-border text-bvb-muted hover:border-bvb-yellow/40'
                      }`}
                      style={catPending === c.id ? { background: c.color, borderColor: c.color } : {}}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex gap-2">
                <button onClick={() => setPending([])}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-bvb-muted border border-bvb-border rounded-xl hover:border-bvb-yellow/40 transition-colors">
                  Cancelar
                </button>
                <button onClick={uploadPending} disabled={uploading}
                  className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-bvb-yellow rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity">
                  {uploading
                    ? <><span className="animate-spin">⟳</span> Subiendo...</>
                    : <><Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" size={14} /> Subir {pendingFiles.length} foto{pendingFiles.length > 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 space-y-3">
          <p className="text-red-400 font-bold text-sm">{error}</p>
          <div className="text-bvb-muted text-xs space-y-1">
            <p className="font-black text-white text-xs uppercase tracking-wider">Cómo activar la galería:</p>
            <p>1. Ve a <span className="text-bvb-yellow">supabase.com → tu proyecto → Storage</span></p>
            <p>2. Click en <span className="text-bvb-yellow">"New bucket"</span></p>
            <p>3. Nombre: <span className="text-bvb-yellow font-mono">galeria</span> · activar <span className="text-bvb-yellow">Public</span></p>
            <p>4. En Policies, añade acceso de lectura y escritura públicos</p>
            <p>5. Recarga esta página</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {!error && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={() => setFiltro(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
                filtro === c.id
                  ? 'text-black border-transparent'
                  : 'bg-transparent border-bvb-border text-bvb-muted hover:text-white'
              }`}
              style={filtro === c.id ? { background: c.color, borderColor: c.color } : {}}>
              {c.label}
              <span className={`text-[10px] px-1.5 py-px rounded-full font-black ${
                filtro === c.id ? 'bg-black/20 text-black' : 'bg-bvb-card text-bvb-muted'
              }`}>
                {counts[c.id]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-bvb-card border border-bvb-border animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-bvb-muted">
          <Icon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={40} />
          <p className="font-black text-sm uppercase tracking-wider">
            {filtro === 'all' ? 'Sube tu primera foto' : `Sin fotos en "${CATEGORIAS.find(c=>c.id===filtro)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {visible.map(foto => (
            <div key={foto.name}
              className="break-inside-avoid rounded-xl overflow-hidden border border-bvb-border bg-bvb-card group relative cursor-pointer hover:border-bvb-yellow/40 transition-all hover:-translate-y-0.5"
              onClick={() => setLightbox(foto)}>

              <img src={foto.url} alt={foto.caption}
                className="w-full object-cover" loading="lazy" />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1">
                {foto.caption && (
                  <p className="text-white text-xs font-bold leading-tight">{foto.caption.replace(/-/g,' ')}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${CAT_COLORS[foto.cat]}30`, color: CAT_COLORS[foto.cat], border: `1px solid ${CAT_COLORS[foto.cat]}50` }}>
                    {CATEGORIAS.find(c=>c.id===foto.cat)?.label || foto.cat}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteFoto(foto.name); }}
                    className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xs hover:bg-red-500/40 transition-colors">
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center modal-backdrop"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />

            {/* Caption bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent rounded-b-xl flex items-center justify-between gap-3">
              <div>
                {lightbox.caption && (
                  <p className="text-white font-bold text-sm">{lightbox.caption.replace(/-/g,' ')}</p>
                )}
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${CAT_COLORS[lightbox.cat]}30`, color: CAT_COLORS[lightbox.cat] }}>
                  {CATEGORIAS.find(c=>c.id===lightbox.cat)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a href={lightbox.url} download target="_blank"
                  className="px-3 py-1.5 text-xs font-black text-black bg-bvb-yellow rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-opacity"
                  onClick={e => e.stopPropagation()}>
                  <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={12} />
                  Descargar
                </a>
                <button onClick={() => setLightbox(null)}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Icon d="M6 18L18 6M6 6l12 12" size={14} />
                </button>
              </div>
            </div>

            {/* Navigate prev/next */}
            {visible.length > 1 && (() => {
              const idx = visible.findIndex(f => f.name === lightbox.name);
              const prev = visible[idx - 1];
              const next = visible[idx + 1];
              return (
                <>
                  {prev && (
                    <button onClick={e => { e.stopPropagation(); setLightbox(prev); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                      ‹
                    </button>
                  )}
                  {next && (
                    <button onClick={e => { e.stopPropagation(); setLightbox(next); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                      ›
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
