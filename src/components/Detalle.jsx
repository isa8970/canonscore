import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ModalPortal from "./ModalPortal";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";

const MIN_CARACTERES = 15;
const MAX_CARACTERES = 1000;
const MAX_DETALLES_REPORTE = 500;

const MOTIVOS_REPORTE = [
  {
    value: "spam",
    label: "Spam o publicidad",
  },
  {
    value: "lenguaje_ofensivo",
    label: "Lenguaje ofensivo",
  },
  {
    value: "acoso",
    label:
      "Acoso o ataque personal",
  },
  {
    value: "spoiler",
    label:
      "Spoiler sin advertencia",
  },
  {
    value:
      "contenido_inapropiado",
    label:
      "Contenido inapropiado",
  },
  {
    value: "otro",
    label: "Otro motivo",
  },
];

const ETIQUETAS_TIPO_ENLACE = {
  streaming: "Streaming",
  tienda: "Tienda en línea",
  oficial: "Sitio oficial",
  editorial: "Editorial",
  independiente:
    "Sitio independiente",
  otro: "Enlace externo",
};

const ReportarReseniaModal = ({
  resenia,
  onCerrar,
  onReportado,
}) => {
  const { usuario } = useAuth();

  const [motivo, setMotivo] =
    useState("spam");

  const [detalles, setDetalles] =
    useState("");

  const [
    enviandoReporte,
    setEnviandoReporte,
  ] = useState(false);

  const [
    errorReporte,
    setErrorReporte,
  ] = useState(null);

  const enviarReporte = async (
    evento,
  ) => {
    evento.preventDefault();

    if (!usuario) {
      setErrorReporte(
        "Debes iniciar sesión para reportar una reseña.",
      );

      return;
    }

    if (!resenia) {
      setErrorReporte(
        "No se encontró la reseña.",
      );

      return;
    }

    if (
      resenia.user_id ===
      usuario.id
    ) {
      setErrorReporte(
        "No puedes reportar tu propia reseña.",
      );

      return;
    }

    setEnviandoReporte(true);
    setErrorReporte(null);

    const { error } =
      await supabase
        .from(
          "reportes_resenias",
        )
        .insert({
          resenia_id:
            resenia.id,

          reportante_id:
            usuario.id,

          motivo,

          detalles:
            detalles.trim() ||
            null,
        });

    setEnviandoReporte(false);

    if (error) {
      console.error(
        "Error enviando reporte:",
        error,
      );

      if (
        error.code === "23505"
      ) {
        setErrorReporte(
          "Ya reportaste esta reseña anteriormente.",
        );
      } else if (
        error.code === "42501"
      ) {
        setErrorReporte(
          "No tienes permiso para reportar esta reseña.",
        );
      } else {
        setErrorReporte(
          "No se pudo enviar el reporte. Intenta nuevamente.",
        );
      }

      return;
    }

    onReportado?.();
  };

  if (!resenia) return null;

  return (
    <ModalPortal
      onCerrar={onCerrar}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCerrar}
          disabled={
            enviandoReporte
          }
          className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-white disabled:opacity-40"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <h2 className="pr-8 text-lg font-black uppercase tracking-widest text-amber-400">
          Reportar reseña
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          El reporte será enviado a
          los administradores para su
          revisión. La reseña no se
          eliminará automáticamente.
        </p>

        <div className="mt-4 max-h-32 overflow-y-auto rounded-xl border border-white/5 bg-zinc-900/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <img
              src={
                resenia.rating
                  ? iconoBuena
                  : iconoMala
              }
              alt={
                resenia.rating
                  ? "Valoración buena"
                  : "Valoración mala"
              }
              className="h-6 w-6 object-contain"
            />

            <span className="text-xs font-bold text-(--accent)">
              {resenia.perfiles
                ?.username ||
                "Usuario"}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300">
            “{resenia.review_text}”
          </p>
        </div>

        <form
          onSubmit={enviarReporte}
          className="mt-5 flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="motivo-reporte"
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Motivo
            </label>

            <select
              id="motivo-reporte"
              value={motivo}
              onChange={(evento) =>
                setMotivo(
                  evento.target
                    .value,
                )
              }
              disabled={
                enviandoReporte
              }
              className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-amber-500/50 disabled:opacity-50"
            >
              {MOTIVOS_REPORTE.map(
                (opcion) => (
                  <option
                    key={
                      opcion.value
                    }
                    value={
                      opcion.value
                    }
                  >
                    {opcion.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="detalles-reporte"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500"
              >
                Detalles opcionales
              </label>

              <span className="text-[10px] font-mono text-zinc-600">
                {detalles.length} /{" "}
                {
                  MAX_DETALLES_REPORTE
                }
              </span>
            </div>

            <textarea
              id="detalles-reporte"
              rows="4"
              maxLength={
                MAX_DETALLES_REPORTE
              }
              value={detalles}
              onChange={(evento) =>
                setDetalles(
                  evento.target
                    .value,
                )
              }
              disabled={
                enviandoReporte
              }
              placeholder="Explica brevemente por qué reportas esta reseña..."
              className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/50 disabled:opacity-50"
            />
          </div>

          {errorReporte && (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorReporte}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={
                enviandoReporte
              }
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                enviandoReporte
              }
              className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-500/25 disabled:opacity-40"
            >
              {enviandoReporte
                ? "Enviando..."
                : "Enviar reporte"}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

const Detalle = ({
  item,
  onVolver,
}) => {
  const {
    usuario,
    esInvitado,
  } = useAuth();

  const [
    comentarios,
    setComentarios,
  ] = useState([]);

  const [
    cargandoComentarios,
    setCargandoComentarios,
  ] = useState(true);

  const [
    disponibilidades,
    setDisponibilidades,
  ] = useState([]);

  const [
    cargandoDisponibilidad,
    setCargandoDisponibilidad,
  ] = useState(true);

  const [
    errorDisponibilidad,
    setErrorDisponibilidad,
  ] = useState(null);

  const [
    nuevoComentario,
    setNuevoComentario,
  ] = useState("");

  const [
    ratingPositivo,
    setRatingPositivo,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    errorEnvio,
    setErrorEnvio,
  ] = useState(null);

  const [
    reseniaProcesando,
    setReseniaProcesando,
  ] = useState(null);

  const [
    reseniaAReportar,
    setReseniaAReportar,
  ] = useState(null);

  const [
    mensajeAccion,
    setMensajeAccion,
  ] = useState(null);

  useEffect(() => {
    if (!item?.id) {
      return undefined;
    }

    let activo = true;

    const cargarResenias =
      async () => {
        setCargandoComentarios(
          true,
        );

        const {
          data,
          error,
        } = await supabase
          .from("resenias")
          .select(`
            id,
            libreria_id,
            user_id,
            rating,
            review_text,
            created_at,
            perfiles (
              username
            )
          `)
          .eq(
            "libreria_id",
            item.id,
          )
          .order("created_at", {
            ascending: false,
          });

        if (!activo) return;

        if (error) {
          console.error(
            "Error cargando reseñas:",
            error,
          );

          setComentarios([]);
        } else {
          setComentarios(
            data || [],
          );
        }

        setCargandoComentarios(
          false,
        );
      };

    cargarResenias();

    return () => {
      activo = false;
    };
  }, [item?.id]);

  useEffect(() => {
    if (!item?.id) {
      return undefined;
    }

    let activo = true;

    const cargarDisponibilidad =
      async () => {
        setCargandoDisponibilidad(
          true,
        );

        setErrorDisponibilidad(
          null,
        );

        const {
          data,
          error,
        } = await supabase
          .from(
            "disponibilidad_streaming",
          )
          .select(`
            id,
            plataforma_id,
            nombre_personalizado,
            url_directo,
            plataforma:plataformas (
              id,
              nombre,
              tipo
            )
          `)
          .eq(
            "libreria_id",
            item.id,
          );

        if (!activo) return;

        if (error) {
          console.error(
            "Error cargando enlaces:",
            error,
          );

          setDisponibilidades(
            [],
          );

          setErrorDisponibilidad(
            "No se pudieron cargar los enlaces.",
          );
        } else {
          const ordenadas = [
            ...(data || []),
          ].sort((a, b) => {
            const nombreA =
              a.nombre_personalizado ||
              a.plataforma
                ?.nombre ||
              "";

            const nombreB =
              b.nombre_personalizado ||
              b.plataforma
                ?.nombre ||
              "";

            return nombreA.localeCompare(
              nombreB,
              "es",
            );
          });

          setDisponibilidades(
            ordenadas,
          );
        }

        setCargandoDisponibilidad(
          false,
        );
      };

    cargarDisponibilidad();

    return () => {
      activo = false;
    };
  }, [item?.id]);

  if (!item) return null;

  const valoracionesPositivas =
    comentarios.filter(
      (comentario) =>
        comentario.rating === true,
    ).length;

  const valoracionesNegativas =
    comentarios.filter(
      (comentario) =>
        comentario.rating === false,
    ).length;

  const totalValoraciones =
    valoracionesPositivas +
    valoracionesNegativas;

  const porcentajeRecomendacion =
    totalValoraciones > 0
      ? Math.round(
          (valoracionesPositivas /
            totalValoraciones) *
            100,
        )
      : 0;

  const caracteresActuales =
    nuevoComentario.trim().length;

  const faltanCaracteres =
    MIN_CARACTERES -
    caracteresActuales;

  const textoValido =
    caracteresActuales >=
      MIN_CARACTERES &&
    caracteresActuales <=
      MAX_CARACTERES;

  const generosMostrados =
    item.genero ||
    (Array.isArray(
      item.generos,
    )
      ? item.generos.join(", ")
      : item.generos) ||
    "Sin género";

  const anioMostrado =
    item.anio ||
    item.anio_pub ||
    "Sin año";

  const descripcionMostrada =
    item.descripcion ||
    item.sinopsis ||
    "Sin sinopsis disponible.";

  const imagenMostrada =
    item.imagen ||
    item.cover;

  const bannerMostrado =
    item.imagenBanner ||
    item.banner ||
    imagenMostrada;

  const deponerComentario =
    async (evento) => {
      evento.preventDefault();

      if (!usuario) {
        setErrorEnvio(
          "Debes iniciar sesión para publicar una reseña.",
        );

        return;
      }

      if (!textoValido) return;

      setEnviando(true);
      setErrorEnvio(null);
      setMensajeAccion(null);

      const {
        data,
        error,
      } = await supabase
        .from("resenias")
        .insert({
          libreria_id:
            item.id,

          user_id:
            usuario.id,

          rating:
            ratingPositivo,

          review_text:
            nuevoComentario.trim(),
        })
        .select(`
          id,
          libreria_id,
          user_id,
          rating,
          review_text,
          created_at,
          perfiles (
            username
          )
        `)
        .single();

      setEnviando(false);

      if (error) {
        console.error(
          "Error publicando reseña:",
          error,
        );

        setErrorEnvio(
          "No se pudo publicar tu reseña. Intenta nuevamente.",
        );

        return;
      }

      setComentarios(
        (anteriores) => [
          data,
          ...anteriores,
        ],
      );

      setNuevoComentario("");
      setRatingPositivo(true);

      setMensajeAccion({
        tipo: "exito",

        texto:
          "Tu reseña se publicó correctamente.",
      });
    };

  const eliminarResenia = async (
    resenia,
  ) => {
    if (!usuario) {
      setMensajeAccion({
        tipo: "error",
        texto:
          "Debes iniciar sesión.",
      });

      return;
    }

    if (
      resenia.user_id !==
      usuario.id
    ) {
      setMensajeAccion({
        tipo: "error",

        texto:
          "Solo puedes eliminar tus propias reseñas.",
      });

      return;
    }

    const confirmado =
      window.confirm(
        "¿Deseas eliminar esta reseña? Esta acción no se puede deshacer.",
      );

    if (!confirmado) return;

    setReseniaProcesando(
      resenia.id,
    );

    setMensajeAccion(null);

    const {
      data,
      error,
    } = await supabase
      .from("resenias")
      .delete()
      .eq(
        "id",
        resenia.id,
      )
      .eq(
        "user_id",
        usuario.id,
      )
      .select("id")
      .maybeSingle();

    setReseniaProcesando(null);

    if (error) {
      console.error(
        "Error eliminando reseña:",
        error,
      );

      setMensajeAccion({
        tipo: "error",

        texto:
          "No se pudo eliminar la reseña.",
      });

      return;
    }

    if (!data) {
      setMensajeAccion({
        tipo: "error",

        texto:
          "La reseña no existe o no tienes permiso para eliminarla.",
      });

      return;
    }

    setComentarios(
      (anteriores) =>
        anteriores.filter(
          (comentario) =>
            comentario.id !==
            resenia.id,
        ),
    );

    setMensajeAccion({
      tipo: "exito",

      texto:
        "La reseña fue eliminada.",
    });
  };

  const abrirReporte = (
    resenia,
  ) => {
    if (!usuario) {
      setMensajeAccion({
        tipo: "error",

        texto:
          "Debes iniciar sesión para reportar una reseña.",
      });

      return;
    }

    if (
      resenia.user_id ===
      usuario.id
    ) {
      setMensajeAccion({
        tipo: "error",

        texto:
          "No puedes reportar tu propia reseña.",
      });

      return;
    }

    setMensajeAccion(null);
    setReseniaAReportar(
      resenia,
    );
  };

  const confirmarReporte = () => {
    setReseniaAReportar(null);

    setMensajeAccion({
      tipo: "exito",

      texto:
        "El reporte fue enviado a los administradores.",
    });
  };

  const formatearFecha = (
    fechaISO,
  ) => {
    if (!fechaISO) return "";

    const fecha =
      new Date(fechaISO);

    const ahora = new Date();

    const diferenciaDias =
      Math.floor(
        (ahora - fecha) /
          (1000 *
            60 *
            60 *
            24),
      );

    if (
      diferenciaDias <= 0
    ) {
      return "hoy";
    }

    if (
      diferenciaDias === 1
    ) {
      return "hace 1 día";
    }

    return `hace ${diferenciaDias} días`;
  };

  const obtenerTextoPrincipalEnlace =
    (disponibilidad) => {
      const plataforma =
        disponibilidad.plataforma;

      const nombrePersonalizado =
        disponibilidad.nombre_personalizado?.trim();

      if (nombrePersonalizado) {
        return nombrePersonalizado;
      }

      const nombre =
        plataforma?.nombre ||
        "Enlace externo";

      if (
        plataforma?.tipo ===
        "streaming"
      ) {
        return `Ver en ${nombre}`;
      }

      if (
        plataforma?.tipo ===
        "tienda"
      ) {
        return `Comprar en ${nombre}`;
      }

      return nombre;
    };

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-24 text-white">
      <div className="relative h-[22vh] w-full overflow-hidden md:h-[45vh]">
        <img
          src={bannerMostrado}
          alt={item.titulo}
          className="h-full w-full scale-105 object-cover object-top opacity-40 blur-sm"
        />

        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        <button
          type="button"
          onClick={onVolver}
          className="absolute left-6 top-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all hover:bg-white/10 md:left-12"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          Volver
        </button>
      </div>

      <div className="relative z-10 mx-auto -mt-24 grid max-w-300 grid-cols-1 gap-8 px-6 md:-mt-48 md:grid-cols-3 md:gap-12">
        <div className="flex flex-col items-center md:items-start">
          <div className="aspect-3/4 w-64 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src={imagenMostrada}
              alt={item.titulo}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-6 w-full rounded-2xl border border-white/5 bg-zinc-900/50 p-5">
            <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-(--accent)">
              {item.titulo}
            </h4>

            <p className="mb-2 text-sm opacity-60">
              <span className="font-bold text-white">
                Año:
              </span>{" "}
              {anioMostrado}
            </p>

            <p className="mb-4 text-sm opacity-60">
              <span className="font-bold text-white">
                Género:
              </span>{" "}
              {generosMostrados}
            </p>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-2 text-sm font-bold text-white">
                Dónde encontrar
              </p>

              {cargandoDisponibilidad ? (
                <p className="text-xs text-zinc-500">
                  Cargando enlaces...
                </p>
              ) : errorDisponibilidad ? (
                <p className="text-xs text-rose-400">
                  {
                    errorDisponibilidad
                  }
                </p>
              ) : disponibilidades
                  .length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No hay enlaces
                  disponibles.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {disponibilidades.map(
                    (
                      disponibilidad,
                    ) => {
                      const tipo =
                        disponibilidad
                          .plataforma
                          ?.tipo ||
                        "otro";

                      const textoPrincipal =
                        obtenerTextoPrincipalEnlace(
                          disponibilidad,
                        );

                      return (
                        <li
                          key={
                            disponibilidad.id
                          }
                        >
                          <a
                            href={
                              disponibilidad.url_directo
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between gap-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-200 transition-colors group-hover:text-(--accent)">
                                {
                                  textoPrincipal
                                }
                              </p>

                              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                {ETIQUETAS_TIPO_ENLACE[
                                  tipo
                                ] ||
                                  "Enlace externo"}
                              </p>
                            </div>

                            <svg
                              className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--accent)"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={
                                  2
                                }
                                d="M14 3h7v7m0-7L10 14M5 7v12a2 2 0 002 2h12"
                              />
                            </svg>
                          </a>
                        </li>
                      );
                    },
                  )}
                </ul>
              )}
            </div>

            <div className="mt-4 border-t border-white/5 pt-4">
              <span className="text-sm font-bold text-(--accent)">
                Valoración:
              </span>

              {totalValoraciones ===
              0 ? (
                <p className="mt-2 text-sm opacity-60">
                  Sin valoraciones
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={iconoBuena}
                    alt="Valoración buena"
                    className="h-8 w-8 object-contain"
                  />

                  <div>
                    <p className="text-xl font-black text-amber-300">
                      {
                        porcentajeRecomendacion
                      }
                      %
                    </p>

                    <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Recomendación
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-start text-left md:col-span-2">
          <span className="mb-3 self-start rounded-md border border-(--accent)/30 bg-(--accent)/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-(--accent)">
            {item.tipo}
          </span>

          <h2 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            {item.titulo}
          </h2>

          <h3 className="mb-2 border-b border-white/5 pb-2 text-lg font-bold">
            Sinopsis
          </h3>

          <p className="mb-12 leading-relaxed text-zinc-300">
            {descripcionMostrada}
          </p>

          <section className="mt-6">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold">
              Sección de reseñas

              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {comentarios.length}
              </span>
            </h3>

            {mensajeAccion && (
              <div
                className={`mb-5 rounded-xl border p-3 text-sm ${
                  mensajeAccion.tipo ===
                  "exito"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                }`}
              >
                {mensajeAccion.texto}
              </div>
            )}

            {esInvitado ||
            !usuario ? (
              <div className="mb-8 rounded-xl border border-white/5 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                Inicia sesión para
                dejar tu reseña sobre
                esta obra.
              </div>
            ) : (
              <form
                onSubmit={
                  deponerComentario
                }
                className="mb-8"
              >
                <textarea
                  rows="3"
                  maxLength={
                    MAX_CARACTERES
                  }
                  value={
                    nuevoComentario
                  }
                  onChange={(
                    evento,
                  ) => {
                    setNuevoComentario(
                      evento.target
                        .value,
                    );

                    if (errorEnvio) {
                      setErrorEnvio(
                        null,
                      );
                    }
                  }}
                  placeholder="Escribe tu reseña u opinión sobre esta obra..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900 p-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                />

                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span
                    className={`text-[11px] font-mono ${
                      textoValido
                        ? "text-emerald-500"
                        : "text-zinc-600"
                    }`}
                  >
                    {caracteresActuales <
                    MIN_CARACTERES
                      ? `Necesitas ${faltanCaracteres} caracteres más (mínimo ${MIN_CARACTERES})`
                      : `${caracteresActuales} / ${MAX_CARACTERES} caracteres`}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRatingPositivo(
                        true,
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      ratingPositivo
                        ? "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                        : "border border-white/10 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <img
                      src={iconoBuena}
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-7 object-contain"
                    />

                    Recomendada
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRatingPositivo(
                        false,
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      !ratingPositivo
                        ? "border border-rose-500/40 bg-rose-500/15 text-rose-400"
                        : "border border-white/10 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <img
                      src={iconoMala}
                      alt=""
                      aria-hidden="true"
                      className="h-7 w-7 object-contain"
                    />

                    No recomendada
                  </button>
                </div>

                {errorEnvio && (
                  <p className="mt-3 text-xs text-rose-400">
                    {errorEnvio}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    enviando ||
                    !textoValido
                  }
                  className="mt-3 rounded-xl bg-(--accent) px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando
                    ? "Publicando..."
                    : "Publicar reseña"}
                </button>
              </form>
            )}

            {cargandoComentarios ? (
              <p className="text-sm text-zinc-500">
                Cargando reseñas...
              </p>
            ) : comentarios.length ===
              0 ? (
              <p className="text-sm text-zinc-500">
                Todavía no hay
                reseñas para esta
                obra. ¡Sé el primero!
              </p>
            ) : (
              <div className="space-y-4">
                {comentarios.map(
                  (comentario) => {
                    const esPropietario =
                      usuario?.id ===
                      comentario.user_id;

                    const estaProcesando =
                      reseniaProcesando ===
                      comentario.id;

                    return (
                      <article
                        key={
                          comentario.id
                        }
                        className="rounded-xl border border-white/5 bg-zinc-900/40 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-xs font-bold text-(--accent)">
                            {comentario
                              .perfiles
                              ?.username ||
                              "Usuario"}

                            <img
                              src={
                                comentario.rating
                                  ? iconoBuena
                                  : iconoMala
                              }
                              alt={
                                comentario.rating
                                  ? "Valoración buena"
                                  : "Valoración mala"
                              }
                              className="h-6 w-6 object-contain"
                            />
                          </span>

                          <span className="font-mono text-[10px] text-zinc-600">
                            {formatearFecha(
                              comentario.created_at,
                            )}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-zinc-300">
                          {
                            comentario.review_text
                          }
                        </p>

                        {usuario && (
                          <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
                            {esPropietario ? (
                              <button
                                type="button"
                                onClick={() =>
                                  eliminarResenia(
                                    comentario,
                                  )
                                }
                                disabled={
                                  estaProcesando
                                }
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/20 disabled:opacity-40"
                              >
                                {estaProcesando
                                  ? "Eliminando..."
                                  : "Eliminar"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirReporte(
                                    comentario,
                                  )
                                }
                                className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                              >
                                Reportar
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {reseniaAReportar && (
        <ReportarReseniaModal
          resenia={
            reseniaAReportar
          }
          onCerrar={() =>
            setReseniaAReportar(
              null,
            )
          }
          onReportado={
            confirmarReporte
          }
        />
      )}
    </div>
  );
};

export default Detalle;