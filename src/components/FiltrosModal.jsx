import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const FiltrosModal = ({
  generosDisponibles,
  filtrosActuales,
  onAplicar,
  onCerrar,
}) => {
  const [generosSeleccionados, setGenerosSeleccionados] = useState(
    filtrosActuales.generos || []
  );

  const [orden, setOrden] = useState(
    filtrosActuales.orden || 'catalogo'
  );

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') {
        onCerrar();
      }
    };

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, [onCerrar]);

  const alternarGenero = (genero) => {
    setGenerosSeleccionados((actuales) => {
      if (actuales.includes(genero)) {
        return actuales.filter((item) => item !== genero);
      }

      return [...actuales, genero];
    });
  };

  const limpiarFiltros = () => {
    setGenerosSeleccionados([]);
    setOrden('catalogo');
  };

  const aplicarFiltros = () => {
    onAplicar({
      generos: generosSeleccionados,
      orden,
    });

    onCerrar();
  };

  const hayFiltrosTemporales =
    generosSeleccionados.length > 0 ||
    orden !== 'catalogo';

  return createPortal(
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-filtros"
      onClick={onCerrar}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
          <div>
            <p className="mb-2 text-[13px] font-black uppercase tracking-[0.25em] text-(--accent)">
              Explorar catálogo
            </p>

            <h2
              id="titulo-filtros"
              className="mb-2 text-xl font-black uppercase tracking-[0.25em] text-(--accent)"
            >
              Filtros
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Cerrar filtros"
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
        </div>

        {/* Contenido */}
        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
          {/* Géneros */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">
                  Géneros
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Puedes seleccionar más de uno.
                </p>
              </div>

              {generosSeleccionados.length > 0 && (
                <span className="rounded-full border border-(--accent)/25 bg-(--accent)/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-(--accent)">
                  {generosSeleccionados.length} seleccionados
                </span>
              )}
            </div>

            {generosDisponibles.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No hay géneros disponibles.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {generosDisponibles.map((genero) => {
                  const seleccionado =
                    generosSeleccionados.includes(genero);

                  return (
                    <button
                      key={genero}
                      type="button"
                      onClick={() => alternarGenero(genero)}
                      aria-pressed={seleccionado}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                        seleccionado
                          ? 'border-(--accent)/50 bg-(--accent)/20 text-(--accent) shadow-lg shadow-(--accent)/5'
                          : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {genero}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="my-7 h-px bg-white/5" />

          {/* Orden */}
          <section>
            <h3 className="mb-1 text-sm font-black uppercase tracking-widest text-white">
              Ordenar resultados
            </h3>

            <p className="mb-4 text-xs text-zinc-500">
              Organiza las obras usando las valoraciones de la comunidad.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
              <button
                type="button"
                onClick={() => setOrden('catalogo')}
                className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition-all ${
                  orden === 'catalogo'
                    ? 'border-(--accent)/50 bg-(--accent)/15'
                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    orden === 'catalogo'
                      ? 'bg-(--accent)/20 text-(--accent)'
                      : 'bg-white/5 text-zinc-500'
                  }`}
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Orden del catálogo
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Mantiene el orden actual.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrden('recomendacion')}
                className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition-all ${
                  orden === 'recomendacion'
                    ? 'border-(--accent)/50 bg-(--accent)/15'
                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    orden === 'recomendacion'
                      ? 'bg-(--accent)/20 text-(--accent)'
                      : 'bg-white/5 text-zinc-500'
                  }`}
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
                      d="m5 15 4-4 4 4 6-6m0 0v5m0-5h-5"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    Mayor recomendación
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Primero muestra el porcentaje más alto.
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3 border-t border-white/5 bg-zinc-950/95 px-6 py-5">
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltrosTemporales}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-300 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={aplicarFiltros}
            className="rounded-xl bg-(--accent) px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-110"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FiltrosModal;