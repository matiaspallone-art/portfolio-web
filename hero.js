/* Portada del sitio ("uranio"): el líquido metalizado de LL-one, generado en vivo (sin video), en plata y verde uranio oscuro.
   Se dibuja a la resolución real de la pantalla (hasta 4K): no hay archivo de video que pierda calidad.
   Donde apoyás el mouse (o el dedo) las formas del metal se juntan y salen ondas circulares.
   Sin WebGL, o con "reducir movimiento", se muestra una imagen fija. */
(function () {
  var POSTER = "img/llone-chrome-poster.webp";

  var hero = document.getElementById("inicio");
  var canvas = document.getElementById("hero-canvas");
  var fallback = document.getElementById("hero-fallback");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

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
    "uniform vec2 R; uniform float T; uniform vec2 mouse; uniform float vel; uniform float hov;",
    "uniform float radius; uniform float amb; uniform float cap;",
    "float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);",
    "  return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x), mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x), f.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return v; }",
    /* posición del puntero en el espacio del metal (centrado, alto = 1) */
    "vec2 mP;",
    "float rippleAmt;",
    "vec2 W;",
    "float height(vec2 p){",
    "  float f = fbm(p*1.2 + 2.4*W);",
    "  vec2 dm = p - mP; float d = length(dm);",
    "  float near = exp(-pow(d/(radius*1.25), 2.0));",
    "  f += rippleAmt * near * sin(d*58.0 - T*5.5);",
    "  return f;",
    "}",
    "void main(){",
    "  float asp = R.x/R.y;",
    "  vec2 uv = gl_FragCoord.xy / R;",
    "  vec2 tp = vec2(uv.x, 1.0 - uv.y);",
    "  vec2 p = (gl_FragCoord.xy - 0.5*R)/R.y;",
    "  mP = vec2((mouse.x-0.5)*asp, 0.5-mouse.y);",
    "  float hk = 0.55 + 0.45*hov;",
    /* lente: las formas del metal se acercan y se juntan en el puntero */
    "  vec2 dm0 = p - mP; float d0 = length(dm0);",
    "  float near0 = exp(-pow(d0/(radius*1.6), 2.0));",
    "  p = mP + dm0*(1.0 - 0.38*near0*hk);",
    "  rippleAmt = (0.016 + clamp(vel,0.0,1.5)*0.012) * hk;",
    "  float Tm = T*0.09;",
    "  vec2 q = vec2(fbm(p*1.6+Tm), fbm(p*1.6-Tm+3.1));",
    "  W = vec2(fbm(p*1.4+2.0*q+vec2(1.7,9.2)+Tm*0.7), fbm(p*1.4+2.0*q+vec2(8.3,2.8)-Tm*0.5));",
    "  float e = 0.0035;",
    "  float f = height(p);",
    "  float fx = height(p+vec2(e,0.0)) - f;",
    "  float fy = height(p+vec2(0.0,e)) - f;",
    "  vec3 N = normalize(vec3(-fx*90.0, -fy*90.0, 1.0));",
    "  vec3 L = normalize(vec3(0.5, 0.7, 0.6));",
    "  float dl = max(dot(N,L), 0.0);",
    "  float s = pow(max(dot(reflect(-L,N), vec3(0.0,0.0,1.0)), 0.0), 28.0);",
    "  float bands = 0.5 + 0.5*sin(f*14.0 + N.x*3.0);",
    "  float lum = mix(0.06, 0.82, bands*dl) + s*0.9 + pow(1.0-abs(N.z), 3.0)*0.12;",
    "  lum = clamp(lum*1.3, 0.0, 1.0);",
    "  lum = mix(lum, lum*lum*(3.0-2.0*lum), 0.7);",
    /* plata y verde uranio oscuro, mezclados en manchas que fluyen */
    "  vec3 silver = vec3(lum) * vec3(0.93, 0.97, 1.03);",
    "  vec3 g0 = vec3(0.002, 0.016, 0.009);",
    "  vec3 g1 = vec3(0.024, 0.150, 0.072);",
    "  vec3 g2 = vec3(0.290, 0.600, 0.290);",
    "  vec3 green = lum < 0.5 ? mix(g0, g1, lum*2.0) : mix(g1, g2, (lum-0.5)*2.0);",
    "  vec2 pa = vec2(tp.x*asp, tp.y);",
    "  float mk = smoothstep(0.30, 0.70, fbm(pa*1.4 + vec2(T*0.03, -T*0.025)) + 0.12*sin(T*0.13));",
    /* luces: la del puntero y dos que pasean solas */
    "  float dd = length((tp - mouse)*vec2(asp,1.0));",
    "  float l = exp(-pow(dd/radius, 2.0)*1.5);",
    "  vec2 w1 = vec2(0.5 + 0.34*cos(T*0.21 + 1.3), 0.5 + 0.26*sin(T*0.33));",
    "  vec2 w2 = vec2(0.5 + 0.30*sin(T*0.17 + 4.0), 0.5 + 0.24*cos(T*0.29 + 2.0));",
    "  float la = exp(-pow(length((tp-w1)*vec2(asp,1.0))/(radius*1.5), 2.0)*1.5);",
    "  float lb = exp(-pow(length((tp-w2)*vec2(asp,1.0))/(radius*1.3), 2.0)*1.5);",
    "  mk = clamp(mk + 0.35*l, 0.0, 1.0);",
    "  vec3 c = mix(silver, green, 0.25 + 0.65*mk);",
    "  float base = mix(amb, amb*0.55, hov);",
    "  float lights = clamp(l + 0.45*la + 0.35*lb, 0.0, 1.0);",
    "  c *= base + (cap - base)*lights;",
    "  float vg = 1.0 - 0.5*dot(tp-0.5, tp-0.5)*2.0;",
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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["R","T","mouse","vel","hov","radius","amb","cap"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  /* Resolución: la real de la pantalla (hasta 4K). Si el equipo no llega a fluidez, baja sola de a poco. */
  var maxPx = 3840 * 2160;
  var quality = Math.min(window.devicePixelRatio || 1, 2);
  var W = 1, H = 1;
  function resize() {
    var r = hero.getBoundingClientRect();
    var q = quality;
    var px = r.width * r.height * q * q;
    if (px > maxPx) q *= Math.sqrt(maxPx / px);
    W = Math.max(2, Math.round(r.width * q)); H = Math.max(2, Math.round(r.height * q));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    if (!running) draw();
  }

  var tx = 0.5, ty = 0.5, mx = 0.5, my = 0.5, vel = 0, lastMove = -99, hov = 0, hovT = 0;
  var time = 12, last = 0, running = false;
  var amb = 0.34, cap = 1.0, radius = coarse ? 0.34 : 0.26;
  var slow = 0, frames = 0;

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

  function draw() {
    gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, time);
    gl.uniform2f(U.mouse, mx, my); gl.uniform1f(U.vel, vel); gl.uniform1f(U.hov, hov);
    gl.uniform1f(U.radius, radius); gl.uniform1f(U.amb, amb); gl.uniform1f(U.cap, cap);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    if (!running) return;
    var rawDt = (now - last) / 1000 || 0.016; last = now;
    var dt = Math.min(0.05, rawDt);
    time += dt * 1.5;
    if (time - lastMove > 2.5 * 1.5) {      // sin movimiento: la luz recorre la escena sola
      tx = 0.5 + 0.3 * Math.cos(time * 0.18); ty = 0.5 + 0.2 * Math.sin(time * 0.27);
    }
    var px = mx, py = my, k = 1 - Math.pow(0.0015, dt);
    mx += (tx - mx) * k; my += (ty - my) * k;
    var sp = Math.sqrt(Math.pow((mx - px) * W / H, 2) + Math.pow(my - py, 2)) / Math.max(dt, 0.001);
    vel += (Math.min(sp, 2.0) - vel) * (1 - Math.pow(0.02, dt));
    hov += (hovT - hov) * (1 - Math.pow(0.04, dt));
    draw();
    // calidad adaptable: si va lento durante un rato, baja un poco la resolución
    frames++;
    if (frames > 30) {
      if (rawDt > 0.028) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 40 && quality > 0.7) { quality *= 0.85; slow = 0; resize(); }
    }
    requestAnimationFrame(frame);
  }
  function start() {
    if (reduce || running) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener("resize", resize);
  var running0 = false;
  resize();
  hero.classList.add("hero-ready");
  if (reduce) { mx = 0.5; my = 0.45; amb = 0.36; draw(); } else { start(); }

  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0.02 }).observe(hero);
  }
  window.__portada = { setPointer: function (x, y) { tx = x; ty = y; lastMove = time; hovT = 1; }, state: function () { return { quality: quality, w: W, h: H, t: time }; } };
})();
