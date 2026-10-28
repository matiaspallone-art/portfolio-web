/*
  CONTENIDO DEL SITIO  —  este es el único archivo que tenés que tocar para
  agregar o cambiar proyectos, links y datos de contacto.

  Reglas simples:
  - Todo texto va entre comillas "así".
  - Cada proyecto es un bloque { ... } separado por comas.
  - estado: "online"      -> muestra el botón "Ver sitio" (necesita url)
  - estado: "desarrollo"  -> muestra "Próximamente" (sin botón)
  - Si un dato está vacío ("") esa parte del sitio simplemente no se muestra.
*/
window.CONTENT = {
  sitio: {
    nombre: "Matías Pallone",
    subtitulo: "Fotógrafo de moda  I  Director creativo  I  Diseñador web",
    frase:
      "Imagen, marca y sitio web como un solo lenguaje. Dirección creativa para marcas de ropa y accesorios, desde el moodboard hasta la pantalla.",

    // Portfolio de fotos (ya publicado). Cuando compres el dominio, reemplazá la url.
    portfolioFotosUrl: "https://portfolio-map-dun.vercel.app",
    portfolioFotosDominio: "",

    // Contacto: completá lo que quieras mostrar; lo vacío no aparece.
    email: "",
    instagram: "",
    linkedin: "",
    behance: ""
  },

  // Fotos de la sección Fotografía. Con "src" vacío se muestra un recuadro gris.
  // Cuando tengas las fotos, ponelas en la carpeta img/ y escribí: src: "img/mi-foto.jpg"
  fotos: [
    { src: "", titulo: "Editorial moda — serie 01" },
    { src: "", titulo: "Retrato" },
    { src: "", titulo: "Producto / accesorios" },
    { src: "", titulo: "Serie 02" },
    { src: "", titulo: "Serie 03" },
    { src: "", titulo: "Serie 04" }
  ],

  // Proyectos web. Para sumar uno nuevo: copiá un bloque, pegalo y cambiá los textos.
  proyectos: [
    {
      numero: "01",
      nombre: "Readcycle",
      resumen: "Marketplace de compra y venta de libros usados.",
      detalle:
        "Creación de usuarios, marketplace para publicar y comprar libros, y gestión de envíos. Diseño de interfaz y desarrollo con Next.js, Supabase y Mercado Pago.",
      url: "https://readcycle.com.ar",
      estado: "online",
      imagen: ""
    },
    {
      numero: "02",
      nombre: "Andean Condor",
      resumen: "Portfolio financiero con TradingView integrado.",
      detalle:
        "Información de cada activo del fondo, cálculo de rendimientos e indicadores financieros. Estética sobria e institucional.",
      url: "",
      estado: "desarrollo",
      imagen: ""
    }
  ],

  // Curaduría de arte digital con IA (nombre provisional).
  arte: {
    nombre: "LL-one",
    etiqueta: "Arte digital con IA · nombre provisional",
    descripcion: "Curaduría de arte digital creado con inteligencia artificial.",
    url: "",
    obras: [
      { src: "", titulo: "Obra 01" },
      { src: "", titulo: "Obra 02" },
      { src: "", titulo: "Obra 03" }
    ]
  }
};
