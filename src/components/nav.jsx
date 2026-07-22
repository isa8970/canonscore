import React, { useState } from "react";
import AuthModal from "./AuthModal";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import FiltrosModal from "./FiltrosModal";

const Nav = ({
  setCategoriaActiva,
  setTerminoBusqueda,
  terminoBusqueda,
  volverAInicio,
  categoriaActiva,
  irAPerfil,
  irAListas,
  generosDisponibles,
  filtros,
  onAplicarFiltros,
}) => {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const cantidadFiltrosActivos =
    filtros.generos.length + (filtros.orden === "recomendacion" ? 1 : 0);
  const { usuario, perfil } = useAuth();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 py-1">
        <div className="max-w-350 mx-auto px-4 md:px-12 flex items-center justify-between gap-4">
          {/* Botón de menú (solo móvil) + Logo (solo móvil, ya que en desktop el logo vive en el Sidebar) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarAbierto(true)}
              className="p-2 rounded-xl text-(--text) hover:bg-white/5 transition-all"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1
              onClick={() => {
                volverAInicio();
                setCategoriaActiva("Todas");
              }}
              className="text-lg font-black tracking-tighter text-(--accent) uppercase italic cursor-pointer"
            >
              CanonScore
            </h1>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex items-center grow justify-end gap-3">
            {/* Botón de filtros */}
            <button
              type="button"
              onClick={() => setMostrarFiltros(true)}
              className={`relative flex h-7 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-wider transition-all ${
                cantidadFiltrosActivos > 0
                  ? "border-(--accent)/40 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
              aria-label="Abrir filtros"
            >
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
                  d="M3 4h18M6 10h12M10 16h4"
                />
              </svg>

              <span className="hidden sm:inline">Filtros</span>

              {cantidadFiltrosActivos > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--accent) px-1 text-[10px] font-black text-white">
                  {cantidadFiltrosActivos}
                </span>
              )}
            </button>

            {/* Buscador */}
            <div className="relative hidden w-full max-w-sm md:block">
              <input
                type="text"
                value={terminoBusqueda}
                placeholder="Buscar películas, series, libros..."
                onChange={(event) => {
                  volverAInicio();
                  setTerminoBusqueda(event.target.value);
                }}
                className="w-full rounded-full border border-white/5 bg-zinc-900 py-1.5 pl-11 pr-4 text-xs text-(--text) placeholder:text-(--text) placeholder:opacity-30 transition-all focus:border-(--accent)/50 focus:outline-none focus:ring-1 focus:ring-(--accent)/50"
              />

              <svg
                className="absolute left-4 top-2 h-4 w-4 text-(--text) opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            {/* Botones de notificación y perfil */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full text-(--text) opacity-60 hover:opacity-100 hover:bg-white/5 transition-all relative">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-(--accent) rounded-full border-2 border-zinc-950"></span>
              </button>

              {/* Solo en móvil: en desktop el acceso a perfil/login ya vive en el Sidebar */}
              <div className="lg:hidden">
                {usuario ? (
                  <button
                    onClick={irAPerfil}
                    className="w-9 h-9 rounded-full bg-(--accent)/10 border border-(--accent)/20 flex items-center justify-center text-(--accent) hover:bg-(--accent)/20 transition-all"
                    title={perfil?.username || "Mi perfil"}
                  >
                    <svg
                      className="w-5 h-5"
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
                  </button>
                ) : (
                  <button
                    onClick={() => setMostrarLogin(true)}
                    className="px-4 py-1.5 rounded-full bg-(--accent) text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
                  >
                    Entrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar
        categoriaActiva={categoriaActiva}
        setCategoriaActiva={setCategoriaActiva}
        volverAInicio={volverAInicio}
        irAPerfil={irAPerfil}
        irAListas={irAListas}
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
        onAbrirLogin={() => setMostrarLogin(true)}
      />

      {mostrarLogin && <AuthModal onCerrar={() => setMostrarLogin(false)} />}

      {mostrarFiltros && (
        <FiltrosModal
          generosDisponibles={generosDisponibles}
          filtrosActuales={filtros}
          onAplicar={(nuevosFiltros) => {
            volverAInicio();
            onAplicarFiltros(nuevosFiltros);
          }}
          onCerrar={() => setMostrarFiltros(false)}
        />
      )}
    </>
  );
};

export default Nav;
