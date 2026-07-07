import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

const MIN_CARACTERES = 15;

const Detalle = ({ item, onVolver }) => {
  const { usuario, esInvitado } = useAuth();

  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [ratingPositivo, setRatingPositivo] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);

  useEffect(() => {
    if (!item) return;
    let mounted = true;
    setCargandoComentarios(true);

    const cargarResenias = async () => {
      const { data, error } = await supabase
        .from('resenias')
        .select('id, rating, review_text, created_at, perfiles ( username )')
        .eq('libreria_id', item.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando reseñas:', error);
        if (mounted) setComentarios([]);
      } else if (mounted) {
        setComentarios(data || []);
      }
      if (mounted) setCargandoComentarios(false);
    };

    cargarResenias();
    return () => { mounted = false; };
  }, [item?.id]);

  if (!item) return null;

  const caracteresActuales = nuevoComentario.trim().length;
  const faltanCaracteres = MIN_CARACTERES - caracteresActuales;
  const textoValido = caracteresActuales >= MIN_CARACTERES;

  const deponerComentario = async (e) => {
    e.preventDefault();
    if (!textoValido || !usuario) return;

    setEnviando(true);
    setErrorEnvio(null);

    const { data, error } = await supabase
      .from('resenias')
      .insert({
        libreria_id: item.id,
        user_id: usuario.id,
        rating: ratingPositivo,
        review_text: nuevoComentario.trim(),
      })
      .select('id, rating, review_text, created_at, perfiles ( username )')
      .single();

    setEnviando(false);

    if (error) {
      console.error('Error al publicar reseña:', error);
      setErrorEnvio('No se pudo publicar tu reseña. Intenta de nuevo.');
      return;
    }

    setComentarios((prev) => [data, ...prev]);
    setNuevoComentario('');
    setRatingPositivo(true);
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDias === 0) return 'hoy';
    if (diffDias === 1) return 'hace 1 día';
    return `hace ${diffDias} días`;
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white pb-24">
      <div className="relative w-full h-[22vh] md:h-[45vh] overflow-hidden">
        <img
          src={item.imagenBanner || item.imagen}
          alt={item.titulo}
          className="w-full h-full object-cover object-top blur-sm scale-105 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        <button
          onClick={onVolver}
          className="absolute top-6 left-6 md:left-12 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 -mt-24 md:-mt-28 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

        <div className="flex flex-col items-center md:items-start">
          <div className="w-64 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={item.imagen} alt={item.titulo} className="w-full h-full object-cover" />
          </div>
          <div className="mt-6 w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--accent)] mb-3">{item.titulo}</h4>
            <p className="text-sm opacity-60 mb-2"><span className="font-bold text-white">Año:</span> {item.anio}</p>
            <p className="text-sm opacity-60 mb-2"><span className="font-bold text-white">Género:</span> {item.genero}</p>
            <p className="text-sm opacity-60"><span className="font-bold text-white">Plataforma / Disponibilidad:</span> Ficticio (Alfa)</p>
          </div>
        </div>

        <div className="md:col-span-2 text-left flex flex-col justify-start">
          <span className="px-3 py-1 self-start rounded-md bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-3">
            {item.tipo}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{item.titulo}</h2>

          <div className="flex items-center gap-2 text-yellow-500 mb-6">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="text-lg font-bold text-white">{item.calificacion} <span className="opacity-40 text-sm font-mono">/ 10</span></span>
          </div>

          <h3 className="text-lg font-bold mb-2 border-b border-white/5 pb-2">Sinopsis</h3>
          <p className="text-zinc-300 leading-relaxed mb-12">{item.descripcion}</p>

          <section className="mt-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              Sección de Reseñas <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{comentarios.length}</span>
            </h3>

            {esInvitado ? (
              <div className="mb-8 p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-sm text-zinc-400">
                Inicia sesión para dejar tu reseña sobre esta obra.
              </div>
            ) : (
              <form onSubmit={deponerComentario} className="mb-8">
                <textarea
                  rows="3"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe tu reseña u opinión sobre esta obra..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-base text-white focus:outline-none focus:border-[var(--accent)]/50 transition-all resize-none placeholder:text-zinc-600"
                ></textarea>

                <div className="flex justify-between items-center mt-1.5 px-1">
                  <span className={`text-[11px] font-mono ${textoValido ? 'text-emerald-500' : 'text-zinc-600'}`}>
                    {textoValido
                      ? `${caracteresActuales} caracteres`
                      : `Necesitas ${faltanCaracteres} caracteres más (mínimo ${MIN_CARACTERES})`}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setRatingPositivo(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      ratingPositivo
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border border-white/10 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    👍 Recomendada
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingPositivo(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      !ratingPositivo
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                        : 'bg-zinc-900 border border-white/10 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    👎 No recomendada
                  </button>
                </div>

                {errorEnvio && <p className="text-rose-400 text-xs mt-3">{errorEnvio}</p>}

                <button
                  type="submit"
                  disabled={enviando || !textoValido}
                  className="mt-3 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all self-end disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {enviando ? 'Publicando...' : 'Publicar Reseña'}
                </button>
              </form>
            )}

            {cargandoComentarios ? (
              <p className="text-sm text-zinc-500">Cargando reseñas...</p>
            ) : comentarios.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no hay reseñas para esta obra. ¡Sé el primero!</p>
            ) : (
              <div className="space-y-4">
                {comentarios.map((com) => (
                  <div key={com.id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-2">
                        {com.perfiles?.username || 'Usuario'}
                        <span className={com.rating ? 'text-emerald-400' : 'text-rose-400'}>
                          {com.rating ? '👍' : '👎'}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">{formatearFecha(com.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{com.review_text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Detalle;