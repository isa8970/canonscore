import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS_MAP } from '../constants/categorias';

const Sidebar = ({
  categoriaActiva,
  setCategoriaActiva,
  volverAInicio,
  irAPerfil,
  irAListas,
  abierto,
  onCerrar,
  onAbrirLogin,
}) => {
  const { usuario, perfil, cerrarSesion } = useAuth();
  const categorias = Object.keys(CATEGORIAS_MAP);

  const seleccionarCategoria = (valorReal) => {
    volverAInicio();
    setCategoriaActiva(valorReal);
    onCerrar(); // cierra el drawer en móvil después de elegir
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    onCerrar();
    volverAInicio();
  };

  // Contenido compartido entre la versión de escritorio (fija) y la de móvil (drawer)
  const contenido = (
    <>
      {/* Logo */}
      <div
        onClick={() => { volverAInicio(); setCategoriaActiva('Todas'); onCerrar(); }}
        className="cursor-pointer mb-8 px-2"
      >
        <span
          style={{ fontSize: '1rem', lineHeight: 1.2 }}
          className="block font-black tracking-tighter text-[var(--accent)] uppercase italic"
        >
          CanonScore
        </span>
      </div>

      {/* Categorías */}
      <nav className="flex flex-col gap-1 flex-grow">
        <span className="px-2 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Categorías
        </span>
        {categorias.map((cat) => {
          const valorReal = CATEGORIAS_MAP[cat];
          const activo = categoriaActiva === valorReal;
          return (
            <button
              key={cat}
              onClick={() => seleccionarCategoria(valorReal)}
              className={`text-left px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${
                activo
                  ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}

        {/* Listas y favoritos */}
        <span className="px-2 mt-6 mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
          Tu biblioteca
        </span>
        <button
          onClick={() => { irAListas(); onCerrar(); }}
          className="text-left px-3 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide text-zinc-400 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Mis Listas y Favoritos
        </button>
      </nav>

      {/* Sesión */}
      <div className="mt-auto pt-6 border-t border-white/5">
        {usuario ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { irAPerfil(); onCerrar(); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white truncate">{perfil?.username || 'Mi perfil'}</span>
            </button>
            <button
              onClick={handleCerrarSesion}
              className="px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-all text-left"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={() => { onAbrirLogin(); onCerrar(); }}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Versión de escritorio: fija, siempre visible */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-zinc-950 border-r border-white/5 p-6 z-40">
        {contenido}
      </aside>

      {/* Versión móvil: drawer que colapsa, montado con portal para evitar el bug de backdrop-blur */}
      {abierto && createPortal(
        <div className="fixed inset-0 z-[110] lg:hidden">
          {/* Fondo oscuro */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCerrar}
          />
          {/* Panel deslizante */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-zinc-950 border-r border-white/10 p-6 flex flex-col shadow-2xl">
            <button
              onClick={onCerrar}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
            {contenido}
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;