# Portfolio — Matías Pallone

Sitio estático (HTML + CSS + JS, sin instalaciones). Se publica solo en Vercel cada vez que se sube un cambio a GitHub.

## Qué archivo tocar

- `content.js`: textos, proyectos, links y contacto. Es el único que necesitás editar.
- `img/`: tus fotos e imágenes.
- `index.html`, `styles.css`, `app.js`: estructura y diseño (no hace falta tocarlos).

## Probar en tu Mac antes de publicar

En la Terminal, dentro de la carpeta del proyecto:

    python3 -m http.server 8000

y abrí http://localhost:8000 en el navegador. Para frenar el servidor: Control + C.

## Agregar un proyecto nuevo

En `content.js`, dentro de `proyectos`, copiá un bloque `{ ... }`, pegalo con una coma y cambiá los textos.
Con `estado: "online"` y una `url` aparece el botón "Ver sitio"; con `estado: "desarrollo"` aparece "Próximamente".

## Publicar un cambio

    git add .
    git commit -m "Describí el cambio"
    git push

Y para ver el estado del deploy en Vercel (necesita `npm i -g vercel` y `vercel login` una sola vez):

    vercel ls
