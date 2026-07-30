import React from "react";

import ImagenConPlaceholder from "./ImagenConPlaceholder";

const Banner = ({ item, onVerDetalles }) => {
  if (!item) return null;

  const portadaMovil = item.imagen || item.imagenBanner;
  const bannerEscritorio = item.imagenBanner || item.imagen;

  return (
    <section className="theme-inverse relative flex h-[68svh] min-h-115 max-h-115 w-full min-w-0 items-end justify-start overflow-hidden md:h-[72vh] md:min-h-115 md:max-h-none">
      <div className="absolute inset-0">
        <ImagenConPlaceholder
          src={bannerEscritorio}
          mobileSrc={portadaMovil}
          alt={item.titulo}
          loading="eager"
          className="h-full w-full object-cover object-center md:object-top"
          iconClassName="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"
        />

        <div className="catalog-banner-primary-overlay absolute inset-0" />
        <div className="catalog-banner-side-overlay absolute inset-0 hidden md:block" />
      </div>

      <div className="relative z-10 w-full min-w-0 px-5 pb-8 sm:px-8 sm:pb-12 md:px-12 md:pb-16 lg:pb-20">
        <div className="catalog-banner-copy flex max-w-3xl min-w-0 flex-col items-start text-left">
          <span className="catalog-media-badge mb-3 rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest sm:mb-4 sm:text-xs">
            {item.tipo}
          </span>

          <h2 className="mb-3 max-w-full text-3xl font-extrabold leading-tight tracking-tight text-(--text) drop-shadow-lg sm:text-4xl md:mb-4 md:text-6xl lg:text-7xl">
            {item.titulo}
          </h2>

          <p className="mb-6 max-w-2xl text-left text-sm font-medium leading-6 text-(--text) opacity-85 line-clamp-3 sm:text-base md:mb-8 md:text-lg md:leading-relaxed">
            {item.descripcion}
          </p>

          <div className="flex w-full sm:w-auto">
            <button
              type="button"
              onClick={onVerDetalles}
              className="w-full rounded-xl bg-(--accent) px-6 py-3 text-sm font-black uppercase tracking-tight text-white shadow-xl shadow-(--accent)/20 transition-all hover:brightness-110 sm:w-auto md:rounded-2xl md:px-8 md:py-3.5"
            >
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;