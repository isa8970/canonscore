import React from "react";

const Banner = ({
  item,
  onVerDetalles,
}) => {
  if (!item) return null;

  return (
    <section
      className="
        relative isolate z-0
        flex h-[85vh] min-h-150
        w-full
        items-end justify-start
        overflow-hidden
      "
    >
      <div className="absolute inset-0 z-0">
        <img
          src={
            item.imagenBanner ||
            item.imagen
          }
          alt={item.titulo}
          className="h-full w-full object-cover object-top"
        />

        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />

        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full px-6 pb-16 lg:pb-24">
        <div className="flex max-w-3xl flex-col items-start text-left">
          <span className="mb-4 rounded-md border border-(--accent)/30 bg-(--accent)/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-(--accent)">
            {item.tipo}
          </span>

          <h2 className="mb-4 text-5xl font-extrabold leading-tight tracking-tight text-(--text) drop-shadow-lg md:text-7xl">
            {item.titulo}
          </h2>

          <p className="mb-8 max-w-2xl text-left text-lg font-medium leading-relaxed text-(--text) opacity-90 line-clamp-3 md:text-xl">
            {item.descripcion}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onVerDetalles}
              className="rounded-2xl bg-(--accent) px-10 py-4 font-black uppercase tracking-tighter text-white shadow-2xl shadow-(--accent)/30 transition-all hover:scale-105 hover:brightness-110"
            >
              Ver detalles
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-10 py-4 font-black uppercase tracking-tighter text-(--text) backdrop-blur-xl transition-all hover:bg-white/10"
            >
              + Añadir a lista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;