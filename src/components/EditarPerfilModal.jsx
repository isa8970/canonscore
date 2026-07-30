import React, { useState } from "react";
import { createPortal } from "react-dom";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";

const EditarPerfilModal = ({ onCerrar }) => {
  const { usuario, perfil, refrescarPerfil } = useAuth();

  const [username, setUsername] = useState(perfil?.username || "");
  const [pfp, setPfp] = useState(perfil?.pfp || "");
  const [bio, setBio] = useState(perfil?.bio || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleGuardar = async (evento) => {
    evento.preventDefault();

    if (!usuario?.id || guardando) return;

    const usernameLimpio = username.trim();
    const pfpLimpio = pfp.trim();
    const bioLimpia = bio.trim();

    if (usernameLimpio.length < 3 || usernameLimpio.length > 20) {
      setError("El nombre de usuario debe tener entre 3 y 20 caracteres.");
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(usernameLimpio)) {
      setError("Usa solamente letras, números, punto y guion bajo.");
      return;
    }

    setError(null);
    setGuardando(true);

    const { error: perfilError } = await supabase
      .from("perfiles")
      .update({
        username: usernameLimpio,
        pfp: pfpLimpio || null,
        bio: bioLimpia || null,
      })
      .eq("id", usuario.id);

    setGuardando(false);

    if (perfilError) {
      console.error("Error actualizando el perfil:", perfilError);

      if (perfilError.code === "23505") {
        setError("Ese nombre de usuario ya está en uso.");
      } else {
        setError("No se pudo actualizar tu perfil. Intenta de nuevo.");
      }

      return;
    }

    await refrescarPerfil();
    onCerrar();
  };

  return createPortal(
    <div className="fixed inset-0 z-180 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <section className="theme-surface relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onCerrar}
          disabled={guardando}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface-soft) text-(--color-text-secondary) transition-colors hover:text-(--color-text) disabled:opacity-40"
          aria-label="Cerrar edición de perfil"
        >
          ✕
        </button>

        <h2 className="theme-modal-title mb-6 pr-12 text-xl font-black uppercase tracking-widest">
          Editar perfil
        </h2>

        <form onSubmit={handleGuardar} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="editar-username"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)"
            >
              Nombre de usuario
            </label>
            <input
              id="editar-username"
              type="text"
              value={username}
              onChange={(evento) => {
                setUsername(evento.target.value);
                setError(null);
              }}
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_.]+$"
              title="Solo letras, números, punto y guion bajo"
              className="theme-input w-full rounded-xl border p-3 text-base outline-none focus:border-(--accent)/60 focus:ring-2 focus:ring-(--accent)/10"
            />
          </div>

          <div>
            <label
              htmlFor="editar-pfp"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)"
            >
              URL de tu avatar
            </label>
            <input
              id="editar-pfp"
              type="url"
              value={pfp}
              onChange={(evento) => {
                setPfp(evento.target.value);
                setError(null);
              }}
              placeholder="https://..."
              className="theme-input w-full rounded-xl border p-3 text-base outline-none placeholder:text-(--color-text-muted) focus:border-(--accent)/60 focus:ring-2 focus:ring-(--accent)/10"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="editar-bio"
                className="text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)"
              >
                Bio
              </label>
              <span className="text-[10px] font-mono text-(--color-text-muted)">
                {bio.length} / 300
              </span>
            </div>
            <textarea
              id="editar-bio"
              rows="4"
              maxLength={300}
              value={bio}
              onChange={(evento) => {
                setBio(evento.target.value);
                setError(null);
              }}
              placeholder="Cuéntanos algo sobre ti..."
              className="theme-input w-full resize-none rounded-xl border p-3 text-base outline-none placeholder:text-(--color-text-muted) focus:border-(--accent)/60 focus:ring-2 focus:ring-(--accent)/10"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="mt-1 rounded-xl bg-(--accent) px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>
    </div>,
    document.body,
  );
};

export default EditarPerfilModal;