import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ModalPortal from "./ModalPortal";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";

const ETIQUETAS_MOTIVO = {
  spam: "Spam o publicidad",
  lenguaje_ofensivo:
    "Lenguaje ofensivo",
  acoso:
    "Acoso o ataque personal",
  spoiler:
    "Spoiler sin advertencia",
  contenido_inapropiado:
    "Contenido inapropiado",
  otro:
    "Otro motivo",
};

const NotificacionesReportes = () => {
  const {
    usuario,
    esAdmin,
  } = useAuth();

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    reportes,
    setReportes,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState(null);

  const [
    aviso,
    setAviso,
  ] = useState(null);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState(null);

  const [
    permisoNavegador,
    setPermisoNavegador,
  ] = useState(() => {
    if (
      typeof window ===
        "undefined" ||
      !("Notification" in window)
    ) {
      return "no-disponible";
    }

    return Notification.permission;
  });

  const temporizadorAviso =
    useRef(null);

  const cargarReportes =
    useCallback(async () => {
      if (!esAdmin) {
        setReportes([]);
        return;
      }

      setCargando(true);
      setErrorCarga(null);

      const {
        data,
        error,
      } = await supabase
        .from(
          "reportes_resenias",
        )
        .select(`
          id,
          resenia_id,
          reportante_id,
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
              username
            ),
            obra:libreria (
              id,
              titulo,
              cover
            )
          )
        `)
        .eq(
          "estado",
          "pendiente",
        )
        .order("created_at", {
          ascending: false,
        });

      setCargando(false);

      if (error) {
        console.error(
          "Error cargando reportes:",
          error,
        );

        setReportes([]);

        setErrorCarga(
          "No se pudieron cargar los reportes pendientes.",
        );

        return;
      }

      setReportes(data || []);
    }, [esAdmin]);

  const mostrarAviso =
    useCallback((texto) => {
      setAviso(texto);

      window.clearTimeout(
        temporizadorAviso.current,
      );

      temporizadorAviso.current =
        window.setTimeout(() => {
          setAviso(null);
        }, 5000);
    }, []);

  const mostrarNotificacionNavegador =
    useCallback(() => {
      if (
        typeof window ===
          "undefined" ||
        !("Notification" in window) ||
        Notification.permission !==
          "granted"
      ) {
        return;
      }

      try {
        new Notification(
          "Nueva reseña reportada",
          {
            body:
              "Hay una nueva reseña pendiente de revisión en CanonScore.",
          },
        );
      } catch (error) {
        console.error(
          "No se pudo mostrar la notificación:",
          error,
        );
      }
    }, []);

  useEffect(() => {
    if (!esAdmin) {
      setReportes([]);
      setModalAbierto(false);

      return undefined;
    }

    cargarReportes();

    const canal = supabase
      .channel(
        `reportes-admin-${
          usuario?.id || "admin"
        }`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "reportes_resenias",
        },
        (payload) => {
          cargarReportes();

          if (
            payload.eventType ===
            "INSERT"
          ) {
            mostrarAviso(
              "Una nueva reseña fue reportada.",
            );

            mostrarNotificacionNavegador();
          }
        },
      )
      .subscribe((estado) => {
        if (
          estado ===
          "CHANNEL_ERROR"
        ) {
          console.error(
            "No se pudo conectar al canal de reportes.",
          );
        }
      });

    return () => {
      window.clearTimeout(
        temporizadorAviso.current,
      );

      supabase.removeChannel(
        canal,
      );
    };
  }, [
    esAdmin,
    usuario?.id,
    cargarReportes,
    mostrarAviso,
    mostrarNotificacionNavegador,
  ]);

  const abrirModal = () => {
    setAviso(null);
    setModalAbierto(true);
    cargarReportes();
  };

  const activarNotificacionesNavegador =
    async () => {
      if (
        typeof window ===
          "undefined" ||
        !("Notification" in window)
      ) {
        alert(
          "Este navegador no admite notificaciones.",
        );

        return;
      }

      const permiso =
        await Notification.requestPermission();

      setPermisoNavegador(
        permiso,
      );

      if (
        permiso === "granted"
      ) {
        mostrarAviso(
          "Las notificaciones del navegador fueron activadas.",
        );
      }

      if (
        permiso === "denied"
      ) {
        alert(
          "Las notificaciones están bloqueadas. Puedes activarlas desde los permisos del sitio.",
        );
      }
    };

  const descartarReporte =
    async (reporte) => {
      if (!usuario || !esAdmin) {
        return;
      }

      const confirmado =
        window.confirm(
          "¿Deseas descartar este reporte? La reseña permanecerá publicada.",
        );

      if (!confirmado) return;

      setProcesandoId(
        reporte.id,
      );

      const {
        data,
        error,
      } = await supabase
        .from(
          "reportes_resenias",
        )
        .update({
          estado: "descartado",
          revisado_at:
            new Date().toISOString(),
          revisado_por:
            usuario.id,
        })
        .eq("id", reporte.id)
        .select("id")
        .maybeSingle();

      setProcesandoId(null);

      if (error) {
        console.error(
          "Error descartando reporte:",
          error,
        );

        alert(
          "No se pudo descartar el reporte.",
        );

        return;
      }

      if (!data) {
        alert(
          "El reporte ya no existe o no tienes permiso para modificarlo.",
        );

        await cargarReportes();
        return;
      }

      setReportes(
        (actuales) =>
          actuales.filter(
            (actual) =>
              actual.id !==
              reporte.id,
          ),
      );

      mostrarAviso(
        "El reporte fue descartado.",
      );
    };

  const eliminarReseniaReportada =
    async (reporte) => {
      if (!esAdmin) return;

      const confirmado =
        window.confirm(
          "¿Deseas eliminar definitivamente esta reseña? Esta acción no se puede deshacer.",
        );

      if (!confirmado) return;

      setProcesandoId(
        reporte.id,
      );

      const {
        data,
        error,
      } = await supabase
        .from("resenias")
        .delete()
        .eq(
          "id",
          reporte.resenia_id,
        )
        .select("id")
        .maybeSingle();

      setProcesandoId(null);

      if (error) {
        console.error(
          "Error eliminando reseña:",
          error,
        );

        alert(
          "No se pudo eliminar la reseña.",
        );

        return;
      }

      if (!data) {
        alert(
          "La reseña ya no existe o no tienes permiso para eliminarla.",
        );

        await cargarReportes();
        return;
      }

      setReportes(
        (actuales) =>
          actuales.filter(
            (actual) =>
              actual.id !==
              reporte.id,
          ),
      );

      mostrarAviso(
        "La reseña reportada fue eliminada.",
      );
    };

  const formatearFecha = (
    fechaISO,
  ) => {
    if (!fechaISO) return "";

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(
      new Date(fechaISO),
    );
  };

  if (!esAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={abrirModal}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-400 transition-all hover:border-(--accent)/40 hover:bg-white/5 hover:text-(--accent)"
        aria-label="Abrir reportes"
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
            {reportes.length > 99
              ? "99+"
              : reportes.length}
          </span>
        )}
      </button>

      {aviso &&
        createPortal(
          <button
            type="button"
            onClick={abrirModal}
            className="fixed right-5 top-20 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-amber-500/30 bg-zinc-950 px-5 py-4 text-left shadow-2xl transition-transform hover:scale-[1.01]"
            style={{
              zIndex:
                2147483646,
            }}
          >
            <p className="text-xs font-black uppercase tracking-widest text-amber-300">
              Notificación
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              {aviso}
            </p>

            <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-600">
              Presiona para revisar
            </p>
          </button>,
          document.body,
        )}

      {modalAbierto && (
        <ModalPortal
          onCerrar={() =>
            setModalAbierto(false)
          }
        >
          <div
            className="relative flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-reportes"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2
                  id="titulo-reportes"
                  className="text-lg font-black uppercase tracking-widest text-(--accent)"
                >
                  Reportes de reseñas
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {reportes.length}{" "}
                  {reportes.length ===
                  1
                    ? "reporte pendiente"
                    : "reportes pendientes"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalAbierto(
                    false,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                aria-label="Cerrar reportes"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>

            <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {permisoNavegador ===
                  "default" && (
                  <button
                    type="button"
                    onClick={
                      activarNotificacionesNavegador
                    }
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 transition-all hover:bg-amber-500/20"
                  >
                    Activar avisos del
                    navegador
                  </button>
                )}

                {permisoNavegador ===
                  "denied" && (
                  <p className="text-xs text-rose-400">
                    Las notificaciones
                    están bloqueadas.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={cargarReportes}
                disabled={cargando}
                className="self-end rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-white/10 disabled:opacity-40"
              >
                {cargando
                  ? "Actualizando..."
                  : "Actualizar"}
              </button>
            </div>

            <div className="min-h-0 grow overflow-y-auto p-6">
              {errorCarga && (
                <div className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  {errorCarga}
                </div>
              )}

              {cargando &&
              reportes.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center">
                  <p className="text-sm text-zinc-500">
                    Cargando reportes...
                  </p>
                </div>
              ) : reportes.length ===
                0 ? (
                <div className="flex min-h-64 items-center justify-center">
                  <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>

                    <p className="mt-4 font-bold text-white">
                      No hay reportes
                      pendientes
                    </p>

                    <p className="mt-2 text-xs text-zinc-500">
                      Los nuevos reportes
                      aparecerán
                      automáticamente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {reportes.map(
                    (reporte) => {
                      const resenia =
                        reporte.resenia;

                      const procesando =
                        procesandoId ===
                        reporte.id;

                      return (
                        <article
                          key={reporte.id}
                          className="flex flex-col rounded-2xl border border-amber-500/20 bg-zinc-900 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white">
                                {resenia
                                  ?.obra
                                  ?.titulo ||
                                  "Obra desconocida"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                Reseña de{" "}
                                {resenia
                                  ?.autor
                                  ?.username ||
                                  "Usuario"}
                              </p>
                            </div>

                            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-300">
                              Pendiente
                            </span>
                          </div>

                          <p className="mt-3 text-[10px] font-mono text-zinc-600">
                            {formatearFecha(
                              reporte.created_at,
                            )}
                          </p>

                          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950 p-4">
                            <div className="mb-3 flex items-center gap-2">
                              <img
                                src={
                                  resenia?.rating
                                    ? iconoBuena
                                    : iconoMala
                                }
                                alt={
                                  resenia?.rating
                                    ? "Valoración buena"
                                    : "Valoración mala"
                                }
                                className="h-7 w-7 object-contain"
                              />

                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Reseña reportada
                              </span>
                            </div>

                            <p className="text-sm leading-relaxed text-zinc-300">
                              {resenia
                                ?.review_text ||
                                "La reseña ya no está disponible."}
                            </p>
                          </div>

                          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                              {ETIQUETAS_MOTIVO[
                                reporte
                                  .motivo
                              ] ||
                                reporte.motivo}
                            </p>

                            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                              {reporte.detalles ||
                                "El usuario no agregó detalles."}
                            </p>
                          </div>

                          <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                descartarReporte(
                                  reporte,
                                )
                              }
                              disabled={
                                procesando
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {procesando
                                ? "Procesando..."
                                : "Descartar"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                eliminarReseniaReportada(
                                  reporte,
                                )
                              }
                              disabled={
                                procesando ||
                                !resenia
                              }
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-400 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {procesando
                                ? "Procesando..."
                                : "Eliminar reseña"}
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default NotificacionesReportes;