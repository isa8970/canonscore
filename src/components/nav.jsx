import React, { useState } from "react";
import AuthModal from "./AuthModal";
import Sidebar from "./Sidebar";
import FiltrosModal from "./FiltrosModal";
import NotificacionesReportes from "./NotificacionesReportes";

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
  tema,
  onCambiarTema,
}) => {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const cantidadFiltrosActivos =
    (Array.isArray(filtros?.generos) ? filtros.generos.length : 0) +
    (filtros?.orden === "recomendacion" ? 1 : 0);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 w-full min-w-0 overflow-x-clip border-b border-(--color-border) bg-(--color-nav) shadow-(--shadow-nav) backdrop-blur-xl lg:left-64 lg:w-auto">
        <div className="mx-auto flex h-14 w-full max-w-350 min-w-0 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-8 xl:px-12">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarAbierto(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-(--color-text) transition-all hover:bg-(--color-surface-soft)"
              aria-label="Abrir menú"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
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

            <button
              type="button"
              onClick={() => {
                volverAInicio();
                setCategoriaActiva("Todas");
              }}
              className="min-w-0 truncate text-left text-base font-black uppercase italic tracking-tighter text-(--accent) sm:text-lg"
              aria-label="Ir al inicio"
            >
              CanonScore
            </button>
          </div>

          <div className="flex min-w-0 grow items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMostrarFiltros(true)}
              className={`relative flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider transition-all sm:text-xs ${
                cantidadFiltrosActivos > 0
                  ? "border-(--accent)/40 bg-(--accent)/15 text-(--accent)"
                  : "border-(--color-border) bg-(--color-input) text-(--color-text-secondary) hover:border-(--color-border-strong) hover:text-(--color-text)"
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

            <div className="relative hidden min-w-0 w-full max-w-sm md:block">
              <input
                type="text"
                value={terminoBusqueda}
                placeholder="Buscar películas, series, libros..."
                onChange={(event) => {
                  volverAInicio();
                  setTerminoBusqueda(event.target.value);
                }}
                className="w-full rounded-full border border-(--color-border) bg-(--color-input) py-2 pl-10 pr-4 text-xs text-(--color-text) placeholder:text-(--color-text-muted) transition-all focus:border-(--accent)/50 focus:outline-none focus:ring-1 focus:ring-(--accent)/35"
              />

              <svg
                className="absolute left-3.5 top-2.5 h-4 w-4 text-(--color-text-muted)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            <NotificacionesReportes />
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
        tema={tema}
        onCambiarTema={onCambiarTema}
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