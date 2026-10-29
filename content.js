/*
  CONTENIDO DEL SITIO / SITE CONTENT
  Este es el único archivo que tenés que tocar para agregar o cambiar proyectos,
  links, datos de contacto y textos. Todo texto tiene dos versiones: es (español) y en (inglés).

  Reglas simples:
  - Todo texto va entre comillas "así".
  - Cada texto con idioma se escribe así:  { es: "Hola", en: "Hello" }
  - Cada proyecto es un bloque { ... } separado por comas.
  - estado: "online"      -> muestra el botón "Ver sitio" (necesita url)
  - estado: "desarrollo"  -> muestra "Próximamente" (sin botón)
  - Si un dato está vacío ("") esa parte del sitio simplemente no se muestra.
*/
window.CONTENT = {
  sitio: {
    nombre: "Matías Pallone",

    // Portfolio de fotos (ya publicado). Cuando compres el dominio, reemplazá la url.
    portfolioFotosUrl: "https://matiaspallone.com.ar",
    portfolioFotosDominio: "matiaspallone.com.ar",

    // Contacto: completá lo que quieras mostrar; lo vacío no aparece.
    email: "",
    instagram: "",
    linkedin: "",
    behance: ""
  },

  // Fotos de la sección Fotografía. Con "src" vacío se muestra un recuadro gris.
  // Cuando tengas las fotos, ponelas en la carpeta img/ y escribí: src: "img/mi-foto.jpg"
  // "pos" (opcional) decide qué parte de la foto queda visible cuando se recorta: "50% 20%" = centro, un poco arriba.
  fotos: [
    { src: "img/editorial-01.webp", pos: "50% 30%", titulo: { es: "Editorial de moda — serie 01", en: "Fashion editorial — series 01" } },
    { src: "img/retrato.webp", pos: "50% 25%", titulo: { es: "Retrato", en: "Portrait" } },
    { src: "img/accesorios.webp", pos: "50% 50%", titulo: { es: "Accesorios", en: "Accessories" } },
    { src: "img/editorial-02.webp", pos: "50% 30%", titulo: { es: "Editorial de moda — serie 02", en: "Fashion editorial — series 02" } },
    { src: "img/producto.webp", pos: "50% 40%", titulo: { es: "Producto", en: "Product" } },
    { src: "img/editorial-03.webp", pos: "50% 20%", titulo: { es: "Editorial de moda — serie 03", en: "Fashion editorial — series 03" } }
  ],

  // Proyectos web. Para sumar uno nuevo: copiá un bloque, pegalo y cambiá los textos.
  proyectos: [
    {
      numero: "01",
      nombre: "Readcycle",
      resumen: {
        es: "Marketplace de compra y venta de libros usados.",
        en: "Marketplace for buying and selling used books."
      },
      detalle: {
        es: "Creación de usuarios, marketplace para publicar y comprar libros, y gestión de envíos. Diseño de interfaz y desarrollo con Next.js, Supabase y Mercado Pago.",
        en: "User accounts, a marketplace to list and buy books, and shipping management. Interface design and development with Next.js, Supabase and Mercado Pago."
      },
      url: "https://readcycle.com.ar",
      estado: "online",
      // Si hay "video", el recuadro muestra el sitio en movimiento (sin sonido, en bucle). "imagen" se usa como portada mientras carga.
      imagen: "img/readcycle-poster-hq.jpg",
      video: "img/readcycle-demo-hq.mp4",
      descripcionVisual: {
        es: "Recorrido animado de Readcycle: portada, sección de juegos, Armá palabras y Mini crucigrama.",
        en: "Animated walkthrough of Readcycle: home, games section, word builder and mini crossword."
      }
    },
    {
      numero: "02",
      nombre: "Andean Condor",
      resumen: {
        es: "Portfolio financiero con TradingView integrado.",
        en: "Financial portfolio with integrated TradingView."
      },
      detalle: {
        es: "Información de cada activo del fondo, cálculo de rendimientos e indicadores financieros. Estética sobria e institucional.",
        en: "Information on each of the fund's assets, return calculations and financial indicators. A sober, institutional look."
      },
      url: "https://condor-investment-platform.vercel.app",
      estado: "online",
      imagen: "img/andean-condor-hq.jpg",
      // fondo y ajuste del recuadro: "contain" muestra la imagen completa sin recortar
      fondo: "#0b1220",
      ajuste: "contain",
      descripcionVisual: {
        es: "Andean Condor: portada, resumen del portfolio y ficha de un activo.",
        en: "Andean Condor: home, portfolio overview and an asset page."
      }
    }
  ],

  // Curaduría de arte digital con IA (nombre provisional).
  arte: {
    nombre: "LL-one",
    etiqueta: { es: "Arte digital con IA · nombre provisional", en: "AI digital art · working name" },
    descripcion: {
      es: "Curaduría de arte digital creado con inteligencia artificial.",
      en: "Digital art curation made with artificial intelligence."
    },
    url: "https://ll-one-studio.vercel.app",
    // Portada animada del sitio (video en bucle, sin sonido). "imagen" se usa mientras carga.
    video: "img/llone-cover.mp4",
    imagen: "img/llone-poster.jpg",
    descripcionVisual: {
      es: "Portada animada de LL-one Studio: cromo líquido en movimiento.",
      en: "Animated cover of LL-one Studio: moving liquid chrome."
    },
    // Obras: agregá { src: "img/obra.jpg", titulo: {es:"…", en:"…"} }. Las que no tienen src no se muestran.
    obras: [
      { src: "", titulo: { es: "Obra 01", en: "Artwork 01" } },
      { src: "", titulo: { es: "Obra 02", en: "Artwork 02" } },
      { src: "", titulo: { es: "Obra 03", en: "Artwork 03" } }
    ]
  },

  // Textos fijos de la página (menú, títulos, servicios, sobre mí, etc.)
  ui: {
    es: {
      meta_title: "Matías Pallone — Fotógrafo, director creativo y diseñador web",
      meta_desc: "Portfolio de Matías Pallone: fotografía de moda, dirección creativa, branding y diseño web. Buenos Aires.",
      nav_fotografia: "Fotografía", nav_web: "Web", nav_arte: "Arte",
      nav_servicios: "Servicios", nav_contacto: "Contacto",
      lang_label: "Idioma",
      hero_note: "[ Imagen de portada a pantalla completa — tu mejor foto editorial ]",
      subtitulo: "Fotógrafo de moda  I  Director creativo  I  Diseñador web",
      frase: "Imagen, marca y sitio web como un solo lenguaje. Dirección creativa para marcas de ropa y accesorios, desde el moodboard hasta la pantalla.",
      fotografia_title: "Fotografía", fotografia_status: "Portfolio en construcción",
      fotos_link: "Ver portfolio completo",
      web_title: "Diseño web", web_sub: "UI / UX · Sistemas visuales",
      proyecto_online: "Proyecto web", proyecto_desarrollo: "Proyecto web · en desarrollo",
      ver_sitio: "Ver sitio", proximamente: "Próximamente", captura_de: "Captura de",
      servicios_title: "Servicios",
      s1: "Fotografía de moda y editorial", s2: "Branding y sistemas visuales", s3: "Videografía",
      s4: "Diseño web · UI / UX", s5: "Dirección creativa",
      s6: "Asesoría en finanzas y gestión comercial", s6_small: "Con 5 años de experiencia dirigiendo una cafetería",
      about_title: "Sobre mí", tile_retrato: "[ Retrato de Matías ]",
      about_lead: "Fotógrafo hace 8 años, Licenciado en Comercialización, con estudio propio en Buenos Aires.",
      about_body: "Combino dirección creativa, producción visual, diseño web y gestión comercial. Trabajo con inteligencia artificial, Python y SQL para sumar a mi trabajo creativo y de negocio. Durante 5 años dirigí una cafetería: finanzas, equipo y gestión legal. Esa experiencia respalda mi asesoría a emprendedores.",
      contact_eyebrow: "Contacto", contact_big: "Trabajemos juntos",
      legal: "Todas las imágenes, textos y diseños de este sitio son obra de Matías Pallone. Todos los derechos reservados. Prohibida su reproducción, copia o uso sin autorización escrita."
    },
    en: {
      meta_title: "Matías Pallone — Photographer, creative director and web designer",
      meta_desc: "Portfolio of Matías Pallone: fashion photography, creative direction, branding and web design. Buenos Aires.",
      nav_fotografia: "Photography", nav_web: "Web", nav_arte: "Art",
      nav_servicios: "Services", nav_contacto: "Contact",
      lang_label: "Language",
      hero_note: "[ Full-screen cover image — your best editorial photo ]",
      subtitulo: "Fashion Photographer  I  Creative Director  I  Web Designer",
      frase: "Image, brand and website as a single language. Creative direction for clothing and accessories brands, from moodboard to screen.",
      fotografia_title: "Photography", fotografia_status: "Portfolio in progress",
      fotos_link: "View full portfolio",
      web_title: "Web design", web_sub: "UI / UX · Visual systems",
      proyecto_online: "Web project", proyecto_desarrollo: "Web project · in development",
      ver_sitio: "Visit site", proximamente: "Coming soon", captura_de: "Screenshot of",
      servicios_title: "Services",
      s1: "Fashion and editorial photography", s2: "Branding and visual systems", s3: "Videography",
      s4: "Web design · UI / UX", s5: "Creative direction",
      s6: "Finance and business management advisory", s6_small: "5 years of experience running a café",
      about_title: "About me", tile_retrato: "[ Portrait of Matías ]",
      about_lead: "Photographer for 8 years, graduate in Marketing, with my own studio in Buenos Aires.",
      about_body: "I combine creative direction, visual production, web design and business management. I work with artificial intelligence, Python and SQL to add to my creative and business work. For 5 years I ran a café: finances, team and legal management. That experience backs my advice to entrepreneurs.",
      contact_eyebrow: "Contact", contact_big: "Let's work together",
      legal: "All images, texts and designs on this site are the work of Matías Pallone. All rights reserved. Reproduction, copying or use without written permission is prohibited."
    }
  }
};
