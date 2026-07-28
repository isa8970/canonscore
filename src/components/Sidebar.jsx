import React, {
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { CATEGORIAS_MAP } from "../constants/categorias";
import AdminPanelModal from "./AdminPanelModal";

const Sidebar = ({
  categoriaActiva,
  setCategoriaActiva,
  volverAInicio,
  irAPerfil,
  irAListas,
  abierto = false,
  onCerrar = () => {},
  onAbrirLogin = () => {},
}) => {
  const {
    usuario,
    perfil,
    cerrarSesion,
    esAdmin,
  } = useAuth();

  const categorias =
    Object.keys(
      CATEGORIAS_MAP,
    );

  const [
    mostrarAdmin,
    setMostrarAdmin,
  ] = useState(false);

  const seleccionarCategoria = (
    valorReal,
  ) => {
    volverAInicio();
    setCategoriaActiva(
      valorReal,
    );
    onCerrar();
  };

  const handleCerrarSesion =
    async () => {
      await cerrarSesion();

      onCerrar();
      volverAInicio();
    };

  const abrirInicio = () => {
    volverAInicio();

    setCategoriaActiva(
      "Todas",
    );

    onCerrar();
  };

  const abrirListas = () => {
    irAListas();
    onCerrar();
  };

  const abrirPerfil = () => {
    irAPerfil();
    onCerrar();
  };

  const abrirAdministracion =
    () => {
      setMostrarAdmin(true);
      onCerrar();
    };

  const contenido = (
    <>
      <button
        type="button"
        onClick={abrirInicio}
        className="mb-8 cursor-pointer px-2 text-left"
      >
        <span
          style={{
            fontSize: "1rem",
            lineHeight: 1.2,
          }}
          className="block font-black uppercase italic tracking-tighter text-(--accent)"
        >
          CanonScore
        </span>
      </button>

      <nav className="flex grow flex-col gap-1">
        <span className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Categorías
        </span>

        {categorias.map(
          (categoria) => {
            const valorReal =
              CATEGORIAS_MAP[
                categoria
              ];

            const activo =
              categoriaActiva ===
              valorReal;

            return (
              <button
                key={categoria}
                type="button"
                onClick={() =>
                  seleccionarCategoria(
                    valorReal,
                  )
                }
                className={`rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide transition-all ${
                  activo
                    ? "bg-(--accent)/15 text-(--accent)"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {categoria}
              </button>
            );
          },
        )}

        <span className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Tu biblioteca
        </span>

        <button
          type="button"
          onClick={abrirListas}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>

          Mis Listas y Favoritos
        </button>

        {esAdmin && (
          <>
            <span className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Administración
            </span>

            <button
              type="button"
              onClick={
                abrirAdministracion
              }
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M5 7h14M5 7a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2M5 7l1.5 12.5a2 2 0 002 1.5h7a2 2 0 002-1.5L19 7"
                />
              </svg>

              Panel de Administración
            </button>
          </>
        )}
      </nav>

      <div className="mt-auto border-t border-white/5 pt-6">
        {usuario ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={abrirPerfil}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--accent)/20 bg-(--accent)/10 text-(--accent)">
                {perfil?.pfp ? (
                  <img
                    src={perfil.pfp}
                    alt={
                      perfil.username ||
                      "Perfil"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>

              <span className="truncate text-sm font-bold text-white">
                {perfil?.username ||
                  "Mi perfil"}
              </span>
            </button>

            <button
              type="button"
              onClick={
                handleCerrarSesion
              }
              className="rounded-xl px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-rose-400 transition-all hover:bg-rose-500/10"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onAbrirLogin();
              onCerrar();
            }}
            className="w-full rounded-xl bg-(--accent) px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col overflow-y-auto border-r border-white/5 bg-zinc-950 p-6 lg:flex">
        {contenido}
      </aside>

      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 lg:hidden"
            style={{
              zIndex: 1000,
              isolation:
                "isolate",
            }}
          >
            <button
              type="button"
              onClick={onCerrar}
              className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
              aria-label="Cerrar menú"
            />

            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-y-auto border-r border-white/10 bg-zinc-950 p-6 shadow-2xl">
              <button
                type="button"
                onClick={onCerrar}
                className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white"
                aria-label="Cerrar menú"
              >
                ✕
              </button>

              {contenido}
            </aside>
          </div>,
          document.body,
        )}

      {mostrarAdmin && (
        <AdminPanelModal
          onCerrar={() =>
            setMostrarAdmin(false)
          }
        />
      )}
    </>
  );
};

export default Sidebar;