import { useState } from "react";

import LoginForm from "./LoginForm";
import RegistroForm from "./RegistroForm";
import ModalPortal from "./ModalPortal";

const AuthModal = ({ onCerrar }) => {
  const [modo, setModo] =
    useState("login");

  return (
    <ModalPortal onCerrar={onCerrar}>
      <div
        className="
          relative
          w-full max-w-sm
          rounded-2xl
          border border-white/10
          bg-zinc-950
          p-8
          shadow-2xl
        "
      >
        <button
          type="button"
          onClick={onCerrar}
          className="
            absolute right-4 top-4
            text-zinc-500
            transition-colors
            hover:text-white
          "
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2 className="mb-6 pr-8 text-xl font-black uppercase tracking-widest text-(--accent)">
          {modo === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
        </h2>

        {modo === "login" ? (
          <LoginForm
            onExito={onCerrar}
          />
        ) : (
          <RegistroForm
            onExito={onCerrar}
          />
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          {modo === "login"
            ? "¿No tienes cuenta? "
            : "¿Ya tienes cuenta? "}

          <button
            type="button"
            onClick={() =>
              setModo(
                modo === "login"
                  ? "registro"
                  : "login",
              )
            }
            className="font-bold text-(--accent) hover:underline"
          >
            {modo === "login"
              ? "Regístrate"
              : "Inicia sesión"}
          </button>
        </p>
      </div>
    </ModalPortal>
  );
};

export default AuthModal;