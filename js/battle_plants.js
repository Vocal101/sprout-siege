// Sprout Siege — plant behaviours, projectiles, explosions
(function () {
  const SS = window.SS;
  const B = SS.Battle.prototype;

  B.inRow = (e, r) => e.allRows || e.row === r;
  B.plantDrawY = function (p) {
    const t = this.tiles[p.r][p.c];
    if (p.layer === 'base') return this.groundY(p.r, p.x) + (t.water ? 4 : 0);
    return this.plantY(t);
  };
  B.visible = (e) => e.x < SS.W - 12;
  B.targetAhead = function (r, x, range, air) {
    for (const e of this.enemies) {
      if (!this.inRow(e, r) || e.hypno) continue;
      if (e.x < x - 10 || e.x > x + range || !this.visible(e)) continue;
      if (this.canHit(e, 'straight', air)) return e;
    }
    return null;
  };
  B.targetBehind = function (r, x) {
    for (const e of this.enemies) {
      if (!this.inRow(e, r) || e.hypno) continue;
      if (e.x < x + 5 && e.x > this.GX - 40 && this.canHit(e, 'straight')) return e;
    }
    return null;
  };
  B.firstLobTarget = function (r, x) {
    let best = null;
    for (const e of this.enemies) {
      if (!this.inRow(e, r) || e.hypno || !this.visible(e)) continue;
      if (e.x < x - 10) continue;
      if (!this.canHit(e, 'lob')) continue;
      if (!best || e.x < best.x) best = e;
    }
    return best;
  };
  B.laneShotY = function (r, x) { return this.groundY(r, x) - 44 * this.unitS; };

  B.shoot = function (p, row, dir, o = {}) {
    const def = p.def;
    const sy = this.plantDrawY(p) - 44 * this.unitS;
    const pr = {
      type: 'straight', row, x: p.x + dir * 24 - (o.back || 0) * dir * 22, y: sy, y0: sy, x0: p.x, vx: dir * 380, dmg: def.dmg,
      kind: def.chill ? 'frost' : def.proj || 'pea', chill: !!def.chill, air: !!def.air, torchC: -1,
    };
    if (def.range) pr.maxX = p.x + def.range * this.CW + 30;
    if (this.roof && p.c <= 4 && dir > 0) pr.roofLimit = this.GX + 5 * this.CW + 6;
    this.projs.push(pr);
  };

  // ---------- behaviours ----------
  const K = {};
  K.producer = function (b, p, dt) {
    const d = p.def;
    if (d.grow && !p.grown && p.t > d.grow) { p.grown = true; p.st.grown = true; SS.audio.sfx('grow'); }
    p.timer -= dt;
    p.st.glow = p.timer < 1 ? 1 - p.timer : 0;
    if (p.timer <= 0) {
      p.timer = d.every * SS.rand(0.95, 1.08);
      const val = d.sunBig ? (p.grown ? d.sunBig : d.sun) : d.sun;
      const y = b.plantDrawY(p) - 40;
      if (val >= 50) { b.addSun(p.x - 10, y, 25); b.addSun(p.x + 10, y, 25); }
      else b.addSun(p.x, y, val);
    }
  };
  K.coin = function (b, p, dt) {
    p.timer -= dt;
    if (p.timer <= 0) { p.timer = p.def.every * SS.rand(0.95, 1.1); b.addCoin(p.x, b.plantDrawY(p) - 40, SS.rng() < 0.15 ? 'gold' : 'silver'); }
  };
  K.goldmagnet = function (b, p, dt) {
    K.coin(b, p, dt);
    p.pullT = (p.pullT || 0) - dt;
    p.st.pull = Math.max(0, p.pullT);
    if (p.pullT <= -1.2) {
      const coin = b.pickups.find((q) => q.kind === 'coin' && !q.collecting && q.age > 0.6);
      if (coin) { b.collect(coin); p.pullT = 0.5; }
    }
  };
  K.shooter = function (b, p, dt) {
    const d = p.def;
    if (d.scaredy) {
      const near = b.enemies.some((e) => !e.dying && !e.hypno && Math.abs(e.row - p.r) <= 1 && Math.abs(e.x - p.x) < b.CW * 1.6 && !e.flying && !e.under);
      p.st.hide = near;
      if (near) { p.timer = Math.max(p.timer, 0.4); return; }
    }
    const range = d.range ? d.range * b.CW + 20 : 2000;
    const rows = d.tri ? [p.r - 1, p.r, p.r + 1].filter((r) => b.laneOk(r)) : [p.r];
    const front = rows.some((r) => b.targetAhead(r, p.x, range, d.air));
    const back = d.back && b.targetBehind(p.r, p.x);
    p.timer -= dt;
    if ((front || back) && p.timer <= 0) {
      p.timer = d.rate * SS.rand(0.94, 1.06);
      p.st.fire = 0;
      SS.audio.sfx('shoot');
      if (front || d.back) for (const r of rows) for (let k = 0; k < d.shots; k++) b.shoot(p, r, 1, { back: k });
      if (d.back && (back || front)) for (let k = 0; k < d.back; k++) b.shoot(p, p.r, -1, { back: k });
    }
  };
  K.star = function (b, p, dt) {
    p.timer -= dt;
    const any = b.enemies.some((e) => !e.dying && !e.hypno && b.visible(e) && b.canHit(e, 'straight'));
    if (any && p.timer <= 0) {
      p.timer = p.def.rate;
      p.st.fire = 0;
      SS.audio.sfx('shoot');
      const y = b.plantDrawY(p) - 36 * b.unitS;
      for (const [vx, vy] of [[0, -1], [0, 1], [-1, 0], [0.866, -0.5], [0.866, 0.5]]) {
        b.projs.push({ type: 'star', x: p.x, y, vx: vx * 330, vy: vy * 330, dmg: p.def.dmg, life: 4 });
      }
    }
  };
  K.fume = function (b, p, dt) {
    const range = p.def.range * b.CW + 10;
    p.timer -= dt;
    const tgt = b.targetAhead(p.r, p.x, range);
    if (tgt && p.timer <= 0) {
      p.timer = p.def.rate;
      p.st.fire = 0;
      SS.audio.sfx('whoosh');
      const y = b.plantDrawY(p) - 30 * b.unitS;
      b.fx.push({ type: 'fume', x: p.x + 20, y, len: range, t: 0, life: 0.45 });
      for (const e of b.enemies.slice()) {
        if (!b.inRow(e, p.r) || e.hypno || e.dying) continue;
        if (e.x >= p.x - 10 && e.x <= p.x + range && b.canHit(e, 'pierce')) b.damage(e, p.def.dmg, { kind: 'pierce' });
      }
    }
  };
  K.gloom = function (b, p, dt) {
    p.timer -= dt;
    const inArea = (e) => !e.dying && !e.hypno && Math.abs(e.row - p.r) <= 1 && Math.abs(e.x - p.x) <= b.CW * 1.5 + 10 && b.canHit(e, 'pierce');
    if (p.pulses > 0) {
      p.pulseT -= dt;
      if (p.pulseT <= 0) {
        p.pulses--; p.pulseT = 0.16;
        for (const e of b.enemies.slice()) if (inArea(e)) b.damage(e, p.def.dmg, { kind: 'pierce' });
      }
      return;
    }
    if (p.timer <= 0 && b.enemies.some(inArea)) {
      p.timer = p.def.rate; p.pulses = 4; p.pulseT = 0; p.st.fire = 0;
      SS.audio.sfx('whoosh');
      b.fx.push({ type: 'gloom', x: p.x, y: b.plantDrawY(p) - 30, t: 0, life: 0.7 });
    }
  };
  K.lobber = function (b, p, dt) {
    p.timer -= dt;
    const tgt = b.firstLobTarget(p.r, p.x);
    p.st.loaded = p.timer < 0.6;
    if (tgt && p.timer <= 0) {
      p.timer = p.def.rate * SS.rand(0.95, 1.05);
      p.st.fire = 0;
      const d = p.def;
      const sap = d.sap && p.st.sapNext;
      p.st.sapNext = d.sap && SS.rng() < 0.25;
      SS.audio.sfx('lob');
      const y0 = b.plantDrawY(p) - 60 * b.unitS;
      const dist = Math.abs(tgt.x - p.x);
      b.projs.push({
        type: 'lob', x0: p.x - 20, y0, x: p.x - 20, y: y0, target: tgt, tx: tgt.x, row: p.r, t: 0, T: 0.75 + dist / 1400, arc: 110 + dist * 0.08,
        dmg: sap ? 40 : d.dmg, splash: d.splash || 0, chill: !!d.chill, butter: !!sap, kind: sap ? 'sap' : d.proj,
      });
    }
  };
  K.bomb = function (b, p, dt) {
    p.timer -= dt;
    p.st.fuse = SS.clamp(1 - p.timer / p.def.fuse, 0, 1);
    if (p.timer <= 0) { b.explode(p); b.removePlant(p); }
  };
  K.mine = function (b, p, dt) {
    if (!p.armed) {
      p.timer -= dt;
      p.st.armk = 1 - p.timer / p.def.arm;
      if (p.timer <= 0) { p.armed = true; p.st.armed = true; SS.audio.sfx('pop'); b.fx.push({ type: 'dirt', x: p.x, y: b.plantDrawY(p), t: 0, life: 0.4 }); }
      return;
    }
    for (const e of b.enemies) {
      if (e.row !== p.r || e.dying || e.hypno || e.flying || e.under || e.submerged || e.inAir) continue;
      if (Math.abs(e.x - 14 * (e.scale || 1) - p.x) < 34) {
        SS.audio.sfx('boom');
        b.fx.push({ type: 'boom', x: p.x, y: b.plantDrawY(p) - 10, t: 0, life: 0.7, s: 0.7, spud: true });
        b.shake = 0.3;
        for (const o of b.enemies.slice()) if (o.row === p.r && !o.dying && Math.abs(o.x - p.x) < 70 && !o.flying) b.damage(o, p.def.dmg, { kind: 'area', char: true });
        b.removePlant(p);
        return;
      }
    }
  };
  K.chomper = function (b, p, dt) {
    if (p.chew > 0) { p.chew -= dt; p.st.chew = p.chew; if (p.chew <= 0) p.st.chew = 0; return; }
    if (p.biting) {
      p.biteT -= dt;
      p.st.bite = 1 - p.biteT / 0.45;
      if (p.biteT <= 0) {
        p.biting = false; p.st.bite = 0;
        const e = p.biteTarget;
        if (e && !e.dying && b.enemies.indexOf(e) >= 0 && Math.abs(e.x - p.x) < p.def.reach * b.CW + 20 && b.canHit(e, 'bite')) {
          if (e.def.giant || e.def.boss || e.def.vehicle || e.def.sled) { b.damage(e, 40, { kind: 'area' }); SS.audio.sfx('chomp'); }
          else { b.killEnemy(e, 'eaten'); SS.audio.sfx('gulp'); p.chew = p.def.chew; p.st.chew = p.chew; }
        }
      }
      return;
    }
    for (const e of b.enemies) {
      if (e.row !== p.r || e.dying || e.hypno) continue;
      if (e.x > p.x - 20 && e.x < p.x + p.def.reach * b.CW && b.canHit(e, 'bite')) { p.biting = true; p.biteT = 0.45; p.biteTarget = e; return; }
    }
  };
  K.squash = function (b, p, dt) {
    for (const e of b.enemies) {
      if (e.row !== p.r || e.dying || e.hypno || e.flying || e.under) continue;
      if (e.x > p.x - 55 && e.x < p.x + 95 && b.canHit(e, 'bite')) {
        b.fx.push({ type: 'squash', x0: p.x, x1: e.x, r: p.r, y: b.plantDrawY(p), t: 0, life: 1.0, done: false, mimic: p.mimic });
        b.removePlant(p);
        return;
      }
    }
  };
  K.kelp = function (b, p, dt) {
    for (const e of b.enemies) {
      if (e.row !== p.r || e.dying || e.hypno || e.flying) continue;
      if (Math.abs(e.x - p.x) < 46 && !e.def.boss) {
        e.drowning = 1.2; e.state = 'drown';
        b.fx.push({ type: 'splash', x: p.x, y: b.plantDrawY(p), t: 0, life: 0.8, big: true });
        SS.audio.sfx('splash');
        b.removePlant(p);
        return;
      }
    }
  };
  K.spike = function (b, p, dt) {
    p.timer -= dt;
    p.st.poke = Math.max(0, (p.st.poke || 0) - dt * 4);
    for (const e of b.enemies.slice()) {
      if (e.row !== p.r || e.dying || e.flying || e.under || e.hypno) continue;
      if (Math.abs(e.x - 10 - p.x) > 38) continue;
      if ((e.def.vehicle) && !e.popped) {
        e.popped = true;
        b.damage(e, 99999, { kind: 'area' });
        SS.audio.sfx('pop');
        if (p.rocks) { p.rocks--; p.flash = 0.3; if (p.rocks <= 0) { b.removePlant(p); return; } }
        else { b.removePlant(p); return; }
      }
    }
    if (p.timer <= 0) {
      let hit = false;
      for (const e of b.enemies.slice()) {
        if (e.row !== p.r || e.dying || e.flying || e.under || e.hypno || e.def.vehicle || e.submerged) continue;
        if (Math.abs(e.x - 10 - p.x) < 38) { b.damage(e, p.def.dmg, { kind: 'pierce' }); hit = true; }
      }
      p.timer = 1;
      if (hit) p.st.poke = 1;
    }
  };
  K.blover = function (b, p, dt) {
    p.timer -= dt;
    if (p.timer <= 0 && !p.blown) {
      p.blown = true; p.st.spin = 0.01;
      SS.audio.sfx('whoosh');
      b.fogClear = 25;
      for (const e of b.enemies) if ((e.flying || e.def.bungee && e.state !== 'grab') && !e.dying) { e.blown = 1.2; e.dying = 1.2; e.state = 'blown'; b.kills++; }
      b.fx.push({ type: 'wind', t: 0, life: 1.2 });
    }
    if (p.blown) { p.st.spin += dt; if (p.st.spin > 1.3) b.removePlant(p); }
  };
  K.magnet = function (b, p, dt) {
    if (p.cool > 0) { p.cool -= dt; p.st.used = true; p.st.pull = Math.max(0, p.cool - (p.def.reload - 0.6)); return; }
    p.st.used = false;
    let best = null, bd = 1e9;
    for (const e of b.enemies) {
      if (e.dying || e.hypno || !b.visible(e)) continue;
      if (!b.hasMetal(e)) continue;
      const d = Math.hypot((e.x - p.x) / b.CW, e.row - p.r);
      if (d <= p.def.range && d < bd) { bd = d; best = e; }
    }
    // placed ladders count too
    let ladderTile = null;
    if (!best) {
      for (let r = Math.max(0, p.r - 3); r <= Math.min(b.rows - 1, p.r + 3); r++) for (let c = 0; c < b.cols; c++) {
        const t = b.tiles[r][c];
        if (t.ladder && Math.hypot(c - p.c, r - p.r) <= p.def.range) { ladderTile = t; break; }
      }
    }
    if (best || ladderTile) {
      const item = best ? b.stripMetal(best) : 'ladder';
      if (ladderTile) ladderTile.ladder = false;
      p.cool = p.def.reload;
      p.item = item;
      SS.audio.sfx('metal');
      const from = best ? { x: best.x, y: best.y - 80 } : { x: b.cx(ladderTile.c), y: b.plantY(ladderTile) - 30 };
      b.fx.push({ type: 'magnet', item, x0: from.x, y0: from.y, x1: p.x, y1: b.plantDrawY(p) - 50, t: 0, life: p.def.reload - 1 });
    }
  };
  K.grave = function (b, p, dt) {
    const t = b.tiles[p.r][p.c];
    p.timer -= dt;
    p.st.digging = true;
    p.st.digk = SS.clamp(1 - p.timer / p.def.dig, 0, 1);
    if (p.timer <= 0) {
      t.grave = false;
      SS.audio.sfx('grave');
      b.fx.push({ type: 'dirt', x: p.x, y: b.plantY(t), t: 0, life: 0.6 });
      if (SS.rng() < 0.3) b.addCoin(p.x, b.plantY(t) - 30, 'silver');
      b.removePlant(p);
    }
  };
  K.cattail = function (b, p, dt) {
    p.timer -= dt;
    if (p.timer > 0) return;
    let best = null;
    for (const e of b.enemies) {
      if (e.dying || e.hypno || !b.visible(e) || e.x < b.GX - 30) continue;
      if (!b.canHit(e, 'straight', true)) continue;
      const score = e.x - (e.flying ? 400 : 0);
      if (!best || score < best.s) best = { e, s: score };
    }
    if (best) {
      p.timer = p.def.rate;
      p.st.fire = 0;
      SS.audio.sfx('shoot');
      const y = b.plantDrawY(p) - 56;
      for (let k = 0; k < 2; k++) b.projs.push({ type: 'homing', x: p.x, y: y - k * 8, vx: 0, vy: -260, target: best.e, dmg: p.def.dmg, life: 4 });
    }
  };
  K.cob = function (b, p, dt) {
    if (p.timer > 0) p.timer -= dt;
    p.st.ready = p.timer <= 0;
  };
  K.torch = K.lantern = K.platform = K.wall = K.shell = K.hypno = K.garlic = K.umbrella = K.coffee = K.mimic = function () {};
  SS.PLANT_KINDS = K;

  B.updatePlants = function (dt) {
    for (const p of this.plants.slice()) {
      if (p.dead) continue;
      p.t += dt; p.st.t += dt; p.st.fire += dt;
      p.st.hpf = p.hp / p.maxHp;
      p.st.asleep = p.asleep;
      p.st.mimic = p.mimic;
      if (p.flash > 0) p.flash -= dt;
      p.st.flash = p.flash;
      if (p.st.open > 0) p.st.open = Math.max(0, p.st.open - dt * 1.5);
      if (p.asleep) continue;
      if (this.mode.plantFrozen && this.mode.plantFrozen(this, p)) continue;
      const fn = K[p.def.kind];
      if (fn) fn(this, p, dt);
    }
  };

  // ---------- explosions ----------
  B.areaDamage = function (r0, r1, x0, x1, dmg, o) {
    for (const e of this.enemies.slice()) {
      if (e.dying) continue;
      if (e.def.boss) { if (this.bossHitX && x1 >= this.bossHitX) this.damage(e, dmg * (o.bossMul || 1), o); continue; }
      if (e.row < r0 || e.row > r1) continue;
      if (e.x < x0 || e.x > x1) continue;
      if (e.state === 'ascend' || e.state === 'descend') { if (!o.hitSky) continue; }
      this.damage(e, dmg, o);
    }
  };
  B.explode = function (p) {
    const d = p.def;
    const y = this.plantDrawY(p) - 20;
    if (d.blast === 'area') {
      SS.audio.sfx('boom');
      this.shake = 0.5;
      this.fx.push({ type: 'boom', x: p.x, y, t: 0, life: 0.8, s: 1.2 });
      this.areaDamage(p.r - 1, p.r + 1, p.x - this.CW * 1.5, p.x + this.CW * 1.5, d.dmg, { kind: 'area', char: true, hitSky: true });
    } else if (d.blast === 'row') {
      SS.audio.sfx('fire');
      this.shake = 0.3;
      this.fx.push({ type: 'firerow', r: p.r, y: this.groundY(p.r, p.x), t: 0, life: 1.1 });
      this.iceX[p.r] = Infinity;
      this.areaDamage(p.r, p.r, -1000, 3000, d.dmg, { kind: 'area', char: true, row: true });
      this.mode.onRowFire && this.mode.onRowFire(this, p.r);
    } else if (d.blast === 'freeze') {
      SS.audio.sfx('freeze');
      this.fx.push({ type: 'freeze', t: 0, life: 1.0 });
      for (const e of this.enemies) {
        if (e.dying || e.hypno) continue;
        e.freeze = e.def.boss ? 3 : 4;
        e.chill = Math.max(e.chill || 0, 14);
        this.damage(e, d.dmg, { kind: 'area' });
      }
      this.mode.onFreeze && this.mode.onFreeze(this);
    } else if (d.blast === 'dread') {
      SS.audio.sfx('bigboom');
      this.shake = 1.2;
      this.flashT = 0.5;
      this.fx.push({ type: 'dread', x: p.x, y, t: 0, life: 1.6 });
      this.areaDamage(p.r - 2, p.r + 2, p.x - this.CW * 2.6, p.x + this.CW * 2.6, d.dmg, { kind: 'area', char: true, hitSky: true });
      const t = this.tiles[p.r][p.c];
      if (!t.water) t.crater = 90;
    }
  };

  // ---------- projectiles ----------
  B.updateProjs = function (dt) {
    for (const pr of this.projs) {
      if (pr.dead) continue;
      if (pr.type === 'straight') this.stepStraight(pr, dt);
      else if (pr.type === 'star') this.stepStar(pr, dt);
      else if (pr.type === 'lob') this.stepLob(pr, dt);
      else if (pr.type === 'homing') this.stepHoming(pr, dt);
      else if (pr.type === 'cob') this.stepCob(pr, dt);
      else if (pr.type === 'elob') this.stepEnemyLob(pr, dt);
      else if (pr.type === 'bowl') this.mode.stepBowl && this.mode.stepBowl(this, pr, dt);
    }
    this.projs = this.projs.filter((p) => !p.dead);
  };
  B.stepStraight = function (pr, dt) {
    const px = pr.x;
    pr.x += pr.vx * dt;
    const trav = Math.abs(pr.x - pr.x0);
    const ty = this.laneShotY(pr.row, pr.x);
    pr.y = SS.lerp(pr.y0 + this.slope(pr.x) - this.slope(pr.x0), ty, Math.min(1, trav / 70));
    // brazier
    if (pr.vx > 0 && (pr.kind === 'pea' || pr.kind === 'frost')) {
      for (const p of this.plants) {
        if (p.def.kind !== 'torch' || p.r !== pr.row || p.c === pr.torchC) continue;
        if (px < p.x && pr.x >= p.x) {
          pr.torchC = p.c;
          if (pr.kind === 'frost') { pr.kind = 'pea'; pr.chill = false; }
          else { pr.kind = 'fire'; pr.dmg *= 2; pr.fire = true; }
        }
      }
    }
    if (pr.maxX && pr.x > pr.maxX) { pr.dead = true; return; }
    if (pr.roofLimit && pr.x > pr.roofLimit) { pr.dead = true; this.fx.push({ type: 'hit', x: pr.x, y: pr.y, t: 0, life: 0.25, kind: pr.kind }); return; }
    if (pr.x > SS.W + 10 || pr.x < -20) { pr.dead = true; return; }
    // hit test
    let best = null, bd = 1e9;
    for (const e of this.enemies) {
      if (e.dying || e.hypno || !this.inRow(e, pr.row)) continue;
      const hw = e.hw;
      const ex = e.def.boss ? this.bossHitX : e.x;
      if (ex === undefined) continue;
      if (pr.x < ex - hw || pr.x > ex + hw) continue;
      if (!this.canHit(e, 'straight', pr.air)) continue;
      const d = pr.vx > 0 ? ex - pr.x : pr.x - ex;
      if (d < bd) { bd = d; best = e; }
    }
    if (best) {
      const flying = best.flying;
      this.damage(best, pr.dmg, { kind: 'straight', fromLeft: pr.vx > 0, chill: pr.chill, fire: pr.fire, pop: pr.air });
      if (pr.fire && !flying) {
        for (const o of this.enemies.slice()) if (o !== best && !o.dying && !o.hypno && o.row === pr.row && Math.abs(o.x - best.x) < 45 && this.canHit(o, 'straight')) this.damage(o, Math.round(pr.dmg / 3), { kind: 'pierce', fire: true });
      }
      this.fx.push({ type: 'hit', x: pr.x, y: pr.y, t: 0, life: 0.25, kind: pr.kind });
      pr.dead = true;
    }
  };
  B.stepStar = function (pr, dt) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.life <= 0 || pr.x < this.GX - 60 || pr.x > SS.W + 10 || pr.y < this.GY - 40 || pr.y > this.GY + this.rows * this.RH + 20) { pr.dead = true; return; }
    const r = this.rowAt(pr.x, pr.y + 30 * this.unitS);
    if (r < 0) return;
    for (const e of this.enemies) {
      if (e.dying || e.hypno || !this.inRow(e, r)) continue;
      const ex = e.def.boss ? this.bossHitX : e.x;
      if (Math.abs(pr.x - ex) < e.hw && this.canHit(e, 'straight')) {
        this.damage(e, pr.dmg, { kind: 'straight', fromLeft: pr.vx >= 0 });
        this.fx.push({ type: 'hit', x: pr.x, y: pr.y, t: 0, life: 0.25, kind: 'star' });
        pr.dead = true; return;
      }
    }
  };
  B.stepLob = function (pr, dt) {
    pr.t += dt;
    const e = pr.target;
    if (e && !e.dying && this.enemies.indexOf(e) >= 0) pr.tx = e.def.boss ? this.bossHitX : e.x;
    const k = Math.min(1, pr.t / pr.T);
    pr.x = SS.lerp(pr.x0, pr.tx, k);
    const ty = this.groundY(pr.row, pr.tx) - (e && e.def.boss ? 160 : 50) * this.unitS;
    pr.y = SS.lerp(pr.y0, ty, k) - pr.arc * 4 * k * (1 - k);
    pr.rot = (pr.rot || 0) + dt * 8;
    if (k >= 1) {
      pr.dead = true;
      let tgt = e && !e.dying && this.enemies.indexOf(e) >= 0 && this.canHit(e, 'lob') ? e : null;
      if (!tgt) {
        for (const o of this.enemies) if (!o.dying && !o.hypno && o.row === pr.row && Math.abs(o.x - pr.x) < 40 && this.canHit(o, 'lob')) { tgt = o; break; }
      }
      this.fx.push({ type: 'splat', x: pr.x, y: pr.y, t: 0, life: 0.4, kind: pr.kind });
      if (tgt) {
        this.damage(tgt, pr.dmg, { kind: 'lob', chill: pr.chill, butter: pr.butter });
        if (pr.splash) {
          for (const o of this.enemies.slice()) {
            if (o === tgt || o.dying || o.hypno) continue;
            if (Math.abs(o.row - pr.row) <= 1 && Math.abs(o.x - tgt.x) < 90 && this.canHit(o, 'lob')) this.damage(o, pr.splash, { kind: 'lob', chill: pr.chill });
          }
        }
      }
    }
  };
  B.stepHoming = function (pr, dt) {
    pr.life -= dt;
    let e = pr.target;
    if (!e || e.dying || this.enemies.indexOf(e) < 0 || !this.canHit(e, 'straight', true)) {
      e = null;
      for (const o of this.enemies) if (!o.dying && !o.hypno && this.visible(o) && this.canHit(o, 'straight', true)) { if (!e || o.x < e.x) e = o; }
      pr.target = e;
    }
    if (!e) { pr.y -= 200 * dt; if (pr.life <= 0 || pr.y < -20) pr.dead = true; return; }
    const ex = e.def.boss ? this.bossHitX : e.x;
    const ey = e.y - (e.flying ? 130 : 50) * this.unitS;
    const dx = ex - pr.x, dy = ey - pr.y, d = Math.hypot(dx, dy) || 1;
    const sp = 460;
    pr.vx = SS.lerp(pr.vx, (dx / d) * sp, Math.min(1, dt * 6));
    pr.vy = SS.lerp(pr.vy, (dy / d) * sp, Math.min(1, dt * 6));
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (d < 22) {
      this.damage(e, pr.dmg, { kind: 'straight', fromLeft: pr.vx > 0, pop: true });
      this.fx.push({ type: 'hit', x: pr.x, y: pr.y, t: 0, life: 0.25, kind: 'reed' });
      pr.dead = true;
    }
    if (pr.life <= 0) pr.dead = true;
  };
  B.fireCob = function (p, x, y) {
    const r = this.rowAt(x, y);
    if (r < 0) return false;
    p.timer = p.def.reload;
    p.st.ready = false;
    SS.audio.sfx('whoosh');
    this.projs.push({ type: 'cob', phase: 0, t: 0, x: p.x + 40, y: this.plantDrawY(p) - 50, sx: p.x + 40, sy: this.plantDrawY(p) - 50, tx: x, row: r, dmg: p.def.dmg });
    return true;
  };
  B.stepCob = function (pr, dt) {
    pr.t += dt;
    if (pr.phase === 0) { pr.y = pr.sy - pr.t * 900; if (pr.t > 0.7) { pr.phase = 1; pr.t = 0; } }
    else {
      const ty = this.groundY(pr.row, pr.tx) - 20;
      pr.x = pr.tx; pr.y = SS.lerp(-80, ty, Math.min(1, pr.t / 1.0));
      if (pr.t >= 1.0) {
        pr.dead = true;
        SS.audio.sfx('bigboom');
        this.shake = 0.7;
        this.fx.push({ type: 'boom', x: pr.tx, y: ty, t: 0, life: 0.9, s: 1.3 });
        this.areaDamage(pr.row - 1, pr.row + 1, pr.tx - this.CW * 1.25, pr.tx + this.CW * 1.25, pr.dmg, { kind: 'area', char: true, hitSky: true, bossMul: 1 });
      }
    }
  };
  B.stepEnemyLob = function (pr, dt) {
    pr.t += dt;
    const k = Math.min(1, pr.t / pr.T);
    pr.x = SS.lerp(pr.x0, pr.tx, k);
    pr.y = SS.lerp(pr.y0, pr.ty, k) - pr.arc * 4 * k * (1 - k);
    // canopy fern blocks it on the way down
    if (k > 0.65 && !pr.checked) {
      pr.checked = true;
      const fern = this.canopyCovering(pr.r, pr.c);
      if (fern) { pr.dead = true; fern.st.open = 1; SS.audio.sfx('thud'); this.fx.push({ type: 'hit', x: pr.x, y: pr.y, t: 0, life: 0.3, kind: 'clod' }); return; }
    }
    if (k >= 1) {
      pr.dead = true;
      const p = pr.r !== undefined ? this.eatTargetAt(pr.r, pr.c) || this.topPlantAt(pr.r, pr.c) : null;
      this.fx.push({ type: 'splat', x: pr.x, y: pr.y, t: 0, life: 0.4, kind: 'clod' });
      if (p) { p.hp -= pr.dmg; p.flash = 0.15; if (p.hp <= 0) this.removePlant(p, 'eaten'); }
      if (pr.onLand) pr.onLand(this, pr);
    }
  };
  B.canopyCovering = function (r, c) {
    for (const p of this.plants) if (p.def.kind === 'umbrella' && !p.asleep && Math.abs(p.r - r) <= 1 && Math.abs(p.c - c) <= 1) return p;
    return null;
  };
})();
