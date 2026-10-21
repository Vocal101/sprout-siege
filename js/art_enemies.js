// Sprout Siege — Rotter art: burlap-sack scarecrow ghouls (original designs)
(function () {
  const SS = window.SS;
  const A = SS.art;
  const OL = '#2a1a0c';
  const TAU = Math.PI * 2;
  const ell = A.ell, lgrad = A.lgrad, rgrad = A.rgrad;

  function limb(c, x0, y0, x1, y1, w, col) {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.lineCap = 'round'; c.lineWidth = w + 3; c.strokeStyle = OL; c.stroke();
    c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
  function straw(c, x, y, n, len, ang) {
    c.strokeStyle = '#e8c860'; c.lineWidth = 1.6;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - n / 2) * 0.28;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
    }
  }
  // head: sack with stitched mouth & button eyes
  function head(c, e, hx, hy, s, o = {}) {
    const eat = e.state === 'eat' ? Math.abs(Math.sin(e.anim * 9)) : 0;
    c.save(); c.translate(hx, hy); c.scale(s, s);
    straw(c, 2, -15, 6, 10, -Math.PI / 2);
    c.beginPath(); c.moveTo(-14, 10); c.quadraticCurveTo(-19, -14, -2, -18); c.quadraticCurveTo(16, -18, 15, 0); c.quadraticCurveTo(14, 14, 0, 15); c.quadraticCurveTo(-10, 15, -14, 10);
    c.fillStyle = rgrad(c, -2, -2, 18, o.skin || '#d6b47a', o.skinDark || '#8f6a3a'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    // weave
    c.strokeStyle = 'rgba(90,60,25,0.35)'; c.lineWidth = 1;
    for (let i = -12; i <= 12; i += 5) { c.beginPath(); c.moveTo(i, -15); c.lineTo(i + 1, 13); c.stroke(); }
    // patch
    if (o.patch !== false) { c.fillStyle = o.patchCol || '#7a8a4a'; c.fillRect(6, -12, 7, 6); c.strokeStyle = OL; c.lineWidth = 1; c.strokeRect(6, -12, 7, 6); }
    // eyes: buttons
    const dead = e.dying > 0 || o.dead;
    if (dead) {
      c.strokeStyle = OL; c.lineWidth = 2;
      for (const ex of [-8, 2]) { c.beginPath(); c.moveTo(ex - 3, -6); c.lineTo(ex + 3, 0); c.moveTo(ex + 3, -6); c.lineTo(ex - 3, 0); c.stroke(); }
    } else {
      const glow = o.eyeGlow;
      ell(c, -8, -3, 4.2, 4.2, glow || '#2a2a2a', OL, 1.2);
      ell(c, 3, -4, 3.4, 3.4, glow || '#3a2a4a', OL, 1.2);
      if (!glow) { c.fillStyle = '#d8d0c0'; c.fillRect(-9.5, -4.5, 1.2, 1.2); c.fillRect(-7, -2.5, 1.2, 1.2); c.fillRect(2, -5, 1, 1); c.fillRect(3.8, -3.6, 1, 1); }
      if (o.angry) { c.strokeStyle = OL; c.lineWidth = 2; c.beginPath(); c.moveTo(-13, -10); c.lineTo(-4, -7); c.moveTo(7, -10); c.lineTo(0, -7); c.stroke(); }
    }
    // mouth
    const mw = 16, my = 7;
    if (eat > 0.05) { ell(c, -3, my, mw / 2, 2 + eat * 5, '#2a0a05', OL, 1.4); }
    c.beginPath(); c.moveTo(-3 - mw / 2, my);
    for (let i = 0; i <= 8; i++) c.lineTo(-3 - mw / 2 + i * (mw / 8), my + (i % 2 ? -2.5 : 2.5) * (1 + eat));
    c.lineWidth = 1.5; c.strokeStyle = OL; c.stroke();
    c.restore();
  }
  // full body
  function body(c, e, o = {}) {
    const s = o.s || 1;
    const walk = e.state === 'walk' || e.state === 'run' ? e.anim : 0;
    const sw = Math.sin(walk * (o.stride || 5));
    const eat = e.state === 'eat';
    const legC = o.legs || '#5a4a3a';
    const hpf = e.hp / e.maxHp;
    c.save(); c.scale(s, s);
    // legs
    if (!o.noLegs) {
      limb(c, 4, -38, 4 + sw * 9, -4, 6, legC);
      limb(c, -4, -38, -4 - sw * 9, -4, 6, legC);
      for (const fx of [4 + sw * 9, -4 - sw * 9]) { ell(c, fx - 4, -3, 8, 4, '#3a2a1a', OL, 1.4); }
    }
    // back arm
    if (!o.noArms && !o.backArmGone) {
      const ba = eat ? Math.sin(e.anim * 9 + 1) * 0.25 : -sw * 0.3;
      const bx = -10 - Math.cos(ba) * 18, by = -60 + Math.sin(ba) * 10;
      limb(c, 4, -64, bx + 6, by, 5, o.sleeve || '#7a6a4a');
      straw(c, bx + 4, by, 4, 6, Math.PI);
    }
    // torso: overalls
    c.beginPath(); c.moveTo(-13, -70); c.quadraticCurveTo(-16, -50, -12, -34); c.lineTo(12, -34); c.quadraticCurveTo(16, -50, 13, -70); c.closePath();
    c.fillStyle = lgrad(c, -13, 0, 13, 0, o.shirt || '#9a8a5a', o.shirtDark || '#5a4a2a'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-11, -56); c.lineTo(11, -56); c.lineTo(12, -34); c.lineTo(-12, -34); c.closePath();
    c.fillStyle = o.overalls || '#4a5a7a'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-9, -56); c.lineTo(-7, -70); c.moveTo(9, -56); c.lineTo(7, -70); c.lineWidth = 3; c.strokeStyle = o.overalls || '#4a5a7a'; c.stroke();
    ell(c, -7, -55, 1.8, 1.8, '#d8c060', false); ell(c, 7, -55, 1.8, 1.8, '#d8c060', false);
    if (o.patches !== false) { c.fillStyle = '#9a4a3a'; c.fillRect(-6, -46, 6, 6); c.strokeStyle = OL; c.lineWidth = 1; c.strokeRect(-6, -46, 6, 6); }
    straw(c, -11, -36, 3, 6, Math.PI * 0.75);
    if (o.torsoExtra) o.torsoExtra(c);
    // front arm (reaching forward / left)
    if (!o.noArms && !o.frontArmOverride) {
      const fa = eat ? Math.sin(e.anim * 9) * 0.35 : sw * 0.25;
      const armGone = hpf < 0.5 && !o.keepArm;
      const fx = -22 - Math.cos(fa) * 8, fy = -62 + Math.sin(fa) * 8;
      if (!armGone) { limb(c, -6, -66, fx, fy, 5, o.sleeve || '#7a6a4a'); straw(c, fx - 2, fy, 4, 7, Math.PI); }
      else { limb(c, -6, -66, -12, -60, 5, o.sleeve || '#7a6a4a'); straw(c, -13, -60, 5, 6, Math.PI * 0.7); }
    }
    if (o.frontArmOverride) o.frontArmOverride(c, sw);
    // head
    const hb = eat ? Math.sin(e.anim * 9) * 2 : Math.sin(walk * 5 + 1) * 1.2;
    c.save(); c.translate(-2, -84 + hb);
    head(c, e, 0, 0, o.headS || 1, o);
    if (o.hat) o.hat(c);
    c.restore();
    if (o.front) o.front(c, sw);
    c.restore();
  }

  // ---------- accessories ----------
  function crateHat(c, f) {
    c.save(); c.translate(0, -16); c.rotate(-0.08);
    c.fillStyle = lgrad(c, -16, 0, 16, 0, '#d8a860', '#9a6a2a'); c.strokeStyle = OL; c.lineWidth = 2;
    c.fillRect(-17, -12, 34, 22); c.strokeRect(-17, -12, 34, 22);
    c.strokeStyle = 'rgba(70,40,10,0.7)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-17, -4); c.lineTo(17, -4); c.moveTo(-17, 3); c.lineTo(17, 3); c.stroke();
    c.fillStyle = '#7a4a1a'; c.fillRect(-5, -10, 10, 4);
    if (f < 0.66) { c.strokeStyle = '#2a1404'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -12); c.lineTo(-5, -2); c.lineTo(-9, 6); c.stroke(); }
    if (f < 0.33) { c.beginPath(); c.moveTo(10, -12); c.lineTo(5, 0); c.lineTo(12, 10); c.stroke(); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(-14, 4, 8, 6); }
    c.restore();
  }
  function kettleHat(c, f) {
    c.save(); c.translate(0, -14);
    c.beginPath(); c.moveTo(-16, 6); c.quadraticCurveTo(-18, -16, 0, -18); c.quadraticCurveTo(18, -16, 16, 6); c.closePath();
    c.fillStyle = lgrad(c, -16, 0, 16, 0, '#c8ccd2', '#5a6068'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    // spout
    c.beginPath(); c.moveTo(-14, -2); c.lineTo(-26, -12); c.lineTo(-24, -15); c.lineTo(-12, -8); c.closePath(); c.fillStyle = '#8a9098'; c.fill(); c.stroke();
    c.beginPath(); c.arc(4, -20, 8, Math.PI, TAU); c.lineWidth = 2.5; c.stroke();
    ell(c, 0, 6, 17, 3, '#3a4048', OL, 1.5);
    if (f < 0.66) { c.fillStyle = 'rgba(40,40,45,0.7)'; ell(c, 7, -6, 4, 3, 'rgba(40,40,45,0.7)', false); }
    if (f < 0.33) { ell(c, -6, -10, 5, 3, 'rgba(40,40,45,0.7)', false); c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(8, -14); c.lineTo(12, -2); c.stroke(); }
    c.restore();
  }
  function bruteHelm(c, f) {
    c.save(); c.translate(0, -6);
    c.beginPath(); c.moveTo(-18, 12); c.quadraticCurveTo(-21, -20, 0, -22); c.quadraticCurveTo(21, -20, 18, 12); c.lineTo(10, 12); c.lineTo(10, 0); c.lineTo(-12, 0); c.lineTo(-12, 12); c.closePath();
    c.fillStyle = lgrad(c, -18, 0, 18, 0, '#b0784a', '#5a3a20'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    for (const [bx, by] of [[-14, -6], [14, -6], [0, -18], [-8, -14], [8, -14]]) ell(c, bx, by, 1.8, 1.8, '#d8d0b8', OL, 0.8);
    c.fillStyle = '#7a8a90'; c.fillRect(-12, -2, 22, 3);
    if (f < 0.5) { c.strokeStyle = '#1a0a00'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -22); c.lineTo(-2, -10); c.lineTo(-8, -4); c.stroke(); }
    c.restore();
  }
  function minerHat(c, f) {
    c.save(); c.translate(0, -12);
    c.beginPath(); c.moveTo(-17, 4); c.quadraticCurveTo(-17, -16, 0, -16); c.quadraticCurveTo(17, -16, 17, 4); c.closePath();
    c.fillStyle = lgrad(c, 0, -16, 0, 4, '#ffd24a', '#c98a10'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.fillStyle = '#c98a10'; c.fillRect(-21, 2, 42, 4); c.strokeRect(-21, 2, 42, 4);
    ell(c, -12, -6, 5, 5, '#fffbe0', OL, 1.5);
    c.restore();
  }
  function beanie(c, col) {
    c.save(); c.translate(0, -12);
    c.beginPath(); c.moveTo(-16, 2); c.quadraticCurveTo(-16, -16, 0, -16); c.quadraticCurveTo(16, -16, 16, 2); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    ell(c, 0, -17, 5, 5, '#fff', OL, 1.4);
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-16, -2, 32, 4);
    c.restore();
  }

  const D = (A.E = {});
  D.rotter = (c, e) => body(c, e, {});
  D.minion = (c, e) => body(c, e, { s: 0.85, shirt: '#7a9a5a', shirtDark: '#3a5a2a', overalls: '#5a3a5a', hat: (c) => { A.leaf(c, 2, -16, 12, 5, -1.9, '#5cae33'); A.leaf(c, 2, -16, 10, 4, -1.0, '#5cae33'); } });
  D.sledder = (c, e) => body(c, e, { shirt: '#c84a4a', shirtDark: '#7a2020', overalls: '#3a4a6a', hat: (c) => beanie(c, '#3a7ac8') });
  D.imp = (c, e) => body(c, e, { s: 0.68, shirt: '#c8a040', shirtDark: '#7a5a10', overalls: '#7a2a2a', stride: 7, angry: true });
  D.banner = (c, e) => body(c, e, {
    shirt: '#a87a4a', overalls: '#6a3a2a',
    front: (c, sw) => {
      c.beginPath(); c.moveTo(-26, -40); c.lineTo(-26, -122); c.lineWidth = 4; c.strokeStyle = '#5a3a1a'; c.stroke();
      const wv = Math.sin(e.anim * 6) * 4;
      c.beginPath(); c.moveTo(-26, -120); c.lineTo(-58, -116 + wv); c.lineTo(-52, -104 + wv * 0.5); c.lineTo(-60, -92 + wv); c.lineTo(-26, -96); c.closePath();
      c.fillStyle = '#6a8a3a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
      ell(c, -40, -107 + wv * 0.6, 6, 6, '#a83a2a', OL, 1.2);
      c.beginPath(); c.moveTo(-40, -113 + wv * 0.6); c.lineTo(-38, -117 + wv * 0.6); c.lineWidth = 1.5; c.stroke();
    },
    frontArmOverride: (c) => { limb(c, -6, -66, -24, -64, 5, '#7a6a4a'); },
  });
  D.crate = (c, e) => body(c, e, { hat: (c) => e.helm && crateHat(c, e.helm.hp / e.helm.max) });
  D.kettle = (c, e) => body(c, e, { shirt: '#7a7a6a', hat: (c) => e.helm && kettleHat(c, e.helm.hp / e.helm.max) });
  D.vaulter = (c, e) => body(c, e, {
    shirt: '#e8e0d0', shirtDark: '#a8a090', overalls: '#c83a3a', stride: e.hasPole ? 9 : 5,
    torsoExtra: (c) => { c.fillStyle = '#3a6ac8'; c.fillRect(-12, -66, 24, 4); },
    front: (c) => { if (e.hasPole && e.state !== 'vault') { c.beginPath(); c.moveTo(-70, -58); c.lineTo(30, -66); c.lineWidth = 3.5; c.strokeStyle = '#8a6a2a'; c.stroke(); } if (e.state === 'vault') { const k = e.vaultK || 0; c.beginPath(); c.moveTo(-30 + k * 30, 0); c.lineTo(-10, -70); c.lineWidth = 3.5; c.strokeStyle = '#8a6a2a'; c.stroke(); } },
  });
  D.grumbler = (c, e) => {
    const raged = !e.helm;
    body(c, e, {
      shirt: '#8a6a9a', overalls: '#3a3a4a', angry: raged, eyeGlow: raged ? '#e8201a' : null, stride: raged ? 8 : 5,
      front: (c) => {
        if (!e.helm) return;
        const f = e.helm.hp / e.helm.max;
        c.save(); c.translate(-26, -62); c.rotate(-0.06);
        c.fillStyle = '#d8b880'; c.strokeStyle = OL; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-14, -20); c.lineTo(14, -20); c.lineTo(14 - (f < 0.5 ? 5 : 0), 22); c.lineTo(-14, 22); c.closePath(); c.fill(); c.stroke();
        SS.ui.text(c, 'KEEP', 0, -8, { size: 9, color: '#a82a1a' }); SS.ui.text(c, 'OFF', 0, 4, { size: 9, color: '#a82a1a' });
        if (f < 0.5) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(2, 10, 9, 10); }
        c.restore();
      },
    });
  };
  D.gate = (c, e) => body(c, e, {
    shirt: '#6a7a8a',
    front: (c) => {
      if (!e.shield) return;
      const f = e.shield.hp / e.shield.max;
      c.save(); c.translate(-30, -54);
      c.strokeStyle = '#1a1a1a'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-12, -34); c.lineTo(-12, 36); c.moveTo(12, -34); c.lineTo(12, 36); c.moveTo(-12, 30); c.lineTo(12, 30); c.moveTo(-12, -10); c.lineTo(12, -10); c.stroke();
      c.strokeStyle = '#3a3a3a'; c.lineWidth = 2;
      for (const bx of [-6, 0, 6]) { c.beginPath(); c.moveTo(bx, -38); c.lineTo(bx, 30); c.stroke(); ell(c, bx, -40, 2, 3, '#3a3a3a', false); }
      c.beginPath(); c.arc(0, -10, 10, Math.PI, TAU); c.stroke();
      if (f < 0.5) { c.strokeStyle = '#7a4a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-4, 6); c.stroke(); }
      c.restore();
    },
  });
  D.brute = (c, e) => body(c, e, {
    s: 1.05, shirt: '#8a5a3a', shirtDark: '#4a2a10', overalls: '#5a3a20', stride: 7, keepArm: true,
    torsoExtra: (c) => { if (e.helm) { c.fillStyle = lgrad(c, -16, 0, 16, 0, '#a87a4a', '#5a3a1a'); c.fillRect(-17, -72, 34, 18); c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(-17, -72, 34, 18); for (const bx of [-12, 0, 12]) ell(c, bx, -63, 1.6, 1.6, '#d8d0b8', false); } },
    hat: (c) => e.helm && bruteHelm(c, e.helm.hp / e.helm.max),
  });
  D.summoner = (c, e) => body(c, e, {
    shirt: '#5a2a7a', shirtDark: '#2a0a3a', overalls: '#3a1a4a', patches: false, patchCol: '#c8a8ff',
    torsoExtra: (c) => { c.beginPath(); c.moveTo(-18, -68); c.lineTo(18, -68); c.lineTo(22, -30); c.lineTo(-22, -30); c.closePath(); c.fillStyle = 'rgba(70,30,110,0.92)'; c.fill(); c.strokeStyle = OL; c.lineWidth = 2; c.stroke(); for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-22 + i * 11, -30); c.lineTo(-17 + i * 11, -24); c.lineTo(-12 + i * 11, -30); c.fillStyle = '#4a1a6a'; c.fill(); } },
    hat: (c) => { c.beginPath(); c.moveTo(-16, -8); c.lineTo(4, -42); c.lineTo(16, -8); c.closePath(); c.fillStyle = '#4a1a6a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke(); ell(c, 4, -42, 3, 3, '#ffd24a', OL, 1); },
    frontArmOverride: (c) => {
      const up = e.summonAnim > 0 ? -18 : Math.sin(e.anim * 8) * 3;
      limb(c, -6, -66, -24, -74 + up, 5, '#5a2a7a');
      ell(c, -26, -80 + up, 6, 7, '#9a6a3a', OL, 1.5);
      for (let i = 0; i < 3; i++) ell(c, -26 + (i - 1) * 4, -86 + up, 2.2, 2.2, '#5a3a1a', false);
    },
  });
  D.diver = (c, e) => body(c, e, {
    shirt: '#2a6a5a', overalls: '#1a3a4a',
    hat: (c) => {
      c.fillStyle = 'rgba(160,220,240,0.55)'; c.strokeStyle = OL; c.lineWidth = 2;
      SS.ui.rrect(c, -16, -10, 22, 12, 5); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(8, -6); c.lineTo(10, -30); c.lineTo(16, -30); c.lineWidth = 4; c.strokeStyle = '#e8a020'; c.stroke();
    },
  });
  D.jester = (c, e) => body(c, e, {
    shirt: '#c83a8a', shirtDark: '#6a1a4a', overalls: '#3a2a6a',
    torsoExtra: (c) => { for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-14 + i * 7, -72); c.lineTo(-10.5 + i * 7, -64); c.lineTo(-7 + i * 7, -72); c.fillStyle = i % 2 ? '#ffd24a' : '#3ac8c8'; c.fill(); c.strokeStyle = OL; c.lineWidth = 1; c.stroke(); } },
    hat: (c) => { for (const [a, col] of [[-0.6, '#c83a8a'], [0, '#3ac8c8'], [0.6, '#ffd24a']]) { c.save(); c.translate(0, -12); c.rotate(a); c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(0, -18, 4, -24); c.lineTo(5, 0); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OL; c.stroke(); ell(c, 4, -25, 2.5, 2.5, '#ffd24a', OL, 1); c.restore(); } },
    front: (c) => {
      if (!e.box) return;
      c.save(); c.translate(-26, -48);
      c.fillStyle = lgrad(c, -10, 0, 10, 0, '#c8ccd2', '#6a7078'); c.fillRect(-10, -10, 20, 20); c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(-10, -10, 20, 20);
      c.fillStyle = '#c83a8a'; c.fillRect(-6, -6, 12, 4);
      c.save(); c.translate(10, 0); c.rotate(e.anim * 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(8, 0); c.lineTo(8, 6); c.lineWidth = 2; c.stroke(); c.restore();
      c.restore();
    },
  });
  D.balloon = (c, e) => {
    if (e.balloon) {
      const bob = Math.sin(e.anim * 2) * 2;
      c.save();
      for (const [bx, by, col] of [[-12, -150, '#e84a4a'], [6, -158, '#4ac8e8'], [16, -140, '#ffd24a']]) {
        c.beginPath(); c.moveTo(0, -96); c.lineTo(bx, by + 16 + bob); c.lineWidth = 1; c.strokeStyle = '#3a3a3a'; c.stroke();
        ell(c, bx, by + bob, 12, 15, rgrad(c, bx, by + bob, 14, '#fff', col), OL, 1.5);
      }
      c.restore();
    }
    body(c, e, { shirt: '#4a8ac8', overalls: '#7a5a3a', noLegs: false, frontArmOverride: e.balloon ? (c) => limb(c, -6, -66, -2, -96, 5, '#7a6a4a') : null });
  };
  D.miner = (c, e) => body(c, e, {
    shirt: '#8a6a3a', overalls: '#3a3a2a',
    hat: (c) => e.helm && minerHat(c),
    frontArmOverride: (c) => {
      limb(c, -6, -66, -22, -60, 5, '#7a6a4a');
      if (e.pick) { c.save(); c.translate(-22, -60); c.rotate(e.state === 'dig' ? Math.sin(e.anim * 10) : -0.4); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.lineWidth = 3; c.strokeStyle = '#7a5a2a'; c.stroke(); c.beginPath(); c.moveTo(-12, -24); c.quadraticCurveTo(0, -32, 12, -24); c.lineWidth = 3.5; c.strokeStyle = '#8a9098'; c.stroke(); c.restore(); }
    },
  });
  D.pogo = (c, e) => {
    const b = e.spring ? Math.abs(Math.sin(e.anim * 5)) : 0;
    c.save(); c.translate(0, -b * 26);
    if (e.spring) {
      c.save(); c.translate(-2, 0);
      c.strokeStyle = '#8a9098'; c.lineWidth = 2.5;
      c.beginPath(); for (let i = 0; i <= 10; i++) c.lineTo((i % 2 ? -7 : 7), 8 + b * 6 - i * (3 + b * 1.2)); c.stroke();
      c.beginPath(); c.moveTo(-14, -26 - b * 8); c.lineTo(10, -26 - b * 8); c.lineWidth = 3; c.stroke();
      c.restore();
    }
    body(c, e, { shirt: '#3ac85a', overalls: '#3a3a7a', hat: (c) => beanie(c, '#c8c83a') });
    c.restore();
  };
  D.ladder = (c, e) => body(c, e, {
    shirt: '#c8783a', overalls: '#4a3a2a',
    hat: (c) => { c.fillStyle = '#e8c83a'; c.beginPath(); c.moveTo(-16, -4); c.quadraticCurveTo(-14, -18, 0, -18); c.quadraticCurveTo(14, -18, 16, -4); c.closePath(); c.fill(); c.strokeStyle = OL; c.lineWidth = 2; c.stroke(); },
    front: (c) => {
      if (!e.shield) return;
      c.save(); c.translate(-32, -60); c.rotate(-0.1);
      c.strokeStyle = '#8a9098'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-8, -40); c.lineTo(-8, 44); c.moveTo(8, -40); c.lineTo(8, 44); c.stroke();
      c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-8, -34 + i * 14); c.lineTo(8, -34 + i * 14); c.stroke(); }
      c.restore();
    },
  });
  D.snowfoot = (c, e) => {
    c.save(); c.scale(1.2, 1.2);
    const walk = e.anim, sw = Math.sin(walk * 4);
    for (const s of [-1, 1]) { ell(c, s * 8 + s * sw * 4, -12, 9, 14, '#e8f0f8', '#4a6a8a', 2); }
    c.beginPath(); c.moveTo(-22, -24); c.quadraticCurveTo(-28, -80, 0, -92); c.quadraticCurveTo(28, -80, 22, -24); c.closePath();
    c.fillStyle = rgrad(c, 0, -60, 34, '#ffffff', '#a8c0d8'); c.fill(); c.lineWidth = 2; c.strokeStyle = '#4a6a8a'; c.stroke();
    c.strokeStyle = 'rgba(80,110,140,0.5)'; c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-18 + i * 5, -34 - (i % 3) * 10); c.lineTo(-20 + i * 5, -26 - (i % 3) * 10); c.stroke(); }
    ell(c, -26, -56 + sw * 4, 7, 14, '#e8f0f8', '#4a6a8a', 2);
    ell(c, -8, -74, 4, 4, '#1a3a5a', false); ell(c, 6, -74, 4, 4, '#1a3a5a', false);
    c.beginPath(); c.arc(-1, -62, 6, 0.2 * Math.PI, 0.8 * Math.PI); c.lineWidth = 2; c.strokeStyle = '#1a3a5a'; c.stroke();
    c.restore();
  };
  D.giant = (c, e) => {
    const elder = e.def.elder;
    const sm = e.smash || 0; // 0..1 windup->slam
    c.save(); c.scale(1.65, 1.65);
    const sw = Math.sin(e.anim * 3);
    limb(c, 8, -36, 8 + sw * 8, -4, 10, '#6a5a3a'); limb(c, -8, -36, -8 - sw * 8, -4, 10, '#6a5a3a');
    ell(c, 8 + sw * 8 - 4, -3, 11, 5, '#3a2a1a', OL, 1.5); ell(c, -8 - sw * 8 - 4, -3, 11, 5, '#3a2a1a', OL, 1.5);
    // hay bale body
    SS.ui.rrect(c, -26, -86, 52, 54, 10);
    c.fillStyle = lgrad(c, -26, 0, 26, 0, elder ? '#d89a6a' : '#e8c870', elder ? '#8a4a2a' : '#a8803a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(120,80,20,0.6)'; c.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-24, -82 + i * 6); c.lineTo(24, -80 + i * 6 + (i % 2) * 2); c.stroke(); }
    c.strokeStyle = '#8a2a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -86); c.lineTo(-10, -32); c.moveTo(12, -86); c.lineTo(12, -32); c.stroke();
    if (e.imp && !e.thrown) { c.save(); c.translate(18, -82); c.scale(0.45, 0.45); D.imp(c, { state: 'walk', anim: e.anim, hp: 1, maxHp: 1, def: {} }); c.restore(); }
    // fence post weapon
    c.save(); c.translate(-22, -66);
    const ang = sm > 0 ? (sm < 0.6 ? -1.8 * (sm / 0.6) : -1.8 + 3.0 * ((sm - 0.6) / 0.4)) : -0.5 + Math.sin(e.anim * 2) * 0.1;
    c.rotate(ang);
    limb(c, 0, 0, -14, 0, 8, '#6a5a3a');
    c.fillStyle = lgrad(c, 0, -6, 0, 6, '#9a7a4a', '#5a3a1a'); c.fillRect(-60, -7, 50, 14); c.strokeStyle = OL; c.lineWidth = 2; c.strokeRect(-60, -7, 50, 14);
    c.restore();
    c.save(); c.translate(-2, -96); head(c, e, 0, 0, 1.15, { eyeGlow: elder ? '#ff2a1a' : null, angry: true, skin: '#c8a060' }); c.restore();
    if (elder) { c.fillStyle = '#c82a1a'; c.beginPath(); c.arc(-11, -100, 5, 0, TAU); c.fill(); }
    c.restore();
  };
  D.redgiant = D.giant;
  D.seal = (c, e) => {
    if (e.hasPole) { // riding the seal
      c.save(); c.translate(-8, -4);
      ell(c, 0, -4, 36, 11, rgrad(c, 0, -6, 34, '#9aa8b8', '#4a5868'));
      ell(c, -32, -12, 10, 8, '#8a98a8', OL, 2);
      ell(c, -36, -14, 1.8, 1.8, '#111', false);
      c.restore();
    }
    body(c, e, { shirt: '#3a8ac8', overalls: '#2a4a6a' });
  };
  D.grappler = (c, e) => {
    // rope from above
    c.beginPath(); c.moveTo(0, -800); c.lineTo(0, -96); c.lineWidth = 2; c.strokeStyle = '#d8c8a0'; c.stroke();
    body(c, e, {
      shirt: '#2a2a2a', shirtDark: '#111', overalls: '#3a3a3a', noLegs: false, legs: '#2a2a2a', patches: false,
      hat: (c) => { c.fillStyle = '#c83a3a'; c.fillRect(-16, -8, 32, 6); },
      frontArmOverride: (c) => { limb(c, -6, -66, -18, -40, 5, '#2a2a2a'); c.beginPath(); c.arc(-18, -34, 7, 0, Math.PI); c.lineWidth = 3; c.strokeStyle = '#8a9098'; c.stroke(); },
    });
  };
  D.boss = function (c, e) { A.colossus(c, e); };

  // vehicles
  D.iceroller = (c, e) => {
    c.save(); c.scale(1.25, 1.25);
    const hpf = e.hp / e.maxHp;
    // drum roller front
    ell(c, -30, -16, 16, 16, lgrad(c, -46, 0, -14, 0, '#d8e8f0', '#7a98a8'));
    c.strokeStyle = '#4a6a7a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-30 + Math.cos(e.anim * 4) * 14, -16 + Math.sin(e.anim * 4) * 14); c.lineTo(-30, -16); c.stroke();
    // body
    c.beginPath(); c.moveTo(-18, -8); c.lineTo(-22, -40); c.lineTo(26, -44); c.lineTo(32, -8); c.closePath();
    c.fillStyle = lgrad(c, 0, -44, 0, -8, '#4aa0d8', '#1a5a8a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = OL; c.stroke();
    c.fillStyle = '#e8f4fa'; c.fillRect(-14, -34, 30, 6);
    ell(c, 20, -6, 9, 9, '#2a2a2a', OL, 2); ell(c, 20, -6, 3, 3, '#8a8a8a', false);
    if (hpf < 0.5) { c.fillStyle = 'rgba(30,30,30,0.5)'; c.beginPath(); c.arc(4, -26, 6, 0, TAU); c.fill(); }
    c.restore();
    c.save(); c.translate(10, -48); c.scale(0.9, 0.9); body(c, Object.assign({}, e, { state: 'idle', hp: e.hp, maxHp: e.maxHp }), { noLegs: true, keepArm: true, shirt: '#4a7aa8', hat: (c) => beanie(c, '#c84a4a') }); c.restore();
  };
  D.catapult = (c, e) => {
    const hpf = e.hp / e.maxHp;
    c.save(); c.scale(1.2, 1.2);
    // cart
    c.beginPath(); c.moveTo(-34, -32); c.lineTo(20, -32); c.lineTo(14, -12); c.lineTo(-28, -12); c.closePath();
    c.fillStyle = lgrad(c, 0, -32, 0, -12, '#9a8a6a', '#5a4a2a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = OL; c.stroke();
    ell(c, -20, -8, 9, 9, '#4a3a2a', OL, 2); ell(c, 8, -8, 9, 9, '#4a3a2a', OL, 2);
    // arm
    const f = e.throwT || 0;
    c.save(); c.translate(-8, -32); c.rotate(-0.3 - (f > 0 ? Math.sin(f * Math.PI) * 1.4 : 0));
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-34, -10); c.lineWidth = 5; c.strokeStyle = '#6a4a2a'; c.stroke();
    ell(c, -36, -14, 8, 5, '#4a3a2a', OL, 1.5);
    if (e.ammo > 0 && f <= 0) A.clod(c, -36, -20, 1);
    c.restore();
    if (hpf < 0.5) { c.strokeStyle = '#2a1a0a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -30); c.lineTo(-14, -18); c.stroke(); }
    c.restore();
    c.save(); c.translate(36, 0); c.scale(0.95, 0.95); body(c, Object.assign({}, e, { state: 'walk' }), { keepArm: true, shirt: '#7a8a4a', frontArmOverride: (c) => limb(c, -6, -66, -24, -46, 5, '#7a6a4a') }); c.restore();
  };
  D.sled = (c, e) => {
    c.save();
    c.beginPath(); c.moveTo(-58, -6); c.quadraticCurveTo(-70, -6, -66, -20); c.lineTo(50, -20); c.lineTo(50, -6); c.closePath();
    c.fillStyle = lgrad(c, 0, -20, 0, -6, '#c84a3a', '#7a1a10'); c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-60, 0); c.lineTo(52, 0); c.lineWidth = 3; c.strokeStyle = '#8a9098'; c.stroke();
    for (let i = 0; i < 4; i++) {
      c.save(); c.translate(-40 + i * 28, -14); c.scale(0.7, 0.7);
      body(c, { state: 'idle', anim: e.anim + i, hp: 1, maxHp: 1, def: {} }, { noLegs: true, keepArm: true, shirt: i % 2 ? '#c84a4a' : '#3a7ac8', hat: (c) => beanie(c, i % 2 ? '#3a7ac8' : '#c84a4a') });
      c.restore();
    }
    c.restore();
  };

  A.clod = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 0, 8, 7, rgrad(c, 0, 0, 8, '#9a7a4a', '#4a3a1a'), OL, 1.4);
    c.fillStyle = '#5cae33'; c.fillRect(-2, -9, 3, 4);
    c.restore();
  };
  A.tire = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    ell(c, 0, 0, 26, 9, '#2a2a2a', OL, 2);
    ell(c, 0, -1, 15, 4.5, '#1a3a5a', false);
    c.strokeStyle = '#4a4a4a'; c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 20, Math.sin(a) * 6.5); c.lineTo(Math.cos(a) * 25, Math.sin(a) * 8.5); c.stroke(); }
    c.restore();
  };

  // ---------- the boss ----------
  A.colossus = function (c, e) {
    const t = e.anim || 0;
    c.save();
    const hpf = e.hp / e.maxHp;
    // legs (tractor treads)
    for (const lx of [-90, 40]) {
      SS.ui.rrect(c, lx, -80, 60, 80, 14);
      c.fillStyle = lgrad(c, lx, 0, lx + 60, 0, '#6a6a5a', '#2a2a22'); c.fill(); c.lineWidth = 3; c.strokeStyle = OL; c.stroke();
      c.fillStyle = '#1a1a14';
      for (let i = 0; i < 6; i++) c.fillRect(lx + 4, -76 + ((i * 14 + t * 20) % 76), 52, 4);
    }
    // body: rusted barn-red boiler
    c.beginPath(); c.moveTo(-120, -80); c.lineTo(-130, -280); c.quadraticCurveTo(-10, -330, 120, -280); c.lineTo(110, -80); c.closePath();
    c.fillStyle = lgrad(c, -130, 0, 120, 0, '#b0503a', '#4a1a10'); c.fill(); c.lineWidth = 4; c.strokeStyle = OL; c.stroke();
    // rivets / plates
    c.strokeStyle = 'rgba(30,10,5,0.6)'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-124 + i * 3, -130 - i * 40); c.lineTo(114 - i * 3, -130 - i * 40); c.stroke(); }
    for (let i = 0; i < 10; i++) ell(c, -100 + i * 22, -110, 2.5, 2.5, '#d8a080', false);
    // rust patches
    c.fillStyle = 'rgba(200,110,40,0.45)'; c.beginPath(); c.arc(-60, -200, 22, 0, TAU); c.arc(50, -150, 16, 0, TAU); c.fill();
    // cockpit with pilot
    ell(c, 0, -270, 46, 36, 'rgba(160,210,230,0.55)', OL, 3);
    c.save(); c.translate(0, -238); c.scale(0.75, 0.75); body(c, { state: 'idle', anim: t, hp: 1, maxHp: 1, def: {} }, { noLegs: true, keepArm: true, shirt: '#3a3a5a', angry: true, hat: (c) => { c.fillStyle = '#2a2a2a'; c.fillRect(-14, -16, 28, 12); c.fillRect(-20, -6, 40, 4); } }); c.restore();
    // head-lamps eyes
    const glow = e.charge === 'fire' ? '#ff6a1a' : e.charge === 'ice' ? '#6ad8ff' : '#ffe14a';
    ell(c, -70, -230, 16, 16, '#2a2a2a', OL, 3); ell(c, -70, -230, 10, 10, glow, false);
    ell(c, 70, -230, 16, 16, '#2a2a2a', OL, 3); ell(c, 70, -230, 10, 10, glow, false);
    // arm (left) with claw
    const ar = Math.sin(t * 1.3) * 0.1 + (e.armK || 0);
    c.save(); c.translate(-120, -190); c.rotate(-0.2 + ar);
    SS.ui.rrect(c, -110, -16, 110, 32, 10); c.fillStyle = '#7a3a2a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OL; c.stroke();
    c.beginPath(); c.moveTo(-110, -20); c.lineTo(-140, -34); c.lineTo(-126, 0); c.lineTo(-140, 34); c.lineTo(-110, 20); c.closePath(); c.fillStyle = '#5a5a5a'; c.fill(); c.stroke();
    if (e.charge) { ell(c, -150, 0, 26 + Math.sin(t * 10) * 3, 26 + Math.sin(t * 10) * 3, e.charge === 'fire' ? 'rgba(255,110,30,0.9)' : 'rgba(120,220,255,0.9)', false); }
    c.restore();
    // smokestack
    c.fillStyle = '#3a3a3a'; c.fillRect(70, -340, 22, 60); c.strokeStyle = OL; c.lineWidth = 3; c.strokeRect(70, -340, 22, 60);
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ell(c, 81 + k * 20, -350 - k * 60, 10 + k * 14, 8 + k * 10, 'rgba(80,80,80,' + (0.5 * (1 - k)) + ')', false); }
    if (hpf < 0.5) { c.fillStyle = 'rgba(20,20,20,0.5)'; c.beginPath(); c.arc(-30, -150, 18, 0, TAU); c.arc(40, -210, 12, 0, TAU); c.fill(); }
    if (e.flash > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,' + e.flash + ')'; c.fillRect(-140, -340, 270, 340); c.globalCompositeOperation = 'source-over'; }
    c.restore();
  };

  // main entry: draw an enemy object at x,y (feet)
  A.enemy = function (c, e, x, y, s) {
    const fn = D[e.def.id] || D.rotter;
    c.save();
    c.translate(x, y);
    const sc = (s || 1) * (e.scale || 1);
    c.scale(sc, sc);
    if (e.hypno) c.scale(-1, 1);
    if (e.dying > 0 && !e.def.vehicle && !e.def.boss) {
      const k = SS.clamp(1 - e.dying / 0.9, 0, 1);
      c.rotate(-k * 1.45 * (e.fallDir || 1));
      c.globalAlpha = e.dying < 0.3 ? e.dying / 0.3 : 1;
    }
    let filt = '';
    if (e.hypno) filt += 'hue-rotate(250deg) saturate(1.4) ';
    if (e.chill > 0) filt += 'hue-rotate(170deg) saturate(1.6) brightness(1.1) ';
    if (e.flash > 0 && !e.def.boss) filt += 'brightness(1.7) ';
    if (filt) c.filter = filt;
    fn(c, e);
    c.filter = 'none';
    if (e.freeze > 0) {
      c.fillStyle = 'rgba(190,240,255,0.45)';
      SS.ui.rrect(c, -30, -110, 56, 110, 10); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.stroke();
    }
    if (e.butter > 0) { c.save(); c.translate(-2, -100); A.sapglob(c, 0, 0, 1.4); c.restore(); }
    c.restore();
  };
  // ash figure after explosion
  A.ash = function (c, x, y, s, k) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = k;
    c.fillStyle = '#1a1612';
    c.beginPath(); c.moveTo(-12, 0); c.lineTo(-14, -60); c.quadraticCurveTo(-18, -100, 0, -102); c.quadraticCurveTo(16, -100, 14, -60); c.lineTo(12, 0); c.closePath(); c.fill();
    ell(c, -6, -84, 3, 3, '#ff6a1a', false); ell(c, 5, -85, 2.5, 2.5, '#ff6a1a', false);
    c.restore();
  };
  A.rotterHead = head;
  A.rotterBody = body;
})();
