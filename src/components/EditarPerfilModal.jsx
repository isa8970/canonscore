import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ModalPortal from "./ModalPortal";

const EditarPerfilModal = ({
  onCerrar,
}) => {
  const {
    usuario,
    perfil,
    refrescarPerfil,
  } = useAuth();

  const [username, setUsername] =
    useState(perfil?.username || "");

  const [pfp, setPfp] =
    useState(perfil?.pfp || "");

  const [bio, setBio] =
    useState(perfil?.bio || "");

  const [
    favoritosPublicos,
    setFavoritosPublicos,
  ] = useState(true);

  const [
    cargandoLista,
    setCargandoLista,
  ] = useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    if (!usuario?.id) return;

    let mounted = true;

    const cargarLista = async () => {
      const {
        data,
        error: listaError,
      } = await supabase
        .from("listas")
        .select("es_privada")
        .eq("user_id", usuario.id)
        .eq("nombre", "Favoritos")
        .maybeSingle();

      if (!mounted) return;

      if (listaError) {
        console.error(
          "Error cargando Favoritos:",
          listaError,
        );
      } else if (data) {
        setFavoritosPublicos(
          !data.es_privada,
        );
      }

      setCargandoLista(false);
    };

    cargarLista();

    return () => {
      mounted = false;
    };
  }, [usuario?.id]);

  if (!usuario) return null;

  const handleGuardar = async (
    event,
  ) => {
    event.preventDefault();

    setError(null);
    setGuardando(true);

    const { error: perfilError } =
      await supabase
        .from("perfiles")
        .update({
          username: username.trim(),
          pfp: pfp.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", usuario.id);

    if (perfilError) {
      setGuardando(false);

      if (
        perfilError.code === "23505"
      ) {
        setError(
          "Ese nombre de usuario ya está en uso.",
        );
      } else {
        setError(
          "No se pudo actualizar tu perfil.",
        );
      }

      return;
    }

    const { error: listaError } =
      await supabase
        .from("listas")
        .update({
          es_privada:
            !favoritosPublicos,
        })
        .eq("user_id", usuario.id)
        .eq("nombre", "Favoritos");

    setGuardando(false);

    if (listaError) {
      console.error(
        "Error actualizando favoritos:",
        listaError,
      );

      setError(
        "El perfil se guardó, pero no se actualizó la privacidad.",
      );

      return;
    }

    await refrescarPerfil();
    onCerrar();
  };

  return (
    <ModalPortal onCerrar={onCerrar}>
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <button
          type="button"
          onClick={onCerrar}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="mb-6 pr-8 text-xl font-black uppercase tracking-widest text-(--accent)">
          Editar perfil
        </h2>

        <form
          onSubmit={handleGuardar}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Nombre de usuario
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_.]+$"
              title="Solo letras, números, punto y guion bajo"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none focus:border-(--accent)/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              URL de tu avatar
            </label>

            <input
              type="url"
              value={pfp}
              onChange={(event) =>
                setPfp(
                  event.target.value,
                )
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Bio
            </label>

            <textarea
              rows="3"
              maxLength={300}
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value,
                )
              }
              placeholder="Cuéntanos algo sobre ti..."
              className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
            <div>
              <p className="text-sm font-bold text-white">
                Lista de Favoritos pública
              </p>

              <p className="mt-0.5 text-xs text-zinc-500">
                Otras personas podrán ver
                tus favoritos.
              </p>
            </div>

            <button
              type="button"
              disabled={cargandoLista}
              onClick={() =>
                setFavoritosPublicos(
                  (actual) => !actual,
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
                favoritosPublicos
                  ? "bg-(--accent)"
                  : "bg-zinc-700"
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  favoritosPublicos
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="mt-2 rounded-xl bg-(--accent) px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : "Guardar cambios"}
          </button>
        </form>
      </div>
    </ModalPortal>
  );
};

export default EditarPerfilModal;