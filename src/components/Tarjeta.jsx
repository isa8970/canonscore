import React from 'react';

const Tarjeta = ({ item }) => {
  return (
    <article className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-(--accent)/40 transition-all duration-300 flex flex-col h-full group">
      {/* Contenedor de Imagen */}
      <div className="relative aspect-3/4 overflow-hidden">
        <img
          src={item.imagen}
          alt={item.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Badge de calificación usando --accent */}
        <div className="absolute top-2 right-2 bg-(--accent) text-white font-bold py-0.5 px-2 rounded-md shadow-lg text-xs backdrop-blur-sm">
          {item.calificacion}
        </div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-3.5 flex flex-col grow">
        <header className="flex justify-between items-center mb-2">
          <span className="text-(--accent) text-[9px] font-black uppercase tracking-widest bg-(--accent)/10 px-1.5 py-0.5 rounded">
            {item.tipo}
          </span>
          <span className="text-(--text) opacity-40 text-xs font-mono">
            {item.anio}
          </span>
        </header>

        <h3 className="text-base font-bold text-(--text) mb-1.5 line-clamp-1 tracking-tight group-hover:text-(--accent) transition-colors duration-300">
          {item.titulo}
        </h3>

        <p className="text-(--text) opacity-60 text-xs line-clamp-2 leading-relaxed grow">
          {item.descripcion}
        </p>
      </div>
    </article>
  );
};

export default Tarjeta;