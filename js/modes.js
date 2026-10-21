// Sprout Siege — special game modes: conveyor, bowling, bonk, little, urns, blitz, boss, commander, last stand, seed rain, stars, survival
(function () {
  const SS = window.SS;
  const A = SS.art, ui = SS.ui;
  const M = (SS.MODES = {});
  M.normal = {};
  M.conveyor = {};

  // ---------- Barkshell Bowling ----------
  M.bowling = {
    noShovel: true,
    beltLabel: '',
    setup(b) {
      b.belt = { items: [], timer: 1, every: 3.4 };
      b.lineX = b.GX + 3 * b.CW;
    },
    beltPool(b) { return b.wave > 4 ? { bowl: 6, bowlboom: 1.2, bowlbig: 0.8 } : { bowl: 7, bowlboom: 1 }; },
    canPlace() { return false; },
    drawUnder(b, c) {
      c.save(); c.strokeStyle = '#d82a1a'; c.lineWidth = 4; c.setLineDash([12, 8]);
      c.beginPath(); c.moveTo(b.lineX, b.GY); c.lineTo(b.lineX, b.GY + b.rows * b.RH); c.stroke(); c.restore();
    },
    placeBowl(b, r, col) {
      const it = b.belt.items[b.sel.i];
      if (!it || col > 2 || b.isWater(r) || !b.laneOk(r)) { SS.audio.sfx('cancel'); return; }
      b.belt.items.splice(b.sel.i, 1);
      b.sel = null;
      SS.audio.sfx('plant');
      const x = b.cx(col);
      b.projs.push({ type: 'bowl', kind: it.id, row: r, x, y: b.gy(r), vx: 190, toRow: r, ry: b.gy(r), dirY: SS.rng() < 0.5 ? -1 : 1, hits: 0, rot: 0, hitSet: new Set() });
    },
    stepBowl(b, pr, dt) {
      pr.x += pr.vx * dt;
      pr.rot += dt * (pr.kind === 'bowlbig' ? 4 : 8);
      const ty = b.gy(pr.toRow);
      if (Math.abs(pr.ry - ty) > 1) { pr.ry += Math.sign(ty - pr.ry) * Math.min(Math.abs(ty - pr.ry), 200 * dt); } else { pr.ry = ty; pr.row = pr.toRow; }
      pr.y = pr.ry;
      if (pr.x > SS.W + 40) { pr.dead = true; return; }
      for (const e of b.enemies) {
        if (e.dying || pr.hitSet.has(e) || e.row !== pr.row || Math.abs(e.x - pr.x) > e.hw + 22) continue;
        if (!b.canHit(e, 'straight')) continue;
        if (pr.kind === 'bowlboom') {
          SS.audio.sfx('boom'); b.shake = 0.5;
          b.fx.push({ type: 'boom', x: pr.x, y: pr.y - 30, t: 0, life: 0.8, s: 1.2 });
          b.areaDamage(pr.row - 1, pr.row + 1, pr.x - b.CW * 1.5, pr.x + b.CW * 1.5, 1800, { kind: 'area', char: true });
          pr.dead = true; return;
        }
        pr.hitSet.add(e);
        pr.hits++;
        SS.audio.sfx('wood');
        b.damage(e, pr.kind === 'bowlbig' ? 3000 : 520, { kind: 'area' });
        if (pr.hits >= 2) { b.addCoin(pr.x, pr.y - 40, pr.hits >= 4 ? 'gold' : 'silver'); b.floatText(pr.hits + 'x combo!', pr.x, pr.y - 70, '#ffe14a'); }
        if (pr.kind === 'bowlbig') continue;
        // ricochet into a neighbouring lane
        let nr = pr.row + pr.dirY;
        if (!b.laneOk(nr) || b.isWater(nr)) { pr.dirY *= -1; nr = pr.row + pr.dirY; }
        if (!b.laneOk(nr) || b.isWater(nr)) nr = pr.row;
        pr.toRow = nr;
        pr.hitSet = new Set([e]);
        return;
      }
    },
    drawBowl(b, c, pr) {
      const s = (pr.kind === 'bowlbig' ? 1.8 : 1) * b.unitS;
      c.save(); c.translate(pr.x, pr.y - 28 * s); c.rotate(pr.rot);
      A.ell(c, 0, 0, 28 * s, 28 * s, A.rgrad(c, 0, 0, 28 * s, pr.kind === 'bowlboom' ? '#e87a5a' : '#c8945a', pr.kind === 'bowlboom' ? '#7a2010' : '#6a4018'));
      c.strokeStyle = 'rgba(40,20,5,0.6)'; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, (8 + i * 7) * s, 0, Math.PI * 2); c.stroke(); }
      c.restore();
    },
    drawBowlPacket(b, c, x, y, w, h, id, sel) {
      ui.rrect(c, x, y, w, h, 6); c.fillStyle = id === 'bowlboom' ? '#f2c8b8' : '#f6edc8'; c.fill(); c.lineWidth = 2; c.strokeStyle = sel ? '#fff36a' : '#6b4a1e'; c.stroke();
      const s = id === 'bowlbig' ? 0.75 : 0.6;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      A.plant(c, 'barkshell', x + w / 2, y + h - 12, s, { t: 0.7 });
      if (id === 'bowlboom') { c.fillStyle = 'rgba(220,40,20,0.35)'; c.fillRect(x, y, w, h); }
      c.restore();
      ui.text(c, id === 'bowlbig' ? 'BIG' : id === 'bowlboom' ? 'BOOM' : '', x + w / 2, y + h - 8, { size: 11, color: '#7a1a08' });
    },
    drawBowlGhost(b, c, id, mx, my) {
      c.save(); c.globalAlpha = 0.8;
      A.plant(c, 'barkshell', mx, my + 30, id === 'bowlbig' ? 1.3 : 0.8, { t: 0 });
      c.restore();
    },
  };

  // ---------- Bonk the Rotters ----------
  M.whack = {
    noShovel: true,
    setup(b) {
      b.belt = { items: [], timer: 6, every: 7 };
      b.levelConveyor = true;
    },
    beltPool() { return { rootdigger: 3, frostcap: 1, boomberry: 1, sporepuff: 2 }; },
    spawnPos(b, id) {
      const graves = [];
      for (const row of b.tiles) for (const t of row) if (t.grave && !t.disabled) graves.push(t);
      if (!graves.length || id === 'banner') return null;
      const t = SS.pick(graves);
      return { r: t.r, x: b.cx(t.c) + SS.rand(-6, 6), o: { rise: 1 + SS.rand(0, 1.5) } };
    },
    update(b, dt) {
      b.whackT = (b.whackT || 0) - dt;
      if (b.whackAnim > 0) b.whackAnim -= dt;
      if (b.whackT <= 0 && b.wave > 0 && b.state === 'play' && b.wave < b.totalWaves) {
        b.whackT = SS.rand(2.5, 4.5) - b.wave * 0.1;
        const pos = M.whack.spawnPos(b, 'rotter');
        if (pos) b.spawnEnemy(SS.pick(['rotter', 'rotter', 'crate', 'kettle']), pos.r, pos.x, pos.o);
      }
    },
    onLawnClick(b, x, y) {
      if (b.sel && b.sel.type !== 'mallet') return false;
      b.whackAnim = 0.2; b.whackX = x; b.whackY = y;
      let best = null;
      for (const e of b.enemies) {
        if (e.dying) continue;
        const top = e.y - 110 * e.scale + (e.rise > 0 ? e.rise * 100 : 0);
        if (Math.abs(e.x - x) < 30 && y > top && y < e.y + 10) { if (!best || e.y > best.y) best = e; }
      }
      SS.audio.sfx('bonk');
      if (best) { best.rise = Math.min(best.rise || 0, 0.4); b.damage(best, 700, { kind: 'area' }); b.fx.push({ type: 'pop', x, y, t: 0, life: 0.3 }); }
      return true;
    },
    drawOver(b, c) {
      if (b.sel) return;
      const x = SS.input.x, y = SS.input.y;
      const k = b.whackAnim > 0 ? 1 : 0;
      c.save(); c.translate(x + 14, y - 10); c.rotate(-0.6 + k * 0.9);
      c.fillStyle = '#7a5a2a'; c.fillRect(-3, -4, 6, 40);
      c.fillStyle = '#c83a2a'; ui.rrect(c, -18, -22, 36, 20, 5); c.fill(); c.strokeStyle = '#2a1a0a'; c.lineWidth = 2; c.stroke();
      c.restore();
    },
  };

  // ---------- Little Rotters ----------
  M.little = {
    onSpawn(b, e) {
      e.scale *= 0.55;
      e.hp = e.maxHp = Math.max(40, Math.round(e.hp * 0.5));
      if (e.helm) { e.helm.hp = e.helm.max = Math.round(e.helm.hp * 0.5); }
      if (e.shield) { e.shield.hp = e.shield.max = Math.round(e.shield.hp * 0.5); }
      e.sp *= 1.35;
    },
  };

  // ---------- Grappler Blitz ----------
  M.blitz = {
    setup(b) { if (!b.level.pots) for (const r of b.lanes) for (let c = 0; c < 2; c++) b.placePlant('claypot', r, c, { silent: true }); },
    waveList(b, list, i) { const n = b.isHuge(i) ? 6 : (i > 2 ? 1 + (i % 3 === 0 ? 1 : 0) : 0); for (let k = 0; k < n; k++) list.push('grappler'); },
  };

  // ---------- Urn Smasher ----------
  const URNS = {
    adv: { plants: ['pippod', 'pippod', 'pippod', 'twinpod', 'barkshell', 'boomberry', 'snapjaw', 'frostpod', 'gasbloom'], enemies: ['rotter', 'rotter', 'rotter', 'rotter', 'crate', 'crate', 'crate', 'kettle', 'vaulter', 'grumbler'], cols: [4, 8], leaf: 2 },
    v1: { plants: ['pippod', 'pippod', 'twinpod', 'twinpod', 'barkshell', 'boomberry', 'snapjaw', 'frostpod', 'gasbloom', 'gasbloom'], enemies: ['rotter', 'rotter', 'rotter', 'crate', 'crate', 'crate', 'kettle', 'kettle', 'vaulter', 'gate', 'grumbler'], cols: [4, 8], leaf: 2 },
    v2: { plants: ['twinpod', 'twinpod', 'frostpod', 'tallbark', 'firepepper', 'boomberry', 'gasbloom', 'gasbloom', 'snapjaw', 'gourdslam', 'pinelobber'], enemies: ['crate', 'crate', 'kettle', 'kettle', 'kettle', 'gate', 'gate', 'brute', 'vaulter', 'jester', 'pogo', 'rotter'], cols: [3, 8], leaf: 3, rot: 1, rotIds: ['brute'] },
    v3: { plants: ['twinpod', 'twinpod', 'quadpod', 'frostpod', 'tallbark', 'firepepper', 'boomberry', 'boomberry', 'gasbloom', 'durianlobber', 'snapjaw', 'gourdslam', 'tubertrap'], enemies: ['crate', 'kettle', 'kettle', 'gate', 'brute', 'brute', 'jester', 'pogo', 'ladder', 'rotter', 'rotter', 'crate'], cols: [3, 8], leaf: 3, rot: 2, rotIds: ['giant'] },
  };
  M.vase = {
    noWaves: true, hideSun: true, noProgress: true,
    setup(b) {
      b.skySun = false;
      b.streak = b.opts.streak || 0;
      this.fill(b);
    },
    fill(b) {
      let cfg = URNS[b.level.vase] || URNS.v1;
      if (b.level.vase === 'endless') {
        const lv = b.streak;
        cfg = lv < 2 ? URNS.v1 : lv < 4 ? URNS.v2 : URNS.v3;
      }
      const spots = [];
      for (const r of b.lanes) for (let c = cfg.cols[0]; c <= cfg.cols[1]; c++) spots.push([r, c]);
      SS.shuffle(spots);
      const contents = [];
      cfg.plants.forEach((id) => contents.push({ kind: 'plant', id }));
      cfg.enemies.forEach((id) => contents.push({ kind: 'enemy', id }));
      SS.shuffle(contents);
      let leaf = cfg.leaf || 0, rot = cfg.rot || 0;
      for (const ct of contents) {
        const sp = spots.pop();
        if (!sp) break;
        let look = 'plain';
        if (ct.kind === 'plant' && leaf > 0) { look = 'leaf'; leaf--; }
        b.tiles[sp[0]][sp[1]].urn = Object.assign({ look }, ct);
      }
      for (let i = 0; i < rot; i++) { const sp = spots.pop(); if (!sp) break; b.tiles[sp[0]][sp[1]].urn = { kind: 'enemy', id: cfg.rotIds[i % cfg.rotIds.length], look: 'rot' }; }
    },
    onLawnClick(b, x, y, r, c) {
      if (b.sel) return false;
      const t = b.tile(r, c);
      if (!t || !t.urn) return false;
      const u = t.urn;
      t.urn = null;
      SS.audio.sfx('urn');
      const py = b.plantY(t);
      b.fx.push({ type: 'dirt', x: b.cx(c), y: py, t: 0, life: 0.5 });
      if (u.kind === 'plant') b.pickups.push({ kind: 'seed', id: u.id, x: b.cx(c), y: py - 40, age: 0, life: 9999, vy: -120, ty: py - 30, vx: 0 });
      else { const e = b.spawnEnemy(u.id, r, b.cx(c) + 10); e.state = 'stun'; e.stunT = 0.6; }
      return true;
    },
    checkWin(b) {
      for (const row of b.tiles) for (const t of row) if (t.urn) return false;
      if (b.pickups.some((p) => p.kind === 'seed')) return false;
      return !b.enemies.some((e) => !e.dying && !e.hypno);
    },
    onCleared(b) {
      if (b.level.vase === 'endless') {
        b.streak++;
        const best = SS.save.puzzle.vaseBest || 0;
        if (b.streak > best) { SS.save.puzzle.vaseBest = b.streak; SS.persist(); }
        b.msg = { text: 'Room ' + b.streak + ' cleared!', t: 0, life: 2.5, col: '#ffe14a' };
        SS.audio.sfx('wave');
        // clear plants, refill
        b.plants.slice().forEach((p) => b.removePlant(p));
        b.hand = [];
        this.fill(b);
        b.state = 'play';
        return true;
      }
      return false;
    },
    drawUrn(b, c, t) {
      const x = b.cx(t.c), y = b.plantY(t);
      const u = t.urn;
      c.save(); c.translate(x, y);
      const col0 = u.look === 'leaf' ? '#9ad070' : u.look === 'rot' ? '#7a5a8a' : '#d8a878';
      const col1 = u.look === 'leaf' ? '#3a7a2a' : u.look === 'rot' ? '#3a2448' : '#8a5a2a';
      c.beginPath(); c.moveTo(-12, -62); c.lineTo(12, -62); c.quadraticCurveTo(12, -50, 22, -40); c.quadraticCurveTo(32, -18, 16, -2); c.lineTo(-16, -2); c.quadraticCurveTo(-32, -18, -22, -40); c.quadraticCurveTo(-12, -50, -12, -62); c.closePath();
      c.fillStyle = A.lgrad(c, -24, 0, 24, 0, col0, col1); c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#2a1a0a'; c.stroke();
      A.ell(c, 0, -62, 13, 4, '#3a2008', '#2a1a0a', 2);
      c.strokeStyle = 'rgba(40,20,5,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-24, -30); c.quadraticCurveTo(0, -24, 24, -30); c.stroke();
      if (u.look === 'leaf') { A.leaf(c, -4, -40, 14, 5, -2.4, '#5cae33'); A.leaf(c, 4, -40, 14, 5, -0.7, '#5cae33'); }
      if (u.look === 'rot') { A.ell(c, -6, -34, 3, 3, '#e83a1a', false); A.ell(c, 6, -34, 3, 3, '#e83a1a', false); }
      c.restore();
    },
  };

  // ---------- The Junk Colossus ----------
  M.boss = {
    noWaves: true, noProgress: true,
    setup(b) {
      b.belt = { items: [], timer: 1, every: 3.6 };
      for (const r of b.lanes) for (let c = 0; c < 2; c++) b.placePlant('claypot', r, c, { free: true, silent: true });
      const e = b.spawnEnemy('boss', 2, b.GX + 8.25 * b.CW);
      e.hp = e.maxHp = 30000;
      e.y = b.GY + b.rows * b.RH - 6;
      e.atkT = 10;
      b.boss = e;
      b.bossHitX = b.GX + 7.4 * b.CW;
      b.balls = [];
    },
    canPlace(b, id, r, c) { if (c >= 7) return false; return undefined; },
    update(b, dt) {
      const e = b.boss;
      if (!e) return;
      e.anim = (e.anim || 0) + dt;
      if (e.flash > 0) e.flash -= dt * 3;
      if (e.defeated) {
        e.deadT += dt;
        if (Math.random() < 0.2) { b.fx.push({ type: 'boom', x: e.x + SS.rand(-110, 90), y: e.y - SS.rand(40, 300), t: 0, life: 0.7, s: SS.rand(0.6, 1.3) }); if (Math.random() < 0.3) SS.audio.sfx('boom'); }
        b.shake = 0.4;
        return;
      }
      if (e.freeze > 0) { e.freeze -= dt; return; }
      e.x = b.GX + 8.25 * b.CW;
      e.atkT -= dt;
      if (e.charge) {
        e.chargeT -= dt;
        if (e.chargeT <= 0) {
          const r = SS.pick(b.lanes);
          b.balls.push({ kind: e.charge, row: r, x: b.GX + 7 * b.CW, rot: 0 });
          SS.audio.sfx(e.charge === 'fire' ? 'fire' : 'freeze');
          e.charge = null;
        }
      } else if (e.atkT <= 0) {
        const hpk = e.hp / e.maxHp;
        e.atkT = SS.rand(7, 10) * (0.6 + 0.4 * hpk);
        const atk = SS.pick(['drop', 'drop', 'grapple', 'ball', 'stomp']);
        if (atk === 'drop') {
          const pool = hpk > 0.6 ? ['rotter', 'crate', 'kettle', 'ladder'] : ['kettle', 'ladder', 'catapult', 'giant', 'brute', 'jester'];
          const n = hpk > 0.5 ? 2 : 3;
          for (let i = 0; i < n; i++) { const z = b.spawnEnemy(SS.pick(pool), SS.pick(b.lanes), b.GX + SS.rand(6.4, 7.0) * b.CW); z.rise = 0.8; }
          SS.audio.sfx('laugh');
        } else if (atk === 'grapple') {
          for (let i = 0; i < 3; i++) b.spawnEnemy('grappler', 0, 0);
        } else if (atk === 'ball') {
          e.charge = SS.rng() < 0.5 ? 'fire' : 'ice'; e.chargeT = 3.2;
        } else if (atk === 'stomp') {
          e.armK = 0.4;
          const c = SS.irand(4, 6);
          for (const r of [SS.pick(b.lanes), SS.pick(b.lanes)]) b.crushTile(r, c, false);
          SS.audio.sfx('thud'); b.shake = 0.8;
          setTimeout(() => { e.armK = 0; }, 400);
        }
      }
      // rolling balls
      for (const bl of b.balls) {
        bl.x -= 45 * dt; bl.rot += dt * 3;
        const c = b.colAt(bl.x - 26);
        if (c >= 0 && c < b.cols) b.crushTile(bl.row, c, false);
        if (bl.x < b.GX - 60) bl.dead = true;
      }
      b.balls = b.balls.filter((q) => !q.dead);
    },
    onFreeze(b) { const n = b.balls.length; b.balls = b.balls.filter((q) => q.kind !== 'fire'); if (b.boss && b.boss.charge === 'fire') b.boss.charge = null; if (n !== b.balls.length) SS.audio.sfx('freeze'); },
    onRowFire(b, r) { b.balls = b.balls.filter((q) => !(q.kind === 'ice' && q.row === r)); if (b.boss && b.boss.charge === 'ice') b.boss.charge = null; },
    bossDamage(b, e, dmg, o) {
      if (e.defeated) return;
      e.hp -= dmg; e.flash = 0.5;
      if (e.hp <= 0) {
        e.hp = 0; e.defeated = true; e.deadT = 0;
        SS.audio.sfx('bigboom');
        for (const z of b.enemies) if (z !== e && !z.dying) b.killEnemy(z, 'char');
        b.balls = [];
      }
    },
    checkWin(b) { return b.boss && b.boss.defeated && b.boss.deadT > 3.5; },
    onCleared(b) { b.enemies = b.enemies.filter((z) => z !== b.boss); b.dropReward(b.GX + 5 * b.CW, b.gy(2)); return true; },
    drawOver(b, c) {
      for (const bl of b.balls) {
        const y = b.groundY(bl.row, bl.x) - 30;
        c.save(); c.translate(bl.x, y); c.rotate(-bl.rot);
        A.ell(c, 0, 0, 32, 32, A.rgrad(c, 0, 0, 32, bl.kind === 'fire' ? '#ffe08a' : '#f0fcff', bl.kind === 'fire' ? '#e83a0a' : '#3a9ad8'), '#2a1a0a', 2);
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 20, 0, 2); c.stroke();
        c.restore();
      }
      const e = b.boss;
      if (!e) return;
      const w = 360, x = SS.W / 2 - w / 2 + 120, y = 96;
      ui.rrect(c, x, y, w, 16, 8); c.fillStyle = 'rgba(30,10,5,0.8)'; c.fill();
      ui.rrect(c, x + 2, y + 2, (w - 4) * (e.hp / e.maxHp), 12, 6); c.fillStyle = '#d83a2a'; c.fill();
      ui.text(c, 'The Junk Colossus', x + w / 2, y + 8, { size: 11, color: '#fff' });
    },
  };

  // ---------- Rot Commander ----------
  const CMD = {
    c1: { sun: 150, cards: [['rotter', 50], ['crate', 75], ['kettle', 125], ['vaulter', 75]], plants: ['pippod', 'pippod', 'glowpetal', 'glowpetal', 'barkshell', 'frostpod', 'tubertrap', 'snapjaw'], cols: 4 },
    c2: { sun: 200, cards: [['rotter', 50], ['crate', 75], ['kettle', 125], ['gate', 100], ['vaulter', 75], ['grumbler', 75]], plants: ['pippod', 'twinpod', 'glowpetal', 'glowpetal', 'barkshell', 'frostpod', 'tubertrap', 'snapjaw', 'gasbloom', 'thornmat'], cols: 5 },
    c3: { sun: 250, cards: [['crate', 75], ['kettle', 125], ['gate', 100], ['brute', 175], ['ladder', 150], ['imp', 50], ['pogo', 200]], plants: ['twinpod', 'pinelobber', 'durianlobber', 'glowpetal', 'glowpetal', 'tallbark', 'barkshell', 'frostpod', 'gasbloom', 'snapjaw', 'thornmat', 'stinkonion'], cols: 5 },
    c4: { sun: 300, cards: [['rotter', 50], ['kettle', 125], ['gate', 100], ['brute', 175], ['ladder', 150], ['imp', 50], ['miner', 125], ['giant', 300], ['jester', 100]], plants: ['twinpod', 'quadpod', 'durianlobber', 'glowpetal', 'glowpetal', 'tallbark', 'tallbark', 'frostpod', 'gloomcap', 'snapjaw', 'stonethorns', 'stinkonion', 'tridentpod', 'lodecap'], cols: 5 },
  };
  M.commander = {
    hideDeck: true, hideSun: true, noShovel: true, noWaves: true, noProgress: true,
    setup(b) {
      const cfg = CMD[b.level.cmd] || CMD.c1;
      b.cmd = cfg;
      b.sun = cfg.sun;
      b.cmdLine = b.GX + 5.5 * b.CW + (cfg.cols === 4 ? -b.CW : 0);
      b.skySun = false;
      b.cmdSel = -1;
      b.vaults = {};
      for (const r of b.lanes) b.vaults[r] = true;
      for (const m of b.mowers) m.state = 'none';
      const rng = SS.mulberry(b.level.cmd.charCodeAt(1) * 97 + 13);
      b.cmdSetup = true;
      for (const r of b.lanes) {
        for (let c = 0; c < cfg.cols; c++) {
          if (rng() < 0.12) continue;
          const id = cfg.plants[Math.floor(rng() * cfg.plants.length)];
          const def = SS.PLANTS[id];
          if (def.upgradeOf && def.upgradeOf !== 'thornmat') { b.placePlant(def.upgradeOf, r, c, { silent: true }); }
          if (id === 'stonethorns') b.placePlant('thornmat', r, c, { silent: true });
          b.placePlant(id, r, c, { silent: true, force: def.upgradeOf ? 'upgrade' : undefined });
        }
      }
      b.cmdSetup = false;
      for (const p of b.plants) { if (p.def.kind === 'mine') { p.armed = true; p.st.armed = true; } p.asleep = false; }
    },
    plantFrozen(b, p) { return p.def.kind === 'producer'; },
    onPlantEaten(b, p) { if (p.def.kind === 'producer') { b.addSun(p.x, b.plantDrawY(p) - 30, 25); b.addSun(p.x + 14, b.plantDrawY(p) - 30, 25); } },
    canPlace(b) { return b.cmdSetup ? undefined : false; },
    drawUnder(b, c) {
      const x = b.cmdLine;
      c.save(); c.strokeStyle = '#d82a1a'; c.lineWidth = 4; c.setLineDash([12, 8]);
      c.beginPath(); c.moveTo(x, b.GY); c.lineTo(x, b.GY + b.rows * b.RH); c.stroke(); c.restore();
      // seed vaults
      for (const r of b.lanes) {
        if (!b.vaults[r]) continue;
        const y = b.gy(r);
        c.save(); c.translate(b.GX - 40, y - 4);
        c.fillStyle = '#8a6a3a'; c.fillRect(-16, -30, 32, 30); c.strokeStyle = '#2a1a0a'; c.lineWidth = 2; c.strokeRect(-16, -30, 32, 30);
        A.ell(c, 0, -15, 7, 7, '#d8c060', '#2a1a0a', 1.5); A.sprout(c, 0, -30, 0.5);
        c.restore();
      }
    },
    drawBank(b, c) {
      ui.rrect(c, 8, 8, 78, 76, 8); c.fillStyle = '#f2e2b0'; c.fill();
      A.sun(c, 47, 34, 25, b.t);
      ui.text(c, String(b.sun), 47, 71, { size: 16, color: '#2a1a08' });
      b.cmd.cards.forEach(([id, cost], i) => {
        const x = 92 + i * 60, y = 6;
        const sel = b.cmdSel === i;
        ui.rrect(c, x, y, 56, 78, 6); c.fillStyle = b.sun >= cost ? '#d8c8a0' : '#8a8070'; c.fill(); c.lineWidth = 2; c.strokeStyle = sel ? '#fff36a' : '#3a2008'; c.stroke();
        c.save(); c.beginPath(); c.rect(x + 2, y + 2, 52, 56); c.clip();
        A.enemy(c, { def: SS.ENEMIES[id], state: 'walk', anim: 0, hp: 1, maxHp: 1, helm: SS.ENEMIES[id].helm ? { hp: 1, max: 1 } : null, shield: SS.ENEMIES[id].shield ? { hp: 1, max: 1 } : null, hasPole: true, box: true, spring: true, pick: true, imp: true, scale: 1 }, x + 30, y + 57, id === 'giant' ? 0.26 : 0.46);
        c.restore();
        ui.text(c, String(cost), x + 28, y + 68, { size: 13, color: '#2a1a08' });
      });
    },
    onBankClick(b, x) {
      const i = Math.floor((x - 92) / 60);
      if (i >= 0 && i < b.cmd.cards.length) {
        if (b.sun < b.cmd.cards[i][1]) { SS.audio.sfx('cancel'); return; }
        b.cmdSel = b.cmdSel === i ? -1 : i; SS.audio.sfx('pick');
      }
    },
    onLawnClick(b, x, y, r, c) {
      if (b.cmdSel < 0) return true;
      const [id, cost] = b.cmd.cards[b.cmdSel];
      if (r < 0 || !b.laneOk(r) || x < b.cmdLine + 10 || b.sun < cost) { SS.audio.sfx('cancel'); return true; }
      b.sun -= cost;
      b.spawnEnemy(id, r, Math.max(x, b.cmdLine + 20));
      SS.audio.sfx('plant');
      if (b.sun < cost) b.cmdSel = -1;
      return true;
    },
    onReachHouse(b, e) {
      if (b.vaults[e.row]) { b.vaults[e.row] = false; SS.audio.sfx('gulp'); b.floatText('Vault eaten!', b.GX, e.y - 60, '#ffe14a'); }
      e.removed = true;
      return true;
    },
    drawOver(b, c) {
      if (b.cmdSel < 0) return;
      const id = b.cmd.cards[b.cmdSel][0];
      c.save(); c.globalAlpha = 0.6;
      A.enemy(c, { def: SS.ENEMIES[id], state: 'walk', anim: b.t, hp: 1, maxHp: 1, helm: SS.ENEMIES[id].helm ? { hp: 1, max: 1 } : null, shield: SS.ENEMIES[id].shield ? { hp: 1, max: 1 } : null, hasPole: true, box: true, spring: true, pick: true, imp: true, scale: 1 }, SS.input.x, SS.input.y + 50, 0.8);
      c.restore();
    },
    checkWin(b) { return b.lanes.every((r) => !b.vaults[r]); },
    update(b) {
      if (b.state !== 'play') return;
      const cheapest = Math.min(...b.cmd.cards.map((q) => q[1]));
      const alive = b.enemies.some((e) => !e.dying);
      const sunComing = b.pickups.some((p) => p.kind === 'sun');
      if (!alive && b.sun < cheapest && !sunComing && b.t > 2) b.lose();
    },
  };

  // ---------- Last Stand ----------
  M.laststand = {
    setup(b) { b.round = 0; b.hold = true; b.totalRounds = b.level.rounds || 5; },
    update(b) { if (b.hold) for (const d of b.deck) d.cd = 0; },
    drawOver(b, c) {
      if (!b.hold || b.state !== 'play') return;
      ui.text(c, 'Round ' + (b.round + 1) + ' of ' + b.totalRounds, SS.W / 2, 112, { size: 22, color: '#fff', stroke: '#000', sw: 4 });
      if (ui.button(c, SS.W / 2 - 110, SS.H - 72, 220, 48, 'Start Onslaught!', { color: '#c83a2a', size: 20 })) { b.hold = false; b.waveTimer = 2; SS.audio.sfx('siren'); }
    },
    checkWin(b) {
      if (b.hold || !(b.spawnedAll && b.wave >= b.totalWaves && !b.enemies.some((e) => !e.dying && !e.hypno))) return false;
      b.round++;
      if (b.round >= b.totalRounds) return true;
      b.hold = true; b.wave = 0; b.spawnedAll = false; b.opts.round = b.round;
      b.sun += 250;
      b.msg = { text: 'Round cleared! +250 sun', t: 0, life: 2.5, col: '#ffe14a' };
      return false;
    },
  };

  // ---------- Seed Rain ----------
  M.seedrain = {
    setup(b) { b.belt = { items: [], timer: 99, every: 99 }; b.noBeltSpawn = true; b.rainT = 2; },
    update(b, dt) {
      if (b.state !== 'play') return;
      b.rainT -= dt;
      if (b.rainT <= 0 && b.belt.items.length < 9) {
        b.rainT = SS.rand(3.2, 4.8);
        const pool = b.level.conveyor;
        const id = SS.wpick(Object.keys(pool).filter((k) => pool[k] > 0), (k) => pool[k]);
        b.pickups.push({ kind: 'seed', id, x: SS.rand(b.GX + 30, b.GX + b.cols * b.CW - 30), y: b.GY - 30, sky: true, ty: SS.rand(b.GY + 80, b.GY + b.rows * b.RH - 60), age: 0, life: 12 });
      }
    },
  };

  // ---------- Seeing Stars ----------
  M.stars = {
    setup(b) {
      const pts = [[0, 4], [1, 3], [1, 4], [1, 5], [2, 2], [2, 3], [2, 5], [2, 6], [3, 3], [3, 4], [3, 5], [4, 2], [4, 6]];
      for (const [r, c] of pts) { const t = b.tile(r, c); if (t) t.star = true; }
    },
    canPlace(b, id, r, c) { const t = b.tile(r, c); if (t && t.star && id !== 'starprism') return false; return undefined; },
    drawOver(b, c) {
      let left = 0;
      for (const row of b.tiles) for (const t of row) if (t.star && !(t.plant && t.plant.id === 'starprism')) left++;
      if (left) ui.text(c, 'Fill the star: ' + left + ' left', SS.W / 2, 110, { size: 16, color: '#fff36a', stroke: '#000', sw: 3 });
    },
  };

  // ---------- Survival ----------
  M.survival = {
    onCleared(b) {
      const round = (b.opts.round || 0) + 1;
      const total = b.level.rounds;
      if (round < total) { SS.nextSurvivalRound(b, round); return true; }
      return false;
    },
  };
})();
