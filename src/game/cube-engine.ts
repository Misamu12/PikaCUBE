// @ts-nocheck — imperative port of the original PikaCube three.js engine.
import * as THREE from "three";

export type CubeState = "scrambling" | "ready" | "playing" | "solved";
export interface EngineCallbacks {
  onMoves: (n: number) => void;
  onState: (s: CubeState) => void;
  onWin: (ms: number, moves: number) => void;
  onTurn?: () => void;
}
export interface CubeEngine {
  start: (n: number, img: number, mix: number) => void;
  move: (m: string) => void;
  undo: () => void;
  setView: (v: string) => void;
  setSpeed: (ms: number) => void;
  elapsed: () => number;
  celebrate: () => void;
  dispose: () => void;
}

export function createCubeEngine(stage: HTMLElement, cb: EngineCallbacks): CubeEngine {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = 280, alive = true, spin = 0;
  
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.insertBefore(renderer.domElement, stage.firstChild);
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 0.8));
  var key = new THREE.DirectionalLight(0xffffff, 0.6); key.position.set(-4, 9, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  var sc = key.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; scene.add(key);
  var under = new THREE.DirectionalLight(0xffffff, 0.35); under.position.set(2, -8, 3); scene.add(under);
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.6; floor.receiveShadow = true; scene.add(floor);
  var dirty = true, tween = null, drag = null, anim = null;
  function readShadow() { var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--so')); floor.material.opacity = (isNaN(v) ? 0.34 : v) * 0.6; dirty = true; }

  var COL = { R: 0xc41e3a, O: 0xff7a1a, W: 0xf4f4f0, Y: 0xffd500, G: 0x009b48, B: 0x0046ad };
  var FC = [
    { ax: 0, s: 1, k: 'R', u: [0, 0, -1], v: [0, 1, 0] }, { ax: 0, s: -1, k: 'O', u: [0, 0, 1], v: [0, 1, 0] },
    { ax: 1, s: 1, k: 'W', u: [1, 0, 0], v: [0, 0, -1] }, { ax: 1, s: -1, k: 'Y', u: [1, 0, 0], v: [0, 0, 1] },
    { ax: 2, s: 1, k: 'G', u: [1, 0, 0], v: [0, 1, 0] }, { ax: 2, s: -1, k: 'B', u: [-1, 0, 0], v: [0, 1, 0] }];
  var colMats = {}, imgMats = null;
  for (var kk in COL) colMats[kk] = new THREE.MeshStandardMaterial({ color: COL[kk], roughness: 0.4 });

  function art(i) { // image procédurale, une par face
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    function grad(a, b) { var q = g.createLinearGradient(0, 0, 0, 512); q.addColorStop(0, a); q.addColorStop(1, b); g.fillStyle = q; g.fillRect(0, 0, 512, 512); }
    function circ(x, y, r, f) { g.fillStyle = f; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    function tri(x, y, w, h, f) { g.fillStyle = f; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x, y - h); g.lineTo(x + w / 2, y); g.fill(); }
    function ell(x, y, a, b, f) { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, a, b, 0, 0, 7); g.fill(); }
    function rnd(s) { s = Math.sin(s * 127.1 + i * 311.7) * 43758.5; return s - Math.floor(s); }
    var k;
    if (i === 0) { grad('#ff9a3c', '#6a2c91'); circ(256, 300, 90, '#ffe29a'); tri(100, 512, 420, 240, '#3b1d5c'); tri(380, 512, 380, 200, '#2a1245'); }
    else if (i === 1) { grad('#7fd3ff', '#0b3d91'); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 5;
      for (var y = 250; y < 512; y += 42) { g.beginPath(); for (var x = 0; x <= 512; x += 8) g.lineTo(x, y + Math.sin(x / 28 + y) * 10); g.stroke(); }
      tri(256, 230, 150, 160, '#fff'); g.fillStyle = '#5b3a1a'; g.fillRect(250, 230, 8, 60); }
    else if (i === 2) { grad('#bfe8a8', '#1f5a2e'); circ(390, 110, 50, '#fffbe0'); for (k = 0; k < 6; k++) tri(40 + k * 85, 470 - (k % 2) * 50, 110, 260 - (k % 3) * 40, '#0f3d1e'); }
    else if (i === 3) { grad('#0a0f2e', '#3a1c71'); for (k = 0; k < 70; k++) circ(rnd(k) * 512, rnd(k + 99) * 512, 1 + rnd(k + 5) * 2.5, '#fff');
      circ(256, 256, 95, '#ff7eb3'); g.strokeStyle = '#ffd1e8'; g.lineWidth = 12; g.beginPath(); g.ellipse(256, 256, 170, 40, -0.4, 0, 7); g.stroke(); }
    else if (i === 4) { grad('#ffd27a', '#c4571a'); circ(120, 120, 55, '#fff3c4'); ell(120, 520, 320, 150, '#a8431a'); ell(430, 540, 300, 130, '#8a3414');
      g.fillStyle = '#2f6b3a'; g.fillRect(300, 300, 28, 130); g.fillRect(270, 340, 30, 14); g.fillRect(328, 330, 30, 14); }
    else { grad('#06122e', '#0f5a4a'); g.lineWidth = 40;
      ['#5dffb0', '#7aa7ff'].forEach(function (c2, j) { g.strokeStyle = c2; g.globalAlpha = 0.55; g.beginPath(); g.moveTo(-20, 180 + j * 70); g.bezierCurveTo(150, 40 + j * 60, 330, 300, 540, 120 + j * 80); g.stroke(); });
      g.globalAlpha = 1; ell(120, 540, 330, 120, '#e9f2ff'); ell(420, 550, 280, 100, '#e9f2ff'); }
    return c;
  }
  function getImgMats() {
    if (imgMats) return imgMats; imgMats = {};
    FC.forEach(function (f, i) { var t = new THREE.CanvasTexture(art(i)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; imgMats[f.k] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }); });
    return imgMats;
  }

  var cube = new THREE.Group(); scene.add(cube);
  var cubies = [], stickers = [], N = 3, H = 1, IMG = 0;
  var bodyGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94), bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  function quad(f, a, col, row, n) {
    var g = new THREE.BufferGeometry(), nr = [0, 0, 0], p = []; nr[f.ax] = f.s;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
      for (var j = 0; j < 3; j++) p.push(nr[j] * 0.471 + a * (c[0] * f.u[j] + c[1] * f.v[j]));
    });
    var u0 = col / n, u1 = (col + 1) / n, v0 = row / n, v1 = (row + 1) / n;
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([].concat(nr, nr, nr, nr), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(IMG ? [u0, v0, u1, v0, u1, v1, u0, v1] : [0, 0, 1, 0, 1, 1, 0, 1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]); return g;
  }
  function build(n, img) {
    while (cube.children.length) cube.remove(cube.children[0]);
    cubies = []; stickers = []; N = n; IMG = img; H = (n - 1) / 2; cube.scale.setScalar(3 / n);
    var mats = img ? getImgMats() : colMats, a = img ? 0.455 : 0.4;
    for (var ix = 0; ix < n; ix++) for (var iy = 0; iy < n; iy++) for (var iz = 0; iz < n; iz++) {
      var P = [ix - H, iy - H, iz - H], c = new THREE.Group(); c.position.set(P[0], P[1], P[2]); c.userData.p0 = c.position.clone();
      var b = new THREE.Mesh(bodyGeo, bodyMat); b.castShadow = true; c.add(b);
      FC.forEach(function (f) {
        if (P[f.ax] !== f.s * H) return;
        var col = Math.round(P[0] * f.u[0] + P[1] * f.u[1] + P[2] * f.u[2] + H), row = Math.round(P[0] * f.v[0] + P[1] * f.v[1] + P[2] * f.v[2] + H);
        var s = new THREE.Mesh(quad(f, a, col, row, n), mats[f.k]), nv = new THREE.Vector3(); nv.setComponent(f.ax, f.s);
        s.userData = { col: f.k, n0: nv, nk: nv.x + ',' + nv.y + ',' + nv.z }; c.add(s); stickers.push(s);
      });
      cube.add(c); cubies.push(c);
    }
    dirty = true;
  }


  var MV = { U: ['y', 1, -1], D: ['y', -1, 1], R: ['x', 1, -1], L: ['x', -1, 1], F: ['z', 1, -1], B: ['z', -1, 1] };
  var queue = [], hist = [], moves = 0, running = false, t0 = 0, timerId = null, locked = false;
  function mk(s) { var d = MV[s[0]]; return { a: d[0], l: d[1] * H, t: d[2] * (s.length > 1 ? -1 : 1) }; }
  function enqueue(m, rec, fast) { queue.push({ m: typeof m === 'string' ? mk(m) : m, rec: rec, fast: fast }); next(); }
  function userMove(m) { if (!locked) enqueue(m, true, false); }
  function grab(axis, l) {
    var pivot = new THREE.Group(); scene.add(pivot);
    var sel = cubies.filter(function (c) { return Math.abs(c.position[axis] - l) < 0.1; });
    sel.forEach(function (c) { pivot.attach(c); }); return { pivot: pivot, sel: sel };
  }
  function play(L, axis, from, to, q) {
    var turns = Math.max(0.3, Math.abs(to - from) / (Math.PI / 2));
    anim = { pivot: L.pivot, sel: L.sel, axis: axis, from: from, to: to, t0: performance.now(), dur: reduce ? 0 : (q.fast ? 70 : speed) * turns, q: q };
  }
  function next() { if (anim || !queue.length) return; var q = queue.shift(); play(grab(q.m.a, q.m.l), q.m.a, 0, q.m.t * Math.PI / 2, q); }
  function rh(v) { return Math.round(v * 2) / 2; }
  function finish() {
    var a = anim; a.pivot.rotation[a.axis] = a.to; a.pivot.updateMatrixWorld(true);
    a.sel.forEach(function (c) {
      cube.attach(c); c.scale.set(1, 1, 1); c.position.set(rh(c.position.x), rh(c.position.y), rh(c.position.z));
      var m = new THREE.Matrix4().makeRotationFromQuaternion(c.quaternion); m.elements = m.elements.map(Math.round); c.quaternion.setFromRotationMatrix(m);
    });
    scene.remove(a.pivot);
    if (a.q.rec) { hist.push(a.q.m); moves++; if (!running) { running = true; t0 = performance.now(); } cb.onTurn && cb.onTurn(); }
    anim = null; dirty = true;
    if (!queue.length) {
      var was = locked; locked = false;
      if (was) cb.onState('ready'); else if (isSolved()) { if (running) { running = false; cb.onWin(performance.now() - t0, moves); } else cb.onState('solved'); } else cb.onState('playing');
    }
    cb.onMoves(moves); next();
  }
  function isSolved() {
    var map = {}, v = new THREE.Vector3();
    for (var i = 0; i < stickers.length; i++) {
      var s = stickers[i], u = s.userData, c = s.parent; v.copy(u.n0).applyQuaternion(c.quaternion);
      var k = Math.round(v.x) + ',' + Math.round(v.y) + ',' + Math.round(v.z);
      if (IMG) { if (k !== u.nk || c.position.distanceTo(c.userData.p0) > 0.1) return false; }
      else if (map[u.col] === undefined) map[u.col] = k; else if (map[u.col] !== k) return false;
    }
    return true;
  }

  var target = new THREE.Vector3(0, 0, 0), view = { az: 0.7, pol: 1.15, dist: 10 };
  var VIEWS = { front: { az: 0, pol: 1.45, dist: 9.5 }, three: { az: 0.7, pol: 1.15, dist: 10 }, side: { az: 1.5708, pol: 1.45, dist: 9.5 }, top: { az: 0, pol: 0.25, dist: 10.5 }, bottom: { az: 0, pol: 2.89, dist: 10.5 } };
  function place() {
    var s = Math.sin(view.pol); camera.position.set(view.dist * s * Math.sin(view.az), view.dist * Math.cos(view.pol), view.dist * s * Math.cos(view.az)); camera.lookAt(target);
  }
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 0.9 ? 30 / Math.max(camera.aspect / 0.9, 0.6) : 30;
    camera.updateProjectionMatrix(); dirty = true;
  }
  var ro = new ResizeObserver(resize); ro.observe(stage);
  function clearPressed() {}
  function setView(name) { var to = VIEWS[name]; if (!to) return;
    if (reduce) { view.az = to.az; view.pol = to.pol; view.dist = to.dist; dirty = true; return; }
    tween = { t0: performance.now(), dur: 650, from: { az: view.az, pol: view.pol, dist: view.dist }, to: to }; }
  var ray = new THREE.Raycaster(), V = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  var pts = {}, lastPinch = 0;
  function pick(e) {
    var r = stage.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    var hit = ray.intersectObjects(cube.children, true)[0]; if (!hit || !hit.face) return null;
    var n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    var ax = Math.abs(n.x) > 0.5 ? 'x' : Math.abs(n.y) > 0.5 ? 'y' : 'z';
    var c = hit.object.parent; while (c && c.parent !== cube) c = c.parent;
    return c ? { cubie: c, nax: ax, p: hit.point.clone() } : null;
  }
  function toPx(v) { var q = v.clone().project(camera), r = stage.getBoundingClientRect(); return { x: (q.x + 1) / 2 * r.width, y: (1 - q.y) / 2 * r.height }; }
  function moveDrag(e) {
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.mode === 'pending') {
      var len = Math.hypot(dx, dy); if (len < 10) return;
      var h = drag.h, best = null, p0 = toPx(h.p);
      ['x', 'y', 'z'].forEach(function (a) {
        if (a === h.nax) return;
        var p1 = toPx(V[a].clone().cross(h.p).normalize().multiplyScalar(0.5).add(h.p)), sx = p1.x - p0.x, sy = p1.y - p0.y, sl = Math.hypot(sx, sy) || 1; sx /= sl; sy /= sl;
        var d = (dx * sx + dy * sy) / len; if (!best || Math.abs(d) > Math.abs(best.d)) best = { a: a, d: d, x: sx, y: sy };
      });
      var l = h.cubie.position[best.a], L = grab(best.a, l);
      anim = { drag: true, pivot: L.pivot, sel: L.sel, axis: best.a, l: l, dir: best, angle: 0 }; drag.mode = 'turn';
    }
    var d2 = anim.dir, ang = (dx * d2.x + dy * d2.y) / 140 * Math.PI / 2;
    anim.angle = Math.max(-Math.PI, Math.min(Math.PI, ang)); anim.pivot.rotation[anim.axis] = anim.angle; dirty = true;
  }
  function endDrag() {
    var d = drag; drag = null; if (!d || d.mode !== 'turn') return;
    var ang = anim.angle, k = Math.round(ang / (Math.PI / 2)); if (k === 0 && Math.abs(ang) > 0.35) k = ang > 0 ? 1 : -1;
    play({ pivot: anim.pivot, sel: anim.sel }, anim.axis, ang, k * Math.PI / 2, { m: { a: anim.axis, l: anim.l, t: k }, rec: k !== 0, fast: false });
  }
  function cancelDrag() {
    var d = drag; drag = null;
    if (d && d.mode === 'turn') play({ pivot: anim.pivot, sel: anim.sel }, anim.axis, anim.angle, 0, { m: { a: anim.axis, l: anim.l, t: 0 }, rec: false, fast: false });
  }
  stage.addEventListener('pointerdown', function (e) {
    stage.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY }; tween = null; lastPinch = 0;
    if (Object.keys(pts).length > 1) { if (drag) cancelDrag(); return; }
    var h = (anim || queue.length || locked) ? null : pick(e);
    drag = h ? { id: e.pointerId, h: h, sx: e.clientX, sy: e.clientY, mode: 'pending' } : null;
  });
  stage.addEventListener('pointermove', function (e) {
    var p = pts[e.pointerId]; if (!p) return; var ids = Object.keys(pts);
    if (ids.length === 2) {
      if (drag) cancelDrag(); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinch) view.dist = Math.min(20, Math.max(5.5, view.dist * lastPinch / d)); lastPinch = d; dirty = true; return;
    }
    if (drag && drag.id === e.pointerId) { moveDrag(e); return; }
    view.az -= (e.clientX - p.x) * 0.008; view.pol = Math.min(3.02, Math.max(0.12, view.pol - (e.clientY - p.y) * 0.008));
    pts[e.pointerId] = { x: e.clientX, y: e.clientY }; clearPressed(); dirty = true;
  });
  function up(e) { if (drag && drag.id === e.pointerId) endDrag(); delete pts[e.pointerId]; lastPinch = 0; }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', function (e) { e.preventDefault(); view.dist = Math.min(20, Math.max(5.5, view.dist * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
    var mo = new MutationObserver(readShadow); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function frame(now) {
    if (!alive) return;
    if (tween) {
      var k = Math.min(1, (now - tween.t0) / tween.dur), e = ease(k);
      view.az = tween.from.az + (tween.to.az - tween.from.az) * e; view.pol = tween.from.pol + (tween.to.pol - tween.from.pol) * e; view.dist = tween.from.dist + (tween.to.dist - tween.from.dist) * e;
      if (k >= 1) tween = null; dirty = true;
    }
    if (spin > 0) { spin -= 1; cube.rotation.y += 0.09 * (spin / 90); cube.position.y = Math.sin((90 - spin) / 90 * Math.PI) * 0.6; dirty = true; if (spin === 0) { cube.position.y = 0; } }
    if (anim && !anim.drag) {
      var kk = anim.dur ? Math.min(1, (now - anim.t0) / anim.dur) : 1;
      anim.pivot.rotation[anim.axis] = anim.from + (anim.to - anim.from) * ease(kk); dirty = true; if (kk >= 1) finish();
    }
    if (dirty) { place(); renderer.render(scene, camera); dirty = false; }
    requestAnimationFrame(frame);
  }
  function onKey(e) {
    if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
    var u = e.key.toUpperCase(); if (MV[u] && u.length === 1) userMove(u + (e.shiftKey ? "'" : ''));
  }
  document.addEventListener('keydown', onKey);
  build(3, 0); readShadow(); resize(); requestAnimationFrame(frame);

  return {
    start: function (n, img, mix) {
      queue = []; if (anim) { scene.remove(anim.pivot); anim = null; } drag = null;
      running = false; hist = []; moves = 0; cb.onMoves(0); cube.rotation.y = 0;
      build(n, img); cb.onState('scrambling'); locked = true;
      var last = '';
      for (var i = 0; i < mix; i++) {
        var a, l, k; do { a = 'xyz'[Math.floor(Math.random() * 3)]; l = Math.floor(Math.random() * n) - H; k = a + l; } while (k === last);
        last = k; enqueue({ a: a, l: l, t: Math.random() < 0.5 ? 1 : -1 }, false, true);
      }
    },
    move: function (m) { userMove(m); },
    undo: function () { if (locked || !hist.length) return; var m = hist.pop(); moves = Math.max(0, moves - 1); enqueue({ a: m.a, l: m.l, t: -m.t }, false, false); },
    setView: setView,
    setSpeed: function (v) { speed = v; },
    elapsed: function () { return running ? performance.now() - t0 : 0; },
    celebrate: function () { if (!reduce) spin = 90; },
    dispose: function () { alive = false; ro.disconnect(); mo.disconnect(); document.removeEventListener('keydown', onKey); renderer.dispose(); renderer.domElement.remove(); },
  };
}
