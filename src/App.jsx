import { useEffect, useMemo, useState } from "react";

import Nav from "./components/nav";
import Banner from "./components/banner";
import Tarjeta from "./components/Tarjeta";
import CarruselCatalogo from "./components/CarruselCatalogo";
import Detalle from "./components/Detalle";
import Perfil from "./components/Perfil";
import PerfilPublico from "./components/PerfilPublico";
import Listas from "./components/Listas";
import { useAuth } from "./context/AuthContext";

import { supabase } from "./config/supabaseClient";
import { CATEGORIAS_MAP } from "./constants/categorias";

const FILTROS_INICIALES = {
  generos: [],
  orden: "catalogo",
};

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

function App() {
  const { usuario } = useAuth();
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

      setMediaData((data || []).map(normalizarObra));
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

  const generosMap = useMemo(() => {
    const grupos = datosFiltrados.reduce((acumulador, item) => {
      const generosItem = normalizarGeneros(item);
      const generosParaMostrar =
        generosItem.length > 0 ? generosItem : ["Otros"];

      generosParaMostrar.forEach((genero) => {
        if (!acumulador[genero]) {
          acumulador[genero] = [];
        }

        acumulador[genero].push(item);
      });

      return acumulador;
    }, {});

    return Object.fromEntries(
      Object.entries(grupos).sort(([generoA], [generoB]) =>
        generoA.localeCompare(generoB, "es", {
          sensitivity: "base",
        }),
      ),
    );
  }, [datosFiltrados]);

  const itemBanner = useMemo(() => {
    if (datosFiltrados.length > 0) {
      return datosFiltrados[0];
    }

    return mediaData[0] || null;
  }, [datosFiltrados, mediaData]);

  const etiquetaCategoria =
    Object.entries(CATEGORIAS_MAP).find(
      ([, valor]) => valor === categoriaActiva,
    )?.[0] || categoriaActiva;

  const mostrarDetalle = (item) => {
    const obraNormalizada = normalizarObra(item);

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
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-neutral-950 text-(--text) selection:bg-(--accent) selection:text-white lg:pl-64">
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
      />

      {/* Reserva el espacio del nav fijo para que no cubra el contenido. */}
      <div className="h-14 sm:h-16" aria-hidden="true" />

      {vista === "inicio" && (
        <>
          <div className="w-full min-w-0 overflow-hidden pt-0 sm:pt-2">
            {itemBanner && (
              <Banner
                item={itemBanner}
                onVerDetalles={() => mostrarDetalle(itemBanner)}
              />
            )}
          </div>

          {error && (
            <div className="mx-auto mt-6 w-full max-w-350 px-4 sm:px-6 md:px-8 lg:px-12">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                {error}
              </div>
            </div>
          )}

          <main className="mx-auto w-full min-w-0 max-w-350 overflow-hidden px-4 py-10 sm:px-6 md:px-8 md:py-12 lg:px-12">
            <h2 className="mb-6 border-l-4 border-(--accent) pl-3 text-left text-base font-black uppercase tracking-widest sm:text-lg md:text-xl">
              {categoriaActiva === "Todas"
                ? "Catálogo por géneros"
                : etiquetaCategoria}
            </h2>

            {loading ? (
              <p className="py-12 text-center text-zinc-500">
                Cargando catálogo...
              </p>
            ) : Object.keys(generosMap).length === 0 ? (
              <p className="py-12 text-center text-zinc-500">
                No se encontraron obras con esos filtros.
              </p>
            ) : (
              Object.entries(generosMap).map(([genero, items]) => (
                <CarruselCatalogo
                  key={genero}
                  titulo={genero}
                  items={items}
                  renderItem={(item) => (
                    <Tarjeta
                      item={item}
                      onClick={() => mostrarDetalle(item)}
                    />
                  )}
                />
              ))
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
    </div>
  );
}

export default App;