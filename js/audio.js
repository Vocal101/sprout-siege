// Sprout Siege — synthesized sound effects and music (Web Audio, no assets)
(function () {
  const SS = window.SS;
  const A = (SS.audio = {});
  let ac = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  A.unlock = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    musBus = ac.createGain(); musBus.connect(master);
    A.applyVolume();
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.0, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (A._pendingMusic) { const m = A._pendingMusic; A._pendingMusic = null; A.music(m); }
  };
  A.applyVolume = function () {
    if (!ac) return;
    sfxBus.gain.value = SS.save.settings.sfx * 0.8;
    musBus.gain.value = SS.save.settings.music * 0.35;
  };
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(type, f0, f1, dur, vol, when, bus) {
    const t = (when || ac.currentTime);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, fc, q, when, type, bus, f1) {
    const t = (when || ac.currentTime);
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(fc, t); f.Q.value = q || 1;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); env(g, t, 0.005, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const lastPlay = {};
  A.sfx = function (name, opt) {
    if (!ac || SS.save.settings.sfx <= 0) return;
    const now = ac.currentTime;
    // rate-limit spammy sounds
    const lim = { shoot: 0.04, hit: 0.03, chomp: 0.09, lob: 0.06, step: 0.2 }[name] || 0;
    if (lim && lastPlay[name] && now - lastPlay[name] < lim) return;
    lastPlay[name] = now;
    const r = 0.92 + Math.random() * 0.16;
    switch (name) {
      case 'click': tone('triangle', 660, 880, 0.06, 0.25); break;
      case 'pick': tone('triangle', 520, 780, 0.08, 0.3); break;
      case 'cancel': tone('triangle', 500, 300, 0.1, 0.25); break;
      case 'plant': noise(0.12, 0.5, 600, 1, 0, 'lowpass'); tone('sine', 180 * r, 90, 0.12, 0.5); break;
      case 'shovel': noise(0.18, 0.45, 1200, 1, 0, 'bandpass'); tone('square', 140, 70, 0.1, 0.15); break;
      case 'shoot': tone('sine', 420 * r, 220, 0.07, 0.25); noise(0.04, 0.12, 2500, 1, 0, 'highpass'); break;
      case 'lob': tone('triangle', 260 * r, 520, 0.12, 0.2); break;
      case 'hit': noise(0.07, 0.35, 900 * r, 2, 0, 'bandpass'); tone('sine', 160 * r, 80, 0.06, 0.25); break;
      case 'metal': tone('square', 900 * r, 700, 0.08, 0.12); tone('triangle', 1800 * r, 1300, 0.12, 0.12); break;
      case 'wood': noise(0.08, 0.35, 500 * r, 3, 0, 'bandpass'); tone('triangle', 240 * r, 160, 0.06, 0.2); break;
      case 'chomp': noise(0.06, 0.35, 700 * r, 2, 0, 'bandpass'); tone('square', 110 * r, 70, 0.05, 0.08); break;
      case 'gulp': tone('sine', 300, 80, 0.3, 0.4); noise(0.2, 0.3, 400, 2, 0, 'lowpass'); break;
      case 'sun': tone('sine', 880, 880, 0.08, 0.25); tone('sine', 1320, 1320, 0.14, 0.2, now + 0.06); break;
      case 'coin': tone('square', 1320, 1320, 0.06, 0.12); tone('square', 1760, 1760, 0.2, 0.12, now + 0.07); break;
      case 'diamond': [1320, 1660, 1980, 2640].forEach((f, i) => tone('sine', f, f, 0.18, 0.18, now + i * 0.06)); break;
      case 'boom': noise(0.8, 0.9, 900, 0.7, 0, 'lowpass', null, 60); tone('sine', 90, 30, 0.6, 0.7); break;
      case 'bigboom': noise(1.6, 1.0, 700, 0.6, 0, 'lowpass', null, 40); tone('sine', 70, 20, 1.3, 0.9); break;
      case 'fire': noise(0.9, 0.6, 400, 0.8, 0, 'lowpass', null, 2400); break;
      case 'freeze': [2400, 1800, 2900, 2100].forEach((f, i) => tone('sine', f, f * 0.9, 0.3, 0.1, now + i * 0.05)); noise(0.5, 0.25, 6000, 1, 0, 'highpass'); break;
      case 'splash': noise(0.4, 0.5, 1500, 0.8, 0, 'lowpass', null, 300); break;
      case 'mower': noise(1.6, 0.35, 300, 4, 0, 'bandpass'); tone('sawtooth', 70, 90, 1.5, 0.12); break;
      case 'groan': tone('sawtooth', 120 * r, 90 * r, 0.7, 0.07); tone('sine', 122 * r, 92 * r, 0.7, 0.1); break;
      case 'siren':
        for (let i = 0; i < 3; i++) { tone('sawtooth', 300, 600, 0.45, 0.1, now + i * 0.9); tone('sawtooth', 600, 300, 0.45, 0.1, now + i * 0.9 + 0.45); }
        break;
      case 'alarm': tone('square', 500, 500, 0.15, 0.12); tone('square', 380, 380, 0.25, 0.12, now + 0.17); break;
      case 'wave': [392, 523, 659].forEach((f, i) => tone('triangle', f, f, 0.25, 0.2, now + i * 0.09)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.28, 0.25, now + i * 0.13)); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => tone('sawtooth', f, f * 0.97, 0.45, 0.15, now + i * 0.32)); break;
      case 'pop': tone('sine', 900, 300, 0.08, 0.3); noise(0.05, 0.2, 3000, 1, 0, 'highpass'); break;
      case 'whoosh': noise(0.6, 0.4, 300, 1, 0, 'bandpass', null, 3000); break;
      case 'thud': tone('sine', 120, 40, 0.25, 0.6); noise(0.15, 0.4, 300, 1); break;
      case 'grave': noise(0.5, 0.4, 250, 1, 0, 'lowpass'); tone('triangle', 90, 60, 0.4, 0.3); break;
      case 'urn': noise(0.3, 0.6, 2200, 1, 0, 'bandpass'); tone('triangle', 700, 300, 0.12, 0.2); break;
      case 'bonk': tone('square', 220, 110, 0.12, 0.25); noise(0.1, 0.4, 600, 1); break;
      case 'zap': noise(0.3, 0.4, 4000, 2, 0, 'bandpass', null, 600); tone('sawtooth', 1200, 200, 0.2, 0.1); break;
      case 'seed': [660, 880, 1100, 1320].forEach((f, i) => tone('sine', f, f, 0.2, 0.2, now + i * 0.07)); break;
      case 'buy': [784, 988, 1175].forEach((f, i) => tone('square', f, f, 0.1, 0.1, now + i * 0.08)); break;
      case 'water': noise(0.7, 0.3, 2500, 0.5, 0, 'bandpass', null, 900); break;
      case 'grow': [440, 554, 659, 880].forEach((f, i) => tone('sine', f, f * 1.02, 0.2, 0.2, now + i * 0.1)); break;
      case 'laugh': for (let i = 0; i < 4; i++) tone('sawtooth', 200 - i * 12, 150 - i * 10, 0.14, 0.1, now + i * 0.16); break;
      default: tone('sine', 440, 440, 0.1, 0.2);
    }
  };

  // ---------- music: small step sequencer with original tunes ----------
  // notes as semitone offsets from root; null = rest. Each track: tempo, root, chords, melody, bass style
  const TUNES = {
    title: { bpm: 96, root: 55, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]], mel: [12, null, 14, 16, null, 14, 12, null, 9, null, 12, 14, 16, null, null, null, 17, null, 16, 14, null, 12, 14, null, 16, null, 14, 12, 11, null, null, null], wave: 'triangle' },
    day: { bpm: 112, root: 53, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], mel: [12, null, 16, null, 19, 17, 16, null, 14, null, 12, null, 9, null, 12, null, 16, null, 17, 19, 21, null, 19, 17, 16, null, 14, null, 12, null, null, null], wave: 'square' },
    night: { bpm: 92, root: 50, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]], mel: [12, null, null, 15, 14, null, 12, null, 10, null, 12, null, 7, null, null, null, 15, null, 17, null, 19, null, 17, 15, 14, null, 12, null, 11, null, null, null], wave: 'triangle' },
    pool: { bpm: 120, root: 57, chords: [[0, 4, 7], [2, 5, 9], [5, 9, 12], [0, 4, 7]], mel: [7, 9, 12, null, 14, 12, 9, null, 7, null, 4, null, 7, null, null, null, 9, 12, 14, null, 16, 14, 12, null, 9, 7, 9, null, 12, null, null, null], wave: 'square' },
    fog: { bpm: 84, root: 49, chords: [[0, 3, 7], [3, 7, 10], [-2, 2, 5], [-4, 0, 3]], mel: [7, null, 10, null, 12, null, 15, null, 14, null, 12, null, 10, null, null, null, 7, null, 8, null, 10, null, 12, 10, 8, null, 7, null, 3, null, null, null], wave: 'triangle' },
    roof: { bpm: 128, root: 52, chords: [[0, 4, 7], [5, 9, 12], [3, 7, 10], [5, 9, 12]], mel: [12, 12, null, 15, null, 12, 10, null, 12, null, 7, null, 10, 12, null, null, 12, 12, null, 15, null, 17, 19, null, 17, null, 15, null, 12, null, null, null], wave: 'square' },
    boss: { bpm: 140, root: 45, chords: [[0, 3, 7], [0, 3, 7], [1, 5, 8], [-2, 2, 5]], mel: [12, null, 12, 15, null, 12, 13, null, 12, null, 10, null, 7, null, 8, null, 12, null, 12, 15, null, 17, 18, null, 17, null, 15, null, 13, null, 12, null], wave: 'sawtooth' },
    zen: { bpm: 72, root: 60, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]], mel: [12, null, null, null, 16, null, 19, null, 21, null, null, null, 19, null, 16, null, 14, null, null, null, 17, null, 21, null, 19, null, null, null, null, null, null, null], wave: 'sine' },
    shop: { bpm: 104, root: 58, chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], mel: [7, 12, 16, 12, 7, null, 9, null, 12, 16, 21, 16, 12, null, null, null, 5, 9, 12, 9, 5, null, 7, null, 11, 14, 19, 14, 11, null, null, null], wave: 'triangle' },
  };
  A.current = null;
  let schedTimer = null, step = 0, nextTime = 0;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  A.music = function (name) {
    if (!ac) { A._pendingMusic = name; return; }
    if (A.current === name) return;
    A.current = name;
    step = 0;
    nextTime = ac.currentTime + 0.1;
    if (schedTimer) clearInterval(schedTimer);
    if (!name || !TUNES[name]) return;
    schedTimer = setInterval(sched, 50);
  };
  A.stopMusic = function () { A.current = null; if (schedTimer) clearInterval(schedTimer); schedTimer = null; };
  function sched() {
    const T = TUNES[A.current];
    if (!T || !ac) return;
    const sp = 60 / T.bpm / 2; // eighth notes
    while (nextTime < ac.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % T.chords.length;
      const ch = T.chords[bar];
      const s8 = step % 8;
      // bass on beats
      if (s8 === 0 || s8 === 4) tone('triangle', mtof(T.root - 12 + ch[0]), mtof(T.root - 12 + ch[0]), sp * 1.8, 0.35, nextTime, musBus);
      if (s8 === 6 && bar % 2 === 1) tone('triangle', mtof(T.root - 12 + ch[1]), mtof(T.root - 12 + ch[1]), sp * 0.9, 0.25, nextTime, musBus);
      // chord stabs on off-beats
      if (s8 % 2 === 1) for (const n of ch) tone('sine', mtof(T.root + n), mtof(T.root + n), sp * 0.6, 0.06, nextTime, musBus);
      // light percussion
      if (s8 % 4 === 2) noise(0.05, 0.08, 6000, 1, nextTime, 'highpass', musBus);
      if (s8 === 0) noise(0.08, 0.15, 180, 1, nextTime, 'lowpass', musBus);
      // melody
      const m = T.mel[step % T.mel.length];
      if (m !== null && m !== undefined) tone(T.wave, mtof(T.root + m), mtof(T.root + m), sp * 1.3, T.wave === 'square' || T.wave === 'sawtooth' ? 0.05 : 0.12, nextTime, musBus);
      nextTime += sp;
      step++;
    }
  }
})();
