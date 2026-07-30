import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { supabase } from "../config/supabaseClient";
import ImagenConPlaceholder from "./ImagenConPlaceholder";
import { useAuth } from "../context/AuthContext";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";

const ETIQUETAS_MOTIVO = {
  spam: "Spam o publicidad",
  lenguaje_ofensivo: "Lenguaje ofensivo",
  acoso: "Acoso o ataque personal",
  spoiler: "Spoiler sin advertencia",
  contenido_inapropiado: "Contenido inapropiado",
  otro: "Otro motivo",
};

const NotificacionesReportes = () => {
  const { usuario, esAdmin } = useAuth();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);

  const temporizadorAviso = useRef(null);

  const cargarReportes = useCallback(async () => {
    if (!esAdmin) {
      setReportes([]);
      return;
    }

    setCargando(true);
    setErrorCarga(null);

    const { data, error } = await supabase
      .from("reportes_resenias")
      .select(`
        id,
        resenia_id,
        motivo,
        detalles,
        estado,
        created_at,
        resenia:resenias (
          id,
          user_id,
          rating,
          review_text,
          created_at,
          autor:perfiles (
            username,
            pfp
          ),
          obra:libreria (
            id,
            titulo,
            cover,
            tipo
          )
        )
      `)
      .eq("estado", "pendiente")
      .order("created_at", {
        ascending: false,
      });

    setCargando(false);

    if (error) {
      console.error("Error cargando reportes:", error);
      setReportes([]);
      setErrorCarga(
        "No se pudieron cargar los reportes. Revisa la consola y las políticas RLS.",
      );
      return;
    }

    setReportes(data || []);
  }, [esAdmin]);

  const mostrarAviso = useCallback((mensaje) => {
    setAviso(mensaje);

    window.clearTimeout(temporizadorAviso.current);

    temporizadorAviso.current = window.setTimeout(() => {
      setAviso(null);
    }, 5000);
  }, []);

  const mostrarAvisoNavegador = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      new Notification("Nueva reseña reportada", {
        body: "Hay una reseña pendiente de revisión en CanonScore.",
      });
    } catch (error) {
      console.error(
        "No se pudo mostrar la notificación del navegador:",
        error,
      );
    }
  }, []);

  useEffect(() => {
    if (!esAdmin) {
      setModalAbierto(false);
      setReportes([]);
      return undefined;
    }

    cargarReportes();

    const canal = supabase
      .channel(`reportes-admin-${usuario?.id || "sin-id"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reportes_resenias",
        },
        (payload) => {
          cargarReportes();

          if (payload.eventType === "INSERT") {
            mostrarAviso("Una nueva reseña fue reportada.");
            mostrarAvisoNavegador();
          }
        },
      )
      .subscribe((estado) => {
        if (estado === "CHANNEL_ERROR") {
          console.error(
            "No se pudo conectar al canal de reportes.",
          );
        }
      });

    return () => {
      window.clearTimeout(temporizadorAviso.current);
      supabase.removeChannel(canal);
    };
  }, [
    esAdmin,
    usuario?.id,
    cargarReportes,
    mostrarAviso,
    mostrarAvisoNavegador,
  ]);

  useEffect(() => {
    if (!modalAbierto) return undefined;

    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        setModalAbierto(false);
      }
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [modalAbierto]);

  const activarNotificacionesNavegador = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador no admite notificaciones.");
      return;
    }

    const permiso = await Notification.requestPermission();

    if (permiso === "granted") {
      mostrarAviso(
        "Las notificaciones del navegador fueron activadas.",
      );
    } else if (permiso === "denied") {
      alert(
        "Las notificaciones están bloqueadas. Actívalas desde los permisos del sitio.",
      );
    }
  };

  const descartarReporte = async (reporte) => {
    if (!usuario || !esAdmin) return;

    const confirmado = window.confirm(
      "¿Descartar este reporte? La reseña permanecerá publicada.",
    );

    if (!confirmado) return;

    setProcesandoId(reporte.id);

    const { data, error } = await supabase
      .from("reportes_resenias")
      .update({
        estado: "descartado",
        revisado_at: new Date().toISOString(),
        revisado_por: usuario.id,
      })
      .eq("id", reporte.id)
      .select("id")
      .maybeSingle();

    setProcesandoId(null);

    if (error) {
      console.error("Error descartando reporte:", error);
      alert("No se pudo descartar el reporte.");
      return;
    }

    if (!data) {
      alert(
        "El reporte ya no existe o no tienes permiso para modificarlo.",
      );
      await cargarReportes();
      return;
    }

    setReportes((actuales) =>
      actuales.filter((actual) => actual.id !== reporte.id),
    );

    mostrarAviso("El reporte fue descartado.");
  };

  const eliminarResenia = async (reporte) => {
    if (!esAdmin) return;

    const confirmado = window.confirm(
      "¿Eliminar definitivamente esta reseña? Esta acción no se puede deshacer.",
    );

    if (!confirmado) return;

    setProcesandoId(reporte.id);

    const { data, error } = await supabase
      .from("resenias")
      .delete()
      .eq("id", reporte.resenia_id)
      .select("id")
      .maybeSingle();

    setProcesandoId(null);

    if (error) {
      console.error("Error eliminando reseña:", error);
      alert("No se pudo eliminar la reseña.");
      return;
    }

    if (!data) {
      alert(
        "La reseña ya no existe o no tienes permiso para eliminarla.",
      );
      await cargarReportes();
      return;
    }

    setReportes((actuales) =>
      actuales.filter((actual) => actual.id !== reporte.id),
    );

    mostrarAviso("La reseña reportada fue eliminada.");
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";

    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(fechaISO));
  };

  if (!esAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-input) text-(--color-text-secondary) transition-all hover:border-(--accent)/40 hover:bg-(--accent)/10 hover:text-(--accent)"
        aria-label="Abrir reportes de reseñas"
        title="Reportes pendientes"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {reportes.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
            {reportes.length > 99 ? "99+" : reportes.length}
          </span>
        )}
      </button>

      {aviso &&
        createPortal(
          <button
            type="button"
            onClick={() => {
              setAviso(null);
              setModalAbierto(true);
            }}
            className="theme-surface fixed right-4 top-20 z-210 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-(--accent)/30 px-5 py-4 text-left shadow-2xl transition-transform hover:scale-[1.01] sm:right-5"
          >
            <p className="text-xs font-black uppercase tracking-widest text-(--accent)">
              Notificación de administración
            </p>
            <p className="mt-1 text-sm text-zinc-300">{aviso}</p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">
              Presiona para revisar
            </p>
          </button>,
          document.body,
        )}

      {modalAbierto &&
        createPortal(
          <div className="fixed inset-0 z-200 flex items-center justify-center p-3 sm:p-6">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
              aria-label="Cerrar reportes"
            />

            <section className="theme-surface relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-(--color-border) p-5 sm:p-6">
                <div>
                  <h2 className="theme-modal-title text-lg font-black uppercase tracking-widest">
                    Reportes de reseñas
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {reportes.length}{" "}
                    {reportes.length === 1
                      ? "reporte pendiente"
                      : "reportes pendientes"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface-soft) text-(--color-text-secondary) transition-colors hover:text-(--color-text)"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </header>

              <div className="flex shrink-0 flex-col gap-3 border-b border-(--color-border) p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                {typeof Notification !== "undefined" &&
                  Notification.permission === "default" && (
                    <button
                      type="button"
                      onClick={activarNotificacionesNavegador}
                      className="rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-(--accent) transition-colors hover:bg-(--accent)/20"
                    >
                      Activar avisos del navegador
                    </button>
                  )}

                <button
                  type="button"
                  onClick={cargarReportes}
                  disabled={cargando}
                  className="self-end rounded-xl border border-(--color-border) bg-(--color-surface-soft) px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-(--color-text-secondary) transition-colors hover:border-(--color-border-strong) hover:text-(--color-text) disabled:opacity-40 sm:ml-auto"
                >
                  {cargando ? "Actualizando..." : "Actualizar"}
                </button>
              </div>

              <div className="min-h-0 grow overflow-y-auto p-5 sm:p-6">
                {errorCarga && (
                  <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                    {errorCarga}
                  </p>
                )}

                {cargando && reportes.length === 0 ? (
                  <p className="py-12 text-center text-sm text-zinc-500">
                    Cargando reportes...
                  </p>
                ) : reportes.length === 0 ? (
                  <div className="theme-surface-soft rounded-2xl border px-6 py-14 text-center">
                    <p className="text-base font-bold text-zinc-300">
                      No hay reportes pendientes
                    </p>
                    <p className="mt-2 text-sm text-zinc-600">
                      Los nuevos reportes aparecerán automáticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportes.map((reporte) => {
                      const resenia = reporte.resenia;
                      const procesando = procesandoId === reporte.id;
                      const autor = resenia?.autor;
                      const obra = resenia?.obra;

                      return (
                        <article
                          key={reporte.id}
                          className="theme-surface-soft rounded-2xl border p-4 sm:p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="flex min-w-0 grow items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--color-border) bg-(--color-surface)">
                                {autor?.pfp ? (
                                  <img
                                    src={autor.pfp}
                                    alt={autor.username || "Usuario"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-black uppercase text-(--accent)">
                                    {(autor?.username || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0 grow">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-bold text-white">
                                    {autor?.username || "Usuario"}
                                  </p>

                                  <img
                                    src={
                                      resenia?.rating
                                        ? iconoBuena
                                        : iconoMala
                                    }
                                    alt={
                                      resenia?.rating
                                        ? "Valoración positiva"
                                        : "Valoración negativa"
                                    }
                                    className="h-6 w-6 object-contain"
                                  />
                                </div>

                                <p className="mt-1 text-xs text-zinc-500">
                                  {obra?.titulo || "Obra no disponible"}
                                  {obra?.tipo ? ` · ${obra.tipo}` : ""}
                                </p>

                                <p className="mt-1 font-mono text-[10px] text-zinc-600">
                                  Reportado {formatearFecha(reporte.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg border border-(--color-border) bg-(--color-image-bg)">
                              <ImagenConPlaceholder
                                src={obra?.cover}
                                alt={obra?.titulo || "Portada"}
                                className="h-full w-full object-cover"
                                iconClassName="h-7 w-7"
                              />
                            </div>
                          </div>

                          <div className="theme-surface mt-4 rounded-xl border p-4">
                            <p className="text-sm leading-relaxed text-zinc-300">
                              {resenia?.review_text ||
                                "La reseña ya no está disponible."}
                            </p>
                          </div>

                          <div className="mt-3 rounded-xl border border-(--accent)/10 bg-(--accent)/5 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-(--accent)">
                              {ETIQUETAS_MOTIVO[reporte.motivo] ||
                                reporte.motivo}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                              {reporte.detalles ||
                                "El usuario no agregó detalles."}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => descartarReporte(reporte)}
                              disabled={procesando}
                              className="rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-(--color-text-secondary) transition-colors hover:border-(--color-border-strong) hover:text-(--color-text) disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {procesando ? "Procesando..." : "Descartar"}
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarResenia(reporte)}
                              disabled={procesando || !resenia}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {procesando
                                ? "Procesando..."
                                : "Eliminar reseña"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NotificacionesReportes;