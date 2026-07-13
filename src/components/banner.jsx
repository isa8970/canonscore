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

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-yellow-500">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xl font-bold text-(--text)">
                {item.calificacion}
              </span>
            </div>
            <span className="text-(--text) opacity-40 font-mono text-lg">
              / 10
            </span>
          </div>

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
