import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CATEGORIAS_MAP } from "../constants/categorias";
import ModalPortal from "./ModalPortal";

const ANIO_MINIMO = 1888;
const ANIO_MAXIMO =
  new Date().getFullYear() + 5;

const MAX_TITULO = 150;
const MAX_SINOPSIS = 1000;
const MAX_NOMBRE_ENLACE = 100;

const FORM_VACIO = {
  titulo: "",
  tipo: "pelicula",
  anio_pub: "",
  sinopsis: "",
  cover: "",
  banner: "",
  generos: "",
};

const TIPOS_OPCIONES = Object.entries(
  CATEGORIAS_MAP,
).filter(
  ([nombre]) => nombre !== "Todas",
);

const GRUPOS_PLATAFORMAS = [
  {
    tipo: "streaming",
    etiqueta: "Streaming",
  },
  {
    tipo: "tienda",
    etiqueta: "Tiendas en línea",
  },
  {
    tipo: "oficial",
    etiqueta: "Sitios oficiales",
    nombresPermitidos: [
      "Sitio oficial",
    ],
  },
];

const TIPOS_PLATAFORMA_VISIBLES =
  new Set([
    "streaming",
    "tienda",
    "oficial",
    "otro",
  ]);

const crearDisponibilidadVacia =
  () => ({
    id: null,
    localId: `nueva-${Date.now()}-${Math.random()}`,
    plataforma_id: "",
    nombre_personalizado: "",
    url_directo: "",
  });

