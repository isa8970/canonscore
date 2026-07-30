import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabaseClient";
import EditarPerfilModal from "./EditarPerfilModal";
import ImagenConPlaceholder from "./ImagenConPlaceholder";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";
import estrellaLlena from "/Favoritos-lleno.png";

const NOMBRE_FAVORITOS = "Favoritos";

const Perfil = ({ onVolver, onVerDetalle }) => {
  const { usuario, perfil } = useAuth();

  const [mostrarEdicion, setMostrarEdicion] = useState(false);
  const [tab, setTab] = useState("resenas");

  const [misResenias, setMisResenias] = useState([]);
  const [cargandoResenias, setCargandoResenias] = useState(true);

  const [listaFavoritosId, setListaFavoritosId] = useState(null);
  const [favoritosPublicos, setFavoritosPublicos] = useState(false);
  const [misFavoritos, setMisFavoritos] = useState([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(true);
  const [actualizandoPrivacidad, setActualizandoPrivacidad] = useState(false);
  const [mensajeFavoritos, setMensajeFavoritos] = useState(null);
  const [errorFavoritos, setErrorFavoritos] = useState(null);

  useEffect(() => {
    if (!usuario) return undefined;

    let mounted = true;

    const cargarResenias = async () => {
      setCargandoResenias(true);

      const { data, error } = await supabase
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
        .eq("user_id", usuario.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Error cargando tus reseñas:", error);
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
  }, [usuario?.id]);

  useEffect(() => {
    if (!usuario?.id) return undefined;

    let mounted = true;

    const obtenerOCrearFavoritos = async () => {
      const { data: existente, error: buscarError } = await supabase
        .from("listas")
        .select("id, es_privada")
        .eq("user_id", usuario.id)
        .eq("nombre", NOMBRE_FAVORITOS)
        .maybeSingle();

      if (buscarError) throw buscarError;
      if (existente) return existente;

      const { data: creada, error: crearError } = await supabase
        .from("listas")
        .insert({
          user_id: usuario.id,
          nombre: NOMBRE_FAVORITOS,
          es_privada: true,
        })
        .select("id, es_privada")
        .single();

      if (!crearError) return creada;

      if (crearError.code === "23505") {
        const { data: recuperada, error: recuperarError } = await supabase
          .from("listas")
          .select("id, es_privada")
          .eq("user_id", usuario.id)
          .eq("nombre", NOMBRE_FAVORITOS)
          .single();

        if (recuperarError) throw recuperarError;
        return recuperada;
      }

      throw crearError;
    };

    const cargarFavoritos = async () => {
      setCargandoFavoritos(true);
      setErrorFavoritos(null);

      try {
        const lista = await obtenerOCrearFavoritos();

        if (!mounted) return;

        setListaFavoritosId(lista.id);
        setFavoritosPublicos(!lista.es_privada);

        const { data: items, error: itemsError } = await supabase
          .from("lista_items")
          .select(`
            id,
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
          .eq("lista_id", lista.id)
          .order("id", { ascending: false });

        if (!mounted) return;

        if (itemsError) throw itemsError;

        setMisFavoritos(items || []);
      } catch (error) {
        console.error("Error cargando Favoritos:", error);

        if (!mounted) return;

        setListaFavoritosId(null);
        setFavoritosPublicos(false);
        setMisFavoritos([]);
        setErrorFavoritos("No se pudieron cargar tus favoritos.");
      } finally {
        if (mounted) setCargandoFavoritos(false);
      }
    };

    cargarFavoritos();

    return () => {
      mounted = false;
    };
  }, [usuario?.id]);

  if (!usuario) return null;

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(fechaISO));
  };

  const cambiarPrivacidadFavoritos = async () => {
    if (!listaFavoritosId || actualizandoPrivacidad) return;

    setActualizandoPrivacidad(true);
    setMensajeFavoritos(null);
    setErrorFavoritos(null);

    const nuevaVisibilidadPublica = !favoritosPublicos;

    const { error } = await supabase
      .from("listas")
      .update({ es_privada: !nuevaVisibilidadPublica })
      .eq("id", listaFavoritosId)
      .eq("user_id", usuario.id);

    setActualizandoPrivacidad(false);

    if (error) {
      console.error("Error cambiando privacidad de Favoritos:", error);
      setErrorFavoritos("No se pudo cambiar la visibilidad de Favoritos.");
      return;
    }

    setFavoritosPublicos(nuevaVisibilidadPublica);
    setMensajeFavoritos(
      nuevaVisibilidadPublica
        ? "Tus favoritos ahora son públicos."
        : "Tus favoritos ahora son privados.",
    );
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
          onClick={() => setMostrarEdicion(true)}
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
                    alt={perfil.username || "Foto de perfil"}
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
                {perfil?.rol === "administrador"
                  ? "Administrador"
                  : "Usuario registrado"}
              </span>
            </div>

            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <h2 className="theme-profile-username text-2xl font-black tracking-tight">
                {perfil?.username || "Usuario"}
              </h2>
              {perfil?.bio && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
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
              onClick={() => setTab("resenas")}
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "resenas"
                  ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Reseñas ({misResenias.length})
            </button>

            <button
              type="button"
              onClick={() => setTab("favoritos")}
              className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "favoritos"
                  ? "border-(--accent)/30 bg-(--accent)/15 text-(--accent)"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Favoritos ({misFavoritos.length})
            </button>
          </div>

          {tab === "resenas" &&
            (cargandoResenias ? (
              <p className="text-sm text-zinc-500">Cargando tus reseñas...</p>
            ) : misResenias.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Todavía no has publicado ninguna reseña.
              </p>
            ) : (
              <div className="space-y-3">
                {misResenias.map((resenia) => (
                  <article
                    key={resenia.id}
                    className="rounded-xl border border-white/5 bg-zinc-900/40 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          resenia.libreria && onVerDetalle?.(resenia.libreria)
                        }
                        disabled={!resenia.libreria}
                        className="group flex min-w-0 items-center gap-3 text-left disabled:cursor-default"
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
                              title={
                                resenia.rating
                                  ? "Recomendada"
                                  : "No recomendada"
                              }
                              className="h-5 w-5 shrink-0 object-contain"
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

          {tab === "favoritos" && (
            <div>
              <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={estrellaLlena}
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8 object-contain"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">
                      Visibilidad de Favoritos
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {favoritosPublicos
                        ? "Otros usuarios podrán ver esta sección en tu perfil público."
                        : "Solo tú puedes ver tus favoritos."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cambiarPrivacidadFavoritos}
                  disabled={
                    !listaFavoritosId ||
                    actualizandoPrivacidad ||
                    cargandoFavoritos
                  }
                  className={`self-start rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 sm:self-auto ${
                    favoritosPublicos
                      ? "border-(--accent)/30 bg-(--accent)/10 text-(--accent) hover:bg-(--accent)/20"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-(--accent)/20 hover:bg-(--accent)/5 hover:text-(--accent)"
                  }`}
                >
                  {actualizandoPrivacidad
                    ? "Actualizando..."
                    : favoritosPublicos
                      ? "Pública"
                      : "Privada"}
                </button>
              </div>

              {mensajeFavoritos && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-(--accent)/25 bg-(--accent)/10 p-3 text-sm text-purple-200">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--accent)/15 text-xs font-black text-(--accent)"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{mensajeFavoritos}</span>
                </div>
              )}

              {errorFavoritos && (
                <p className="mb-5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                  {errorFavoritos}
                </p>
              )}

              {cargandoFavoritos ? (
                <p className="text-sm text-zinc-500">
                  Cargando tus favoritos...
                </p>
              ) : misFavoritos.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Todavía no tienes títulos guardados en Favoritos.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {misFavoritos.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.libreria && onVerDetalle?.(item.libreria)}
                      disabled={!item.libreria}
                      className="group overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 text-left transition-all hover:border-(--accent)/25 disabled:cursor-default"
                    >
                      <div className="aspect-3/4 bg-zinc-800">
                        <ImagenConPlaceholder
                          src={item.libreria?.cover}
                          alt={item.libreria?.titulo || "Portada"}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          iconClassName="h-10 w-10"
                        />
                      </div>

                      <div className="p-2.5">
                        <p className="line-clamp-1 text-xs font-bold text-white">
                          {item.libreria?.titulo || "Obra eliminada"}
                        </p>
                        <p className="text-[10px] uppercase text-zinc-500">
                          {item.libreria?.tipo || "Obra"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mostrarEdicion && (
        <EditarPerfilModal onCerrar={() => setMostrarEdicion(false)} />
      )}
    </div>
  );
};

export default Perfil;