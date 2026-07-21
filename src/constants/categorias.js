// Relación entre lo que se muestra en el Nav y el valor real
// guardado en la columna `tipo` de la tabla `libreria` (enum media_type).
// Si algún día agregas una categoría nueva, solo se edita aquí.

export const CATEGORIAS_MAP = {
  'Todas': 'Todas',
  'Películas': 'pelicula',
  'Series': 'serie',
  'Libros': 'libro',
  'Cómics': 'comic',
  'Anime': 'anime',
};

// Mapa inverso, útil para mostrar el título legible cuando solo
// tenemos el valor crudo (ej. categoriaActiva === 'pelicula').
export const CATEGORIAS_DISPLAY = Object.fromEntries(
  Object.entries(CATEGORIAS_MAP).map(([label, valor]) => [valor, label])
);