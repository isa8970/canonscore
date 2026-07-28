import React, { useState } from "react";

import AuthModal from "./AuthModal";
import Sidebar from "./Sidebar";
import FiltrosModal from "./FiltrosModal";
import NotificacionesReportes from "./NotificacionesReportes";

import { useAuth } from "../context/AuthContext";

const Nav = ({
  setCategoriaActiva,
  setTerminoBusqueda,
  terminoBusqueda = "",
  volverAInicio,
  categoriaActiva,
  irAPerfil,
  irAListas,
  generosDisponibles = [],
  filtros = {
    generos: [],
    orden: "catalogo",
  },
  onAplicarFiltros = () => {},
}) => {
  const [mostrarLogin, setMostrarLogin] =
    useState(false);

  const [sidebarAbierto, setSidebarAbierto] =
    useState(false);

  const [mostrarFiltros, setMostrarFiltros] =
    useState(false);

  const { usuario, perfil } = useAuth();

  const generosActivos =
    Array.isArray(filtros?.generos)
      ? filtros.generos
      : [];

  const cantidadFiltrosActivos =
    generosActivos.length +
    (filtros?.orden === "recomendacion"
      ? 1
      : 0);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 py-1 backdrop-blur-md">
        <div className="mx-auto flex max-w-350 items-center justify-between gap-4 px-4 md:px-12">
          {/* MENÚ Y LOGO EN MÓVIL */}

          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() =>
                setSidebarAbierto(true)
              }
              className="rounded-xl p-2 text-(--text) transition-all hover:bg-white/5"
              aria-label="Abrir menú"
            >
              <svg
                className="h-6 w-6"
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
              className="cursor-pointer text-lg font-black uppercase italic tracking-tighter text-(--accent)"
            >
              CanonScore
            </h1>
          </div>

          {/* FILTROS, BUSCADOR Y NOTIFICACIONES */}

          <div className="flex grow items-center justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setMostrarFiltros(true)
              }
              className={`relative flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-wider transition-all ${
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

              <span className="hidden sm:inline">
                Filtros
              </span>

              {cantidadFiltrosActivos > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--accent) px-1 text-[10px] font-black text-white">
                  {cantidadFiltrosActivos}
                </span>
              )}
            </button>

            <div className="relative hidden w-full max-w-sm md:block">
              <input
                type="text"
                value={terminoBusqueda}
                placeholder="Buscar películas, series, libros..."
                onChange={(event) => {
                  volverAInicio();

                  setTerminoBusqueda(
                    event.target.value,
                  );
                }}
                className="w-full rounded-full border border-white/5 bg-zinc-900 py-2 pl-11 pr-4 text-xs text-(--text) placeholder:text-(--text) placeholder:opacity-30 transition-all focus:border-(--accent)/50 focus:outline-none focus:ring-1 focus:ring-(--accent)/50"
              />

              <svg
                className="absolute left-4 top-2.5 h-4 w-4 text-(--text) opacity-30"
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

            {/* Solo aparece para administradores */}

            <NotificacionesReportes />

            {/* PERFIL O LOGIN EN MÓVIL */}

            <div className="lg:hidden">
              {usuario ? (
                <button
                  type="button"
                  onClick={irAPerfil}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-(--accent)/20 bg-(--accent)/10 text-(--accent) transition-all hover:bg-(--accent)/20"
                  title={
                    perfil?.username ||
                    "Mi perfil"
                  }
                >
                  <svg
                    className="h-5 w-5"
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
                  type="button"
                  onClick={() =>
                    setMostrarLogin(true)
                  }
                  className="rounded-full bg-(--accent) px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                >
                  Entrar
                </button>
              )}
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
        onCerrar={() =>
          setSidebarAbierto(false)
        }
        onAbrirLogin={() =>
          setMostrarLogin(true)
        }
      />

      {mostrarLogin && (
        <AuthModal
          onCerrar={() =>
            setMostrarLogin(false)
          }
        />
      )}

      {mostrarFiltros && (
        <FiltrosModal
          generosDisponibles={
            generosDisponibles || []
          }
          filtrosActuales={
            filtros || {
              generos: [],
              orden: "catalogo",
            }
          }
          onAplicar={(nuevosFiltros) => {
            volverAInicio();

            onAplicarFiltros(
              nuevosFiltros,
            );
          }}
          onCerrar={() =>
            setMostrarFiltros(false)
          }
        />
      )}
    </>
  );
};

export default Nav;