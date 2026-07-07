import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';

const RegistroForm = ({ onExito }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setCargando(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    onExito?.(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-[var(--accent)]/50"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-[var(--accent)]/50"
      />

      {error && <p className="text-rose-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="px-6 py-3 rounded-xl bg-[var(--accent)] text-white font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all disabled:opacity-50"
      >
        {cargando ? 'Creando cuenta...' : 'Registrarse'}
      </button>
    </form>
  );
};

export default RegistroForm;