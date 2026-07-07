import React, { useState, useEffect } from 'react';
import Nav from './components/nav';
import Banner from './components/banner';
import Tarjeta from './components/Tarjeta';
import Detalle from './components/Detalle';
import Perfil from './components/Perfil';
import Listas from './components/Listas';
import { supabase } from './config/supabaseClient';
import { CATEGORIAS_DISPLAY } from './constants/categorias';
// Ahora cargamos los datos desde Supabase en tiempo de ejecución.

function App() {
  //Estados para el filtrado y búsqueda
  // categoriaActiva guarda el valor REAL del enum ('pelicula', 'serie', etc.) o 'Todas'
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  // Estados para datos remotos
  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para la navegación de vistas
  const [vista, setVista] = useState('inicio'); // 'inicio' | 'detalle' | 'perfil'
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  // Efecto para cargar datos desde Supabase (.from('libreria').select('*'))
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const { data, error: fetchError } = await supabase.from('libreria').select('*');
        if (fetchError) throw fetchError;

        const mapped = (data || []).map((item) => ({
          ...item,
          imagen: item.cover,
          imagenBanner: item.banner,
          descripcion: item.sinopsis,
          anio: item.anio_pub,
          genero: Array.isArray(item.generos) ? item.generos.join(', ') : item.generos,
        }));

        if (mounted) {
          setMediaData(mapped);
          setError(null);
        }
      } catch (err) {
        console.error('Error cargando libreria desde Supabase:', err);
        if (mounted) {
          setError(err.message || String(err));
          setMediaData([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Lógica de filtrado combinada (Categoría + Búsqueda)
  // item.tipo ya viene directo del enum de Supabase ('pelicula', 'serie', 'comic', 'libro', 'anime')
  // y categoriaActiva guarda ese mismo valor, así que comparamos directo sin traducir nada.
  const datosFiltrados = mediaData.filter((item) => {
    const tituloValue = String(item.titulo || '').toLowerCase();

    const coincideCategoria =
      categoriaActiva === 'Todas' ||
      item.tipo === categoriaActiva;

    const coincideBusqueda = tituloValue.includes(terminoBusqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  // Función para seleccionar una obra e ir al detalle
  const mostrarDetalle = (item) => {
    setItemSeleccionado(item);
    setVista('detalle');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube al inicio de la página
  };

  // Volver a la página de inicio
  const volverAInicio = () => {
    setVista('inicio');
    setItemSeleccionado(null);
  };

  // Ir a la vista de perfil del usuario logueado
  const irAPerfil = () => {
    setVista('perfil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ir a la vista de listas y favoritos del usuario
  const irAListas = () => {
    setVista('listas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obtener un item para el Banner (por ejemplo, el primero de la lista filtrada o uno fijo)
  let itemBanner = null;
  if (categoriaActiva !== 'Todas' && datosFiltrados.length > 0) {
    itemBanner = datosFiltrados[0];
  } else {
    const impactFieldCandidates = ['popularity','views','interactions','score'];
    let best = null;
    let bestScore = -Infinity;
    for (const it of mediaData) {
      let sc = 0;
      for (const f of impactFieldCandidates) {
        if (it[f]) { sc = Number(it[f]) || sc; break; }
      }
      if (sc > bestScore) {
        bestScore = sc;
        best = it;
      }
    }
    itemBanner = best || mediaData[0] || null;
  }

  // Agrupar por género (tomamos el primer género si hay varios separados por ',')
  const itemsToGroup = datosFiltrados;
  const genresMap = itemsToGroup.reduce((acc, it) => {
    const generoField = it.genero || (Array.isArray(it.generos) ? it.generos.join(', ') : it.generos) || 'Otros';
    const primary = String(generoField).split(',')[0].trim() || 'Otros';
    if (!acc[primary]) acc[primary] = [];
    acc[primary].push(it);
    return acc;
  }, {});

  return (
    <div className="w-full min-h-screen m-0 p-0 bg-neutral-950 selection:bg-[var(--accent)] selection:text-white text-[var(--text)] lg:pl-64">
      <Nav 
        setCategoriaActiva={setCategoriaActiva} 
        setTerminoBusqueda={setTerminoBusqueda}
        terminoBusqueda={terminoBusqueda}
        volverAInicio={volverAInicio}
        categoriaActiva={categoriaActiva}
        irAPerfil={irAPerfil}
        irAListas={irAListas}
      />

      {vista === 'inicio' && (
        <>
          <div className="pt-6"> 
            {itemBanner && (
              <Banner item={itemBanner} onVerDetalles={() => mostrarDetalle(itemBanner)} />
            )}
          </div>

          {error && (
            <div className="pt-6">
              <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">
                Error cargando datos: {error}
              </div>
            </div>
          )}

          <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-12"> 
            <h2 className="text-xl font-black tracking-widest uppercase mb-6 text-left border-l-4 border-[var(--accent)] pl-3">
              {categoriaActiva === 'Todas' ? 'Catálogo por Géneros' : (CATEGORIAS_DISPLAY[categoriaActiva] || categoriaActiva)}
            </h2>

            {loading ? (
              <p className="text-center text-zinc-500 py-12">Cargando catálogo...</p>
            ) : Object.keys(genresMap).length === 0 ? (
              <p className="text-center text-zinc-500 py-12">Parece que esa obra aún no entra en el Canon.</p>
            ) : (
              Object.entries(genresMap).map(([genre, items]) => (
                <section key={genre} className="mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-lg font-black uppercase tracking-widest text-[var(--text)]">{genre}</h3>
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-[var(--accent)]/30 to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {items.map((item) => (
                      <div key={item.id} onClick={() => mostrarDetalle(item)} className="cursor-pointer">
                        <Tarjeta item={item} />
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>
        </>
      )}

      {vista === 'detalle' && (
        <div>
          <Detalle item={itemSeleccionado} onVolver={volverAInicio} />
        </div>
      )}

      {vista === 'perfil' && (
        <div>
          <Perfil onVolver={volverAInicio} />
        </div>
      )}

      {vista === 'listas' && (
        <div>
          <Listas onVolver={volverAInicio} />
        </div>
      )}
    </div>
  );
}

export default App;