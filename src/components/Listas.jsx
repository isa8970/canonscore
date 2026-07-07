import React from 'react';
import { useAuth } from '../context/AuthContext';

const Listas = ({ onVolver }) => {
  const { esInvitado } = useAuth();

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <button
          onClick={onVolver}
          className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>

        <h2 className="text-3xl font-black tracking-tight mt-8 mb-2">Mis Listas y Favoritos</h2>

        {esInvitado ? (
          <p className="text-zinc-400 text-sm mt-4">
            Como invitado, tus favoritos se guardan solo en este dispositivo. Inicia sesión para
            sincronizarlos y crear listas personalizadas.
          </p>
        ) : (
          <p className="text-zinc-400 text-sm mt-4">
            Aquí vivirán tus listas (como "Favoritos") una vez que conectemos esta vista a las
            tablas <code className="text-[var(--accent)]">listas</code> y{' '}
            <code className="text-[var(--accent)]">lista_items</code>.
          </p>
        )}
      </div>
    </div>
  );
};

export default Listas;