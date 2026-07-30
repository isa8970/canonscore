import React from "react";

import iconoBuena from "/premio.png";
import iconoMala from "/bandera.png";
import ImagenConPlaceholder from "./ImagenConPlaceholder";

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
      <article className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-card) transition-all duration-300 hover:-translate-y-1 hover:border-(--accent)/40 hover:shadow-(--shadow-card-hover)">
        <div
          className="relative w-full shrink-0 overflow-hidden bg-(--color-image-bg)"
          style={{ aspectRatio: "3 / 4" }}
        >
          <ImagenConPlaceholder
            src={item?.imagen}
            alt={item?.titulo || "Portada"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            iconClassName="h-14 w-14 sm:h-16 sm:w-16"
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

          <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-(--color-border) pt-3">
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