const AdminPanelModal = ({
  onCerrar,
}) => {
  const { esAdmin } = useAuth();

  const [vista, setVista] =
    useState("lista");

  const [
    catalogo,
    setCatalogo,
  ] = useState([]);

  const [
    cargandoCatalogo,
    setCargandoCatalogo,
  ] = useState(true);

  const [busqueda, setBusqueda] =
    useState("");

  const [
    itemEditando,
    setItemEditando,
  ] = useState(null);

  const [form, setForm] =
    useState(FORM_VACIO);

  const [
    plataformas,
    setPlataformas,
  ] = useState([]);

  const [
    cargandoPlataformas,
    setCargandoPlataformas,
  ] = useState(true);

  const [
    disponibilidades,
    setDisponibilidades,
  ] = useState([]);

  const [
    cargandoDisponibilidades,
    setCargandoDisponibilidades,
  ] = useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [mensaje, setMensaje] =
    useState(null);

  const cargarCatalogo = async () => {
    setCargandoCatalogo(true);

    const {
      data,
      error: errorCatalogo,
    } = await supabase
      .from("libreria")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (errorCatalogo) {
      console.error(
        "Error cargando catálogo:",
        errorCatalogo,
      );

      setCatalogo([]);
    } else {
      setCatalogo(data || []);
    }

    setCargandoCatalogo(false);
  };

  const cargarPlataformas =
    async () => {
      setCargandoPlataformas(true);

      const {
        data,
        error: errorPlataformas,
      } = await supabase
        .from("plataformas")
        .select(`
          id,
          nombre,
          tipo
        `)
        .order("tipo", {
          ascending: true,
        })
        .order("nombre", {
          ascending: true,
        });

      if (errorPlataformas) {
        console.error(
          "Error cargando plataformas:",
          errorPlataformas,
        );

        setPlataformas([]);

        setError(
          `No se pudieron cargar las plataformas: ${
            errorPlataformas.message ||
            "permiso denegado"
          }`,
        );
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

  const catalogoFiltrado =
    useMemo(() => {
      const termino =
        busqueda
          .trim()
          .toLowerCase();

      if (!termino) {
        return catalogo;
      }

      return catalogo.filter(
        (item) =>
          String(item.titulo || "")
            .toLowerCase()
            .includes(termino),
      );
    }, [catalogo, busqueda]);

  if (!esAdmin) return null;

  const cambiarCampo = (
    campo,
    valor,
  ) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setError(null);
  };

  const limpiarFormulario = () => {
    setItemEditando(null);
    setForm(FORM_VACIO);
    setDisponibilidades([]);

    setCargandoDisponibilidades(
      false,
    );

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

  const abrirEdicion = async (
    item,
  ) => {
    setItemEditando(item);

    setForm({
      titulo: item.titulo || "",
      tipo:
        item.tipo || "pelicula",
      anio_pub:
        item.anio_pub || "",
      sinopsis:
        item.sinopsis || "",
      cover: item.cover || "",
      banner: item.banner || "",
      generos: Array.isArray(
        item.generos,
      )
        ? item.generos.join(", ")
        : item.generos || "",
    });

    setError(null);
    setMensaje(null);
    setDisponibilidades([]);
    setVista("form");

    setCargandoDisponibilidades(
      true,
    );

    const {
      data,
      error: errorDisponibilidad,
    } = await supabase
      .from(
        "disponibilidad_streaming",
      )
      .select(`
        id,
        plataforma_id,
        nombre_personalizado,
        url_directo
      `)
      .eq(
        "libreria_id",
        item.id,
      )
      .order("id", {
        ascending: true,
      });

    if (errorDisponibilidad) {
      console.error(
        "Error cargando enlaces:",
        errorDisponibilidad,
      );

      setDisponibilidades([]);

      setError(
        "No se pudieron cargar los enlaces de esta obra.",
      );
    } else {
      setDisponibilidades(
        (data || []).map(
          (disponibilidad) => ({
            id:
              disponibilidad.id,

            localId:
              `existente-${disponibilidad.id}`,

            plataforma_id:
              String(
                disponibilidad.plataforma_id,
              ),

            nombre_personalizado:
              disponibilidad.nombre_personalizado ||
              "",

            url_directo:
              disponibilidad.url_directo ||
              "",
          }),
        ),
      );
    }

    setCargandoDisponibilidades(
      false,
    );
  };

  const agregarDisponibilidad =
    () => {
      setDisponibilidades(
        (actuales) => [
          ...actuales,
          crearDisponibilidadVacia(),
        ],
      );

      setError(null);
    };

  const actualizarDisponibilidad = (
    indice,
    campo,
    valor,
  ) => {
    setDisponibilidades(
      (actuales) =>
        actuales.map(
          (
            disponibilidad,
            posicion,
          ) => {
            if (
              posicion !== indice
            ) {
              return disponibilidad;
            }

            if (
              campo ===
              "plataforma_id"
            ) {
              const plataforma =
                plataformas.find(
                  (item) =>
                    String(item.id) ===
                    String(valor),
                );

              return {
                ...disponibilidad,

                plataforma_id:
                  valor,

                nombre_personalizado:
                  plataforma?.tipo ===
                  "otro"
                    ? disponibilidad.nombre_personalizado
                    : "",
              };
            }

            return {
              ...disponibilidad,
              [campo]: valor,
            };
          },
        ),
    );

    setError(null);
  };

  const eliminarDisponibilidad = (
    indice,
  ) => {
    setDisponibilidades(
      (actuales) =>
        actuales.filter(
          (_, posicion) =>
            posicion !== indice,
        ),
    );

    setError(null);
  };

  const encontrarPlataforma = (
    plataformaId,
  ) =>
    plataformas.find(
      (plataforma) =>
        String(plataforma.id) ===
        String(plataformaId),
    );

  const esUrlValida = (valor) => {
    try {
      const url = new URL(valor);

      return (
        url.protocol === "http:" ||
        url.protocol === "https:"
      );
    } catch {
      return false;
    }
  };

  const obtenerDisponibilidadesValidas =
    () => {
      const filasConContenido =
        disponibilidades.filter(
          (disponibilidad) =>
            disponibilidad.plataforma_id ||
            disponibilidad.nombre_personalizado.trim() ||
            disponibilidad.url_directo.trim(),
        );

      const filaIncompleta =
        filasConContenido.some(
          (disponibilidad) =>
            !disponibilidad.plataforma_id ||
            !disponibilidad.url_directo.trim(),
        );

      if (filaIncompleta) {
        setError(
          "Selecciona una opción y escribe una URL en cada enlace, o elimina la fila incompleta.",
        );

        return null;
      }

      const urlInvalida =
        filasConContenido.some(
          (disponibilidad) =>
            !esUrlValida(
              disponibilidad.url_directo.trim(),
            ),
        );

      if (urlInvalida) {
        setError(
          "Todos los enlaces deben comenzar con http:// o https://.",
        );

        return null;
      }

      const nombreDemasiadoLargo =
        filasConContenido.some(
          (disponibilidad) =>
            disponibilidad.nombre_personalizado
              .trim().length >
            MAX_NOMBRE_ENLACE,
        );

      if (
        nombreDemasiadoLargo
      ) {
        setError(
          `El nombre personalizado no puede superar ${MAX_NOMBRE_ENLACE} caracteres.`,
        );

        return null;
      }

      const enlacePersonalizadoSinNombre =
        filasConContenido.some(
          (disponibilidad) => {
            const plataforma =
              encontrarPlataforma(
                disponibilidad.plataforma_id,
              );

            return (
              plataforma?.tipo ===
                "otro" &&
              !disponibilidad.nombre_personalizado.trim()
            );
          },
        );

      if (
        enlacePersonalizadoSinNombre
      ) {
        setError(
          "Los enlaces personalizados necesitan un nombre.",
        );

        return null;
      }

      const idsPlataformas =
        filasConContenido.map(
          (disponibilidad) =>
            String(
              disponibilidad.plataforma_id,
            ),
        );

      const plataformaRepetida =
        new Set(idsPlataformas)
          .size !==
        idsPlataformas.length;

      if (plataformaRepetida) {
        setError(
          "No puedes usar dos veces la misma plataforma para una obra.",
        );

        return null;
      }

      return filasConContenido.map(
        (disponibilidad) => ({
          plataforma_id: Number(
            disponibilidad.plataforma_id,
          ),

          nombre_personalizado:
            disponibilidad.nombre_personalizado
              .trim() || null,

          url_directo:
            disponibilidad.url_directo.trim(),
        }),
      );
    };

  const guardarDisponibilidades =
    async (
      libreriaId,
      filasValidas,
    ) => {
      const {
        error:
          errorEliminandoDisponibilidades,
      } = await supabase
        .from(
          "disponibilidad_streaming",
        )
        .delete()
        .eq(
          "libreria_id",
          libreriaId,
        );

      if (
        errorEliminandoDisponibilidades
      ) {
        console.error(
          "Error eliminando enlaces anteriores:",
          errorEliminandoDisponibilidades,
        );

        return {
          error:
            "No se pudieron actualizar los enlaces anteriores.",
        };
      }

      if (
        filasValidas.length === 0
      ) {
        return {
          error: null,
        };
      }

      const registros =
        filasValidas.map(
          (disponibilidad) => ({
            libreria_id:
              libreriaId,

            plataforma_id:
              disponibilidad.plataforma_id,

            nombre_personalizado:
              disponibilidad.nombre_personalizado,

            url_directo:
              disponibilidad.url_directo,
          }),
        );

      const {
        error:
          errorInsertandoDisponibilidades,
      } = await supabase
        .from(
          "disponibilidad_streaming",
        )
        .insert(registros);

      if (
        errorInsertandoDisponibilidades
      ) {
        console.error(
          "Error guardando enlaces:",
          errorInsertandoDisponibilidades,
        );

        return {
          error:
            "La obra se guardó, pero no fue posible guardar sus enlaces.",
        };
      }

      return {
        error: null,
      };
    };

  const handleGuardar = async (
    evento,
  ) => {
    evento.preventDefault();

    setError(null);
    setMensaje(null);

    const titulo =
      form.titulo.trim();

    if (!titulo) {
      setError(
        "El título es obligatorio.",
      );

      return;
    }

    const anio = form.anio_pub
      ? Number(form.anio_pub)
      : null;

    if (
      anio !== null &&
      (anio < ANIO_MINIMO ||
        anio > ANIO_MAXIMO)
    ) {
      setError(
        `El año debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`,
      );

      return;
    }

    if (!form.cover.trim()) {
      setError(
        "La URL de la portada es obligatoria.",
      );

      return;
    }

    if (
      !esUrlValida(
        form.cover.trim(),
      )
    ) {
      setError(
        "La URL de la portada no es válida.",
      );

      return;
    }

    if (
      form.banner.trim() &&
      !esUrlValida(
        form.banner.trim(),
      )
    ) {
      setError(
        "La URL del banner no es válida.",
      );

      return;
    }

    const generosLimpios =
      form.generos
        ? [
            ...new Set(
              form.generos
                .split(",")
                .map((genero) =>
                  genero.trim(),
                )
                .filter(Boolean),
            ),
          ]
        : [];

    if (
      generosLimpios.length === 0
    ) {
      setError(
        "Agrega al menos un género.",
      );

      return;
    }

    const filasValidas =
      obtenerDisponibilidadesValidas();

    if (
      filasValidas === null
    ) {
      return;
    }

    setGuardando(true);

    const payload = {
      titulo,
      tipo: form.tipo,
      anio_pub: anio,

      sinopsis:
        form.sinopsis.trim() ||
        null,

      cover:
        form.cover.trim(),

      banner:
        form.banner.trim() ||
        null,

      generos:
        generosLimpios,
    };

    let obraGuardada = null;
    let errorGuardandoObra =
      null;

    if (itemEditando) {
      const resultado =
        await supabase
          .from("libreria")
          .update(payload)
          .eq(
            "id",
            itemEditando.id,
          )
          .select("id")
          .single();

      obraGuardada =
        resultado.data;

      errorGuardandoObra =
        resultado.error;
    } else {
      const resultado =
        await supabase
          .from("libreria")
          .insert(payload)
          .select("id")
          .single();

      obraGuardada =
        resultado.data;

      errorGuardandoObra =
        resultado.error;
    }

    if (
      errorGuardandoObra ||
      !obraGuardada?.id
    ) {
      console.error(
        "Error guardando obra:",
        errorGuardandoObra,
      );

      setGuardando(false);

      setError(
        "No se pudo guardar la obra. Revisa la consola para obtener más detalles.",
      );

      return;
    }

    const resultadoEnlaces =
      await guardarDisponibilidades(
        obraGuardada.id,
        filasValidas,
      );

    if (
      resultadoEnlaces.error
    ) {
      setGuardando(false);

      setError(
        resultadoEnlaces.error,
      );

      setItemEditando({
        ...payload,
        id: obraGuardada.id,
      });

      return;
    }

    const eraEdicion =
      Boolean(itemEditando);

    setGuardando(false);

    await cargarCatalogo();

    setVista("lista");
    setItemEditando(null);
    setForm(FORM_VACIO);
    setDisponibilidades([]);

    setMensaje(
      eraEdicion
        ? "La obra y sus enlaces se actualizaron correctamente."
        : "La obra y sus enlaces se publicaron correctamente.",
    );
  };

  const eliminarObra = async (
    item,
  ) => {
    const confirmado =
      window.confirm(
        `¿Eliminar "${item.titulo}" del catálogo? Esta acción no se puede deshacer.`,
      );

    if (!confirmado) return;

    const {
      error:
        errorEliminandoEnlaces,
    } = await supabase
      .from(
        "disponibilidad_streaming",
      )
      .delete()
      .eq(
        "libreria_id",
        item.id,
      );

    if (
      errorEliminandoEnlaces
    ) {
      console.error(
        "Error eliminando enlaces:",
        errorEliminandoEnlaces,
      );

      alert(
        "No se pudieron eliminar los enlaces de la obra.",
      );

      return;
    }

    const {
      error:
        errorEliminandoObra,
    } = await supabase
      .from("libreria")
      .delete()
      .eq("id", item.id);

    if (
      errorEliminandoObra
    ) {
      console.error(
        "Error eliminando obra:",
        errorEliminandoObra,
      );

      alert(
        "No se pudo eliminar la obra.",
      );

      return;
    }

    await cargarCatalogo();
  };

  return (
    <ModalPortal
      onCerrar={onCerrar}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-white/5 p-6">
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-(--accent)">
              {vista === "lista"
                ? "Panel de administración"
                : itemEditando
                  ? "Editar título"
                  : "Nuevo título"}
            </h2>

            {vista === "form" && (
              <p className="mt-1 text-xs text-zinc-500">
                Administra la
                información y los
                enlaces relacionados
                con la obra.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 grow overflow-y-auto p-6">
          {mensaje &&
            vista === "lista" && (
              <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {mensaje}
              </div>
            )}

          {vista === "lista" ? (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(
                    evento,
                  ) =>
                    setBusqueda(
                      evento.target
                        .value,
                    )
                  }
                  placeholder="Buscar en el catálogo..."
                  className="grow rounded-xl border border-white/10 bg-zinc-900 p-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                />

                <button
                  type="button"
                  onClick={abrirNuevo}
                  className="whitespace-nowrap rounded-xl bg-(--accent) px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
                >
                  + Nuevo título
                </button>
              </div>

              {cargandoCatalogo ? (
                <p className="text-sm text-zinc-500">
                  Cargando catálogo...
                </p>
              ) : catalogoFiltrado
                  .length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No se encontraron
                  títulos.
                </p>
              ) : (
                <div className="space-y-2">
                  {catalogoFiltrado.map(
                    (item) => (
                      <article
                        key={item.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {item.titulo}
                          </p>

                          <p className="text-xs uppercase text-zinc-500">
                            {item.tipo} ·{" "}
                            {item.anio_pub ||
                              "s/f"}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicion(
                                item,
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase text-white transition-all hover:bg-white/10"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarObra(
                                item,
                              )
                            }
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold uppercase text-rose-400 transition-all hover:bg-rose-500/20"
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </>
          ) : (
            <form
              onSubmit={handleGuardar}
              className="flex flex-col gap-5"
            >
              <button
                type="button"
                onClick={volverALista}
                className="self-start text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-white"
              >
                ← Volver a la lista
              </button>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Título
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={
                      MAX_TITULO
                    }
                    value={
                      form.titulo
                    }
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "titulo",
                        evento.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none focus:border-(--accent)/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Tipo de obra
                  </label>

                  <select
                    value={form.tipo}
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "tipo",
                        evento.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none focus:border-(--accent)/50"
                  >
                    {TIPOS_OPCIONES.map(
                      ([
                        nombre,
                        valor,
                      ]) => (
                        <option
                          key={valor}
                          value={valor}
                        >
                          {nombre}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Año
                  </label>

                  <input
                    type="number"
                    min={ANIO_MINIMO}
                    max={ANIO_MAXIMO}
                    value={
                      form.anio_pub
                    }
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "anio_pub",
                        evento.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none focus:border-(--accent)/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Géneros separados
                    por coma
                  </label>

                  <input
                    type="text"
                    value={
                      form.generos
                    }
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "generos",
                        evento.target
                          .value,
                      )
                    }
                    placeholder="Animación, Fantasía, Familiar"
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sinopsis
                </label>

                <textarea
                  rows="4"
                  maxLength={
                    MAX_SINOPSIS
                  }
                  value={
                    form.sinopsis
                  }
                  onChange={(
                    evento,
                  ) =>
                    cambiarCampo(
                      "sinopsis",
                      evento.target
                        .value,
                    )
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none focus:border-(--accent)/50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    URL de portada
                  </label>

                  <input
                    type="url"
                    required
                    value={form.cover}
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "cover",
                        evento.target
                          .value,
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    URL de banner
                  </label>

                  <input
                    type="url"
                    value={
                      form.banner
                    }
                    onChange={(
                      evento,
                    ) =>
                      cambiarCampo(
                        "banner",
                        evento.target
                          .value,
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </div>
              </div>

              <section className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">
                      Dónde encontrar
                      esta obra
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Agrega servicios
                      de streaming,
                      tiendas, un sitio
                      oficial o un enlace
                      personalizado.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      agregarDisponibilidad
                    }
                    disabled={
                      cargandoPlataformas ||
                      plataformas.length ===
                        0
                    }
                    className="self-start rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-(--accent) transition-all hover:bg-(--accent)/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + Agregar enlace
                  </button>
                </div>

                {cargandoPlataformas ||
                cargandoDisponibilidades ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">
                    Cargando opciones...
                  </p>
                ) : plataformas.length ===
                  0 ? (
                  <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
                    No se encontraron
                    opciones en la tabla
                    plataformas.
                  </p>
                ) : disponibilidades.length ===
                  0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-600">
                    No hay enlaces
                    agregados. Presiona
                    “Agregar enlace”.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {disponibilidades.map(
                      (
                        disponibilidad,
                        indice,
                      ) => {
                        const plataformaSeleccionada =
                          encontrarPlataforma(
                            disponibilidad.plataforma_id,
                          );

                        const plataformaPersonalizada =
                          plataformas.find(
                            (
                              plataforma,
                            ) =>
                              plataforma.tipo ===
                              "otro",
                          );

                        const esPersonalizado =
                          plataformaSeleccionada?.tipo ===
                          "otro";

                        const esOpcionAnterior =
                          plataformaSeleccionada &&
                          !TIPOS_PLATAFORMA_VISIBLES.has(
                            plataformaSeleccionada.tipo,
                          );

                        const mostrarNombrePersonalizado =
                          esPersonalizado ||
                          esOpcionAnterior;

                        const personalizadoUsadoEnOtraFila =
                          plataformaPersonalizada &&
                          disponibilidades.some(
                            (
                              otra,
                              otraPosicion,
                            ) =>
                              otraPosicion !==
                                indice &&
                              String(
                                otra.plataforma_id,
                              ) ===
                                String(
                                  plataformaPersonalizada.id,
                                ),
                          );

                        const urlEsValida =
                          esUrlValida(
                            disponibilidad.url_directo,
                          );

                        return (
                          <div
                            key={
                              disponibilidad.localId
                            }
                            className="rounded-xl border border-white/5 bg-zinc-950 p-4"
                          >
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Dónde se
                                  encuentra
                                </label>

                                <select
                                  value={
                                    disponibilidad.plataforma_id
                                  }
                                  onChange={(
                                    evento,
                                  ) =>
                                    actualizarDisponibilidad(
                                      indice,
                                      "plataforma_id",
                                      evento
                                        .target
                                        .value,
                                    )
                                  }
                                  className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-(--accent)/50"
                                >
                                  <option value="">
                                    Selecciona
                                    una opción
                                  </option>

                                  {GRUPOS_PLATAFORMAS.map(
                                    (
                                      grupo,
                                    ) => {
                                      const opciones =
                                        plataformas.filter(
                                          (
                                            plataforma,
                                          ) => {
                                            const coincideTipo =
                                              plataforma.tipo ===
                                              grupo.tipo;

                                            const coincideNombre =
                                              !grupo.nombresPermitidos ||
                                              grupo.nombresPermitidos.includes(
                                                plataforma.nombre,
                                              );

                                            return (
                                              coincideTipo &&
                                              coincideNombre
                                            );
                                          },
                                        );

                                      if (
                                        opciones.length ===
                                        0
                                      ) {
                                        return null;
                                      }

                                      return (
                                        <optgroup
                                          key={
                                            grupo.tipo
                                          }
                                          label={
                                            grupo.etiqueta
                                          }
                                        >
                                          {opciones.map(
                                            (
                                              plataforma,
                                            ) => {
                                              const usadaEnOtraFila =
                                                disponibilidades.some(
                                                  (
                                                    otra,
                                                    otraPosicion,
                                                  ) =>
                                                    otraPosicion !==
                                                      indice &&
                                                    String(
                                                      otra.plataforma_id,
                                                    ) ===
                                                      String(
                                                        plataforma.id,
                                                      ),
                                                );

                                              return (
                                                <option
                                                  key={
                                                    plataforma.id
                                                  }
                                                  value={
                                                    plataforma.id
                                                  }
                                                  disabled={
                                                    usadaEnOtraFila
                                                  }
                                                >
                                                  {
                                                    plataforma.nombre
                                                  }
                                                </option>
                                              );
                                            },
                                          )}
                                        </optgroup>
                                      );
                                    },
                                  )}

                                  {plataformaPersonalizada && (
                                    <optgroup label="Personalizado">
                                      <option
                                        value={
                                          plataformaPersonalizada.id
                                        }
                                        disabled={
                                          personalizadoUsadoEnOtraFila
                                        }
                                      >
                                        Enlace
                                        personalizado
                                      </option>
                                    </optgroup>
                                  )}

                                  {esOpcionAnterior && (
                                    <optgroup label="Enlace guardado anteriormente">
                                      <option
                                        value={
                                          plataformaSeleccionada.id
                                        }
                                      >
                                        {
                                          plataformaSeleccionada.nombre
                                        }
                                      </option>
                                    </optgroup>
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Enlace
                                  directo
                                </label>

                                <input
                                  type="url"
                                  value={
                                    disponibilidad.url_directo
                                  }
                                  onChange={(
                                    evento,
                                  ) =>
                                    actualizarDisponibilidad(
                                      indice,
                                      "url_directo",
                                      evento
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder="https://sitio.com/obra"
                                  className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                                />
                              </div>
                            </div>

                            {mostrarNombrePersonalizado && (
                              <div className="mt-3">
                                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                  Nombre del
                                  enlace
                                </label>

                                <input
                                  type="text"
                                  required={
                                    esPersonalizado
                                  }
                                  maxLength={
                                    MAX_NOMBRE_ENLACE
                                  }
                                  value={
                                    disponibilidad.nombre_personalizado
                                  }
                                  onChange={(
                                    evento,
                                  ) =>
                                    actualizarDisponibilidad(
                                      indice,
                                      "nombre_personalizado",
                                      evento
                                        .target
                                        .value,
                                    )
                                  }
                                  placeholder="Ej. Página oficial de la obra"
                                  className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                                />

                                <p className="mt-1 text-[10px] text-zinc-600">
                                  Úsalo para
                                  autores, editoriales
                                  o proyectos
                                  independientes.
                                </p>
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                {disponibilidad.url_directo &&
                                  urlEsValida && (
                                    <a
                                      href={
                                        disponibilidad.url_directo
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-bold text-(--accent) hover:underline"
                                    >
                                      Probar enlace
                                      ↗
                                    </a>
                                  )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  eliminarDisponibilidad(
                                    indice,
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition-colors hover:bg-rose-500/10"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </section>

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  guardando ||
                  cargandoDisponibilidades
                }
                className="self-start rounded-xl bg-(--accent) px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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