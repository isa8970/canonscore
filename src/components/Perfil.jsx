import React, {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabaseClient";
import EditarPerfilModal from "./EditarPerfilModal";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";

const Perfil = ({ onVolver }) => {
  const { usuario, perfil } = useAuth();

  const [
    mostrarEdicion,
    setMostrarEdicion,
  ] = useState(false);

  const [tab, setTab] =
    useState("resenas");

  const [
    misResenias,
    setMisResenias,
  ] = useState([]);

  const [
    cargandoResenias,
    setCargandoResenias,
  ] = useState(true);

  const [
    favoritosPublicos,
    setFavoritosPublicos,
  ] = useState(false);

  const [
    misFavoritos,
    setMisFavoritos,
  ] = useState([]);

  const [
    cargandoFavoritos,
    setCargandoFavoritos,
  ] = useState(true);

  useEffect(() => {
    if (!usuario) return undefined;

    let mounted = true;

    const cargarResenias = async () => {
      setCargandoResenias(true);

      const { data, error } =
        await supabase
          .from("resenias")
          .select(`
            id,
            rating,
            review_text,
            created_at,
            libreria (
              id,
              titulo,
              cover,
              tipo
            )
          `)
          .eq("user_id", usuario.id)
          .order("created_at", {
            ascending: false,
          });

      if (!mounted) return;

      if (error) {
        console.error(
          "Error cargando tus reseñas:",
          error,
        );

        setMisResenias([]);
      } else {
        setMisResenias(data || []);
      }

      setCargandoResenias(false);
    };

    cargarResenias();

    return () => {
      mounted = false;
    };
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return undefined;

    let mounted = true;

    const cargarFavoritos = async () => {
      setCargandoFavoritos(true);

      const {
        data: lista,
        error: listaError,
      } = await supabase
        .from("listas")
        .select("id, es_privada")
        .eq("user_id", usuario.id)
        .eq("nombre", "Favoritos")
        .maybeSingle();

      if (!mounted) return;

      if (listaError || !lista) {
        if (listaError) {
          console.error(
            "Error cargando la lista de Favoritos:",
            listaError,
          );
        }

        setFavoritosPublicos(false);
        setMisFavoritos([]);
        setCargandoFavoritos(false);

        return;
      }

      const esPublica =
        !lista.es_privada;

      setFavoritosPublicos(esPublica);

      if (!esPublica) {
        setMisFavoritos([]);
        setCargandoFavoritos(false);

        return;
      }

      const {
        data: items,
        error: itemsError,
      } = await supabase
        .from("lista_items")
        .select(`
          id,
          libreria (
            id,
            titulo,
            cover,
            tipo
          )
        `)
        .eq("lista_id", lista.id);

      if (!mounted) return;

      if (itemsError) {
        console.error(
          "Error cargando items de Favoritos:",
          itemsError,
        );

        setMisFavoritos([]);
      } else {
        setMisFavoritos(items || []);
      }

      setCargandoFavoritos(false);
    };

    cargarFavoritos();

    return () => {
      mounted = false;
    };
  }, [usuario]);

  useEffect(() => {
    if (
      tab === "favoritos" &&
      !favoritosPublicos &&
      !cargandoFavoritos
    ) {
      setTab("resenas");
    }
  }, [
    tab,
    favoritosPublicos,
    cargandoFavoritos,
  ]);

  if (!usuario) return null;

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";

    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    ).format(new Date(fechaISO));
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-24 text-white">
      <div className="mx-auto flex max-w-225 items-center justify-between px-6 pt-8">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all hover:bg-white/10"
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

        <button
          type="button"
          onClick={() =>
            setMostrarEdicion(true)
          }
          title="Editar perfil"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10"
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
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>

      <div className="mx-auto mt-10 max-w-225 px-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-10">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-(--accent)/20 bg-(--accent)/10">
                {perfil?.pfp ? (
                  <img
                    src={perfil.pfp}
                    alt={
                      perfil.username ||
                      "Foto de perfil"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-10 w-10 text-(--accent)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>

              <span className="rounded-md border border-(--accent)/20 bg-(--accent)/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-(--accent)">
                {perfil?.rol ===
                "administrador"
                  ? "Administrador"
                  : "Usuario registrado"}
              </span>
            </div>

            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <h2 className="mb-1 text-2xl font-black tracking-tight">
                {perfil?.username ||
                  "Usuario"}
              </h2>

              <p className="mb-3 text-xs text-zinc-600">
                {usuario.email}
              </p>

              {perfil?.bio && (
                <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                  {perfil.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setTab("resenas")
              }
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "resenas"
                  ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Reseñas ({misResenias.length})
            </button>

            {!cargandoFavoritos &&
              favoritosPublicos && (
                <button
                  type="button"
                  onClick={() =>
                    setTab(
                      "favoritos",
                    )
                  }
                  className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab ===
                    "favoritos"
                      ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  Favoritos (
                  {misFavoritos.length})
                </button>
              )}
          </div>

          {tab === "resenas" &&
            (cargandoResenias ? (
              <p className="text-sm text-zinc-500">
                Cargando tus reseñas...
              </p>
            ) : misResenias.length ===
              0 ? (
              <p className="text-sm text-zinc-500">
                Todavía no has publicado
                ninguna reseña.
              </p>
            ) : (
              <div className="space-y-3">
                {misResenias.map(
                  (resenia) => (
                    <article
                      key={resenia.id}
                      className="rounded-xl border border-white/5 bg-zinc-900/40 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={
                              resenia.rating
                                ? iconoBuena
                                : iconoMala
                            }
                            alt={
                              resenia.rating
                                ? "Reseña positiva"
                                : "Reseña negativa"
                            }
                            title={
                              resenia.rating
                                ? "Recomendada"
                                : "No recomendada"
                            }
                            className="h-7 w-7 shrink-0 object-contain"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {resenia
                                .libreria
                                ?.titulo ||
                                "Obra eliminada"}
                            </p>

                            <p
                              className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                resenia.rating
                                  ? "text-amber-300"
                                  : "text-rose-400"
                              }`}
                            >
                              {resenia.rating
                                ? "Recomendada"
                                : "No recomendada"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-mono text-[10px] uppercase text-zinc-600">
                            {resenia
                              .libreria
                              ?.tipo ||
                              "Obra"}
                          </p>

                          <p className="mt-1 font-mono text-[9px] text-zinc-700">
                            {formatearFecha(
                              resenia.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-zinc-400">
                        {
                          resenia.review_text
                        }
                      </p>
                    </article>
                  ),
                )}
              </div>
            ))}

          {tab === "favoritos" &&
            favoritosPublicos &&
            (cargandoFavoritos ? (
              <p className="text-sm text-zinc-500">
                Cargando tus favoritos...
              </p>
            ) : misFavoritos.length ===
              0 ? (
              <p className="text-sm text-zinc-500">
                Todavía no tienes títulos
                guardados en Favoritos.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {misFavoritos.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40"
                    >
                      <div className="aspect-3/4 bg-zinc-800">
                        {item.libreria
                          ?.cover ? (
                          <img
                            src={
                              item
                                .libreria
                                .cover
                            }
                            alt={
                              item
                                .libreria
                                .titulo
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                            Sin portada
                          </div>
                        )}
                      </div>

                      <div className="p-2.5">
                        <p className="line-clamp-1 text-xs font-bold text-white">
                          {item.libreria
                            ?.titulo ||
                            "Obra eliminada"}
                        </p>

                        <p className="text-[10px] uppercase text-zinc-500">
                          {item.libreria
                            ?.tipo ||
                            "Obra"}
                        </p>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ))}
        </div>
      </div>

      {mostrarEdicion && (
        <EditarPerfilModal
          onCerrar={() =>
            setMostrarEdicion(false)
          }
        />
      )}
    </div>
  );
};

export default Perfil;