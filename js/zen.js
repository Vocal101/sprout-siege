// Sprout Siege — Zen Garden: grow sprouts into plants that pay out coins
(function () {
  const SS = window.SS;
  const A = SS.art, ui = SS.ui;
  const SLOTS = 8;
  const SCALE = [0.45, 0.65, 0.85, 1.15];
  const NEED_ICON = { water: '💧', fertilizer: 'GRO', bugspray: 'BUG', music: '♪' };

  function now() { return Date.now(); }
  function zen() {
    const z = SS.save.zen;
    if (!z.plants) z.plants = [];
    return z;
  }
  function sproutPool() {
    return SS.PLANT_LIST.filter((p) => !p.upgrade && !p.mimic && p.kind !== 'platform' && p.kind !== 'coffee' && !p.shell && SS.save.plants.indexOf(p.id) >= 0).map((p) => p.id);
  }
  function refreshNeeds() {
    const t = now();
    for (const p of zen().plants) {
      if (p.need || t < (p.nextAt || 0)) continue;
      if (p.stage < 3) p.need = p.water < 2 ? 'water' : 'fertilizer';
      else p.need = SS.pick(['water', 'water', 'bugspray', 'music']);
    }
  }

  SS.ZenScene = function () {
    let t = 0, tool = 'water', coins = [], said = 'Sprouts grow into plants if you water and feed them. Grown plants pay you back in coins.';
    const slotPos = (i) => ({ x: 190 + (i % 4) * 190, y: 330 + Math.floor(i / 4) * 200 });
    return {
      enter() { SS.audio.music('zen'); SS.fade = 0.8; refreshNeeds(); },
      update(dt) {
        t += dt;
        if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) refreshNeeds();
        for (const c of coins) { c.age += dt; if (c.vy !== 0) { c.vy += 600 * dt; c.y += c.vy * dt; if (c.y >= c.ty) { c.y = c.ty; c.vy = 0; } } }
        coins = coins.filter((c) => c.age < 20 && !c.done);
      },
      draw(c) {
        // greenhouse patio
        const g = c.createLinearGradient(0, 0, 0, SS.H);
        g.addColorStop(0, '#d8f0e0'); g.addColorStop(1, '#a8d0a8');
        c.fillStyle = g; c.fillRect(0, 0, SS.W, SS.H);
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3;
        for (let x = 0; x < SS.W; x += 100) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 200); c.stroke(); }
        c.fillStyle = '#c8a878'; c.fillRect(0, 210, SS.W, SS.H - 210);
        c.strokeStyle = 'rgba(90,60,30,0.3)'; c.lineWidth = 2;
        for (let y = 230; y < SS.H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(SS.W, y); c.stroke(); }
        for (let x = 0; x < SS.W; x += 80) for (let y = 210; y < SS.H; y += 80) { c.beginPath(); c.moveTo(x + ((y / 40) % 2) * 40, y); c.lineTo(x + ((y / 40) % 2) * 40, y + 40); c.stroke(); }
        if (ui.button(c, 16, 16, 110, 38, 'Back', { color: '#a8583a', size: 18 })) { SS.persist(); SS.goMenu(); return; }
        SS.coinBox(c, SS.W - 170, 18);
        ui.text(c, 'Zen Garden', SS.W / 2, 36, { size: 36, color: '#fff8d0', stroke: '#2a4a20', sw: 6 });
        // tools
        const it = SS.save.items, b = SS.save.bought;
        const tools = [['water', 'Water', '∞'], ['fertilizer', 'Fertilizer', it.fertilizer], ['bugspray', 'Bug Spray', it.bugspray]];
        if (b.musicbox) tools.push(['music', 'Music Box', '∞']);
        tools.push(['sell', 'Sell', '']);
        tools.forEach(([id, label, n], i) => {
          const x = 160 + i * 130, y = 70;
          if (ui.button(c, x, y, 120, 46, label + (n !== '' ? ' (' + n + ')' : ''), { color: tool === id ? '#e8a030' : '#5a8a4a', size: 14 })) tool = id;
        });
        const z = zen();
        if (ui.button(c, 160 + tools.length * 130, 70, 160, 46, 'Plant sprout (' + (z.sprouts || 0) + ')', { color: '#6aa83a', size: 14, disabled: !(z.sprouts > 0) || z.plants.length >= SLOTS })) {
          const used = new Set(z.plants.map((p) => p.slot));
          let slot = 0; while (used.has(slot)) slot++;
          const pool = sproutPool();
          z.plants.push({ slot, id: SS.pick(pool.length ? pool : ['glowpetal']), stage: 0, water: 0, need: 'water', nextAt: 0 });
          z.sprouts--;
          SS.audio.sfx('plant'); SS.persist();
        }
        // pots
        for (let i = 0; i < SLOTS; i++) {
          const { x, y } = slotPos(i);
          A.ell(c, x, y + 4, 58, 14, 'rgba(0,0,0,0.18)', false);
          c.beginPath(); c.moveTo(x - 46, y - 40); c.lineTo(x + 46, y - 40); c.lineTo(x + 36, y); c.lineTo(x - 36, y); c.closePath();
          c.fillStyle = A.lgrad(c, x - 46, 0, x + 46, 0, '#d9804a', '#8a3f1a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#3a1a08'; c.stroke();
          c.fillStyle = '#c96a3a'; c.fillRect(x - 50, y - 50, 100, 12); c.strokeRect(x - 50, y - 50, 100, 12);
          A.ell(c, x, y - 50, 46, 5, '#4a2a10', false);
        }
        const hovSlot = [];
        for (const p of z.plants) {
          const { x, y } = slotPos(p.slot);
          if (p.stage === 0) A.sprout(c, x, y - 46, 1.4);
          else A.plant(c, p.id, x, y - 48, SCALE[p.stage], { t: t + p.slot, seed: p.slot, armed: true, grown: true, ready: true });
          if (p.need) {
            const by = y - 60 - SCALE[p.stage] * 90 - 20 + Math.sin(t * 3 + p.slot) * 3;
            ui.rrect(c, x + 14, by - 18, 48, 34, 12); c.fillStyle = '#fffbea'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#6b4a1e'; c.stroke();
            ui.text(c, NEED_ICON[p.need], x + 38, by, { size: p.need === 'water' || p.need === 'music' ? 18 : 12, color: p.need === 'water' ? '#2a7ac8' : '#5a3a10' });
          }
          ui.text(c, ['Sprout', 'Small', 'Medium', 'Full grown'][p.stage] + (p.stage ? ' ' + SS.PLANTS[p.id].name : ''), x, y + 22, { size: 12, color: '#3a2008', bold: false });
          hovSlot.push({ p, x, y });
        }
        // clicks on plants
        const ck = SS.input.click;
        if (ck) {
          for (const h of hovSlot) {
            if (Math.abs(ck.x - h.x) < 60 && ck.y > h.y - 170 && ck.y < h.y + 10) { SS.input.consume(); this.apply(h.p, h.x, h.y); break; }
          }
        }
        // golden can: water everything
        if (b.goldcan && ui.button(c, 830, 130, 150, 34, 'Golden can', { color: '#c8a020', size: 14 })) {
          for (const h of hovSlot) if (h.p.need === 'water') { tool = 'water'; this.apply(h.p, h.x, h.y); }
        }
        // speech
        A.mabel(c, 70, 640, 1.2, t);
        ui.rrect(c, 110, 560, 420, 64, 12); c.fillStyle = 'rgba(255,251,234,0.95)'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#6b4a1e'; c.stroke();
        ui.wrap(c, said, 122, 568, 400, 16, { size: 13, color: '#2a1a08' });
        // coins
        for (const co of coins) {
          A.coin(c, co.x, co.y, co.kind, co.age);
          if (SS.dist(SS.input.x, SS.input.y, co.x, co.y) < 24 && !co.done) { co.done = true; SS.save.coins += co.kind === 'gold' ? 50 : 10; SS.audio.sfx('coin'); SS.persist(); }
        }
      },
      apply(p, x, y) {
        const it = SS.save.items;
        if (tool === 'sell') {
          const price = [80, 250, 600, 1500][p.stage];
          const z = zen();
          z.plants = z.plants.filter((q) => q !== p);
          SS.save.coins += price; SS.audio.sfx('buy'); said = 'Sold for $' + price + '. Someone will love it.';
          SS.persist(); return;
        }
        if (p.need !== tool) { SS.audio.sfx('cancel'); said = p.need ? 'That plant wants something else right now.' : 'That plant is happy for now. Check back later!'; return; }
        if (tool === 'fertilizer') { if (it.fertilizer <= 0) { said = 'You are out of fertilizer. My cart has more.'; SS.audio.sfx('cancel'); return; } it.fertilizer--; }
        if (tool === 'bugspray') { if (it.bugspray <= 0) { said = 'You are out of bug spray. My cart has more.'; SS.audio.sfx('cancel'); return; } it.bugspray--; }
        SS.audio.sfx(tool === 'water' ? 'water' : tool === 'music' ? 'win' : 'pop');
        const nowT = now();
        p.need = null;
        if (p.stage < 3) {
          if (tool === 'water') { p.water++; p.nextAt = nowT + 15000; }
          if (tool === 'fertilizer') { p.stage++; p.water = 0; p.nextAt = nowT + 25000; SS.audio.sfx('grow'); said = p.stage === 3 ? 'Look at that! Fully grown. It will start paying you back now.' : 'It grew! Keep it up.'; coins.push({ x, y: y - 100, ty: y - 10, vy: -200, age: 0, kind: 'silver' }); }
        } else {
          p.nextAt = nowT + SS.rand(120000, 300000);
          for (let i = 0; i < 2; i++) coins.push({ x: x + (i ? 20 : -20), y: y - 120, ty: y - 10 + i * 6, vy: -220, age: 0, kind: 'gold' });
          said = 'It loved that. Here are some coins!';
        }
        SS.persist();
      },
    };
  };
})();
