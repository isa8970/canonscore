import React from "react";

const Banner = ({ item, onVerDetalles }) => {
  if (!item) return null;

  return (
    <section className="relative w-full h-[85vh] min-h-150 flex items-end justify-start overflow-hidden">
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img
          src={item.imagenBanner || item.imagen}
          alt={item.titulo}
          className="w-full h-full object-cover object-top"
        />
        {/* Degradado oscuro para resaltar el texto */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Contenido del Banner */}
      <div className="relative z-10 w-full px-6 pb-16 lg:pb-24">
        <div className="max-w-3xl flex flex-col items-start text-left">
          <span className="px-3 py-1 rounded-md bg-(--accent)/20 border border-(--accent)/30 text-(--accent) text-xs font-black uppercase tracking-widest mb-4">
            {item.tipo}
          </span>

          <h2 className="text-5xl md:text-7xl font-extrabold text-(--text) mb-4 leading-tight tracking-tight drop-shadow-lg">
            {item.titulo}
          </h2>

          

          <p className="text-lg md:text-xl text-(--text) opacity-90 mb-8 line-clamp-3 leading-relaxed max-w-2xl font-medium text-left">
            {item.descripcion}
          </p>

          <br />

          <div className="flex flex-row items-center gap-4">
            <button
              onClick={onVerDetalles}
              className="px-10 py-4 rounded-2xl bg-(--accent) text-white font-black uppercase tracking-tighter hover:brightness-110 hover:scale-105 transition-all shadow-2xl shadow-(--accent)/30"
            >
              Ver Detalles
            </button>
            <button className="px-10 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-(--text) font-black uppercase tracking-tighter hover:bg-white/10 transition-all">
              + Añadir a lista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
