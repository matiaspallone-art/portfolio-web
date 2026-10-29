/* Logo de las "A": arriba a la izquierda al entrar; al bajar viaja a la esquina inferior derecha
   y se convierte en un botón que abre un chat de WhatsApp con tu número (se configura en content.js, "whatsapp"). */
(function () {
  var brand = document.querySelector(".nav .brand");
  var dock = brand && brand.querySelector(".dock");
  if (!brand || !dock) return;

  var C = window.CONTENT || {};
  var S = C.sitio || {};
  var number = String(S.whatsapp || "").replace(/\D/g, "");
  var hasWA = number.length >= 8;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var label = document.createElement("span");
  label.className = "dock-label";
  dock.appendChild(label);

  function lang() { return document.documentElement.lang === "en" ? "en" : "es"; }
  function ui(key) {
    var u = (C.ui && C.ui[lang()]) || {};
    return u[key] || (C.ui && C.ui.es && C.ui.es[key]) || "";
  }

  var x0 = 0, y0 = 0, sz = 76, ticking = false, docked = false;

  function measure() {
    var r = brand.getBoundingClientRect();
    x0 = r.left;
    y0 = r.top + (window.pageYOffset || 0);
    sz = r.width || 76;
  }

  function setLink(isDocked) {
    if (isDocked === docked) return;
    docked = isDocked;
    dock.classList.toggle("is-docked", docked);
    if (docked) {
      var txt = ui("wa_label") || "WhatsApp";
      brand.setAttribute("aria-label", txt);
      label.textContent = txt;
      if (hasWA) {
        brand.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(ui("wa_text"));
        brand.target = "_blank";
        brand.rel = "noopener";
      } else {
        brand.href = "#contacto";
        brand.removeAttribute("target");
      }
    } else {
      brand.setAttribute("aria-label", S.nombre || "Matías Pallone");
      brand.href = "#inicio";
      brand.removeAttribute("target");
      brand.removeAttribute("rel");
    }
  }

  function update() {
    ticking = false;
    var y = window.pageYOffset || 0, vw = window.innerWidth, vh = window.innerHeight;
    var t = Math.min(1, Math.max(0, y / (vh * 0.5)));
    t = reduce ? (t > 0.35 ? 1 : 0) : t * t * (3 - 2 * t);
    var small = vw < 820;
    var sd = small ? 56 : 72, m = small ? 14 : 24;
    var xd = vw - m - sd, yd = vh - m - sd;
    var px = x0 + (xd - x0) * t, py = (y0 - 0) + (yd - y0) * t;
    var sc = 1 + (sd / sz - 1) * t;
    dock.style.setProperty("--b", t.toFixed(3));
    dock.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
    setLink(t > 0.6);
    var half = sz * sc / 2;
    setTone(px + half, py + half);
  }

  /* ---- Color de las letras: blancas sobre fondo oscuro, negras sobre fondo claro (la "A" naranja no cambia) ---- */
  var cache = new WeakMap(), lastTone = null;
  function lumOfColor(c) {
    var m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    var a = p.length > 3 ? p[3] : 1;
    if (!(a > 0.1)) return null;
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }
  function lumOfImage(img, x, y) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!img.complete || !nw || !nh) return null;
    var c = cache.get(img);
    if (!c) {
      c = document.createElement("canvas"); c.width = 48; c.height = 48;
      try { c.getContext("2d").drawImage(img, 0, 0, 48, 48); } catch (e) { return null; }
      cache.set(img, c);
    }
    var r = img.getBoundingClientRect(), cs = getComputedStyle(img), fit = cs.objectFit;
    var sx = r.width / nw, sy = r.height / nh;
    if (fit === "cover") sx = sy = Math.max(sx, sy); else if (fit === "contain") sx = sy = Math.min(sx, sy);
    var u = (x - r.left - (r.width - nw * sx) / 2) / (nw * sx);
    var v = (y - r.top - (r.height - nh * sy) / 2) / (nh * sy);
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    try {
      var d = c.getContext("2d").getImageData(Math.max(0, Math.min(44, Math.round(u * 47) - 2)), Math.max(0, Math.min(44, Math.round(v * 47) - 2)), 4, 4).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return sum / (d.length / 4) / 255;
    } catch (e) { return null; }
  }
  function lumAt(x, y) {
    var els = document.elementsFromPoint(x, y);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (dock.contains(el) || el === brand || el.classList.contains("nav")) continue;
      if (el.tagName === "CANVAS") return 0.05;               // portada (fondo negro)
      if (el.tagName === "IMG") { var l = lumOfImage(el, x, y); if (l != null) return l; }
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
        var lc = lumOfColor(getComputedStyle(n).backgroundColor);
        if (lc != null) return lc;
      }
    }
    return 1;
  }
  function setTone(x, y) {
    var l = lumAt(x, y);
    // histéresis para que no parpadee en los bordes
    var light = lastTone === null ? l > 0.5 : (lastTone ? l > 0.42 : l > 0.58);
    if (light !== lastTone) { lastTone = light; dock.classList.toggle("on-light", light); }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function remeasure() {
    // medir con el logo en su lugar original (cuando la página está arriba)
    if ((window.pageYOffset || 0) === 0) { measure(); }
    request();
  }

  measure();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", function () { docked = !docked; setLink(!docked); measure(); request(); });
  window.addEventListener("load", remeasure);
  if (window.MutationObserver) {
    new MutationObserver(function () { docked = !docked; setLink(!docked); request(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  update();
})();
