import { useEffect, useMemo, useState } from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CATEGORIAS_MAP } from "../constants/categorias";
import {
  GENEROS_PERMITIDOS,
  MAX_GENEROS,
  normalizarGeneros,
  validarAnio,
  validarGeneros,
} from "../utils/validaciones";
import ModalPortal from "./ModalPortal";

const MAX_TITULO = 150;
const MAX_SINOPSIS = 1000;
const MAX_NOMBRE_ENLACE = 100;
const MAX_ENLACES = 10;

const FORM_VACIO = {
  titulo: "",
  tipo: "pelicula",
  anio_pub: "",
  sinopsis: "",
  cover: "",
  banner: "",
  generos: [],
};

const TIPOS_OPCIONES = Object.entries(CATEGORIAS_MAP).filter(
  ([nombre]) => nombre !== "Todas",
);

const GRUPOS_PLATAFORMAS = [
  { tipo: "streaming", etiqueta: "Streaming" },
  { tipo: "tienda", etiqueta: "Tiendas en línea" },
  {
    tipo: "oficial",
    etiqueta: "Sitios oficiales",
    nombresPermitidos: ["Sitio oficial"],
  },
];

const TIPOS_VISIBLES = new Set(["streaming", "tienda", "oficial", "otro"]);

const crearDisponibilidadVacia = () => ({
  id: null,
  localId: `enlace-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`,
  plataforma_id: "",
  nombre_personalizado: "",
  url_directo: "",
});

