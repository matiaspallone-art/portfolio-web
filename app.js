/* Arma las secciones del sitio a partir de content.js y maneja el cambio de idioma (ES / EN).
   No hace falta tocar este archivo. */
(function () {
  var C = window.CONTENT;
  if (!C) return;
  var LANGS = ["es", "en"];
  var lang = "es";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Devuelve el texto en el idioma actual. Acepta un texto simple o { es: "...", en: "..." }.
  function tr(value) {
    if (value && typeof value === "object") return value[lang] || value.es || "";
    return value || "";
  }
  function ui(key) {
    var d = (C.ui && C.ui[lang]) || {};
    return d[key] || (C.ui && C.ui.es && C.ui.es[key]) || "";
  }

  // Solo se aceptan links web normales (https://, http://, mailto:) para evitar enlaces raros.
  function safeUrl(url) {
    return /^(https?:\/\/|mailto:)/i.test(url || "") ? url : "";
  }

  // Solo rutas internas del sitio (img/...) para fotos y videos; evita cargar archivos de otros sitios.
  function safeAsset(path) {
    return /^img\/[A-Za-z0-9._\-\/]+$/.test(path || "") && path.indexOf("..") === -1 ? path : "";
  }

  function tile(item, fallbackLabel) {
    var t = el("div", "tile");
    var label = tr(item.titulo) || fallbackLabel || "";
    var video = safeAsset(item.video);
    var src = safeAsset(item.src);
    if (item.fondo && /^#[0-9a-fA-F]{3,8}$/.test(item.fondo)) t.style.background = item.fondo;
    if (video) {
      // Sitio en movimiento: sin sonido, en bucle, y se pausa si la persona prefiere menos animación.
      var v = el("video");
      v.muted = true; v.defaultMuted = true;
      v.loop = true; v.autoplay = true; v.playsInline = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("loop", "");
      v.preload = "metadata";
      var poster = safeAsset(item.poster || src);
      if (poster) v.poster = poster;
      v.src = video;
      v.setAttribute("aria-label", tr(item.descripcionVisual) || label);
      v.disablePictureInPicture = true;
      v.setAttribute("controlslist", "nodownload noremoteplayback");
      if (item.ajuste === "contain") v.style.objectFit = "contain";
      t.appendChild(v);
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { v.autoplay = false; v.removeAttribute("autoplay"); }
    } else if (src) {
      var img = el("img");
      img.src = src;
      img.alt = tr(item.descripcionVisual) || label;
      img.loading = "lazy";
      if (item.pos && /^[0-9%\s.]+$/.test(item.pos)) img.style.objectPosition = item.pos;
      if (item.ajuste === "contain") img.style.objectFit = "contain";
      t.appendChild(img);
    } else {
      t.textContent = "[ " + (tr(item.titulo) || fallbackLabel || "") + " ]";
    }
    return t;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // Freno básico: sin menú de "guardar imagen" ni arrastre sobre las fotos del sitio.
  document.addEventListener("contextmenu", function (e) {
    if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "VIDEO")) e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "VIDEO")) e.preventDefault();
  });

  var s = C.sitio || {};

  function render() {
    document.documentElement.lang = lang;
    document.title = ui("meta_title");
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", ui("meta_desc"));

    // Textos fijos
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = ui(nodes[i].getAttribute("data-i18n"));
    }

    // Botones de idioma
    var buttons = document.querySelectorAll(".lang button");
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].setAttribute("aria-pressed", buttons[b].getAttribute("data-lang") === lang ? "true" : "false");
    }
    var group = document.querySelector(".lang");
    if (group) group.setAttribute("aria-label", ui("lang_label") + " / " + (lang === "es" ? "Language" : "Idioma"));

    // Nombre en dos líneas
    var nombre = document.getElementById("nombre");
    clear(nombre);
    (s.nombre || "").split(" ").forEach(function (p, idx) {
      if (idx > 0) nombre.appendChild(document.createElement("br"));
      nombre.appendChild(document.createTextNode(p));
    });
    document.getElementById("anio").textContent = new Date().getFullYear();

    // Fotografía
    var fotos = document.getElementById("fotos");
    clear(fotos);
    (C.fotos || []).forEach(function (f) { fotos.appendChild(tile(f)); });
    var fl = safeUrl(s.portfolioFotosUrl);
    var a = document.getElementById("fotos-link");
    if (fl) { a.href = fl; a.hidden = false; }
    var dom = document.getElementById("fotos-dominio");
    if (s.portfolioFotosDominio) { dom.textContent = s.portfolioFotosDominio; dom.hidden = false; }

    // Proyectos web
    var cont = document.getElementById("proyectos");
    clear(cont);
    (C.proyectos || []).forEach(function (p) {
      var wrap = el("article", "project");
      wrap.appendChild(tile({
        src: p.imagen, video: p.video, fondo: p.fondo, ajuste: p.ajuste,
        descripcionVisual: p.descripcionVisual,
        titulo: ui("captura_de") + " " + p.nombre
      }));
      var txt = el("div", "project-text");
      var estado = p.estado === "online" ? ui("proyecto_online") : ui("proyecto_desarrollo");
      txt.appendChild(el("p", "eyebrow", p.numero + " — " + estado));
      txt.appendChild(el("h3", "", p.nombre));
      txt.appendChild(el("p", "resumen", tr(p.resumen)));
      txt.appendChild(el("p", "detalle", tr(p.detalle)));
      var url = safeUrl(p.url);
      if (p.estado === "online" && url) {
        var link = el("a", "link-line", ui("ver_sitio") + " · " + url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        txt.appendChild(link);
      } else {
        txt.appendChild(el("span", "soon", ui("proximamente")));
      }
      wrap.appendChild(txt);
      cont.appendChild(wrap);
    });

    // Arte
    var arte = C.arte || {};
    document.getElementById("arte-nombre").textContent = arte.nombre || "";
    document.getElementById("arte-etiqueta").textContent = tr(arte.etiqueta);
    document.getElementById("arte-desc").textContent = tr(arte.descripcion);
    // Portada animada de LL-one (video en bucle) + link al sitio
    var portada = document.getElementById("arte-portada");
    clear(portada);
    if (arte.video || arte.imagen) {
      portada.appendChild(tile({
        src: arte.imagen, video: arte.video, descripcionVisual: arte.descripcionVisual,
        titulo: arte.nombre
      }));
      portada.hidden = false;
    } else { portada.hidden = true; }
    var aurl = safeUrl(arte.url);
    var alink = document.getElementById("arte-link");
    var awrap = document.getElementById("arte-link-wrap");
    if (aurl) {
      alink.textContent = ui("ver_sitio") + " · " + aurl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      alink.href = aurl;
      awrap.hidden = false;
    } else { awrap.hidden = true; }
    // Obras: solo se muestran las que tienen imagen (sin recuadros vacíos)
    var obras = document.getElementById("obras");
    clear(obras);
    (arte.obras || []).forEach(function (o) { if (safeAsset(o.src)) obras.appendChild(tile(o)); });
    obras.hidden = !obras.firstChild;

    // Foto de "Sobre mí"
    var af = document.getElementById("about-foto");
    if (af) {
      clear(af);
      af.appendChild(tile({
        src: s.sobreMiFoto, pos: s.sobreMiFotoPos,
        descripcionVisual: s.sobreMiFotoAlt,
        titulo: ui("tile_retrato")
      }, ui("tile_retrato")));
    }

    // Contacto
    var email = document.getElementById("email");
    clear(email);
    if (s.email) {
      var m = el("a", "", s.email);
      m.href = "mailto:" + s.email;
      email.appendChild(m);
      email.hidden = false;
    }
    var social = document.getElementById("social");
    clear(social);
    [["Instagram", s.instagram], ["LinkedIn", s.linkedin], ["Behance", s.behance]].forEach(function (par) {
      var u = safeUrl(par[1]);
      if (!u) return;
      var l = el("a", "", par[0]);
      l.href = u;
      l.target = "_blank";
      l.rel = "noopener";
      social.appendChild(l);
    });
  }

  function initialLang() {
    var fromUrl = /[?&]lang=(es|en)\b/.exec(window.location.search);
    if (fromUrl) return fromUrl[1];
    try {
      var saved = window.localStorage.getItem("lang");
      if (LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* sin almacenamiento: no pasa nada */ }
    var nav = (navigator.language || "es").toLowerCase();
    return nav.indexOf("es") === 0 ? "es" : "en";
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1) return;
    lang = next;
    try { window.localStorage.setItem("lang", next); } catch (e) { /* ignorar */ }
    render();
  }

  var buttons = document.querySelectorAll(".lang button");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function (e) {
      setLang(e.currentTarget.getAttribute("data-lang"));
    });
  }

  lang = initialLang();
  render();
})();
