
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Texto personalizable ---------- */
  var DEFAULT_MSG = 'Si pudiera, te regalaría un universo entero de flores amarillas girando a tu alrededor.';
  var qs = new URLSearchParams(location.search);
  var state = {
    para: (qs.get('para') || '').slice(0, 40),
    msg: (qs.get('msg') || '').slice(0, 240),
    de: (qs.get('de') || '').slice(0, 40)
  };
  function applyText() {
    $('para').textContent = state.para ? 'Para ' + state.para : 'Para ti Marilin Brigith';
    $('mensaje').textContent = state.msg || DEFAULT_MSG;
    var de = $('de');
    if (state.de) { de.textContent = '— ' + state.de; de.hidden = false; } else { de.hidden = true; }
  }
  applyText();

  function buildUrl() {
    var base = location.href.split('#')[0].split('?')[0];
    var p = new URLSearchParams();
    if (state.para) p.set('para', state.para);
    if (state.msg) p.set('msg', state.msg);
    if (state.de) p.set('de', state.de);
    var s = p.toString();
    return s ? base + '?' + s : base;
  }

  /* ---------- Canvas ---------- */
  var cv = $('c'), ctx = cv.getContext('2d');
  var W, H, DPR, CX, CY, U, FOV;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W / 2; CY = H / 2;
    U = Math.min(W, H * 1.5);
    FOV = U * 1.1;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- Sprites de flores (prerenderizados) ---------- */
  function makeSprite(o) {
    var S = o.size, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    var R = S * 0.29;
    var gl = g.createRadialGradient(0, 0, R * 0.3, 0, 0, S / 2);
    gl.addColorStop(0, 'rgba(255,205,60,0.34)');
    gl.addColorStop(1, 'rgba(255,205,60,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(0, 0, S / 2, 0, TAU); g.fill();

    for (var L = 0; L < o.layers; L++) {
      var k = 1 - L * 0.2, n = o.n, off = L * Math.PI / n;
      var cols = o.cols[Math.min(L, o.cols.length - 1)];
      for (var i = 0; i < n; i++) {
        g.save();
        g.rotate(i * TAU / n + off);
        var gr = g.createLinearGradient(R * 0.2 * k, 0, R * 1.12 * k, 0);
        gr.addColorStop(0, cols[0]); gr.addColorStop(1, cols[1]);
        g.fillStyle = gr;
        var w = o.w * k;
        g.beginPath();
        g.moveTo(R * 0.2 * k, 0);
        g.bezierCurveTo(R * 0.42 * k, -R * w, R * 0.9 * k, -R * w * 0.85, R * 1.12 * k, 0);
        g.bezierCurveTo(R * 0.9 * k, R * w * 0.85, R * 0.42 * k, R * w, R * 0.2 * k, 0);
        g.fill();
        g.strokeStyle = 'rgba(170,80,0,0.22)';
        g.lineWidth = Math.max(0.6, S * 0.004);
        g.beginPath(); g.moveTo(R * 0.3 * k, 0); g.lineTo(R * 0.95 * k, 0); g.stroke();
        g.restore();
      }
    }
    var Rc = R * o.cr;
    var cg = g.createRadialGradient(0, 0, 0, 0, 0, Rc);
    cg.addColorStop(0, '#3b1d04'); cg.addColorStop(0.7, '#7a3f07'); cg.addColorStop(1, '#b8620c');
    g.fillStyle = cg; g.beginPath(); g.arc(0, 0, Rc, 0, TAU); g.fill();
    for (var s = 1; s < o.seeds; s++) {
      var rr = Rc * 0.94 * Math.sqrt(s / o.seeds), a = s * 2.39996;
      var px = Math.cos(a) * rr, py = Math.sin(a) * rr, dr = Math.max(0.7, Rc * 0.05);
      g.fillStyle = 'rgba(20,8,0,0.55)'; g.beginPath(); g.arc(px, py, dr, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,175,60,0.3)'; g.beginPath(); g.arc(px - dr * 0.3, py - dr * 0.3, dr * 0.45, 0, TAU); g.fill();
    }
    return c;
  }
  var SPR = [
    makeSprite({ size: 200, n: 10, layers: 2, w: 0.30, cr: 0.34, seeds: 40, cols: [['#f2a900', '#ffd21f'], ['#ffd21f', '#fff08a']] }),
    makeSprite({ size: 200, n: 14, layers: 2, w: 0.24, cr: 0.42, seeds: 60, cols: [['#e59a00', '#ffc300'], ['#ffc300', '#ffe14d']] }),
    makeSprite({ size: 200, n: 8,  layers: 2, w: 0.42, cr: 0.30, seeds: 30, cols: [['#ffb700', '#ffe14d'], ['#ffe14d', '#fff6b0']] }),
    makeSprite({ size: 200, n: 12, layers: 1, w: 0.26, cr: 0.32, seeds: 30, cols: [['#ffd84d', '#fff3a3']] }),
    makeSprite({ size: 200, n: 16, layers: 2, w: 0.20, cr: 0.36, seeds: 50, cols: [['#f29100', '#ffb700'], ['#ffb700', '#ffdf4d']] }),
    makeSprite({ size: 200, n: 6,  layers: 2, w: 0.46, cr: 0.28, seeds: 20, cols: [['#ffc800', '#ffe866'], ['#ffe866', '#fffbd0']] })
  ];
  var SUN = makeSprite({ size: 640, n: 22, layers: 3, w: 0.22, cr: 0.36, seeds: 320,
    cols: [['#e08a00', '#ffb800'], ['#ffb800', '#ffd83a'], ['#ffd83a', '#fff09a']] });

  function sprite(spr, x, y, reach, rot, alpha) {
    var size = reach * 3.08;
    if (size < 1) return;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.drawImage(spr, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /* ---------- Cámara 3D ---------- */
  var yaw = 0, yawVel = 0;
  var pitch = W > H ? 0.85 : 1.15;
  function proj(x, y, z) {
    var cyw = Math.cos(yaw), syw = Math.sin(yaw);
    var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    var s = FOV / (FOV + z2);
    return { x: CX + x1 * s, y: CY + y2 * s, s: s, z: z2 };
  }

  /* ---------- Escena ---------- */
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var rings = [];
  var COUNTS = [2, 3, 3, 4, 5, 5, 6];
  for (var i = 0; i < COUNTS.length; i++) {
    var rn = 0.2 + i * 0.045;
    var ring = {
      r: rn, inc: rand(-0.45, 0.45), node: rand(0, TAU),
      speed: (i % 2 ? -1 : 1) * 0.05 / Math.pow(rn, 1.5),
      a0: rand(0, TAU), flowers: []
    };
    ring.ci = Math.cos(ring.inc); ring.si = Math.sin(ring.inc);
    ring.cn = Math.cos(ring.node); ring.sn = Math.sin(ring.node);
    for (var j = 0; j < COUNTS[i]; j++) {
      ring.flowers.push({
        off: j * TAU / COUNTS[i] + rand(-0.25, 0.25),
        size: rand(0.02, 0.045),
        spr: SPR[Math.floor(Math.random() * SPR.length)],
        rot: rand(0, TAU), spin: rand(-0.9, 0.9),
        moons: Math.random() < 0.4 ? [{ rr: rand(2.2, 3.2), sp: rand(1.2, 2.4) * (Math.random() < 0.5 ? -1 : 1), ph: rand(0, TAU), spr: SPR[Math.floor(Math.random() * SPR.length)] }] : []
      });
    }
    rings.push(ring);
  }
  function orbitPos(ring, a, e) {
    var r = ring.r * U * e;
    var x0 = r * Math.cos(a), z0 = r * Math.sin(a);
    var y = z0 * ring.si, zz = z0 * ring.ci;
    return [x0 * ring.cn + zz * ring.sn, y, -x0 * ring.sn + zz * ring.cn];
  }

  var belt = [];
  for (i = 0; i < 170; i++) {
    belt.push({ r: rand(0.375, 0.445), a: rand(0, TAU), y: rand(-0.012, 0.012), tw: rand(0, TAU), sz: rand(0.6, 1.8) });
  }
  var stars = [];
  for (i = 0; i < 230; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: rand(0.4, 1.4), tw: rand(0, TAU), sp: rand(0.6, 2.2), par: rand(0.005, 0.03), petal: Math.random() < 0.09 });
  }
  var falling = [];
  for (i = 0; i < 24; i++) {
    falling.push({ x: Math.random(), y: Math.random(), vy: rand(14, 34), sw: rand(0.4, 1.2), ph: rand(0, TAU), rot: rand(0, TAU), vr: rand(-1.4, 1.4), sz: rand(4, 10), spr: SPR[Math.floor(Math.random() * SPR.length)] });
  }
  var bursts = [];
  var comets = [];

  function burst(x, y) {
    var k = Math.max(0.6, U / 700);
    for (var b = 0; b < 16; b++) {
      var ang = rand(0, TAU), sp = rand(60, 260) * k;
      bursts.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 40, rot: rand(0, TAU), vr: rand(-5, 5), life: 0, max: rand(1.4, 2.4), sz: rand(6, 16) * k, spr: SPR[Math.floor(Math.random() * SPR.length)] });
    }
  }

  /* ---------- Interacción ---------- */
  var down = false, moved = 0, lastX = 0, lastY = 0, downT = 0, idle = 0;
  cv.addEventListener('pointerdown', function (e) {
    down = true; moved = 0; lastX = e.clientX; lastY = e.clientY; downT = performance.now();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    wake();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw += dx * 0.006; yawVel = dx * 0.006 * 30;
    pitch = Math.max(0.35, Math.min(1.45, pitch + dy * 0.004));
  });
  function up(e) {
    if (!down) return;
    down = false;
    if (moved < 10 && performance.now() - downT < 450) burst(e.clientX, e.clientY);
    wake();
  }
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', function () { down = false; });

  var fabs = $('fabs');
  function wake() { fabs.classList.remove('oculto'); idle = 0; }
  window.addEventListener('pointermove', wake);

  /* ---------- Bucle ---------- */
  var T = 0, last = performance.now();
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  function frame(now) {
    var dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    var sound = window.FlowerAudio ? window.FlowerAudio.update(dt, reduce) : { bass: 0, energy: 0 };
    var m = reduce ? 0.4 : 1;
    T += dt * m;
    idle += dt;
    if (idle > 5) fabs.classList.add('oculto');
    if (!down) { yaw += (0.045 * m + yawVel) * dt; yawVel *= Math.pow(0.05, dt); }
    var e = ease(Math.min(1, T / 3.4));

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // estrellas y mini-flores lejanas
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      var sx = ((st.x * W - yaw * st.par * W) % W + W) % W, sy = st.y * H;
      var tw = 0.45 + 0.55 * Math.sin(T * st.sp + st.tw);
      if (st.petal) {
        sprite(SPR[3], sx, sy, 3.5 + st.r * 2.5, T * 0.3 + st.tw, tw * 0.7);
      } else {
        ctx.globalAlpha = tw * 0.85;
        ctx.fillStyle = '#ffeeb0';
        ctx.beginPath(); ctx.arc(sx, sy, st.r, 0, TAU); ctx.fill();
      }
    }

    // estrellas fugaces doradas
    if (!reduce && Math.random() < dt * 0.25 && comets.length < 2) {
      comets.push({ x: rand(0.1, 1) * W, y: rand(0, 0.4) * H, vx: -rand(280, 480), vy: rand(120, 220), life: 0 });
    }
    for (var c = comets.length - 1; c >= 0; c--) {
      var cm = comets[c]; cm.life += dt; cm.x += cm.vx * dt; cm.y += cm.vy * dt;
      var ca = Math.max(0, 1 - cm.life / 1.3);
      var gr = ctx.createLinearGradient(cm.x, cm.y, cm.x - cm.vx * 0.22, cm.y - cm.vy * 0.22);
      gr.addColorStop(0, 'rgba(255,225,120,' + ca + ')'); gr.addColorStop(1, 'rgba(255,225,120,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cm.x, cm.y); ctx.lineTo(cm.x - cm.vx * 0.22, cm.y - cm.vy * 0.22); ctx.stroke();
      if (cm.life > 1.3) comets.splice(c, 1);
    }

    // órbitas
    ctx.lineWidth = 1;
    for (var r = 0; r < rings.length; r++) {
      var rg = rings[r];
      ctx.strokeStyle = 'rgba(255,214,90,' + (0.12 * e) + ')';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (var k = 0; k <= 72; k++) {
        var op = orbitPos(rg, k / 72 * TAU, e);
        var pp = proj(op[0], op[1], op[2]);
        if (k === 0) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y);
      }
      ctx.stroke();
    }

    // lista de dibujo ordenada por profundidad
    var items = [];
    var sp0 = proj(0, 0, 0);
    items.push({ z: 0, t: 0, p: sp0 });

    for (r = 0; r < rings.length; r++) {
      rg = rings[r];
      for (var f = 0; f < rg.flowers.length; f++) {
        var fl = rg.flowers[f];
        var a = rg.a0 + T * rg.speed + fl.off;
        var pos = orbitPos(rg, a, e);
        var p = proj(pos[0], pos[1], pos[2]);
        items.push({ z: p.z, t: 1, p: p, fl: fl });
      }
    }
    for (var b = 0; b < belt.length; b++) {
      var bt = belt[b];
      var ba = bt.a + T * 0.05 / Math.pow(bt.r, 1.5) * 0.6;
      var bp = proj(Math.cos(ba) * bt.r * U * e, bt.y * U, Math.sin(ba) * bt.r * U * e);
      items.push({ z: bp.z, t: 2, p: bp, b: bt });
    }
    items.sort(function (x, y) { return y.z - x.z; });

    for (var q = 0; q < items.length; q++) {
      var it = items[q];
      if (it.t === 0) {
        var pulse = 1 + 0.035 * Math.sin(T * 1.6) + sound.bass * 0.22;
        var reach = U * 0.11 * e * pulse;
        // halo solar
        var hr = reach * 3.2;
        var hg = ctx.createRadialGradient(it.p.x, it.p.y, reach * 0.3, it.p.x, it.p.y, hr);
        hg.addColorStop(0, 'rgba(255,190,40,' + 0.42 * e + ')');
        hg.addColorStop(1, 'rgba(255,190,40,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(it.p.x, it.p.y, hr, 0, TAU); ctx.fill();
        if (window.FlowerAudio) window.FlowerAudio.draw(ctx, it.p.x, it.p.y, reach, T, e, reduce);
        sprite(SUN, it.p.x, it.p.y, reach, T * 0.12 + Math.sin(T * 22) * sound.energy * 0.025, Math.min(1, e * 1.3));
      } else if (it.t === 1) {
        var F = it.fl;
        var pr = F.size * U * it.p.s * e * (1 + sound.bass * 0.18);
        var vibration = Math.sin(T * 24 + F.rot) * sound.energy * U * 0.003;
        sprite(F.spr, it.p.x + vibration, it.p.y + vibration * 0.5, pr, F.rot + T * F.spin, Math.min(1, e * 1.3));
        for (var mi = 0; mi < F.moons.length; mi++) {
          var mo = F.moons[mi], ma = T * mo.sp + mo.ph;
          sprite(mo.spr, it.p.x + Math.cos(ma) * pr * mo.rr, it.p.y + Math.sin(ma) * pr * mo.rr * 0.6, pr * 0.34, ma * 2, Math.min(1, e * 1.2));
        }
      } else {
        var B = it.b;
        ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(T * 1.7 + B.tw))) * e;
        ctx.fillStyle = '#ffe58a';
        ctx.beginPath(); ctx.arc(it.p.x, it.p.y, B.sz * it.p.s * Math.max(0.6, U / 800), 0, TAU); ctx.fill();
      }
    }

    // pétalos que caen (frente)
    for (var d = 0; d < falling.length; d++) {
      var fp = falling[d];
      fp.y += fp.vy * dt / H; fp.rot += fp.vr * dt;
      if (fp.y > 1.05) { fp.y = -0.05; fp.x = Math.random(); }
      var fx = fp.x * W + Math.sin(T * fp.sw + fp.ph) * 22;
      sprite(fp.spr, fx, fp.y * H, fp.sz * Math.max(0.8, U / 700), fp.rot, 0.6 * e);
    }

    // ráfagas al tocar
    for (var u = bursts.length - 1; u >= 0; u--) {
      var bu = bursts[u];
      bu.life += dt; bu.vy += 90 * dt;
      bu.vx *= Math.pow(0.35, dt); bu.vy *= Math.pow(0.55, dt);
      bu.x += bu.vx * dt; bu.y += bu.vy * dt; bu.rot += bu.vr * dt;
      var al = Math.max(0, 1 - bu.life / bu.max);
      sprite(bu.spr, bu.x, bu.y, bu.sz, bu.rot, al);
      if (bu.life >= bu.max) bursts.splice(u, 1);
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Ventanas: personalizar y QR ---------- */
  var modal = $('modal'), pEd = $('panelEditar'), pQR = $('panelQR');
  function abrir(panel) {
    pEd.hidden = panel !== pEd; pQR.hidden = panel !== pQR;
    modal.classList.add('abierto');
  }
  function cerrar() { modal.classList.remove('abierto'); }
  modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-cerrar]'), function (b) { b.addEventListener('click', cerrar); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

  $('btnEditar').addEventListener('click', function () {
    $('inPara').value = state.para; $('inMsg').value = state.msg; $('inDe').value = state.de;
    abrir(pEd);
  });
  $('btnAplicar').addEventListener('click', function () {
    state.para = $('inPara').value.trim().slice(0, 40);
    state.msg = $('inMsg').value.trim().slice(0, 240);
    state.de = $('inDe').value.trim().slice(0, 40);
    applyText();
    try { history.replaceState(null, '', buildUrl()); } catch (err) {}
    cerrar();
  });

  function renderQR(text) {
    var box = $('qrbox');
    box.innerHTML = '';
    if (typeof QRCode === 'undefined') { box.style.lineHeight = '1.4'; box.textContent = 'No se pudo cargar el generador de QR.'; return; }
    box.style.lineHeight = '0';
    new QRCode(box, { text: text, width: 232, height: 232, colorDark: '#2a1600', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
  }
  $('btnQR').addEventListener('click', function () {
    var url = buildUrl();
    $('inUrl').value = url;
    renderQR(url);
    abrir(pQR);
  });
  $('btnRegen').addEventListener('click', function () {
    var v = $('inUrl').value.trim();
    if (v) renderQR(v);
  });
})();
