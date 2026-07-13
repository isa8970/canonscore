import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS_MAP } from '../constants/categorias';

const ANIO_MINIMO = 1888; // año de la primera película registrada en la historia
const ANIO_MAXIMO = new Date().getFullYear() + 5; // permite anunciar próximos estrenos
const MAX_TITULO = 150;
const MAX_SINOPSIS = 1000;

const FORM_VACIO = {
  titulo: '',
  tipo: 'pelicula',
  anio_pub: '',
  sinopsis: '',
  cover: '',
  banner: '',
  trailer: '',
  generos: '', // texto separado por comas, se convierte a array al guardar
};

// Opciones de tipo para el <select>, tomadas del mismo mapa que usa el resto de la app
const TIPOS_OPCIONES = Object.entries(CATEGORIAS_MAP).filter(([label]) => label !== 'Todas');

const AdminPanelModal = ({ onCerrar }) => {
  const { esAdmin } = useAuth();

  const [vista, setVista] = useState('lista'); // 'lista' | 'form'
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [itemEditando, setItemEditando] = useState(null); // null = creando nuevo
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCatalogo = async () => {
    setCargando(true);
    const { data, error: fetchError } = await supabase
      .from('libreria')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error cargando el catálogo:', fetchError);
      setCatalogo([]);
    } else {
      setCatalogo(data || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  if (!esAdmin) return null; // seguridad extra: solo administradores

  const abrirNuevo = () => {
    setItemEditando(null);
    setForm(FORM_VACIO);
    setError(null);
    setVista('form');
  };

  const abrirEdicion = (item) => {
    setItemEditando(item);
    setForm({
      titulo: item.titulo || '',
      tipo: item.tipo || 'pelicula',
      anio_pub: item.anio_pub || '',
      sinopsis: item.sinopsis || '',
      cover: item.cover || '',
      banner: item.banner || '',
      trailer: item.trailer || '',
      generos: Array.isArray(item.generos) ? item.generos.join(', ') : '',
    });
    setError(null);
    setVista('form');
  };

  const eliminar = async (item) => {
    const confirmado = window.confirm(`¿Eliminar "${item.titulo}" del catálogo? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    const { error: deleteError } = await supabase.from('libreria').delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error eliminando título:', deleteError);
      alert('No se pudo eliminar el título.');
      return;
    }
    cargarCatalogo();
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);

    const anio = form.anio_pub ? Number(form.anio_pub) : null;
    if (anio !== null && (anio < ANIO_MINIMO || anio > ANIO_MAXIMO)) {
      setError(`El año debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`);
      return;
    }

    if (!form.cover.trim()) {
      setError('La portada (cover) es obligatoria para publicar un título.');
      return;
    }

    const generosLimpios = form.generos
      ? [...new Set(form.generos.split(',').map((g) => g.trim()).filter(Boolean))]
      : [];

    if (generosLimpios.length === 0) {
      setError('Agrega al menos un género.');
      return;
    }

    setGuardando(true);

    const payload = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      anio_pub: anio,
      sinopsis: form.sinopsis.trim() || null,
      cover: form.cover.trim(),
      banner: form.banner.trim() || null,
      trailer: form.trailer.trim() || null,
      generos: generosLimpios,
    };

    const { error: guardarError } = itemEditando
      ? await supabase.from('libreria').update(payload).eq('id', itemEditando.id)
      : await supabase.from('libreria').insert(payload);

    setGuardando(false);

    if (guardarError) {
      console.error('Error guardando título:', guardarError);
      setError('No se pudo guardar. Revisa los campos e intenta de nuevo.');
      return;
    }

    await cargarCatalogo();
    setVista('lista');
  };

  const catalogoFiltrado = catalogo.filter((item) =>
    item.titulo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-black uppercase tracking-widest text-(--accent)">
            {vista === 'lista' ? 'Panel de Administración' : itemEditando ? 'Editar título' : 'Nuevo título'}
          </h2>
          <button onClick={onCerrar} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="overflow-y-auto p-6 grow">

          {vista === 'lista' ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en el catálogo..."
                  className="grow bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
                />
                <button
                  onClick={abrirNuevo}
                  className="px-4 py-2.5 rounded-xl bg-(--accent) text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all whitespace-nowrap"
                >
                  + Nuevo título
                </button>
              </div>

              {cargando ? (
                <p className="text-sm text-zinc-500">Cargando catálogo...</p>
              ) : catalogoFiltrado.length === 0 ? (
                <p className="text-sm text-zinc-500">No se encontraron títulos.</p>
              ) : (
                <div className="space-y-2">
                  {catalogoFiltrado.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 bg-zinc-900/40 border border-white/5 rounded-xl p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.titulo}</p>
                        <p className="text-xs text-zinc-500 uppercase">{item.tipo} · {item.anio_pub || 's/f'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => abrirEdicion(item)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase text-white hover:bg-white/10 transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminar(item)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-bold uppercase text-rose-400 hover:bg-rose-500/20 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setVista('lista')}
                className="self-start text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white mb-2"
              >
                ← Volver a la lista
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Título</label>
                  <input
                    type="text"
                    required
                    maxLength={MAX_TITULO}
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50"
                  >
                    {TIPOS_OPCIONES.map(([label, valor]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Año</label>
                  <input
                    type="number"
                    min={ANIO_MINIMO}
                    max={ANIO_MAXIMO}
                    value={form.anio_pub}
                    onChange={(e) => setForm({ ...form, anio_pub: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Géneros, separados por coma *</label>
                  <input
                    type="text"
                    placeholder="Acción, Sci-Fi, Drama"
                    value={form.generos}
                    onChange={(e) => setForm({ ...form, generos: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Sinopsis</label>
                <textarea
                  rows="3"
                  maxLength={MAX_SINOPSIS}
                  value={form.sinopsis}
                  onChange={(e) => setForm({ ...form, sinopsis: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">URL portada (cover) *</label>
                  <input
                    type="url"
                    required
                    value={form.cover}
                    onChange={(e) => setForm({ ...form, cover: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">URL banner</label>
                  <input
                    type="url"
                    value={form.banner}
                    onChange={(e) => setForm({ ...form, banner: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">URL tráiler</label>
                  <input
                    type="url"
                    value={form.trailer}
                    onChange={(e) => setForm({ ...form, trailer: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-base text-white focus:outline-none focus:border-(--accent)/50 placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {error && <p className="text-rose-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={guardando}
                className="mt-2 px-6 py-3 rounded-xl bg-(--accent) text-white font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all disabled:opacity-50 self-start"
              >
                {guardando ? 'Guardando...' : itemEditando ? 'Guardar cambios' : 'Publicar título'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminPanelModal;