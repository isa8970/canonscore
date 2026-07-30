import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import Nav from "./components/nav";
import Banner from "./components/banner";
import Tarjeta from "./components/Tarjeta";
import CarruselCatalogo from "./components/CarruselCatalogo";
import CatalogoCompleto from "./components/CatalogoCompleto";
import Detalle from "./components/Detalle";
import Perfil from "./components/Perfil";
import PerfilPublico from "./components/PerfilPublico";
import Listas from "./components/Listas";
import ActualizarPasswordModal from "./components/ActualizarPasswordModal";
import { useAuth } from "./context/AuthContext";

import { supabase } from "./config/supabaseClient";
import { CATEGORIAS_MAP } from "./constants/categorias";
import "./theme.css";

const FILTROS_INICIALES = {
  generos: [],
  orden: "catalogo",
};

const MAXIMO_POR_CARRUSEL = 12;
const CLAVE_TEMA = "canonscore-theme";

function leerTemaGuardado() {
  if (typeof window === "undefined") return "dark";

  try {
    const temaGuardado = window.localStorage.getItem(CLAVE_TEMA);
    return temaGuardado === "light" ? "light" : "dark";
  } catch (error) {
    console.warn("No se pudo leer la preferencia de tema:", error);
    return "dark";
  }
}

function aplicarTemaDocumento(tema) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = tema;
  document.documentElement.style.colorScheme = tema;
}

function obtenerTemaInicial() {
  const tema = leerTemaGuardado();
  aplicarTemaDocumento(tema);
  return tema;
}

function normalizarGeneros(item) {
  if (Array.isArray(item?.generos)) {
    return item.generos
      .map((genero) => String(genero).trim())
      .filter(Boolean);
  }

  const valor = item?.generos ?? item?.genero ?? "";

  return String(valor)
    .split(",")
    .map((genero) => genero.trim())
    .filter(Boolean);
}

function calcularValoraciones(resenias = []) {
  const positivas = resenias.filter(
    (resenia) => resenia.rating === true,
  ).length;
  const negativas = resenias.filter(
    (resenia) => resenia.rating === false,
  ).length;
  const total = positivas + negativas;

  return {
    positivas,
    negativas,
    total,
    porcentajeRecomendacion:
      total > 0 ? Math.round((positivas / total) * 100) : 0,
  };
}

function normalizarObra(item) {
  if (!item) return null;

  const obra = item.libreria || item;
  const generos = normalizarGeneros(obra);

  return {
    ...obra,
    imagen: obra.imagen || obra.cover,
    imagenBanner: obra.imagenBanner || obra.banner || obra.cover,
    descripcion: obra.descripcion || obra.sinopsis,
    anio: obra.anio || obra.anio_pub,
    genero: obra.genero || generos.join(", "),
    generos,
    valoraciones:
      obra.valoraciones || calcularValoraciones(obra.resenias || []),
  };
}

function fechaNumerica(item) {
  const fecha = new Date(item?.created_at || 0).getTime();

  if (Number.isFinite(fecha) && fecha > 0) {
    return fecha;
  }

  const idNumerico = Number(item?.id);
  return Number.isFinite(idNumerico) ? idNumerico : 0;
}

function compararPopularidad(a, b) {
  const totalA = a?.valoraciones?.total ?? 0;
  const totalB = b?.valoraciones?.total ?? 0;

  if (totalB !== totalA) {
    return totalB - totalA;
  }

  const porcentajeA = a?.valoraciones?.porcentajeRecomendacion ?? 0;
  const porcentajeB = b?.valoraciones?.porcentajeRecomendacion ?? 0;

  if (porcentajeB !== porcentajeA) {
    return porcentajeB - porcentajeA;
  }

  const positivasA = a?.valoraciones?.positivas ?? 0;
  const positivasB = b?.valoraciones?.positivas ?? 0;

  if (positivasB !== positivasA) {
    return positivasB - positivasA;
  }

  return fechaNumerica(b) - fechaNumerica(a);
}

function seleccionarSinRepetir(candidatos, idsUsados, limite) {
  const seleccion = [];

  for (const item of candidatos) {
    if (!item?.id || idsUsados.has(item.id)) continue;

    seleccion.push(item);
    idsUsados.add(item.id);

    if (seleccion.length >= limite) break;
  }

  return seleccion;
}

