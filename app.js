/* Arma las secciones del sitio a partir de content.js. No hace falta tocar este archivo. */
(function () {
  var C = window.CONTENT;
  if (!C) return;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Solo se aceptan links web normales (https://, http://, mailto:) para evitar enlaces raros.
  function safeUrl(url) {
    return /^(https?:\/\/|mailto:)/i.test(url || "") ? url : "";
  }

  function tile(item) {
    var t = el("div", "tile");
    if (item.src) {
      var img = el("img");
      img.src = item.src;
      img.alt = item.titulo || "";
      img.loading = "lazy";
      t.appendChild(img);
    } else {
      t.textContent = "[ " + (item.titulo || "Imagen") + " ]";
    }
    return t;
  }

  // Freno básico: sin menú de "guardar imagen" ni arrastre sobre las fotos del sitio.
  document.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  var s = C.sitio || {};
  document.getElementById("nombre").innerHTML = "";
  var partes = (s.nombre || "").split(" ");
  var nombre = document.getElementById("nombre");
  partes.forEach(function (p, i) {
    if (i > 0) nombre.appendChild(document.createElement("br"));
    nombre.appendChild(document.createTextNode(p));
  });
  document.getElementById("subtitulo").textContent = (s.subtitulo || "").replace(/\s{2,}/g, "  ");
  document.getElementById("frase").textContent = s.frase || "";
  document.getElementById("anio").textContent = new Date().getFullYear();

  // Fotografía
  var fotos = document.getElementById("fotos");
  (C.fotos || []).forEach(function (f) { fotos.appendChild(tile(f)); });
  var fl = safeUrl(s.portfolioFotosUrl);
  if (fl) {
    var a = document.getElementById("fotos-link");
    a.href = fl;
    a.hidden = false;
  }
  var dom = document.getElementById("fotos-dominio");
  if (s.portfolioFotosDominio) {
    dom.textContent = s.portfolioFotosDominio;
    dom.hidden = false;
  }

  // Proyectos web
  var cont = document.getElementById("proyectos");
  (C.proyectos || []).forEach(function (p) {
    var wrap = el("article", "project");
    wrap.appendChild(tile({ src: p.imagen, titulo: "Captura de " + p.nombre }));
    var txt = el("div", "project-text");
    var estado = p.estado === "online" ? "Proyecto web" : "Proyecto web · en desarrollo";
    txt.appendChild(el("p", "eyebrow", p.numero + " — " + estado));
    txt.appendChild(el("h3", "", p.nombre));
    txt.appendChild(el("p", "resumen", p.resumen));
    txt.appendChild(el("p", "detalle", p.detalle));
    var url = safeUrl(p.url);
    if (p.estado === "online" && url) {
      var link = el("a", "link-line", "Ver sitio · " + url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      txt.appendChild(link);
    } else {
      txt.appendChild(el("span", "soon", "Próximamente"));
    }
    wrap.appendChild(txt);
    cont.appendChild(wrap);
  });

  // Arte
  var arte = C.arte || {};
  document.getElementById("arte-nombre").textContent = arte.nombre || "";
  document.getElementById("arte-etiqueta").textContent = arte.etiqueta || "";
  document.getElementById("arte-desc").textContent = arte.descripcion || "";
  var obras = document.getElementById("obras");
  (arte.obras || []).forEach(function (o) { obras.appendChild(tile(o)); });

  // Contacto
  var email = document.getElementById("email");
  if (s.email) {
    var m = el("a", "", s.email);
    m.href = "mailto:" + s.email;
    email.appendChild(m);
    email.hidden = false;
  }
  var social = document.getElementById("social");
  [["Instagram", s.instagram], ["LinkedIn", s.linkedin], ["Behance", s.behance]].forEach(function (par) {
    var u = safeUrl(par[1]);
    if (!u) return;
    var l = el("a", "", par[0]);
    l.href = u;
    l.target = "_blank";
    l.rel = "noopener";
    social.appendChild(l);
  });
})();
