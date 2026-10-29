/* Portada interactiva: una luz (claroscuro) que sigue al mouse/dedo y revela la foto;
   al moverse, la imagen se "pinta" con trazos como en el impresionismo y se recompone sola.
   Cada pocos segundos pasa a la siguiente foto con una transición pictórica.
   Si el navegador no soporta WebGL o la persona prefiere menos movimiento, se muestra una imagen fija. */
(function () {
  var C = window.CONTENT || {};
  var S = C.sitio || {};
  var LANGS = ["es", "en"];
  var lang = "es";

  var SLIDES = [
    { src: "img/editorial-perlas.webp", fx: 0.5, fy: 0.24 },
    { src: "img/perfume.webp", fx: 0.5, fy: 0.55 },
    { src: "img/retrato-editorial.webp", fx: 0.5, fy: 0.3 },
    { src: "img/auto-clasico.webp", fx: 0.5, fy: 0.6 }
  ];
  var HOLD = 6.5, TRANS = 2.6;

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

  /* ---------- Imagen fija (respaldo) ---------- */
  function showFallback() {
    if (canvas) canvas.hidden = true;
    if (fallback) {
      fallback.style.backgroundImage = "url(" + SLIDES[0].src + ")";
      fallback.style.backgroundPosition = "50% " + Math.round(SLIDES[0].fy * 100) + "%";
      fallback.hidden = false;
    }
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) ||
         canvas.getContext("experimental-webgl");
  } catch (e) { gl = null; }
  if (!gl) { showFallback(); return; }

  /* ---------- Shaders ---------- */
  var VS = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  var FS = [
    "precision highp float;",
    "uniform sampler2D t0; uniform sampler2D t1;",
    "uniform vec2 res; uniform vec2 ia; uniform vec2 f0; uniform vec2 f1;",
    "uniform vec2 mouse; uniform float vel; uniform float mixv; uniform float time;",
    "uniform float lightK; uniform float radius; uniform float amb;",
    "float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }",
    "vec3 cover(vec2 p, float iaspect, vec2 f){",
    "  float sa = res.x/res.y;",
    "  if (sa > iaspect*1.3){",
    "    float w = iaspect/sa; float cx = clamp(0.68, w*0.5, 1.0-w*0.5);",
    "    float u = (p.x - (cx - w*0.5))/w;",
    "    float m = smoothstep(0.0, 0.16, u) * (1.0 - smoothstep(0.84, 1.0, u));",
    "    return vec3(clamp(u,0.0,1.0), p.y, m);",
    "  }",
    "  if (sa > iaspect){ float vh = iaspect/sa; float y0 = clamp(f.y - vh*0.5, 0.0, 1.0-vh); return vec3(p.x, y0 + p.y*vh, 1.0); }",
    "  float vw = sa/iaspect; float x0 = clamp(f.x - vw*0.5, 0.0, 1.0-vw); return vec3(x0 + p.x*vw, p.y, 1.0);",
    "}",
    "float jit = 0.0;",
    "vec3 tap0(vec2 p){ vec3 c = cover(p, ia.x, f0); return texture2D(t0, c.xy).rgb * c.z; }",
    "vec3 tap1(vec2 p){ vec3 c = cover(p, ia.y, f1); return texture2D(t1, c.xy).rgb * c.z; }",
    "vec3 sample0(vec2 p, vec2 dir, float amt){",
    "  if (amt < 0.004) return tap0(p);",
    "  vec3 acc = vec3(0.0);",
    "  for (int i=0;i<12;i++){ float k = (float(i)+jit)/12.0 - 0.5; acc += tap0(p + dir*k*amt); }",
    "  return acc/12.0;",
    "}",
    "vec3 sample1(vec2 p, vec2 dir, float amt){",
    "  if (amt < 0.004) return tap1(p);",
    "  vec3 acc = vec3(0.0);",
    "  for (int i=0;i<12;i++){ float k = (float(i)+jit)/12.0 - 0.5; acc += tap1(p + dir*k*amt); }",
    "  return acc/12.0;",
    "}",
    "void main(){",
    "  jit = hash(gl_FragCoord.xy + time);",
    "  vec2 p = vec2(gl_FragCoord.x/res.x, 1.0 - gl_FragCoord.y/res.y);",
    "  float asp = res.x/res.y;",
    "  vec2 pa = vec2(p.x*asp, p.y);",
    "  float trans = sin(3.14159*clamp(mixv,0.0,1.0));",
    "  float n = fbm(pa*3.2 + time*0.04);",
    "  float ang = n*9.4;",
    "  vec2 dir = vec2(cos(ang)/asp, sin(ang));",
    "  float amt = smoothstep(0.12, 1.4, vel)*0.03 + trans*0.035;",
    "  vec3 c = sample0(p, dir, amt);",
    "  if (mixv > 0.0005){",
    "    float nz = fbm(pa*2.4 + 7.0);",
    "    float t = mixv*1.4 - 0.2;",
    "    float m = 1.0 - smoothstep(t-0.12, t+0.12, nz);",
    "    c = mix(c, sample1(p, dir, amt), m);",
    "  }",
    "  vec2 q = (p - mouse) * vec2(asp, 1.0);",
    "  float d = length(q);",
    "  float l = exp(-pow(d/radius, 2.0)*1.7);",
    "  float lit = amb + (1.0-amb)*l*lightK;",
    "  c *= lit;",
    "  c = mix(c, c*vec3(1.10, 0.98, 0.84), l*0.55*lightK);",
    "  float vg = 1.0 - 0.55*dot(p-0.5, p-0.5)*2.0;",
    "  c *= clamp(vg, 0.0, 1.0);",
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
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
  ["t0","t1","res","ia","f0","f1","mouse","vel","mixv","time","lightK","radius","amb"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform1i(U.t0, 0); gl.uniform1i(U.t1, 1);

  /* ---------- Texturas ---------- */
  var maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
  var tex = [], aspect = [], loaded = [];
  function makeTexture(img) {
    var src = img;
    if (img.naturalWidth > maxTex || img.naturalHeight > maxTex) {
      var k = maxTex / Math.max(img.naturalWidth, img.naturalHeight);
      var cv = document.createElement("canvas");
      cv.width = Math.floor(img.naturalWidth * k); cv.height = Math.floor(img.naturalHeight * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      src = cv;
    }
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    return t;
  }
  function load(i, done) {
    var img = new Image();
    img.onload = function () {
      tex[i] = makeTexture(img); aspect[i] = img.naturalWidth / img.naturalHeight; loaded[i] = true;
      if (done) done();
    };
    img.onerror = function () { if (done && i === 0) showFallback(); };
    img.src = SLIDES[i].src;
  }

  /* ---------- Estado ---------- */
  var W = 1, H = 1, dpr = 1;
  function resize() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  if (window.ResizeObserver) new ResizeObserver(function () { resize(); if (reduce) draw(0); }).observe(hero);
  else window.addEventListener("resize", function () { resize(); if (reduce) draw(0); });
  resize();

  var cur = 0, next = 1, mixv = 0, phase = "hold", phaseT = 0;
  var tx = 0.5, ty = 0.5, mx = 0.5, my = 0.5, vel = 0, lastMove = -99, lightK = reduce ? 1 : 0;
  var time = 0, last = 0, running = false, started = false;
  var amb = 0.11, radius = reduce ? 0.55 : (coarse ? 0.36 : 0.30);

  if (!reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      lastMove = time;
    }, { passive: true });
  }

  function draw(dt) {
    if (!loaded[cur]) return;
    var t1ok = loaded[next];
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t1ok ? tex[next] : tex[cur]);
    gl.uniform2f(U.res, W, H);
    gl.uniform2f(U.ia, aspect[cur], t1ok ? aspect[next] : aspect[cur]);
    gl.uniform2f(U.f0, SLIDES[cur].fx, SLIDES[cur].fy);
    gl.uniform2f(U.f1, SLIDES[next].fx, SLIDES[next].fy);
    gl.uniform2f(U.mouse, mx, my);
    gl.uniform1f(U.vel, vel); gl.uniform1f(U.mixv, t1ok ? mixv : 0);
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.lightK, lightK); gl.uniform1f(U.radius, radius); gl.uniform1f(U.amb, amb);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
    // Luz: sigue al puntero; sin movimiento recorre la escena sola
    if (time - lastMove > 2.5) {
      tx = 0.5 + 0.28 * Math.cos(time * 0.32); ty = 0.46 + 0.18 * Math.sin(time * 0.47);
    }
    var px = mx, py = my, k = 1 - Math.pow(0.0015, dt);
    mx += (tx - mx) * k; my += (ty - my) * k;
    var sp = Math.sqrt(Math.pow((mx - px) * W / H, 2) + Math.pow(my - py, 2)) / Math.max(dt, 0.001);
    vel += (Math.min(sp, 2.0) - vel) * (1 - Math.pow(0.02, dt));
    lightK = Math.min(1, lightK + dt * 0.5);
    // Cambio de foto
    phaseT += dt;
    if (phase === "hold" && phaseT > HOLD && loaded[next]) { phase = "trans"; phaseT = 0; }
    else if (phase === "trans") {
      mixv = Math.min(1, phaseT / TRANS);
      if (mixv >= 1) { cur = next; next = (cur + 1) % SLIDES.length; mixv = 0; phase = "hold"; phaseT = 0; }
    }
    draw(dt);
    requestAnimationFrame(frame);
  }
  function start() {
    if (reduce || running) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  load(0, function () {
    started = true;
    hero.classList.add("hero-ready");
    if (reduce) { mx = 0.5; my = 0.45; draw(0); } else { start(); }
    for (var i = 1; i < SLIDES.length; i++) load(i);
  });

  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (started) start(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { if (!started) return; if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0.02 }).observe(hero);
  }
  // Exponer para pruebas
  window.__portada = { setPointer: function (x, y) { tx = x; ty = y; lastMove = time; }, state: function () { return { cur: cur, mixv: mixv, vel: vel, started: started }; } };
})();
