import { useEffect, useMemo, useState } from "react";

import Nav from "./components/nav";
import Banner from "./components/banner";
import Tarjeta from "./components/Tarjeta";
import Detalle from "./components/Detalle";
import Perfil from "./components/Perfil";
import Listas from "./components/Listas";

import { supabase } from "./config/supabaseClient";
import { CATEGORIAS_MAP } from "./constants/categorias";

const FILTROS_INICIALES = {
  generos: [],
  orden: "catalogo",
};

function normalizarGeneros(item) {
  if (Array.isArray(item.generos)) {
    return item.generos.map((genero) => String(genero).trim()).filter(Boolean);
  }

  const valor = item.generos ?? item.genero ?? "";

  return String(valor)
    .split(",")
    .map((genero) => genero.trim())
    .filter(Boolean);
}

function calcularValoraciones(resenias = []) {
  const positivas = resenias.filter((resenia) => resenia.rating === true).length;
  const negativas = resenias.filter((resenia) => resenia.rating === false).length;
  const total = positivas + negativas;

  return {
    positivas,
    negativas,
    total,
    porcentajeRecomendacion:
      total > 0 ? Math.round((positivas / total) * 100) : 0,
  };
}

function App() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);

  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [vista, setVista] = useState("inicio");
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

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

      const datosMapeados = (data || []).map((item) => {
        const generos = normalizarGeneros(item);

        return {
          ...item,
          imagen: item.cover,
          imagenBanner: item.banner,
          descripcion: item.sinopsis,
          anio: item.anio_pub,
          genero: generos.join(", "),
          generos,
          valoraciones: calcularValoraciones(item.resenias || []),
        };
      });

      setMediaData(datosMapeados);
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
    return datosFiltrados.reduce((acumulador, item) => {
      const generoPrincipal = normalizarGeneros(item)[0] || "Otros";

      if (!acumulador[generoPrincipal]) {
        acumulador[generoPrincipal] = [];
      }

      acumulador[generoPrincipal].push(item);
      return acumulador;
    }, {});
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
    setItemSeleccionado(item);
    setVista("detalle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const volverAInicio = () => {
    setVista("inicio");
    setItemSeleccionado(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irAPerfil = () => {
    setVista("perfil");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irAListas = () => {
    setVista("listas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-(--text) selection:bg-(--accent) selection:text-white lg:pl-64">

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

      {vista === "inicio" && (
        <>
          <div className="pt-6">
            {itemBanner && (
              <Banner
                item={itemBanner}
                onVerDetalles={() => mostrarDetalle(itemBanner)}
              />
            )}
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-350 px-6 md:px-12">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                {error}
              </div>
            </div>
          )}

          <main className="mx-auto max-w-350 px-6 py-12 md:px-12">
            <h2 className="mb-6 border-l-4 border-(--accent) pl-3 text-left text-xl font-black uppercase tracking-widest">
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
                <section key={genero} className="mb-10">
                  <div className="mb-6 flex items-center gap-4">
                    <h3 className="text-lg font-black uppercase tracking-widest">
                      {genero}
                    </h3>
                    <div className="h-px grow bg-linear-to-r from-(--accent)/30 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => mostrarDetalle(item)}
                        className="cursor-pointer text-left"
                      >
                        <Tarjeta item={item} />
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>
        </>
      )}

      {vista === "detalle" && itemSeleccionado && (
        <Detalle item={itemSeleccionado} onVolver={volverAInicio} />
      )}

      {vista === "perfil" && <Perfil onVolver={volverAInicio} />}

      {vista === "listas" && <Listas onVolver={volverAInicio} />}
    </div>
  );
}

export default App;