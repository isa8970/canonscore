import { useEffect, useMemo, useState } from "react";

import { supabase } from "../config/supabaseClient";
import ImagenConPlaceholder from "./ImagenConPlaceholder";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";
import favoritoLleno from "/Favoritos-lleno.png";
import guardarLleno from "/Guardar-lleno.png";

const NOMBRE_FAVORITOS = "favoritos";

const PerfilPublico = ({ perfilId, onVolver, onVerDetalle }) => {
  const [perfilPublico, setPerfilPublico] = useState(null);
  const [resenias, setResenias] = useState([]);
  const [listasPublicas, setListasPublicas] = useState([]);
  const [itemsPorLista, setItemsPorLista] = useState({});

  const [tab, setTab] = useState("resenias");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorListas, setErrorListas] = useState(null);

  useEffect(() => {
    if (!perfilId) return undefined;

    let activo = true;

    const cargarPerfilPublico = async () => {
      setCargando(true);
      setError(null);
      setErrorListas(null);
      setPerfilPublico(null);
      setResenias([]);
      setListasPublicas([]);
      setItemsPorLista({});
      setTab("resenias");

      /*
       * La tabla listas de CanonScore no necesita created_at para esta vista.
       * Se consulta con la misma relación anidada que ya usa Listas.jsx.
       */
      const [resultadoPerfil, resultadoResenias, resultadoListas] =
        await Promise.all([
          supabase
            .from("perfiles")
            .select("id, username, pfp, bio, rol")
            .eq("id", perfilId)
            .maybeSingle(),

          supabase
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
                banner,
                tipo,
                anio_pub,
                sinopsis,
                generos
              )
            `)
            .eq("user_id", perfilId)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("listas")
            .select(`
              id,
              nombre,
              es_privada,
              lista_items (
                id,
                libreria_id,
                libreria (
                  id,
                  titulo,
                  cover,
                  banner,
                  tipo,
                  anio_pub,
                  sinopsis,
                  generos
                )
              )
            `)
            .eq("user_id", perfilId)
            .eq("es_privada", false)
            .order("id", {
              ascending: true,
            }),
        ]);

      if (!activo) return;

      if (resultadoPerfil.error) {
        console.error(
          "Error cargando perfil público:",
          resultadoPerfil.error,
        );

        setError(
          `No se pudo cargar este perfil: ${
            resultadoPerfil.error.message || "error desconocido"
          }`,
        );
        setCargando(false);
        return;
      }

      if (!resultadoPerfil.data) {
        setError("No se encontró este perfil.");
        setCargando(false);
        return;
      }

      setPerfilPublico(resultadoPerfil.data);

      if (resultadoResenias.error) {
        console.error(
          "Error cargando reseñas públicas:",
          resultadoResenias.error,
        );
        setResenias([]);
      } else {
        setResenias(resultadoResenias.data || []);
      }

      if (resultadoListas.error) {
        console.error(
          "Error cargando listas públicas:",
          resultadoListas.error,
        );

        setListasPublicas([]);
        setItemsPorLista({});
        setErrorListas(
          `No fue posible consultar las listas públicas: ${
            resultadoListas.error.message || "error desconocido"
          }`,
        );
        setCargando(false);
        return;
      }

      const listas = (resultadoListas.data || []).map((lista) => ({
        ...lista,
        lista_items: lista.lista_items || [],
      }));

      setListasPublicas(listas);

      const agrupados = listas.reduce((acumulador, lista) => {
        acumulador[String(lista.id)] = lista.lista_items || [];
        return acumulador;
      }, {});

      setItemsPorLista(agrupados);
      setCargando(false);
    };

    cargarPerfilPublico();

    return () => {
      activo = false;
    };
  }, [perfilId]);

  const totalObrasPublicas = useMemo(() => {
    return Object.values(itemsPorLista).reduce(
      (total, items) => total + items.length,
      0,
    );
  }, [itemsPorLista]);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(fechaISO));
  };

  const abrirObra = (obra) => {
    if (!obra?.id) return;
    onVerDetalle?.(obra);
  };

  if (cargando) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-225">
          <button
            type="button"
            onClick={onVolver}
            className="mb-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
          >
            ← Volver
          </button>

          <p className="text-sm text-zinc-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !perfilPublico) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-225">
          <button
            type="button"
            onClick={onVolver}
            className="mb-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
          >
            ← Volver
          </button>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-300">
            {error || "No se pudo cargar este perfil."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-24 text-white">
      <div className="mx-auto max-w-225 px-6 pt-8">
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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

        <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-10">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--accent)/20 bg-(--accent)/10">
              {perfilPublico.pfp ? (
                <img
                  src={perfilPublico.pfp}
                  alt={perfilPublico.username || "Foto de perfil"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-12 w-12 text-(--accent)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
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

            <div className="flex min-w-0 flex-col items-center text-center md:items-start md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <h1 className="theme-profile-username break-all text-3xl font-black tracking-tight">
                  {perfilPublico.username || "Usuario"}
                </h1>

                {perfilPublico.rol === "administrador" && (
                  <span className="rounded-full border border-(--accent)/20 bg-(--accent)/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-(--accent)">
                    Administrador
                  </span>
                )}
              </div>

              {perfilPublico.bio ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
                  {perfilPublico.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-zinc-600">
                  Este usuario todavía no ha agregado una biografía.
                </p>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400">
                  <strong className="text-white">{resenias.length}</strong>{" "}
                  reseñas
                </span>

                <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400">
                  <strong className="text-white">{listasPublicas.length}</strong>{" "}
                  listas públicas
                </span>

                <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-400">
                  <strong className="text-white">{totalObrasPublicas}</strong>{" "}
                  obras públicas
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setTab("resenias")}
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "resenias"
                  ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Reseñas ({resenias.length})
            </button>

            <button
              type="button"
              onClick={() => setTab("listas")}
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "listas"
                  ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Listas públicas ({listasPublicas.length})
            </button>
          </div>

          {tab === "resenias" &&
            (resenias.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Este usuario todavía no ha publicado reseñas.
              </p>
            ) : (
              <div className="space-y-3">
                {resenias.map((resenia) => (
                  <article
                    key={resenia.id}
                    className="rounded-xl border border-white/5 bg-zinc-900/40 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => abrirObra(resenia.libreria)}
                        className="group flex min-w-0 items-center gap-3 text-left"
                      >
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800">
                          <ImagenConPlaceholder
                            src={resenia.libreria?.cover}
                            alt={resenia.libreria?.titulo || "Portada"}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            iconClassName="h-6 w-6"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white transition-colors group-hover:text-(--accent)">
                            {resenia.libreria?.titulo || "Obra eliminada"}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <img
                              src={resenia.rating ? iconoBuena : iconoMala}
                              alt={
                                resenia.rating
                                  ? "Reseña positiva"
                                  : "Reseña negativa"
                              }
                              className="h-5 w-5 object-contain"
                            />

                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider ${
                                resenia.rating
                                  ? "text-amber-300"
                                  : "text-rose-400"
                              }`}
                            >
                              {resenia.rating
                                ? "Recomendada"
                                : "No recomendada"}
                            </span>
                          </div>
                        </div>
                      </button>

                      <span className="shrink-0 font-mono text-[9px] text-zinc-600">
                        {formatearFecha(resenia.created_at)}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-zinc-400">
                      {resenia.review_text}
                    </p>
                  </article>
                ))}
              </div>
            ))}

          {tab === "listas" &&
            (errorListas ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                {errorListas}
              </div>
            ) : listasPublicas.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Este usuario no tiene listas públicas.
              </p>
            ) : (
              <div className="space-y-6">
                {listasPublicas.map((lista) => {
                  const items = itemsPorLista[String(lista.id)] || [];
                  const esFavoritos =
                    String(lista.nombre || "").trim().toLowerCase() ===
                    NOMBRE_FAVORITOS;

                  return (
                    <article
                      key={lista.id}
                      className="rounded-2xl border border-white/10 bg-zinc-900/30 p-5"
                    >
                      <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4">
                        <img
                          src={esFavoritos ? favoritoLleno : guardarLleno}
                          alt=""
                          aria-hidden="true"
                          className="h-7 w-7 object-contain"
                        />

                        <div>
                          <h2 className="text-lg font-black text-white">
                            {lista.nombre}
                          </h2>
                          <p className="text-xs text-zinc-500">
                            {items.length}{" "}
                            {items.length === 1 ? "obra" : "obras"}
                          </p>
                        </div>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-zinc-600">
                          Esta lista pública está vacía.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {items.map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => abrirObra(item.libreria)}
                              className="group overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 text-left transition-all hover:border-(--accent)/30"
                            >
                              <div className="aspect-3/4 bg-zinc-800">
                                <ImagenConPlaceholder
                                  src={item.libreria?.cover}
                                  alt={item.libreria?.titulo || "Portada"}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  iconClassName="h-12 w-12"
                                />
                              </div>

                              <div className="p-3">
                                <p className="line-clamp-1 text-xs font-bold text-white transition-colors group-hover:text-(--accent)">
                                  {item.libreria?.titulo || "Obra eliminada"}
                                </p>
                                <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-600">
                                  {item.libreria?.tipo || "Obra"}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ))}
        </section>
      </div>
    </div>
  );
};

export default PerfilPublico;