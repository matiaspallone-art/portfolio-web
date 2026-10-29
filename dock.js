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
    var sd = small ? 52 : 64, m = small ? 16 : 28;
    var xd = vw - m - sd, yd = vh - m - sd;
    var px = x0 + (xd - x0) * t, py = (y0 - 0) + (yd - y0) * t;
    var sc = 1 + (sd / sz - 1) * t;
    dock.style.setProperty("--b", t.toFixed(3));
    dock.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
    setLink(t > 0.6);
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
