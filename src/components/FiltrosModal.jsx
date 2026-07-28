import { useState } from "react";
import ModalPortal from "./ModalPortal";

const FiltrosModal = ({
  generosDisponibles = [],
  filtrosActuales = {
    generos: [],
    orden: "catalogo",
  },
  onAplicar = () => {},
  onCerrar,
}) => {
  const generosIniciales =
    Array.isArray(
      filtrosActuales?.generos,
    )
      ? filtrosActuales.generos
      : [];

  const [generosSeleccionados, setGenerosSeleccionados] =
    useState(generosIniciales);

  const [orden, setOrden] = useState(
    filtrosActuales?.orden ||
      "catalogo",
  );

  const alternarGenero = (genero) => {
    setGenerosSeleccionados(
      (actuales) => {
        if (actuales.includes(genero)) {
          return actuales.filter(
            (item) => item !== genero,
          );
        }

        return [...actuales, genero];
      },
    );
  };

  const limpiarFiltros = () => {
    setGenerosSeleccionados([]);
    setOrden("catalogo");
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
    orden !== "catalogo";

  return (
    <ModalPortal onCerrar={onCerrar}>
      <div
        className="
          relative
          flex max-h-[90dvh]
          w-full max-w-2xl
          flex-col
          overflow-hidden
          rounded-3xl
          border border-white/10
          bg-zinc-950
          shadow-2xl
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-filtros"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600">
              Explorar catálogo
            </p>

            <h2
              id="titulo-filtros"
              className="text-xl font-black uppercase tracking-[0.2em] text-(--accent)"
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

        <div className="min-h-0 grow overflow-y-auto px-6 py-6">
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

              {generosSeleccionados.length >
                0 && (
                <span className="rounded-full border border-(--accent)/25 bg-(--accent)/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-(--accent)">
                  {
                    generosSeleccionados.length
                  }{" "}
                  seleccionados
                </span>
              )}
            </div>

            {generosDisponibles.length ===
            0 ? (
              <p className="text-sm text-zinc-500">
                No hay géneros disponibles.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {generosDisponibles.map(
                  (genero) => {
                    const seleccionado =
                      generosSeleccionados.includes(
                        genero,
                      );

                    return (
                      <button
                        key={genero}
                        type="button"
                        onClick={() =>
                          alternarGenero(
                            genero,
                          )
                        }
                        aria-pressed={
                          seleccionado
                        }
                        className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                          seleccionado
                            ? "border-(--accent)/50 bg-(--accent)/20 text-(--accent)"
                            : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {genero}
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <div className="my-7 h-px bg-white/5" />

          <section>
            <h3 className="mb-1 text-sm font-black uppercase tracking-widest text-white">
              Ordenar resultados
            </h3>

            <p className="mb-4 text-xs text-zinc-500">
              Organiza las obras usando las
              valoraciones de la comunidad.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setOrden("catalogo")
                }
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  orden === "catalogo"
                    ? "border-(--accent)/50 bg-(--accent)/15"
                    : "border-white/10 bg-zinc-900/60 hover:border-white/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    orden === "catalogo"
                      ? "bg-(--accent)/20 text-(--accent)"
                      : "bg-white/5 text-zinc-500"
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
                onClick={() =>
                  setOrden(
                    "recomendacion",
                  )
                }
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  orden ===
                  "recomendacion"
                    ? "border-(--accent)/50 bg-(--accent)/15"
                    : "border-white/10 bg-zinc-900/60 hover:border-white/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    orden ===
                    "recomendacion"
                      ? "bg-(--accent)/20 text-(--accent)"
                      : "bg-white/5 text-zinc-500"
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
                    Primero muestra el porcentaje
                    más alto.
                  </p>
                </div>
              </button>
            </div>
          </section>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/5 bg-zinc-950 px-6 py-5">
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={
              !hayFiltrosTemporales
            }
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
    </ModalPortal>
  );
};

export default FiltrosModal;