// Sprout Siege — adventure levels, minigames, puzzles, survival
(function () {
  const SS = window.SS;
  const ALL5 = [0, 1, 2, 3, 4];
  const ALL6 = [0, 1, 2, 3, 4, 5];
  function L(key, o) {
    const [w, n] = key.split('-').map(Number);
    const sceneByWorld = { 1: 'day', 2: 'night', 3: 'pool', 4: 'fog', 5: 'roof' };
    const d = Object.assign({
      key, world: w, num: n, scene: sceneByWorld[w], pots: w === 5 ? 2 : 0, mode: 'normal', waves: 20, b0: 1, g: 0.5, sun: 50,
      first: 18, interval: 25, pool: ['rotter'], graves: w === 2 ? 6 : 0,
    }, o);
    if (!d.lanes) d.lanes = d.scene === 'pool' || d.scene === 'fog' ? ALL6 : ALL5;
    d.title = 'Level ' + key;
    return d;
  }
  const W1 = ['rotter', 'crate', 'vaulter', 'kettle'];
  const W2 = ['rotter', 'crate', 'grumbler', 'gate', 'kettle', 'vaulter', 'brute', 'summoner'];
  const W3 = ['rotter', 'crate', 'kettle', 'vaulter', 'grumbler', 'diver', 'gate', 'brute', 'iceroller', 'sled', 'seal'];
  const W4 = ['rotter', 'crate', 'kettle', 'diver', 'seal', 'jester', 'balloon', 'miner', 'pogo', 'brute', 'gate'];
  const W5 = ['rotter', 'crate', 'kettle', 'grappler', 'ladder', 'catapult', 'jester', 'pogo', 'giant', 'brute'];

  const conv1 = { pippod: 3, twinpod: 3, frostpod: 2, barkshell: 2, tubertrap: 2, boomberry: 1, snapjaw: 1 };
  const conv2 = { sporepuff: 3, gasbloom: 3, timidcap: 2, frostcap: 1, dreadmorel: 1, mesmercap: 1, rootdigger: 1, barkshell: 1, twinpod: 2 };
  const conv3 = { lilyraft: 4, twinpod: 2, tridentpod: 2, gourdslam: 1, tangleweed: 1, firepepper: 1, thornmat: 1, brazier: 1, tallbark: 1, frostpod: 1 };
  const conv4 = { lilyraft: 3, lanternlily: 1, needlecactus: 1, gustfan: 1, backpod: 1, starprism: 2, huskguard: 1, lodecap: 1, twinpod: 2, tridentpod: 2, boomberry: 1, firepepper: 1 };
  const conv5 = { claypot: 5, pinelobber: 2, acornlobber: 2, durianlobber: 2, canopyfern: 1, frostcap: 1, wakebean: 1, firepepper: 1, boomberry: 1, tallbark: 1, stinkonion: 1 };

  SS.ADVENTURE = [
    L('1-1', { lanes: [2], waves: 4, b0: 1, g: 0, sun: 150, first: 20, pool: ['rotter'], reward: { plant: 'glowpetal' }, tut: 'basics' }),
    L('1-2', { lanes: [1, 2, 3], waves: 6, b0: 1, g: 0.3, pool: ['rotter'], reward: { plant: 'boomberry' }, tut: 'sun' }),
    L('1-3', { lanes: [1, 2, 3], waves: 8, b0: 1, g: 0.35, pool: ['rotter', 'crate'], reward: { plant: 'barkshell' }, newEnemy: 'crate' }),
    L('1-4', { waves: 10, b0: 1, g: 0.4, pool: ['rotter', 'crate'], reward: { plant: 'tubertrap' }, tut: 'flag' }),
    L('1-5', { mode: 'bowling', waves: 10, b0: 2, g: 0.6, pool: ['rotter', 'crate', 'kettle'], reward: { item: 'shovel' }, tut: 'bowling', minigame: 'Barkshell Bowling' }),
    L('1-6', { waves: 10, b0: 1, g: 0.45, pool: ['rotter', 'crate', 'vaulter'], reward: { plant: 'frostpod' }, newEnemy: 'vaulter' }),
    L('1-7', { waves: 10, b0: 1, g: 0.5, pool: ['rotter', 'crate', 'vaulter'], reward: { plant: 'snapjaw' } }),
    L('1-8', { waves: 20, b0: 1, g: 0.4, pool: W1, reward: { plant: 'twinpod' }, newEnemy: 'kettle' }),
    L('1-9', { waves: 20, b0: 1, g: 0.45, pool: W1, reward: { coins: 500, unlock: 'almanac' } }),
    L('1-10', { mode: 'conveyor', waves: 20, b0: 2, g: 0.5, pool: W1, conveyor: conv1, reward: { plant: 'sporepuff' }, tut: 'conveyor' }),

    L('2-1', { waves: 10, b0: 1, g: 0.5, sun: 50, pool: ['rotter', 'crate', 'grumbler'], reward: { plant: 'glowcap' }, newEnemy: 'grumbler', tut: 'night' }),
    L('2-2', { waves: 20, b0: 1, g: 0.45, pool: ['rotter', 'crate', 'grumbler', 'kettle'], reward: { plant: 'gasbloom' } }),
    L('2-3', { waves: 20, b0: 1, g: 0.5, pool: ['rotter', 'crate', 'grumbler', 'gate', 'kettle'], reward: { plant: 'rootdigger' }, newEnemy: 'gate' }),
    L('2-4', { waves: 20, b0: 1, g: 0.5, pool: ['rotter', 'crate', 'grumbler', 'gate', 'kettle', 'vaulter'], reward: { plant: 'mesmercap', unlock: 'shop' }, graves: 8 }),
    L('2-5', { mode: 'whack', waves: 12, b0: 2, g: 0.6, pool: ['rotter', 'crate', 'kettle'], reward: { plant: 'timidcap' }, graves: 9, tut: 'whack', minigame: 'Bonk the Rotters' }),
    L('2-6', { waves: 20, b0: 1, g: 0.55, pool: ['rotter', 'crate', 'grumbler', 'kettle', 'brute'], reward: { plant: 'frostcap' }, newEnemy: 'brute' }),
    L('2-7', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'gate', 'kettle', 'brute', 'vaulter'], reward: { plant: 'dreadmorel' } }),
    L('2-8', { waves: 20, b0: 1, g: 0.6, pool: W2, reward: { coins: 750, unlock: 'minigames' }, newEnemy: 'summoner' }),
    L('2-9', { waves: 20, b0: 2, g: 0.6, pool: W2, reward: { coins: 1000 }, graves: 10 }),
    L('2-10', { mode: 'conveyor', waves: 20, b0: 2, g: 0.6, pool: W2, conveyor: conv2, reward: { plant: 'lilyraft' } }),

    L('3-1', { waves: 20, b0: 1, g: 0.5, pool: ['rotter', 'crate', 'kettle', 'vaulter', 'grumbler'], reward: { plant: 'gourdslam' }, tut: 'pool' }),
    L('3-2', { waves: 20, b0: 1, g: 0.55, pool: ['rotter', 'crate', 'kettle', 'vaulter', 'grumbler', 'gate'], reward: { plant: 'tridentpod' } }),
    L('3-3', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'grumbler', 'diver'], reward: { plant: 'tangleweed' }, newEnemy: 'diver' }),
    L('3-4', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'diver', 'gate', 'brute'], reward: { plant: 'firepepper' } }),
    L('3-5', { mode: 'little', waves: 20, b0: 2, g: 0.8, pool: ['rotter', 'crate', 'kettle', 'vaulter', 'diver', 'brute'], reward: { plant: 'thornmat' }, minigame: 'Little Rotters, Big Trouble' }),
    L('3-6', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'diver', 'iceroller', 'vaulter'], reward: { plant: 'brazier' }, newEnemy: 'iceroller' }),
    L('3-7', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'iceroller', 'sled', 'brute'], reward: { plant: 'tallbark' }, newEnemy: 'sled' }),
    L('3-8', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'seal', 'diver', 'vaulter'], reward: { coins: 1000, unlock: 'survival' }, newEnemy: 'seal' }),
    L('3-9', { waves: 30, b0: 2, g: 0.55, pool: W3, reward: { coins: 1000, unlock: 'zen' } }),
    L('3-10', { mode: 'conveyor', waves: 20, b0: 2, g: 0.7, pool: W3, conveyor: conv3, reward: { plant: 'tidepuff' } }),

    L('4-1', { waves: 20, b0: 1, g: 0.55, pool: ['rotter', 'crate', 'kettle', 'diver', 'jester'], fogCol: 5, reward: { plant: 'lanternlily' }, newEnemy: 'jester', tut: 'fog' }),
    L('4-2', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'balloon', 'diver'], fogCol: 5, reward: { plant: 'needlecactus' }, newEnemy: 'balloon' }),
    L('4-3', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'balloon', 'seal', 'jester'], fogCol: 5, reward: { plant: 'gustfan' } }),
    L('4-4', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'miner', 'diver', 'balloon'], fogCol: 4, reward: { plant: 'backpod' }, newEnemy: 'miner' }),
    L('4-5', { mode: 'vase', scene: 'night', lanes: ALL5, reward: { plant: 'starprism' }, vase: 'adv', tut: 'vase', minigame: 'Urn Smasher' }),
    L('4-6', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'pogo', 'balloon', 'diver'], fogCol: 4, reward: { plant: 'huskguard' }, newEnemy: 'pogo' }),
    L('4-7', { waves: 20, b0: 2, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'pogo', 'miner', 'brute', 'jester'], fogCol: 4, reward: { plant: 'lodecap' } }),
    L('4-8', { waves: 20, b0: 2, g: 0.7, pool: W4, fogCol: 4, snowfoot: true, reward: { coins: 1500, unlock: 'puzzle' }, newEnemy: 'snowfoot' }),
    L('4-9', { waves: 30, b0: 2, g: 0.6, pool: W4, fogCol: 3, reward: { coins: 1500 } }),
    L('4-10', { mode: 'conveyor', waves: 20, b0: 2, g: 0.7, pool: W4, conveyor: conv4, storm: true, reward: { plant: 'pinelobber' }, tut: 'storm' }),

    L('5-1', { waves: 10, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'grumbler'], pots: 3, grant: ['claypot'], reward: { plant: 'acornlobber' }, tut: 'roof' }),
    L('5-2', { waves: 20, b0: 1, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'grappler', 'grumbler'], pots: 2, reward: { plant: 'wakebean' }, newEnemy: 'grappler' }),
    L('5-3', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'grappler', 'ladder'], reward: { plant: 'stinkonion' }, newEnemy: 'ladder' }),
    L('5-4', { waves: 20, b0: 1, g: 0.65, pool: ['rotter', 'crate', 'kettle', 'catapult', 'ladder', 'grappler'], reward: { plant: 'canopyfern' }, newEnemy: 'catapult' }),
    L('5-5', { mode: 'blitz', waves: 20, b0: 2, g: 0.6, pool: ['rotter', 'crate', 'kettle', 'grappler', 'ladder'], reward: { plant: 'pennypoppy' }, minigame: 'Grappler Blitz' }),
    L('5-6', { waves: 20, b0: 2, g: 0.7, pool: ['rotter', 'crate', 'kettle', 'catapult', 'pogo', 'jester', 'ladder'], reward: { plant: 'durianlobber' } }),
    L('5-7', { waves: 20, b0: 2, g: 0.7, pool: ['rotter', 'crate', 'kettle', 'giant', 'ladder', 'grappler'], reward: { coins: 2000 }, newEnemy: 'giant' }),
    L('5-8', { waves: 20, b0: 2, g: 0.75, pool: W5, reward: { coins: 2000 } }),
    L('5-9', { scene: 'roofnight', waves: 30, b0: 2, g: 0.7, pool: W5, reward: { coins: 3000 } }),
    L('5-10', { mode: 'boss', scene: 'roofnight', waves: 1, conveyor: { claypot: 4, pinelobber: 2, acornlobber: 3, durianlobber: 2, frostcap: 2, firepepper: 2, boomberry: 1, wakebean: 2, canopyfern: 1 }, reward: { coins: 5000, unlock: 'credits' }, tut: 'boss' }),
  ];
  SS.ADV_INDEX = {};
  SS.ADVENTURE.forEach((l, i) => { l.index = i; SS.ADV_INDEX[l.key] = i; });

  // ---------- Minigames ----------
  function M(id, name, o) {
    return Object.assign({ key: 'mini_' + id, id, name, title: name, mode: 'normal', scene: 'day', waves: 20, b0: 2, g: 0.7, sun: 50, first: 15, interval: 22, pool: W1, graves: 0 }, o, { lanes: o.lanes || ((o.scene || 'day') === 'pool' || o.scene === 'fog' ? ALL6 : ALL5) });
  }
  SS.MINIGAMES = [
    M('bowling', 'Barkshell Bowling', { mode: 'bowling', waves: 15, pool: ['rotter', 'crate', 'kettle', 'gate'], desc: 'Roll stumps down the lawn.' }),
    M('whack', 'Bonk the Rotters', { mode: 'whack', scene: 'night', graves: 10, waves: 15, pool: ['rotter', 'crate', 'kettle'], desc: 'Bonk them as they climb out.' }),
    M('little', 'Little Rotters, Big Trouble', { mode: 'little', scene: 'pool', pool: W3.filter((e) => e !== 'sled'), desc: 'Tiny, quick and everywhere.' }),
    M('conveyor', 'Conveyor Frenzy', { mode: 'conveyor', conveyor: Object.assign({}, conv1, { glowpetal: 0 }), pool: W2.concat(['kettle']), desc: 'No sun. Plants arrive on a belt.' }),
    M('speedy', 'Double Time', { speed: 2, pool: W1.concat(['grumbler', 'gate']), desc: 'The horde walks twice as fast.' }),
    M('invisible', 'Phantom Rotters', { invisible: true, scene: 'night', graves: 5, mode: 'conveyor', conveyor: { sporepuff: 3, gasbloom: 2, frostcap: 1, boomberry: 1, barkshell: 2, twinpod: 2, gourdslam: 1 }, pool: W2.filter((e) => e !== 'summoner'), desc: 'You cannot see them. Plan ahead.' }),
    M('column', 'Column Planting', { column: true, scene: 'pool', mode: 'conveyor', conveyor: { lilyraft: 3, twinpod: 2, frostpod: 1, barkshell: 1, tridentpod: 1, boomberry: 1, firepepper: 1, tubertrap: 1 }, pool: W3.filter((e) => e !== 'seal'), desc: 'Every plant fills a whole column.' }),
    M('seedrain', 'Seed Rain', { mode: 'seedrain', scene: 'fog', fogCol: 6, pool: W4, conveyor: { lilyraft: 3, twinpod: 2, needlecactus: 1, lanternlily: 1, tridentpod: 2, gourdslam: 1, firepepper: 1, starprism: 1, huskguard: 1, frostcap: 1 }, desc: 'Seeds fall from the sky instead of sun.' }),
    M('laststand', 'Last Stand', { mode: 'laststand', scene: 'pool', sun: 5000, rounds: 5, waves: 6, pool: W3, desc: 'One big budget. Five rounds. No refills.' }),
    M('stars', 'Seeing Stars', { mode: 'stars', pool: W1.concat(['gate', 'brute']), desc: 'Fill in the star with Star Prisms.' }),
    M('airraid', 'Air Raid', { scene: 'fog', fogCol: 6, pool: ['balloon', 'balloon', 'rotter', 'diver', 'balloon'], mode: 'conveyor', conveyor: { lilyraft: 2, needlecactus: 3, gustfan: 1, reedspiker: 0, twinpod: 2, lanternlily: 1, tridentpod: 1 }, desc: 'Balloons, balloons, balloons.' }),
    M('icerink', 'Ice Rink', { scene: 'pool', pool: ['iceroller', 'sled', 'rotter', 'crate', 'kettle'], mode: 'conveyor', conveyor: { lilyraft: 2, thornmat: 2, firepepper: 1, twinpod: 2, tallbark: 1, tridentpod: 1, frostpod: 1 }, desc: 'Frost Rollers and sled crews everywhere.' }),
    M('pogoparty', 'Spring Fever', { scene: 'roof', pool: ['pogo', 'pogo', 'rotter', 'kettle'], mode: 'conveyor', conveyor: { claypot: 3, tallbark: 2, pinelobber: 2, durianlobber: 1, lodecap: 1, wakebean: 1, acornlobber: 1 }, desc: 'Springers bounce over everything.' }),
    M('blitz', 'Grappler Blitz', { mode: 'blitz', scene: 'roof', pool: ['rotter', 'crate', 'kettle', 'grappler', 'ladder'], desc: 'Look up. They are coming down.' }),
    M('hulks', 'Giant Stampede', { scene: 'day', pool: ['giant', 'rotter', 'crate'], b0: 4, g: 0.6, waves: 10, mode: 'conveyor', conveyor: { twinpod: 3, frostpod: 2, boomberry: 1, tubertrap: 2, barkshell: 2, snapjaw: 1, firepepper: 1, gourdslam: 1 }, desc: 'Nothing but heavyweights.' }),
    M('bowling2', 'Barkshell Bowling II', { mode: 'bowling', waves: 20, b0: 3, g: 0.8, pool: ['rotter', 'crate', 'kettle', 'gate', 'brute', 'vaulter'], desc: 'More lanes of trouble, bigger stumps.' }),
  ];

  // ---------- Puzzles ----------
  SS.PUZZLES = [
    { key: 'vase_1', id: 'vase_1', name: 'Urn Smasher', title: 'Urn Smasher', mode: 'vase', scene: 'night', lanes: ALL5, vase: 'v1', desc: 'Break urns. Some hold plants, some hold Rotters.' },
    { key: 'vase_2', id: 'vase_2', name: 'Urn Smasher II', title: 'Urn Smasher II', mode: 'vase', scene: 'night', lanes: ALL5, vase: 'v2', desc: 'More urns, meaner surprises.' },
    { key: 'vase_3', id: 'vase_3', name: 'Urn Smasher III', title: 'Urn Smasher III', mode: 'vase', scene: 'night', lanes: ALL5, vase: 'v3', desc: 'Bring a plan for the Bale Giants.' },
    { key: 'vase_4', id: 'vase_4', name: 'Urn Smasher: Endless', title: 'Urn Smasher: Endless', mode: 'vase', scene: 'night', lanes: ALL5, vase: 'endless', desc: 'How many rooms of urns can you clear?' },
    { key: 'cmd_1', id: 'cmd_1', name: 'Rot Commander', title: 'Rot Commander', mode: 'commander', scene: 'night', lanes: ALL5, cmd: 'c1', desc: 'Swap sides. Send Rotters to eat the seed vaults.' },
    { key: 'cmd_2', id: 'cmd_2', name: 'Rot Commander II', title: 'Rot Commander II', mode: 'commander', scene: 'night', lanes: ALL5, cmd: 'c2', desc: 'The defense has learned a few tricks.' },
    { key: 'cmd_3', id: 'cmd_3', name: 'Rot Commander III', title: 'Rot Commander III', mode: 'commander', scene: 'night', lanes: ALL5, cmd: 'c3', desc: 'Heavy lobbers and walls everywhere.' },
    { key: 'cmd_4', id: 'cmd_4', name: 'Rot Commander IV', title: 'Rot Commander IV', mode: 'commander', scene: 'night', lanes: ALL5, cmd: 'c4', desc: 'The final defense line.' },
  ];

  // ---------- Survival ----------
  function S(id, name, scene, rounds, o) {
    return Object.assign({ key: 'surv_' + id, id, name, title: 'Survival: ' + name, mode: 'survival', scene, rounds, waves: 6, b0: 3, g: 0.9, sun: 50, first: 10, interval: 15, lanes: scene === 'pool' || scene === 'fog' ? ALL6 : ALL5, graves: scene === 'night' ? 6 : 0, fogCol: scene === 'fog' ? 5 : 0, pool: { day: W1.concat(['grumbler', 'gate', 'brute']), night: W2, pool: W3, fog: W4, roof: W5 }[scene] }, o);
  }
  SS.SURVIVAL = [
    S('day', 'Day', 'day', 5),
    S('night', 'Night', 'night', 5),
    S('pool', 'Pool', 'pool', 5),
    S('fog', 'Fog', 'fog', 5),
    S('roof', 'Roof', 'roof', 5, { pots: 3 }),
    S('dayhard', 'Day (Hard)', 'day', 10, { b0: 5, g: 1.2 }),
    S('poolhard', 'Pool (Hard)', 'pool', 10, { b0: 5, g: 1.2 }),
    S('endless', 'Endless', 'pool', 9999, { b0: 4, g: 1.0, endless: true, pool: W3.concat(['jester', 'balloon', 'pogo', 'ladder', 'giant', 'catapult', 'redgiant', 'grappler', 'gate']).filter((e) => e !== 'miner') }),
  ];
  // round-specific growth for later rounds
  SS.LEVEL_BY_KEY = {};
  [].concat(SS.ADVENTURE, SS.MINIGAMES, SS.PUZZLES, SS.SURVIVAL).forEach((l) => { SS.LEVEL_BY_KEY[l.key] = l; });

  // ---------- Mabel's tips (shown on first play) ----------
  SS.TIPS = {
    basics: [
      'Oh good, you are here! The Rotters are shambling up the street and they want my garden.',
      'Click the falling sun to collect it. Then click the Pip Pod packet and click a tile on the lawn.',
      'Pip Pods spit seeds at anything in their lane. Plant a few before the Rotters reach the house!',
    ],
    sun: ['Glowpetals make extra sun. Plant lots of them early, toward the back.', 'More sun now means more plants later.'],
    flag: ['See the banner on the progress bar? That marks a huge wave. Get ready before it hits.'],
    bowling: ['Barkshell Bowling! Stumps arrive on the belt. Roll them from the left of the red line.', 'They bounce off Rotters and ricochet into other lanes.'],
    conveyor: ['No sun on this one. Plants come along the conveyor belt. Use them before the belt fills up!'],
    night: ['It is night. No sun falls from the sky, so lean on mushrooms. They are cheap and they love the dark.', 'Graves block planting. Rotters will climb out of them on the final wave.'],
    whack: ['Bonk the Rotters! Click on Rotters to bonk them with the mallet. Helmets take a few bonks.'],
    pool: ['The back yard has a pool. Plant Lily Rafts on the water, then put plants on top of them.'],
    fog: ['Fog rolls in at night out here. You will hear them before you see them.', 'Lantern Lilies and Gust Fans help you see what is coming.'],
    vase: ['Urn Smasher! Click the urns to break them. Some hold seed packets, some hold Rotters.'],
    storm: ['A storm is rolling in. You will only see the lawn when the lightning flashes!'],
    roof: ['We are up on the roof now. Everything needs a Clay Pot first.', 'Straight shots hit the slope of the roof, so lobbers work best up here.'],
    boss: ['That is the Junk Colossus. It is the biggest thing they have built.', 'Hit it with everything. Fire Peppers melt its frost balls and Frostcaps put out its fire balls.'],
  };
})();
