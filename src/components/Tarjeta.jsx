import React from 'react';

import iconoBuena from '/premio.png';
import iconoMala from '/bandera.png';

const Tarjeta = ({ item }) => {
  const valoraciones = item.valoraciones ?? {
    positivas: 0,
    negativas: 0,
    total: 0,
    porcentajeRecomendacion: 0,
  };

  return (
    <article className="bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/10 hover:border-(--accent)/40 transition-all duration-300 flex flex-col h-full group">
      {/* Imagen de portada sin indicador encima */}
      <div className="relative aspect-3/4 overflow-hidden">
        <img
          src={item.imagen}
          alt={item.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Información de la obra */}
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

        {/* Valoraciones */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-1"
            title="Valoraciones buenas"
          >
            <img
              src={iconoBuena}
              alt="Valoración buena"
              className="w-6 h-8 object-contain"
            />

            <span className="text-sm font-bold text-amber-300">
              {valoraciones.positivas}
            </span>
          </div>

          <div
            className="flex items-center gap-1"
            title="Valoraciones malas"
          >
            <img
              src={iconoMala}
              alt="Valoración mala"
              className="w-6 h-8 object-contain"
            />

            <span className="text-sm font-bold text-rose-400">
              {valoraciones.negativas}
            </span>
          </div>

          <span
            className="text-xs font-black text-(--accent)"
            title="Porcentaje de recomendación"
          >
            {valoraciones.total > 0
              ? `${valoraciones.porcentajeRecomendacion}%`
              : 'Sin votos'}
          </span>
        </div>
      </div>
    </article>
  );
};

export default Tarjeta;