// Sprout Siege — menus: title, adventure map, seed select, results, shop, almanac, mode lists, options, credits
(function () {
  const SS = window.SS;
  const A = SS.art, ui = SS.ui;
  const TAU = Math.PI * 2;

  // ---------- Mabel, the neighbor who runs the seed cart (original character) ----------
  A.mabel = function (c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const bob = Math.sin((t || 0) * 2) * 1.5;
    // cardigan body
    c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-34, -44, -16, -52); c.lineTo(16, -52); c.quadraticCurveTo(34, -44, 30, 0); c.closePath();
    c.fillStyle = A.lgrad(c, -30, 0, 30, 0, '#5aa06a', '#2f6a3c'); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1f2a10'; c.stroke();
    c.fillStyle = '#f2e8d0'; c.beginPath(); c.moveTo(-8, -52); c.lineTo(0, -30); c.lineTo(8, -52); c.closePath(); c.fill();
    for (let i = 0; i < 3; i++) A.ell(c, 0, -26 + i * 9, 2, 2, '#d8c060', false);
    c.translate(0, bob);
    // face
    A.ell(c, 0, -72, 21, 22, A.rgrad(c, 0, -72, 22, '#ffe2c8', '#e0a888'), '#1f2a10', 2);
    // hair bun
    A.ell(c, 0, -93, 18, 8, '#d8d8e0', '#5a5a6a', 1.5);
    A.ell(c, 0, -100, 9, 8, '#d8d8e0', '#5a5a6a', 1.5);
    // sun hat
    c.beginPath(); c.ellipse(0, -88, 34, 8, 0, 0, TAU); c.fillStyle = '#e8d08a'; c.fill(); c.strokeStyle = '#7a5a2a'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.ellipse(0, -96, 18, 12, 0, Math.PI, TAU); c.fill(); c.stroke();
    c.fillStyle = '#c84a6a'; c.fillRect(-18, -94, 36, 4);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; A.ell(c, 16 + Math.cos(a) * 4, -96 + Math.sin(a) * 4, 3, 3, '#ff8ab8', false); }
    A.ell(c, 16, -96, 2, 2, '#ffe14a', false);
    // glasses
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.8;
    c.beginPath(); c.arc(-8, -74, 6, 0, TAU); c.moveTo(14, -74); c.arc(8, -74, 6, 0, TAU); c.moveTo(-2, -74); c.lineTo(2, -74); c.stroke();
    A.ell(c, -8, -74, 1.8, 2, '#2a1a0a', false); A.ell(c, 8, -74, 1.8, 2, '#2a1a0a', false);
    A.ell(c, -14, -64, 4, 2.5, 'rgba(240,120,120,0.45)', false); A.ell(c, 14, -64, 4, 2.5, 'rgba(240,120,120,0.45)', false);
    c.beginPath(); c.arc(0, -62, 6, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 2; c.stroke();
    c.restore();
  };

  // ---------- helpers ----------
  SS.ownedPlants = function () {
    const out = [];
    for (const p of SS.PLANT_LIST) {
      if (p.upgrade || p.mimic) { if (SS.save.bought[p.id]) out.push(p.id); }
      else if (SS.save.plants.indexOf(p.id) >= 0) out.push(p.id);
    }
    return out;
  };
  const FEATURE = { almanac: '1-9', shop: '2-4', minigames: '2-8', survival: '3-8', zen: '3-9', puzzle: '4-8' };
  SS.featureOpen = function (f) {
    if (SS.save.debugAll) return true;
    const key = FEATURE[f];
    return !key || SS.save.adv > SS.ADV_INDEX[key];
  };
  SS.featureNeed = (f) => FEATURE[f];

  function sceneBg(c, t, night) {
    const sky = c.createLinearGradient(0, 0, 0, SS.H);
    sky.addColorStop(0, night ? '#101a3a' : '#7ec8f0'); sky.addColorStop(0.6, night ? '#2a3a60' : '#d8f2fa'); sky.addColorStop(1, night ? '#2a3a60' : '#d8f2fa');
    c.fillStyle = sky; c.fillRect(0, 0, SS.W, SS.H);
    // clouds
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 290 + t * 12) % (SS.W + 300)) - 150, y = 60 + i * 34;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + k * 26, y + (k % 2) * -10, 24, 0, TAU); c.fill(); }
    }
    // hills
    c.fillStyle = '#5aa83a'; c.beginPath(); c.moveTo(0, 420); c.quadraticCurveTo(250, 340, 520, 410); c.quadraticCurveTo(780, 470, 1000, 380); c.lineTo(1000, 640); c.lineTo(0, 640); c.fill();
    c.fillStyle = '#4a9a30'; c.beginPath(); c.moveTo(0, 480); c.quadraticCurveTo(320, 420, 640, 470); c.quadraticCurveTo(860, 500, 1000, 460); c.lineTo(1000, 640); c.lineTo(0, 640); c.fill();
    // lawn stripes
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#78bc48' : '#6cb03e'; c.fillRect(0, 520 + i * 20, SS.W, 20); }
  }
  function signButton(c, x, y, w, h, label, o = {}) {
    const hov = !o.locked && ui.hover(x, y, w, h);
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.rotate((o.tilt || 0) + (hov ? Math.sin(SS.time * 8) * 0.01 : 0));
    // post
    c.fillStyle = '#6a4a22'; c.fillRect(-6, h / 2 - 4, 12, 18);
    ui.rrect(c, -w / 2, -h / 2, w, h, 8);
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, o.locked ? '#9a9080' : hov ? '#e8b878' : '#d8a060'); g.addColorStop(1, o.locked ? '#6a6050' : hov ? '#b07a3a' : '#9a6a2a');
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2008'; c.stroke();
    c.strokeStyle = 'rgba(60,30,5,0.35)'; c.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-w / 2 + 6, -h / 2 + (h * i) / 3); c.lineTo(w / 2 - 6, -h / 2 + (h * i) / 3); c.stroke(); }
    ui.text(c, label, 0, o.sub ? -7 : 1, { size: o.size || 22, color: o.locked ? '#d8d0c0' : '#fff8e0', stroke: '#3a2008', sw: 4 });
    if (o.sub) ui.text(c, o.sub, 0, 15, { size: 12, color: o.locked ? '#e8e0d0' : '#ffe9a8', stroke: '#3a2008', sw: 3 });
    c.restore();
    if (!o.locked && ui.hit(x, y, w, h)) { SS.audio.sfx('click'); return true; }
    if (o.locked && ui.hit(x, y, w, h)) { SS.audio.sfx('cancel'); }
    return false;
  }
  SS.signButton = signButton;
  function coinBox(c, x, y) {
    ui.rrect(c, x, y, 150, 34, 9); c.fillStyle = 'rgba(40,30,10,0.8)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#d8b050'; c.stroke();
    A.coin(c, x + 20, y + 17, 'gold', 0);
    ui.text(c, '$' + SS.fmt(SS.save.coins), x + 88, y + 18, { size: 17, color: '#ffe680' });
  }
  SS.coinBox = coinBox;
  function backButton(c, onClick) { if (ui.button(c, 16, 16, 110, 38, 'Back', { color: '#a8583a', size: 18 })) onClick(); }

  // ---------- title ----------
  SS.TitleScene = function () {
    let t = 0;
    let options = false, confirmReset = 0;
    const demo = [{ id: 'glowpetal', x: 140 }, { id: 'pippod', x: 220 }, { id: 'twinpod', x: 300 }, { id: 'barkshell', x: 390 }];
    const rot = { def: SS.ENEMIES.rotter, state: 'walk', anim: 0, hp: 200, maxHp: 200, scale: 1 };
    const crate = { def: SS.ENEMIES.crate, state: 'walk', anim: 1, hp: 200, maxHp: 200, helm: { hp: 370, max: 370 }, scale: 1 };
    return {
      enter() { SS.audio.music('title'); SS.fade = 1; },
      update(dt) { t += dt; rot.anim += dt; crate.anim += dt; },
      draw(c) {
        sceneBg(c, t, false);
        // house
        c.fillStyle = '#efe4c8'; c.fillRect(20, 300, 190, 240); c.fillStyle = '#a84a30';
        c.beginPath(); c.moveTo(0, 310); c.lineTo(115, 220); c.lineTo(230, 310); c.fill();
        c.fillStyle = '#8a5a2a'; c.fillRect(90, 430, 50, 110); c.fillStyle = '#a8d8f0'; c.fillRect(40, 340, 50, 44); c.fillRect(150, 340, 44, 44);
        for (const d of demo) A.plant(c, d.id, d.x + 120, 590, 1, { t, seed: d.x });
        A.enemy(c, rot, 760 - ((t * 10) % 40), 595, 1);
        A.enemy(c, crate, 880 - ((t * 10) % 40), 590, 1);
        // logo
        c.save(); c.translate(330, 110); c.rotate(-0.04);
        ui.rrect(c, -250, -70, 500, 140, 22);
        c.fillStyle = A.lgrad(c, 0, -70, 0, 70, '#9ad85a', '#3f8a22'); c.fill(); c.lineWidth = 6; c.strokeStyle = '#1f3a10'; c.stroke();
        ui.text(c, 'SPROUT', 0, -22, { size: 62, color: '#fff8d0', stroke: '#2a4a10', sw: 8 });
        ui.text(c, 'SIEGE', 0, 40, { size: 62, color: '#ffd23a', stroke: '#5a2a08', sw: 8 });
        A.leaf(c, -240, -60, 50, 16, -0.9, '#5cae33'); A.leaf(c, 230, -60, 50, 16, -2.2, '#5cae33');
        c.restore();
        ui.text(c, 'Defend the garden from the Rotter horde', 330, 205, { size: 17, color: '#2a4a10', stroke: '#e8f8d0', sw: 3 });
        // buttons
        const sv = SS.save;
        const cur = SS.ADVENTURE[Math.min(sv.adv, 49)];
        const advLabel = sv.adv >= 50 ? 'Adventure' : 'Adventure';
        const advSub = sv.adv >= 50 ? 'Complete!' : 'Level ' + cur.key;
        const bx = 640, bw = 320;
        if (signButton(c, bx, 40, bw, 70, advLabel, { sub: advSub, size: 28, tilt: 0.02 })) SS.setScene(SS.AdventureScene());
        const items = [
          ['Minigames', 'minigames', () => SS.setScene(SS.ListScene('mini'))],
          ['Puzzles', 'puzzle', () => SS.setScene(SS.ListScene('puzzle'))],
          ['Survival', 'survival', () => SS.setScene(SS.ListScene('survival'))],
          ['Zen Garden', 'zen', () => SS.setScene(SS.ZenScene())],
          ['Almanac', 'almanac', () => SS.setScene(SS.AlmanacScene())],
          ['Seed Cart', 'shop', () => SS.setScene(SS.ShopScene())],
        ];
        items.forEach(([label, f, go], i) => {
          const open = SS.featureOpen(f);
          const x = bx + (i % 2) * (bw / 2 + 4), y = 128 + Math.floor(i / 2) * 76;
          if (signButton(c, x, y, bw / 2 - 4, 60, label, { locked: !open, size: 19, sub: open ? null : 'Beat ' + SS.featureNeed(f), tilt: (i % 2 ? -0.02 : 0.015) })) go();
        });
        if (ui.button(c, bx, 362, 150, 38, 'Options', { color: '#6a8aa8', size: 17 })) options = true;
        coinBox(c, bx + 170, 364);
        if (options) this.drawOptions(c);
      },
      drawOptions(c) {
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, SS.W, SS.H);
        const x = 300, y = 120, w = 400, h = 400;
        ui.panel(c, x, y, w, h);
        ui.text(c, 'Options', SS.W / 2, y + 36, { size: 30, color: '#3a2008' });
        const st = SS.save.settings;
        const slider = (label, key, yy) => {
          ui.text(c, label, x + 40, yy, { size: 17, align: 'left', color: '#3a2008' });
          ui.rrect(c, x + 160, yy - 8, 180, 16, 8); c.fillStyle = '#8a6a3a'; c.fill();
          ui.rrect(c, x + 160, yy - 8, 180 * st[key], 16, 8); c.fillStyle = '#7ac040'; c.fill();
          if (SS.input.down && ui.hover(x + 155, yy - 16, 190, 32)) { st[key] = SS.clamp((SS.input.x - x - 160) / 180, 0, 1); SS.audio.applyVolume(); }
        };
        slider('Music', 'music', y + 90);
        slider('Sound', 'sfx', y + 130);
        if (ui.button(c, x + 40, y + 160, 320, 38, 'Auto-collect sun: ' + (st.autoSun ? 'ON' : 'OFF'), { color: '#6a8aa8', size: 16 })) st.autoSun = !st.autoSun;
        if (ui.button(c, x + 40, y + 208, 320, 38, 'Fullscreen', { color: '#6a8aa8', size: 16 })) { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignore */ } }
        if (ui.button(c, x + 40, y + 256, 320, 38, confirmReset ? 'Click again to erase ALL progress' : 'Reset save data', { color: '#c83a2a', size: 15 })) {
          if (confirmReset) { SS.resetSave(); confirmReset = 0; } else confirmReset = 1;
        }
        if (ui.button(c, x + 100, y + 320, 200, 46, 'Done', { size: 20 })) { options = false; confirmReset = 0; SS.persist(); }
        if (SS.input.click) SS.input.consume();
      },
    };
  };

  // ---------- adventure map ----------
  SS.AdventureScene = function () {
    let t = 0;
    let world = Math.min(4, Math.floor(Math.min(SS.save.adv, 49) / 10));
    const names = ['The Front Lawn', 'Nightfall', 'The Back Pool', 'Fog Bank', 'Up on the Roof'];
    const cols = ['#6cb03e', '#36623f', '#4ab0d8', '#5a6a8a', '#b8583a'];
    return {
      enter() { SS.audio.music('title'); },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, world === 1 || world === 3);
        backButton(c, () => SS.setScene(SS.TitleScene()));
        coinBox(c, SS.W - 170, 18);
        ui.text(c, 'Adventure', SS.W / 2, 36, { size: 36, color: '#fff8d0', stroke: '#3a2008', sw: 6 });
        // world tabs
        for (let w = 0; w < 5; w++) {
          const open = SS.save.adv >= w * 10 || SS.save.debugAll;
          const x = 120 + w * 156, y = 74;
          if (ui.button(c, x, y, 148, 40, 'World ' + (w + 1), { color: w === world ? '#e8a030' : open ? cols[w] : '#777', disabled: !open, size: 16 })) world = w;
        }
        ui.text(c, names[world], SS.W / 2, 140, { size: 26, color: '#fff', stroke: '#2a1a08', sw: 5 });
        // path of levels
        const pts = [];
        for (let i = 0; i < 10; i++) { const x = 120 + i * 84, y = 300 + Math.sin(i * 1.1) * 80; pts.push([x, y]); }
        c.strokeStyle = 'rgba(120,80,40,0.8)'; c.lineWidth = 14; c.lineCap = 'round';
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        c.strokeStyle = 'rgba(220,190,130,0.9)'; c.lineWidth = 8; c.stroke();
        for (let i = 0; i < 10; i++) {
          const idx = world * 10 + i;
          const lv = SS.ADVENTURE[idx];
          const [x, y] = pts[i];
          const done = !!SS.save.advDone[lv.key];
          const open = idx <= SS.save.adv || SS.save.debugAll;
          const cur = idx === SS.save.adv;
          const hov = open && SS.dist(SS.input.x, SS.input.y, x, y) < 34;
          const r = 30 + (cur ? Math.sin(t * 4) * 3 : 0) + (hov ? 3 : 0);
          A.ell(c, x, y + 4, r, r, 'rgba(0,0,0,0.25)', false);
          A.ell(c, x, y, r, r, open ? (done ? '#8ad04a' : cur ? '#ffd23a' : '#e8c890') : '#8a8a80', '#3a2008', 3);
          ui.text(c, lv.key, x, y - (lv.minigame || lv.mode === 'boss' ? 5 : 0), { size: 17, color: open ? '#2a1a08' : '#4a4a40' });
          if (lv.minigame) ui.text(c, '★', x, y + 13, { size: 12, color: '#a83a1a' });
          if (lv.mode === 'conveyor') ui.text(c, '≡', x, y + 13, { size: 12, color: '#3a3a8a' });
          if (lv.mode === 'boss') ui.text(c, 'BOSS', x, y + 13, { size: 10, color: '#a81a1a' });
          if (done) ui.text(c, '✔', x + 22, y - 22, { size: 18, color: '#2a7a1a', stroke: '#fff', sw: 3 });
          if (hov) {
            const info = lv.minigame || (lv.mode === 'conveyor' ? 'Conveyor level' : lv.mode === 'boss' ? 'Final battle' : (lv.waves >= 20 ? lv.waves / 10 + ' flags' : '1 flag'));
            ui.rrect(c, x - 90, y + 40, 180, 50, 8); c.fillStyle = 'rgba(255,248,220,0.95)'; c.fill(); c.strokeStyle = '#6b4a1e'; c.lineWidth = 2; c.stroke();
            ui.text(c, info, x, y + 56, { size: 13, color: '#2a1a08' });
            const rw = lv.reward;
            const rtxt = done ? 'Replay: coin bag' : rw.plant ? 'Reward: ' + SS.PLANTS[rw.plant].name : rw.item === 'shovel' ? 'Reward: Shovel' : rw.coins ? 'Reward: coins' : '';
            ui.text(c, rtxt, x, y + 75, { size: 12, color: '#6a4a1a', bold: false });
          }
          if (open && ui.hit(x - r, y - r, r * 2, r * 2)) { SS.audio.sfx('click'); SS.startLevel(lv); return; }
        }
        // preview rotters of this world
        const pool = Array.from(new Set(SS.ADVENTURE.slice(world * 10, world * 10 + 10).flatMap((l) => l.pool || [])));
        ui.text(c, 'Rotters you will meet:', SS.W / 2, 450, { size: 16, color: '#fff', stroke: '#2a1a08', sw: 3 });
        pool.slice(0, 11).forEach((id, i) => {
          const def = SS.ENEMIES[id];
          const x = SS.W / 2 - (Math.min(pool.length, 11) - 1) * 40 + i * 80;
          c.save(); c.beginPath(); c.rect(x - 38, 462, 76, 120); c.clip();
          A.enemy(c, { def, state: 'walk', anim: t + i, hp: 1, maxHp: 1, helm: def.helm ? { hp: 1, max: 1 } : null, shield: def.shield ? { hp: 1, max: 1 } : null, hasPole: true, box: true, spring: true, pick: true, imp: true, balloon: true, scale: 1, ammo: 1 }, x, 575, def.giant ? 0.42 : def.vehicle ? 0.6 : 0.7);
          c.restore();
        });
      },
    };
  };

  // ---------- starting levels ----------
  function needsSelect(level) {
    if (level.conveyor || ['bowling', 'whack', 'vase', 'commander', 'boss', 'seedrain'].indexOf(level.mode) >= 0) return false;
    return true;
  }
  function autoDeck(level) {
    let owned = SS.ownedPlants();
    if (level.index !== undefined && level.index === 0) owned = ['pippod'];
    return owned.slice(0, SS.save.slots).map((id) => ({ id }));
  }
  SS.startLevel = function (level, opts = {}) {
    if (level.grant) for (const g of level.grant) if (SS.save.plants.indexOf(g) < 0) SS.save.plants.push(g);
    SS.save.stats.played++;
    SS.persist();
    const from = opts.from || {};
    const go = (deck) => {
      const o = Object.assign({}, opts.restart ? { round: 0 } : {}, { deck, survival: level.mode === 'survival', streak: 0 });
      if (opts.carry) o.carry = opts.carry;
      if (opts.round) o.round = opts.round;
      SS.setScene(SS.BattleScene(level, deck, o));
    };
    if (opts.restart && from.deck && !from.round) return go(from.deck);
    if (opts.restart && from.survival) return SS.startLevel(level, {});
    if (!needsSelect(level)) return go([]);
    const owned = SS.ownedPlants();
    if (owned.length <= SS.save.slots && level.mode !== 'stars' && level.mode !== 'survival' && level.mode !== 'laststand') return go(autoDeck(level));
    SS.setScene(SS.SeedSelectScene(level, go, opts));
  };
  SS.nextSurvivalRound = function (b, round) {
    const carry = { plants: b.snapshotPlants(), sun: b.sun, mowers: b.mowers.map((m) => (m.state === 'ready' ? 'ready' : 'used')) };
    const best = SS.save.survival[b.level.key + '_best'] || 0;
    if (round > best) SS.save.survival[b.level.key + '_best'] = round;
    SS.persist();
    SS.setScene(SS.SeedSelectScene(b.level, (deck) => SS.setScene(SS.BattleScene(b.level, deck, { deck, survival: true, round, carry })), { round, carry, prevDeck: b.deck }));
  };
  SS.goMenu = function () { SS.persist(); SS.setScene(SS.TitleScene()); };

  SS.finishLevel = function (b) {
    const lv = b.level, sv = SS.save;
    const rw = b.claimPick.reward;
    const result = { level: lv, reward: rw, coins: b.coinsGot, kills: b.kills };
    if (rw.coins) sv.coins += rw.coins;
    if (lv.world) {
      if (rw.first) {
        if (rw.plant && sv.plants.indexOf(rw.plant) < 0) sv.plants.push(rw.plant);
        if (rw.item === 'shovel') sv.shovel = true;
        if (rw.unlock === 'zen') { sv.zenUnlocked = true; sv.zen.sprouts = (sv.zen.sprouts || 0) + 2; }
      }
      sv.advDone[lv.key] = true;
      sv.adv = Math.max(sv.adv, lv.index + 1);
      if (lv.index === 1 && !sv.shovel) { /* shovel comes at 1-5 */ }
    } else if (lv.key.startsWith('mini_')) sv.mini[lv.key] = true;
    else if (lv.key.startsWith('surv_')) sv.survival[lv.key] = true;
    else sv.puzzle[lv.key] = true;
    SS.persist();
    SS.setScene(SS.ResultsScene(result));
  };

  // ---------- seed select ----------
  SS.SeedSelectScene = function (level, onStart, opts = {}) {
    let t = 0;
    const slots = SS.save.slots;
    const owned = SS.ownedPlants();
    let chosen = [];
    if (opts.prevDeck) chosen = opts.prevDeck.map((d) => ({ id: d.id, mimic: d.mimic })).filter((d) => owned.indexOf(d.id) >= 0 || d.mimic).slice(0, slots);
    else if (SS.save.lastDeck) chosen = SS.save.lastDeck.filter((d) => owned.indexOf(d.id) >= 0 && (!d.mimic || SS.save.bought.mimicseed)).slice(0, slots);
    if (level.mode === 'stars' && !chosen.some((d) => d.id === 'starprism') && owned.indexOf('starprism') >= 0) { chosen = chosen.slice(0, slots - 1); chosen.unshift({ id: 'starprism' }); }
    let mimicPick = false;
    let preview = null;
    try { preview = new SS.Battle(Object.assign({}, level, { mode: 'normal', graves: level.graves, pots: level.pots }), [], {}); preview.buildBg(); } catch (e) { preview = null; }
    const enemies = Array.from(new Set(level.pool || [])).filter((id) => SS.ENEMIES[id]);
    const dummies = enemies.map((id, i) => ({ def: SS.ENEMIES[id], state: 'walk', anim: i * 1.3, hp: 1, maxHp: 1, helm: SS.ENEMIES[id].helm ? { hp: 1, max: 1 } : null, shield: SS.ENEMIES[id].shield ? { hp: 1, max: 1 } : null, hasPole: true, box: true, spring: true, pick: true, imp: true, balloon: true, scale: 0.8, ammo: 1 }));
    const has = (id) => chosen.some((d) => d.id === id && !d.mimic);
    const warn = () => {
      const w = [];
      const day = !(level.scene === 'night' || level.scene === 'fog' || level.scene === 'roofnight');
      if (day && chosen.some((d) => SS.PLANTS[d.id].night) && !has('wakebean')) w.push('Mushrooms will sleep in the daytime.');
      if ((level.scene === 'pool' || level.scene === 'fog') && !has('lilyraft') && owned.indexOf('lilyraft') >= 0) w.push('You might want Lily Rafts for the pool.');
      if ((level.scene === 'roof' || level.scene === 'roofnight') && !has('claypot')) w.push('You need Clay Pots on the roof!');
      if (level.mode === 'stars' && !has('starprism')) w.push('Bring Star Prisms to fill in the star!');
      return w;
    };
    return {
      enter() { SS.audio.music('shop'); SS.fade = 0.6; },
      update(dt) { t += dt; dummies.forEach((d) => (d.anim += dt)); },
      draw(c) {
        if (preview) c.drawImage(preview.bg, 0, 0, SS.W, SS.H); else sceneBg(c, t, false);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, SS.W, SS.H);
        // enemy preview on the street side
        dummies.forEach((d, i) => {
          const x = 900 + (i % 2) * 50 - Math.floor(i / 8) * 30, y = 180 + (i % 8) * 56;
          A.enemy(c, d, x, y, d.def.giant ? 0.45 : d.def.vehicle ? 0.55 : 0.7);
        });
        // chosen bar
        ui.rrect(c, 2, 2, 92 + slots * 60, 88, 10); c.fillStyle = 'rgba(92,58,24,0.95)'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2008'; c.stroke();
        ui.rrect(c, 8, 8, 78, 76, 8); c.fillStyle = '#f2e2b0'; c.fill(); A.sun(c, 47, 34, 25, t);
        ui.text(c, String(level.sun || 50), 47, 71, { size: 16, color: '#2a1a08' });
        for (let i = 0; i < slots; i++) {
          const x = 92 + i * 60, y = 6;
          ui.rrect(c, x, y, 56, 78, 6); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
          const d = chosen[i];
          if (d) {
            A.packet(c, x, y, 56, 78, d.id, { cost: SS.PLANTS[d.id].cost, mimic: d.mimic });
            if (ui.hit(x, y, 56, 78)) { chosen.splice(i, 1); SS.audio.sfx('cancel'); }
          }
        }
        // picker panel
        const px = 20, py = 100, pw = 760, ph = 470;
        ui.panel(c, px, py, pw, ph, { top: '#7a5a3a', bot: '#5a3a1e', border: '#2a1808' });
        ui.text(c, opts.round ? 'Round ' + (opts.round + 1) + ' — choose your plants' : 'Choose your plants!', px + pw / 2, py + 22, { size: 20, color: '#fff3c8', stroke: '#2a1808', sw: 3 });
        const cols = 10, cw = 60, chh = 72;
        let hovered = null;
        SS.PLANT_LIST.forEach((p, i) => {
          const x = px + 18 + (i % cols) * (cw + 13), y = py + 36 + Math.floor(i / cols) * (chh + 2);
          const ok = owned.indexOf(p.id) >= 0;
          if (!ok) { ui.rrect(c, x, y, cw - 4, chh - 2, 6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fill(); ui.text(c, '?', x + cw / 2 - 2, y + chh / 2, { size: 22, color: 'rgba(255,255,255,0.25)' }); return; }
          const picked = chosen.some((d) => d.id === p.id && !d.mimic) || (p.id === 'mimicseed' && chosen.some((d) => d.mimic));
          A.packet(c, x, y, cw - 4, chh - 2, p.id, { cost: p.cost, dark: picked, sel: mimicPick && p.id === 'mimicseed' });
          const day = !(level.scene === 'night' || level.scene === 'fog' || level.scene === 'roofnight');
          if (p.night && day) { ui.text(c, 'z', x + cw - 14, y + 12, { size: 13, color: '#e8e8ff', stroke: '#222', sw: 3 }); }
          if (ui.hover(x, y, cw - 4, chh - 2)) hovered = p;
          if (ui.hit(x, y, cw - 4, chh - 2)) {
            if (mimicPick) {
              if (p.id !== 'mimicseed' && chosen.length < slots) { chosen.push({ id: p.id, mimic: true }); mimicPick = false; SS.audio.sfx('pick'); }
              else { mimicPick = false; SS.audio.sfx('cancel'); }
            } else if (picked || chosen.length >= slots) SS.audio.sfx('cancel');
            else if (p.id === 'mimicseed') { mimicPick = true; SS.audio.sfx('pick'); }
            else { chosen.push({ id: p.id }); SS.audio.sfx('pick'); }
          }
        });
        if (mimicPick) ui.text(c, 'Mimic Seed: pick the plant to copy', px + pw / 2, py + ph - 52, { size: 16, color: '#ffe14a', stroke: '#000', sw: 3 });
        // info
        if (hovered) {
          ui.rrect(c, px + 10, py + ph - 44, pw - 280, 36, 6); c.fillStyle = 'rgba(255,248,220,0.95)'; c.fill();
          ui.text(c, hovered.name + ' — ' + hovered.desc, px + 20, py + ph - 26, { size: 13, color: '#2a1a08', align: 'left' });
        } else {
          const w = warn();
          if (w.length) ui.text(c, w[0], px + 20, py + ph - 26, { size: 14, color: '#ffd0a0', align: 'left', stroke: '#2a1808', sw: 3 });
        }
        if (ui.button(c, px + pw - 250, py + ph - 48, 110, 40, 'Clear', { color: '#a8583a', size: 16 })) { chosen = []; mimicPick = false; }
        const canGo = chosen.length > 0;
        if (ui.button(c, px + pw - 130, py + ph - 48, 120, 40, 'Plant it!', { disabled: !canGo, color: '#c83a2a', size: 19 })) {
          SS.save.lastDeck = chosen.slice();
          SS.persist();
          onStart(chosen.slice());
        }
        if (!opts.round && ui.button(c, 800, 40, 100, 34, 'Back', { color: '#7a6a5a', size: 15 })) SS.goMenu();
        ui.text(c, level.title, 860, 620, { size: 16, color: '#fff', stroke: '#000', sw: 3 });
      },
    };
  };

  // ---------- results ----------
  SS.ResultsScene = function (res) {
    let t = 0;
    const lv = res.level, rw = res.reward;
    const nextIdx = lv.world ? lv.index + 1 : -1;
    return {
      enter() { SS.audio.music('shop'); SS.fade = 1; },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, false);
        const x = 220, y = 70, w = 560, h = 480;
        ui.panel(c, x, y, w, h);
        ui.text(c, lv.mode === 'boss' ? 'You beat the Junk Colossus!' : lv.key.startsWith('surv_') ? 'Survival complete!' : 'Level complete!', SS.W / 2, y + 40, { size: 30, color: '#3a2008' });
        ui.text(c, lv.title, SS.W / 2, y + 74, { size: 18, color: '#6a4a1a' });
        c.save(); c.translate(SS.W / 2, y + 190);
        c.fillStyle = 'rgba(255,240,170,0.6)';
        c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.4; c.moveTo(0, 0); c.arc(0, 0, 110, a, a + 0.16); } c.fill();
        let title = '', desc = '';
        if (rw.plant && rw.first) {
          const p = SS.PLANTS[rw.plant];
          A.packet(c, -45, -62, 90, 124, rw.plant, {});
          title = 'New plant: ' + p.name; desc = p.desc;
        } else if (rw.item === 'shovel' && rw.first) {
          c.save(); c.scale(2.4, 2.4); SS.Battle.prototype.drawShovelIcon(c, 0, 0, 1); c.restore();
          title = 'You got the Shovel!'; desc = 'Click it (or press S), then click a plant to dig it up.';
        } else if (rw.trophy || rw.unlock === 'credits' || rw.survival) {
          A.trophy(c, 0, 30, 2.6);
          title = 'Trophy earned!'; desc = rw.coins ? '+$' + SS.fmt(rw.coins) : '';
        } else {
          A.moneybag(c, 0, 0, 2.6);
          title = 'Coin bag: +$' + SS.fmt(rw.coins || 0); desc = rw.replay ? 'Thanks for coming back to help.' : '';
        }
        c.restore();
        ui.text(c, title, SS.W / 2, y + 330, { size: 22, color: '#2a1a08' });
        if (desc) ui.text(c, desc, SS.W / 2, y + 360, { size: 15, color: '#5a3a1a', bold: false });
        if (rw.unlock && rw.first && rw.unlock !== 'credits') {
          const names = { almanac: 'the Almanac', shop: "Mabel's Seed Cart", minigames: 'Minigames', survival: 'Survival mode', zen: 'the Zen Garden', puzzle: 'Puzzle mode' };
          ui.text(c, 'Unlocked ' + names[rw.unlock] + '!', SS.W / 2, y + 390, { size: 18, color: '#2a7a1a' });
        }
        ui.text(c, 'Rotters defeated: ' + res.kills + '    Coins picked up: $' + SS.fmt(res.coins), SS.W / 2, y + 418, { size: 14, color: '#5a3a1a', bold: false });
        const isFinal = lv.mode === 'boss' && rw.first;
        if (nextIdx > 0 && nextIdx < 50) {
          if (ui.button(c, x + w - 210, y + h - 60, 190, 44, 'Next Level', { size: 19 })) SS.startLevel(SS.ADVENTURE[nextIdx]);
          if (ui.button(c, x + 20, y + h - 60, 170, 44, 'Main Menu', { color: '#a8583a', size: 18 })) SS.goMenu();
        } else if (isFinal) {
          if (ui.button(c, SS.W / 2 - 95, y + h - 60, 190, 44, 'Roll Credits', { size: 19 })) SS.setScene(SS.CreditsScene());
        } else {
          if (ui.button(c, SS.W / 2 - 95, y + h - 60, 190, 44, 'Continue', { size: 19 })) SS.goMenu();
        }
      },
    };
  };

  // ---------- generic list (minigames / puzzle / survival) ----------
  SS.ListScene = function (kind) {
    let t = 0;
    const list = kind === 'mini' ? SS.MINIGAMES : kind === 'puzzle' ? SS.PUZZLES : SS.SURVIVAL;
    const doneMap = kind === 'mini' ? SS.save.mini : kind === 'puzzle' ? SS.save.puzzle : SS.save.survival;
    const title = kind === 'mini' ? 'Minigames' : kind === 'puzzle' ? 'Puzzles' : 'Survival';
    return {
      enter() { SS.audio.music('title'); },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, kind !== 'mini');
        backButton(c, () => SS.goMenu());
        coinBox(c, SS.W - 170, 18);
        ui.text(c, title, SS.W / 2, 40, { size: 38, color: '#fff8d0', stroke: '#3a2008', sw: 6 });
        const doneCount = list.filter((l) => doneMap[l.key]).length;
        const cols = 4;
        list.forEach((l, i) => {
          const x = 40 + (i % cols) * 235, y = 90 + Math.floor(i / cols) * 128;
          const open = kind !== 'mini' || i < 4 + doneCount * 2 || SS.save.debugAll;
          const hov = open && ui.hover(x, y, 220, 116);
          ui.rrect(c, x, y, 220, 116, 12);
          c.fillStyle = open ? (hov ? '#f8e8b8' : '#e8d098') : '#9a9080'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2008'; c.stroke();
          // thumbnail
          ui.rrect(c, x + 8, y + 8, 70, 70, 8);
          const sc = { day: '#6cb03e', night: '#36623f', pool: '#4ab0d8', fog: '#7a8aa8', roof: '#b8583a', roofnight: '#5a2e24' }[l.scene];
          c.fillStyle = sc; c.fill();
          c.save(); c.beginPath(); ui.rrect(c, x + 8, y + 8, 70, 70, 8); c.clip();
          const icon = { bowling: 'barkshell', whack: 'rootdigger', little: 'sporepuff', conveyor: 'twinpod', speedy: 'frostpod', invisible: 'gasbloom', column: 'tridentpod', seedrain: 'lanternlily', laststand: 'tallbark', stars: 'starprism', airraid: 'needlecactus', icerink: 'thornmat', pogoparty: 'tallbark', blitz: 'canopyfern', hulks: 'boomberry', bowling2: 'tallbark' }[l.id] || (l.mode === 'vase' ? null : l.mode === 'commander' ? null : 'glowpetal');
          if (icon) A.plant(c, icon, x + 43, y + 72, 0.8, { t: t, armed: true });
          else if (l.mode === 'vase') M_urn(c, x + 43, y + 72);
          else A.enemy(c, { def: SS.ENEMIES.rotter, state: 'walk', anim: t, hp: 1, maxHp: 1, scale: 1 }, x + 43, y + 76, 0.6);
          c.restore();
          if (!open) { ui.text(c, '🔒', x + 43, y + 43, { size: 26 }); }
          ui.wrap(c, l.name, x + 86, y + 12, 128, 19, { size: 16, bold: true, color: '#2a1a08' });
          if (open) ui.wrap(c, l.desc || (l.rounds ? l.rounds + ' rounds' : ''), x + 86, y + 54, 128, 14, { size: 12, color: '#5a3a1a' });
          if (doneMap[l.key]) A.trophy(c, x + 196, y + 108, 0.6);
          if (kind === 'survival' && l.endless) ui.text(c, 'Best: ' + (SS.save.survival[l.key + '_best'] || 0) + ' rounds', x + 150, y + 100, { size: 12, color: '#2a1a08' });
          if (l.vase === 'endless') ui.text(c, 'Best: ' + (SS.save.puzzle.vaseBest || 0) + ' rooms', x + 150, y + 100, { size: 12, color: '#2a1a08' });
          if (open && ui.hit(x, y, 220, 116)) { SS.audio.sfx('click'); SS.startLevel(l); }
        });
      },
    };
  };
  function M_urn(c, x, y) { SS.MODES.vase.drawUrn({ cx: () => x, plantY: () => y }, c, { c: 0, urn: { look: 'leaf' } }); }

  // ---------- shop: Mabel's Seed Cart ----------
  SS.SHOP_ITEMS = [
    { id: 'slot7', name: 'Seed Slot', desc: 'Carry 7 plants into battle.', price: 750, ok: () => SS.save.slots === 6, buy: () => (SS.save.slots = 7), icon: 'slot' },
    { id: 'slot8', name: 'Seed Slot', desc: 'Carry 8 plants into battle.', price: 2500, ok: () => SS.save.slots === 7, buy: () => (SS.save.slots = 8), icon: 'slot', need: () => SS.save.slots >= 7 },
    { id: 'slot9', name: 'Seed Slot', desc: 'Carry 9 plants into battle.', price: 6000, ok: () => SS.save.slots === 8, buy: () => (SS.save.slots = 9), icon: 'slot', need: () => SS.save.slots >= 8 },
    { id: 'slot10', name: 'Seed Slot', desc: 'Carry 10 plants into battle.', price: 12000, ok: () => SS.save.slots === 9, buy: () => (SS.save.slots = 10), icon: 'slot', need: () => SS.save.slots >= 9 },
    { id: 'poolcleaner', name: 'Pool Skimmer', desc: 'A last line of defense for each pool lane.', price: 1000, adv: '3-1' },
    { id: 'roofcleaner', name: 'Gutter Sweeper', desc: 'A last line of defense for each roof lane.', price: 3000, adv: '5-1' },
    { id: 'rake', name: 'Garden Rake', desc: 'Knocks out the first Rotter to step on it. Lasts 3 levels.', price: 200, repeat: true, buy: () => (SS.save.items.rake += 3) },
    { id: 'quadpod', name: 'Quad Pod', plant: true, adv: '1-8' },
    { id: 'doublebloom', name: 'Double Bloom', plant: true, adv: '1-1' },
    { id: 'gloomcap', name: 'Gloomcap', plant: true, adv: '2-2' },
    { id: 'reedspiker', name: 'Reed Spiker', plant: true, adv: '2-10' },
    { id: 'frostdurian', name: 'Glacier Durian', plant: true, adv: '5-6' },
    { id: 'goldlode', name: 'Gold Lodestone', plant: true, adv: '5-5' },
    { id: 'stonethorns', name: 'Stone Thorns', plant: true, adv: '3-5' },
    { id: 'oakmortar', name: 'Oak Mortar', plant: true, adv: '5-1' },
    { id: 'mimicseed', name: 'Mimic Seed', plant: true, adv: '3-5' },
    { id: 'fertilizer', name: 'Fertilizer x5', desc: 'Helps Zen Garden sprouts grow up.', price: 750, repeat: true, zen: true, buy: () => (SS.save.items.fertilizer += 5) },
    { id: 'bugspray', name: 'Bug Spray x5', desc: 'Grown Zen plants sometimes need it.', price: 1000, repeat: true, zen: true, buy: () => (SS.save.items.bugspray += 5) },
    { id: 'musicbox', name: 'Music Box', desc: 'Grown Zen plants sometimes want a song.', price: 2500, zen: true },
    { id: 'goldcan', name: 'Golden Watering Can', desc: 'Waters every Zen plant at once.', price: 5000, zen: true },
    { id: 'sprout', name: 'Mystery Sprout', desc: 'A new sprout for the Zen Garden.', price: 1500, repeat: true, zen: true, buy: () => (SS.save.zen.sprouts = (SS.save.zen.sprouts || 0) + 1) },
  ];
  SS.ShopScene = function () {
    let t = 0, page = 0, said = 'Welcome to my seed cart, dear! Take a look around.';
    const lines = ['Everything here is grown fresh. Mostly.', 'The Rotters tracked mud all over my cart last week.', 'Upgrades go right on top of the plant they upgrade!', 'You can never have too many seed slots.', 'Coins come from Rotters, minigames, and lucky Penny Poppies.'];
    return {
      enter() { SS.audio.music('shop'); SS.fade = 0.8; },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, false);
        backButton(c, () => SS.goMenu());
        coinBox(c, SS.W - 170, 18);
        ui.text(c, "Mabel's Seed Cart", SS.W / 2, 40, { size: 36, color: '#fff8d0', stroke: '#3a2008', sw: 6 });
        // Mabel & speech
        A.mabel(c, 110, 590, 2.2, t);
        ui.rrect(c, 20, 230, 190, 90, 12); c.fillStyle = '#fffbea'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#6b4a1e'; c.stroke();
        ui.wrap(c, said, 30, 240, 170, 17, { size: 14, color: '#2a1a08' });
        // cart
        ui.panel(c, 240, 80, 740, 520, { top: '#c8945a', bot: '#8a5a2a', border: '#3a2008' });
        const nextSlot = 'slot' + Math.min(10, SS.save.slots + 1);
        const items = SS.SHOP_ITEMS.filter((it) => (!it.zen || SS.featureOpen('zen')) && (!it.id.startsWith('slot') || it.id === nextSlot || (SS.save.slots >= 10 && it.id === 'slot10')));
        const per = 12, pages = Math.ceil(items.length / per);
        items.slice(page * per, page * per + per).forEach((it, i) => {
          const x = 258 + (i % 4) * 180, y = 96 + Math.floor(i / 4) * 160;
          const sold = !it.repeat && (it.ok ? !it.ok() && !(it.need && !it.need()) && (it.id.startsWith('slot') ? SS.save.slots >= Number(it.id.slice(4)) : true) : SS.save.bought[it.id]);
          const avail = (!it.adv || SS.save.adv > SS.ADV_INDEX[it.adv] || SS.save.debugAll) && (!it.need || it.need());
          const price = it.plant ? SS.UPGRADE_PRICES[it.id] : it.price;
          ui.rrect(c, x, y, 168, 148, 10); c.fillStyle = sold ? '#9a8a6a' : '#f6e8c0'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#3a2008'; c.stroke();
          if (!avail) { ui.text(c, '?', x + 84, y + 60, { size: 40, color: '#a89870' }); ui.text(c, 'Coming soon', x + 84, y + 120, { size: 13, color: '#6a5a3a' }); return; }
          c.save(); c.beginPath(); c.rect(x + 4, y + 4, 160, 92); c.clip();
          if (it.plant) A.plant(c, it.id, x + 84 - (SS.PLANTS[it.id].wide ? 40 : 0), y + 92, SS.PLANTS[it.id].wide ? 0.65 : 1, { t, armed: true, ready: true });
          else if (it.icon === 'slot') { A.packet(c, x + 60, y + 14, 48, 70, 'pippod', {}); ui.text(c, '+1', x + 120, y + 30, { size: 22, color: '#2a7a1a' }); }
          else if (it.id === 'rake') { c.save(); c.translate(x + 84, y + 60); c.rotate(-0.4); c.fillStyle = '#7a5a2a'; c.fillRect(-50, -3, 100, 6); c.fillStyle = '#8a9098'; for (let k = 0; k < 7; k++) c.fillRect(-50 + k * 9, -14, 3, 12); c.restore(); }
          else if (it.id === 'poolcleaner' || it.id === 'roofcleaner') { const fake = { gy: () => y + 80, slope: () => 0, drawMower: SS.Battle.prototype.drawMower }; fake.drawMower(c, { x: x + 84, r: 0, kind: it.id === 'poolcleaner' ? 'pool' : 'roof', state: 'ready' }); }
          else if (it.id === 'sprout') A.sprout(c, x + 84, y + 80, 1.8);
          else if (it.id === 'fertilizer') { ui.rrect(c, x + 60, y + 24, 48, 60, 6); c.fillStyle = '#c8a050'; c.fill(); c.stroke(); ui.text(c, 'GRO', x + 84, y + 54, { size: 14, color: '#3a2008' }); }
          else if (it.id === 'bugspray') { ui.rrect(c, x + 70, y + 24, 30, 64, 6); c.fillStyle = '#4a8ac8'; c.fill(); c.stroke(); c.fillStyle = '#ddd'; c.fillRect(x + 78, y + 14, 14, 10); }
          else if (it.id === 'musicbox') { ui.rrect(c, x + 52, y + 36, 64, 46, 6); c.fillStyle = '#a85a3a'; c.fill(); c.stroke(); ui.text(c, '♪♫', x + 84, y + 58, { size: 22, color: '#ffe14a' }); }
          else if (it.id === 'goldcan') { A.ell(c, x + 80, y + 60, 30, 24, '#f2c23a', '#6a4800', 2); c.fillStyle = '#f2c23a'; c.beginPath(); c.moveTo(x + 104, y + 54); c.lineTo(x + 136, y + 34); c.lineTo(x + 138, y + 40); c.lineTo(x + 108, y + 64); c.fill(); c.stroke(); }
          c.restore();
          ui.text(c, it.name, x + 84, y + 106, { size: 14, color: '#2a1a08' });
          if (sold) { ui.text(c, 'SOLD OUT', x + 84, y + 132, { size: 15, color: '#5a2a08' }); }
          else {
            const can = SS.save.coins >= price;
            if (ui.button(c, x + 24, y + 118, 120, 24, '$' + SS.fmt(price), { size: 14, color: can ? '#6aa83a' : '#8a6a5a', disabled: false })) {
              if (!can) { said = 'Oh dear, you will need a few more coins for that one.'; SS.audio.sfx('cancel'); }
              else {
                SS.save.coins -= price;
                if (it.buy) it.buy(); else SS.save.bought[it.id] = true;
                SS.persist(); SS.audio.sfx('buy');
                said = it.plant ? 'Wonderful! ' + SS.PLANTS[it.id].desc : SS.pick(['A fine choice!', 'Pleasure doing business, dear.', 'That will come in handy, mark my words.']);
              }
            }
          }
          if (ui.hover(x, y, 168, 148) && !sold) {
            const d = it.plant ? SS.PLANTS[it.id].desc : it.desc;
            ui.rrect(c, 250, 556, 720, 34, 8); c.fillStyle = 'rgba(255,248,220,0.96)'; c.fill();
            ui.text(c, d, 610, 573, { size: 14, color: '#2a1a08' });
          }
        });
        if (pages > 1) {
          if (ui.button(c, 700, 600, 120, 32, page > 0 ? '< Prev' : 'Page 1', { size: 14, disabled: page === 0 })) page--;
          if (ui.button(c, 840, 600, 120, 32, page < pages - 1 ? 'Next >' : 'Page ' + pages, { size: 14, disabled: page >= pages - 1 })) page++;
        }
        if (ui.hit(20, 230, 190, 360)) said = SS.pick(lines);
      },
    };
  };

  // ---------- almanac ----------
  SS.AlmanacScene = function () {
    let t = 0, tab = 'plants', sel = 'pippod', selE = 'rotter';
    const seenE = (id) => SS.save.debugAll || SS.ADVENTURE.some((l, i) => i < Math.max(1, SS.save.adv + 1) && (l.pool || []).indexOf(id) >= 0) || ['minion', 'sledder', 'imp'].indexOf(id) >= 0 && SS.save.adv > 10;
    return {
      enter() { SS.audio.music('zen'); },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, tab !== 'plants');
        backButton(c, () => SS.goMenu());
        ui.text(c, 'Almanac', SS.W / 2, 36, { size: 36, color: '#fff8d0', stroke: '#3a2008', sw: 6 });
        if (ui.button(c, 300, 66, 180, 34, 'Plants', { color: tab === 'plants' ? '#e8a030' : '#6aa83a', size: 17 })) tab = 'plants';
        if (ui.button(c, 520, 66, 180, 34, 'Rotters', { color: tab === 'rotters' ? '#e8a030' : '#6aa83a', size: 17 })) tab = 'rotters';
        ui.panel(c, 16, 110, 560, 510, { top: '#e8d8a8', bot: '#c8b078' });
        ui.panel(c, 590, 110, 394, 510, { top: '#fff8e0', bot: '#e8d8a8' });
        const owned = SS.ownedPlants();
        if (tab === 'plants') {
          SS.PLANT_LIST.forEach((p, i) => {
            const x = 28 + (i % 9) * 60, y = 122 + Math.floor(i / 9) * 70;
            const known = owned.indexOf(p.id) >= 0 || SS.save.plants.indexOf(p.id) >= 0 || (p.upgrade && SS.save.adv >= 14) || SS.save.debugAll;
            if (!known) { ui.rrect(c, x, y, 54, 66, 6); c.fillStyle = 'rgba(0,0,0,0.2)'; c.fill(); ui.text(c, '?', x + 27, y + 33, { size: 24, color: 'rgba(0,0,0,0.3)' }); return; }
            A.packet(c, x, y, 54, 66, p.id, { cost: p.cost, sel: sel === p.id });
            if (ui.hit(x, y, 54, 66)) { sel = p.id; SS.audio.sfx('pick'); }
          });
          const p = SS.PLANTS[sel];
          ui.rrect(c, 606, 126, 362, 190, 10); c.fillStyle = '#9ccf6a'; c.fill();
          A.plant(c, p.id, 787 - (p.wide ? 70 : 0), 300, p.wide ? 1.3 : 2, { t, seed: 2, armed: true, grown: true, ready: true, fire: (t % 1.4) });
          ui.text(c, p.name, 787, 336, { size: 24, color: '#2a1a08' });
          ui.wrap(c, p.text, 606, 356, 362, 18, { size: 14, color: '#3a2a10' });
          const stats = [];
          stats.push('Cost: ' + p.cost);
          stats.push('Recharge: ' + (p.cd >= 50 ? 'very slow' : p.cd >= 30 ? 'slow' : 'fast'));
          if (p.dmg) stats.push('Damage: ' + (p.dmg >= 1800 ? 'massive' : p.dmg));
          if (p.hp > 300) stats.push('Toughness: ' + (p.hp >= 8000 ? 'very high' : 'high'));
          if (p.night) stats.push('Mushroom: sleeps by day');
          if (p.aquatic) stats.push('Aquatic');
          if (p.upgradeOf) stats.push('Plant on: ' + SS.PLANTS[p.upgradeOf].name);
          ui.wrap(c, stats.join('   •   '), 606, 520, 362, 18, { size: 13, color: '#6a3a10', bold: true });
          ui.wrap(c, p.desc, 606, 574, 362, 16, { size: 13, color: '#2a5a10', bold: true });
        } else {
          const list = SS.ENEMY_LIST;
          list.forEach((e, i) => {
            const x = 30 + (i % 6) * 89, y = 124 + Math.floor(i / 6) * 98;
            const known = seenE(e.id);
            ui.rrect(c, x, y, 82, 92, 8); c.fillStyle = selE === e.id ? '#fff3a8' : known ? '#a8c890' : 'rgba(0,0,0,0.2)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#3a2008'; c.stroke();
            if (!known) { ui.text(c, '?', x + 41, y + 46, { size: 26, color: 'rgba(0,0,0,0.3)' }); return; }
            c.save(); c.beginPath(); c.rect(x + 2, y + 2, 78, 88); c.clip();
            A.enemy(c, dummy(e, t), x + 44, y + (e.boss ? 150 : e.giant ? 120 : 88), e.boss ? 0.2 : e.giant ? 0.38 : e.vehicle || e.sled ? 0.45 : 0.62);
            c.restore();
            if (ui.hit(x, y, 82, 92)) { selE = e.id; SS.audio.sfx('pick'); }
          });
          const e = SS.ENEMIES[selE];
          ui.rrect(c, 606, 126, 362, 230, 10); c.fillStyle = '#7ab05a'; c.fill();
          c.save(); c.beginPath(); c.rect(606, 126, 362, 230); c.clip();
          A.enemy(c, dummy(e, t), 787, e.boss ? 350 : 340, e.boss ? 0.6 : e.giant ? 1.0 : 1.5);
          c.restore();
          ui.text(c, e.name, 787, 376, { size: 24, color: '#2a1a08' });
          ui.wrap(c, e.text, 606, 396, 362, 18, { size: 14, color: '#3a2a10' });
          const tough = e.hp + (e.helm ? e.helm.hp : 0) + (e.shield ? e.shield.hp : 0);
          const st = ['Toughness: ' + (tough >= 3000 ? 'enormous' : tough >= 1300 ? 'high' : tough >= 500 ? 'medium' : 'low'), 'Speed: ' + (e.sp >= 35 ? 'fast' : e.sp >= 24 ? 'quick' : e.sp > 0 ? 'slow' : 'special')];
          ui.wrap(c, st.join('   •   '), 606, 560, 362, 18, { size: 13, color: '#6a3a10', bold: true });
        }
      },
    };
  };
  function dummy(e, t) {
    return { def: e, state: 'walk', anim: t, hp: 1, maxHp: 1, helm: e.helm ? { hp: 1, max: 1 } : null, shield: e.shield ? { hp: 1, max: 1 } : null, hasPole: true, box: true, spring: true, pick: true, imp: true, balloon: true, scale: 1, ammo: 1, dropK: 1 };
  }
  SS.enemyDummy = dummy;

  // ---------- credits ----------
  SS.CreditsScene = function () {
    let t = 0;
    const lines = ['SPROUT SIEGE', '', 'The Junk Colossus is scrap.', 'The Rotters have shambled off to sulk.', 'The garden is safe, for now.', '', 'Starring', 'Mabel, the neighbor with the seed cart', 'Forty-nine very brave plants', 'and one very stubborn Barkshell', '', 'Thanks for playing!', '', 'Minigames, puzzles, survival and', 'the Zen Garden are all waiting for you.'];
    return {
      enter() { SS.audio.music('zen'); },
      update(dt) { t += dt; },
      draw(c) {
        sceneBg(c, t, true);
        lines.forEach((l, i) => {
          const y = SS.H + 40 + i * 40 - t * 40;
          if (y > -40 && y < SS.H + 40) ui.text(c, l, SS.W / 2, y, { size: i === 0 ? 46 : 22, color: '#fff8d0', stroke: '#2a1a08', sw: 5 });
        });
        A.plant(c, 'barkshell', 120, 600, 1.2, { t });
        A.mabel(c, 880, 610, 1.6, t);
        if (t > 4 && ui.button(c, SS.W - 150, 20, 130, 40, 'Done', { size: 18 })) SS.goMenu();
      },
    };
  };
})();