function App() {
  const { usuario } = useAuth();
  const [tema, setTema] = useState(obtenerTemaInicial);
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vista, setVista] = useState("inicio");
  const [vistaAnteriorPerfil, setVistaAnteriorPerfil] = useState("inicio");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [perfilPublicoId, setPerfilPublicoId] = useState(null);
  const [mostrarActualizarPassword, setMostrarActualizarPassword] =
    useState(false);

  useLayoutEffect(() => {
    aplicarTemaDocumento(tema);

    try {
      window.localStorage.setItem(CLAVE_TEMA, tema);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema:", error);
    }
  }, [tema]);

  useEffect(() => {
    const sincronizarTema = () => {
      const temaGuardado = leerTemaGuardado();
      aplicarTemaDocumento(temaGuardado);
      setTema((actual) =>
        actual === temaGuardado ? actual : temaGuardado,
      );
    };

    const manejarStorage = (evento) => {
      if (!evento.key || evento.key === CLAVE_TEMA) {
        sincronizarTema();
      }
    };

    window.addEventListener("storage", manejarStorage);
    window.addEventListener("pageshow", sincronizarTema);

    return () => {
      window.removeEventListener("storage", manejarStorage);
      window.removeEventListener("pageshow", sincronizarTema);
    };
  }, []);

  const alternarTema = () => {
    setTema((temaActual) =>
      temaActual === "dark" ? "light" : "dark",
    );
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const esRecuperacion =
      url.searchParams.get("recuperar") === "1" ||
      hashParams.get("type") === "recovery" ||
      url.searchParams.get("type") === "recovery";

    if (esRecuperacion) {
      setMostrarActualizarPassword(true);
    }

    const { data } = supabase.auth.onAuthStateChange((evento) => {
      const temaGuardado = leerTemaGuardado();
      aplicarTemaDocumento(temaGuardado);
      setTema(temaGuardado);

      if (evento === "PASSWORD_RECOVERY") {
        setMostrarActualizarPassword(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from("libreria")
        .select(`
          *,
          resenias (
            id,
            rating
          )
        `)
        .order("created_at", { ascending: false });

      if (!activo) return;

      if (fetchError) {
        console.error("Error cargando la biblioteca:", fetchError);
        setError(fetchError.message || "No se pudo cargar el catálogo.");
        setMediaData([]);
        setLoading(false);
        return;
      }

      setMediaData((data || []).map(normalizarObra).filter(Boolean));
      setError(null);
      setLoading(false);
    };

    cargarDatos();

    const canalLibreria = supabase
      .channel("app-libreria-cambios")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "libreria",
        },
        cargarDatos,
      )
      .subscribe();

    const canalResenias = supabase
      .channel("app-resenias-cambios")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resenias",
        },
        cargarDatos,
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canalLibreria);
      supabase.removeChannel(canalResenias);
    };
  }, []);

  const generosDisponibles = useMemo(() => {
    const generos = mediaData.flatMap((item) => normalizarGeneros(item));

    return [...new Set(generos)].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [mediaData]);

  const hayBusqueda = terminoBusqueda.trim().length > 0;
  const hayFiltrosActivos =
    (Array.isArray(filtros?.generos) && filtros.generos.length > 0) ||
    filtros?.orden === "recomendacion";

  const modoDescubrimiento =
    categoriaActiva === "Todas" && !hayBusqueda && !hayFiltrosActivos;

  const datosFiltrados = useMemo(() => {
    const busqueda = terminoBusqueda.trim().toLowerCase();
    const generosSeleccionados = Array.isArray(filtros?.generos)
      ? filtros.generos
      : [];

    const resultado = mediaData.filter((item) => {
      const titulo = String(item.titulo || "").toLowerCase();
      const generosItem = normalizarGeneros(item);

      const coincideCategoria =
        categoriaActiva === "Todas" || item.tipo === categoriaActiva;

      const coincideBusqueda = !busqueda || titulo.includes(busqueda);

      const coincideGenero =
        generosSeleccionados.length === 0 ||
        generosSeleccionados.some((seleccionado) =>
          generosItem.some(
            (generoItem) =>
              generoItem.toLowerCase() === String(seleccionado).toLowerCase(),
          ),
        );

      return coincideCategoria && coincideBusqueda && coincideGenero;
    });

    if (filtros?.orden === "recomendacion") {
      return [...resultado].sort((a, b) => {
        const porcentajeA = a.valoraciones?.porcentajeRecomendacion ?? 0;
        const porcentajeB = b.valoraciones?.porcentajeRecomendacion ?? 0;
        const totalA = a.valoraciones?.total ?? 0;
        const totalB = b.valoraciones?.total ?? 0;

        if (porcentajeB !== porcentajeA) {
          return porcentajeB - porcentajeA;
        }

        return totalB - totalA;
      });
    }

    return resultado;
  }, [mediaData, categoriaActiva, terminoBusqueda, filtros]);

  const seccionesDestacadas = useMemo(() => {
    if (mediaData.length === 0) {
      return {
        recomendadas: [],
        comentadas: [],
        recientes: [],
      };
    }

    const limitePorFila = Math.min(
      MAXIMO_POR_CARRUSEL,
      Math.max(1, Math.ceil(mediaData.length / 3)),
    );

    const porRecomendacion = [...mediaData]
      .filter((item) => (item.valoraciones?.total ?? 0) > 0)
      .sort((a, b) => {
        const porcentajeA = a.valoraciones?.porcentajeRecomendacion ?? 0;
        const porcentajeB = b.valoraciones?.porcentajeRecomendacion ?? 0;
        const totalA = a.valoraciones?.total ?? 0;
        const totalB = b.valoraciones?.total ?? 0;

        if (porcentajeB !== porcentajeA) {
          return porcentajeB - porcentajeA;
        }

        return totalB - totalA;
      });

    const porComentarios = [...mediaData]
      .filter((item) => (item.valoraciones?.total ?? 0) > 0)
      .sort((a, b) => {
        const totalA = a.valoraciones?.total ?? 0;
        const totalB = b.valoraciones?.total ?? 0;

        if (totalB !== totalA) {
          return totalB - totalA;
        }

        return (
          (b.valoraciones?.porcentajeRecomendacion ?? 0) -
          (a.valoraciones?.porcentajeRecomendacion ?? 0)
        );
      });

    const porFecha = [...mediaData].sort(
      (a, b) => fechaNumerica(b) - fechaNumerica(a),
    );

    const idsUsados = new Set();

    return {
      recomendadas: seleccionarSinRepetir(
        porRecomendacion,
        idsUsados,
        limitePorFila,
      ),
      comentadas: seleccionarSinRepetir(
        porComentarios,
        idsUsados,
        limitePorFila,
      ),
      recientes: seleccionarSinRepetir(
        porFecha,
        idsUsados,
        limitePorFila,
      ),
    };
  }, [mediaData]);

  const mostrarBanner = !hayBusqueda && !hayFiltrosActivos;

  const itemBanner = useMemo(() => {
    const candidatos =
      categoriaActiva === "Todas"
        ? mediaData
        : mediaData.filter((item) => item.tipo === categoriaActiva);

    if (candidatos.length === 0) {
      return null;
    }

    return [...candidatos].sort(compararPopularidad)[0] || null;
  }, [mediaData, categoriaActiva]);

  const etiquetaCategoria =
    Object.entries(CATEGORIAS_MAP).find(
      ([, valor]) => valor === categoriaActiva,
    )?.[0] || categoriaActiva;

  const tituloCatalogo = useMemo(() => {
    if (categoriaActiva !== "Todas") {
      return etiquetaCategoria;
    }

    if (hayBusqueda) {
      return "Resultados de búsqueda";
    }

    return "Resultados filtrados";
  }, [categoriaActiva, etiquetaCategoria, hayBusqueda]);

  const claveCatalogo = useMemo(
    () =>
      JSON.stringify({
        categoriaActiva,
        terminoBusqueda: terminoBusqueda.trim(),
        generos: filtros?.generos || [],
        orden: filtros?.orden || "catalogo",
      }),
    [categoriaActiva, terminoBusqueda, filtros],
  );

  const mostrarDetalle = (item) => {
    const obraRecibida = item?.libreria || item;
    const obraCatalogo = mediaData.find(
      (obra) => String(obra?.id) === String(obraRecibida?.id),
    );

    /*
     * Algunas vistas, como las reseñas del perfil, pueden entregar una obra
     * con pocos campos. La combinamos con el registro completo del catálogo
     * para conservar banner, sinopsis, géneros y demás información.
     */
    const obraCompleta = {
      ...(obraCatalogo || {}),
      ...(obraRecibida || {}),
      banner: obraRecibida?.banner || obraCatalogo?.banner || null,
      imagenBanner:
        obraRecibida?.imagenBanner ||
        obraRecibida?.banner ||
        obraCatalogo?.imagenBanner ||
        obraCatalogo?.banner ||
        null,
    };

    const obraNormalizada = normalizarObra(obraCompleta);

    if (!obraNormalizada?.id) return;

    setItemSeleccionado(obraNormalizada);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volverAInicio = () => {
    setVista("inicio");
    setItemSeleccionado(null);
    setPerfilPublicoId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limpiarBusquedaYFiltros = () => {
    setTerminoBusqueda("");
    setFiltros(FILTROS_INICIALES);
  };

  const guardarVistaAnteriorPerfil = () => {
    if (vista === "perfil" || vista === "perfil-publico") {
      return "inicio";
    }

    return vista;
  };

  const irAPerfil = () => {
    setVistaAnteriorPerfil(guardarVistaAnteriorPerfil());
    setPerfilPublicoId(null);
    setVista("perfil");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mostrarPerfilUsuario = (userId) => {
    if (!userId) return;

    setVistaAnteriorPerfil(guardarVistaAnteriorPerfil());

    if (usuario?.id && String(usuario.id) === String(userId)) {
      setPerfilPublicoId(null);
      setVista("perfil");
    } else {
      setPerfilPublicoId(userId);
      setVista("perfil-publico");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volverDesdePerfil = () => {
    const destino =
      vistaAnteriorPerfil === "perfil" ||
      vistaAnteriorPerfil === "perfil-publico"
        ? "inicio"
        : vistaAnteriorPerfil;

    setVista(destino || "inicio");
    setPerfilPublicoId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irAListas = () => {
    setVista("listas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-(--color-page) text(--color-text) selection:bg-(--accent) selection:text-white lg:pl-64">
      <Nav
        setCategoriaActiva={setCategoriaActiva}
        setTerminoBusqueda={setTerminoBusqueda}
        terminoBusqueda={terminoBusqueda}
        volverAInicio={volverAInicio}
        categoriaActiva={categoriaActiva}
        irAPerfil={irAPerfil}
        irAListas={irAListas}
        generosDisponibles={generosDisponibles}
        filtros={filtros}
        onAplicarFiltros={setFiltros}
        tema={tema}
        onCambiarTema={alternarTema}
      />

      <div className="h-14 sm:h-16" aria-hidden="true" />

      {vista === "inicio" && (
        <>
          {mostrarBanner && itemBanner && (
            <div className="w-full min-w-0 overflow-hidden pt-0 sm:pt-2">
              <Banner
                item={itemBanner}
                onVerDetalles={() => mostrarDetalle(itemBanner)}
              />
            </div>
          )}

          {error && (
            <div className="mx-auto mt-6 w-full max-w-350 px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                {error}
              </div>
            </div>
          )}

          <main className="mx-auto w-full min-w-0 max-w-350 overflow-hidden px-4 py-10 sm:px-6 md:px-8 md:py-12 lg:px-12">
            {loading ? (
              <p className="py-12 text-center text-(--color-text-muted)">
                Cargando catálogo...
              </p>
            ) : modoDescubrimiento ? (
              <>
                <h2 className="theme-page-title mb-8 border-l-4 border-(--accent) pl-3 text-left text-lg font-black uppercase tracking-widest sm:text-xl md:text-2xl">
                  Descubre nuevas obras
                </h2>

                {seccionesDestacadas.recomendadas.length > 0 && (
                  <CarruselCatalogo
                    titulo="Más recomendadas"
                    items={seccionesDestacadas.recomendadas}
                    renderItem={(item) => (
                      <Tarjeta
                        item={item}
                        onClick={() => mostrarDetalle(item)}
                      />
                    )}
                  />
                )}

                {seccionesDestacadas.comentadas.length > 0 && (
                  <CarruselCatalogo
                    titulo="Más comentadas"
                    items={seccionesDestacadas.comentadas}
                    renderItem={(item) => (
                      <Tarjeta
                        item={item}
                        onClick={() => mostrarDetalle(item)}
                      />
                    )}
                  />
                )}

                {seccionesDestacadas.recientes.length > 0 && (
                  <CarruselCatalogo
                    titulo="Añadidas recientemente"
                    items={seccionesDestacadas.recientes}
                    renderItem={(item) => (
                      <Tarjeta
                        item={item}
                        onClick={() => mostrarDetalle(item)}
                      />
                    )}
                  />
                )}

                {mediaData.length === 0 && (
                  <p className="py-12 text-center text-(--color-text-muted)">
                    Aún no hay obras en el catálogo.
                  </p>
                )}
              </>
            ) : (
              <CatalogoCompleto
                titulo={tituloCatalogo}
                items={datosFiltrados}
                terminoBusqueda={terminoBusqueda}
                filtros={filtros}
                onLimpiarFiltros={limpiarBusquedaYFiltros}
                onVerDetalle={mostrarDetalle}
                claveReinicio={claveCatalogo}
              />
            )}
          </main>
        </>
      )}

      {vista === "detalle" && itemSeleccionado && (
        <Detalle
          item={itemSeleccionado}
          onVolver={volverAInicio}
          onVerPerfil={mostrarPerfilUsuario}
        />
      )}

      {vista === "perfil" && (
        <Perfil onVolver={volverDesdePerfil} onVerDetalle={mostrarDetalle} />
      )}

      {vista === "perfil-publico" && perfilPublicoId && (
        <PerfilPublico
          perfilId={perfilPublicoId}
          onVolver={volverDesdePerfil}
          onVerDetalle={mostrarDetalle}
        />
      )}

      {vista === "listas" && (
        <Listas onVolver={volverAInicio} onVerDetalle={mostrarDetalle} />
      )}

      {mostrarActualizarPassword && (
        <ActualizarPasswordModal
          onCerrar={() => setMostrarActualizarPassword(false)}
        />
      )}
    </div>
  );
}

export default App;