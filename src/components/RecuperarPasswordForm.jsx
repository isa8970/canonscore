import { useState } from "react";

import { supabase } from "../config/supabaseClient";
import { normalizarEmail } from "../utils/validaciones";

const RecuperarPasswordForm = ({ onVolver }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (cargando) return;

    setError(null);
    setMensaje(null);
    setCargando(true);

    const redirectTo = `${window.location.origin}${window.location.pathname}?recuperar=1`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalizarEmail(email),
      { redirectTo },
    );

    setCargando(false);

    if (resetError) {
      console.error("Error enviando recuperación:", resetError);
      setError("No se pudo enviar el correo de recuperación. Intenta nuevamente.");
      return;
    }

    setMensaje(
      "Si el correo está registrado, recibirás un enlace para cambiar la contraseña.",
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-zinc-400">
        Escribe el correo de tu cuenta. Te enviaremos un enlace para elegir una contraseña nueva.
      </p>

      <input
        type="email"
        name="recoveryEmail"
        autoComplete="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        required
        className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
      />

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {mensaje && <p className="text-xs leading-relaxed text-emerald-300">{mensaje}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-xl bg-(--accent) px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cargando ? "Enviando..." : "Enviar enlace"}
      </button>

      <button
        type="button"
        onClick={onVolver}
        className="text-xs font-bold text-zinc-500 transition-colors hover:text-white"
      >
        Volver a iniciar sesión
      </button>
    </form>
  );
};

export default RecuperarPasswordForm;