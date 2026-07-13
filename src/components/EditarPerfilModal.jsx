import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';

const EditarPerfilModal = ({ onCerrar }) => {
  const { usuario, perfil, refrescarPerfil } = useAuth();

  const [username, setUsername] = useState(perfil?.username || '');
  const [pfp, setPfp] = useState(perfil?.pfp || '');
  const [bio, setBio] = useState(perfil?.bio || '');
  const [favoritosPublicos, setFavoritosPublicos] = useState(true);

  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Traemos el estado actual de privacidad de la lista "Favoritos" al abrir el modal
  useEffect(() => {
    let mounted = true;

    const cargarLista = async () => {
      const { data, error: listaError } = await supabase
        .from('listas')
        .select('es_privada')
        .eq('user_id', usuario.id)
        .eq('nombre', 'Favoritos')
        .single();

      if (!mounted) return;

      if (listaError) {
        console.error('Error cargando la lista de Favoritos:', listaError);
      } else {
        setFavoritosPublicos(!data.es_privada);
      }
      setCargandoLista(false);
    };

    cargarLista();
    return () => { mounted = false; };
  }, [usuario.id]);

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    // 1. Actualizamos los datos del perfil
    const { error: perfilError } = await supabase
      .from('perfiles')
      .update({
        username: username.trim(),
        pfp: pfp.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', usuario.id);

    if (perfilError) {
      setGuardando(false);
      if (perfilError.code === '23505') {
        setError('Ese nombre de usuario ya está en uso.');
      } else {
        setError('No se pudo actualizar tu perfil. Intenta de nuevo.');
      }
      return;
    }

    // 2. Actualizamos la privacidad de la lista de Favoritos
    const { error: listaError } = await supabase
      .from('listas')
      .update({ es_privada: !favoritosPublicos })
      .eq('user_id', usuario.id)
      .eq('nombre', 'Favoritos');

    setGuardando(false);

    if (listaError) {
      console.error('Error actualizando privacidad de Favoritos:', listaError);
      setError('Tu perfil se guardó, pero no se pudo actualizar la privacidad de Favoritos.');
      return;
    }

    await refrescarPerfil();
    onCerrar();
  };

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-black uppercase tracking-widest mb-6 text-(--accent)">
          Editar perfil
        </h2>

        <form onSubmit={handleGuardar} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_.]+$"
              title="Solo letras, números, punto y guion bajo"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              URL de tu avatar
            </label>
            <input
              type="url"
              value={pfp}
              onChange={(e) => setPfp(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Bio
            </label>
            <textarea
              rows="3"
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntanos algo sobre ti..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 resize-none placeholder:text-zinc-600"
            />
          </div>

          {/* Toggle de privacidad de favoritos */}
          <div className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-4">
            <div>
              <p className="text-sm font-bold text-white">Lista de Favoritos pública</p>
              <p className="text-xs text-zinc-500 mt-0.5">Otras personas podrán ver qué tienes en Favoritos.</p>
            </div>
            <button
              type="button"
              disabled={cargandoLista}
              onClick={() => setFavoritosPublicos((prev) => !prev)}
              className={`w-12 h-7 rounded-full shrink-0 transition-all relative ${
                favoritosPublicos ? 'bg-(--accent)' : 'bg-zinc-700'
              } disabled:opacity-50`}>
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                  favoritosPublicos ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {error && <p className="text-rose-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 px-6 py-3 rounded-xl bg-(--accent) text-white font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditarPerfilModal;