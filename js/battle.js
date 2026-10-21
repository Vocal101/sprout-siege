// Sprout Siege — battle core: lawn layout, placement, waves, sun/coins, mowers, win/lose
(function () {
  const SS = window.SS;
  const PL = () => SS.PLANTS;

  class Battle {
    constructor(level, deck, opts = {}) {
      this.level = level;
      this.opts = opts;
      this.mode = (SS.MODES && SS.MODES[level.mode]) || SS.MODES.normal;
      const sc = level.scene;
      this.scene = sc;
      this.night = sc === 'night' || sc === 'fog' || sc === 'roofnight' || !!level.storm;
      this.roof = sc === 'roof' || sc === 'roofnight';
      this.pool = sc === 'pool' || sc === 'fog';
      this.rows = this.pool ? 6 : 5;
      this.cols = 9;
      this.GX = 160;
      this.CW = 80;
      this.GY = this.roof ? 120 : 92;
      this.RH = this.pool ? 85 : this.roof ? 96 : 100;
      this.unitS = this.pool ? 0.86 : this.roof ? 0.92 : 1;
      this.t = 0;
      this.sun = level.sun !== undefined ? level.sun : 50;
      if (opts.carry && opts.carry.sun !== undefined) this.sun = opts.carry.sun;
      this.lanes = level.lanes.slice();
      this.tiles = [];
      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          row.push({ r, c, plant: null, base: null, shell: null, grave: false, crater: 0, urn: null, ladder: false, star: false, water: this.pool && (r === 2 || r === 3), disabled: this.lanes.indexOf(r) < 0 });
        }
        this.tiles.push(row);
      }
      this.plants = [];
      this.enemies = [];
      this.projs = [];
      this.fx = [];
      this.pickups = [];
      this.texts = [];
      this.iceX = new Array(this.rows).fill(Infinity);
      this.fogA = [];
      this.fogCol = level.fogCol || 0;
      for (let r = 0; r < this.rows; r++) { this.fogA.push(new Array(this.cols).fill(this.fogCol ? 1 : 0)); }
      this.fogClear = 0;
      this.deck = (deck || []).map((d) => ({ id: d.id, mimic: !!d.mimic, cd: 0 }));
      for (const d of this.deck) {
        const def = PL()[d.id];
        d.cd = def.cd >= 30 ? def.cd * 0.6 : 0;
        if (opts.carry && opts.carry.cds && opts.carry.cds[d.id] !== undefined) d.cd = opts.carry.cds[d.id];
        d.cdMax = def.cd;
      }
      this.sel = null; // {type:'deck',i} | {type:'belt',i} | {type:'shovel'} | {type:'mallet'} | {type:'cob', p}
      this.belt = null;
      this.hand = [];
      this.wave = 0;
      this.totalWaves = level.waves || 0;
      this.waveTimer = level.first || 18;
      this.waveStartHp = 0;
      this.waveSince = 0;
      this.announced = false;
      this.spawnedAll = false;
      this.skySun = !this.night && !level.conveyor && level.mode !== 'bowling' && level.mode !== 'vase' && level.mode !== 'commander' && level.mode !== 'seedrain' && level.mode !== 'laststand';
      this.skyTimer = 5;
      this.state = 'play'; // play | won | lost | reward
      this.msg = null;
      this.speedMul = level.speed || 1;
      this.kills = 0;
      this.coinsGot = 0;
      this.coinShow = 0;
      this.shake = 0;
      this.flashT = 0;
      this.mowers = [];
      const b = SS.save.bought;
      for (let r = 0; r < this.rows; r++) {
        let kind = null;
        if (this.lanes.indexOf(r) >= 0) {
          if (this.roof) kind = b.roofcleaner ? 'roof' : null;
          else if (this.tiles[r][0].water) kind = b.poolcleaner ? 'pool' : null;
          else kind = 'mower';
        }
        if (level.noMowers) kind = null;
        this.mowers.push({ r, kind, state: kind ? 'ready' : 'none', x: this.GX - 38 });
      }
      if (opts.carry && opts.carry.mowers) opts.carry.mowers.forEach((m, r) => { if (m === 'used' && this.mowers[r]) this.mowers[r].state = 'none'; });
      // graves
      if (level.graves) this.placeGraves(level.graves);
      // pots on roof
      if (level.pots) {
        for (const r of this.lanes) for (let c = 0; c < level.pots; c++) this.placePlant('claypot', r, c, { free: true });
      }
      // rake
      this.rake = null;
      if (SS.save.items.rake > 0 && !level.mode.match(/bowling|vase|commander|whack|boss/) && !this.roof) {
        const r = SS.pick(this.lanes.filter((rr) => !this.tiles[rr][0].water));
        if (r !== undefined) this.rake = { r, c: 7, x: this.cx(7) };
      }
      this.groanT = 4;
      this.mode.setup && this.mode.setup(this);
      if (this.level.conveyor && !this.belt) this.belt = { items: [], timer: 1.5, every: this.level.beltEvery || 4.2 };
      // carry over plants (survival rounds)
      if (opts.carry && opts.carry.plants) this.restorePlants(opts.carry.plants);
    }

    // ---------- layout ----------
    cx(c) { return this.GX + c * this.CW + this.CW / 2; }
    gy(r) { return this.GY + (r + 1) * this.RH - (this.pool ? 12 : 14); }
    slope(x) { if (!this.roof) return 0; const X5 = this.GX + 5 * this.CW; return x < X5 ? -(X5 - x) * 0.14 : 0; }
    groundY(r, x) { return this.gy(r) + this.slope(x); }
    colAt(x) { return Math.floor((x - this.GX) / this.CW); }
    rowAt(x, y) {
      for (let r = 0; r < this.rows; r++) {
        const top = this.GY + r * this.RH + this.slope(x), bot = top + this.RH;
        if (y >= top && y < bot) return r;
      }
      return -1;
    }
    tile(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols ? this.tiles[r][c] : null; }
    laneOk(r) { return this.lanes.indexOf(r) >= 0; }
    isWater(r) { return this.pool && (r === 2 || r === 3); }
    plantY(t) {
      let y = this.groundY(t.r, this.cx(t.c));
      if (t.base) y -= t.base.id === 'claypot' ? 22 : 6;
      else if (t.water) y += 4;
      return y;
    }
    placeGraves(n) {
      const spots = [];
      for (const r of this.lanes) { if (this.isWater(r)) continue; for (let c = 4; c < 9; c++) spots.push([r, c]); }
      SS.shuffle(spots);
      let placed = 0;
      for (const [r, c] of spots) {
        if (placed >= n) break;
        const t = this.tiles[r][c];
        if (t.grave || t.plant) continue;
        // avoid stacking too many in one row
        if (this.tiles[r].filter((tt) => tt.grave).length >= 3) continue;
        t.grave = true; t.graveV = SS.irand(0, 2); placed++;
      }
    }

    // ---------- placement ----------
    // returns 'base' | 'main' | 'shell' | 'upgrade' | 'coffee' | 'grave' or false
    canPlace(id, r, c) {
      const def = PL()[id];
      const t = this.tile(r, c);
      if (!def || !t || t.disabled) return false;
      if (t.urn) return false;
      if (this.mode.canPlace) { const m = this.mode.canPlace(this, id, r, c); if (m !== undefined) return m; }
      if (t.crater > 0) return false;
      if (this.cx(c) >= this.iceX[r] - 30 && this.iceX[r] < Infinity) return false;
      if (def.onGrave) return t.grave && !t.plant ? 'main' : false;
      if (t.grave) return false;
      if (def.kind === 'coffee') return t.plant && t.plant.asleep && !t.plant.woke ? 'coffee' : false;
      if (def.upgradeOf) {
        if (def.wide) {
          const t2 = this.tile(r, c + 1);
          if (t.plant && t.plant.id === def.upgradeOf && t2 && t2.plant && t2.plant.id === def.upgradeOf && !t.plant.wideRef && !t2.plant.wideRef) return 'upgrade';
          return false;
        }
        if (def.id === 'reedspiker') return t.base && t.base.id === 'lilyraft' && !t.plant ? 'main' : false;
        return t.plant && t.plant.id === def.upgradeOf ? 'upgrade' : false;
      }
      if (def.shell) {
        if (t.shell) return false;
        if (t.plant && t.plant.def.flat) return false;
        if (t.water && !t.base) return false;
        if (this.roof && !t.base) return false;
        return 'shell';
      }
      if (def.platform === 'water') return t.water && !t.base && !t.plant ? 'base' : false;
      if (def.platform === 'pot') { if (t.water) return false; return !t.base && !t.plant && !t.shell ? 'base' : false; }
      if (t.plant) return false;
      if (def.aquatic) return t.water && !t.base ? 'main' : false;
      if (t.water) { if (!t.base || t.base.id !== 'lilyraft') return false; if (def.ground || def.noWater) return false; return 'main'; }
      if (this.roof && !t.base) return false;
      if (t.base && t.base.id === 'claypot' && def.flat) return false;
      if (t.shell && def.flat) return false;
      return 'main';
    }
    makePlant(id, r, c, layer, mimic) {
      const def = PL()[id];
      const p = { id, def, r, c, layer, hp: def.hp, maxHp: def.hp, t: 0, timer: 0, mimic: !!mimic, st: { t: 0, seed: SS.rand(0, 10), fire: 9 }, dead: false };
      p.asleep = !!def.night && !this.night;
      p.x = this.cx(c);
      if (def.wide) p.x = this.cx(c) + this.CW / 2;
      const k = def.kind;
      if (k === 'producer' || k === 'coin') p.timer = SS.rand(3, 8);
      else if (k === 'shooter' || k === 'fume' || k === 'gloom' || k === 'cattail' || k === 'star') p.timer = 0.3;
      else if (k === 'lobber') p.timer = 0.6;
      else if (k === 'mine') p.timer = def.arm;
      else if (k === 'bomb') p.timer = def.fuse;
      else if (k === 'grave') p.timer = def.dig;
      else if (k === 'cob') p.timer = 0;
      else if (k === 'magnet') p.timer = 0;
      else if (k === 'blover') p.timer = 0.6;
      if (def.rocks) p.rocks = def.rocks;
      return p;
    }
    placePlant(id, r, c, opts = {}) {
      const layer = opts.force || this.canPlace(id, r, c);
      if (!layer) return null;
      const t = this.tiles[r][c];
      const def = PL()[id];
      if (layer === 'coffee') {
        this.fx.push({ type: 'coffee', r, c, x: this.cx(c), y: this.plantY(t) - 40, t: 0, life: 1.2, target: t.plant });
        t.plant.woke = true;
        if (!opts.silent) SS.audio.sfx('plant');
        return t.plant;
      }
      const p = this.makePlant(id, r, c, layer === 'upgrade' ? 'main' : layer, opts.mimic);
      if (layer === 'upgrade') {
        const old = t.plant;
        if (def.wide) {
          const t2 = this.tiles[r][c + 1];
          const old2 = t2.plant;
          this.plants = this.plants.filter((q) => q !== old && q !== old2);
          t.plant = p; t2.plant = p; p.wideRef = true;
        } else {
          this.plants = this.plants.filter((q) => q !== old);
          t.plant = p;
          if (old.asleep === false && old.woke) p.asleep = false;
        }
      } else if (layer === 'base') t.base = p;
      else if (layer === 'shell') t.shell = p;
      else t.plant = p;
      if (p.asleep && t.plant === p && opts.woke) p.asleep = false;
      this.plants.push(p);
      if (!opts.silent) {
        SS.audio.sfx('plant');
        const yy = this.plantY(t);
        if (t.water && !t.base) this.fx.push({ type: 'splash', x: p.x, y: yy, t: 0, life: 0.5 });
        else this.fx.push({ type: 'dirt', x: p.x, y: yy, t: 0, life: 0.4 });
      }
      if (this.level.mode === 'stars' && t.star && id === 'starprism') t.starDone = true;
      return p;
    }
    removePlant(p, how) {
      if (!p || p.dead) return;
      p.dead = true;
      const t = this.tiles[p.r][p.c];
      if (t.plant === p) t.plant = null;
      if (t.shell === p) t.shell = null;
      if (t.base === p) {
        t.base = null;
        if (t.plant) this.removePlant(t.plant, how);
        if (t.shell) this.removePlant(t.shell, how);
      }
      if (p.wideRef) { const t2 = this.tiles[p.r][p.c + 1]; if (t2 && t2.plant === p) t2.plant = null; }
      this.plants = this.plants.filter((q) => q !== p);
      if (how === 'eaten') { SS.audio.sfx('gulp'); this.mode.onPlantEaten && this.mode.onPlantEaten(this, p); }
    }
    topPlantAt(r, c) {
      const t = this.tile(r, c);
      if (!t) return null;
      return t.plant || t.shell || t.base;
    }
    // what an enemy bites on this tile (null if nothing biteable)
    eatTargetAt(r, c) {
      const t = this.tile(r, c);
      if (!t) return null;
      if (t.shell) return t.shell;
      if (t.plant && !t.plant.def.flat && !(t.plant.def.kind === 'mine' && t.plant.armed)) return t.plant;
      if (t.plant && t.plant.def.kind === 'mine' && !t.plant.armed) return t.plant;
      if (t.base) return t.base;
      return null;
    }
    restorePlants(list) {
      // list of {id, r, c, layer, hp, mimic}
      const order = { base: 0, main: 1, upgrade: 1, shell: 2 };
      list.slice().sort((a, b) => order[a.layer] - order[b.layer]).forEach((s) => {
        const t = this.tile(s.r, s.c);
        if (!t) return;
        const p = this.makePlant(s.id, s.r, s.c, s.layer, s.mimic);
        p.hp = s.hp;
        if (s.layer === 'base') t.base = p; else if (s.layer === 'shell') t.shell = p; else { t.plant = p; if (p.def.wide) { this.tiles[s.r][s.c + 1].plant = p; p.wideRef = true; } }
        if (s.woke) { p.asleep = false; p.woke = true; }
        this.plants.push(p);
      });
    }
    snapshotPlants() {
      return this.plants.map((p) => ({ id: p.id, r: p.r, c: p.c, layer: p.layer, hp: p.hp, mimic: p.mimic, woke: p.woke }));
    }

    // ---------- seeds ----------
    deckReady(i) {
      const d = this.deck[i];
      if (!d) return false;
      const cost = this.costOf(d.id);
      return d.cd <= 0 && this.sun >= cost;
    }
    costOf(id) { return this.mode.cost ? this.mode.cost(this, id) : PL()[id].cost; }
    tryPlantFromSel(r, c) {
      const s = this.sel;
      if (!s) return false;
      let id, mimic = false;
      if (s.type === 'deck') {
        const d = this.deck[s.i]; id = d.id; mimic = d.mimic;
        if (d.cd > 0 || this.sun < this.costOf(id)) { this.sel = null; SS.audio.sfx('cancel'); return false; }
      }
      else if (s.type === 'belt') { id = this.belt.items[s.i].id; }
      else if (s.type === 'hand') { id = this.hand[s.i].id; }
      else return false;
      if (SS.PLANTS[id] === undefined) return false;
      const cols = this.level.column ? this.lanes.slice() : [r];
      let placed = 0;
      for (const rr of cols) {
        const p = this.placePlant(id, rr, c, { mimic, silent: placed > 0 });
        if (p) placed++;
      }
      if (!placed) { SS.audio.sfx('cancel'); return false; }
      if (s.type === 'deck') { const d = this.deck[s.i]; this.sun -= this.costOf(id); d.cd = d.cdMax; }
      else if (s.type === 'belt') this.belt.items.splice(s.i, 1);
      else if (s.type === 'hand') this.hand.splice(s.i, 1);
      this.sel = null;
      return true;
    }

    // ---------- pickups ----------
    addSun(x, y, val, fromSky) {
      const p = { kind: 'sun', x, y, val, age: 0, life: 9, vy: 0 };
      if (fromSky) { p.y = this.GY - 20; p.ty = SS.rand(this.GY + 60, this.GY + this.rows * this.RH - 40); p.sky = true; }
      else { p.vx = SS.rand(-50, 50); p.vy = -170; p.ty = y + 30; }
      this.pickups.push(p);
      return p;
    }
    addCoin(x, y, kind) {
      const p = { kind: 'coin', coin: kind || 'silver', x, y, age: 0, life: 12, vx: SS.rand(-60, 60), vy: -220, ty: y + SS.rand(10, 30) };
      this.pickups.push(p);
      return p;
    }
    dropLoot(x, y) {
      if (this.level.mode === 'commander') return;
      const r = SS.rng();
      if (r < 0.006) this.addCoin(x, y - 30, 'diamond');
      else if (r < 0.025) this.addCoin(x, y - 30, 'gold');
      else if (r < 0.085) this.addCoin(x, y - 30, 'silver');
      else if (r < 0.0885 && SS.save.zenUnlocked) this.pickups.push({ kind: 'sprout', x, y: y - 30, age: 0, life: 14, vx: 0, vy: -200, ty: y });
    }
    collect(p) {
      if (p.collecting) return;
      p.collecting = true;
      p.cx0 = p.x; p.cy0 = p.y; p.ct = 0;
      if (p.kind === 'sun') { SS.audio.sfx('sun'); p.tx = 40; p.ty2 = 40; }
      else if (p.kind === 'coin') { SS.audio.sfx(p.coin === 'diamond' ? 'diamond' : 'coin'); p.tx = 60; p.ty2 = SS.H - 24; this.coinShow = 5; }
      else if (p.kind === 'sprout') { SS.audio.sfx('seed'); p.tx = 60; p.ty2 = SS.H - 24; }
      else if (p.kind === 'seed') { SS.audio.sfx('pick'); p.tx = 300; p.ty2 = 40; }
    }
    updatePickups(dt) {
      for (const p of this.pickups) {
        p.age += dt;
        if (p.collecting) {
          p.ct += dt / 0.55;
          const k = Math.min(1, p.ct);
          const e = 1 - Math.pow(1 - k, 3);
          p.x = SS.lerp(p.cx0, p.tx, e); p.y = SS.lerp(p.cy0, p.ty2, e);
          if (k >= 1) {
            p.done = true;
            if (p.kind === 'sun') this.sun = Math.min(9990, this.sun + p.val);
            else if (p.kind === 'coin') { const v = { silver: 10, gold: 50, diamond: 1000 }[p.coin]; SS.save.coins += v; this.coinsGot += v; }
            else if (p.kind === 'sprout') { SS.save.zen.sprouts = (SS.save.zen.sprouts || 0) + 1; }
            else if (p.kind === 'seed') { if (this.belt) this.belt.items.push({ id: p.id, x: 2000 }); else this.hand.push({ id: p.id }); }
          }
          continue;
        }
        if (p.sky) { if (p.y < p.ty) p.y += 60 * dt; }
        else if (p.vy !== undefined && p.ty !== undefined && p.kind !== 'reward') {
          p.vy += 600 * dt; p.y += p.vy * dt; p.x += (p.vx || 0) * dt;
          if (p.y >= p.ty && p.vy > 0) { p.y = p.ty; p.vy = 0; p.vx = 0; p.ty = undefined; }
        } else if (p.kind === 'reward') {
          if (p.vy !== 0) { p.vy += 500 * dt; p.y += p.vy * dt; if (p.y >= p.ty) { p.y = p.ty; p.vy = 0; } }
        }
        const auto = SS.save.settings.autoSun && p.kind === 'sun' && p.age > 1.2;
        if (auto) this.collect(p);
        if (p.kind !== 'reward' && p.age > p.life) p.done = true;
      }
      this.pickups = this.pickups.filter((p) => !p.done);
    }
    clickPickup(x, y) {
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        if (p.collecting) continue;
        const rad = p.kind === 'reward' ? 40 : p.kind === 'sun' ? 34 : 26;
        if (SS.dist(x, y, p.x, p.y) < rad) {
          if (p.kind === 'reward') { this.claimReward(p); return true; }
          this.collect(p);
          return true;
        }
      }
      return false;
    }
    hoverCoins(x, y) {
      for (const p of this.pickups) if (!p.collecting && (p.kind === 'coin' || p.kind === 'sprout') && SS.dist(x, y, p.x, p.y) < 28) this.collect(p);
    }

    // ---------- waves ----------
    isHuge(i) { return i === this.totalWaves || i % 10 === 0; }
    allowedTypes(i) {
      const pool = this.level.pool || ['rotter'];
      const uniq = Array.from(new Set(pool));
      return uniq.filter((id) => {
        const d = SS.ENEMIES[id];
        if (!d || !d.spawnable) return false;
        if (i <= 2 && uniq.length > 1 && id !== 'rotter' && uniq.indexOf('rotter') >= 0 && this.totalWaves > 4) return false;
        if (d.w >= 7 && i < 6 && this.totalWaves > 6) return false;
        if (d.w >= 4 && i < 3 && this.totalWaves > 4) return false;
        if (d.needsIce && !this.iceX.some((x) => x < Infinity)) return false;
        if (d.waterOnly && !this.lanes.some((r) => this.isWater(r))) return false;
        if (d.night && !this.night && this.level.world !== 2) return false;
        return true;
      });
    }
    lanesFor(def) {
      return this.lanes.filter((r) => {
        const w = this.isWater(r);
        if (def.waterOnly && !w) return false;
        if (def.landOnly && w) return false;
        if (w && !def.swim && !def.waterOnly) return false;
        if (def.needsIce && this.iceX[r] === Infinity) return false;
        if (def.summon && w) return false;
        return true;
      });
    }
    budgetFor(i) {
      let b = Math.floor(this.level.b0 + this.level.g * i);
      if (this.opts.round) b = Math.floor(b + this.opts.round * this.level.g * 3);
      if (this.isHuge(i)) b = Math.ceil(b * 2.5);
      if (this.level.mode === 'little') b *= 2;
      return Math.max(1, b);
    }
    spawnWave(i) {
      const huge = this.isHuge(i);
      let budget = this.budgetFor(i);
      const types = this.allowedTypes(i);
      const list = [];
      if (huge) list.push('banner');
      let guard = 0;
      while (budget > 0 && guard++ < 200) {
        const opts = types.filter((id) => SS.ENEMIES[id].w <= budget);
        if (!opts.length) break;
        const id = SS.wpick(opts, (id) => (id === 'rotter' ? 1.4 : 1));
        list.push(id);
        budget -= SS.ENEMIES[id].w;
      }
      if (this.mode.waveList) this.mode.waveList(this, list, i);
      const laneLoad = {};
      let hp = 0;
      list.forEach((id, k) => {
        const def = SS.ENEMIES[id];
        if (this.mode.spawnPos) {
          const pos = this.mode.spawnPos(this, id, def);
          if (pos) { const e = this.spawnEnemy(id, pos.r, pos.x, pos.o || {}); if (e) hp += e.hp + (e.helm ? e.helm.hp : 0) + (e.shield ? e.shield.hp : 0); return; }
        }
        let ls = this.lanesFor(def);
        if (!ls.length) { ls = this.lanesFor(SS.ENEMIES.rotter); id = 'rotter'; }
        ls.sort((a, b) => (laneLoad[a] || 0) - (laneLoad[b] || 0) + (SS.rng() - 0.5) * 1.5);
        const r = ls[0];
        laneLoad[r] = (laneLoad[r] || 0) + def.w + 1;
        const x = SS.W + 25 + SS.rand(0, huge ? 140 : 70) + (id === 'banner' ? -10 : 0);
        const e = this.spawnEnemy(id, r, x);
        if (e) hp += e.hp + (e.helm ? e.helm.hp : 0) + (e.shield ? e.shield.hp : 0);
      });
      if (this.level.snowfoot && i === Math.floor(this.totalWaves * 0.6)) { const ls = this.lanesFor(SS.ENEMIES.rotter); this.spawnEnemy('snowfoot', SS.pick(ls), SS.W + 40); }
      this.waveStartHp = Math.max(1, hp);
      this.waveSince = 0;
      if (i === this.totalWaves && this.totalWaves > 1) {
        this.msg = { text: 'FINAL WAVE', t: 0, life: 3, big: true, col: '#ff4a2a' };
        SS.audio.sfx('siren');
        // graves erupt
        for (const row of this.tiles) for (const t of row) if (t.grave && !t.disabled) {
          const gid = SS.pick(['rotter', 'rotter', 'crate', 'kettle'].filter((q) => this.level.pool.indexOf(q) >= 0 || q === 'rotter'));
          const e = this.spawnEnemy(gid, t.r, this.cx(t.c) + 4);
          if (e) { e.rise = 1; }
        }
      }
      if (i === 1) SS.audio.sfx('groan');
      this.mode.onWave && this.mode.onWave(this, i);
    }
    aliveWaveHp() {
      let hp = 0;
      for (const e of this.enemies) if (!e.dying && !e.hypno) hp += e.hp + (e.helm ? e.helm.hp : 0) + (e.shield ? e.shield.hp : 0);
      return hp;
    }
    updateWaves(dt) {
      if (this.mode.noWaves || this.hold || this.totalWaves <= 0) return;
      if (this.wave >= this.totalWaves) { this.spawnedAll = true; return; }
      this.waveTimer -= dt;
      this.waveSince += dt;
      if (this.wave > 0 && this.waveSince > 6 && this.waveTimer > 3 && this.aliveWaveHp() < this.waveStartHp * 0.45) this.waveTimer = 3;
      if (this.wave > 0 && this.waveSince > 4 && this.waveTimer > 1 && this.aliveWaveHp() <= 0) this.waveTimer = 1;
      const next = this.wave + 1;
      if (this.isHuge(next) && !this.announced && this.waveTimer <= 6) {
        this.announced = true;
        if (this.waveTimer < 5) this.waveTimer = 5;
        this.msg = { text: 'A huge wave of Rotters is approaching!', t: 0, life: 4, col: '#ff3a2a' };
        SS.audio.sfx('alarm');
      }
      if (this.waveTimer <= 0) {
        this.wave = next;
        this.announced = false;
        this.spawnWave(next);
        this.waveTimer = this.level.interval || 25;
        if (this.isHuge(next + 1)) this.waveTimer += 4;
      }
    }

    // ---------- mowers ----------
    updateMowers(dt) {
      for (const m of this.mowers) {
        if (m.state === 'run') {
          m.x += 420 * dt;
          for (const e of this.enemies) {
            if (e.row !== m.r || e.dying || e.def.boss || e.under) continue;
            if (Math.abs(e.x - m.x) < 34) this.killEnemy(e, 'mower');
          }
          if (m.x > SS.W + 60) m.state = 'gone';
        }
      }
    }
    triggerMower(r) {
      const m = this.mowers[r];
      if (m && m.state === 'ready') { m.state = 'run'; SS.audio.sfx('mower'); return true; }
      return false;
    }

    // ---------- main update ----------
    update(dt) {
      if (this.state === 'lost') { this.loseT = (this.loseT || 0) + dt; return; }
      dt *= 1;
      this.t += dt;
      if (this.msg) { this.msg.t += dt; if (this.msg.t > this.msg.life) this.msg = null; }
      for (const tx of this.texts) tx.t += dt;
      this.texts = this.texts.filter((tx) => tx.t < tx.life);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2);
      if (this.flashT > 0) this.flashT -= dt;
      if (this.coinShow > 0) this.coinShow -= dt;
      // seed cooldowns
      for (const d of this.deck) if (d.cd > 0) d.cd -= dt;
      // sky sun
      if (this.skySun && this.state === 'play') {
        this.skyTimer -= dt;
        if (this.skyTimer <= 0) { this.skyTimer = SS.rand(8.5, 11); this.addSun(SS.rand(this.GX + 20, this.GX + this.cols * this.CW - 20), 0, 25, true); }
      }
      // belt
      if (this.belt) this.updateBelt(dt);
      // craters
      for (const row of this.tiles) for (const t of row) if (t.crater > 0) t.crater -= dt;
      // fog
      if (this.fogCol) this.updateFog(dt);
      if (this.state === 'play') this.updateWaves(dt);
      this.mode.update && this.mode.update(this, dt);
      this.updatePlants(dt);
      this.updateEnemies(dt);
      this.updateProjs(dt);
      this.updateMowers(dt);
      this.updatePickups(dt);
      this.updateFx(dt);
      // groans
      this.groanT -= dt;
      if (this.groanT <= 0) { this.groanT = SS.rand(5, 12); if (this.enemies.some((e) => !e.dying)) SS.audio.sfx('groan'); }
      // win check
      if (this.state === 'play') {
        const winNow = this.mode.checkWin ? this.mode.checkWin(this) : (this.spawnedAll && this.wave >= this.totalWaves && !this.enemies.some((e) => !e.dying && !e.hypno && !e.def.rare));
        if (winNow) this.onCleared();
      }
    }
    updateBelt(dt) {
      const B = this.belt;
      if (this.state === 'play' && !this.level.noBeltSpawn && !this.noBeltSpawn) {
        B.timer -= dt;
        if (B.timer <= 0 && B.items.length < 10) {
          B.timer = B.every * SS.rand(0.85, 1.2);
          const pool = this.mode.beltPool ? this.mode.beltPool(this) : this.level.conveyor;
          const ids = Object.keys(pool).filter((k) => pool[k] > 0 && (SS.PLANTS[k] || k.startsWith('bowl')));
          if (ids.length) {
            // avoid long streaks of the same item
            let id = SS.wpick(ids, (k) => pool[k]);
            const last = B.items.slice(-2).map((q) => q.id);
            if (last.length === 2 && last[0] === id && last[1] === id && ids.length > 1) id = SS.wpick(ids.filter((k) => k !== id), (k) => pool[k]);
            B.items.push({ id, x: 2000 });
          }
        }
      }
      // slide items toward the left
      const slotW = 62, x0 = 96;
      B.items.forEach((it, i) => {
        const tx = x0 + i * slotW;
        if (it.x > tx) it.x = Math.max(tx, it.x - 70 * dt);
        if (it.x > 700) it.x = Math.min(it.x, 760);
      });
    }
    updateFog(dt) {
      if (this.fogClear > 0) this.fogClear -= dt;
      const lanterns = this.plants.filter((p) => p.def.kind === 'lantern' && !p.asleep);
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        let target = c >= this.fogCol ? 1 : 0;
        if (this.fogClear > 0) target = 0;
        else for (const l of lanterns) { const dr = Math.abs(l.r - r), dc = Math.abs(l.c - c); if (dr + dc <= 2 || (dr <= 1 && dc <= 2) || (dc <= 1 && dr <= 2)) { if (dr + dc <= 3) target = 0; } }
        const a = this.fogA[r][c];
        this.fogA[r][c] = a + (target - a) * Math.min(1, dt * (target < a ? 4 : (this.fogClear > -3 ? 0.4 : 1.5)));
      }
    }
    updateFx(dt) {
      for (const f of this.fx) {
        f.t += dt;
        this.fxLogic(f);
        if (f.type === 'coffee' && f.t >= f.life && f.target && !f.target.dead) { f.target.asleep = false; SS.audio.sfx('pick'); }
      }
      this.fx = this.fx.filter((f) => f.t < f.life);
    }
    floatText(text, x, y, col) { this.texts.push({ text, x, y, t: 0, life: 1.4, col: col || '#fff' }); }

    // ---------- end states ----------
    onCleared() {
      this.state = 'won';
      if (this.mode.onCleared && this.mode.onCleared(this)) return;
      this.dropReward();
    }
    dropReward(x, y) {
      const lastE = this.lastKillPos || { x: this.GX + 6 * this.CW, y: this.gy(2) };
      const rw = this.rewardInfo();
      this.pickups.push({ kind: 'reward', reward: rw, x: SS.clamp(x || lastE.x, this.GX + 40, this.GX + this.cols * this.CW - 40), y: (y || lastE.y) - 120, ty: (y || lastE.y) - 40, vy: -200, age: 0 });
      this.state = 'reward';
      SS.audio.sfx('wave');
    }
    rewardInfo() {
      const lv = this.level;
      const sv = SS.save;
      if (lv.world && lv.reward) {
        const done = sv.advDone[lv.key];
        if (!done) return Object.assign({ first: true }, lv.reward);
        return { coins: 250, replay: true };
      }
      if (this.opts.survival) return { survival: true };
      const done = (lv.key.startsWith('mini_') ? sv.mini : sv.puzzle)[lv.key];
      return done ? { coins: 300, replay: true } : { trophy: true, coins: 1000 };
    }
    claimReward(p) {
      if (p.claimed) return;
      p.claimed = true;
      SS.audio.sfx('win');
      this.state = 'claiming';
      this.claimT = 0;
      this.claimPick = p;
      SS.audio.stopMusic();
    }
    lose() {
      if (this.state === 'lost' || this.state === 'won' || this.state === 'reward' || this.state === 'claiming') return;
      this.state = 'lost';
      this.loseT = 0;
      SS.audio.stopMusic();
      SS.audio.sfx('lose');
    }
  }
  SS.Battle = Battle;
})();
