import { useEffect, useMemo, useState } from "react";

import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ModalPortal from "./ModalPortal";

import marcadorVacio from "/Guardar-lleno.png";
import marcadorLleno from "/Guardar-vacio.png";

const NOMBRE_FAVORITOS = "Favoritos";
const MAX_NOMBRE_LISTA = 80;

const AgregarAListaModal = ({
  item,
  onCerrar,
  onActualizado,
}) => {
  const { usuario } = useAuth();

  const [listas, setListas] = useState([]);
  const [listasSeleccionadas, setListasSeleccionadas] = useState(
    new Set(),
  );
  const [cargando, setCargando] = useState(true);
  const [procesandoListaId, setProcesandoListaId] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nombreNuevaLista, setNombreNuevaLista] = useState("");
  const [nuevaListaPrivada, setNuevaListaPrivada] = useState(true);
  const [creandoLista, setCreandoLista] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const listasPersonalizadas = useMemo(
    () =>
      listas.filter(
        (lista) =>
          String(lista.nombre || "").trim().toLowerCase() !==
          NOMBRE_FAVORITOS.toLowerCase(),
      ),
    [listas],
  );

  const notificarEstado = (seleccionadas) => {
    onActualizado?.(seleccionadas.size > 0);
  };

  const cargarListas = async () => {
    if (!usuario?.id || !item?.id) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    const { data: listasData, error: listasError } = await supabase
      .from("listas")
      .select("id, nombre, es_privada")
      .eq("user_id", usuario.id)
      .order("nombre", { ascending: true });

    if (listasError) {
      console.error("Error cargando listas:", listasError);
      setListas([]);
      setListasSeleccionadas(new Set());
      setError("No se pudieron cargar tus listas.");
      setCargando(false);
      return;
    }

    const listasUsuario = listasData || [];
    const personalizadas = listasUsuario.filter(
      (lista) =>
        String(lista.nombre || "").trim().toLowerCase() !==
        NOMBRE_FAVORITOS.toLowerCase(),
    );

    setListas(listasUsuario);

    if (personalizadas.length === 0) {
      const vacias = new Set();
      setListasSeleccionadas(vacias);
      notificarEstado(vacias);
      setCargando(false);
      return;
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("lista_items")
      .select("lista_id")
      .eq("libreria_id", item.id)
      .in(
        "lista_id",
        personalizadas.map((lista) => lista.id),
      );

    if (itemsError) {
      console.error("Error cargando elementos de listas:", itemsError);
      setListasSeleccionadas(new Set());
      setError("No se pudo comprobar en qué listas está la obra.");
      setCargando(false);
      return;
    }

    const seleccionadas = new Set(
      (itemsData || []).map((registro) => String(registro.lista_id)),
    );

    setListasSeleccionadas(seleccionadas);
    notificarEstado(seleccionadas);
    setCargando(false);
  };

  useEffect(() => {
    cargarListas();
  }, [usuario?.id, item?.id]);

  const alternarLista = async (lista) => {
    if (!usuario?.id || !item?.id || procesandoListaId) return;

    const listaId = String(lista.id);
    const yaSeleccionada = listasSeleccionadas.has(listaId);

    setProcesandoListaId(lista.id);
    setError(null);
    setMensaje(null);

    if (yaSeleccionada) {
      const { error: eliminarError } = await supabase
        .from("lista_items")
        .delete()
        .eq("lista_id", lista.id)
        .eq("libreria_id", item.id);

      if (eliminarError) {
        console.error("Error quitando obra de la lista:", eliminarError);
        setError("No se pudo quitar la obra de la lista.");
        setProcesandoListaId(null);
        return;
      }

      setListasSeleccionadas((actuales) => {
        const nuevas = new Set(actuales);
        nuevas.delete(listaId);
        notificarEstado(nuevas);
        return nuevas;
      });

      setMensaje(`Se quitó de “${lista.nombre}”.`);
    } else {
      const { error: insertarError } = await supabase
        .from("lista_items")
        .insert({
          lista_id: lista.id,
          libreria_id: item.id,
        });

      if (insertarError && insertarError.code !== "23505") {
        console.error("Error agregando obra a la lista:", insertarError);
        setError("No se pudo agregar la obra a la lista.");
        setProcesandoListaId(null);
        return;
      }

      setListasSeleccionadas((actuales) => {
        const nuevas = new Set(actuales);
        nuevas.add(listaId);
        notificarEstado(nuevas);
        return nuevas;
      });

      setMensaje(`Se agregó a “${lista.nombre}”.`);
    }

    setProcesandoListaId(null);
  };

  const crearLista = async (evento) => {
    evento.preventDefault();

    if (!usuario?.id || !item?.id) return;

    const nombre = nombreNuevaLista.trim();

    if (!nombre) {
      setError("Escribe un nombre para la lista.");
      return;
    }

    if (nombre.length > MAX_NOMBRE_LISTA) {
      setError(
        `El nombre no puede superar ${MAX_NOMBRE_LISTA} caracteres.`,
      );
      return;
    }

    if (nombre.toLowerCase() === NOMBRE_FAVORITOS.toLowerCase()) {
      setError('El nombre “Favoritos” está reservado para la estrella.');
      return;
    }

    setCreandoLista(true);
    setError(null);
    setMensaje(null);

    const { data: listaCreada, error: listaError } = await supabase
      .from("listas")
      .insert({
        user_id: usuario.id,
        nombre,
        es_privada: nuevaListaPrivada,
      })
      .select("id, nombre, es_privada")
      .single();

    if (listaError) {
      console.error("Error creando lista:", listaError);
      setCreandoLista(false);

      if (listaError.code === "23505") {
        setError("Ya tienes una lista con ese nombre.");
      } else {
        setError("No se pudo crear la lista.");
      }

      return;
    }

    const { error: itemError } = await supabase
      .from("lista_items")
      .insert({
        lista_id: listaCreada.id,
        libreria_id: item.id,
      });

    if (itemError && itemError.code !== "23505") {
      console.error("Error agregando la obra a la lista nueva:", itemError);
      setCreandoLista(false);
      setListas((actuales) => [...actuales, listaCreada]);
      setError(
        "La lista se creó, pero no se pudo agregar la obra. Puedes intentarlo desde Mis listas.",
      );
      return;
    }

    setListas((actuales) => [...actuales, listaCreada]);
    setListasSeleccionadas((actuales) => {
      const nuevas = new Set(actuales);
      nuevas.add(String(listaCreada.id));
      notificarEstado(nuevas);
      return nuevas;
    });

    setNombreNuevaLista("");
    setNuevaListaPrivada(true);
    setMostrarCrear(false);
    setMensaje(`Se creó “${listaCreada.nombre}” y se agregó la obra.`);
    setCreandoLista(false);
  };

  return (
    <ModalPortal onCerrar={onCerrar}>
      <div className="theme-surface relative flex max-h-[86dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/5 p-6">
          <div>
            <h2 className="theme-modal-title text-lg font-black uppercase tracking-widest">
              Añadir a una lista
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
              {item?.titulo || "Obra seleccionada"}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 grow overflow-y-auto p-6">
          {cargando ? (
            <p className="text-sm text-zinc-500">Cargando tus listas...</p>
          ) : (
            <>
              {listasPersonalizadas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-6 text-center">
                  <img
                    src={marcadorVacio}
                    alt=""
                    aria-hidden="true"
                    className="mx-auto h-9 w-9 object-contain opacity-70"
                  />
                  <p className="mt-3 text-sm font-bold text-zinc-300">
                    Todavía no tienes listas personalizadas
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Crea una para organizar esta obra.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {listasPersonalizadas.map((lista) => {
                    const seleccionada = listasSeleccionadas.has(
                      String(lista.id),
                    );
                    const procesando = procesandoListaId === lista.id;

                    return (
                      <button
                        key={lista.id}
                        type="button"
                        onClick={() => alternarLista(lista)}
                        disabled={procesando}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all disabled:opacity-50 ${
                          seleccionada
                            ? "border-(--accent)/35 bg-(--accent)/10"
                            : "border-(--color-border) bg-(--color-surface-soft) hover:border-(--color-border-strong) hover:bg-(--color-surface)"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={seleccionada ? marcadorLleno : marcadorVacio}
                            alt=""
                            aria-hidden="true"
                            className="h-7 w-7 shrink-0 object-contain"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {lista.nombre}
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                              {lista.es_privada ? "Privada" : "Pública"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            seleccionada ? "text-(--accent)" : "text-zinc-600"
                          }`}
                        >
                          {procesando
                            ? "Guardando..."
                            : seleccionada
                              ? "Agregada"
                              : "Agregar"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {error}
                </p>
              )}

              {mensaje && (
                <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  {mensaje}
                </p>
              )}

              <div className="mt-5 border-t border-white/5 pt-5">
                {!mostrarCrear ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCrear(true);
                      setError(null);
                      setMensaje(null);
                    }}
                    className="w-full rounded-xl border border-(--accent)/30 bg-(--accent)/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-(--accent) transition-all hover:bg-(--accent)/20"
                  >
                    + Crear una lista nueva
                  </button>
                ) : (
                  <form onSubmit={crearLista} className="space-y-3">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Nombre de la lista
                      </label>
                      <input
                        type="text"
                        autoFocus
                        maxLength={MAX_NOMBRE_LISTA}
                        value={nombreNuevaLista}
                        onChange={(evento) =>
                          setNombreNuevaLista(evento.target.value)
                        }
                        placeholder="Ej. Pendientes por leer"
                        className="theme-input w-full rounded-xl border p-3 text-sm outline-none placeholder:text-(--color-text-muted) focus:border-(--accent)/50"
                      />
                    </div>

                    <label className="theme-surface-soft flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3">
                      <div>
                        <p className="text-xs font-bold text-white">
                          Lista privada
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          Solo tú podrás verla.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={nuevaListaPrivada}
                        onChange={(evento) =>
                          setNuevaListaPrivada(evento.target.checked)
                        }
                        className="h-4 w-4 accent-(--accent)"
                      />
                    </label>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarCrear(false);
                          setNombreNuevaLista("");
                          setError(null);
                        }}
                        disabled={creandoLista}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:bg-white/10 disabled:opacity-40"
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        disabled={creandoLista}
                        className="rounded-xl bg-(--accent) px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-40"
                      >
                        {creandoLista ? "Creando..." : "Crear y agregar"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default AgregarAListaModal;