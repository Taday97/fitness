# Forma AI – Entrena en casa

App para el móvil (PWA) con rutinas guiadas, un muñeco animado que hace cada ejercicio, voz, gráficas de progreso y un plan personalizado con Gemini que se adapta después de cada entreno.

Todos los datos se guardan en el propio teléfono. No hay servidor ni base de datos.

## Instalarla en Android

1. En GitHub: **Settings → Pages → Source: GitHub Actions** (solo la primera vez).
2. Sube los cambios a `main`. El workflow `.github/workflows/deploy.yml` la publica en
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
3. Abre esa dirección en Chrome en el móvil → menú ⋮ → **Instalar aplicación** (o "Añadir a pantalla de inicio").

## Clave de Gemini (gratis)

1. Entra en https://aistudio.google.com/apikey y crea una clave.
2. Pégala en la app (al empezar o en **Ajustes**). Se guarda solo en tu teléfono.

Sin clave la app funciona igual con un plan básico calculado en el propio móvil.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # compilación de producción
```

Las calorías, proteínas y plazos son estimaciones orientativas, no consejo médico.
