import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import LoginForm from './LoginForm';
import RegistroForm from './RegistroForm';

const AuthModal = ({ onCerrar }) => {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-black uppercase tracking-widest mb-6 text-[var(--accent)]">
          {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        {modo === 'login' ? (
          <LoginForm onExito={onCerrar} />
        ) : (
          <RegistroForm onExito={onCerrar} />
        )}

        <p className="text-xs text-zinc-500 mt-6 text-center">
          {modo === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button
            onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
            className="text-[var(--accent)] font-bold hover:underline"
          >
            {modo === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;