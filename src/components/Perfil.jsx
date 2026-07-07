import React from 'react';
import { useAuth } from '../context/AuthContext';

const Perfil = ({ onVolver }) => {
  const { usuario, perfil, cerrarSesion } = useAuth();

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    onVolver(); // regresa al inicio después de cerrar sesión
  };

  if (!usuario) return null; // seguridad extra: si por alguna razón no hay sesión, no renderiza nada

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white pb-24">
      {/* Botón Volver */}
      <div className="max-w-[900px] mx-auto px-6 pt-8">
        <button
          onClick={onVolver}
          className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
      </div>

      {/* Tarjeta de perfil */}
      <div className="max-w-[900px] mx-auto px-6 mt-10">
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5 overflow-hidden">
            {perfil?.pfp ? (
              <img src={perfil.pfp} alt={perfil.username} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-1">{perfil?.username || 'Usuario'}</h2>

          <span className="px-3 py-1 rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-6">
            {perfil?.rol === 'administrador' ? 'Administrador' : 'Usuario registrado'}
          </span>

          {perfil?.bio && (
            <p className="text-sm text-zinc-400 max-w-md mb-6">{perfil.bio}</p>
          )}

          <p className="text-xs text-zinc-600 mb-8">{usuario.email}</p>

          <button
            onClick={handleCerrarSesion}
            className="px-8 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold uppercase tracking-wider text-xs hover:bg-rose-500/20 transition-all"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Perfil;