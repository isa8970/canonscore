# CanonScore

CanonScore es una Single Page Application para explorar y recomendar películas, series, libros, cómics y anime. Integra catálogo, búsqueda, filtros, perfiles, reseñas, listas, moderación y temas claro/oscuro.

## Tecnologías

- React + Vite
- Supabase Authentication, PostgREST y PostgreSQL
- Row Level Security (RLS)
- Tailwind CSS y variables CSS de tema
- Git / GitHub
- Vercel

## Requisitos locales

- Node.js 18 o superior
- npm
- Proyecto de Supabase configurado

## Instalación

```bash
npm install
```

Crea el archivo `.env.local` con las variables usadas por el cliente de Supabase:

```env
VITE_SUPABASE_URL=TU_URL
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

No publiques claves privadas ni la `service_role` en el frontend.

## Ejecución

```bash
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

## Funciones principales

- Catálogo por películas, series, libros, cómics y anime.
- Banner y carruseles de descubrimiento.
- Búsqueda, filtros por género y orden por recomendación.
- Registro, inicio de sesión y recuperación de contraseña.
- Perfiles propios y públicos sin mostrar correo electrónico.
- Reseñas con valoración Recomendada / No recomendada.
- Favoritos y listas personalizadas públicas o privadas.
- Reportes de reseñas y moderación administrativa.
- CRUD administrativo del catálogo.
- Enlaces externos de disponibilidad.
- Tema oscuro/claro persistente en `localStorage`.
- Placeholders para portadas y banners dañados.
- Diseño responsivo y navegación fija.

## Roles

- **Invitado:** consulta el catálogo, filtros, detalles y reseñas.
- **Usuario:** gestiona perfil, reseñas, Favoritos, listas y reportes.
- **Administrador:** mantiene el catálogo y modera reportes.

## Pruebas manuales prioritarias

1. Registro con username y contraseña válidos.
2. Inicio de sesión y recuperación de contraseña.
3. Búsqueda, filtros y navegación sin recarga.
4. Publicación y edición de una única reseña por obra.
5. Favoritos, listas y prevención de duplicados.
6. Privacidad de listas y perfiles públicos.
7. Reporte duplicado y motivo “Otro”.
8. Moderación desde una cuenta administradora.
9. Persistencia del tema al recargar e iniciar/cerrar sesión.
10. Diseño responsivo y placeholders de imágenes.

La matriz completa se encuentra en `CanonScore_SRS.docx`.

## Despliegue

El frontend puede desplegarse en Vercel. Agrega las mismas variables `VITE_SUPABASE_*` en la configuración del proyecto y registra el dominio en:

`Supabase > Authentication > URL Configuration > Redirect URLs`

## Documentación

- `CanonScore_SRS.docx`

## Autora

Victoria González — 2026
