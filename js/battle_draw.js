// Sprout Siege — battle rendering, HUD, input, pause/lose overlays
(function () {
  const SS = window.SS;
  const B = SS.Battle.prototype;
  const A = SS.art;
  const ui = SS.ui;
  const TAU = Math.PI * 2;

  // ---------- background (pre-rendered) ----------
  B.buildBg = function () {
    const q = 2;
    const cv = document.createElement('canvas');
    cv.width = SS.W * q; cv.height = SS.H * q;
    const c = cv.getContext('2d');
    c.scale(q, q);
    const night = this.night, sc = this.scene;
    const GX = this.GX, GY = this.GY, CW = this.CW, RH = this.RH, rows = this.rows, cols = this.cols;
    const right = GX + cols * CW, bottom = GY + rows * RH;
    // sky / back area
    const sky = c.createLinearGradient(0, 0, 0, GY + 40);
    if (night) { sky.addColorStop(0, '#0d1430'); sky.addColorStop(1, '#2a3560'); }
    else { sky.addColorStop(0, '#7ec8f0'); sky.addColorStop(1, '#cfeefa'); }
    c.fillStyle = sky; c.fillRect(0, 0, SS.W, SS.H);
    if (night) {
      c.fillStyle = '#fff';
      const rr = SS.mulberry(7);
      for (let i = 0; i < 60; i++) { c.globalAlpha = 0.3 + rr() * 0.7; c.fillRect(rr() * SS.W, rr() * GY, 1.5, 1.5); }
      c.globalAlpha = 1;
      A.ell(c, 900, 40, 22, 22, '#f8f4d8', false);
      A.ell(c, 910, 34, 20, 20, night ? '#2a3560' : '#cfeefa', false);
    }
    if (!this.roof) {
      // hedge + fence
      c.fillStyle = night ? '#16301e' : '#3d7a2c';
      for (let x = -20; x < SS.W + 40; x += 34) { c.beginPath(); c.arc(x, GY - 6, 26, Math.PI, TAU); c.fill(); }
      c.fillRect(0, GY - 8, SS.W, 12);
      c.fillStyle = night ? '#6a6058' : '#e8dcc0';
      for (let x = GX - 10; x < right; x += 18) { c.fillRect(x, GY - 40, 10, 36); c.beginPath(); c.moveTo(x, GY - 40); c.lineTo(x + 5, GY - 47); c.lineTo(x + 10, GY - 40); c.fill(); }
      c.fillRect(GX - 10, GY - 30, right - GX + 10, 5);
      c.fillRect(GX - 10, GY - 16, right - GX + 10, 5);
    }
    if (this.roof) {
      // eaves and wall under the sloped roof
      c.fillStyle = night ? '#2a1610' : '#6a3420';
      c.fillRect(0, GY - 60, SS.W, SS.H - GY + 60);
      c.fillStyle = night ? '#1e100c' : '#4e2416';
      c.beginPath(); c.moveTo(GX - 2 * CW, bottom + this.slope(GX - 2 * CW)); c.lineTo(GX + 5 * CW, bottom); c.lineTo(SS.W, bottom); c.lineTo(SS.W, SS.H); c.lineTo(0, SS.H); c.lineTo(0, bottom + this.slope(0)); c.closePath(); c.fill();
    }
    // lawn tiles
    for (let r = 0; r < rows; r++) {
      for (let col = -2; col < cols; col++) {
        const x0 = GX + col * CW, x1 = x0 + CW;
        const y0 = GY + r * RH, y1 = y0 + RH;
        const s0 = this.slope(x0), s1 = this.slope(x1);
        const water = this.isWater(r);
        const disabled = this.lanes.indexOf(r) < 0;
        let fill;
        if (this.roof) {
          fill = (r + col) % 2 ? (night ? '#5a2e24' : '#b8583a') : (night ? '#4e281e' : '#a84a30');
        } else if (water) {
          fill = night ? '#1f4f6a' : '#4ab0d8';
        } else if (disabled) {
          fill = night ? '#3f3424' : '#8a6a3a';
        } else {
          const light = (r + col) % 2 === 0;
          fill = night ? (light ? '#3f6e4a' : '#36623f') : (light ? '#7cc04a' : '#6cb03e');
        }
        if (col < 0) fill = this.roof ? (night ? '#4a2a20' : '#9a4a30') : water ? (night ? '#1f4f6a' : '#4ab0d8') : (night ? '#40382a' : '#a88a5a');
        c.beginPath(); c.moveTo(x0, y0 + s0); c.lineTo(x1, y0 + s1); c.lineTo(x1, y1 + s1); c.lineTo(x0, y1 + s0); c.closePath();
        c.fillStyle = fill; c.fill();
        if (this.roof) {
          c.strokeStyle = 'rgba(40,10,0,0.35)'; c.lineWidth = 1.2;
          for (let k = 1; k < 4; k++) { const yy = y0 + (RH * k) / 4; c.beginPath(); c.moveTo(x0, yy + s0); c.lineTo(x1, yy + s1); c.stroke(); }
          for (let k = 0; k < 3; k++) { const xx = x0 + (CW * (k + (r % 2) * 0.5)) / 3; c.beginPath(); c.moveTo(xx, y0 + this.slope(xx)); c.lineTo(xx, y0 + RH / 4 + this.slope(xx)); c.stroke(); }
        } else if (!water && !disabled && col >= 0) {
          // grass texture
          const rr = SS.mulberry(r * 31 + col * 7 + 3);
          c.strokeStyle = night ? 'rgba(20,50,30,0.5)' : 'rgba(60,120,30,0.45)'; c.lineWidth = 1.2;
          for (let k = 0; k < 10; k++) { const gx = x0 + rr() * CW, gy = y0 + rr() * RH; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 2, gy - 6); c.stroke(); }
        }
      }
    }
    // pool edges
    if (this.pool) {
      c.fillStyle = night ? '#8a96a0' : '#eef2f2';
      c.fillRect(GX - 2 * CW, GY + 2 * RH - 5, right - GX + 2 * CW + 120, 7);
      c.fillRect(GX - 2 * CW, GY + 4 * RH - 2, right - GX + 2 * CW + 120, 7);
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1;
      for (let col = -2; col < cols + 2; col++) { const x = GX + col * CW; c.beginPath(); c.moveTo(x, GY + 2 * RH); c.lineTo(x, GY + 4 * RH); c.stroke(); }
    }
    // street / roof edge on the right
    if (this.roof) {
      c.fillStyle = night ? '#2a1a14' : '#7a3a24';
      c.fillRect(right, GY - 10, SS.W - right, bottom - GY + 20);
      c.fillStyle = night ? '#1a0e0a' : '#5a2a18'; c.fillRect(right, GY - 10, 6, bottom - GY + 20);
    } else {
      c.fillStyle = night ? '#4a4a48' : '#b8b4aa'; c.fillRect(right, GY - 12, 26, bottom - GY + 24);
      c.fillStyle = night ? '#2a2a2c' : '#6a6a68'; c.fillRect(right + 26, GY - 12, SS.W - right - 26, bottom - GY + 24);
      c.fillStyle = night ? '#6a6a40' : '#e8d860';
      for (let y = GY; y < bottom; y += 40) c.fillRect(right + 70, y, 5, 22);
    }
    // house on the left
    if (this.roof) {
      // chimney & ridge
      c.fillStyle = night ? '#3a2a24' : '#8a4a34';
      c.fillRect(0, 0, GX - 60, SS.H);
      c.fillStyle = night ? '#4a3a34' : '#a85a3a';
      c.fillRect(20, GY - 40, 50, 120); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2;
      for (let y = GY - 30; y < GY + 80; y += 14) { c.beginPath(); c.moveTo(20, y); c.lineTo(70, y); c.stroke(); }
    } else {
      const wall = night ? '#5a5466' : '#efe4c8';
      c.fillStyle = wall; c.fillRect(0, GY - 70, GX - 52, bottom - GY + 90);
      c.strokeStyle = night ? 'rgba(0,0,0,0.25)' : 'rgba(120,90,40,0.25)'; c.lineWidth = 1.5;
      for (let y = GY - 60; y < bottom + 20; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(GX - 52, y); c.stroke(); }
      // door
      const dy = GY + rows * RH * 0.45;
      c.fillStyle = night ? '#3a2a20' : '#8a5a2a'; c.fillRect(30, dy - 10, 50, 96); c.strokeStyle = '#3a2008'; c.lineWidth = 3; c.strokeRect(30, dy - 10, 50, 96);
      A.ell(c, 72, dy + 40, 3, 3, '#e8c040', false);
      // window
      c.fillStyle = night ? '#e8d880' : '#a8d8f0'; c.fillRect(24, GY + 10, 62, 50);
      c.strokeStyle = night ? '#2a2420' : '#6a4a2a'; c.lineWidth = 4; c.strokeRect(24, GY + 10, 62, 50);
      c.beginPath(); c.moveTo(55, GY + 10); c.lineTo(55, GY + 60); c.moveTo(24, GY + 35); c.lineTo(86, GY + 35); c.stroke();
      // roof overhang
      c.fillStyle = night ? '#3a2a30' : '#a84a30'; c.fillRect(0, GY - 86, GX - 36, 22);
      // porch strip
      c.fillStyle = night ? '#3a3226' : '#c8a870'; c.fillRect(GX - 52, GY - 10, 32, bottom - GY + 20);
    }
    // mower path
    if (!this.roof) {
      c.fillStyle = night ? 'rgba(30,25,15,0.35)' : 'rgba(110,80,40,0.35)';
      c.fillRect(GX - 22, GY, 22, bottom - GY);
    }
    this.bg = cv;
  };

  // ---------- main draw ----------
  B.draw = function (c) {
    if (!this.bg) this.buildBg();
    c.save();
    if (this.shake > 0) c.translate((Math.random() - 0.5) * this.shake * 14, (Math.random() - 0.5) * this.shake * 10);
    c.drawImage(this.bg, 0, 0, SS.W, SS.H);
    this.drawWater(c);
    this.drawTileProps(c);
    this.mode.drawUnder && this.mode.drawUnder(this, c);
    this.drawEntities(c);
    this.drawProjs(c);
    this.drawFx(c);
    if (this.fogCol) this.drawFog(c);
    if (this.level.storm) this.drawStorm(c);
    this.mode.drawOver && this.mode.drawOver(this, c);
    this.drawPickups(c);
    for (const tx of this.texts) {
      const k = tx.t / tx.life;
      c.globalAlpha = 1 - k;
      ui.text(c, tx.text, tx.x, tx.y - k * 30, { size: 18, color: tx.col, stroke: '#000', sw: 3 });
      c.globalAlpha = 1;
    }
    if (this.flashT > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(1, this.flashT * 2) + ')'; c.fillRect(0, 0, SS.W, SS.H); }
    c.restore();
    this.drawHud(c);
    this.drawCursor(c);
    this.drawMessages(c);
  };
  B.drawWater = function (c) {
    if (!this.pool) return;
    const t = this.t;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5;
    for (const r of [2, 3]) {
      const y0 = this.GY + r * this.RH;
      for (let i = 0; i < 9; i++) {
        const x = this.GX - 140 + ((i * 137 + t * 18) % (this.cols * this.CW + 260));
        const y = y0 + 18 + ((i * 53) % (this.RH - 30));
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 12, y - 4, x + 24, y); c.stroke();
      }
    }
    c.restore();
  };
  B.drawTileProps = function (c) {
    for (let r = 0; r < this.rows; r++) for (let col = 0; col < this.cols; col++) {
      const t = this.tiles[r][col];
      const x = this.cx(col), y = this.groundY(r, x);
      if (t.crater > 0) {
        A.ell(c, x, y - 18, 34, 14, '#3a2a1a', '#1a1008', 2);
        A.ell(c, x, y - 20, 24, 8, '#20160c', false);
      }
      if (t.star && !t.plant) {
        c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(this.t * 3);
        c.beginPath();
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 10 : 24; c.lineTo(x + Math.cos(a) * rr, y - 40 + Math.sin(a) * rr); }
        c.closePath(); c.fillStyle = '#fff36a'; c.fill(); c.restore();
      }
    }
    // ice trails
    for (let r = 0; r < this.rows; r++) {
      if (this.iceX[r] === Infinity) continue;
      const x0 = Math.max(this.GX, this.iceX[r]), x1 = this.GX + this.cols * this.CW + 120;
      const y = this.gy(r);
      c.fillStyle = 'rgba(220,245,255,0.75)';
      c.fillRect(x0, y - 22, x1 - x0, 24);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x0, y - 12); c.lineTo(x1, y - 12); c.stroke();
    }
    // rake
    if (this.rake) {
      const x = this.rake.x, y = this.gy(this.rake.r);
      c.save(); c.translate(x, y - 6); c.rotate(-0.15);
      c.fillStyle = '#7a5a2a'; c.fillRect(-30, -3, 60, 6);
      c.fillStyle = '#8a9098'; for (let i = 0; i < 7; i++) c.fillRect(-30 + i * 9, -12, 3, 10);
      c.restore();
    }
  };
  function graveArt(c, x, y, v, k) {
    c.save(); c.translate(x, y);
    if (k !== undefined) c.translate(0, k * 40);
    A.ell(c, 0, -2, 28, 8, '#4a3a2a', false);
    c.beginPath();
    if (v === 0) { c.moveTo(-18, 0); c.lineTo(-18, -38); c.quadraticCurveTo(0, -56, 18, -38); c.lineTo(18, 0); }
    else if (v === 1) { c.moveTo(-15, 0); c.lineTo(-15, -46); c.lineTo(15, -46); c.lineTo(15, 0); }
    else { c.moveTo(-5, 0); c.lineTo(-5, -30); c.lineTo(-17, -30); c.lineTo(-17, -40); c.lineTo(-5, -40); c.lineTo(-5, -52); c.lineTo(5, -52); c.lineTo(5, -40); c.lineTo(17, -40); c.lineTo(17, -30); c.lineTo(5, -30); c.lineTo(5, 0); }
    c.closePath();
    c.fillStyle = A.lgrad(c, -18, 0, 18, 0, '#a8a8a0', '#5a5a58'); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1a1a18'; c.stroke();
    c.strokeStyle = 'rgba(60,90,40,0.8)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-14, -2); c.quadraticCurveTo(-10, -12, -16, -20); c.stroke();
    c.restore();
  }
  B.drawEntities = function (c) {
    const s = this.unitS;
    const byRow = [];
    for (let r = 0; r < this.rows; r++) byRow.push([]);
    const air = [];
    for (const e of this.enemies) {
      if (e.def.bungee || e.flying || e.def.boss || e.state === 'blown') air.push(e);
      else if (byRow[e.row]) byRow[e.row].push(e);
    }
    for (let r = 0; r < this.rows; r++) {
      // mower
      const m = this.mowers[r];
      if (m && (m.state === 'ready' || m.state === 'run')) this.drawMower(c, m);
      for (let col = 0; col < this.cols; col++) {
        const t = this.tiles[r][col];
        const x = this.cx(col);
        if (t.grave) graveArt(c, x + 2, this.groundY(r, x), t.graveV, t.plant && t.plant.def.kind === 'grave' ? t.plant.st.digk : undefined);
        if (t.urn) this.mode.drawUrn && this.mode.drawUrn(this, c, t);
        if (t.base) A.plant(c, t.base.id, t.base.x, this.plantDrawY(t.base), s, Object.assign(t.base.st, { carrying: !!(t.plant || t.shell), flash: t.base.flash }));
        if (t.shell) { c.save(); c.translate(x, this.plantY(t)); c.scale(s, s); A.P.huskguardBack(c, t.shell.st); c.restore(); }
        if (t.plant && !(t.plant.wideRef && t.plant.c !== col)) {
          const p = t.plant;
          const px = p.def.wide ? this.cx(p.c) : p.x;
          A.plant(c, p.id, px, this.plantY(t), s, p.st);
          if (p.def.kind === 'magnet' && p.cool > 1 && p.item) this.drawItem(c, p.item, p.x, this.plantY(t) - 64 * s, 0.6);
        }
        if (t.shell) { c.save(); c.translate(x, this.plantY(t)); c.scale(s, s); if (t.shell.flash > 0) c.filter = 'brightness(1.6)'; A.P.huskguardFront(c, t.shell.st); c.restore(); }
        if (t.ladder) this.drawItem(c, 'ladderplaced', x + 18, this.plantY(t) - 20, 1);
      }
      byRow[r].sort((a, b) => b.x - a.x);
      for (const e of byRow[r]) this.drawEnemy(c, e);
    }
    for (const e of air) this.drawEnemy(c, e);
  };
  B.drawMower = function (c, m) {
    const x = m.x, y = this.gy(m.r) + this.slope(m.x);
    c.save(); c.translate(x, y - 4);
    if (m.kind === 'pool') {
      A.ell(c, 0, -6, 26, 10, '#e8e8f0', '#2a2a2a', 2);
      c.fillStyle = '#3a8ac8'; c.fillRect(-18, -24, 30, 16); c.strokeStyle = '#1a1a1a'; c.lineWidth = 2; c.strokeRect(-18, -24, 30, 16);
      c.beginPath(); c.moveTo(-14, -24); c.lineTo(-24, -44); c.lineWidth = 3; c.stroke();
    } else if (m.kind === 'roof') {
      c.fillStyle = '#c8c8d0'; c.fillRect(-22, -26, 44, 20); c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.strokeRect(-22, -26, 44, 20);
      c.fillStyle = '#8a3a2a'; for (let i = 0; i < 4; i++) c.fillRect(-20 + i * 11, -8, 6, 8);
      c.beginPath(); c.moveTo(-18, -26); c.lineTo(-28, -46); c.lineWidth = 3; c.stroke();
    } else {
      // old push mower, painted barn red
      c.fillStyle = '#c83a2a'; SS.ui.rrect(c, -20, -28, 40, 20, 5); c.fill(); c.strokeStyle = '#2a1a0a'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#f2d24a'; c.fillRect(-12, -24, 24, 6);
      for (const wx of [-14, 14]) { A.ell(c, wx, -6, 7, 7, '#2a2a2a', '#111', 1.5); A.ell(c, wx, -6, 2.5, 2.5, '#8a8a8a', false); }
      c.beginPath(); c.moveTo(-16, -28); c.lineTo(-30, -52); c.lineTo(-36, -52); c.lineWidth = 3; c.strokeStyle = '#3a3a3a'; c.stroke();
      if (m.state === 'run') { c.fillStyle = 'rgba(120,200,60,0.8)'; for (let i = 0; i < 5; i++) c.fillRect(-26 - Math.random() * 14, -20 + Math.random() * 16, 3, 3); }
    }
    c.restore();
  };
  B.drawItem = function (c, item, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 2;
    if (item === 'kettle') { A.ell(c, 0, 0, 14, 11, '#a8acb2', '#2a2a2a', 2); c.beginPath(); c.moveTo(-12, -2); c.lineTo(-22, -10); c.stroke(); }
    else if (item === 'brute') { A.ell(c, 0, 0, 16, 13, '#a87a4a', '#2a1a0a', 2); }
    else if (item === 'gate') { for (const bx of [-8, 0, 8]) { c.beginPath(); c.moveTo(bx, -16); c.lineTo(bx, 16); c.lineWidth = 2.5; c.stroke(); } c.strokeRect(-11, -16, 22, 32); }
    else if (item === 'ladder' || item === 'ladderplaced') { c.strokeStyle = '#8a9098'; c.lineWidth = 3; c.beginPath(); c.moveTo(-7, -26); c.lineTo(-7, 26); c.moveTo(7, -26); c.lineTo(7, 26); for (let i = 0; i < 5; i++) { c.moveTo(-7, -22 + i * 11); c.lineTo(7, -22 + i * 11); } c.stroke(); }
    else if (item === 'pick') { c.beginPath(); c.moveTo(0, 12); c.lineTo(0, -10); c.lineWidth = 3; c.strokeStyle = '#7a5a2a'; c.stroke(); c.beginPath(); c.moveTo(-12, -10); c.quadraticCurveTo(0, -18, 12, -10); c.lineWidth = 3.5; c.strokeStyle = '#8a9098'; c.stroke(); }
    else if (item === 'spring') { c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(i % 2 ? -6 : 6, 14 - i * 3.5); c.strokeStyle = '#8a9098'; c.lineWidth = 2.5; c.stroke(); }
    else if (item === 'box') { c.fillStyle = '#b8bcc2'; c.fillRect(-10, -10, 20, 20); c.strokeRect(-10, -10, 20, 20); }
    else if (item === 'miner') { A.ell(c, 0, 0, 14, 9, '#ffd24a', '#2a2a2a', 2); }
    else { A.ell(c, 0, 0, 10, 10, '#a8acb2', '#2a2a2a', 2); }
    c.restore();
  };
  B.drawEnemy = function (c, e) {
    if (this.level.invisible && !e.dying && e.flash <= 0 && !e.hypno) {
      // faint shadow only
      A.ell(c, e.x, e.y - 2, 18 * e.scale, 5, 'rgba(0,0,0,0.12)', false);
      return;
    }
    const s = e.scale;
    if (e.def.boss) { A.enemy(c, e, e.x, e.y, 1); return; }
    if (e.def.bungee) {
      if (e.state === 'wait') return;
      const off = -(1 - e.dropK) * 650;
      if (e.state === 'descend') { const k = e.dropK; A.ell(c, e.x, e.y - 4, 26 * k + 6, 9 * k + 2, 'rgba(0,0,0,0.3)', false); c.beginPath(); c.arc(e.x, e.y - 20, 18 + Math.sin(this.t * 10) * 3, 0, TAU); c.strokeStyle = 'rgba(255,60,40,0.6)'; c.lineWidth = 2; c.stroke(); }
      c.save(); c.translate(0, off);
      A.enemy(c, e, e.x, e.y - 30 * s, s);
      if (e.carry) A.plant(c, e.carry, e.x, e.y - 20 * s, s * 0.85, { t: this.t, mimic: e.carryMimic });
      c.restore();
      return;
    }
    if (e.under) {
      // tunnel mound
      const y = e.y;
      A.ell(c, e.x, y - 6, 22, 9, '#6a4a26', '#2a1a08', 2);
      c.fillStyle = '#4a3216'; for (let i = 0; i < 4; i++) { const k = (this.t * 3 + i / 4) % 1; c.fillRect(e.x + 10 + k * 20, y - 8 - Math.sin(k * Math.PI) * 14, 4, 4); }
      return;
    }
    if (e.state !== 'fly' && !e.flying) A.ell(c, e.x, e.y - 2, 22 * s * (e.def.giant ? 1.6 : e.def.vehicle ? 1.8 : 1), 6, 'rgba(0,0,0,0.2)', false);
    c.save();
    if (e.rise > 0) {
      c.beginPath(); c.rect(e.x - 80, e.y - 300, 160, 302); c.clip();
      c.translate(0, e.rise * 100 * s);
      A.ell(c, e.x, e.y - e.rise * 100 * s - 2, 24, 7, '#4a3216', false);
    }
    if (e.flat) { c.translate(e.x, e.y); c.scale(1, 0.25); c.translate(-e.x, -e.y); }
    if (e.inWater && !e.def.vehicle) {
      const wl = e.y - 34 * s;
      if (e.submerged) {
        // only the snorkel shows
        c.restore();
        c.save();
        c.strokeStyle = '#e8a020'; c.lineWidth = 3; c.beginPath(); c.moveTo(e.x + 4, wl + 6); c.lineTo(e.x + 4, wl - 14); c.lineTo(e.x + 10, wl - 14); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(e.x + 4, wl + 6, 10, 3, 0, 0, TAU); c.stroke();
        c.restore();
        return;
      }
      c.save();
      c.beginPath(); c.rect(e.x - 120, e.y - 400, 240, 400 - 34 * s + 4 + (e.sink || 0) * -1); c.clip();
      A.enemy(c, e, e.x, e.y + 8 * s + (e.sink || 0), s);
      c.restore();
      if (!e.def.vault || !e.hasPole) A.tire(c, e.x - 2, wl, s);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(e.x, wl + 4, 28 * s, 5, 0, 0, TAU); c.stroke();
      c.restore();
      return;
    }
    let yo = 0;
    if (e.inAir && e.state === 'vault') yo = -Math.sin(e.vaultK * Math.PI) * 70;
    if (e.state === 'hop') yo = -Math.sin(e.hopT * Math.PI) * 80;
    if (e.state === 'climb') yo = -Math.sin(e.climbT * Math.PI) * 60;
    if (e.state === 'fall') yo = -e.fallT * 160;
    if (e.flying) yo = -50 + Math.sin(e.anim * 2) * 4;
    if (e.drowning > 0) yo = (e.sink || 0);
    if (e.state === 'blown') yo = -60;
    if (e.flying) A.ell(c, e.x, e.y - 2, 16 * s, 4, 'rgba(0,0,0,0.15)', false);
    A.enemy(c, e, e.x, e.y + yo, s);
    c.restore();
  };
  B.drawProjs = function (c) {
    for (const p of this.projs) {
      if (p.type === 'straight') A.seed(c, p.x, p.y, p.kind);
      else if (p.type === 'star') A.seed(c, p.x, p.y, 'star');
      else if (p.type === 'homing') { c.save(); c.translate(p.x, p.y); c.rotate(Math.atan2(p.vy, p.vx)); A.seed(c, 0, 0, 'reed'); c.restore(); }
      else if (p.type === 'lob') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot || 0);
        if (p.kind === 'pinecone') A.pinecone(c, 0, 0, 1.1);
        else if (p.kind === 'acorn') A.acorn(c, 0, 0, 1.2);
        else if (p.kind === 'sap') A.sapglob(c, 0, 0, 1.2);
        else if (p.kind === 'durian') A.durian(c, 0, 0, 1);
        else if (p.kind === 'icedurian') A.durian(c, 0, 0, 1, true);
        c.restore();
      } else if (p.type === 'cob') {
        c.save(); c.translate(p.x, p.y); if (p.phase === 1) c.rotate(Math.PI); A.acorn(c, 0, 0, 2.6); c.restore();
        if (p.phase === 1) { const y = this.groundY(p.row, p.tx); c.beginPath(); c.arc(p.tx, y - 20, 30, 0, TAU); c.strokeStyle = 'rgba(255,40,30,0.6)'; c.lineWidth = 2; c.stroke(); }
      } else if (p.type === 'elob') {
        if (p.kind === 'fireball' || p.kind === 'iceball') { A.ell(c, p.x, p.y, 26, 26, p.kind === 'fireball' ? 'rgba(255,110,30,0.95)' : 'rgba(140,220,255,0.95)', false); }
        else if (p.kind === 'can') { c.fillStyle = '#8a9098'; c.fillRect(p.x - 10, p.y - 12, 20, 24); }
        else A.clod(c, p.x, p.y, 1.2);
      } else if (p.type === 'bowl') this.mode.drawBowl && this.mode.drawBowl(this, c, p);
    }
  };
  B.drawFx = function (c) {
    for (const f of this.fx) {
      const k = f.t / f.life;
      switch (f.type) {
        case 'hit': {
          const col = f.kind === 'frost' ? '180,230,255' : f.kind === 'fire' ? '255,150,40' : f.kind === 'spore' ? '200,150,255' : f.kind === 'star' ? '255,230,80' : f.kind === 'clod' ? '120,90,50' : '160,220,90';
          c.fillStyle = 'rgba(' + col + ',' + (1 - k) + ')';
          for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + f.x; c.beginPath(); c.arc(f.x + Math.cos(a) * k * 14, f.y + Math.sin(a) * k * 14, 3 * (1 - k) + 1, 0, TAU); c.fill(); }
          break;
        }
        case 'splat': {
          c.fillStyle = 'rgba(140,110,60,' + (1 - k) * 0.8 + ')';
          if (f.kind === 'icedurian') c.fillStyle = 'rgba(180,230,255,' + (1 - k) + ')';
          if (f.kind === 'sap') c.fillStyle = 'rgba(255,220,100,' + (1 - k) + ')';
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.arc(f.x + Math.cos(a) * k * 20, f.y + Math.sin(a) * k * 10, 4 * (1 - k) + 1, 0, TAU); c.fill(); }
          break;
        }
        case 'dirt': {
          c.fillStyle = 'rgba(110,80,40,' + (1 - k) + ')';
          for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; c.beginPath(); c.arc(f.x + Math.cos(a) * k * 26, f.y - 6 + Math.sin(a) * k * 20, 4, 0, TAU); c.fill(); }
          break;
        }
        case 'splash': {
          c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(f.x, f.y - 4, 10 + k * (f.big ? 40 : 24), 3 + k * 8, 0, 0, TAU); c.stroke();
          c.fillStyle = 'rgba(200,240,255,' + (1 - k) + ')';
          for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; c.beginPath(); c.arc(f.x + Math.cos(a) * k * 20, f.y - 6 + Math.sin(a) * k * 30 + k * k * 30, 3, 0, TAU); c.fill(); }
          break;
        }
        case 'boom': {
          const s = f.s || 1;
          const rr = (20 + k * 70) * s;
          c.fillStyle = 'rgba(255,' + Math.floor(200 - k * 150) + ',40,' + (1 - k) + ')';
          c.beginPath(); c.arc(f.x, f.y, rr, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,200,' + Math.max(0, 1 - k * 2) + ')';
          c.beginPath(); c.arc(f.x, f.y, rr * 0.5, 0, TAU); c.fill();
          c.fillStyle = 'rgba(60,50,40,' + (1 - k) * 0.6 + ')';
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.arc(f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr * 0.6, 12 * s * (1 - k * 0.5), 0, TAU); c.fill(); }
          break;
        }
        case 'ash': A.ash(c, f.x, f.y, f.s || 1, 1 - k); break;
        case 'firerow': {
          const y = f.y;
          for (let x = this.GX - 20; x < SS.W; x += 22) {
            const h = (40 + Math.sin(x * 0.3 + f.t * 20) * 14) * (1 - k * 0.7);
            c.fillStyle = 'rgba(255,' + Math.floor(120 + Math.sin(x) * 60) + ',20,' + (1 - k) + ')';
            c.beginPath(); c.moveTo(x - 14, y); c.quadraticCurveTo(x - 6, y - h * 0.6, x, y - h); c.quadraticCurveTo(x + 6, y - h * 0.6, x + 14, y); c.fill();
          }
          break;
        }
        case 'freeze': c.fillStyle = 'rgba(190,240,255,' + (1 - k) * 0.6 + ')'; c.fillRect(0, 0, SS.W, SS.H); break;
        case 'dread': {
          const rr = 40 + k * 220;
          c.fillStyle = 'rgba(60,30,20,' + (1 - k) * 0.8 + ')'; c.beginPath(); c.arc(f.x, f.y, rr, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,90,30,' + (1 - k) + ')'; c.beginPath(); c.arc(f.x, f.y - k * 120, 40 + k * 60, 0, TAU); c.fill();
          c.fillRect(f.x - 14, f.y - k * 120, 28, k * 120);
          break;
        }
        case 'fume': {
          for (let i = 0; i < 7; i++) {
            const x = f.x + (i / 7) * f.len * Math.min(1, k * 2.5);
            c.fillStyle = 'rgba(170,120,220,' + (1 - k) * 0.55 + ')';
            c.beginPath(); c.arc(x, f.y + Math.sin(i * 2 + f.t * 10) * 6, 12 + i * 1.5, 0, TAU); c.fill();
          }
          break;
        }
        case 'gloom': {
          c.strokeStyle = 'rgba(150,90,200,' + (1 - k) + ')'; c.lineWidth = 10 * (1 - k);
          c.beginPath(); c.ellipse(f.x, f.y, 30 + k * 100, 20 + k * 80, 0, 0, TAU); c.stroke();
          break;
        }
        case 'debris': {
          const t = f.t;
          const x = f.x + f.vx * t, y = f.y + f.vy * t + 400 * t * t;
          c.save(); c.globalAlpha = 1 - k; this.drawItem(c, f.look, x, Math.min(y, f.y + 90), 0.8); c.restore();
          break;
        }
        case 'pop': c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(f.x + Math.cos(a) * 8, f.y + Math.sin(a) * 8); c.lineTo(f.x + Math.cos(a) * (8 + k * 20), f.y + Math.sin(a) * (8 + k * 20)); c.stroke(); } break;
        case 'magnet': {
          const kk = Math.min(1, f.t / 0.5);
          if (kk < 1) this.drawItem(c, f.item, SS.lerp(f.x0, f.x1, kk), SS.lerp(f.y0, f.y1, kk), 0.8);
          break;
        }
        case 'coffee': {
          const y = f.y - 40 + Math.min(1, k * 1.5) * 30;
          A.plant(c, 'wakebean', f.x, y, 0.7, { t: f.t });
          break;
        }
        case 'wind': {
          c.strokeStyle = 'rgba(255,255,255,' + (1 - k) * 0.7 + ')'; c.lineWidth = 3;
          for (let i = 0; i < 14; i++) { const y = this.GY + (i * 47) % (this.rows * this.RH); const x = this.GX + ((i * 131 + f.t * 900) % 800); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y - 4); c.stroke(); }
          break;
        }
        case 'squash': {
          const t = f.t;
          let x, y;
          if (t < 0.55) { const kk = t / 0.55; x = SS.lerp(f.x0, f.x1, kk); y = f.y - Math.sin(kk * Math.PI * 0.5) * 120; }
          else { const kk = Math.min(1, (t - 0.55) / 0.15); x = f.x1; y = f.y - 120 + kk * 120; }
          A.plant(c, 'gourdslam', x, y, this.unitS, { t, squish: t > 0.7 ? 1 : 0, look: 0, mimic: f.mimic });
          break;
        }
        case 'kelp': break;
        case 'text': break;
      }
    }
  };
  B.fxLogic = function (f) {
    if (f.type === 'squash' && !f.done && f.t >= 0.7) {
      f.done = true;
      SS.audio.sfx('thud');
      this.shake = 0.3;
      for (const e of this.enemies.slice()) if (e.row === f.r && !e.dying && !e.flying && Math.abs(e.x - f.x1) < 50) this.damage(e, 1800, { kind: 'area' });
    }
  };
  B.drawFog = function (c) {
    const t = this.t;
    for (let r = 0; r < this.rows; r++) for (let col = 0; col < this.cols + 2; col++) {
      const a = col < this.cols ? this.fogA[r][col] : (this.fogClear > 0 ? 0 : 1);
      if (a < 0.02) continue;
      const x = this.GX + col * this.CW, y = this.GY + r * this.RH;
      c.fillStyle = 'rgba(196,204,222,' + a * 0.92 + ')';
      c.fillRect(x, y, this.CW + 1, this.RH + 1);
      c.fillStyle = 'rgba(225,230,240,' + a * 0.5 + ')';
      for (let i = 0; i < 3; i++) {
        const ox = Math.sin(t * 0.3 + r * 1.7 + col * 2.3 + i) * 14;
        c.beginPath(); c.arc(x + 20 + i * 22 + ox, y + 30 + ((i * 37 + col * 13) % 40), 24, 0, TAU); c.fill();
      }
    }
  };
  B.drawStorm = function (c) {
    if (this.stormT === undefined) { this.stormT = 3; this.stormFlash = 0; }
    const x0 = this.GX + 2 * this.CW;
    const a = SS.clamp(0.93 - this.stormFlash, 0, 0.93);
    c.fillStyle = 'rgba(8,10,22,' + a + ')';
    c.fillRect(x0, this.GY - 20, SS.W - x0, this.rows * this.RH + 40);
    const g = c.createLinearGradient(x0 - 80, 0, x0, 0);
    g.addColorStop(0, 'rgba(8,10,22,0)'); g.addColorStop(1, 'rgba(8,10,22,' + a + ')');
    c.fillStyle = g; c.fillRect(x0 - 80, this.GY - 20, 80, this.rows * this.RH + 40);
  };
  B.updateStorm = function (dt) {
    if (!this.level.storm) return;
    if (this.stormT === undefined) { this.stormT = 3; this.stormFlash = 0; }
    this.stormT -= dt;
    this.stormFlash = Math.max(0, this.stormFlash - dt * 0.55);
    if (this.stormT <= 0) { this.stormT = SS.rand(3, 7); this.stormFlash = 1; SS.audio.sfx('zap'); }
  };
  B.drawPickups = function (c) {
    for (const p of this.pickups) {
      const fade = !p.collecting && p.life && p.age > p.life - 2 ? 0.4 + 0.6 * Math.abs(Math.sin(p.age * 8)) : 1;
      c.globalAlpha = fade;
      if (p.kind === 'sun') A.sun(c, p.x, p.y, p.val, p.age);
      else if (p.kind === 'coin') A.coin(c, p.x, p.y, p.coin, p.age);
      else if (p.kind === 'sprout') A.sprout(c, p.x, p.y, 0.9);
      else if (p.kind === 'seed') { A.packet(c, p.x - 25, p.y - 34, 50, 68, p.id, {}); }
      else if (p.kind === 'reward') this.drawReward(c, p);
      c.globalAlpha = 1;
    }
  };
  B.drawReward = function (c, p) {
    const rw = p.reward;
    const glow = 0.5 + 0.5 * Math.sin(p.age * 4);
    let s = 1;
    if (this.state === 'claiming') { const k = Math.min(1, this.claimT / 2.4); s = 1 + k * 1.2; p.x = SS.lerp(p.x, SS.W / 2, 0.04); p.y = SS.lerp(p.y, SS.H / 2, 0.04); }
    c.save();
    c.translate(p.x, p.y); c.scale(s, s);
    c.fillStyle = 'rgba(255,250,200,' + (0.25 + glow * 0.25) + ')';
    c.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + p.age * 0.6; c.moveTo(0, 0); c.arc(0, 0, 70, a, a + 0.18); }
    c.fill();
    if (rw.plant) A.packet(c, -28, -38, 56, 76, rw.plant, {});
    else if (rw.item === 'shovel') this.drawShovelIcon(c, 0, 0, 1.4);
    else if (rw.trophy || rw.unlock === 'credits') A.trophy(c, 0, 18, 1.6);
    else if (rw.survival) A.trophy(c, 0, 18, 1.6);
    else A.moneybag(c, 0, 0, 1.6);
    c.restore();
    if (this.state === 'claiming') { const k = Math.max(0, (this.claimT - 1.4) / 1.0); c.fillStyle = 'rgba(255,255,255,' + Math.min(1, k) + ')'; c.fillRect(0, 0, SS.W, SS.H); }
  };
  B.drawShovelIcon = function (c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(0.6);
    c.fillStyle = '#7a5a2a'; c.fillRect(-3, -26, 6, 30);
    c.fillStyle = '#5a3a1a'; c.fillRect(-8, -30, 16, 6);
    c.beginPath(); c.moveTo(-11, 4); c.lineTo(11, 4); c.lineTo(9, 18); c.quadraticCurveTo(0, 28, -9, 18); c.closePath();
    c.fillStyle = A.lgrad(c, -11, 0, 11, 0, '#d8dce2', '#7a8088'); c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a2a2a'; c.stroke();
    c.restore();
  };

  // ---------- HUD ----------
  B.hudBank = function () { return { x: 6, y: 4, w: 82, h: 84 }; };
  B.packetRect = function (i) { return { x: 92 + i * 60, y: 6, w: 56, h: 78 }; };
  B.shovelRect = function () { const n = this.belt ? 11 : Math.max(this.deck.length, 1); return { x: Math.min(92 + n * 60 + 8, 780), y: 6, w: 70, h: 66 }; };
  B.drawHud = function (c) {
    const showSun = !this.belt && !this.mode.hideSun;
    // bank backdrop
    const n = this.belt ? 11 : this.deck.length;
    const bw = this.belt ? 690 : 92 + n * 60 - 2;
    ui.rrect(c, 2, 2, bw, 88, 10);
    c.fillStyle = 'rgba(92,58,24,0.92)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2008'; c.stroke();
    if (showSun) {
      ui.rrect(c, 8, 8, 78, 76, 8); c.fillStyle = '#f2e2b0'; c.fill();
      A.sun(c, 47, 34, 25, this.t);
      ui.rrect(c, 14, 60, 66, 20, 6); c.fillStyle = '#fff8e0'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#6b4a1e'; c.stroke();
      ui.text(c, String(this.sun), 47, 71, { size: 16, color: '#2a1a08' });
      if (this.sunFlash > 0) { this.sunFlash -= 1 / 60; ui.rrect(c, 14, 60, 66, 20, 6); c.fillStyle = 'rgba(255,0,0,' + this.sunFlash + ')'; c.fill(); }
    } else if (this.belt) {
      // conveyor belt
      ui.rrect(c, 8, 8, 680, 76, 8); c.fillStyle = '#3a3a3a'; c.fill();
      c.fillStyle = '#555';
      for (let x = 12 + ((-this.t * 70) % 20 + 20) % 20; x < 684; x += 20) c.fillRect(x, 12, 6, 68);
      if (this.mode.beltLabel) ui.text(c, this.mode.beltLabel, 48, 46, { size: 12, color: '#ddd' });
    } else if (this.mode.drawBank) this.mode.drawBank(this, c);
    // packets
    if (this.belt) {
      this.belt.items.forEach((it, i) => {
        const sel = this.sel && this.sel.type === 'belt' && this.sel.i === i;
        const x = it.x;
        if (it.id.startsWith('bowl')) this.mode.drawBowlPacket(this, c, x, 10, 56, 72, it.id, sel);
        else A.packet(c, x, 10, 56, 72, it.id, { sel });
      });
    } else if (!this.mode.hideDeck) {
      this.deck.forEach((d, i) => {
        const r = this.packetRect(i);
        const cost = this.costOf(d.id);
        const sel = this.sel && this.sel.type === 'deck' && this.sel.i === i;
        A.packet(c, r.x, r.y, r.w, r.h, d.id, { cost, mimic: d.mimic, sel, dark: this.sun < cost, cdf: d.cd > 0 ? d.cd / d.cdMax : 0 });
        if (ui.hover(r.x, r.y, r.w, r.h) && !this.sel) this.tip = { id: d.id, x: r.x + r.w / 2, y: r.y + r.h + 4 };
      });
    }
    // hand (vase / seed rain without belt)
    if (this.hand.length) {
      this.hand.forEach((h, i) => {
        const x = 92 + i * 60;
        const sel = this.sel && this.sel.type === 'hand' && this.sel.i === i;
        A.packet(c, x, 6, 56, 78, h.id, { sel });
      });
    }
    // shovel
    if (SS.save.shovel && !this.mode.noShovel) {
      const r = this.shovelRect();
      ui.rrect(c, r.x, r.y, r.w, r.h, 8); c.fillStyle = '#b89a5a'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2008'; c.stroke();
      ui.rrect(c, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 6); c.fillStyle = '#7a5a2a'; c.fill();
      if (!(this.sel && this.sel.type === 'shovel')) this.drawShovelIcon(c, r.x + r.w / 2, r.y + r.h / 2, 1);
      if (this.sel && this.sel.type === 'shovel') { ui.rrect(c, r.x, r.y, r.w, r.h, 8); c.strokeStyle = '#fff36a'; c.lineWidth = 3; c.stroke(); }
    }
    // menu & speed
    if (ui.button(c, 900, 6, 92, 32, 'Menu', { color: '#7a9a3a', size: 16 })) this.paused = true;
    if (ui.button(c, 900, 42, 92, 28, (SS.save.settings.speed === 2 ? 'Speed x2' : 'Speed x1'), { color: SS.save.settings.speed === 2 ? '#c88a2a' : '#6a7a5a', size: 13 })) { SS.save.settings.speed = SS.save.settings.speed === 2 ? 1 : 2; SS.persist(); }
    // progress
    this.drawProgress(c);
    // coins
    if (this.coinShow > 0 || this.mode.showCoins) {
      ui.rrect(c, 8, SS.H - 40, 140, 32, 8); c.fillStyle = 'rgba(40,30,10,0.75)'; c.fill();
      A.coin(c, 30, SS.H - 24, 'gold', 0);
      ui.text(c, '$' + SS.fmt(SS.save.coins), 90, SS.H - 23, { size: 16, color: '#ffe680' });
    }
    // tooltip
    if (this.tip) {
      const d = SS.PLANTS[this.tip.id];
      c.font = 'bold 13px "Trebuchet MS",Verdana,sans-serif';
      const w = Math.max(c.measureText(d.name).width, 150) + 16;
      const x = SS.clamp(this.tip.x - w / 2, 4, SS.W - w - 4);
      ui.rrect(c, x, this.tip.y, w, 52, 6); c.fillStyle = 'rgba(255,250,225,0.96)'; c.fill(); c.strokeStyle = '#6b4a1e'; c.lineWidth = 2; c.stroke();
      ui.text(c, d.name, x + w / 2, this.tip.y + 13, { size: 13, color: '#2a1a08' });
      c.font = '11px "Trebuchet MS",Verdana,sans-serif';
      ui.wrap(c, d.desc, x + 6, this.tip.y + 24, w - 12, 13, { size: 11, color: '#4a3a20' });
      this.tip = null;
    }
  };
  B.drawProgress = function (c) {
    const x = 770, y = SS.H - 28, w = 210, h = 18;
    let title = this.level.title;
    if (this.opts.survival) title += '  •  Round ' + ((this.opts.round || 0) + 1) + (this.level.endless ? '' : '/' + this.level.rounds);
    if (this.level.mode === 'laststand') title += '  •  Round ' + ((this.round || 0) + 1) + '/' + (this.totalRounds || 5);
    if (this.level.vase === 'endless') title += '  •  Rooms cleared: ' + (this.streak || 0);
    ui.text(c, title, x - 8, y + h / 2, { size: 15, align: 'right', color: '#fff8d8', stroke: '#2a1a08', sw: 4 });
    if (!this.totalWaves || this.mode.noProgress) return;
    ui.rrect(c, x, y, w, h, 8); c.fillStyle = 'rgba(40,30,10,0.75)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a1a08'; c.stroke();
    const k = SS.clamp(this.wave / this.totalWaves, 0, 1);
    ui.rrect(c, x + 3, y + 3, Math.max(0, (w - 6) * k), h - 6, 5); c.fillStyle = '#8ad04a'; c.fill();
    for (let i = 1; i <= this.totalWaves; i++) {
      if (!this.isHuge(i)) continue;
      const fx = x + w - (w - 6) * (i / this.totalWaves) + 0;
      const fx2 = x + 3 + (w - 6) * (i / this.totalWaves);
      c.beginPath(); c.moveTo(fx2, y - 10); c.lineTo(fx2, y + 4); c.lineWidth = 2; c.strokeStyle = '#3a2008'; c.stroke();
      c.beginPath(); c.moveTo(fx2, y - 10); c.lineTo(fx2 + 12, y - 6); c.lineTo(fx2, y - 2); c.fillStyle = this.wave >= i ? '#c83a2a' : '#6a8a3a'; c.fill();
    }
    // head marker
    const hx = x + 3 + (w - 6) * k;
    c.save(); c.translate(hx, y + 9); c.scale(0.7, 0.7);
    A.rotterHead(c, { state: 'walk', anim: this.t, dying: 0 }, 0, 0, 1, {});
    c.restore();
  };
  B.drawMessages = function (c) {
    const m = this.msg;
    if (m) {
      const k = m.t / m.life;
      const a = k < 0.1 ? k / 0.1 : k > 0.8 ? (1 - k) / 0.2 : 1;
      c.globalAlpha = a;
      const sz = m.big ? 54 + Math.sin(m.t * 10) * 2 : 26;
      ui.text(c, m.text, SS.W / 2, SS.H / 2 - 10, { size: sz, color: m.col || '#fff', stroke: '#2a0a00', sw: 6 });
      c.globalAlpha = 1;
    }
    if (this.tipBox) this.drawTipBox(c);
    if (this.paused) this.drawPause(c);
    if (this.state === 'lost') this.drawLose(c);
  };
  B.drawTipBox = function (c) {
    const tb = this.tipBox;
    const x = 200, y = SS.H - 150, w = 600, h = 110;
    ui.panel(c, x, y, w, h, { top: '#fff6d8', bot: '#efdcae' });
    // Mabel portrait
    c.save(); c.translate(x + 50, y + h - 8);
    SS.art.mabel(c, 0, 0, 0.9, this.t);
    c.restore();
    ui.text(c, 'Mabel', x + 50, y + 16, { size: 14, color: '#6b4a1e' });
    ui.wrap(c, tb.lines[tb.i], x + 104, y + 16, w - 130, 21, { size: 17, color: '#2a1a08' });
    ui.text(c, tb.i < tb.lines.length - 1 ? 'Click to continue' : 'Click to start', x + w - 70, y + h - 14, { size: 12, color: '#8a6a3a', bold: false });
  };
  B.drawPause = function (c) {
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, SS.W, SS.H);
    const x = 320, y = 130, w = 360, h = 380;
    ui.panel(c, x, y, w, h);
    ui.text(c, 'Paused', SS.W / 2, y + 36, { size: 30, color: '#3a2008' });
    const st = SS.save.settings;
    const slider = (label, key, yy) => {
      ui.text(c, label, x + 40, yy, { size: 16, align: 'left', color: '#3a2008' });
      ui.rrect(c, x + 150, yy - 7, 140, 14, 7); c.fillStyle = '#8a6a3a'; c.fill();
      ui.rrect(c, x + 150, yy - 7, 140 * st[key], 14, 7); c.fillStyle = '#7ac040'; c.fill();
      if (SS.input.down && ui.hover(x + 145, yy - 14, 150, 28)) { st[key] = SS.clamp((SS.input.x - x - 150) / 140, 0, 1); SS.audio.applyVolume(); }
    };
    slider('Music', 'music', y + 86);
    slider('Sound', 'sfx', y + 120);
    if (ui.button(c, x + 40, y + 146, 280, 34, 'Auto-collect sun: ' + (st.autoSun ? 'ON' : 'OFF'), { color: '#6a8aa8', size: 15 })) { st.autoSun = !st.autoSun; }
    if (ui.button(c, x + 40, y + 196, 280, 44, 'Resume', { size: 20 })) { this.paused = false; SS.persist(); }
    if (ui.button(c, x + 40, y + 250, 280, 44, 'Restart Level', { color: '#c88a2a', size: 20 })) { SS.persist(); SS.startLevel(this.level, { restart: true, from: this.opts }); }
    if (ui.button(c, x + 40, y + 304, 280, 44, 'Main Menu', { color: '#a8583a', size: 20 })) { SS.persist(); SS.goMenu(); }
    if (SS.input.click) SS.input.consume();
  };
  B.drawLose = function (c) {
    const k = Math.min(1, this.loseT / 1.2);
    c.fillStyle = 'rgba(20,5,0,' + k * 0.7 + ')'; c.fillRect(0, 0, SS.W, SS.H);
    if (this.loseT > 0.5) {
      const s = 1 + Math.max(0, 1.4 - this.loseT) * 0.4;
      c.save(); c.translate(SS.W / 2, 220); c.scale(s, s);
      ui.text(c, 'THE ROTTERS', 0, -30, { size: 52, color: '#a8d84a', stroke: '#1a2a08', sw: 8 });
      ui.text(c, 'GOT INTO THE HOUSE!', 0, 30, { size: 40, color: '#a8d84a', stroke: '#1a2a08', sw: 7 });
      c.restore();
    }
    if (this.loseT > 1.6) {
      if (ui.button(c, 330, 360, 160, 50, 'Try Again', { size: 20 })) SS.startLevel(this.level, { restart: true, from: this.opts });
      if (ui.button(c, 510, 360, 160, 50, 'Main Menu', { color: '#a8583a', size: 20 })) SS.goMenu();
    }
    if (SS.input.click) SS.input.consume();
  };
  B.drawCursor = function (c) {
    const s = this.sel;
    const mx = SS.input.x, my = SS.input.y;
    if (!s || this.paused || this.state === 'lost') return;
    let id = null, mimic = false;
    if (s.type === 'deck') { id = this.deck[s.i].id; mimic = this.deck[s.i].mimic; }
    else if (s.type === 'belt' && this.belt.items[s.i]) id = this.belt.items[s.i].id;
    else if (s.type === 'hand' && this.hand[s.i]) id = this.hand[s.i].id;
    if (s.type === 'shovel') {
      const r = this.rowAt(mx, my), col = this.colAt(mx);
      const p = r >= 0 ? this.topPlantAt(r, col) : null;
      if (p) { c.save(); c.globalAlpha = 0.35; c.fillStyle = '#fff'; c.fillRect(this.cx(col) - 36, this.plantY(this.tiles[r][col]) - 70, 72, 72); c.restore(); }
      this.drawShovelIcon(c, mx + 10, my - 14, 1.1);
      return;
    }
    if (s.type === 'cob') {
      c.beginPath(); c.arc(mx, my, 30, 0, TAU); c.moveTo(mx - 40, my); c.lineTo(mx + 40, my); c.moveTo(mx, my - 40); c.lineTo(mx, my + 40);
      c.strokeStyle = 'rgba(255,40,30,0.85)'; c.lineWidth = 2.5; c.stroke();
      return;
    }
    if (s.type === 'mallet') return;
    if (!id) return;
    if (id.startsWith('bowl')) { this.mode.drawBowlGhost && this.mode.drawBowlGhost(this, c, id, mx, my); return; }
    const r = this.rowAt(mx, my), col = this.colAt(mx);
    if (r >= 0 && col >= 0 && col < this.cols) {
      const rows = this.level.column ? this.lanes : [r];
      for (const rr of rows) {
        if (this.canPlace(id, rr, col)) {
          const t = this.tiles[rr][col];
          c.save(); c.globalAlpha = 0.45;
          const def = SS.PLANTS[id];
          let y = this.plantY(t);
          if (def.platform === 'pot') y = this.groundY(rr, this.cx(col));
          A.plant(c, id, this.cx(col), y, this.unitS, { t: this.t, mimic, armed: true });
          c.restore();
        }
      }
    }
    c.save(); c.globalAlpha = 0.9;
    A.plant(c, id, mx, my + 34, this.unitS * 0.9, { t: this.t, mimic, armed: true });
    c.restore();
  };

  // ---------- input ----------
  B.handleInput = function () {
    const inp = SS.input;
    if (this.paused || this.state === 'lost') return;
    if (this.tipBox) {
      if (inp.click) { inp.consume(); this.tipBox.i++; if (this.tipBox.i >= this.tipBox.lines.length) { this.tipBox = null; this.tipPause = false; } }
      return;
    }
    if (inp.pressed.Escape || inp.pressed.p) { if (this.sel) this.sel = null; else this.paused = true; }
    if (inp.rclick) { this.sel = null; }
    if (this.state === 'claiming') return;
    // hotkeys
    for (let i = 0; i < 10; i++) {
      const k = String((i + 1) % 10);
      if (inp.pressed[k] && this.deck[i] && !this.belt) this.selectDeck(i);
    }
    if ((inp.pressed.s || inp.pressed.S) && SS.save.shovel && !this.mode.noShovel) this.sel = this.sel && this.sel.type === 'shovel' ? null : { type: 'shovel' };
    this.hoverCoins(inp.x, inp.y);
    const ck = inp.click;
    if (!ck) return;
    const x = ck.x, y = ck.y;
    // pickups first
    if (this.clickPickup(x, y)) { inp.consume(); return; }
    if (this.state !== 'play' && this.state !== 'won') { inp.consume(); return; }
    // top bar
    if (y < 92) {
      inp.consume();
      if (this.belt) {
        for (let i = this.belt.items.length - 1; i >= 0; i--) {
          const it = this.belt.items[i];
          if (x >= it.x && x <= it.x + 56 && y >= 10 && y <= 82) { this.sel = this.sel && this.sel.type === 'belt' && this.sel.i === i ? null : { type: 'belt', i }; SS.audio.sfx('pick'); return; }
        }
      } else if (this.hand.length) {
        const i = Math.floor((x - 92) / 60);
        if (i >= 0 && i < this.hand.length) { this.sel = this.sel && this.sel.type === 'hand' && this.sel.i === i ? null : { type: 'hand', i }; SS.audio.sfx('pick'); return; }
      } else if (!this.mode.hideDeck) {
        const i = Math.floor((x - 92) / 60);
        if (i >= 0 && i < this.deck.length && x >= 92) { this.selectDeck(i); return; }
      }
      const sr = this.shovelRect();
      if (SS.save.shovel && !this.mode.noShovel && x >= sr.x && x <= sr.x + sr.w && y <= sr.y + sr.h) { this.sel = this.sel && this.sel.type === 'shovel' ? null : { type: 'shovel' }; SS.audio.sfx('pick'); return; }
      if (this.mode.onBankClick) this.mode.onBankClick(this, x, y);
      return;
    }
    inp.consume();
    const r = this.rowAt(x, y), col = this.colAt(x);
    if (this.mode.onLawnClick && this.mode.onLawnClick(this, x, y, r, col)) return;
    const s = this.sel;
    if (s && s.type === 'cob') { if (this.fireCob(s.p, x, y)) this.sel = null; return; }
    if (r < 0 || col < 0 || col >= this.cols) { this.sel = null; return; }
    if (s && s.type === 'shovel') {
      const p = this.topPlantAt(r, col);
      if (p) { this.removePlant(p); SS.audio.sfx('shovel'); this.fx.push({ type: 'dirt', x: this.cx(col), y: this.plantY(this.tiles[r][col]), t: 0, life: 0.4 }); }
      this.sel = null;
      return;
    }
    if (s) {
      if (s.type === 'belt' && this.belt.items[s.i] && this.belt.items[s.i].id.startsWith('bowl')) { this.mode.placeBowl(this, r, col); return; }
      this.tryPlantFromSel(r, col);
      return;
    }
    // click on a ready oak mortar
    const tp = this.tile(r, col);
    if (tp && tp.plant && tp.plant.def.kind === 'cob' && tp.plant.st.ready) { this.sel = { type: 'cob', p: tp.plant }; SS.audio.sfx('pick'); }
  };
  B.selectDeck = function (i) {
    const d = this.deck[i];
    if (this.sel && this.sel.type === 'deck' && this.sel.i === i) { this.sel = null; return; }
    if (d.cd > 0) { SS.audio.sfx('cancel'); return; }
    if (this.sun < this.costOf(d.id)) { SS.audio.sfx('cancel'); this.sunFlash = 1; return; }
    this.sel = { type: 'deck', i };
    SS.audio.sfx('pick');
  };

  // ---------- scene wrapper ----------
  SS.BattleScene = function (level, deck, opts) {
    const b = new SS.Battle(level, deck, opts);
    const music = { day: 'day', night: 'night', pool: 'pool', fog: 'fog', roof: 'roof', roofnight: 'night' }[level.scene] || 'day';
    const sc = {
      b,
      enter() {
        SS.audio.music(level.mode === 'boss' ? 'boss' : music);
        SS.fade = 1;
        const tipKey = level.tut;
        if (tipKey && SS.TIPS[tipKey] && !SS.save.seen['tip_' + tipKey]) {
          b.tipBox = { lines: SS.TIPS[tipKey], i: 0 };
          SS.save.seen['tip_' + tipKey] = true;
          SS.persist();
        }
      },
      update(dt) {
        if (b.paused || b.tipBox) return;
        if (b.state === 'claiming') { b.claimT += dt; b.t += dt; if (b.claimT > 2.6 && !b.claimDone) { b.claimDone = true; SS.finishLevel(b); } return; }
        const n = SS.save.settings.speed === 2 ? 2 : 1;
        for (let i = 0; i < n; i++) { b.update(dt); b.updateStorm(dt); }
      },
      draw(c) {
        b.draw(c);
        b.handleInput();
      },
    };
    return sc;
  };
})();
