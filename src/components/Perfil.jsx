import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import EditarPerfilModal from './EditarPerfilModal';

const Perfil = ({ onVolver }) => {
  const { usuario, perfil } = useAuth();
  const [mostrarEdicion, setMostrarEdicion] = useState(false);

  // Pestaña activa: 'resenas' por defecto, 'favoritos' solo aparece si la lista es pública
  const [tab, setTab] = useState('resenas');

  const [misResenias, setMisResenias] = useState([]);
  const [cargandoResenias, setCargandoResenias] = useState(true);

  const [favoritosPublicos, setFavoritosPublicos] = useState(false);
  const [misFavoritos, setMisFavoritos] = useState([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(true);

  // Cargar las reseñas propias del usuario
  useEffect(() => {
    if (!usuario) return;
    let mounted = true;

    const cargarResenias = async () => {
      const { data, error } = await supabase
        .from('resenias')
        .select('id, rating, review_text, created_at, libreria ( id, titulo, cover, tipo )')
        .eq('user_id', usuario.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando tus reseñas:', error);
        if (mounted) setMisResenias([]);
      } else if (mounted) {
        setMisResenias(data || []);
      }
      if (mounted) setCargandoResenias(false);
    };

    cargarResenias();
    return () => { mounted = false; };
  }, [usuario]);

  // Cargar la lista de Favoritos: primero saber si es pública, y si lo es, traer sus títulos
  useEffect(() => {
    if (!usuario) return;
    let mounted = true;

    const cargarFavoritos = async () => {
      const { data: lista, error: listaError } = await supabase
        .from('listas')
        .select('id, es_privada')
        .eq('user_id', usuario.id)
        .eq('nombre', 'Favoritos')
        .single();

      if (listaError || !lista) {
        console.error('Error cargando la lista de Favoritos:', listaError);
        if (mounted) {
          setFavoritosPublicos(false);
          setCargandoFavoritos(false);
        }
        return;
      }

      const esPublica = !lista.es_privada;
      if (mounted) setFavoritosPublicos(esPublica);

      if (!esPublica) {
        if (mounted) setCargandoFavoritos(false);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from('lista_items')
        .select('id, libreria ( id, titulo, cover, tipo )')
        .eq('lista_id', lista.id);

      if (itemsError) {
        console.error('Error cargando items de Favoritos:', itemsError);
        if (mounted) setMisFavoritos([]);
      } else if (mounted) {
        setMisFavoritos(items || []);
      }
      if (mounted) setCargandoFavoritos(false);
    };

    cargarFavoritos();
    return () => { mounted = false; };
  }, [usuario]);

  if (!usuario) return null; // seguridad extra: si por alguna razón no hay sesión, no renderiza nada

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header: Volver a la izquierda, Editar (ícono) a la derecha */}
      <div className="max-w-225 mx-auto px-6 pt-8 flex items-center justify-between">
        <button
          onClick={onVolver}
          className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>

        <button
          onClick={() => setMostrarEdicion(true)}
          title="Editar perfil"
          className="w-9 h-9 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Tarjeta de perfil */}
      <div className="max-w-225 mx-auto px-6 mt-10">
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-10">
          {/* flex-col en móvil (apilado), flex-row desde md (lado a lado) */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* Avatar + rol debajo */}
            <div className="flex flex-col items-center shrink-0 gap-3">
              <div className="w-32 h-32 rounded-full bg-(--accent)/10 border border-(--accent)/20 flex items-center justify-center overflow-hidden">
                {perfil?.pfp ? (
                  <img src={perfil.pfp} alt={perfil.username} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>

              <span className="px-3 py-1 rounded-md bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-[10px] font-black uppercase tracking-widest">
                {perfil?.rol === 'administrador' ? 'Administrador' : 'Usuario registrado'}
              </span>
            </div>

            {/* Datos del usuario, alineados a la izquierda */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="text-2xl font-black tracking-tight mb-1">{perfil?.username || 'Usuario'}</h2>

              <p className="text-xs text-zinc-600 mb-3">{usuario.email}</p>

              {perfil?.bio && (
                <p className="text-sm text-zinc-400 max-w-md">{perfil.bio}</p>
              )}
            </div>

          </div>
        </div>

        {/* Tabs: Reseñas siempre, Favoritos solo si la lista es pública */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setTab('resenas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                tab === 'resenas'
                  ? 'bg-(--accent)/15 text-(--accent) border border-(--accent)/30'
                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
              }`}
            >
              Reseñas ({misResenias.length})
            </button>

            {!cargandoFavoritos && favoritosPublicos && (
              <button
                onClick={() => setTab('favoritos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === 'favoritos'
                    ? 'bg-(--accent)/15 text-(--accent) border border-(--accent)/30'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                Favoritos ({misFavoritos.length})
              </button>
            )}
          </div>

          {/* Contenido: Reseñas */}
          {tab === 'resenas' && (
            cargandoResenias ? (
              <p className="text-sm text-zinc-500">Cargando tus reseñas...</p>
            ) : misResenias.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no has publicado ninguna reseña.</p>
            ) : (
              <div className="space-y-3">
                {misResenias.map((r) => (
                  <div key={r.id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        {r.libreria?.titulo || 'Obra eliminada'}
                        <span className={r.rating ? 'text-emerald-400' : 'text-rose-400'}>
                          {r.rating ? '👍' : '👎'}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono uppercase">{r.libreria?.tipo}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{r.review_text}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Contenido: Favoritos */}
          {tab === 'favoritos' && favoritosPublicos && (
            cargandoFavoritos ? (
              <p className="text-sm text-zinc-500">Cargando tus favoritos...</p>
            ) : misFavoritos.length === 0 ? (
              <p className="text-sm text-zinc-500">Todavía no tienes títulos guardados en Favoritos.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {misFavoritos.map((item) => (
                  <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-xl overflow-hidden">
                    <div className="aspect-3/4 bg-zinc-800">
                      {item.libreria?.cover && (
                        <img
                          src={item.libreria.cover}
                          alt={item.libreria.titulo}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-white line-clamp-1">{item.libreria?.titulo}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">{item.libreria?.tipo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {mostrarEdicion && <EditarPerfilModal onCerrar={() => setMostrarEdicion(false)} />}
    </div>
  );
};

export default Perfil;