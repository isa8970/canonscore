import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const UMBRAL_SCROLL = 4;

const CarruselCatalogo = ({
  titulo,
  items = [],
  renderItem,
}) => {
  const carruselRef = useRef(null);

  const [puedeIrIzquierda, setPuedeIrIzquierda] =
    useState(false);

  const [puedeIrDerecha, setPuedeIrDerecha] =
    useState(false);

  const actualizarEstadoFlechas = useCallback(() => {
    const contenedor = carruselRef.current;

    if (!contenedor) return;

    const maximoScroll = Math.max(
      contenedor.scrollWidth - contenedor.clientWidth,
      0,
    );

    setPuedeIrIzquierda(
      contenedor.scrollLeft > UMBRAL_SCROLL,
    );

    setPuedeIrDerecha(
      maximoScroll - contenedor.scrollLeft >
        UMBRAL_SCROLL,
    );
  }, []);

  useEffect(() => {
    const contenedor = carruselRef.current;

    if (!contenedor) return undefined;

    const actualizar = () => {
      window.requestAnimationFrame(
        actualizarEstadoFlechas,
      );
    };

    actualizarEstadoFlechas();

    contenedor.addEventListener("scroll", actualizar, {
      passive: true,
    });

    let observador;

    if (typeof ResizeObserver !== "undefined") {
      observador = new ResizeObserver(actualizar);
      observador.observe(contenedor);
    } else {
      window.addEventListener("resize", actualizar);
    }

    return () => {
      contenedor.removeEventListener(
        "scroll",
        actualizar,
      );

      observador?.disconnect();
      window.removeEventListener("resize", actualizar);
    };
  }, [items.length, actualizarEstadoFlechas]);

  const desplazar = (direccion) => {
    const contenedor = carruselRef.current;

    if (!contenedor) return;

    const tarjeta = contenedor.firstElementChild;
    const anchoTarjeta =
      tarjeta?.getBoundingClientRect().width || 220;

    const estilos = window.getComputedStyle(contenedor);
    const separacion =
      Number.parseFloat(estilos.columnGap || estilos.gap) || 16;

    const cantidadVisible = Math.max(
      Math.floor(
        contenedor.clientWidth /
          (anchoTarjeta + separacion),
      ),
      1,
    );

    const distancia =
      (anchoTarjeta + separacion) * cantidadVisible;

    contenedor.scrollBy({
      left:
        direccion === "izquierda"
          ? -distancia
          : distancia,
      behavior: "smooth",
    });
  };

  if (!items.length || typeof renderItem !== "function") {
    return null;
  }

  return (
    <section className="mb-10 w-full min-w-0 overflow-hidden">
      <div className="mb-5 flex min-w-0 items-center gap-3 sm:mb-6 sm:gap-4">
        <h3 className="min-w-0 shrink-0 truncate text-sm font-black uppercase tracking-widest sm:text-base md:text-lg">
          {titulo}
        </h3>

        <div className="h-px min-w-0 grow bg-linear-to-r from-(--accent)/30 to-transparent" />

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => desplazar("izquierda")}
            disabled={!puedeIrIzquierda}
            aria-label={`Ver obras anteriores de ${titulo}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--accent) disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:bg-white/5 disabled:hover:text-zinc-400"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="m15 18-6-6 6-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => desplazar("derecha")}
            disabled={!puedeIrDerecha}
            aria-label={`Ver más obras de ${titulo}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-(--accent)/30 hover:bg-(--accent)/10 hover:text-(--accent) disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:bg-white/5 disabled:hover:text-zinc-400"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                d="m9 18 6-6-6-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative w-full min-w-0 overflow-hidden">
        <div
          ref={carruselRef}
          className="flex w-full min-w-0 items-stretch gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 pr-4 scrollbar-none sm:gap-5 md:gap-6 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x proximity",
            scrollPaddingInline: "1rem",
            touchAction: "pan-x",
          }}
          aria-label={`Carrusel de ${titulo}`}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0"
              style={{
                flex: "0 0 clamp(160px, 42vw, 220px)",
                width: "clamp(160px, 42vw, 220px)",
                maxWidth: "220px",
                scrollSnapAlign: "start",
              }}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>

        {puedeIrDerecha && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-linear-to-l from-neutral-950 to-transparent md:block"
            aria-hidden="true"
          />
        )}
      </div>

      {items.length > 1 && (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-700 md:hidden">
          Desliza para ver más
        </p>
      )}
    </section>
  );
};

export default CarruselCatalogo;