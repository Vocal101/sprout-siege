// Sprout Siege — dev harness (loaded with ?dev)
(function () {
  const SS = window.SS;
  const T = (window.T = { errs: [] });
  window.addEventListener('error', (e) => T.errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  const origErr = console.error;
  console.error = function () { T.errs.push(Array.from(arguments).join(' ')); origErr.apply(console, arguments); };
  T.files = ['core', 'audio', 'plants', 'enemies', 'levels', 'art', 'art_enemies', 'battle', 'battle_plants', 'battle_enemies', 'battle_draw', 'modes', 'menus', 'zen', 'main', 'devtest'];
  T.fresh = async function () {
    await Promise.all(T.files.map((f) => fetch('js/' + f + '.js', { cache: 'reload' })));
    await fetch('index.html', { cache: 'reload' });
    location.reload();
  };
  Object.defineProperty(T, 'b', { get: () => SS.scene && SS.scene.b });
  T.lv = function (key, ids) {
    const lv = SS.LEVEL_BY_KEY[key];
    const deck = (ids || []).map((id) => (typeof id === 'string' ? { id } : id));
    SS.setScene(SS.BattleScene(lv, deck, { deck }));
    const b = SS.scene.b; b.tipBox = null;
    return b;
  };
  T.tick = function (sec, bot) {
    const b = T.b;
    const n = Math.round(sec * 60);
    for (let i = 0; i < n; i++) {
      if (!SS.scene.b) return 'scene changed';
      if (bot) T.botStep(SS.scene.b);
      SS.scene.update(1 / 60);
      if (b.state === 'claiming' && b.claimDone) return 'finished';
      if (b.state === 'lost') return 'lost';
    }
    return b.state;
  };
  T.botStep = function (b) {
    for (const p of b.pickups) if (!p.collecting) { if (p.kind === 'reward') { b.claimReward(p); return; } b.collect(p); }
    if (b.state !== 'play') return;
    if ((T._bt = (T._bt || 0) + 1) % 15) return;
    const mode = b.level.mode;
    if (mode === 'whack') { const e = b.enemies.find((q) => !q.dying && q.x < SS.W - 20); if (e && SS.rng() < 0.5) b.mode.onLawnClick(b, e.x, e.y - 40, e.row, b.colAt(e.x)); }
    if (mode === 'vase') {
      if (b.hand.length) { for (let c = 0; c < 4; c++) for (const r of b.lanes) { if (b.canPlace(b.hand[0].id, r, c)) { b.sel = { type: 'hand', i: 0 }; if (b.tryPlantFromSel(r, c)) return; } } b.hand.shift(); return; }
      if (b.enemies.some((e) => !e.dying)) return;
      for (const row of b.tiles) for (const t of row) if (t.urn) { b.mode.onLawnClick(b, b.cx(t.c), b.plantY(t) - 30, t.r, t.c); return; }
      return;
    }
    if (mode === 'commander') {
      const opts = b.cmd.cards.map((q, i) => i).filter((i) => b.sun >= b.cmd.cards[i][1]);
      if (opts.length && SS.rng() < 0.3) { b.cmdSel = SS.pick(opts); const r = SS.pick(b.lanes.filter((rr) => b.vaults[rr])); if (r !== undefined) b.mode.onLawnClick(b, b.cmdLine + 60, b.gy(r) - 30, r, 7); }
      return;
    }
    if (mode === 'laststand' && b.hold && b.t > 25 * ((b.round || 0) + 1)) b.hold = false;
    for (const p of b.plants) if (p.def.kind === 'cob' && p.st.ready) { const e = b.enemies.find((q) => !q.dying && q.x < SS.W - 40 && !q.def.boss); if (e) b.fireCob(p, e.x, e.y - 20); }
    if (b.belt && b.belt.items.length) {
      for (let i = 0; i < b.belt.items.length; i++) {
        const it = b.belt.items[i];
        b.sel = { type: 'belt', i };
        if (it.id.startsWith('bowl')) { const r = SS.pick(b.lanes.filter((rr) => !b.isWater(rr))); b.mode.placeBowl(b, r, SS.irand(0, 2)); return; }
        const d = SS.PLANTS[it.id];
        let cols = d.kind === 'bomb' ? [5, 6, 4, 3, 2] : d.wall ? [5, 4, 6, 3] : [0, 1, 2, 3, 4, 5];
        if (d.kind === 'bomb') { const e = b.enemies.find((q) => !q.dying && !q.def.boss && q.x < b.GX + 8 * b.CW); if (!e && !b.boss) continue; if (e) cols = [b.colAt(e.x), b.colAt(e.x) - 1, b.colAt(e.x) + 1]; }
        for (const c of cols) for (const r of SS.shuffle(b.lanes.slice())) if (b.canPlace(it.id, r, c) && b.tryPlantFromSel(r, c)) return;
      }
      if (b.belt.items.length > 8) b.belt.items.shift();
      b.sel = null;
      return;
    }
    const lanes = b.lanes;
    const tryPlace = (id, cols) => {
      const i = b.deck.findIndex((d) => d.id === id);
      if (i < 0 || !b.deckReady(i)) return false;
      for (const c of cols) for (const r of SS.shuffle(lanes.slice())) {
        let ok = b.canPlace(id, r, c);
        if (!ok) {
          const t = b.tiles[r][c];
          if (t.water && !t.base && !t.plant) { const li = b.deck.findIndex((d) => d.id === 'lilyraft'); if (li >= 0 && b.deckReady(li)) { b.sel = { type: 'deck', i: li }; b.tryPlantFromSel(r, c); } }
          if (b.roof && !t.base) { const pi = b.deck.findIndex((d) => d.id === 'claypot'); if (pi >= 0 && b.deckReady(pi)) { b.sel = { type: 'deck', i: pi }; b.tryPlantFromSel(r, c); } }
          continue;
        }
        b.sel = { type: 'deck', i };
        if (b.tryPlantFromSel(r, c)) return true;
      }
      return false;
    };
    const nProd = b.plants.filter((p) => p.def.kind === 'producer').length;
    if (nProd < lanes.length * 2) { if (tryPlace('glowpetal', [0, 1]) || tryPlace('glowcap', [0, 1])) return; }
    for (const id of ['twinpod', 'pippod', 'pinelobber', 'durianlobber', 'gasbloom', 'sporepuff', 'frostpod']) if (tryPlace(id, [2, 3, 4, 1])) return;
    if (b.sun > 300) for (const id of ['tallbark', 'barkshell']) if (tryPlace(id, [6, 5])) return;
    if (b.sun > 400) tryPlace('boomberry', [7]);
  };
  // render the current scene offscreen and save it through the local snapshot server
  T.snap = async function (name, scale) {
    const s = scale || 0.8;
    const cv = document.createElement('canvas');
    cv.width = SS.W * s; cv.height = SS.H * s;
    const c = cv.getContext('2d');
    c.scale(s, s);
    SS.fade = 0;
    SS.scene.draw(c);
    const url = cv.toDataURL('image/jpeg', 0.85);
    await fetch('http://127.0.0.1:8799/', { method: 'POST', body: (name || 'snap') + '.jpg|' + url });
    return name;
  };
  T.status = function () {
    const b = T.b;
    return { state: b.state, wave: b.wave + '/' + b.totalWaves, sun: b.sun, plants: b.plants.length, enemies: b.enemies.length, kills: b.kills, t: Math.round(b.t), errs: T.errs.length };
  };
})();
