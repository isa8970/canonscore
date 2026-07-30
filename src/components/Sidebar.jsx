import React, { useEffect, useState } from "react";
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
  abierto,
  onCerrar,
  onAbrirLogin,
  tema = "dark",
  onCambiarTema,
}) => {
  const { usuario, perfil, cerrarSesion, esAdmin } = useAuth();
  const categorias = Object.keys(CATEGORIAS_MAP);
  const [mostrarAdmin, setMostrarAdmin] = useState(false);
  const [avatarFallido, setAvatarFallido] = useState(false);

  useEffect(() => {
    setAvatarFallido(false);
  }, [perfil?.pfp]);

  const seleccionarCategoria = (valorReal) => {
    volverAInicio();
    setCategoriaActiva(valorReal);
    onCerrar();
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    onCerrar();
    volverAInicio();
  };

  const esTemaClaro = tema === "light";

  const contenido = (
    <>
      <button
        type="button"
        onClick={() => {
          volverAInicio();
          setCategoriaActiva("Todas");
          onCerrar();
        }}
        className="mb-8 px-2 text-left"
        aria-label="Ir al inicio de CanonScore"
      >
        <span
          style={{ fontSize: "1rem", lineHeight: 1.2 }}
          className="block font-black uppercase italic tracking-tighter text-(--accent)"
        >
          CanonScore
        </span>
      </button>

      <nav className="flex grow flex-col gap-1">
        <span className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">
          Categorías
        </span>

        {categorias.map((cat) => {
          const valorReal = CATEGORIAS_MAP[cat];
          const activo = categoriaActiva === valorReal;

          return (
            <button
              type="button"
              key={cat}
              onClick={() => seleccionarCategoria(valorReal)}
              className={`rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide transition-all ${
                activo
                  ? "bg-(--accent)/15 text-(--accent)"
                  : "text-(--color-text-secondary) hover:bg-(--color-surface-soft) hover:text-(--color-text)"
              }`}
            >
              {cat}
            </button>
          );
        })}

        <span className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">
          Tu biblioteca
        </span>

        <button
          type="button"
          onClick={() => {
            irAListas();
            onCerrar();
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-(--color-text-secondary) transition-all hover:bg-(--color-surface-soft) hover:text-(--color-text)"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Mis listas y favoritos
        </button>

        {esAdmin && (
          <>
            <span className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">
              Administración
            </span>

            <button
              type="button"
              onClick={() => {
                setMostrarAdmin(true);
                onCerrar();
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-(--color-text-secondary) transition-all hover:bg-(--color-surface-soft) hover:text-(--color-text)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M5 7h14M5 7a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2M5 7l1.5 12.5a2 2 0 002 1.5h7a2 2 0 002-1.5L19 7" />
              </svg>
              Panel de administración
            </button>
          </>
        )}
      </nav>

      <div className="mt-6 border-t border-(--color-border) pt-5">
        <span className="mb-2 block px-2 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">
          Apariencia
        </span>

        <button
          type="button"
          onClick={onCambiarTema}
          aria-pressed={esTemaClaro}
          className="flex w-full items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface-soft) px-3 py-3 text-left transition-all hover:border-(--accent)/35 hover:bg-(--accent)/10"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--accent)/10 text-(--accent)">
            {esTemaClaro ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.598.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364-6.364l-1.061 1.061M6.697 17.303l-1.061 1.061m12.728 0l-1.061-1.061M6.697 6.697L5.636 5.636M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            )}
          </span>

          <span className="min-w-0 grow">
            <span className="block text-sm font-bold text-(--color-text)">
              {esTemaClaro ? "Tema claro" : "Tema oscuro"}
            </span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-(--color-text-muted)">
              Cambiar a {esTemaClaro ? "oscuro" : "claro"}
            </span>
          </span>

          <span
            aria-hidden="true"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              esTemaClaro ? "bg-(--accent)" : "bg-(--color-border-strong)"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                esTemaClaro ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </div>

      <div className="mt-5 border-t border-(--color-border) pt-5">
        {usuario ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                irAPerfil();
                onCerrar();
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-(--color-surface-soft)"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--accent)/25 bg-(--accent)/10 text-(--accent)">
                {perfil?.pfp && !avatarFallido ? (
                  <img
                    src={perfil.pfp}
                    alt={perfil?.username || "Foto de perfil"}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFallido(true)}
                  />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <span className="truncate text-sm font-bold text-(--color-text)">
                {perfil?.username || "Mi perfil"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCerrarSesion}
              className="rounded-xl px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-rose-500 transition-all hover:bg-rose-500/10"
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
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col overflow-y-auto border-r border-(--color-border) bg-(--color-sidebar) p-6 lg:flex">
        {contenido}
      </aside>

      {abierto &&
        createPortal(
          <div className="fixed inset-0 z-110 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onCerrar}
            />

            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-y-auto border-r border-(--color-border) bg-(--color-sidebar) p-6 shadow-2xl">
              <button
                type="button"
                onClick={onCerrar}
                className="absolute right-4 top-4 text-(--color-text-muted) transition-colors hover:text-(--color-text)"
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
        <AdminPanelModal onCerrar={() => setMostrarAdmin(false)} />
      )}
    </>
  );
};

export default Sidebar;