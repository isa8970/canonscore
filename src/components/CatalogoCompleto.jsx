import { useEffect, useMemo, useState } from "react";

import Tarjeta from "./Tarjeta";

const CANTIDAD_INICIAL = 20;
const CANTIDAD_POR_CARGA = 20;

const CatalogoCompleto = ({
  titulo,
  items = [],
  terminoBusqueda = "",
  filtros,
  onLimpiarFiltros,
  onVerDetalle,
  claveReinicio = "catalogo",
}) => {
  const [limiteVisible, setLimiteVisible] = useState(CANTIDAD_INICIAL);

  useEffect(() => {
    setLimiteVisible(CANTIDAD_INICIAL);
  }, [claveReinicio]);

  const itemsVisibles = useMemo(
    () => items.slice(0, limiteVisible),
    [items, limiteVisible],
  );

  const generosActivos = Array.isArray(filtros?.generos)
    ? filtros.generos
    : [];

  const busquedaActiva = terminoBusqueda.trim();
  const ordenRecomendacion = filtros?.orden === "recomendacion";
  const hayFiltrosActivos =
    Boolean(busquedaActiva) ||
    generosActivos.length > 0 ||
    ordenRecomendacion;

  const cantidad = items.length;
  const quedanElementos = limiteVisible < cantidad;

  return (
    <section className="w-full min-w-0">
      <div className="mb-7 flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="theme-page-title border-l-4 border-(--accent) pl-3 text-lg font-black uppercase tracking-widest sm:text-xl md:text-2xl">
            {titulo}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {cantidad === 1 ? "1 obra encontrada" : `${cantidad} obras encontradas`}
          </p>
        </div>

        {hayFiltrosActivos && typeof onLimpiarFiltros === "function" && (
          <button
            type="button"
            onClick={onLimpiarFiltros}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-300 transition-all hover:border-(--accent)/35 hover:bg-(--accent)/10 hover:text-(--accent) sm:w-auto"
          >
            Limpiar búsqueda y filtros
          </button>
        )}
      </div>

      {hayFiltrosActivos && (
        <div className="mb-7 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            Filtros activos
          </span>

          {busquedaActiva && (
            <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300">
              Búsqueda: “{busquedaActiva}”
            </span>
          )}

          {generosActivos.map((genero) => (
            <span
              key={genero}
              className="rounded-full border border-(--accent)/25 bg-(--accent)/10 px-3 py-1.5 text-xs font-bold text-(--accent)"
            >
              {genero}
            </span>
          ))}

          {ordenRecomendacion && (
            <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-300">
              Mayor recomendación
            </span>
          )}
        </div>
      )}

      {cantidad === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 px-5 py-14 text-center">
          <p className="text-sm font-bold text-zinc-400">
            No se encontraron obras con esos criterios.
          </p>

          {hayFiltrosActivos && typeof onLimpiarFiltros === "function" && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="mt-5 rounded-xl bg-(--accent) px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110"
            >
              Ver catálogo completo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-wrap items-stretch gap-4 sm:gap-5 md:gap-6">
            {itemsVisibles.map((item) => (
              <div
                key={item.id}
                className="min-w-0 shrink-0"
                style={{
                  flex: "0 0 clamp(150px, calc(50vw - 24px), 220px)",
                  width: "clamp(150px, calc(50vw - 24px), 220px)",
                  maxWidth: "220px",
                }}
              >
                <Tarjeta
                  item={item}
                  onClick={() => onVerDetalle?.(item)}
                />
              </div>
            ))}
          </div>

          {quedanElementos && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setLimiteVisible((actual) => actual + CANTIDAD_POR_CARGA)
                }
                className="rounded-xl bg-(--accent) px-8 py-3 text-sm font-black uppercase tracking-wider text-white transition-all hover:brightness-110"
              >
                Cargar más
              </button>

              <p className="text-xs text-zinc-600">
                Mostrando {itemsVisibles.length} de {cantidad}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CatalogoCompleto;