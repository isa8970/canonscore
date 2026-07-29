import { useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";

import estrellaLlena from "/Favoritos-lleno.png";
import marcadorLleno from "/Guardar-lleno.png";

const NOMBRE_FAVORITOS = "Favoritos";
const MAX_NOMBRE_LISTA = 80;

const Listas = ({ onVolver, onVerDetalle }) => {
  const { usuario, esInvitado } = useAuth();

  const [listas, setListas] = useState([]);
  const [listaActivaId, setListaActivaId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nombreNuevaLista, setNombreNuevaLista] = useState("");
  const [nuevaListaPrivada, setNuevaListaPrivada] = useState(true);
  const [creandoLista, setCreandoLista] = useState(false);
  const [listaProcesando, setListaProcesando] = useState(null);
  const [itemProcesando, setItemProcesando] = useState(null);
  const [menuListaAbierto, setMenuListaAbierto] = useState(false);
  const menuListaRef = useRef(null);

  const esListaFavoritos = (lista) =>
    String(lista?.nombre || "")
      .trim()
      .toLowerCase() === NOMBRE_FAVORITOS.toLowerCase();

  const ordenarListas = (datos) =>
    [...datos].sort((a, b) => {
      if (esListaFavoritos(a)) return -1;
      if (esListaFavoritos(b)) return 1;
      return String(a.nombre || "").localeCompare(
        String(b.nombre || ""),
        "es",
        { sensitivity: "base" },
      );
    });

  const obtenerOCrearFavoritos = async () => {
    const { data: existente, error: buscarError } = await supabase
      .from("listas")
      .select("id, nombre, es_privada")
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
      .select("id, nombre, es_privada")
      .single();

    if (!crearError) return creada;

    if (crearError.code === "23505") {
      const { data: recuperada, error: recuperarError } = await supabase
        .from("listas")
        .select("id, nombre, es_privada")
        .eq("user_id", usuario.id)
        .eq("nombre", NOMBRE_FAVORITOS)
        .single();

      if (recuperarError) throw recuperarError;
      return recuperada;
    }

    throw crearError;
  };

  const cargarListas = async (listaPreferidaId = null) => {
    if (!usuario?.id) {
      setListas([]);
      setListaActivaId(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      await obtenerOCrearFavoritos();

      const { data, error: listasError } = await supabase
        .from("listas")
        .select(
          `
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
        `,
        )
        .eq("user_id", usuario.id)
        .order("id", { ascending: true });

      if (listasError) throw listasError;

      const ordenadas = ordenarListas(data || []).map((lista) => ({
        ...lista,
        lista_items: lista.lista_items || [],
      }));

      setListas(ordenadas);

      setListaActivaId((actual) => {
        const preferida = listaPreferidaId || actual;

        if (
          preferida &&
          ordenadas.some((lista) => String(lista.id) === String(preferida))
        ) {
          return preferida;
        }

        return ordenadas[0]?.id || null;
      });
    } catch (cargarError) {
      console.error("Error cargando listas:", cargarError);
      setListas([]);
      setListaActivaId(null);
      setError("No se pudieron cargar tus listas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarListas();
  }, [usuario?.id]);

  useEffect(() => {
    setMenuListaAbierto(false);
  }, [listaActivaId]);

  useEffect(() => {
    const cerrarMenu = (evento) => {
      if (
        menuListaRef.current &&
        !menuListaRef.current.contains(evento.target)
      ) {
        setMenuListaAbierto(false);
      }
    };

    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        setMenuListaAbierto(false);
      }
    };

    document.addEventListener("mousedown", cerrarMenu);
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.removeEventListener("mousedown", cerrarMenu);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  const listaActiva = useMemo(
    () =>
      listas.find((lista) => String(lista.id) === String(listaActivaId)) ||
      null,
    [listas, listaActivaId],
  );

  const totalObras = useMemo(
    () =>
      listas.reduce(
        (total, lista) => total + (lista.lista_items?.length || 0),
        0,
      ),
    [listas],
  );

  const crearLista = async (evento) => {
    evento.preventDefault();

    const nombre = nombreNuevaLista.trim();

    if (!usuario?.id) return;

    if (!nombre) {
      setError("Escribe un nombre para la lista.");
      return;
    }

    if (nombre.length > MAX_NOMBRE_LISTA) {
      setError(`El nombre no puede superar ${MAX_NOMBRE_LISTA} caracteres.`);
      return;
    }

    if (nombre.toLowerCase() === NOMBRE_FAVORITOS.toLowerCase()) {
      setError("El nombre “Favoritos” está reservado.");
      return;
    }

    setCreandoLista(true);
    setError(null);
    setMensaje(null);

    const { data, error: crearError } = await supabase
      .from("listas")
      .insert({
        user_id: usuario.id,
        nombre,
        es_privada: nuevaListaPrivada,
      })
      .select("id")
      .single();

    setCreandoLista(false);

    if (crearError) {
      console.error("Error creando lista:", crearError);

      if (crearError.code === "23505") {
        setError("Ya tienes una lista con ese nombre.");
      } else {
        setError("No se pudo crear la lista.");
      }

      return;
    }

    setNombreNuevaLista("");
    setNuevaListaPrivada(true);
    setMostrarCrear(false);
    setMensaje("La lista se creó correctamente.");
    await cargarListas(data.id);
  };

  const cambiarPrivacidad = async (lista) => {
    if (!usuario?.id || listaProcesando) return;

    setListaProcesando(lista.id);
    setError(null);
    setMensaje(null);

    const nuevaPrivacidad = !lista.es_privada;

    const { error: actualizarError } = await supabase
      .from("listas")
      .update({ es_privada: nuevaPrivacidad })
      .eq("id", lista.id)
      .eq("user_id", usuario.id);

    setListaProcesando(null);

    if (actualizarError) {
      console.error("Error cambiando privacidad:", actualizarError);
      setError("No se pudo cambiar la privacidad de la lista.");
      return;
    }

    setListas((actuales) =>
      actuales.map((actual) =>
        actual.id === lista.id
          ? { ...actual, es_privada: nuevaPrivacidad }
          : actual,
      ),
    );

    setMensaje(
      nuevaPrivacidad
        ? `“${lista.nombre}” ahora es privada.`
        : `“${lista.nombre}” ahora es pública.`,
    );
  };

  const renombrarLista = async (lista) => {
    if (esListaFavoritos(lista)) return;

    const nuevoNombre = window.prompt(
      "Nuevo nombre de la lista:",
      lista.nombre,
    );

    if (nuevoNombre === null) return;

    const nombre = nuevoNombre.trim();

    if (!nombre) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    if (nombre.length > MAX_NOMBRE_LISTA) {
      setError(`El nombre no puede superar ${MAX_NOMBRE_LISTA} caracteres.`);
      return;
    }

    if (nombre.toLowerCase() === NOMBRE_FAVORITOS.toLowerCase()) {
      setError("El nombre “Favoritos” está reservado.");
      return;
    }

    setListaProcesando(lista.id);
    setError(null);
    setMensaje(null);

    const { error: renombrarError } = await supabase
      .from("listas")
      .update({ nombre })
      .eq("id", lista.id)
      .eq("user_id", usuario.id);

    setListaProcesando(null);

    if (renombrarError) {
      console.error("Error renombrando lista:", renombrarError);

      if (renombrarError.code === "23505") {
        setError("Ya tienes una lista con ese nombre.");
      } else {
        setError("No se pudo renombrar la lista.");
      }

      return;
    }

    setListas((actuales) =>
      ordenarListas(
        actuales.map((actual) =>
          actual.id === lista.id ? { ...actual, nombre } : actual,
        ),
      ),
    );

    setMensaje("La lista se renombró correctamente.");
  };

  const eliminarLista = async (lista) => {
    if (esListaFavoritos(lista)) return;

    const confirmado = window.confirm(
      `¿Eliminar la lista “${lista.nombre}”? Las obras no se eliminarán del catálogo.`,
    );

    if (!confirmado) return;

    setListaProcesando(lista.id);
    setError(null);
    setMensaje(null);

    const { error: itemsError } = await supabase
      .from("lista_items")
      .delete()
      .eq("lista_id", lista.id);

    if (itemsError) {
      console.error("Error eliminando elementos de la lista:", itemsError);
      setListaProcesando(null);
      setError("No se pudieron eliminar los elementos de la lista.");
      return;
    }

    const { error: listaError } = await supabase
      .from("listas")
      .delete()
      .eq("id", lista.id)
      .eq("user_id", usuario.id);

    setListaProcesando(null);

    if (listaError) {
      console.error("Error eliminando lista:", listaError);
      setError("No se pudo eliminar la lista.");
      return;
    }

    const restantes = listas.filter((actual) => actual.id !== lista.id);
    setListas(restantes);
    setListaActivaId(restantes[0]?.id || null);
    setMensaje("La lista fue eliminada.");
  };

  const quitarObra = async (registro) => {
    if (!listaActiva || itemProcesando) return;

    const confirmado = window.confirm(
      `¿Quitar “${registro.libreria?.titulo || "esta obra"}” de “${
        listaActiva.nombre
      }”?`,
    );

    if (!confirmado) return;

    setItemProcesando(registro.id);
    setError(null);
    setMensaje(null);

    const { error: quitarError } = await supabase
      .from("lista_items")
      .delete()
      .eq("id", registro.id)
      .eq("lista_id", listaActiva.id);

    setItemProcesando(null);

    if (quitarError) {
      console.error("Error quitando obra de la lista:", quitarError);
      setError("No se pudo quitar la obra de la lista.");
      return;
    }

    setListas((actuales) =>
      actuales.map((lista) =>
        lista.id === listaActiva.id
          ? {
              ...lista,
              lista_items: lista.lista_items.filter(
                (item) => item.id !== registro.id,
              ),
            }
          : lista,
      ),
    );

    setMensaje("La obra se quitó de la lista.");
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 pb-24 text-white">
      <div className="mx-auto max-w-300 px-6 pt-8">
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

        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-(--accent)">
              Tu biblioteca personal
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Mis listas y favoritos
            </h2>
            {!esInvitado && usuario && (
              <p className="mt-2 text-sm text-zinc-500">
                {listas.length} {listas.length === 1 ? "lista" : "listas"} ·{" "}
                {totalObras}{" "}
                {totalObras === 1 ? "obra guardada" : "obras guardadas"}
              </p>
            )}
          </div>

          {!esInvitado && usuario && (
            <button
              type="button"
              onClick={() => {
                setMostrarCrear((actual) => !actual);
                setError(null);
                setMensaje(null);
              }}
              className="self-start rounded-xl bg-(--accent) px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110 sm:self-auto"
            >
              {mostrarCrear ? "Cancelar" : "+ Crear lista"}
            </button>
          )}
        </div>

        {esInvitado || !usuario ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center">
            <img
              src={marcadorLleno}
              alt=""
              aria-hidden="true"
              className="mx-auto h-10 w-10 object-contain opacity-70"
            />
            <h3 className="mt-4 text-lg font-bold">
              Inicia sesión para usar listas
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
              Podrás guardar favoritos, crear listas personalizadas y decidir si
              son públicas o privadas.
            </p>
          </div>
        ) : (
          <>
            {mostrarCrear && (
              <form
                onSubmit={crearLista}
                className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-5 md:grid-cols-[1fr_auto_auto] md:items-end"
              >
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Nombre de la lista
                  </label>
                  <input
                    type="text"
                    maxLength={MAX_NOMBRE_LISTA}
                    value={nombreNuevaLista}
                    onChange={(evento) =>
                      setNombreNuevaLista(evento.target.value)
                    }
                    placeholder="Ej. Películas para el fin de semana"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 p-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-(--accent)/50"
                  />
                </div>

                <label className="flex h-11.5 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 px-4">
                  <input
                    type="checkbox"
                    checked={nuevaListaPrivada}
                    onChange={(evento) =>
                      setNuevaListaPrivada(evento.target.checked)
                    }
                    className="h-4 w-4 accent-(--accent)"
                  />
                  <span className="text-xs font-bold text-zinc-300">
                    Privada
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={creandoLista}
                  className="h-11.5 rounded-xl bg-(--accent) px-5 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-40"
                >
                  {creandoLista ? "Creando..." : "Crear"}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-(--accent)/25 bg-(--accent)/10 p-4 text-sm text-purple-200">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--accent)/15 text-xs font-black text-(--accent)"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{mensaje}</span>
              </div>
            )}

            {cargando ? (
              <p className="mt-10 text-sm text-zinc-500">
                Cargando tus listas...
              </p>
            ) : (
              <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="space-y-2">
                  {listas.map((lista) => {
                    const activa = String(lista.id) === String(listaActivaId);
                    const favoritos = esListaFavoritos(lista);

                    return (
                      <button
                        key={lista.id}
                        type="button"
                        onClick={() => setListaActivaId(lista.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                          activa
                            ? "border-(--accent)/35 bg-(--accent)/12"
                            : "border-white/5 bg-zinc-900/35 hover:border-white/10 hover:bg-zinc-900/60"
                        }`}
                      >
                        <img
                          src={favoritos ? estrellaLlena : marcadorLleno}
                          alt=""
                          aria-hidden="true"
                          className="h-7 w-7 shrink-0 object-contain"
                        />
                        <div className="min-w-0 grow">
                          <p className="truncate text-sm font-bold text-white">
                            {lista.nombre}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                            {lista.lista_items.length}{" "}
                            {lista.lista_items.length === 1 ? "obra" : "obras"}{" "}
                            · {lista.es_privada ? "Privada" : "Pública"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </aside>

                <section className="min-w-0 rounded-2xl border border-white/10 bg-zinc-900/30 p-5 sm:p-6">
                  {!listaActiva ? (
                    <p className="text-sm text-zinc-500">
                      Selecciona una lista.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={
                              esListaFavoritos(listaActiva)
                                ? estrellaLlena
                                : marcadorLleno
                            }
                            alt=""
                            aria-hidden="true"
                            className="h-9 w-9 shrink-0 object-contain"
                          />

                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <h3 className="max-w-full truncate text-xl font-black text-white">
                                {listaActiva.nombre}
                              </h3>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                                  listaActiva.es_privada
                                    ? "border-white/10 bg-white/5 text-zinc-500"
                                    : "border-(--accent)/25 bg-(--accent)/10 text-(--accent)"
                                }`}
                              >
                                {listaActiva.es_privada ? "Privada" : "Pública"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-zinc-500">
                              {listaActiva.es_privada
                                ? "Solo tú puedes ver esta lista."
                                : "Esta lista puede mostrarse en tu perfil público."}
                            </p>
                          </div>
                        </div>

                        <div className="relative shrink-0" ref={menuListaRef}>
                          <button
                            type="button"
                            onClick={() =>
                              setMenuListaAbierto((actual) => !actual)
                            }
                            disabled={listaProcesando === listaActiva.id}
                            aria-haspopup="menu"
                            aria-expanded={menuListaAbierto}
                            className="flex items-center gap-2 rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-(--accent) transition-all hover:bg-(--accent)/20 disabled:cursor-wait disabled:opacity-40"
                          >
                            {listaProcesando === listaActiva.id
                              ? "Guardando..."
                              : "Editar lista"}

                            <svg
                              className={`h-3.5 w-3.5 transition-transform ${
                                menuListaAbierto ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {menuListaAbierto && (
                            <div
                              role="menu"
                              className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1.5 shadow-2xl shadow-black/50"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuListaAbierto(false);
                                  cambiarPrivacidad(listaActiva);
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-bold text-zinc-300 transition-colors hover:bg-(--accent)/10 hover:text-(--accent)"
                              >
                                <span>
                                  {listaActiva.es_privada
                                    ? "Hacer pública"
                                    : "Hacer privada"}
                                </span>

                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                                    listaActiva.es_privada
                                      ? "border-(--accent)/20 bg-(--accent)/10 text-(--accent)"
                                      : "border-white/10 bg-white/5 text-zinc-500"
                                  }`}
                                >
                                  {listaActiva.es_privada
                                    ? "Pública"
                                    : "Privada"}
                                </span>
                              </button>

                              {!esListaFavoritos(listaActiva) && (
                                <>
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setMenuListaAbierto(false);
                                      renombrarLista(listaActiva);
                                    }}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                                  >
                                    Renombrar lista
                                  </button>

                                  <div className="my-1 h-px bg-white/5" />

                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setMenuListaAbierto(false);
                                      eliminarLista(listaActiva);
                                    }}
                                    className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                                  >
                                    Eliminar lista
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {listaActiva.lista_items.length === 0 ? (
                        <div className="py-14 text-center">
                          <p className="text-sm font-bold text-zinc-400">
                            Esta lista está vacía
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Abre una obra y usa sus iconos para guardarla.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                          {listaActiva.lista_items.map((registro) => {
                            const obra = registro.libreria;

                            return (
                              <article
                                key={registro.id}
                                className="group overflow-hidden rounded-xl border border-white/5 bg-zinc-950/60"
                              >
                                <button
                                  type="button"
                                  onClick={() => obra && onVerDetalle?.(obra)}
                                  disabled={!obra}
                                  className="block w-full text-left disabled:cursor-default"
                                >
                                  <div className="aspect-3/4 overflow-hidden bg-zinc-900">
                                    {obra?.cover ? (
                                      <img
                                        src={obra.cover}
                                        alt={obra.titulo}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                                        Sin portada
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <p className="line-clamp-2 text-sm font-bold text-white">
                                      {obra?.titulo || "Obra eliminada"}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                      {obra?.tipo || "Obra"}
                                    </p>
                                  </div>
                                </button>

                                <div className="border-t border-white/5 p-2">
                                  <button
                                    type="button"
                                    onClick={() => quitarObra(registro)}
                                    disabled={itemProcesando === registro.id}
                                    className="w-full rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-40"
                                  >
                                    {itemProcesando === registro.id
                                      ? "Quitando..."
                                      : "Quitar de la lista"}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Listas;
