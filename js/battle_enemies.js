// Sprout Siege — Rotter behaviours, damage model, deaths
(function () {
  const SS = window.SS;
  const B = SS.Battle.prototype;

  B.spawnEnemy = function (id, row, x, o = {}) {
    const def = SS.ENEMIES[id];
    if (!def) return null;
    const s = this.unitS;
    const e = {
      id, def, row, x, y: this.groundY(row, x), hp: def.hp, maxHp: def.hp,
      helm: def.helm ? { hp: def.helm.hp, max: def.helm.hp, mat: def.helm.mat, look: def.helm.look } : null,
      shield: def.shield ? { hp: def.shield.hp, max: def.shield.hp, mat: def.shield.mat, look: def.shield.look } : null,
      sp: def.sp, state: 'walk', anim: SS.rand(0, 6), chill: 0, freeze: 0, butter: 0, flash: 0, hypno: false, dying: 0,
      scale: s, hw: 18 * s, reach: 22 * s, rageMul: 1, dir: -1, fallDir: 1,
    };
    if (def.vault) { e.hasPole = true; e.state = 'run'; }
    if (def.flying) { e.flying = true; e.balloon = true; }
    if (def.dig) { e.under = true; e.state = 'dig'; e.pick = true; e.sp = 40; }
    if (def.pogo) e.spring = true;
    if (def.jester) { e.box = true; e.boomT = SS.rand(6, 16); }
    if (def.submerge) e.submerged = true;
    if (def.summon) { e.summoned = false; e.minions = []; e.summonT = 0; }
    if (def.giant) { e.imp = true; e.hw = 30 * s; e.reach = 30 * s; }
    if (def.vehicle) { e.hw = 38 * s; e.reach = 40 * s; }
    if (def.catapult) e.ammo = 20;
    if (def.sled) { e.hw = 55 * s; e.reach = 60 * s; e.state = 'sled'; }
    if (def.bungee) { e.state = 'wait'; e.waitT = SS.rand(0.2, 3.5); e.dropK = 0; }
    if (def.boss) { e.allRows = true; e.hw = 70; }
    if (def.rare) e.walked = 0;
    if (def.small) { e.hw = 13 * s; }
    Object.assign(e, o);
    if (this.mode.onSpawn) this.mode.onSpawn(this, e);
    if (e.scale !== s) { e.hw *= e.scale / s; e.reach *= e.scale / s; }
    this.enemies.push(e);
    return e;
  };

  B.canHit = function (e, kind, air) {
    if (e.dying || e.blown || e.drowning) return false;
    if (e.flyIn > 0) return false;
    if (e.rise > 0.5) return kind === 'area';
    if (e.def.boss) return kind !== 'bite';
    if (e.under) return kind === 'area';
    if (e.submerged) return kind === 'area';
    if (e.flying) return (kind === 'straight' && air) || kind === 'area';
    if (e.def.bungee) return e.state === 'grab' && kind !== 'bite' ? true : e.state === 'grab';
    return true;
  };
  B.hasMetal = function (e) {
    if (e.dying || e.def.boss) return false;
    return !!((e.helm && e.helm.mat === 'metal') || (e.shield && e.shield.mat === 'metal') || e.box || e.pick || e.spring);
  };
  B.stripMetal = function (e) {
    if (e.pick) {
      e.pick = false;
      if (e.under) { e.under = false; e.state = 'stun'; e.stunT = 1.2; e.dir = -1; e.sp = 17; this.fx.push({ type: 'dirt', x: e.x, y: e.y, t: 0, life: 0.5 }); }
      return 'pick';
    }
    if (e.spring) { e.spring = false; e.state = 'walk'; e.sp = 17; return 'spring'; }
    if (e.box) { e.box = false; return 'box'; }
    if (e.shield && e.shield.mat === 'metal') { const l = e.shield.look; e.shield = null; if (e.def.ladder) e.sp = 17; return l; }
    if (e.helm && e.helm.mat === 'metal') { const l = e.helm.look; e.helm = null; return l; }
    return null;
  };
  function matSfx(m) { SS.audio.sfx(m === 'metal' ? 'metal' : m === 'wood' ? 'wood' : 'hit'); }

  B.damage = function (e, dmg, o = {}) {
    if (e.dying || dmg <= 0) return;
    if (e.def.boss) { this.mode.bossDamage && this.mode.bossDamage(this, e, dmg, o); return; }
    e.flash = 0.1;
    if (o.pop && e.flying && e.balloon) {
      e.balloon = false; e.flying = false; e.state = 'fall'; e.fallT = 0.5;
      SS.audio.sfx('pop');
      this.fx.push({ type: 'pop', x: e.x, y: e.y - 150 * e.scale, t: 0, life: 0.4 });
      return;
    }
    let d = dmg;
    const area = o.kind === 'area';
    let blocked = false;
    if (e.shield && e.shield.hp > 0) {
      if (area) { e.shield.hp -= d; if (e.shield.hp <= 0) { d = -e.shield.hp; this.dropArmor(e, 'shield'); } else d = 0; }
      else if (o.kind === 'straight' && o.fromLeft !== false) {
        e.shield.hp -= d; matSfx(e.shield.mat);
        if (e.shield.hp <= 0) this.dropArmor(e, 'shield');
        return;
      } else if (o.kind === 'pierce') { e.shield.hp -= d; if (e.shield.hp <= 0) this.dropArmor(e, 'shield'); }
    }
    if (e.helm && e.helm.hp > 0 && d > 0) {
      e.helm.hp -= d; matSfx(e.helm.mat); blocked = true;
      if (e.helm.hp <= 0) { d = -e.helm.hp; this.dropArmor(e, 'helm'); } else d = 0;
    }
    if (o.fire) e.chill = 0;
    else if (o.chill) { if (e.chill <= 0) SS.audio.sfx('freeze'); e.chill = 10; }
    if (o.butter && !e.def.vehicle && !e.flying) e.butter = 4;
    if (d > 0) {
      if (!blocked) SS.audio.sfx('hit');
      e.hp -= d;
      if (e.hp <= 0) this.killEnemy(e, o.char ? 'char' : o.kind === 'mallet' ? 'bonk' : 'normal');
    }
  };
  B.dropArmor = function (e, which) {
    const a = e[which];
    if (!a) return;
    e[which] = null;
    this.fx.push({ type: 'debris', look: a.look, x: e.x - (which === 'shield' ? 26 : 2) * e.scale, y: e.y - (which === 'shield' ? 55 : 98) * e.scale, vx: SS.rand(30, 90), vy: -160, rot: 0, t: 0, life: 1.0 });
    if (e.def.rage && which === 'helm' && !e.raged) { e.raged = true; e.stunT = 0.7; e.state = 'stun'; e.sp = 42; e.rageMul = 2; SS.audio.sfx('groan'); }
  };
  B.killEnemy = function (e, how) {
    if (e.dying) return;
    if (e.def.boss) return;
    e.dying = how === 'char' ? 1.1 : how === 'eaten' ? 0.01 : 0.9;
    e.deathHow = how;
    e.state = 'die';
    e.fallDir = e.hypno ? -1 : 1;
    this.kills++;
    SS.save.stats.kills++;
    this.lastKillPos = { x: SS.clamp(e.x, this.GX + 30, this.GX + 8.5 * this.CW), y: this.gy(e.row) };
    if (how === 'char') this.fx.push({ type: 'ash', x: e.x, y: e.y, s: e.scale * (e.def.giant ? 1.6 : 1), t: 0, life: 1.4 });
    if (e.def.vehicle || e.def.sled) { SS.audio.sfx('boom'); this.fx.push({ type: 'boom', x: e.x, y: e.y - 30, t: 0, life: 0.6, s: 0.8 }); e.dying = 0.01; }
    if (how === 'mower') { e.dying = 0.6; e.flat = true; }
    if (e.def.rare) { this.addCoin(e.x, e.y - 40, 'diamond'); this.addCoin(e.x + 20, e.y - 40, 'diamond'); }
    else this.dropLoot(e.x, e.y);
    if (this.mode.onKill) this.mode.onKill(this, e, how);
  };

  // tile helpers for enemies
  B.frontPlant = function (e, dir) {
    const fx = e.x + dir * e.reach;
    const c = this.colAt(fx);
    if (c < 0 || c >= this.cols) return null;
    const cx = this.cx(c);
    if (dir < 0 ? fx > cx + 24 || fx < cx - 40 : fx < cx - 24 || fx > cx + 40) return null;
    const p = this.eatTargetAt(e.row, c);
    return p ? { p, c } : null;
  };
  B.anyPlantAt = function (r, c) { const t = this.tile(r, c); return t ? t.shell || t.plant || t.base : null; };
  B.crushTile = function (r, c, keepSpikes) {
    const t = this.tile(r, c);
    if (!t) return false;
    let any = false;
    for (const p of [t.shell, t.plant, t.base]) {
      if (!p || p.dead) continue;
      if (keepSpikes && p.def.kind === 'spike') continue;
      this.removePlant(p, 'eaten'); any = true;
    }
    if (any) { SS.audio.sfx('thud'); this.fx.push({ type: 'dirt', x: this.cx(c), y: this.plantY(t), t: 0, life: 0.5 }); }
    return any;
  };

  // ---------- per-frame ----------
  B.updateEnemies = function (dt) {
    for (const e of this.enemies.slice()) {
      if (e.dying > 0) {
        e.dying -= dt;
        if (e.state === 'blown') e.x += 500 * dt;
        if (e.dying <= 0) this.enemies.splice(this.enemies.indexOf(e), 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      if (e.chill > 0) e.chill -= dt;
      if (e.freeze > 0) e.freeze -= dt;
      if (e.butter > 0) e.butter -= dt;
      if (e.drowning > 0) {
        e.drowning -= dt;
        e.sink = (e.sink || 0) + dt * 60;
        if (e.drowning <= 0) this.killEnemy(e, 'eaten');
        continue;
      }
      if (e.rise > 0) { e.rise -= dt * 1.3; e.y = this.groundY(e.row, e.x); continue; }
      if (e.flyIn > 0) { // thrown scamp
        e.flyIn -= dt;
        const k = 1 - e.flyIn / e.flyDur;
        e.x = SS.lerp(e.fx0, e.fx1, k);
        e.y = this.groundY(e.row, e.x) - Math.sin(k * Math.PI) * 160;
        e.anim += dt * 4;
        if (e.flyIn <= 0) { e.y = this.groundY(e.row, e.x); SS.audio.sfx('thud'); }
        continue;
      }
      // lane shift (stink onion)
      if (e.shift) { e.shift.t += dt; if (e.shift.t >= 0.8) e.shift = null; }
      const stopped = e.freeze > 0 || e.butter > 0;
      const mult = (e.chill > 0 ? 0.5 : 1) * this.speedMul;
      if (!stopped) e.anim += dt * mult * (e.state === 'eat' ? 1 : Math.max(0.6, e.sp / 17));
      const ai = AI[e.def.id] || AI.walker;
      if (!stopped || e.def.bungee) ai.call(this, e, dt, mult, stopped);
      // ground y
      const gy = this.groundY(e.row, e.x);
      if (e.shift) e.y = SS.lerp(e.shift.y0, gy, e.shift.t / 0.8); else if ((!e.def.bungee || e.state === 'grab') && !e.def.boss) e.y = gy;
      e.inWater = this.isWater(e.row) && e.x < this.GX + this.cols * this.CW + 10 && !e.flying && !e.def.boss;
      if (e.def.submerge) e.submerged = e.inWater && e.state !== 'eat';
      if (e.removed) { this.enemies.splice(this.enemies.indexOf(e), 1); continue; }
      // house
      if (!e.hypno && e.dir < 0 && !e.def.boss && !e.def.bungee) {
        if (e.x < this.GX - 18) this.triggerMower(e.row);
        const m = this.mowers[e.row];
        if (e.x < this.GX - 95 && (!m || m.state !== 'run')) { if (!this.mode.onReachHouse || !this.mode.onReachHouse(this, e)) this.lose(); }
      }
      if ((e.hypno || e.dir > 0) && e.x > SS.W + 70) this.enemies.splice(this.enemies.indexOf(e), 1);
    }
  };

  // eat the plant in front, or walk
  function walkOrEat(b, e, dt, mult) {
    const dir = e.hypno ? 1 : e.dir;
    if (e.hypno) return hypnoStep(b, e, dt, mult);
    // fight hypnotized enemies in front
    for (const o of b.enemies) {
      if (!o.hypno || o.dying || o.row !== e.row) continue;
      const gap = (e.x - o.x) * -dir;
      if (gap > -5 && gap < 40) { e.state = 'eat'; o.hp -= 100 * dt * mult; o.flash = 0.05; if (o.hp <= 0) b.killEnemy(o, 'normal'); SS.audio.sfx('chomp'); return; }
    }
    const fp = b.frontPlant(e, dir);
    if (fp) {
      const t = b.tiles[e.row][fp.c];
      // ladders let the horde climb over walls
      if (t.ladder && dir < 0 && !e.def.giant && !e.def.vehicle && (fp.p.def.wall || fp.p.def.shell)) {
        e.state = 'climb'; e.climbT = 0; e.cx0 = e.x; e.cx1 = b.cx(fp.c) - b.CW * 0.75; return;
      }
      if (e.def.ladder && e.shield && dir < 0 && (fp.p.def.wall || fp.p.def.shell)) {
        t.ladder = true; e.shield = null; e.sp = 17; e.state = 'stun'; e.stunT = 0.6; SS.audio.sfx('metal'); return;
      }
      e.state = 'eat';
      const p = fp.p;
      if (p.def.kind === 'hypno') {
        b.removePlant(p, 'eaten');
        e.hypno = true; e.dir = 1; e.state = 'walk'; e.chill = 0;
        SS.audio.sfx('gulp');
        if (e.helm && e.def.helm && e.def.helm.look === 'board') { /* keeps sign */ }
        return;
      }
      if (p.def.kind === 'garlic') {
        e.garlicT = (e.garlicT || 0) + dt;
        p.hp -= 60 * dt; p.flash = 0.05;
        if (e.garlicT > 0.5) { e.garlicT = 0; divert(b, e); }
        if (p.hp <= 0) b.removePlant(p, 'eaten');
        return;
      }
      p.hp -= 100 * dt * mult * e.rageMul;
      p.flash = 0.06;
      SS.audio.sfx('chomp');
      if (p.hp <= 0) { b.removePlant(p, 'eaten'); e.state = 'walk'; }
      return;
    }
    e.state = 'walk';
    e.x += dir * e.sp * mult * dt;
  }
  function hypnoStep(b, e, dt, mult) {
    for (const o of b.enemies) {
      if (o.hypno || o.dying || o.row !== e.row || o.def.bungee || o.under || o.flying) continue;
      const gap = o.x - e.x;
      if (gap > -5 && gap < 40 + (o.hw || 18)) {
        e.state = 'eat';
        const dps = e.def.giant ? 600 : 100;
        b.damage(o, dps * dt * mult, { kind: 'area' });
        SS.audio.sfx('chomp');
        return;
      }
    }
    e.state = 'walk';
    e.x += e.sp * mult * dt;
  }
  function divert(b, e) {
    const opts = [e.row - 1, e.row + 1].filter((r) => b.laneOk(r) && b.isWater(r) === b.isWater(e.row));
    if (!opts.length) return;
    const nr = SS.pick(opts);
    e.shift = { y0: e.y, t: 0 };
    e.row = nr;
    e.state = 'walk';
    e.x -= 4;
  }
  function stunStep(e, dt) { e.stunT -= dt; if (e.stunT <= 0) e.state = 'walk'; }

  const AI = {};
  AI.walker = function (e, dt, mult) {
    if (e.state === 'stun') return stunStep(e, dt);
    if (e.state === 'climb') {
      e.climbT += dt / 0.9;
      e.x = SS.lerp(e.cx0, e.cx1, Math.min(1, e.climbT));
      e.inAir = true;
      if (e.climbT >= 1) { e.state = 'walk'; e.inAir = false; }
      return;
    }
    walkOrEat(this, e, dt, mult);
  };
  AI.rotter = AI.banner = AI.crate = AI.kettle = AI.grumbler = AI.gate = AI.brute = AI.minion = AI.sledder = AI.imp = AI.diver = AI.ladder = AI.walker;
  AI.vaulter = function (e, dt, mult) {
    if (e.state === 'vault') {
      e.vaultT += dt / 0.9;
      const k = Math.min(1, e.vaultT);
      e.vaultK = k;
      e.x = SS.lerp(e.vx0, e.vx1, k);
      e.inAir = k > 0.2 && k < 0.85;
      if (k >= 1) { e.state = 'walk'; e.hasPole = false; e.sp = 17; e.inAir = false; }
      return;
    }
    if (e.hasPole && !e.hypno) {
      const fp = this.frontPlant(e, -1) || armedMineAhead(this, e);
      if (fp) {
        if (fp.p.def.tall) { e.hasPole = false; e.sp = 17; e.state = 'stun'; e.stunT = 0.5; SS.audio.sfx('thud'); return; }
        e.state = 'vault'; e.vaultT = 0; e.vx0 = e.x; e.vx1 = this.cx(fp.c) - this.CW * 0.85;
        SS.audio.sfx('whoosh');
        return;
      }
      e.state = 'run';
      e.x -= e.sp * mult * dt;
      return;
    }
    AI.walker.call(this, e, dt, mult);
  };
  AI.seal = AI.vaulter;
  function armedMineAhead(b, e) {
    const c = b.colAt(e.x - e.reach);
    const t = b.tile(e.row, c);
    if (t && t.plant && t.plant.def.kind === 'mine' && t.plant.armed && Math.abs(e.x - e.reach - b.cx(c)) < 30) return { p: t.plant, c };
    return null;
  }
  AI.summoner = function (e, dt, mult) {
    if (e.summonAnim > 0) { e.summonAnim -= dt; return; }
    e.summonT -= dt;
    if (!e.hypno && e.x < this.GX + 8.4 * this.CW && (!e.summoned || (e.summonT <= 0 && e.minions.some((m) => !m || m.dying || this.enemies.indexOf(m) < 0)))) {
      e.summoned = true; e.summonT = 12; e.summonAnim = 1.2; e.state = 'summon';
      SS.audio.sfx('laugh');
      const spots = [[e.row, e.x - this.CW], [e.row, e.x + this.CW], [e.row - 1, e.x], [e.row + 1, e.x]];
      for (let i = 0; i < 4; i++) {
        const m = e.minions[i];
        if (m && !m.dying && this.enemies.indexOf(m) >= 0) continue;
        const [r, x] = spots[i];
        if (!this.laneOk(r) || this.isWater(r) || x < this.GX + 20 || x > this.GX + this.cols * this.CW) { e.minions[i] = null; continue; }
        const nm = this.spawnEnemy('minion', r, x);
        nm.rise = 1;
        e.minions[i] = nm;
      }
      return;
    }
    AI.walker.call(this, e, dt, mult);
  };
  AI.iceroller = function (e, dt, mult) {
    if (e.hypno) return hypnoStep(this, e, dt, mult);
    e.state = 'walk';
    const c = this.colAt(e.x - e.reach);
    if (c >= 0 && c < this.cols && Math.abs(e.x - e.reach - this.cx(c)) < 30) this.crushTile(e.row, c, true);
    e.x -= e.sp * mult * dt;
    if (e.def.ice && e.x < this.GX + this.cols * this.CW) this.iceX[e.row] = Math.min(this.iceX[e.row], e.x + 10);
  };
  AI.catapult = function (e, dt, mult) {
    if (e.hypno) return hypnoStep(this, e, dt, mult);
    if (e.throwT > 0) e.throwT = Math.max(0, e.throwT - dt * 2.5);
    const stopX = this.GX + 7.4 * this.CW;
    if (e.ammo > 0 && e.x <= stopX) {
      e.state = 'idle';
      e.fireT = (e.fireT === undefined ? 1.5 : e.fireT) - dt * mult;
      if (e.fireT <= 0) {
        // target the backmost plant in the lane
        let tgt = null;
        for (let c = 0; c < this.cols; c++) { const p = this.anyPlantAt(e.row, c); if (p && !p.def.flat && this.cx(c) < e.x - 20) { tgt = { p, c }; break; } }
        if (tgt) {
          e.fireT = 3; e.ammo--; e.throwT = 1;
          const t = this.tiles[e.row][tgt.c];
          this.projs.push({ type: 'elob', x0: e.x - 40, y0: e.y - 70, x: e.x, y: e.y, tx: this.cx(tgt.c), ty: this.plantY(t) - 30, t: 0, T: 1.5, arc: 140, dmg: 75, r: e.row, c: tgt.c, kind: 'clod' });
          SS.audio.sfx('lob');
        } else { e.ammo = 0; }
      }
      return;
    }
    e.state = 'walk';
    const c = this.colAt(e.x - e.reach);
    if (c >= 0 && c < this.cols && Math.abs(e.x - e.reach - this.cx(c)) < 30) this.crushTile(e.row, c, true);
    e.x -= e.sp * mult * dt;
  };
  AI.sled = function (e, dt, mult) {
    const onIce = e.x - e.reach > this.iceX[e.row] + 10;
    const fp = this.frontPlant(e, -1);
    if (!onIce || fp || e.x < this.GX + 40) {
      // split into four
      for (let i = 0; i < 4; i++) {
        const s = this.spawnEnemy('sledder', e.row, e.x - 30 + i * 26);
        s.hp = Math.max(20, e.hp / 4); s.maxHp = 200;
        s.chill = e.chill;
      }
      e.removed = true;
      return;
    }
    e.state = 'sled';
    e.x -= e.sp * mult * dt;
  };
  AI.jester = function (e, dt, mult) {
    if (e.box && !e.hypno && e.x < this.GX + this.cols * this.CW - 10) {
      e.boomT -= dt;
      if (e.boomT <= 0) {
        const c0 = this.colAt(e.x);
        for (let r = e.row - 1; r <= e.row + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) this.crushTile(r, c, false);
        SS.audio.sfx('boom');
        this.shake = 0.5;
        this.fx.push({ type: 'boom', x: e.x, y: e.y - 40, t: 0, life: 0.8, s: 1.1 });
        e.box = false;
        this.killEnemy(e, 'char');
        return;
      }
    }
    AI.walker.call(this, e, dt, mult);
  };
  AI.balloon = function (e, dt, mult) {
    if (e.state === 'fall') { e.fallT -= dt; if (e.fallT <= 0) { e.state = 'walk'; e.sp = 17; SS.audio.sfx('thud'); } return; }
    if (e.flying && !e.hypno) { e.state = 'fly'; e.x -= e.sp * mult * dt; return; }
    AI.walker.call(this, e, dt, mult);
  };
  AI.miner = function (e, dt, mult) {
    if (e.state === 'stun') return stunStep(e, dt);
    if (e.under) {
      e.state = 'dig';
      e.x -= e.sp * mult * dt;
      if (e.x <= this.GX + 22) { e.under = false; e.state = 'emerge'; e.emergeT = 1.1; e.dir = 1; e.sp = 17; SS.audio.sfx('grave'); this.fx.push({ type: 'dirt', x: e.x, y: e.y, t: 0, life: 0.6 }); }
      return;
    }
    if (e.state === 'emerge') { e.emergeT -= dt; if (e.emergeT <= 0) e.state = 'walk'; return; }
    AI.walker.call(this, e, dt, mult);
  };
  AI.pogo = function (e, dt, mult) {
    if (e.state === 'hop') {
      e.hopT += dt / 0.7;
      e.x = SS.lerp(e.hx0, e.hx1, Math.min(1, e.hopT));
      e.inAir = true;
      if (e.hopT >= 1) { e.state = 'walk'; e.inAir = false; }
      return;
    }
    if (e.spring && !e.hypno) {
      const fp = this.frontPlant(e, -1) || armedMineAhead(this, e);
      if (fp) {
        if (fp.p.def.tall) { e.spring = false; e.sp = 17; e.state = 'stun'; e.stunT = 0.6; SS.audio.sfx('metal'); return; }
        e.state = 'hop'; e.hopT = 0; e.hx0 = e.x; e.hx1 = this.cx(fp.c) - this.CW * 0.8; return;
      }
      e.state = 'walk';
      e.x -= e.sp * mult * dt;
      return;
    }
    AI.walker.call(this, e, dt, mult);
  };
  AI.snowfoot = function (e, dt, mult) {
    if (e.dir < 0 && !e.hypno) {
      e.walked += dt;
      if (e.x < this.GX + 5.5 * this.CW || e.walked > 26) { e.dir = 1; e.state = 'walk'; }
    }
    if (e.dir > 0 && !e.hypno) { e.state = 'walk'; e.x += e.sp * mult * dt; if (e.x > SS.W + 60) e.removed = true; return; }
    AI.walker.call(this, e, dt, mult);
  };
  AI.giant = function (e, dt, mult) {
    if (e.hypno) return hypnoStep(this, e, dt, mult);
    if (e.state === 'throw') {
      e.throwK += dt / 1.0;
      if (e.throwK >= 0.6 && !e.thrown) {
        e.thrown = true; e.imp = false;
        const lx = Math.max(this.GX + this.CW * 0.8, e.x - SS.rand(4, 6) * this.CW);
        const imp = this.spawnEnemy('imp', e.row, e.x);
        imp.flyIn = 0.9; imp.flyDur = 0.9; imp.fx0 = e.x; imp.fx1 = lx;
        SS.audio.sfx('whoosh');
      }
      if (e.throwK >= 1) e.state = 'walk';
      return;
    }
    if (e.state === 'smash') {
      const prev = e.smash;
      e.smash += dt * mult / 1.3;
      if (prev < 0.75 && e.smash >= 0.75) {
        const t = this.tile(e.row, e.smashC);
        if (t) {
          const sp = t.plant && t.plant.def.kind === 'spike' && t.plant.rocks ? t.plant : null;
          if (sp) { sp.rocks--; sp.flash = 0.3; this.damage(e, 40, { kind: 'pierce' }); if (sp.rocks <= 0) this.crushTile(e.row, e.smashC, false); }
          else this.crushTile(e.row, e.smashC, false);
        }
        this.shake = 0.25;
        SS.audio.sfx('thud');
      }
      if (e.smash >= 1) { e.state = 'walk'; e.smash = 0; }
      return;
    }
    if (e.imp && !e.thrown && e.hp < e.maxHp / 2 && e.x > this.GX + 4 * this.CW) { e.state = 'throw'; e.throwK = 0; return; }
    // smash anything in front, including flat plants
    const fx = e.x - e.reach, c = this.colAt(fx);
    if (c >= 0 && c < this.cols && Math.abs(fx - this.cx(c)) < 30 && this.anyPlantAt(e.row, c)) {
      e.state = 'smash'; e.smash = 0.01; e.smashC = c; return;
    }
    e.state = 'walk';
    e.x -= e.sp * mult * dt;
  };
  AI.redgiant = AI.giant;
  AI.grappler = function (e, dt, mult, stopped) {
    if (e.state === 'wait') {
      e.waitT -= dt;
      if (e.waitT <= 0) {
        // pick a plant
        const cand = this.plants.filter((p) => !p.dead && this.laneOk(p.r) && p.layer !== 'shell');
        let r, c;
        if (cand.length && SS.rng() < 0.9) { const p = SS.pick(cand); r = p.r; c = p.c; }
        else { r = SS.pick(this.lanes); c = SS.irand(1, 7); }
        e.row = r; e.tc = c; e.x = this.cx(c); e.state = 'descend'; e.dropK = 0;
        e.y = this.plantY(this.tiles[r][c]);
        SS.audio.sfx('whoosh');
      }
      return;
    }
    if (stopped && e.state === 'grab') return;
    if (e.state === 'descend') {
      e.dropK += dt / 1.0;
      if (e.dropK >= 1) {
        e.dropK = 1;
        const fern = this.canopyCovering(e.row, e.tc);
        if (fern) { fern.st.open = 1; SS.audio.sfx('thud'); e.state = 'ascend'; e.bounced = true; }
        else { e.state = 'grab'; e.grabT = 3; }
      }
      return;
    }
    if (e.state === 'grab') {
      e.grabT -= dt * mult;
      if (e.grabT <= 0) {
        const t = this.tiles[e.row][e.tc];
        const p = t.plant || t.shell || t.base;
        if (p) { e.carry = p.id; e.carryMimic = p.mimic; for (const q of [t.shell, t.plant, t.base]) if (q) this.removePlant(q); }
        e.state = 'ascend';
      }
      return;
    }
    if (e.state === 'ascend') {
      e.dropK -= dt / 0.9;
      if (e.dropK <= 0) e.removed = true;
    }
  };
  SS.ENEMY_AI = AI;
})();
