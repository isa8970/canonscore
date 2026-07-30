export const MIN_USERNAME = 3;
export const MAX_USERNAME = 20;
export const MIN_PASSWORD = 8;
export const MIN_RESENIA = 15;
export const MAX_RESENIA = 1000;
export const MIN_DETALLE_OTRO = 10;
export const MAX_DETALLE_REPORTE = 500;
export const MAX_GENEROS = 5;

export const USERNAMES_RESERVADOS = new Set([
  "admin",
  "administrador",
  "moderador",
  "moderadora",
  "canonscore",
  "soporte",
  "support",
  "root",
  "system",
]);

export const MOTIVOS_REPORTE_VALIDOS = new Set([
  "spam",
  "lenguaje_ofensivo",
  "acoso",
  "spoiler",
  "contenido_inapropiado",
  "otro",
]);

export const GENEROS_PERMITIDOS = [
  "Acción",
  "Animación",
  "Aventura",
  "Ciencia ficción",
  "Comedia",
  "Comedia negra",
  "Crimen",
  "Drama",
  "Drama médico",
  "Drama psicológico",
  "Familiar",
  "Fantasía",
  "Infantil",
  "Misterio",
  "Musical",
  "Romance",
  "Slice of life",
  "Suspenso",
  "Terror",
];

const GENEROS_POR_CLAVE = new Map(
  GENEROS_PERMITIDOS.map((genero) => [
    genero.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
    genero,
  ]),
);

export function normalizarEmail(valor = "") {
  return String(valor).trim().toLowerCase();
}

export function normalizarUsername(valor = "") {
  return String(valor).trim();
}

export function validarUsername(valor) {
  const username = normalizarUsername(valor);

  if (!username) return "El nombre de usuario es obligatorio.";
  if (username.length < MIN_USERNAME) {
    return `El nombre de usuario debe tener al menos ${MIN_USERNAME} caracteres.`;
  }
  if (username.length > MAX_USERNAME) {
    return `El nombre de usuario no puede superar ${MAX_USERNAME} caracteres.`;
  }
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    return "Usa solo letras, números, punto y guion bajo.";
  }
  if (!/[a-zA-Z0-9]/.test(username)) {
    return "El nombre de usuario debe incluir al menos una letra o número.";
  }
  if (USERNAMES_RESERVADOS.has(username.toLowerCase())) {
    return "Ese nombre de usuario está reservado.";
  }

  return null;
}

export function validarPassword(valor) {
  const password = String(valor ?? "");
  if (password.length < MIN_PASSWORD) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  }
  return null;
}

export function validarResenia(valor) {
  const texto = String(valor ?? "").trim();
  if (texto.length < MIN_RESENIA) {
    return `La reseña debe tener al menos ${MIN_RESENIA} caracteres.`;
  }
  if (texto.length > MAX_RESENIA) {
    return `La reseña no puede superar ${MAX_RESENIA} caracteres.`;
  }
  return null;
}

export function validarReporte({ motivo, detalles }) {
  const detalleLimpio = String(detalles ?? "").trim();

  if (!MOTIVOS_REPORTE_VALIDOS.has(motivo)) {
    return "Selecciona un motivo válido.";
  }
  if (detalleLimpio.length > MAX_DETALLE_REPORTE) {
    return `Los detalles no pueden superar ${MAX_DETALLE_REPORTE} caracteres.`;
  }
  if (motivo === "otro" && detalleLimpio.length < MIN_DETALLE_OTRO) {
    return `Describe el motivo con al menos ${MIN_DETALLE_OTRO} caracteres.`;
  }

  return null;
}

export function validarAnio(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;

  const anio = Number(valor);
  const maximo = new Date().getFullYear() + 5;

  if (!Number.isInteger(anio)) return "El año debe ser un número entero.";
  if (anio < 0 || anio > maximo) {
    return `El año debe estar entre 0 y ${maximo}.`;
  }

  return null;
}

function claveGenero(valor) {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizarGeneros(valores) {
  const entrada = Array.isArray(valores)
    ? valores
    : String(valores ?? "")
        .split(",")
        .map((valor) => valor.trim());

  const resultado = [];
  const vistos = new Set();

  entrada.forEach((valor) => {
    const canonico = GENEROS_POR_CLAVE.get(claveGenero(valor));
    if (!canonico || vistos.has(canonico)) return;
    vistos.add(canonico);
    resultado.push(canonico);
  });

  return resultado;
}

export function validarGeneros(valores) {
  const generos = normalizarGeneros(valores);

  if (generos.length === 0) return "Selecciona al menos un género.";
  if (generos.length > MAX_GENEROS) {
    return `Selecciona como máximo ${MAX_GENEROS} géneros.`;
  }

  return null;
}