/* Portada: muro 3D de fotos (portfolio + LL-one).
   Las fotos están inclinadas en perspectiva y fluyen lentamente. Los bordes de la pantalla
   se desenfocan con un leve borde de color, como en el video de referencia.
   - Al entrar, las fotos llegan volando y se acomodan.
   - Al mover el mouse (o el dedo) las fotos cercanas se levantan.
   - Al bajar por la página, las fotos se achican, giran y se apilan formando un anillo que gira (como en el video de referencia).
   Sin WebGL2 se muestra el mismo muro en versión fija (CSS). */
(function () {
  var hero = document.getElementById("inicio");
  var canvas = document.getElementById("hero-canvas");
  var stage = canvas ? canvas.parentNode : null;
  var fallback = document.getElementById("hero-fallback");
  if (!hero || !canvas) return;

  var FOTOS = [];
  for (var i = 1; i <= 10; i++) FOTOS.push("img/hero/h" + (i < 10 ? "0" : "") + i + ".webp");
  var TEX_W = 768, TEX_H = 1024;
  var COLS = 20, ROWS = 14;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) hero.classList.add("hero-static");

  /* ---------- Versión fija (sin WebGL2) ---------- */
  function showFallback() {
    hero.classList.add("hero-static");
    canvas.hidden = true;
    if (!fallback || fallback.firstChild) return;
    var wall = document.createElement("div");
    wall.className = "hero-wall";
    for (var k = 0; k < 28; k++) {
      var im = document.createElement("img");
      im.src = FOTOS[(k * 7 + Math.floor(k / 7) * 3) % FOTOS.length];
      im.alt = "";
      im.loading = "lazy";
      wall.appendChild(im);
    }
    fallback.appendChild(wall);
    fallback.hidden = false;
  }

  var gl = null;
  try {
    gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { gl = null; }
  if (!gl) { showFallback(); return; }

  /* ---------- Matemática de matrices (column-major) ---------- */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++)
      for (var r = 0; r < 4; r++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
    return o;
  }
  function persp(fovY, asp, n, f) {
    var t = 1 / Math.tan(fovY / 2), m = new Float32Array(16);
    m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f);
    return m;
  }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
  function trans(x, y, z) { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }

  /* ---------- Shaders ---------- */
  var VS = "#version 300 es\n" +
  "precision highp float;\n" +
  "layout(location=0) in vec2 aQuad;\n" +
  "layout(location=1) in vec2 aCell;\n" +
  "layout(location=2) in vec4 aRand;\n" +
  "layout(location=3) in float aLayer;\n" +
  "layout(location=4) in float aRing;\n" +
  "uniform mat4 uVP, uVPR;\n" +
  "uniform float uDrift, uIntro, uMorph, uAspect, uHover, uRot, uRingN, uRingR;\n" +
  "uniform vec2 uMouse, uCells;\n" +
  "out vec2 vUV; flat out float vLayer; out float vFade; out float vS; out float vLift; out float vFog;\n" +
  "const vec2 PITCH = vec2(0.66, 0.88);\n" +
  "const vec2 CARD = vec2(0.57, 0.76);\n" +
  "const float PI = 3.14159265;\n" +
  "mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);}\n" +
  "mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}\n" +
  "mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0., -s,c,0., 0.,0.,1.);}\n" +
  "void main(){\n" +
  "  float N = uCells.x;\n" +
  "  float col = mod(aCell.x + uDrift + N*.5, N) - N*.5;\n" +
  "  float row = aCell.y - uCells.y*.5 + .5;\n" +
  "  vec3 c = vec3(col*PITCH.x, row*PITCH.y, 0.);\n" +
  "  float fade = 1. - smoothstep(.70, .98, abs(col)/(N*.5));\n" +
  /* llegada inicial */
  "  float delay = aRand.w*.8 + (col + N*.5)*.018;\n" +
  "  float ti = clamp((uIntro - delay)/1.7, 0., 1.);\n" +
  "  float s = pow(1. - ti, 3.);\n" +
  "  fade *= smoothstep(0., .22, ti);\n" +
  "  vec3 off = vec3((aRand.x-.5)*8., (aRand.y-.5)*6. + 2.2, 1.2 + aRand.z*4.5);\n" +
  "  vec3 cc = c + s*off;\n" +
  "  vec3 ang = s*(aRand.xyz-.5)*vec3(2.8, 2.8, 3.6);\n" +
  /* progreso de la transformación muro -> anillo (cada foto sale en su momento) */
  "  float e = clamp((uMorph - aRand.w*.38)/.62, 0., 1.);\n" +
  "  e = e*e*(3. - 2.*e);\n" +
  /* cartas cercanas al puntero se levantan */
  "  vec4 cp = uVP*vec4(c, 1.);\n" +
  "  vec2 nd = cp.xy/cp.w;\n" +
  "  float d = length((nd - uMouse)*vec2(uAspect, 1.));\n" +
  "  float lift = exp(-d*d/.05)*uHover*(1. - e);\n" +
  "  cc.z += lift*.6;\n" +
  "  bool inRing = aRing >= 0.;\n" +
  "  float shrink = inRing ? 1. - .25*e : 1. - smoothstep(.25, .9, e);\n" +
  "  vec3 vW = rz(ang.z)*ry(ang.y)*rx(ang.x)*vec3(aQuad*CARD*(1. + .12*lift)*shrink, 0.);\n" +
  "  vec4 pW = uVP*vec4(cc + vW, 1.);\n" +
  /* posición en el anillo */
  "  float th = (inRing ? aRing/uRingN*2.*PI : aRand.x*2.*PI) + uRot;\n" +
  "  float yaw = th + (1. - e)*(aRand.y - .5)*9.;\n" +
  "  float rr = inRing ? uRingR : 0.;\n" +
  "  vec3 cr = vec3(sin(th)*rr, 0., cos(th)*rr);\n" +
  "  float rs = inRing ? .75 : 0.;\n" +
  "  vec3 vR = ry(yaw)*rz((1. - e)*(aRand.z - .5)*4.)*vec3(aQuad*CARD*rs, 0.);\n" +
  "  vec4 pR = uVPR*vec4(cr + vR, 1.);\n" +
  /* vuelo: mezcla de las dos posiciones, con un pequeño arco */
  "  vec4 p = mix(pW, pR, e);\n" +
  "  p.y += sin(e*PI)*(aRand.x - .5)*.9*p.w*.35;\n" +
  "  gl_Position = p;\n" +
  "  vUV = vec2(aQuad.x + .5, .5 - aQuad.y);\n" +
  "  float fogW = mix(.2, 1., smoothstep(15., 5.5, pW.w));\n" +
  "  vFog = mix(fogW, 1., e);\n" +
  "  vLayer = aLayer;\n" +
  "  vFade = inRing ? mix(fade, 1., e) : fade*(1. - smoothstep(.55, 1., e));\n" +
  "  vS = s + sin(e*PI)*.45;\n" +
  "  vLift = lift;\n" +
  "}\n";

  var FS = "#version 300 es\n" +
  "precision highp float;\n" +
  "precision highp sampler2DArray;\n" +
  "uniform sampler2DArray uTex;\n" +
  "uniform vec2 uRes;\n" +
  "uniform float uAspect, uDpr;\n" +
  "in vec2 vUV; flat in float vLayer; in float vFade; in float vS; in float vLift; in float vFog;\n" +
  "out vec4 o;\n" +
  "void main(){\n" +
  /* esquinas redondeadas */
  "  vec2 q = (vUV - .5)*vec2(.57, .76);\n" +
  "  vec2 hs = vec2(.285, .38);\n" +
  "  float rr = .03;\n" +
  "  float sd = length(max(abs(q) - hs + rr, 0.)) - rr;\n" +
  "  float a = 1. - smoothstep(-.003, .003, sd);\n" +
  "  vec2 uv = vUV;\n" +
  "  if (!gl_FrontFacing) uv.x = 1. - uv.x;\n" +
  /* desenfoque + borde de color hacia los bordes de la pantalla */
  "  vec2 n = gl_FragCoord.xy/uRes*2. - 1.;\n" +
  "  float e = smoothstep(.5, 1.2, length(n*vec2(uAspect*.55, 1.)));\n" +
  "  e = clamp(e + vS*.9, 0., 1.4);\n" +
  "  vec2 dp = normalize(vec2(n.x*uAspect, n.y) + 1e-4);\n" +
  "  vec2 px = dp*e*5.5*uDpr;\n" +
  "  vec2 off = dFdx(uv)*px.x + dFdy(uv)*px.y;\n" +
  "  float bias = e*3.4;\n" +
  "  float r = texture(uTex, vec3(uv + off, vLayer), bias).r;\n" +
  "  float g = texture(uTex, vec3(uv, vLayer), bias).g;\n" +
  "  float b = texture(uTex, vec3(uv - off, vLayer), bias).b;\n" +
  "  vec3 col = vec3(r, g, b);\n" +
  "  col *= vFog*vFade*(1. + .12*vLift)*(gl_FrontFacing ? 1. : .62);\n" +
  "  o = vec4(col, a);\n" +
  "}\n";

  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    if (window.console) console.warn("hero:", err.message);
    showFallback(); return;
  }
  gl.useProgram(prog);
  var U = {};
  ["uVP","uVPR","uDrift","uIntro","uMorph","uAspect","uHover","uMouse","uCells","uTex","uRes","uDpr","uRot","uRingN","uRingR"].forEach(function (k) {
    U[k] = gl.getUniformLocation(prog, k);
  });

  /* ---------- Geometría (un cuadrado, instanciado) ---------- */
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  var quad = new Float32Array([-.5,-.5, .5,-.5, .5,.5,  -.5,-.5, .5,.5, -.5,.5]);
  var bq = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bq); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  var COUNT = COLS * ROWS;
  var cells = new Float32Array(COUNT * 2), rnd = new Float32Array(COUNT * 4), lay = new Float32Array(COUNT);
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  for (var cx = 0, idx = 0; cx < COLS; cx++) {
    for (var ry = 0; ry < ROWS; ry++, idx++) {
      cells[idx * 2] = cx; cells[idx * 2 + 1] = ry;
      for (var q = 0; q < 4; q++) rnd[idx * 4 + q] = hash(idx * 4 + q + 1);
      var L = Math.floor(hash(cx * 31 + ry * 17 + 5) * FOTOS.length);
      var guard = 0;
      while (guard++ < 12 && ((ry > 0 && L === lay[idx - 1]) || (cx > 0 && L === lay[idx - ROWS]) || (cx > 0 && ry > 0 && L === lay[idx - ROWS - 1]))) L = (L + 1) % FOTOS.length;
      lay[idx] = L;
    }
  }
  function inst(loc, data, size) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(loc, 1);
  }
  /* Anillo: una carta por foto distinta (la más cercana al centro del muro), repartidas en orden mezclado */
  var RING_N = Math.max(18, Math.min(FOTOS.length, 24));
  var ring = new Float32Array(COUNT).fill(-1);
  var perm = [];
  for (var pi = 0; pi < RING_N; pi++) perm.push(pi);
  perm.sort(function (a, b) { return hash(a * 9.7 + 1) - hash(b * 9.7 + 1); });
  for (var k = 0; k < RING_N; k++) {
    var Ly = k % FOTOS.length, best = -1, bd = 1e9;
    for (var ii = 0; ii < COUNT; ii++) {
      if (lay[ii] !== Ly || ring[ii] >= 0) continue;
      var dd = Math.pow(cells[ii * 2] - COLS / 2, 2) + Math.pow((cells[ii * 2 + 1] - ROWS / 2) * 1.4, 2);
      if (dd < bd) { bd = dd; best = ii; }
    }
    if (best >= 0) ring[best] = perm[k];
  }
  var RING_R = RING_N * 0.5 / (2 * Math.PI);
  inst(1, cells, 2); inst(2, rnd, 4); inst(3, lay, 1); inst(4, ring, 1);

  /* ---------- Texturas (una capa por foto) ---------- */
  var tex = gl.createTexture();
  var levels = Math.floor(Math.log2(Math.max(TEX_W, TEX_H))) + 1;
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, TEX_W, TEX_H, FOTOS.length);
  var ready = false;

  function load(src) {
    return new Promise(function (ok, no) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = no;
      im.src = src;
    });
  }
  Promise.all(FOTOS.map(load)).then(function (ims) {
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    ims.forEach(function (im, l) {
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, l, TEX_W, TEX_H, 1, gl.RGBA, gl.UNSIGNED_BYTE, im);
    });
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var an = gl.getExtension("EXT_texture_filter_anisotropic");
    if (an) gl.texParameterf(gl.TEXTURE_2D_ARRAY, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    ready = true;
    introT = reduce ? 10 : 0;
    start();
  }).catch(function () { showFallback(); });

  /* ---------- Estado ---------- */
  var W = 0, H = 0, dpr = 1;
  var introT = 0, drift = 0, morph = 0, rot = 0, progP = 0, hover = 0, hoverT = 0;
  var mx = 0, my = 0, tx = 0, ty = 0;       // puntero (-1..1)
  var px = 0, py = 0;                       // parallax suavizado
  var running = false, visible = true, last = 0;

  function resize() {
    var r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    var k = Math.min(1, 3840 / w, 2160 / h);
    w = Math.round(w * k); h = Math.round(h * k);
    if (w !== W || h !== H) { W = w; H = h; canvas.width = W; canvas.height = H; }
    if (reduce && ready) draw();
  }

  function onMove(e) {
    var r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    hoverT = 1;
  }
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerdown", onMove);
  stage.addEventListener("pointerleave", function () { hoverT = 0; });
  stage.addEventListener("pointerup", function (e) { if (e.pointerType === "touch") hoverT = 0; });
  window.addEventListener("resize", resize);

  var FOV = 0.62;
  function fovNow() { var asp = W / H; return asp >= 1.3 ? FOV : FOV * Math.min(1.9, 1.3 / asp); }
  function vp() {
    var asp = W / H;
    var tilt = 0.98 + py * 0.05, rz = -0.5 + px * 0.07;
    var m = persp(fovNow(), asp, 0.1, 60);
    m = mul(m, trans(0, -0.2, asp < 1 ? -4.3 : -5.6));
    m = mul(m, rotX(-tilt));
    m = mul(m, rotZ(rz));
    return m;
  }
  /* Cámara del anillo: a la derecha en pantallas anchas, arriba y centrado en celulares */
  function vpr() {
    var asp = W / H, f = fovNow(), D = (6.4 + RING_R * 0.8) * (asp < 1.1 ? 0.72 : 1);
    var halfH = Math.tan(f / 2) * D;
    var tx = asp >= 1.1 ? halfH * asp * 0.42 : 0;
    var ty = asp >= 1.1 ? halfH * 0.1 : halfH * 0.28;
    var m = persp(f, asp, 0.1, 60);
    m = mul(m, trans(tx, ty, -D));
    m = mul(m, rotX(0.5));
    return m;
  }

  function draw() {
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.uniform1i(U.uTex, 0);
    gl.uniformMatrix4fv(U.uVP, false, vp());
    gl.uniformMatrix4fv(U.uVPR, false, vpr());
    gl.uniform1f(U.uDrift, drift);
    gl.uniform1f(U.uIntro, introT);
    gl.uniform1f(U.uMorph, morph);
    gl.uniform1f(U.uRot, rot);
    gl.uniform1f(U.uRingN, RING_N);
    gl.uniform1f(U.uRingR, RING_R);
    gl.uniform1f(U.uAspect, W / H);
    gl.uniform1f(U.uHover, hover);
    gl.uniform2f(U.uMouse, mx, my);
    gl.uniform2f(U.uCells, COLS, ROWS);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uDpr, dpr);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, COUNT);
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    if (!reduce) {
      introT += dt;
      drift += dt * 0.16;
      var r = hero.getBoundingClientRect();
      var span = Math.max(1, r.height - window.innerHeight);
      var p = Math.min(1, Math.max(0, -r.top / span));
      var dp = p - progP; progP = p;
      var target = Math.min(1, Math.max(0, (p - 0.06) / 0.62));
      morph += (target - morph) * Math.min(1, dt * 5);
      rot += dt * 0.32 + dp * 4.5;
      var k = Math.min(1, dt * 7);
      mx += (tx - mx) * k; my += (ty - my) * k;
      px += (tx - px) * Math.min(1, dt * 2.5); py += (ty - py) * Math.min(1, dt * 2.5);
      if (!hoverT) { px *= 1 - Math.min(1, dt * 1.5); py *= 1 - Math.min(1, dt * 1.5); }
      hover += (hoverT - hover) * Math.min(1, dt * 5);
    }
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    resize();
    if (reduce) { draw(); return; }
    if (running || !visible || document.hidden) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (ready) { if (visible) start(); else stop(); }
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener("visibilitychange", function () {
    if (!ready) return;
    if (document.hidden) stop(); else start();
  });
  resize();

  window.__hero = { set: function (o) { for (var k in o) { if (k === "intro") introT = o[k]; if (k === "morph") morph = o[k]; if (k === "drift") drift = o[k]; if (k === "rot") rot = o[k]; } if (!running) draw(); } };
})();
