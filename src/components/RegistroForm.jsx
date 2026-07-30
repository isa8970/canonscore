import { useState } from "react";

import { supabase } from "../config/supabaseClient";
import {
  MAX_USERNAME,
  MIN_PASSWORD,
  MIN_USERNAME,
  normalizarEmail,
  normalizarUsername,
  validarPassword,
  validarUsername,
} from "../utils/validaciones";

const RegistroForm = ({ onExito }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const comprobarUsername = async (usernameLimpio) => {
    const { data, error: consultaError } = await supabase
      .from("perfiles")
      .select("id")
      .eq("username_normalizado", usernameLimpio.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (consultaError) {
      console.warn(
        "No se pudo comprobar el username antes del registro; la base de datos hará la validación final:",
        consultaError,
      );
      return true;
    }

    return !data;
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (cargando) return;

    setError(null);
    setMensaje(null);

    const usernameLimpio = normalizarUsername(username);
    const emailLimpio = normalizarEmail(email);

    const errorUsername = validarUsername(usernameLimpio);
    if (errorUsername) {
      setError(errorUsername);
      return;
    }

    const errorPassword = validarPassword(password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    const usernameDisponible = await comprobarUsername(usernameLimpio);
    if (!usernameDisponible) {
      setCargando(false);
      setError("Ese nombre de usuario ya está en uso.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailLimpio,
      password,
      options: {
        data: {
          username: usernameLimpio,
        },
      },
    });

    setCargando(false);

    if (signUpError) {
  console.error("Error completo al crear la cuenta:", {
    message: signUpError.message,
    code: signUpError.code,
    status: signUpError.status,
    name: signUpError.name,
    error: signUpError,
  });

  const mensajeError = String(
    signUpError.message || "",
  ).toLowerCase();

  if (
    signUpError.code === "23505" ||
    mensajeError.includes("username") ||
    mensajeError.includes("duplicate")
  ) {
    setError("Ese nombre de usuario ya está en uso.");
  } else if (mensajeError.includes("password")) {
    setError(
      `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`,
    );
  } else {
    setError(
      `${signUpError.message || "Error desconocido"}${
        signUpError.code
          ? ` · Código: ${signUpError.code}`
          : ""
      }`,
    );
  }

  return;
}

    if (!data.session) {
      setMensaje("Cuenta creada. Revisa tu correo para confirmar el registro.");
      setTimeout(() => onExito?.(data), 1400);
      return;
    }

    onExito?.(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(evento) => setUsername(evento.target.value)}
          required
          minLength={MIN_USERNAME}
          maxLength={MAX_USERNAME}
          pattern="[a-zA-Z0-9_.]+"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
        />
        <p className="mt-1 text-[10px] text-zinc-600">
          De {MIN_USERNAME} a {MAX_USERNAME} caracteres: letras, números, punto o guion bajo.
        </p>
      </div>

      <input
        type="email"
        name="email"
        autoComplete="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        required
        className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
      />

      <div>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Contraseña"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          required
          minLength={MIN_PASSWORD}
          className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
        />
        <p className="mt-1 text-[10px] text-zinc-600">
          Mínimo {MIN_PASSWORD} caracteres.
        </p>
      </div>

      <input
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(evento) => setConfirmPassword(evento.target.value)}
        required
        minLength={MIN_PASSWORD}
        className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
      />

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {mensaje && <p className="text-xs text-emerald-300">{mensaje}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="rounded-xl bg-(--accent) px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cargando ? "Creando cuenta..." : "Registrarse"}
      </button>
    </form>
  );
};

export default RegistroForm;