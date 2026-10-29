/* Portada con el líquido metalizado de LL-one.
   El video queda casi a oscuro: una luz sigue al mouse (o al dedo) y descubre el movimiento del metal,
   con trazos de pintura alrededor del cursor al moverse. Nunca se revela del todo.
   Sin WebGL, o con "reducir movimiento", se muestra una imagen fija. */
(function () {
  var C = window.CONTENT || {};
  var S = C.sitio || {};
  var LANGS = ["es", "en"];
  var lang = "es";
  var VIDEO = "img/llone-chrome.mp4";
  var POSTER = "img/llone-chrome-poster.webp";

  var hero = document.getElementById("inicio");
  var canvas = document.getElementById("hero-canvas");
  var fallback = document.getElementById("hero-fallback");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  /* ---------- Textos ---------- */
  function ui(key) {
    var d = (C.ui && C.ui[lang]) || {};
    return d[key] || (C.ui && C.ui.es && C.ui.es[key]) || "";
  }
  function initialLang() {
    var m = /[?&]lang=(es|en)\b/.exec(window.location.search);
    if (m) return m[1];
    try { var s = window.localStorage.getItem("lang"); if (LANGS.indexOf(s) !== -1) return s; } catch (e) {}
    return ((navigator.language || "es").toLowerCase().indexOf("es") === 0) ? "es" : "en";
  }
  function renderText() {
    document.documentElement.lang = lang;
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = ui(nodes[i].getAttribute("data-i18n"));
    var h = document.getElementById("hero-hint");
    if (h) h.textContent = ui(coarse ? "hero_hint_touch" : "hero_hint_mouse");
    var nombre = document.getElementById("nombre");
    while (nombre.firstChild) nombre.removeChild(nombre.firstChild);
    (S.nombre || "").split(" ").forEach(function (p, idx) {
      if (idx > 0) nombre.appendChild(document.createElement("br"));
      nombre.appendChild(document.createTextNode(p));
    });
    var bs = document.querySelectorAll(".lang button");
    for (var b = 0; b < bs.length; b++) bs[b].setAttribute("aria-pressed", bs[b].getAttribute("data-lang") === lang ? "true" : "false");
  }
  lang = initialLang();
  renderText();
  var bs = document.querySelectorAll(".lang button");
  for (var bi = 0; bi < bs.length; bi++) {
    bs[bi].addEventListener("click", function (e) {
      lang = e.currentTarget.getAttribute("data-lang");
      try { window.localStorage.setItem("lang", lang); } catch (err) {}
      renderText();
    });
  }

  function showFallback() {
    if (canvas) canvas.hidden = true;
    if (fallback) {
      fallback.style.backgroundImage = "url(" + POSTER + ")";
      fallback.style.backgroundPosition = "50% 50%";
      fallback.style.opacity = "0.55";
      fallback.hidden = false;
    }
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) ||
         canvas.getContext("experimental-webgl");
  } catch (e) { gl = null; }
  if (!gl) { showFallback(); return; }

  /* ---------- Shader ---------- */
  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  var FS = [
    "precision highp float;",
    "uniform sampler2D t0;",
    "uniform vec2 res; uniform float ia;",
    "uniform vec2 mouse; uniform float vel; uniform float time;",
    "uniform float radius; uniform float amb; uniform float cap; uniform float hov;",
    "float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }",
    "vec2 cover(vec2 p){",
    "  float sa = res.x/res.y;",
    "  if (sa > ia){ float vh = ia/sa; return vec2(p.x, 0.5 - vh*0.5 + p.y*vh); }",
    "  float vw = sa/ia; return vec2(0.5 - vw*0.5 + p.x*vw, p.y);",
    "}",
    "void main(){",
    "  vec2 p = vec2(gl_FragCoord.x/res.x, 1.0 - gl_FragCoord.y/res.y);",
    "  float asp = res.x/res.y;",
    "  vec2 pa = vec2(p.x*asp, p.y);",
    "  vec2 q = (p - mouse) * vec2(asp, 1.0);",
    "  float d = length(q);",
    "  float l = exp(-pow(d/radius, 2.0)*1.6);",
    "  float near = exp(-pow(d/(radius*1.8), 2.0));",
    "  float n = fbm(pa*3.0 + time*0.05);",
    "  float ang = n*9.4;",
    "  vec2 dir = vec2(cos(ang)/asp, sin(ang));",
    "  float amt = near*(0.008 + smoothstep(0.1, 1.4, vel)*0.05);",
    "  vec3 c;",
    "  if (amt < 0.003) { c = texture2D(t0, cover(p)).rgb; }",
    "  else {",
    "    float jit = hash(gl_FragCoord.xy + time);",
    "    vec3 acc = vec3(0.0);",
    "    for (int i=0;i<12;i++){ float k = (float(i)+jit)/12.0 - 0.5; acc += texture2D(t0, cover(p + dir*k*amt)).rgb; }",
    "    c = acc/12.0;",
    "  }",
    "  float lum = dot(c, vec3(0.299, 0.587, 0.114));",
    "  c = mix(vec3(lum), c, 0.85);",
    "  float lit = amb + (cap - amb) * l;",
    "  c *= lit;",
    "  c = mix(c, c*vec3(1.08, 1.0, 0.9), l*0.5);",
    "  float vg = 1.0 - 0.6*dot(p-0.5, p-0.5)*2.0;",
    "  c *= clamp(vg, 0.0, 1.0);",
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { showFallback(); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { showFallback(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["t0","res","ia","mouse","vel","time","radius","amb","cap","hov"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.t0, 0);

  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

  var W = 1, H = 1, dpr = 1, aspect = 16 / 9, haveFrame = false;
  function resize() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    if (haveFrame && !running) draw();
  }

  var tx = 0.5, ty = 0.5, mx = 0.5, my = 0.5, vel = 0, lastMove = -99;
  var time = 0, last = 0, running = false, started = false;
  var amb = 0.09, cap = 1.0, radius = coarse ? 0.38 : 0.30, hov = 0, hovT = 0;

  if (!reduce) {
    hero.addEventListener("pointerenter", function () { hovT = 1; lastMove = time; }, { passive: true });
    hero.addEventListener("pointerleave", function () { hovT = 0; }, { passive: true });
    hero.addEventListener("pointermove", function (e) {
      hovT = 1;
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      lastMove = time;
    }, { passive: true });
  }

  var video = document.createElement("video");
  video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
  video.setAttribute("playsinline", ""); video.setAttribute("muted", ""); video.preload = "auto";

  function upload() {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); haveFrame = true; } catch (e) {}
  }
  function draw() {
    gl.uniform2f(U.res, W, H); gl.uniform1f(U.ia, aspect);
    gl.uniform2f(U.mouse, mx, my); gl.uniform1f(U.vel, vel); gl.uniform1f(U.time, time);
    gl.uniform1f(U.radius, radius); gl.uniform1f(U.amb, amb); gl.uniform1f(U.cap, cap); gl.uniform1f(U.hov, hov);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    if (time - lastMove > 2.5) {          // sin movimiento: la luz recorre la escena sola
      tx = 0.5 + 0.3 * Math.cos(time * 0.27); ty = 0.5 + 0.2 * Math.sin(time * 0.41);
    }
    var px = mx, py = my, k = 1 - Math.pow(0.0015, dt);
    mx += (tx - mx) * k; my += (ty - my) * k;
    var sp = Math.sqrt(Math.pow((mx - px) * W / H, 2) + Math.pow(my - py, 2)) / Math.max(dt, 0.001);
    vel += (Math.min(sp, 2.0) - vel) * (1 - Math.pow(0.02, dt));
    hov += (hovT - hov) * (1 - Math.pow(0.04, dt));
    if (video.readyState >= 2) upload();
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (reduce || running || !started) return;
    running = true; last = performance.now();
    var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
    requestAnimationFrame(frame);
  }
  function stop() { running = false; try { video.pause(); } catch (e) {} }

  function onReady() {
    if (started) return;
    started = true;
    aspect = (video.videoWidth || 1920) / (video.videoHeight || 1080);
    resize();
    hero.classList.add("hero-ready");
    if (reduce) { upload(); mx = 0.5; my = 0.45; draw(); } else { start(); }
  }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener("resize", resize);
  resize();

  if (reduce) {
    // imagen fija: se usa el cuadro de portada como textura
    var img = new Image();
    img.onload = function () {
      aspect = img.naturalWidth / img.naturalHeight; resize();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      haveFrame = true; mx = 0.5; my = 0.45; amb = 0.18; draw();
    };
    img.onerror = showFallback;
    img.src = POSTER;
  } else {
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", showFallback);
    video.src = VIDEO; video.load();
    // mientras carga el video, se ve el cuadro de portada
    if (fallback) { fallback.style.backgroundImage = "url(" + POSTER + ")"; fallback.style.opacity = "0.35"; fallback.hidden = false; }
    video.addEventListener("playing", function () { if (fallback) fallback.hidden = true; });
  }

  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else if (started) stop(); }, { threshold: 0.02 }).observe(hero);
  }
  window.__portada = { setPointer: function (x, y) { tx = x; ty = y; lastMove = time; hovT = 1; }, state: function () { return { started: started, t: video.currentTime, haveFrame: haveFrame }; } };
})();
