// Sprout Siege — core: canvas, loop, input, immediate-mode UI, save, utils
(function () {
  const SS = (window.SS = window.SS || {});
  SS.W = 1000;
  SS.H = 640;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  SS.canvas = canvas;
  SS.ctx = ctx;
  let scale = 1, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = Math.min(window.innerWidth / SS.W, window.innerHeight / SS.H);
    canvas.style.width = Math.floor(SS.W * scale) + 'px';
    canvas.style.height = Math.floor(SS.H * scale) + 'px';
    canvas.width = Math.round(SS.W * scale * dpr);
    canvas.height = Math.round(SS.H * scale * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- utils ----------
  SS.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  SS.lerp = (a, b, t) => a + (b - a) * t;
  SS.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  SS.mulberry = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  SS.rng = SS.mulberry(Date.now() & 0xffffff);
  SS.rand = (a, b) => a + (b - a) * SS.rng();
  SS.irand = (a, b) => Math.floor(a + (b - a + 1) * SS.rng());
  SS.pick = (arr) => arr[Math.floor(SS.rng() * arr.length)];
  SS.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(SS.rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  SS.wpick = function (items, wfn) {
    let tot = 0;
    for (const it of items) tot += wfn(it);
    let r = SS.rng() * tot;
    for (const it of items) { r -= wfn(it); if (r <= 0) return it; }
    return items[items.length - 1];
  };
  SS.fmt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // ---------- input ----------
  const input = (SS.input = {
    x: -100, y: -100, down: false, click: null, rclick: false, keys: {}, pressed: {}, wheel: 0,
    consume() { this.click = null; },
  });
  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SS.W, y: ((e.clientY - r.top) / r.height) * SS.H };
  }
  canvas.addEventListener('pointermove', (e) => { const p = toLogical(e); input.x = p.x; input.y = p.y; });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toLogical(e); input.x = p.x; input.y = p.y;
    SS.audio && SS.audio.unlock();
    if (e.button === 2) { input.rclick = true; return; }
    input.down = true;
    input.click = { x: p.x, y: p.y };
  });
  window.addEventListener('pointerup', () => { input.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    SS.audio && SS.audio.unlock();
    if (!input.keys[e.key]) input.pressed[e.key] = true;
    input.keys[e.key] = true;
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { input.keys[e.key] = false; });

  // ---------- immediate-mode UI ----------
  const ui = (SS.ui = {});
  ui.hover = (x, y, w, h) => input.x >= x && input.x <= x + w && input.y >= y && input.y <= y + h;
  ui.hit = function (x, y, w, h) {
    const c = input.click;
    if (c && c.x >= x && c.x <= x + w && c.y >= y && c.y <= y + h) { input.consume(); return true; }
    return false;
  };
  ui.rrect = function (c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  ui.text = function (c, s, x, y, o = {}) {
    c.font = (o.bold === false ? '' : 'bold ') + (o.size || 18) + 'px ' + (o.font || '"Trebuchet MS",Verdana,sans-serif');
    c.textAlign = o.align || 'center';
    c.textBaseline = o.base || 'middle';
    if (o.stroke) { c.lineWidth = o.sw || 4; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
    c.fillStyle = o.color || '#fff';
    c.fillText(s, x, y);
  };
  ui.wrap = function (c, s, x, y, maxW, lh, o = {}) {
    c.font = (o.bold ? 'bold ' : '') + (o.size || 16) + 'px "Trebuchet MS",Verdana,sans-serif';
    const words = s.split(' ');
    let line = '', yy = y;
    const lines = [];
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    c.textAlign = o.align || 'left';
    c.textBaseline = 'top';
    c.fillStyle = o.color || '#fff';
    for (const l of lines) { c.fillText(l, x, yy); yy += lh; }
    return lines.length * lh;
  };
  // returns true when clicked
  ui.button = function (c, x, y, w, h, label, o = {}) {
    const hov = !o.disabled && ui.hover(x, y, w, h);
    const base = o.color || '#6aa83a';
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.35)';
    c.shadowOffsetY = 3;
    c.shadowBlur = 4;
    ui.rrect(c, x, y, w, h, o.r || 10);
    const g = c.createLinearGradient(0, y, 0, y + h);
    if (o.disabled) { g.addColorStop(0, '#9a9a8e'); g.addColorStop(1, '#6d6d63'); }
    else { g.addColorStop(0, ui.shade(base, hov ? 0.35 : 0.2)); g.addColorStop(1, ui.shade(base, hov ? -0.05 : -0.2)); }
    c.fillStyle = g;
    c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 3;
    c.strokeStyle = o.border || 'rgba(40,30,10,0.75)';
    c.stroke();
    c.restore();
    ui.text(c, label, x + w / 2, y + h / 2 + 1, { size: o.size || Math.min(22, h * 0.45), color: o.disabled ? '#ddd' : o.tc || '#fffbe8', stroke: 'rgba(30,20,0,0.6)', sw: 3 });
    if (!o.disabled && ui.hit(x, y, w, h)) { SS.audio && SS.audio.sfx('click'); return true; }
    return false;
  };
  ui.shade = function (hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
    let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    const f = (v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  };
  ui.panel = function (c, x, y, w, h, o = {}) {
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = 14;
    c.shadowOffsetY = 5;
    ui.rrect(c, x, y, w, h, o.r || 16);
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || '#e9d9a8');
    g.addColorStop(1, o.bot || '#c9ae6e');
    c.fillStyle = g;
    c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 5;
    c.strokeStyle = o.border || '#6b4a1e';
    c.stroke();
    c.restore();
  };

  // ---------- save ----------
  const SAVE_KEY = 'sproutsiege_save_v1';
  SS.defaultSave = function () {
    return {
      adv: 0, // index of next adventure level (0..49), 50 = finished
      advDone: {}, // key -> true
      coins: 0,
      plants: ['pippod'],
      shovel: false,
      slots: 6,
      bought: {},
      items: { rake: 0, fertilizer: 0, bugspray: 0 },
      mini: {}, puzzle: {}, survival: {},
      zen: { plants: [], sprouts: 0 },
      seen: {}, // tutorials / almanac
      settings: { music: 0.5, sfx: 0.7, autoSun: false, speed: 1 },
      stats: { kills: 0, played: 0 },
    };
  };
  SS.loadSave = function () {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
    const d = SS.defaultSave();
    if (!s || typeof s !== 'object') return d;
    for (const k in d) if (s[k] === undefined) s[k] = d[k];
    for (const k in d.settings) if (s.settings[k] === undefined) s.settings[k] = d.settings[k];
    for (const k in d.items) if (s.items[k] === undefined) s.items[k] = d.items[k];
    return s;
  };
  SS.save = SS.loadSave();
  SS.persist = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(SS.save)); } catch (e) { /* ignore */ }
  };
  SS.resetSave = function () { SS.save = SS.defaultSave(); SS.persist(); };

  // ---------- scenes & loop ----------
  SS.scene = null;
  SS.setScene = function (s) {
    if (SS.scene && SS.scene.exit) SS.scene.exit();
    SS.scene = s;
    input.click = null;
    if (s.enter) s.enter();
  };
  SS.fade = 0; // screen fade-in overlay
  const STEP = 1 / 60;
  let acc = 0, last = performance.now();
  SS.time = 0;
  SS.frame = function (now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 10) {
      SS.time += STEP;
      if (SS.scene && SS.scene.update) SS.scene.update(STEP);
      acc -= STEP;
      n++;
    }
    if (n >= 10) acc = 0;
    SS.render();
    requestAnimationFrame(SS.frame);
  };
  SS.render = function () {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.clearRect(0, 0, SS.W, SS.H);
    if (SS.scene && SS.scene.draw) SS.scene.draw(ctx);
    if (SS.fade > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + SS.fade + ')';
      ctx.fillRect(0, 0, SS.W, SS.H);
      SS.fade = Math.max(0, SS.fade - 0.06);
    }
    input.click = null;
    input.rclick = false;
    input.pressed = {};
    input.wheel = 0;
  };
  SS.start = function (scene) {
    SS.setScene(scene);
    requestAnimationFrame((t) => { last = t; SS.frame(t); });
  };
})();