const esUrlValida = (valor) => {
  try {
    const url = new URL(String(valor).trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const AdminPanelModal = ({ onCerrar }) => {
  const { esAdmin } = useAuth();

  const [vista, setVista] = useState("lista");
  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [itemEditando, setItemEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [plataformas, setPlataformas] = useState([]);
  const [cargandoPlataformas, setCargandoPlataformas] = useState(true);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [cargandoDisponibilidades, setCargandoDisponibilidades] =
    useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargarCatalogo = async () => {
    setCargandoCatalogo(true);
    const { data, error: fetchError } = await supabase
      .from("libreria")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error cargando catálogo:", fetchError);
      setCatalogo([]);
    } else {
      setCatalogo(data || []);
    }
    setCargandoCatalogo(false);
  };

  const cargarPlataformas = async () => {
    setCargandoPlataformas(true);
    const { data, error: fetchError } = await supabase
      .from("plataformas")
      .select("id, nombre, tipo")
      .order("tipo", { ascending: true })
      .order("nombre", { ascending: true });

    if (fetchError) {
      console.error("Error cargando plataformas:", fetchError);
      setPlataformas([]);
      setError("No se pudieron cargar las plataformas.");
    } else {
      setPlataformas(data || []);
    }
    setCargandoPlataformas(false);
  };

  useEffect(() => {
    if (!esAdmin) return;
    cargarCatalogo();
    cargarPlataformas();
  }, [esAdmin]);

  const catalogoFiltrado = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return catalogo;
    return catalogo.filter((item) =>
      String(item.titulo || "").toLowerCase().includes(termino),
    );
  }, [busqueda, catalogo]);

  if (!esAdmin) return null;

  const limpiarFormulario = () => {
    setItemEditando(null);
    setForm(FORM_VACIO);
    setDisponibilidades([]);
    setCargandoDisponibilidades(false);
    setError(null);
  };

  const abrirNuevo = () => {
    limpiarFormulario();
    setMensaje(null);
    setVista("form");
  };

  const volverALista = () => {
    limpiarFormulario();
    setVista("lista");
  };

  const abrirEdicion = async (item) => {
    setItemEditando(item);
    setForm({
      titulo: item.titulo || "",
      tipo: item.tipo || "pelicula",
      anio_pub: item.anio_pub ?? "",
      sinopsis: item.sinopsis || "",
      cover: item.cover || "",
      banner: item.banner || "",
      generos: normalizarGeneros(item.generos || []),
    });
    setError(null);
    setMensaje(null);
    setDisponibilidades([]);
    setVista("form");
    setCargandoDisponibilidades(true);

    const { data, error: enlacesError } = await supabase
      .from("disponibilidad_streaming")
      .select("id, plataforma_id, nombre_personalizado, url_directo")
      .eq("libreria_id", item.id)
      .order("id", { ascending: true });

    if (enlacesError) {
      console.error("Error cargando enlaces:", enlacesError);
      setError("No se pudieron cargar los enlaces de esta obra.");
    } else {
      setDisponibilidades(
        (data || []).map((enlace) => ({
          ...enlace,
          localId: `existente-${enlace.id}`,
          plataforma_id: String(enlace.plataforma_id),
          nombre_personalizado: enlace.nombre_personalizado || "",
          url_directo: enlace.url_directo || "",
        })),
      );
    }

    setCargandoDisponibilidades(false);
  };

  const cambiarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setError(null);
  };

  const alternarGenero = (genero) => {
    setForm((actual) => {
      const seleccionado = actual.generos.includes(genero);
      if (seleccionado) {
        return {
          ...actual,
          generos: actual.generos.filter((item) => item !== genero),
        };
      }
      if (actual.generos.length >= MAX_GENEROS) return actual;
      return { ...actual, generos: [...actual.generos, genero] };
    });
    setError(null);
  };

  const agregarDisponibilidad = () => {
    if (disponibilidades.length >= MAX_ENLACES) {
      setError(`Solo puedes agregar hasta ${MAX_ENLACES} enlaces por obra.`);
      return;
    }
    setDisponibilidades((actuales) => [
      ...actuales,
      crearDisponibilidadVacia(),
    ]);
  };

  const actualizarDisponibilidad = (indice, campo, valor) => {
    setDisponibilidades((actuales) =>
      actuales.map((enlace, posicion) => {
        if (posicion !== indice) return enlace;

        if (campo === "plataforma_id") {
          const plataforma = plataformas.find(
            (item) => String(item.id) === String(valor),
          );
          return {
            ...enlace,
            plataforma_id: valor,
            nombre_personalizado:
              plataforma?.tipo === "otro" ? enlace.nombre_personalizado : "",
          };
        }

        return { ...enlace, [campo]: valor };
      }),
    );
    setError(null);
  };

  const eliminarDisponibilidad = (indice) => {
    setDisponibilidades((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice),
    );
  };

  const encontrarPlataforma = (id) =>
    plataformas.find((plataforma) => String(plataforma.id) === String(id));

  const validarEnlaces = () => {
    const conContenido = disponibilidades.filter(
      (enlace) =>
        enlace.plataforma_id ||
        enlace.nombre_personalizado.trim() ||
        enlace.url_directo.trim(),
    );

    if (
      conContenido.some(
        (enlace) => !enlace.plataforma_id || !enlace.url_directo.trim(),
      )
    ) {
      return "Completa la plataforma y la URL de cada enlace o elimina la fila.";
    }

    if (conContenido.some((enlace) => !esUrlValida(enlace.url_directo))) {
      return "Todos los enlaces deben comenzar con http:// o https://.";
    }

    if (
      conContenido.some(
        (enlace) => enlace.nombre_personalizado.trim().length > MAX_NOMBRE_ENLACE,
      )
    ) {
      return `El nombre del enlace no puede superar ${MAX_NOMBRE_ENLACE} caracteres.`;
    }

    if (
      conContenido.some((enlace) => {
        const plataforma = encontrarPlataforma(enlace.plataforma_id);
        return (
          plataforma?.tipo === "otro" &&
          enlace.nombre_personalizado.trim().length === 0
        );
      })
    ) {
      return "Los enlaces personalizados necesitan un nombre.";
    }

    const ids = conContenido.map((enlace) => String(enlace.plataforma_id));
    if (new Set(ids).size !== ids.length) {
      return "No puedes repetir la misma plataforma en una obra.";
    }

    return null;
  };

  const prepararEnlaces = () =>
    disponibilidades
      .filter(
        (enlace) => enlace.plataforma_id && enlace.url_directo.trim(),
      )
      .map((enlace) => ({
        plataforma_id: Number(enlace.plataforma_id),
        nombre_personalizado: enlace.nombre_personalizado.trim() || null,
        url_directo: enlace.url_directo.trim(),
      }));

  const guardarEnlaces = async (libreriaId, enlaces) => {
    const { error: eliminarError } = await supabase
      .from("disponibilidad_streaming")
      .delete()
      .eq("libreria_id", libreriaId);

    if (eliminarError) return eliminarError;
    if (enlaces.length === 0) return null;

    const { error: insertarError } = await supabase
      .from("disponibilidad_streaming")
      .insert(
        enlaces.map((enlace) => ({
          libreria_id: libreriaId,
          ...enlace,
        })),
      );

    return insertarError;
  };

  const handleGuardar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;

    setError(null);
    setMensaje(null);

    const titulo = form.titulo.trim();
    if (!titulo) {
      setError("El título es obligatorio.");
      return;
    }

    const errorAnio = validarAnio(form.anio_pub);
    if (errorAnio) {
      setError(errorAnio);
      return;
    }

    const errorGeneros = validarGeneros(form.generos);
    if (errorGeneros) {
      setError(errorGeneros);
      return;
    }

    if (!form.cover.trim() || !esUrlValida(form.cover)) {
      setError("Agrega una URL válida para la portada.");
      return;
    }

    if (form.banner.trim() && !esUrlValida(form.banner)) {
      setError("La URL del banner no es válida.");
      return;
    }

    const errorEnlaces = validarEnlaces();
    if (errorEnlaces) {
      setError(errorEnlaces);
      return;
    }

    const anio = form.anio_pub === "" ? null : Number(form.anio_pub);

    let consultaDuplicado = supabase
      .from("libreria")
      .select("id")
      .ilike("titulo", titulo)
      .eq("tipo", form.tipo);

    consultaDuplicado =
      anio === null
        ? consultaDuplicado.is("anio_pub", null)
        : consultaDuplicado.eq("anio_pub", anio);

    if (itemEditando) consultaDuplicado = consultaDuplicado.neq("id", itemEditando.id);

    const { data: duplicado, error: duplicadoError } = await consultaDuplicado
      .limit(1)
      .maybeSingle();

    if (duplicadoError) {
      console.error("Error comprobando obra duplicada:", duplicadoError);
    } else if (duplicado) {
      setError("Ya existe una obra con el mismo título, tipo y año.");
      return;
    }

    setGuardando(true);

    const payload = {
      titulo,
      tipo: form.tipo,
      anio_pub: anio,
      sinopsis: form.sinopsis.trim() || null,
      cover: form.cover.trim(),
      banner: form.banner.trim() || null,
      generos: normalizarGeneros(form.generos),
    };

    const resultado = itemEditando
      ? await supabase
          .from("libreria")
          .update(payload)
          .eq("id", itemEditando.id)
          .select("id")
          .single()
      : await supabase.from("libreria").insert(payload).select("id").single();

    if (resultado.error || !resultado.data?.id) {
      console.error("Error guardando obra:", resultado.error);
      setGuardando(false);
      setError("No se pudo guardar la obra.");
      return;
    }

    const errorGuardandoEnlaces = await guardarEnlaces(
      resultado.data.id,
      prepararEnlaces(),
    );

    setGuardando(false);

    if (errorGuardandoEnlaces) {
      console.error("Error guardando enlaces:", errorGuardandoEnlaces);
      setError("La obra se guardó, pero no fue posible actualizar sus enlaces.");
      setItemEditando({ ...payload, id: resultado.data.id });
      return;
    }

    const eraEdicion = Boolean(itemEditando);
    await cargarCatalogo();
    limpiarFormulario();
    setVista("lista");
    setMensaje(
      eraEdicion
        ? "La obra se actualizó correctamente."
        : "La obra se publicó correctamente.",
    );
  };

  const eliminarObra = async (item) => {
    const confirmado = window.confirm(
      `¿Eliminar "${item.titulo}" del catálogo? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    await supabase
      .from("disponibilidad_streaming")
      .delete()
      .eq("libreria_id", item.id);

    const { error: deleteError } = await supabase
      .from("libreria")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      console.error("Error eliminando obra:", deleteError);
      alert("No se pudo eliminar la obra.");
      return;
    }

    await cargarCatalogo();
  };

  return (
    <ModalPortal onCerrar={onCerrar}>
      <div className="theme-surface relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-white/5 p-6">
          <div>
            <h2 className="theme-modal-title text-lg font-black uppercase tracking-widest">
              {vista === "lista"
                ? "Panel de administración"
                : itemEditando
                  ? "Editar título"
                  : "Nuevo título"}
            </h2>
            {vista === "form" && (
              <p className="mt-1 text-xs text-zinc-500">
                Administra la información, los géneros y los enlaces de la obra.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 grow overflow-y-auto p-6">
          {mensaje && vista === "lista" && (
            <p className="mb-5 rounded-xl border border-(--accent)/20 bg-(--accent)/10 p-3 text-sm text-purple-200">
              {mensaje}
            </p>
          )}

          {vista === "lista" ? (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar en el catálogo..."
                  className="grow rounded-xl border border-white/10 bg-zinc-900 p-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                />
                <button
                  type="button"
                  onClick={abrirNuevo}
                  className="rounded-xl bg-(--accent) px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110"
                >
                  + Nuevo título
                </button>
              </div>

              {cargandoCatalogo ? (
                <p className="text-sm text-zinc-500">Cargando catálogo...</p>
              ) : catalogoFiltrado.length === 0 ? (
                <p className="text-sm text-zinc-500">No se encontraron títulos.</p>
              ) : (
                <div className="space-y-2">
                  {catalogoFiltrado.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {item.titulo}
                        </p>
                        <p className="text-xs uppercase text-zinc-500">
                          {item.tipo} · {item.anio_pub ?? "s/f"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(item)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-white/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarObra(item)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold uppercase text-rose-400 hover:bg-rose-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              <button
                type="button"
                onClick={volverALista}
                className="self-start text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white"
              >
                ← Volver a la lista
              </button>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Título
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={MAX_TITULO}
                    value={form.titulo}
                    onChange={(evento) => cambiarCampo("titulo", evento.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none focus:border-(--accent)/50"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Tipo de obra
                  </span>
                  <select
                    value={form.tipo}
                    onChange={(evento) => cambiarCampo("tipo", evento.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none focus:border-(--accent)/50"
                  >
                    {TIPOS_OPCIONES.map(([nombre, valor]) => (
                      <option key={valor} value={valor}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Año
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={new Date().getFullYear() + 5}
                    value={form.anio_pub}
                    onChange={(evento) => cambiarCampo("anio_pub", evento.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none focus:border-(--accent)/50"
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Géneros
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      Selecciona entre 1 y {MAX_GENEROS}.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-(--accent)">
                    {form.generos.length}/{MAX_GENEROS}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GENEROS_PERMITIDOS.map((genero) => {
                    const activo = form.generos.includes(genero);
                    const bloqueado = !activo && form.generos.length >= MAX_GENEROS;
                    return (
                      <button
                        key={genero}
                        type="button"
                        onClick={() => alternarGenero(genero)}
                        disabled={bloqueado}
                        className={`rounded-full border px-3 py-2 text-xs font-bold transition-all disabled:opacity-35 ${
                          activo
                            ? "border-(--accent)/40 bg-(--accent)/15 text-(--accent)"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-(--accent)/25 hover:text-white"
                        }`}
                      >
                        {genero}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sinopsis
                </span>
                <textarea
                  rows="5"
                  maxLength={MAX_SINOPSIS}
                  value={form.sinopsis}
                  onChange={(evento) => cambiarCampo("sinopsis", evento.target.value)}
                  className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none focus:border-(--accent)/50"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    URL de portada
                  </span>
                  <input
                    type="url"
                    required
                    value={form.cover}
                    onChange={(evento) => cambiarCampo("cover", evento.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    URL de banner
                  </span>
                  <input
                    type="url"
                    value={form.banner}
                    onChange={(evento) => cambiarCampo("banner", evento.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </label>
              </div>

              <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      Dónde encontrar esta obra
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Streaming, tiendas, sitio oficial o enlace personalizado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={agregarDisponibilidad}
                    disabled={cargandoPlataformas || plataformas.length === 0}
                    className="self-start rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-2 text-xs font-bold uppercase text-(--accent) hover:bg-(--accent)/20 disabled:opacity-40"
                  >
                    + Agregar enlace
                  </button>
                </div>

                {cargandoPlataformas || cargandoDisponibilidades ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
                    Cargando opciones...
                  </p>
                ) : disponibilidades.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-600">
                    No hay enlaces agregados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disponibilidades.map((enlace, indice) => {
                      const seleccionada = encontrarPlataforma(enlace.plataforma_id);
                      const personalizada = plataformas.find(
                        (plataforma) => plataforma.tipo === "otro",
                      );
                      const esPersonalizado = seleccionada?.tipo === "otro";
                      const esAnterior =
                        seleccionada && !TIPOS_VISIBLES.has(seleccionada.tipo);

                      return (
                        <div
                          key={enlace.localId}
                          className="rounded-xl border border-white/5 bg-zinc-950 p-4"
                        >
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label>
                              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Dónde se encuentra
                              </span>
                              <select
                                value={enlace.plataforma_id}
                                onChange={(evento) =>
                                  actualizarDisponibilidad(
                                    indice,
                                    "plataforma_id",
                                    evento.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-(--accent)/50"
                              >
                                <option value="">Selecciona una opción</option>
                                {GRUPOS_PLATAFORMAS.map((grupo) => {
                                  const opciones = plataformas.filter((plataforma) => {
                                    if (plataforma.tipo !== grupo.tipo) return false;
                                    return (
                                      !grupo.nombresPermitidos ||
                                      grupo.nombresPermitidos.includes(plataforma.nombre)
                                    );
                                  });
                                  if (opciones.length === 0) return null;
                                  return (
                                    <optgroup key={grupo.tipo} label={grupo.etiqueta}>
                                      {opciones.map((plataforma) => (
                                        <option
                                          key={plataforma.id}
                                          value={plataforma.id}
                                          disabled={disponibilidades.some(
                                            (otro, otraPosicion) =>
                                              otraPosicion !== indice &&
                                              String(otro.plataforma_id) ===
                                                String(plataforma.id),
                                          )}
                                        >
                                          {plataforma.nombre}
                                        </option>
                                      ))}
                                    </optgroup>
                                  );
                                })}
                                {personalizada && (
                                  <optgroup label="Personalizado">
                                    <option value={personalizada.id}>
                                      Enlace personalizado
                                    </option>
                                  </optgroup>
                                )}
                                {esAnterior && (
                                  <optgroup label="Enlace anterior">
                                    <option value={seleccionada.id}>
                                      {seleccionada.nombre}
                                    </option>
                                  </optgroup>
                                )}
                              </select>
                            </label>

                            <label>
                              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Enlace directo
                              </span>
                              <input
                                type="url"
                                value={enlace.url_directo}
                                onChange={(evento) =>
                                  actualizarDisponibilidad(
                                    indice,
                                    "url_directo",
                                    evento.target.value,
                                  )
                                }
                                placeholder="https://sitio.com/obra"
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                              />
                            </label>
                          </div>

                          {(esPersonalizado || esAnterior) && (
                            <label className="mt-3 block">
                              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Nombre del enlace
                              </span>
                              <input
                                type="text"
                                required={esPersonalizado}
                                maxLength={MAX_NOMBRE_ENLACE}
                                value={enlace.nombre_personalizado}
                                onChange={(evento) =>
                                  actualizarDisponibilidad(
                                    indice,
                                    "nombre_personalizado",
                                    evento.target.value,
                                  )
                                }
                                placeholder="Ej. Página oficial de la obra"
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                              />
                            </label>
                          )}

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => eliminarDisponibilidad(indice)}
                              className="rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {error && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={guardando || cargandoDisponibilidades}
                className="self-start rounded-xl bg-(--accent) px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110 disabled:opacity-40"
              >
                {guardando
                  ? "Guardando..."
                  : itemEditando
                    ? "Guardar cambios"
                    : "Publicar título"}
              </button>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default AdminPanelModal;