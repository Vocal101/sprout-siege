// Sprout Siege — boot
(function () {
  const SS = window.SS;
  setInterval(() => SS.persist(), 10000);
  window.addEventListener('beforeunload', () => SS.persist());
  SS.debug = {
    get battle() { return SS.scene && SS.scene.b; },
    unlockAll() {
      SS.save.debugAll = true;
      SS.save.plants = SS.PLANT_LIST.filter((p) => !p.upgrade && !p.mimic).map((p) => p.id);
      for (const id in SS.UPGRADE_PRICES) SS.save.bought[id] = true;
      SS.save.shovel = true; SS.save.adv = 50; SS.save.zenUnlocked = true;
      SS.persist();
    },
  };
  SS.start(SS.TitleScene());
})();
