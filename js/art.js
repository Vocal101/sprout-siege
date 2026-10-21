// Sprout Siege — procedural plant art, props, pickups and backgrounds (all original designs)
(function () {
  const SS = window.SS;
  const A = (SS.art = {});
  const OL = '#24310f';
  const TAU = Math.PI * 2;

  // ---------- helpers ----------
  function ell(c, x, y, rx, ry, fill, stroke, lw) {
    c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke !== false) { c.lineWidth = lw || 2.2; c.strokeStyle = stroke || OL; c.stroke(); }
  }
  function rgrad(c, x, y, r, c0, c1) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  }
  function lgrad(c, x0, y0, x1, y1, c0, c1) {
    const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
  }
  function leaf(c, x, y, len, wid, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.5, -wid, len, 0);
    c.quadraticCurveTo(len * 0.5, wid, 0, 0);
    c.fillStyle = col || '#4f9a2c'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(2, 0); c.lineTo(len * 0.8, 0); c.lineWidth = 1; c.strokeStyle = 'rgba(20,50,10,0.5)'; c.stroke();
    c.restore();
  }
  function stem(c, x0, y0, x1, y1, bend, col, w) {
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1);
    c.lineWidth = (w || 5) + 3; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke();
    c.lineWidth = w || 5; c.strokeStyle = col || '#4c9a2a'; c.stroke();
  }
  function blinkAt(t, seed) { return ((t + (seed || 0)) % 4.1) < 0.12; }
  // eyes: x,y center between eyes; r eye radius; o: {sleep, angry, look, gap, scared, single}
  function eyes(c, x, y, r, st, o = {}) {
    const gap = o.gap !== undefined ? o.gap : r * 1.25;
    const xs = o.single ? [x] : [x - gap, x + gap];
    const blink = blinkAt(st.t || 0, st.seed);
    for (const ex of xs) {
      if (st.asleep || o.sleep) {
        c.beginPath(); c.arc(ex, y, r * 0.8, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
        continue;
      }
      if (blink) { c.beginPath(); c.moveTo(ex - r, y); c.lineTo(ex + r, y); c.lineWidth = 2; c.strokeStyle = OL; c.stroke(); continue; }
      ell(c, ex, y, r * (o.wide || 0.85), r, '#fff', OL, 1.6);
      const lx = (o.look !== undefined ? o.look : 0.35) * r * 0.5;
      ell(c, ex + lx, y + (o.scared ? -r * 0.1 : r * 0.1), r * 0.42, r * 0.5, '#1a1a12', false);
      ell(c, ex + lx + r * 0.15, y - r * 0.2, r * 0.13, r * 0.13, '#fff', false);
    }
    if (o.angry && !st.asleep) {
      c.lineWidth = 2.4; c.strokeStyle = OL; c.beginPath();
      c.moveTo(xs[0] - r, y - r * 1.4); c.lineTo(xs[0] + r * 0.8, y - r * 0.9);
      if (xs[1] !== undefined) { c.moveTo(xs[1] + r, y - r * 1.4); c.lineTo(xs[1] - r * 0.8, y - r * 0.9); }
      c.stroke();
    }
  }
  function mouth(c, x, y, w, kind) {
    c.beginPath();
    if (kind === 'o') { ell(c, x, y, w * 0.4, w * 0.45, '#3a1508', OL, 1.5); return; }
    if (kind === 'frown') c.arc(x, y + w * 0.5, w * 0.5, 1.2 * Math.PI, 1.8 * Math.PI);
    else c.arc(x, y - w * 0.3, w * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
    c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
  }
  function zzz(c, x, y, t) {
    const k = (t * 0.6) % 1;
    SS.ui.text(c, 'z', x + k * 10, y - k * 18, { size: 10 + k * 6, color: 'rgba(240,240,255,' + (1 - k) + ')', stroke: 'rgba(20,20,60,' + (1 - k) * 0.6 + ')', sw: 2 });
  }
  function baseLeaves(c, col) {
    leaf(c, -2, -2, 26, 8, Math.PI + 0.25, col || '#4f9a2c');
    leaf(c, 2, -2, 26, 8, -0.25, col || '#4f9a2c');
  }
  function barrel(c, x, y, len, r, col, dark) {
    c.beginPath(); c.rect(x, y - r, len, r * 2);
    c.fillStyle = lgrad(c, 0, y - r, 0, y + r, col, dark); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    ell(c, x + len, y, r * 0.45, r * 1.15, col, OL, 2);
    ell(c, x + len + 0.5, y, r * 0.25, r * 0.7, '#1b2508', false);
  }
  A.ell = ell; A.leaf = leaf; A.stem = stem; A.eyes = eyes; A.rgrad = rgrad; A.lgrad = lgrad; A.mouth = mouth; A.zzz = zzz;

  // ---------- plant drawers: origin = ground center, y up is negative ----------
  const P = (A.P = {});

  function podBody(c, st, col, dark, x, y, rx, ry) {
    ell(c, x, y, rx, ry, rgrad(c, x, y, Math.max(rx, ry), col, dark));
    // highlight
    ell(c, x - rx * 0.35, y - ry * 0.45, rx * 0.25, ry * 0.18, 'rgba(255,255,255,0.35)', false);
  }
  function recoil(st) { const f = st.fire === undefined ? 9 : st.fire; return f < 0.15 ? -4 * (1 - f / 0.15) : 0; }

  P.glowpetal = function (c, st, twin) {
    baseLeaves(c);
    const sway = Math.sin((st.t || 0) * 1.6 + (st.seed || 0)) * 3;
    const heads = twin ? [[-12, -50, -6], [13, -54, 6]] : [[0, -52, 0]];
    for (const [hx, hy, bend] of heads) {
      stem(c, 0, -2, hx + sway, hy + 14, bend - sway, '#4c9a2a', 4);
      const x = hx + sway, y = hy;
      const glow = st.glow || 0;
      if (glow > 0) { ell(c, x, y, 28 + glow * 8, 28 + glow * 8, 'rgba(255,220,90,' + 0.35 * glow + ')', false); }
      c.save(); c.translate(x, y);
      // back petals
      for (const a of [-0.55, 0.55]) {
        c.save(); c.rotate(a);
        c.beginPath(); c.moveTo(0, 12); c.quadraticCurveTo(-15, -2, 0, -22); c.quadraticCurveTo(15, -2, 0, 12);
        c.fillStyle = lgrad(c, 0, -22, 0, 12, '#ffd34d', '#f08a1c'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke(); c.restore();
      }
      // front cup
      c.beginPath(); c.moveTo(-15, -6); c.quadraticCurveTo(-16, 14, 0, 15); c.quadraticCurveTo(16, 14, 15, -6);
      c.quadraticCurveTo(8, -1, 0, -9); c.quadraticCurveTo(-8, -1, -15, -6);
      c.fillStyle = lgrad(c, 0, -9, 0, 15, '#ffe680', '#f5a623'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
      // glowing core
      ell(c, 0, -6, 6, 4, 'rgba(255,255,220,0.9)', false);
      // face
      c.beginPath(); c.arc(-5, 3, 2.5, Math.PI * 1.1, Math.PI * 1.9); c.arc(5, 3, 2.5, Math.PI * 1.1, Math.PI * 1.9);
      c.lineWidth = 1.8; c.strokeStyle = OL; c.stroke();
      c.beginPath(); c.arc(0, 6, 3.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.restore();
    }
  };
  P.doublebloom = (c, st) => P.glowpetal(c, st, true);

  // trumpet-flower nozzle: the "mouth" that seeds shoot from
  function bell(c, x, y, len, r, col, petal, ang) {
    c.save(); c.translate(x, y); c.rotate(ang || 0);
    c.beginPath(); c.moveTo(0, -r * 0.45); c.quadraticCurveTo(len * 0.6, -r * 0.4, len, -r); c.lineTo(len, r); c.quadraticCurveTo(len * 0.6, r * 0.4, 0, r * 0.45); c.closePath();
    c.fillStyle = lgrad(c, 0, -r, 0, r, col, petal); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    // scalloped rim
    c.beginPath();
    for (let i = 0; i <= 4; i++) { const yy = -r + (i * 2 * r) / 4; c.arc(len + 1.5, yy, r * 0.32, -Math.PI / 2, Math.PI / 2); }
    c.fillStyle = petal; c.fill(); c.lineWidth = 1.4; c.stroke();
    ell(c, len + 1, 0, r * 0.32, r * 0.62, '#2a1608', false);
    c.restore();
  }
  // upright bean pod with seed bumps along its seam
  function beanPod(c, st, x, y, rx, ry, col, dark, seed) {
    c.beginPath();
    c.moveTo(x, y - ry);
    c.bezierCurveTo(x + rx * 1.3, y - ry * 0.7, x + rx * 1.15, y + ry * 0.7, x + rx * 0.2, y + ry);
    c.bezierCurveTo(x - rx * 0.6, y + ry * 1.05, x - rx * 1.25, y + ry * 0.4, x - rx * 1.05, y - ry * 0.25);
    c.bezierCurveTo(x - rx * 0.95, y - ry * 0.8, x - rx * 0.4, y - ry * 1.02, x, y - ry);
    c.closePath();
    c.fillStyle = lgrad(c, x - rx, 0, x + rx, 0, col, dark); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    // seam
    c.beginPath(); c.moveTo(x + rx * 0.1, y - ry * 0.95); c.bezierCurveTo(x + rx * 0.7, y - ry * 0.3, x + rx * 0.6, y + ry * 0.5, x + rx * 0.1, y + ry * 0.92);
    c.lineWidth = 1.3; c.strokeStyle = 'rgba(20,50,10,0.55)'; c.stroke();
    for (const k of [-0.35, 0.15, 0.6]) ell(c, x + rx * 0.45, y + ry * k, rx * 0.22, ry * 0.13, seed, 'rgba(20,50,10,0.4)', 1);
  }
  function tendril(c, x, y, col) {
    c.beginPath(); c.moveTo(x, y);
    for (let i = 0; i < 26; i++) { const a = i * 0.42, r = 7 - i * 0.24; c.lineTo(x + 2 + Math.cos(a) * r, y - 8 - i * 0.2 + Math.sin(a) * r); }
    c.lineWidth = 2; c.strokeStyle = col; c.stroke();
  }
  function pippodLike(c, st, o) {
    baseLeaves(c, o.leaf);
    const bob = Math.sin((st.t || 0) * 2 + (st.seed || 0)) * 1.2;
    const rc = recoil(st);
    stem(c, -2, -2, -2, -24, -2, o.leaf || '#4c9a2a', 5);
    c.save(); c.translate(rc, bob);
    for (const b of o.bells) bell(c, b[0], b[1], b[2], b[3], o.col, o.petal, b[4]);
    if (o.backBells) for (const b of o.backBells) { c.save(); c.scale(-1, 1); bell(c, b[0], b[1], b[2], b[3], o.col, o.petal, b[4]); c.restore(); }
    beanPod(c, st, -3, -42, o.rx || 13, o.ry || 21, o.col, o.dark, o.seed || '#c8f08a');
    tendril(c, -5, -62, o.leaf || '#4c9a2a');
    if (o.ice) {
      c.fillStyle = '#e8fbff'; c.strokeStyle = '#4f86a8'; c.lineWidth = 1.2;
      for (const [ix, iy] of [[-14, -54], [-9, -61], [-2, -62]]) { c.beginPath(); c.moveTo(ix, iy); c.lineTo(ix + 2, iy - 8); c.lineTo(ix + 5, iy); c.closePath(); c.fill(); c.stroke(); }
    }
    eyes(c, o.eyeX !== undefined ? o.eyeX : -6, -48, 3.8, st, { gap: 5, look: o.look !== undefined ? o.look : 0.7, angry: o.angry });
    if (o.backFace) eyes(c, -10, -32, 3, st, { gap: 4, look: -0.8, scared: true });
    if (o.band) { c.beginPath(); c.moveTo(-16, -50); c.quadraticCurveTo(-3, -58, 10, -50); c.lineWidth = 4; c.strokeStyle = '#6b5a30'; c.stroke(); }
    c.restore();
  }
  P.pippod = (c, st) => pippodLike(c, st, { col: '#8ed04e', dark: '#3f8a22', petal: '#f2e86a', bells: [[6, -44, 15, 6]] });
  P.frostpod = (c, st) => pippodLike(c, st, { col: '#a8e6f6', dark: '#3d86b5', petal: '#ffffff', seed: '#e8fbff', leaf: '#5aa3b8', bells: [[6, -44, 15, 6]], ice: true });
  P.twinpod = (c, st) => pippodLike(c, st, { col: '#7cc444', dark: '#2f7419', petal: '#ffb84a', bells: [[5, -51, 15, 5], [5, -36, 15, 5]], angry: true });
  P.quadpod = (c, st) => pippodLike(c, st, { col: '#6ab83a', dark: '#245f12', petal: '#ff8a3a', bells: [[5, -56, 14, 4.2, -0.15], [6, -47, 16, 4.2], [6, -38, 16, 4.2], [5, -29, 14, 4.2, 0.15]], angry: true, band: true, rx: 14, ry: 22 });
  P.backpod = (c, st) => pippodLike(c, st, { col: '#9ad85a', dark: '#3f8a22', petal: '#f2e86a', bells: [[6, -46, 15, 6]], backBells: [[11, -34, 13, 5]], backFace: true, eyeX: -3 });
  P.tridentpod = function (c, st) {
    baseLeaves(c);
    const rc = recoil(st);
    stem(c, 0, -2, 0, -26, 2, '#4c9a2a', 6);
    c.save(); c.translate(rc, 0);
    for (const [ang, oy] of [[-0.5, -54], [0, -42], [0.5, -30]]) bell(c, 6, oy, 16, 5, '#86cc48', '#c8f06a', ang);
    for (const [hy, s] of [[-54, 0.62], [-42, 0.8], [-30, 0.62]]) {
      beanPod(c, st, -2, hy, 13 * s, 16 * s, '#86cc48', '#2f7419', '#d8f8a0');
      eyes(c, -4, hy - 3, 3 * s, st, { gap: 4 * s, look: 0.7 });
    }
    tendril(c, -3, -64, '#4c9a2a');
    c.restore();
  };
  P.needlecactus = function (c, st) {
    // stacked prickly-pear pads
    ell(c, 0, -2, 20, 5, 'rgba(0,0,0,0.15)', false);
    const pad = (x, y, rx, ry, a) => {
      c.save(); c.translate(x, y); c.rotate(a);
      ell(c, 0, 0, rx, ry, lgrad(c, -rx, 0, rx, 0, '#8ccf62', '#3a8a34'), OL, 2.2);
      for (let i = 0; i < 7; i++) {
        const aa = i * 2.4, rr = (i % 3 + 1) / 3.6;
        const px = Math.cos(aa) * rx * rr, py = Math.sin(aa) * ry * rr;
        c.fillStyle = '#fff6c8'; c.fillRect(px - 1, py - 1, 2, 2);
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + 4, py - 3); c.lineWidth = 1; c.strokeStyle = '#f4ecc0'; c.stroke();
      }
      c.restore();
    };
    pad(0, -20, 15, 19, 0);
    pad(-14, -42, 10, 13, -0.5);
    pad(6, -50, 13, 17, 0.15);
    ell(c, 9, -70, 6, 7, rgrad(c, 9, -70, 7, '#ff8a9a', '#b8203a'), OL, 1.5);
    c.fillStyle = '#ffe14d'; c.fillRect(7, -78, 4, 3);
    eyes(c, 6, -50, 3.6, st, { gap: 5, look: 0.6 });
  };
  P.starprism = function (c, st) {
    baseLeaves(c, '#5aa83c');
    stem(c, 0, -2, 0, -20, 0, '#4c9a2a', 4);
    const rot = Math.sin((st.t || 0) * 1.5) * 0.05 + (recoil(st) ? 0.12 : 0);
    c.save(); c.translate(0, -40); c.rotate(rot);
    // crystal cluster: five faceted shards
    const shards = [[-Math.PI / 2, 30], [-Math.PI / 2 + 1.26, 24], [-Math.PI / 2 - 1.26, 24], [Math.PI / 2 - 0.63, 20], [Math.PI / 2 + 0.63, 20]];
    for (const [a, len] of shards) {
      c.save(); c.rotate(a + Math.PI / 2);
      c.beginPath(); c.moveTo(-7, 0); c.lineTo(-5, -len * 0.75); c.lineTo(0, -len); c.lineTo(5, -len * 0.75); c.lineTo(7, 0); c.closePath();
      c.fillStyle = lgrad(c, -7, 0, 7, 0, '#d6f4ff', '#6a5ad8'); c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#241a5a'; c.stroke();
      c.beginPath(); c.moveTo(0, -len); c.lineTo(0, -2); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1; c.stroke();
      c.restore();
    }
    ell(c, 0, 0, 13, 12, rgrad(c, 0, 0, 13, '#f0e8ff', '#8a6ae8'), '#241a5a', 2);
    eyes(c, 0, -1, 3.2, st, { gap: 4.5 });
    c.restore();
  };
  P.boomberry = function (c, st) {
    const fz = st.fuse !== undefined ? st.fuse : 0; // 0..1
    const sw = 1 + fz * 0.35, sh = fz > 0 ? (Math.random() - 0.5) * 3 * fz : 0;
    c.save(); c.translate(sh, 0);
    leaf(c, 0, -12, 18, 6, Math.PI + 0.4, '#3f8a2a'); leaf(c, 0, -12, 18, 6, -0.4, '#3f8a2a');
    c.translate(0, -30); c.scale(sw, sw);
    const cols = fz > 0.5 ? ['#c43b6b', '#8a1f45'] : ['#7d3fb0', '#3e1a63'];
    const dr = [[-9, -6], [0, -10], [9, -6], [-11, 4], [0, 1], [11, 4], [-6, 12], [6, 12]];
    for (const [dx, dy] of dr) ell(c, dx, dy, 7.5, 7.5, rgrad(c, dx, dy, 7.5, cols[0], cols[1]), OL, 1.6);
    // fuse
    c.beginPath(); c.moveTo(0, -16); c.quadraticCurveTo(6, -26, 2, -32); c.lineWidth = 2.5; c.strokeStyle = '#5a3b1a'; c.stroke();
    const sp = (st.t * 12) % 1;
    ell(c, 2, -33, 3 + sp * 2, 3 + sp * 2, '#ffd23b', false); ell(c, 2, -33, 1.5, 1.5, '#fff', false);
    eyes(c, 0, 0, 3.2, st, { gap: 5, angry: true, look: 0 });
    c.restore();
  };
  function stumpBody(c, st, h, w) {
    const hpf = st.hpf === undefined ? 1 : st.hpf;
    c.save();
    ell(c, 0, -2, w + 4, 6, 'rgba(0,0,0,0.18)', false);
    // roots
    c.fillStyle = '#7a5130'; c.strokeStyle = OL; c.lineWidth = 2;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * (w - 2), -12); c.quadraticCurveTo(s * (w + 6), -4, s * (w + 9), 0); c.lineTo(s * (w - 6), 0); c.closePath(); c.fill(); c.stroke(); }
    c.beginPath(); c.moveTo(-w, -h + 6); c.lineTo(-w, -4); c.quadraticCurveTo(0, 4, w, -4); c.lineTo(w, -h + 6); c.closePath();
    c.fillStyle = lgrad(c, -w, 0, w, 0, '#9a6a3c', '#5e3b1c'); c.fill(); c.stroke();
    // bark lines
    c.strokeStyle = 'rgba(40,20,5,0.55)'; c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * w * 0.38, -h + 12); c.quadraticCurveTo(i * w * 0.38 + 3, -h / 2, i * w * 0.38 - 1, -6); c.stroke(); }
    // top rings
    ell(c, 0, -h + 6, w, 7, '#d9b07a', OL, 2);
    ell(c, 0, -h + 6, w * 0.6, 4, false, 'rgba(120,70,30,0.6)', 1);
    ell(c, 0, -h + 6, w * 0.25, 1.8, false, 'rgba(120,70,30,0.6)', 1);
    // face
    const ey = -h * 0.55;
    if (hpf > 0.33) eyes(c, 0, ey, 4.5, st, { gap: 7, look: 0.5, angry: hpf < 0.66 });
    else { eyes(c, 0, ey, 4.5, st, { gap: 7, look: 0, scared: true }); }
    mouth(c, 0, ey + 12, 8, hpf < 0.66 ? 'frown' : 'smile');
    // cracks
    if (hpf < 0.66) { c.strokeStyle = '#2b1606'; c.lineWidth = 2; c.beginPath(); c.moveTo(-w + 2, -h + 14); c.lineTo(-w + 9, -h + 22); c.lineTo(-w + 5, -h + 30); c.stroke(); }
    if (hpf < 0.33) { c.beginPath(); c.moveTo(w - 2, -h + 10); c.lineTo(w - 10, -h + 20); c.lineTo(w - 6, -h + 32); c.lineTo(w - 12, -h + 40); c.stroke(); }
    c.restore();
  }
  P.barkshell = (c, st) => stumpBody(c, st, 58, 22);
  P.tallbark = (c, st) => stumpBody(c, st, 92, 22);
  P.tubertrap = function (c, st) {
    ell(c, 0, -3, 22, 8, '#6b4a26', OL, 2);
    if (!st.armed) {
      const k = st.armk || 0;
      stem(c, 0, -4, 0, -10 - k * 4, 1, '#4c9a2a', 3);
      leaf(c, 0, -10 - k * 4, 9, 4, -1.2, '#5cae33');
      return;
    }
    // armed: the radish peeks out and its leaves bristle red
    const on = Math.floor((st.t || 0) * 2) % 2 === 0;
    for (const a of [-0.5, 0, 0.5]) leaf(c, 0, -18, 16, 5, -Math.PI / 2 + a, on ? '#d84a3a' : '#5a8a2a');
    ell(c, 0, -10, 15, 11, rgrad(c, 0, -10, 15, '#ff9aa8', '#c22d4c'));
    eyes(c, 0, -12, 3.2, st, { gap: 5, look: 0.2, angry: on });
    mouth(c, 0, -6, 5);
  };
  P.snapjaw = function (c, st) {
    baseLeaves(c, '#5f9a2a');
    const chewing = st.chew > 0;
    const bite = st.bite || 0; // 0..1 lid snap anim
    // tube body
    c.save();
    c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(-22, -40, -12, -62); c.lineTo(14, -62); c.quadraticCurveTo(24, -40, 14, -6); c.closePath();
    c.fillStyle = lgrad(c, -16, 0, 16, 0, '#c94a7a', '#6a1e47'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    // veins
    c.strokeStyle = 'rgba(255,200,220,0.4)'; c.lineWidth = 1.3;
    for (const vx of [-6, 0, 6]) { c.beginPath(); c.moveTo(vx, -10); c.quadraticCurveTo(vx * 1.5, -35, vx, -58); c.stroke(); }
    if (chewing) { ell(c, 0, -32, 17, 14, 'rgba(110,30,70,0.6)', false); }
    // rim
    ell(c, 0, -62, 14, 4.5, '#3a0d24', OL, 2);
    // lid
    const open = chewing ? 0 : Math.max(0, 1 - bite) * (0.6 + 0.15 * Math.sin(st.t * 3));
    c.translate(-13, -63); c.rotate(-open * 1.1);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -12, 30, -2); c.quadraticCurveTo(16, 4, 0, 0);
    c.fillStyle = '#7ab53a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.restore();
    eyes(c, 2, -44, 4, st, { gap: 6, look: 0.5, angry: !chewing, sleep: chewing });
    if (chewing) { mouth(c, 2, -32, 9, 'smile'); c.beginPath(); c.arc(2, -27, 3, 0, Math.PI); c.stroke(); }
    else { c.beginPath(); c.moveTo(-6, -32); for (let i = 0; i < 5; i++) c.lineTo(-6 + i * 3 + 1.5, -32 + (i % 2 ? 3 : -1)); c.lineWidth = 1.6; c.strokeStyle = OL; c.stroke(); }
  };
  function shroom(c, st, o) {
    const s = o.s || 1;
    c.save();
    // stalk
    c.beginPath(); c.moveTo(-o.sw * s, -2); c.quadraticCurveTo(-o.sw * s * 1.2, -o.sh * s * 0.6, -o.sw * s * 0.8, -o.sh * s);
    c.lineTo(o.sw * s * 0.8, -o.sh * s); c.quadraticCurveTo(o.sw * s * 1.2, -o.sh * s * 0.6, o.sw * s, -2); c.closePath();
    c.fillStyle = lgrad(c, -o.sw * s, 0, o.sw * s, 0, o.stalk || '#f3e7cf', o.stalkDark || '#c7b48f'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    // cap
    const cy = -o.sh * s;
    c.beginPath(); c.moveTo(-o.cw * s, cy + 2);
    c.quadraticCurveTo(-o.cw * s, cy - o.ch * s * 1.3, 0, cy - o.ch * s * 1.3);
    c.quadraticCurveTo(o.cw * s, cy - o.ch * s * 1.3, o.cw * s, cy + 2);
    c.quadraticCurveTo(0, cy + 7 * s, -o.cw * s, cy + 2); c.closePath();
    c.fillStyle = rgrad(c, 0, cy - o.ch * s * 0.6, o.cw * s, o.cap, o.capDark); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    if (o.spots) { for (const [sx, sy, sr] of o.spots) ell(c, sx * s, cy + sy * s, sr * s, sr * s * 0.8, o.spotCol || 'rgba(255,255,255,0.7)', false); }
    if (o.face !== false) eyes(c, (o.ex || 0) * s, -o.sh * s * (o.ey || 0.5), 3.4 * s, st, { gap: 4.5 * s, look: o.look !== undefined ? o.look : 0.5, angry: o.angry, scared: o.scared });
    c.restore();
    if (st.asleep) zzz(c, o.cw * s * 0.6, cy - o.ch * s, st.t || 0);
    return cy;
  }
  P.sporepuff = function (c, st) {
    // round puffball with a pore on top
    const puff = st.fire !== undefined && st.fire < 0.25 ? 1 - st.fire / 0.25 : 0;
    ell(c, 0, -3, 16, 4, 'rgba(0,0,0,0.15)', false);
    ell(c, 0, -15, 15 + puff * 2, 14 - puff * 2, rgrad(c, 0, -15, 15, '#f4ead8', '#a89070'));
    c.fillStyle = 'rgba(120,90,60,0.45)';
    for (const [dx, dy] of [[-8, -20], [6, -24], [9, -12], [-10, -10], [0, -8]]) { c.beginPath(); c.arc(dx, dy, 1.4, 0, Math.PI * 2); c.fill(); }
    ell(c, 2, -28, 4, 2, '#5a4030', OL, 1.4);
    if (puff > 0) ell(c, 2, -34 - puff * 6, 5 * puff + 2, 4 * puff + 2, 'rgba(230,210,180,0.7)', false);
    eyes(c, 1, -16, 3.2, st, { gap: 4.5, look: 0.6 });
    if (st.asleep) zzz(c, 12, -30, st.t || 0);
  };
  P.tidepuff = function (c, st) {
    // anemone floating on water
    ell(c, 0, -6, 20, 7, 'rgba(255,255,255,0.25)', false);
    c.save();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI, wv = Math.sin(st.t * 3 + i) * 3;
      c.beginPath(); c.moveTo(Math.cos(a) * 8, -16); c.quadraticCurveTo(Math.cos(a) * 16 + wv, -22 + Math.sin(a) * 10, Math.cos(a) * 14 + wv, -30 + Math.sin(a) * 6);
      c.lineWidth = 6; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = '#ff8fb0'; c.stroke();
    }
    ell(c, 0, -14, 15, 11, rgrad(c, 0, -14, 15, '#6ee0d0', '#1f8a8a'));
    eyes(c, 0, -15, 3.2, st, { gap: 4.5, look: 0.5 });
    ell(c, 15, -14, 4, 3, '#1a6a6a', OL, 1.4);
    c.restore();
    if (st.asleep) zzz(c, 10, -32, st.t || 0);
  };
  P.glowcap = function (c, st) {
    // foxfire mushroom: pale cap with glowing green gills
    const s = st.grown ? 1.25 : 0.8;
    const glow = 0.25 + 0.15 * Math.sin((st.t || 0) * 2);
    if (!st.asleep) ell(c, 0, -24 * s, 22 * s, 18 * s, 'rgba(170,255,140,' + glow + ')', false);
    const cy = shroom(c, st, { s, sw: 5, sh: 15, cw: 16, ch: 9, cap: '#f4f8e0', capDark: '#a8b890', spots: [], ey: 0.5 });
    c.strokeStyle = st.asleep ? 'rgba(120,150,110,0.7)' : 'rgba(150,255,120,0.95)'; c.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 2 * s, cy + 2); c.lineTo(i * 4.5 * s, cy + 5 * s); c.stroke(); }
  };
  P.gasbloom = function (c, st) {
    // squat green-gold stinkhorn with a woody chimney vent
    const cy = shroom(c, st, { sw: 9, sh: 18, cw: 19, ch: 16, cap: '#c8d860', capDark: '#5a7a20', spots: [[-10, -14, 3], [4, -20, 2.4], [10, -10, 2.6]], spotCol: 'rgba(90,60,20,0.75)', angry: true, ey: 0.55, ex: -3 });
    c.save(); c.translate(15, cy - 4 + recoil(st) * 0.5);
    c.beginPath(); c.moveTo(0, -5); c.lineTo(13, -7); c.lineTo(13, 7); c.lineTo(0, 5); c.closePath();
    c.fillStyle = lgrad(c, 0, -7, 0, 7, '#9a6a3c', '#5a3a1a'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    ell(c, 13, 0, 3, 7, '#2a1608', OL, 1.6);
    c.restore();
  };
  P.gloomcap = function (c, st) {
    const cy = shroom(c, st, { sw: 11, sh: 18, cw: 24, ch: 19, cap: '#5a6a3a', capDark: '#1a2410', spots: [[-12, -10, 3], [12, -10, 3], [0, -22, 3]], spotCol: 'rgba(210,230,90,0.85)', angry: true, look: 0 });
    c.fillStyle = '#3a2a14'; c.strokeStyle = OL; c.lineWidth = 1.8;
    for (const [vx, vy, a] of [[-24, cy - 4, Math.PI], [24, cy - 4, 0], [-16, cy - 20, -2.3], [16, cy - 20, -0.8], [0, cy - 26, -Math.PI / 2]]) {
      c.save(); c.translate(vx, vy); c.rotate(a); c.beginPath(); c.moveTo(0, -4); c.lineTo(9, -6); c.lineTo(9, 6); c.lineTo(0, 4); c.closePath(); c.fill(); c.stroke(); c.restore();
    }
  };
  P.rootdigger = function (c, st) {
    const k = st.digk || 0;
    c.save(); c.translate(0, k * 18);
    // gnarled root claws
    c.lineCap = 'round';
    for (const [x0, a] of [[-14, -0.6], [-5, -0.2], [5, 0.2], [14, 0.6]]) {
      const wig = Math.sin(st.t * 8 + x0) * 2 * (st.digging ? 1 : 0.2);
      c.beginPath(); c.moveTo(x0 * 0.6, -14); c.quadraticCurveTo(x0 * 1.3 + wig, -34, x0 * 0.7 + Math.sin(a) * 10, -46 - Math.cos(a) * 4);
      c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#8a5a30'; c.stroke();
    }
    ell(c, 0, -12, 18, 12, rgrad(c, 0, -12, 18, '#b07a46', '#5a3414'));
    eyes(c, 0, -14, 3.4, st, { gap: 5, angry: true });
    leaf(c, 6, -22, 10, 4, -0.6, '#5cae33');
    c.restore();
  };
  P.mesmercap = function (c, st) {
    // tall striped cone cap with drifting stripes
    c.beginPath(); c.moveTo(-6, -2); c.lineTo(-5, -20); c.lineTo(5, -20); c.lineTo(6, -2); c.closePath();
    c.fillStyle = '#f2ead8'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-17, -20); c.quadraticCurveTo(-8, -40, 0, -62); c.quadraticCurveTo(8, -40, 17, -20); c.closePath();
    c.fillStyle = lgrad(c, -17, 0, 17, 0, '#5ae0c8', '#1a7a8a'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    c.save(); c.clip();
    c.strokeStyle = '#f8fff0'; c.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = -20 - ((i * 9 + (st.t || 0) * 14) % 48); c.beginPath(); c.moveTo(-18, y + 6); c.lineTo(18, y - 6); c.stroke(); }
    c.restore();
    eyes(c, 0, -12, 3, st, { gap: 4.2, look: 0.5 });
    if (st.asleep) zzz(c, 12, -50, st.t || 0);
  };
  P.timidcap = function (c, st) {
    const h = st.hide ? 6 : 34;
    // funnel cap on a long stalk
    c.beginPath(); c.moveTo(-4, -2); c.lineTo(-3, -h); c.lineTo(3, -h); c.lineTo(4, -2); c.closePath();
    c.fillStyle = '#f2d8a0'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-3, -h); c.quadraticCurveTo(-16, -h - 4, -15, -h - 12); c.quadraticCurveTo(0, -h - 8, 15, -h - 12); c.quadraticCurveTo(16, -h - 4, 3, -h); c.closePath();
    c.fillStyle = lgrad(c, 0, -h - 12, 0, -h, '#ffb84a', '#d8702a'); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,50,10,0.5)'; c.lineWidth = 1;
    for (const gx of [-8, -3, 3, 8]) { c.beginPath(); c.moveTo(gx * 0.4, -h - 1); c.lineTo(gx, -h - 9); c.stroke(); }
    eyes(c, 0, -h + (st.hide ? -10 : 10), 3, st, { gap: 4, look: st.hide ? -0.3 : 0.6, scared: !!st.hide });
    if (st.asleep) zzz(c, 12, -h - 14, st.t || 0);
  };
  P.frostcap = function (c, st) {
    // faceted crystal cap like a geode
    c.beginPath(); c.moveTo(-6, -2); c.lineTo(-5, -18); c.lineTo(5, -18); c.lineTo(6, -2); c.closePath();
    c.fillStyle = '#eef6fa'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    const pts = [[-20, -20], [-14, -34], [-4, -40], [8, -38], [18, -30], [20, -20]];
    c.beginPath(); c.moveTo(-20, -18); for (const [x, y] of pts) c.lineTo(x, y); c.lineTo(20, -18); c.closePath();
    c.fillStyle = lgrad(c, -20, -40, 20, -18, '#f4f0ff', '#8aa0e8'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = '#2a2a6a'; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.2;
    c.beginPath(); for (const [x, y] of pts) { c.moveTo(0, -24); c.lineTo(x, y); } c.stroke();
    eyes(c, 0, -10, 3.2, st, { gap: 4.5 });
    if (st.asleep) zzz(c, 14, -42, st.t || 0);
  };
  P.dreadmorel = function (c, st) {
    const fz = st.fuse || 0;
    const s = 1 + fz * 0.25;
    c.save(); c.scale(s, s);
    c.beginPath(); c.moveTo(-7, -2); c.lineTo(-6, -20); c.lineTo(6, -20); c.lineTo(7, -2); c.closePath();
    c.fillStyle = '#d8cfc0'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.ellipse(0, -38, 15, 22, 0, 0, TAU);
    c.fillStyle = rgrad(c, 0, -40, 20, '#5a5466', '#1b1822'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    // honeycomb pits
    c.fillStyle = 'rgba(10,8,14,0.9)';
    for (const [px, py] of [[-7, -50], [2, -54], [8, -44], [-9, -38], [0, -42], [7, -32], [-5, -28], [3, -24]]) { c.beginPath(); c.ellipse(px, py, 3.2, 2.4, 0.4, 0, TAU); c.fill(); }
    const red = 0.6 + 0.4 * Math.sin(st.t * (4 + fz * 20));
    ell(c, -5, -37, 3.6, 2.6, 'rgba(255,40,30,' + red + ')', false);
    ell(c, 5, -37, 3.6, 2.6, 'rgba(255,40,30,' + red + ')', false);
    c.restore();
    if (st.asleep) zzz(c, 10, -56, st.t || 0);
  };
  P.lilyraft = function (c, st) {
    c.save(); c.translate(0, Math.sin(st.t * 1.5 + (st.seed || 0)) * 1.2);
    c.beginPath(); c.ellipse(0, -6, 32, 11, 0, 0.18, TAU - 0.18); c.lineTo(0, -6); c.closePath();
    c.fillStyle = lgrad(c, 0, -17, 0, 5, '#7fd05a', '#2f7a28'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(20,70,20,0.5)'; c.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(0, -6); c.lineTo(Math.cos(Math.PI + i * 0.45) * 26, -6 + Math.sin(Math.PI + i * 0.45) * 9); c.stroke(); }
    if (!st.carrying) { eyes(c, -8, -10, 2.8, st, { gap: 4, look: 0.3 }); }
    c.restore();
  };
  P.gourdslam = function (c, st) {
    // heavy purple-topped turnip
    c.save();
    ell(c, 0, -2, 22, 5, 'rgba(0,0,0,0.15)', false);
    const sq = st.squish || 0;
    c.scale(1 + sq * 0.3, 1 - sq * 0.3);
    for (const a of [-0.5, -0.15, 0.2, 0.55]) leaf(c, 0, -48, 24, 7, -Math.PI / 2 + a, '#4f9a2c');
    c.beginPath(); c.moveTo(0, -50); c.bezierCurveTo(30, -48, 30, -12, 4, -4); c.lineTo(2, 4); c.lineTo(-2, -4); c.bezierCurveTo(-30, -12, -30, -48, 0, -50); c.closePath();
    c.fillStyle = lgrad(c, 0, -50, 0, -4, '#a85ac8', '#f4eef4'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(120,80,120,0.35)'; c.lineWidth = 1.2;
    for (const yy of [-38, -28, -18]) { c.beginPath(); c.moveTo(-16, yy); c.quadraticCurveTo(0, yy + 3, 16, yy); c.stroke(); }
    eyes(c, 0, -32, 4.5, st, { gap: 7, angry: true, look: st.look || 0.4 });
    mouth(c, 0, -18, 10, 'frown');
    c.restore();
  };
  P.tangleweed = function (c, st) {
    c.save();
    const g = st.grab || 0;
    for (let i = 0; i < 5; i++) {
      const x0 = -14 + i * 7, wv = Math.sin(st.t * 2.5 + i * 1.3) * 5;
      c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo(x0 + wv, -16 - g * 10, x0 - wv * 0.5, -28 - g * 18 + (i % 2) * 6);
      c.lineWidth = 7; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 4.5; c.strokeStyle = i % 2 ? '#2f8a4a' : '#3da35a'; c.stroke();
    }
    eyes(c, 0, -14, 3, st, { gap: 5, look: 0.6, angry: true });
    c.restore();
  };
  P.firepepper = function (c, st) {
    const fz = st.fuse || 0;
    const sh = fz > 0 ? (Math.random() - 0.5) * 4 * fz : 0;
    const s = 1 + fz * 0.3;
    c.save(); c.translate(sh, 0); c.scale(s, s);
    c.beginPath(); c.moveTo(-4, -52); c.quadraticCurveTo(-18, -38, -10, -20); c.quadraticCurveTo(-4, -6, 6, -2);
    c.quadraticCurveTo(2, -16, 8, -30); c.quadraticCurveTo(12, -44, 6, -52); c.closePath();
    c.fillStyle = lgrad(c, -14, 0, 12, 0, fz > 0.4 ? '#ff6a2a' : '#ff4a3a', '#a01010'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    ell(c, -7, -38, 2.5, 6, 'rgba(255,255,255,0.4)', false);
    c.beginPath(); c.moveTo(-6, -52); c.quadraticCurveTo(0, -58, 6, -52); c.quadraticCurveTo(4, -60, 0, -64); c.fillStyle = '#3f8a2a'; c.fill(); c.stroke();
    eyes(c, -2, -36, 3.2, st, { gap: 4.5, angry: true, look: 0 });
    mouth(c, -1, -26, 6, fz > 0 ? 'o' : 'frown');
    c.restore();
  };
  P.thornmat = function (c, st, stone) {
    c.save();
    ell(c, 0, -4, 34, 9, stone ? '#6e6a62' : '#5a4a22', OL, 2);
    const lift = st.poke || 0;
    for (let i = 0; i < 9; i++) {
      const x = -28 + i * 7, h = (i % 2 ? 9 : 12) + lift * 6;
      c.beginPath(); c.moveTo(x - 3, -4); c.lineTo(x, -4 - h); c.lineTo(x + 3, -4); c.closePath();
      c.fillStyle = stone ? '#b8b2a6' : '#c9d36a'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = OL; c.stroke();
    }
    if (!stone) for (let i = 0; i < 5; i++) leaf(c, -24 + i * 12, -6, 9, 3, -0.4 - (i % 2) * 2.3, '#4f8a2a');
    c.restore();
  };
  P.stonethorns = (c, st) => P.thornmat(c, st, true);
  P.brazier = function (c, st) {
    // flames
    const t = st.t || 0;
    for (let i = 0; i < 3; i++) {
      const fx = -8 + i * 8, fh = 22 + Math.sin(t * 9 + i * 2) * 5;
      c.beginPath(); c.moveTo(fx - 8, -48); c.quadraticCurveTo(fx - 6, -48 - fh * 0.6, fx + Math.sin(t * 6 + i) * 3, -48 - fh);
      c.quadraticCurveTo(fx + 6, -48 - fh * 0.6, fx + 8, -48); c.closePath();
      c.fillStyle = i === 1 ? '#ffd23b' : '#ff7a1a'; c.fill();
    }
    ell(c, 0, -52, 10, 8, 'rgba(255,240,180,0.9)', false);
    // stone husk bowl
    c.beginPath(); c.moveTo(-22, -50); c.quadraticCurveTo(-26, -10, -10, -2); c.lineTo(10, -2); c.quadraticCurveTo(26, -10, 22, -50);
    c.quadraticCurveTo(0, -42, -22, -50); c.closePath();
    c.fillStyle = lgrad(c, -22, 0, 22, 0, '#a59a8a', '#4e463c'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(30,20,10,0.4)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-15, -40); c.lineTo(-12, -14); c.moveTo(15, -40); c.lineTo(12, -14); c.stroke();
    ell(c, 0, -50, 22, 5, '#2a1a0a', OL, 2);
    eyes(c, 0, -28, 3.8, st, { gap: 6, look: 0.4 });
    c.fillStyle = 'rgba(255,160,40,0.25)'; c.beginPath(); c.arc(0, -28, 10, 0, TAU); c.fill();
  };
  P.lanternlily = function (c, st) {
    const t = st.t || 0;
    ell(c, 18, -58, 30, 30, 'rgba(255,240,150,' + (0.18 + 0.06 * Math.sin(t * 2)) + ')', false);
    baseLeaves(c, '#4f9a2c');
    c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(-6, -50, 12, -70); c.quadraticCurveTo(22, -74, 20, -64);
    c.lineWidth = 7; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#4c9a2a'; c.stroke();
    // lily petals hood
    c.beginPath(); c.moveTo(10, -64); c.quadraticCurveTo(20, -76, 30, -64); c.quadraticCurveTo(20, -66, 10, -64);
    c.fillStyle = '#f2f7ea'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = OL; c.stroke();
    ell(c, 20, -56, 9, 11, rgrad(c, 20, -56, 11, '#fffbd0', '#ffcf3a'), OL, 1.8);
    ell(c, 0, -26, 9, 9, rgrad(c, 0, -26, 9, '#9be06a', '#3f8a2a'), OL, 1.6);
    eyes(c, 0, -27, 2.6, st, { gap: 3.6, look: 0.4 });
  };
  P.gustfan = function (c, st) {
    const sp = st.spin || 0;
    stem(c, 0, -2, 0, -40, 3, '#4c9a2a', 5);
    baseLeaves(c);
    c.save(); c.translate(0, -46); c.rotate(Math.sin(st.t * 1.2) * 0.1 + sp * 12);
    for (let i = 0; i < 7; i++) {
      c.save(); c.rotate(-Math.PI / 2 + (i - 3) * 0.32 + (sp > 0 ? i * 0.9 : 0));
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -6, 30, 0); c.quadraticCurveTo(10, 6, 0, 0);
      c.fillStyle = i % 2 ? '#6cc23e' : '#58ad33'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = OL; c.stroke(); c.restore();
    }
    c.restore();
    ell(c, 0, -46, 8, 8, '#8fd35a', OL, 2);
    eyes(c, 0, -47, 2.4, st, { gap: 3.2 });
  };
  P.huskguardBack = function (c, st) {
    c.beginPath(); c.ellipse(0, -30, 34, 32, 0, Math.PI, TAU);
    c.fillStyle = '#8a5a1f'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
  };
  P.huskguardFront = function (c, st) {
    const hpf = st.hpf === undefined ? 1 : st.hpf;
    c.beginPath(); c.moveTo(-34, -30); c.quadraticCurveTo(-36, 2, 0, 2); c.quadraticCurveTo(36, 2, 34, -30);
    c.quadraticCurveTo(20, -14, 0, -14); c.quadraticCurveTo(-20, -14, -34, -30); c.closePath();
    c.fillStyle = lgrad(c, 0, -30, 0, 2, '#d9a14a', '#7a4a14'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(60,30,5,0.5)'; c.lineWidth = 1.5;
    for (const lx of [-20, -7, 7, 20]) { c.beginPath(); c.moveTo(lx, -16); c.quadraticCurveTo(lx * 1.1, -6, lx * 0.9, 0); c.stroke(); }
    if (hpf < 0.5) { c.strokeStyle = '#2b1606'; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, -16); c.lineTo(-12, -6); c.lineTo(-16, 0); c.stroke(); }
  };
  P.huskguard = function (c, st) { P.huskguardBack(c, st); P.huskguardFront(c, st); eyes(c, 0, -8, 3, st, { gap: 8 }); };
  P.lodecap = function (c, st) {
    const cy = shroom(c, st, { sw: 7, sh: 18, cw: 18, ch: 15, cap: '#9aa3ad', capDark: '#3f4752', spots: [], ey: 0.5 });
    // coils
    c.strokeStyle = st.used ? '#555' : '#d84a3a'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, cy - 8, 12, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.strokeStyle = '#e8eef5'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, cy - 8, 7, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    if (st.pull > 0) { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, cy - 8, 16 + i * 6 + (st.t * 30 % 6), Math.PI * 1.2, Math.PI * 1.8); c.strokeStyle = 'rgba(120,200,255,0.5)'; c.lineWidth = 1.5; c.stroke(); } }
  };
  function lobArm(c, st, o) {
    const f = st.fire === undefined ? 9 : st.fire;
    const swing = f < 0.35 ? Math.sin((f / 0.35) * Math.PI) : 0;
    c.save(); c.translate(-4, -30); c.rotate(-0.5 - swing * 1.4);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-14, -4, -28, -2);
    c.lineWidth = 7; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 4.5; c.strokeStyle = o.arm; c.stroke();
    ell(c, -30, -5, 8, 5, o.cup, OL, 1.8);
    if (f > 0.4 || st.loaded) o.ammo(c, -30, -11);
    c.restore();
  }
  P.pinelobber = function (c, st) {
    baseLeaves(c, '#3f7a2c');
    stem(c, 0, -2, -2, -30, -3, '#5a4022', 6);
    lobArm(c, st, { arm: '#6b4a24', cup: '#3f7a2c', ammo: (c, x, y) => A.pinecone(c, x, y, 1) });
    // needle tufts body
    for (const [tx, ty] of [[-6, -34], [6, -38], [0, -46]]) {
      c.fillStyle = '#2f6a2a'; c.strokeStyle = OL; c.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 10); c.lineWidth = 3; c.strokeStyle = '#2f6a2a'; c.stroke(); }
    }
    ell(c, 4, -38, 11, 10, rgrad(c, 4, -38, 11, '#5aa04a', '#24561e'));
    eyes(c, 5, -39, 3, st, { gap: 4.2, look: 0.5 });
  };
  P.acornlobber = function (c, st) {
    baseLeaves(c, '#4f8a2c');
    stem(c, 0, -2, 0, -28, 2, '#7a5530', 6);
    lobArm(c, st, { arm: '#7a5530', cup: '#5aa03a', ammo: (c, x, y) => (st.sapNext ? A.sapglob(c, x, y, 1) : A.acorn(c, x, y, 1)) });
    // oak leaf head
    for (const a of [-0.9, -0.3, 0.3, 0.9]) leaf(c, 2, -38, 18, 7, -Math.PI / 2 + a, '#6aaa3a');
    ell(c, 2, -36, 11, 10, rgrad(c, 2, -36, 11, '#c08a4a', '#6a4018'));
    ell(c, 2, -44, 11, 5, '#5a3a1a', OL, 1.6);
    eyes(c, 3, -36, 3, st, { gap: 4.2, look: 0.5 });
  };
  P.durianlobber = function (c, st, icy) {
    baseLeaves(c, icy ? '#4f8aa0' : '#4f8a2c');
    stem(c, 0, -2, 0, -24, 2, icy ? '#4a7a8a' : '#4c7a2a', 7);
    lobArm(c, st, { arm: icy ? '#4a7a8a' : '#4c7a2a', cup: icy ? '#7ab8d0' : '#6aaa3a', ammo: (c, x, y) => A.durian(c, x, y, 0.9, icy) });
    ell(c, 2, -34, 16, 13, rgrad(c, 2, -34, 16, icy ? '#b8eaff' : '#9fd36a', icy ? '#3f7fa8' : '#3f7a1c'));
    c.strokeStyle = 'rgba(20,50,10,0.5)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-10, -40); c.lineTo(14, -40); c.moveTo(-12, -32); c.lineTo(16, -32); c.stroke();
    eyes(c, 4, -36, 3.6, st, { gap: 5, look: 0.5, angry: true });
  };
  P.frostdurian = (c, st) => P.durianlobber(c, st, true);
  P.claypot = function (c, st) {
    c.beginPath(); c.moveTo(-22, -26); c.lineTo(22, -26); c.lineTo(16, 0); c.lineTo(-16, 0); c.closePath();
    c.fillStyle = lgrad(c, -22, 0, 22, 0, '#d9804a', '#8a3f1a'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.rect(-25, -32, 50, 8); c.fillStyle = '#c96a3a'; c.fill(); c.stroke();
    ell(c, 0, -32, 23, 3, '#5a3010', false);
    if (!st.carrying) eyes(c, 0, -15, 2.8, st, { gap: 5, look: 0.2 });
  };
  P.wakebean = function (c, st) {
    // a red berry split open to show a wide-awake eye
    const j = Math.sin((st.t || 0) * 40) * 1.5;
    c.save(); c.translate(j, 0);
    leaf(c, 0, -26, 10, 4, -1.9, '#4f9a2c');
    ell(c, 0, -14, 13, 13, rgrad(c, 0, -14, 13, '#ff7a6a', '#a8201a'));
    ell(c, 0, -14, 8, 6.5, '#fff8f0', OL, 1.4);
    ell(c, 0, -14, 4, 4, '#1a1a12', false);
    ell(c, 1.5, -15.5, 1.3, 1.3, '#fff', false);
    c.restore();
  };
  P.stinkonion = function (c, st) {
    const hpf = st.hpf === undefined ? 1 : st.hpf;
    for (const a of [-0.25, 0, 0.25]) leaf(c, 0, -40, 22, 4, -Math.PI / 2 + a, '#5aa03a');
    c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(26, -36, 20, -14); c.quadraticCurveTo(12, 0, 0, 0); c.quadraticCurveTo(-12, 0, -20, -14); c.quadraticCurveTo(-26, -36, 0, -46);
    c.fillStyle = rgrad(c, 0, -22, 22, '#e0b3e8', '#8a3f9a'); c.fill(); c.lineWidth = 2.2; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(80,20,90,0.5)'; c.lineWidth = 1.2;
    for (const lx of [-9, 0, 9]) { c.beginPath(); c.moveTo(lx * 0.4, -44); c.quadraticCurveTo(lx * 1.6, -22, lx * 0.6, -2); c.stroke(); }
    if (hpf < 0.6) { c.fillStyle = '#f3e1f5'; c.beginPath(); c.arc(10, -26, 6, 0, TAU); c.fill(); }
    eyes(c, 0, -22, 3.4, st, { gap: 5, sleep: hpf < 0.4, look: 0.3 });
    // stink lines
    c.strokeStyle = 'rgba(160,200,80,0.6)'; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const k = (st.t * 0.5 + i / 3) % 1; c.beginPath(); c.moveTo(-18 + i * 18, -50 - k * 18); c.quadraticCurveTo(-14 + i * 18, -56 - k * 18, -18 + i * 18, -62 - k * 18); c.globalAlpha = 1 - k; c.stroke(); c.globalAlpha = 1; }
  };
  P.canopyfern = function (c, st) {
    const open = st.open || 0;
    stem(c, 0, -2, 0, -46, 2, '#3f8a2a', 4);
    baseLeaves(c, '#3f8a2a');
    c.save(); c.translate(0, -48);
    const n = 9, spread = 0.9 + open * 0.6;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) / ((n - 1) / 2) * spread;
      leaf(c, 0, 0, 30 + open * 10, 7, a, i % 2 ? '#5ab83a' : '#4aa32e');
    }
    c.restore();
    eyes(c, 0, -26, 2.8, st, { gap: 4 });
  };
  P.pennypoppy = function (c, st) {
    baseLeaves(c);
    stem(c, 0, -2, 2, -40, 4, '#4c9a2a', 4);
    c.save(); c.translate(2, -46); c.rotate(Math.sin(st.t * 1.3) * 0.08);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(c, Math.cos(a) * 11, Math.sin(a) * 11, 10, 8, '#ff7a3a', OL, 1.6); }
    ell(c, 0, 0, 9, 9, rgrad(c, 0, 0, 9, '#fff0a0', '#c9902a'), OL, 1.8);
    SS.ui.text(c, '¢', 0, 1, { size: 11, color: '#7a5010' });
    c.restore();
    eyes(c, 2, -28, 2.4, st, { gap: 3.6 });
  };
  P.goldlode = function (c, st) {
    baseLeaves(c);
    stem(c, 0, -2, 0, -36, 3, '#4c9a2a', 4);
    c.save(); c.translate(0, -48);
    c.beginPath(); c.arc(0, 0, 16, Math.PI * 0.95, Math.PI * 2.05); c.lineWidth = 12; c.strokeStyle = OL; c.stroke();
    c.lineWidth = 8; c.strokeStyle = '#f2c23a'; c.stroke();
    c.fillStyle = '#e8eef5'; c.fillRect(-21, -2, 10, 8); c.fillRect(11, -2, 10, 8);
    c.strokeStyle = OL; c.lineWidth = 1.5; c.strokeRect(-21, -2, 10, 8); c.strokeRect(11, -2, 10, 8);
    if (st.pull > 0) { c.strokeStyle = 'rgba(255,230,120,0.6)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, 22 + i * 6, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); } }
    c.restore();
    eyes(c, 0, -46, 2.6, st, { gap: 4 });
  };
  P.reedspiker = function (c, st) {
    P.lilyraft(c, Object.assign({}, st, { carrying: true }));
    for (const [x, h, b] of [[-12, 46, -3], [-4, 56, 0], [6, 50, 3], [13, 40, 4]]) {
      stem(c, x, -8, x + b, -h, b, '#5a8a3a', 3);
      ell(c, x + b, -h - 6, 4.5, 10, '#7a4a20', OL, 1.6);
    }
    ell(c, 0, -26, 10, 9, rgrad(c, 0, -26, 10, '#a6d36a', '#4a7a2a'), OL, 1.6);
    eyes(c, 0, -27, 2.8, st, { gap: 4, look: 0.3 });
  };
  P.oakmortar = function (c, st) {
    // spans two tiles: origin at center of left tile; draw centered between
    c.save(); c.translate(40, 0);
    for (const ax of [-34, 34]) { ell(c, ax, -10, 16, 12, rgrad(c, ax, -10, 14, '#c08a4a', '#6a4018')); ell(c, ax, -18, 15, 6, '#5a3a1a', OL, 1.6); }
    const k = st.ready ? 1 : 0;
    c.save(); c.translate(0, -26); c.rotate(-0.25);
    SS.ui.rrect(c, -40, -14, 80, 28, 12);
    c.fillStyle = lgrad(c, 0, -14, 0, 14, '#9a6a3c', '#4e2f14'); c.fill(); c.lineWidth = 2.4; c.strokeStyle = OL; c.stroke();
    ell(c, 40, 0, 6, 14, '#3a2008', OL, 2);
    c.strokeStyle = 'rgba(40,20,5,0.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-30, -6); c.lineTo(30, -6); c.moveTo(-30, 6); c.lineTo(28, 6); c.stroke();
    if (k) A.acorn(c, 46, -2, 1.8);
    c.restore();
    eyes(c, -10, -28, 3.6, st, { gap: 6, look: 0.5, sleep: !st.ready });
    c.restore();
  };
  P.mimicseed = function (c, st) {
    ell(c, 0, -14, 13, 15, rgrad(c, 0, -14, 15, '#e8e2d0', '#8a8472'));
    // mask
    c.beginPath(); c.moveTo(-14, -20); c.quadraticCurveTo(0, -14, 14, -20); c.lineTo(12, -12); c.quadraticCurveTo(0, -8, -12, -12); c.closePath();
    c.fillStyle = '#2a2a3a'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OL; c.stroke();
    ell(c, -6, -15, 2.6, 2, '#fff', false); ell(c, 6, -15, 2.6, 2, '#fff', false);
    leaf(c, 0, -28, 10, 4, -1.4, '#5cae33');
  };

  // draw a plant by id; s scale; mimic -> gray copy
  A.plant = function (c, id, x, y, s, st) {
    const fn = P[id];
    if (!fn) return;
    c.save();
    c.translate(x, y);
    c.scale(s || 1, s || 1);
    if (st && st.mimic) c.filter = 'grayscale(1) brightness(1.08)';
    if (st && st.flash > 0) { c.filter = (st.mimic ? 'grayscale(1) ' : '') + 'brightness(1.6)'; }
    fn(c, st || { t: 0 });
    c.restore();
  };
  // cached icons for packets & menus
  const iconCache = {};
  A.icon = function (id, size) {
    const k = id + '@' + size;
    if (iconCache[k]) return iconCache[k];
    const cv = document.createElement('canvas');
    const q = 2;
    cv.width = size * q; cv.height = size * q;
    const c = cv.getContext('2d');
    c.scale(q, q);
    const wide = SS.PLANTS[id] && SS.PLANTS[id].wide;
    const s = size / (wide ? 150 : 80);
    A.plant(c, id, size / 2 - (wide ? 40 * s : 0), size * 0.92, s, { t: 0.7, seed: 1, armed: true, grown: true, ready: true });
    iconCache[k] = cv;
    return cv;
  };

  // ---------- projectiles & pickups ----------
  A.seed = function (c, x, y, kind) {
    if (kind === 'frost') { ell(c, x, y, 7, 7, rgrad(c, x, y, 7, '#e8fbff', '#4aa0d8'), '#1f4a6a', 1.5); c.fillStyle = 'rgba(200,240,255,0.5)'; c.beginPath(); c.arc(x - 6, y, 4, 0, TAU); c.fill(); return; }
    if (kind === 'fire') {
      c.fillStyle = 'rgba(255,140,30,0.55)'; c.beginPath(); c.moveTo(x - 22, y); c.quadraticCurveTo(x - 8, y - 10, x, y - 8); c.lineTo(x, y + 8); c.quadraticCurveTo(x - 8, y + 10, x - 22, y); c.fill();
      ell(c, x, y, 8, 8, rgrad(c, x, y, 8, '#fff2a0', '#ff6a10'), '#7a2a00', 1.5); return;
    }
    if (kind === 'spore') { ell(c, x, y, 5, 5, rgrad(c, x, y, 5, '#f0d0ff', '#9a52c8'), false); return; }
    if (kind === 'needle') { c.save(); c.translate(x, y); c.fillStyle = '#e8f0c0'; c.strokeStyle = '#4a5a20'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(10, 0); c.lineTo(-8, -2.5); c.lineTo(-8, 2.5); c.closePath(); c.fill(); c.stroke(); c.restore(); return; }
    if (kind === 'star') { c.save(); c.translate(x, y); c.rotate(SS.time * 8); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? 3.5 : 8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffe14d'; c.fill(); c.strokeStyle = '#8a6a00'; c.lineWidth = 1.2; c.stroke(); c.restore(); return; }
    if (kind === 'reed') { c.save(); c.translate(x, y); c.fillStyle = '#7a4a20'; c.strokeStyle = OL; c.lineWidth = 1.2; c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -3); c.lineTo(-6, 3); c.closePath(); c.fill(); c.stroke(); c.restore(); return; }
    ell(c, x, y, 7, 7, rgrad(c, x, y, 7, '#d8ff9a', '#4f9a22'), '#1f3a08', 1.5);
  };
  A.pinecone = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 0, 7, 9, '#8a5a2a', OL, 1.4);
    c.strokeStyle = '#4a2a0a'; c.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-6, i * 3); c.lineTo(0, i * 3 + 2); c.lineTo(6, i * 3); c.stroke(); }
    c.restore();
  };
  A.acorn = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 2, 6, 7, rgrad(c, 0, 2, 7, '#e0a25a', '#8a5a20'), OL, 1.3);
    c.beginPath(); c.ellipse(0, -3, 7, 4, 0, Math.PI, TAU); c.closePath(); c.fillStyle = '#6a4418'; c.fill(); c.stroke();
    c.restore();
  };
  A.sapglob = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 0, 8, 7, rgrad(c, 0, 0, 8, '#ffe9a0', '#e0a020'), '#7a5000', 1.3);
    ell(c, -2, -2, 2.5, 2, 'rgba(255,255,255,0.7)', false);
    c.restore();
  };
  A.durian = function (c, x, y, s, icy) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 0, 11, 10, rgrad(c, 0, 0, 11, icy ? '#e0f8ff' : '#c8d86a', icy ? '#4a90c0' : '#6a8a22'), OL, 1.5);
    c.fillStyle = icy ? '#f0fcff' : '#a8b84a'; c.strokeStyle = OL; c.lineWidth = 1;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 9, Math.sin(a) * 8); c.lineTo(Math.cos(a + 0.15) * 14, Math.sin(a + 0.15) * 13); c.lineTo(Math.cos(a + 0.3) * 9, Math.sin(a + 0.3) * 8); c.fill(); c.stroke(); }
    c.restore();
  };
  A.sun = function (c, x, y, val, t) {
    const r = val >= 25 ? 22 : 15;
    c.save(); c.translate(x, y); c.rotate(t * 0.8);
    c.fillStyle = 'rgba(255,230,90,0.35)';
    c.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 1.0 : r * 1.45; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fill();
    c.restore();
    ell(c, x, y, r * 0.75, r * 0.75, rgrad(c, x, y, r * 0.75, '#fffbd8', '#ffc21a'), 'rgba(200,120,0,0.6)', 1.5);
    ell(c, x, y, r * 0.35, r * 0.35, 'rgba(255,255,240,0.85)', false);
  };
  A.coin = function (c, x, y, kind, t) {
    const sq = Math.abs(Math.cos(t * 4));
    if (kind === 'diamond') {
      c.save(); c.translate(x, y); c.scale(0.4 + sq * 0.6, 1);
      c.beginPath(); c.moveTo(0, -14); c.lineTo(12, -4); c.lineTo(0, 14); c.lineTo(-12, -4); c.closePath();
      c.fillStyle = lgrad(c, 0, -14, 0, 14, '#e8fdff', '#4ac0e8'); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#1a5a7a'; c.stroke();
      c.restore(); return;
    }
    const gold = kind === 'gold';
    c.save(); c.translate(x, y); c.scale(0.25 + sq * 0.75, 1);
    ell(c, 0, 0, 12, 12, rgrad(c, 0, 0, 12, gold ? '#fff2a0' : '#ffffff', gold ? '#d49a10' : '#9aa0aa'), gold ? '#7a5000' : '#4a505a', 1.6);
    ell(c, 0, 0, 7, 7, false, gold ? 'rgba(122,80,0,0.6)' : 'rgba(60,64,72,0.5)', 1.2);
    c.restore();
  };
  A.sprout = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
    c.beginPath(); c.moveTo(-14, -12); c.lineTo(14, -12); c.lineTo(10, 4); c.lineTo(-10, 4); c.closePath();
    c.fillStyle = '#c96a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    stem(c, 0, -12, 0, -26, 1, '#4c9a2a', 3);
    leaf(c, 0, -24, 12, 5, -2.6, '#5cae33'); leaf(c, 0, -24, 12, 5, -0.5, '#5cae33');
    c.restore();
  };
  A.moneybag = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
    c.beginPath(); c.moveTo(-8, -22); c.quadraticCurveTo(-24, 0, -16, 14); c.quadraticCurveTo(0, 20, 16, 14); c.quadraticCurveTo(24, 0, 8, -22); c.closePath();
    c.fillStyle = rgrad(c, 0, 0, 20, '#e8c88a', '#9a6a2a'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-10, -22); c.lineTo(10, -22); c.lineWidth = 4; c.strokeStyle = '#6a3a10'; c.stroke();
    SS.ui.text(c, '$', 0, 2, { size: 18, color: '#5a3a08' });
    c.restore();
  };
  A.trophy = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s || 1, s || 1);
    c.beginPath(); c.moveTo(-18, -30); c.lineTo(18, -30); c.quadraticCurveTo(18, -4, 0, -2); c.quadraticCurveTo(-18, -4, -18, -30);
    c.fillStyle = lgrad(c, -18, 0, 18, 0, '#fff2a0', '#c9900a'); c.fill(); c.lineWidth = 2; c.strokeStyle = '#6a4800'; c.stroke();
    c.beginPath(); c.arc(-18, -22, 7, Math.PI * 0.5, Math.PI * 1.5); c.moveTo(18, -29); c.arc(18, -22, 7, -Math.PI * 0.5, Math.PI * 0.5); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#c9900a'; c.fillRect(-4, -2, 8, 10); c.fillRect(-12, 8, 24, 6); c.strokeRect(-12, 8, 24, 6);
    c.restore();
  };
  A.packet = function (c, x, y, w, h, id, o = {}) {
    // seed packet card
    c.save();
    SS.ui.rrect(c, x, y, w, h, 6);
    c.fillStyle = o.mimic ? lgrad(c, 0, y, 0, y + h, '#e8e8e0', '#a8a8a0') : lgrad(c, 0, y, 0, y + h, '#f6edc8', '#d6c08a');
    c.fill();
    c.lineWidth = 2; c.strokeStyle = o.sel ? '#ffef5a' : '#6b4a1e'; c.stroke();
    SS.ui.rrect(c, x + 4, y + 4, w - 8, h - 22, 4);
    c.fillStyle = o.mimic ? '#9aa09a' : '#9ccf6a'; c.fill();
    const ic = A.icon(id, Math.min(w - 8, h - 22) + 8);
    c.save(); SS.ui.rrect(c, x + 4, y + 4, w - 8, h - 22, 4); c.clip();
    if (o.mimic) c.filter = 'grayscale(1)';
    c.drawImage(ic, x + w / 2 - (ic.width / 4), y + 2, ic.width / 2, ic.height / 2);
    c.restore();
    if (o.cost !== undefined && o.cost !== null) SS.ui.text(c, String(o.cost), x + w / 2, y + h - 9, { size: 13, color: '#2a1a08', bold: true });
    if (o.dark) { SS.ui.rrect(c, x, y, w, h, 6); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fill(); }
    if (o.cdf > 0) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x, y, w, h * o.cdf); }
    if (o.sel) { SS.ui.rrect(c, x - 1, y - 1, w + 2, h + 2, 7); c.lineWidth = 3; c.strokeStyle = '#fff36a'; c.stroke(); }
    c.restore();
  };
})();
