import { useState } from "react";

import { supabase } from "../config/supabaseClient";
import ModalPortal from "./ModalPortal";
import { MIN_PASSWORD, validarPassword } from "../utils/validaciones";

const limpiarUrlRecuperacion = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("recuperar");
  url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
};

const ActualizarPasswordModal = ({ onCerrar }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => {
    limpiarUrlRecuperacion();
    onCerrar?.();
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (guardando) return;

    setError(null);
    setMensaje(null);

    const errorPassword = validarPassword(password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setGuardando(false);

    if (updateError) {
      console.error("Error actualizando contraseña:", updateError);
      setError("No se pudo actualizar la contraseña. Solicita un enlace nuevo.");
      return;
    }

    setMensaje("Contraseña actualizada correctamente.");
    setTimeout(cerrar, 1200);
  };

  return (
    <ModalPortal onCerrar={cerrar}>
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-2xl">
        <button
          type="button"
          onClick={cerrar}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="pr-8 text-lg font-black uppercase tracking-widest text-(--accent)">
          Nueva contraseña
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Elige una contraseña nueva de al menos {MIN_PASSWORD} caracteres.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
            minLength={MIN_PASSWORD}
            className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
          />

          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(evento) => setConfirmPassword(evento.target.value)}
            required
            minLength={MIN_PASSWORD}
            className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {mensaje && <p className="text-xs text-emerald-300">{mensaje}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-(--accent) px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110 disabled:opacity-40"
          >
            {guardando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </ModalPortal>
  );
};

export default ActualizarPasswordModal;
