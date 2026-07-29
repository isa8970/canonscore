import React from "react";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";

const Tarjeta = ({ item, onClick }) => {
  const valoraciones = item?.valoraciones ?? {
    positivas: 0,
    negativas: 0,
    total: 0,
    porcentajeRecomendacion: 0,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full min-w-0 cursor-pointer text-left"
      aria-label={`Ver detalles de ${item?.titulo || "la obra"}`}
    >
      <article className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1 hover:border-(--accent)/40 hover:shadow-xl hover:shadow-black/20">
        <div
          className="relative w-full shrink-0 overflow-hidden bg-zinc-900"
          style={{ aspectRatio: "3 / 4" }}
        >
          <img
            src={item?.imagen}
            alt={item?.titulo || "Portada"}
            loading="lazy"
            draggable="false"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex min-w-0 grow flex-col p-3 sm:p-3.5">
          <header className="mb-2 flex min-w-0 items-center justify-between gap-2">
            <span className="max-w-[70%] truncate rounded bg-(--accent)/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-(--accent) sm:text-[9px]">
              {item?.tipo || "Obra"}
            </span>

            <span className="shrink-0 font-mono text-[10px] text-(--text) opacity-40 sm:text-xs">
              {item?.anio || ""}
            </span>
          </header>

          <h3 className="mb-1.5 line-clamp-2 min-w-0 text-sm font-bold leading-snug tracking-tight text-(--text) transition-colors duration-300 group-hover:text-(--accent) sm:text-base">
            {item?.titulo}
          </h3>

          <p className="line-clamp-2 min-w-0 grow text-[11px] leading-relaxed text-(--text) opacity-60 sm:text-xs">
            {item?.descripcion}
          </p>

          <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-white/5 pt-3">
            <div
              className="flex min-w-0 items-center gap-1"
              title="Valoraciones buenas"
            >
              <img
                src={iconoBuena}
                alt="Valoración buena"
                className="h-6 w-5 shrink-0 object-contain sm:h-7 sm:w-6"
              />

              <span className="text-xs font-bold text-amber-300 sm:text-sm">
                {valoraciones.positivas}
              </span>
            </div>

            <div
              className="flex min-w-0 items-center gap-1"
              title="Valoraciones malas"
            >
              <img
                src={iconoMala}
                alt="Valoración mala"
                className="h-6 w-5 shrink-0 object-contain sm:h-7 sm:w-6"
              />

              <span className="text-xs font-bold text-rose-400 sm:text-sm">
                {valoraciones.negativas}
              </span>
            </div>

            <span
              className="shrink-0 text-[10px] font-black text-(--accent) sm:text-xs"
              title="Porcentaje de recomendación"
            >
              {valoraciones.total > 0
                ? `${valoraciones.porcentajeRecomendacion}%`
                : "Sin votos"}
            </span>
          </div>
        </div>
      </article>
    </button>
  );
};

export default Tarjeta;