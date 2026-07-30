import { useState } from "react";
import { createPortal } from "react-dom";

import LoginForm from "./LoginForm";
import RegistroForm from "./RegistroForm";
import RecuperarPasswordForm from "./RecuperarPasswordForm";

const TITULOS = {
  login: "Iniciar sesión",
  registro: "Crear cuenta",
  recuperar: "Recuperar contraseña",
};

const AuthModal = ({ onCerrar }) => {
  const [modo, setModo] = useState("login");

  return createPortal(
    <div className="fixed inset-0 z-2147483647 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <button
          type="button"
          onClick={onCerrar}
          className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="mb-6 pr-8 text-xl font-black uppercase tracking-widest text-(--accent)">
          {TITULOS[modo]}
        </h2>

        {modo === "login" && (
          <LoginForm
            onExito={onCerrar}
            onRecuperarPassword={() => setModo("recuperar")}
          />
        )}

        {modo === "registro" && <RegistroForm onExito={onCerrar} />}

        {modo === "recuperar" && (
          <RecuperarPasswordForm onVolver={() => setModo("login")} />
        )}

        {modo !== "recuperar" && (
          <p className="mt-6 text-center text-xs text-zinc-500">
            {modo === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              type="button"
              onClick={() => setModo(modo === "login" ? "registro" : "login")}
              className="font-bold text-(--accent) hover:underline"
            >
              {modo === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default AuthModal;