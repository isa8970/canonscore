import React, { useState } from 'react';
import AuthModal from './AuthModal';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Nav = ({
  setCategoriaActiva,
  setTerminoBusqueda,
  volverAInicio,
  categoriaActiva,
  irAPerfil,
  irAListas,
}) => {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const { usuario, perfil } = useAuth();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 py-1">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex items-center justify-between gap-4">

          {/* Botón de menú (solo móvil) + Logo (solo móvil, ya que en desktop el logo vive en el Sidebar) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarAbierto(true)}
              className="p-2 rounded-xl text-[var(--text)] hover:bg-white/5 transition-all"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1
              onClick={() => { volverAInicio(); setCategoriaActiva('Todas'); }}
              className="text-lg font-black tracking-tighter text-[var(--accent)] uppercase italic cursor-pointer"
            >
              CanonScore
            </h1>
          </div>

          {/* Búsqueda */}
          <div className="flex items-center flex-grow justify-end gap-5">
            <div className="relative w-full max-w-sm hidden md:block">
              <input
                type="text"
                placeholder="Buscar películas, series, libros..."
                onChange={(e) => {
                  volverAInicio();
                  setTerminoBusqueda(e.target.value);
                }}
                className="w-full bg-zinc-900 border border-white/5 rounded-full py-1.5 px-11 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 transition-all placeholder:text-[var(--text)] placeholder:opacity-30"
              />
              <svg
                className="absolute left-4 top-2 h-4 w-4 text-[var(--text)] opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Botones de notificación y perfil */}
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full text-[var(--text)] opacity-60 hover:opacity-100 hover:bg-white/5 transition-all relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent)] rounded-full border-2 border-zinc-950"></span>
              </button>

              {/* Solo en móvil: en desktop el acceso a perfil/login ya vive en el Sidebar */}
              <div className="lg:hidden">
                {usuario ? (
                  <button
                    onClick={irAPerfil}
                    className="w-9 h-9 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-all"
                    title={perfil?.username || 'Mi perfil'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setMostrarLogin(true)}
                    className="px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
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
    </>
  );
};

export default Nav;