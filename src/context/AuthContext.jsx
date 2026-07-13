import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) console.error('Error cargando perfil:', error);
    setPerfil(data || null);
    setCargando(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user.id);
      else setCargando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
      if (session?.user) cargarPerfil(session.user.id);
      else {
        setPerfil(null);
        setCargando(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  // Vuelve a traer el perfil desde Supabase, útil después de editar username/pfp/bio
  // sin tener que cerrar sesión y volver a entrar para ver los cambios reflejados.
  const refrescarPerfil = async () => {
    if (usuario) await cargarPerfil(usuario.id);
  };

  const esAdmin = perfil?.rol === 'administrador';
  const esInvitado = !usuario;

  return (
    <AuthContext.Provider
      value={{ usuario, perfil, esAdmin, esInvitado, cargando, cerrarSesion, refrescarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);