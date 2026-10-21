# Sprout Siege

A lane-defense game for the browser in the style of Plants vs Zombies. Plant a garden to hold back waves of Rotters, the burlap scarecrow ghouls shambling across your lawn. All plants, enemies, characters, art and sound are original and drawn in code.

## Play online
**https://Vocal101.github.io/sprout-siege/** works in the browser with nothing to install.

## Install and play offline
1. At the top of this page, click the green **Code** button, then **Download ZIP**.
2. Unzip it: right-click the file and choose **Extract All** on Windows, or double-click it on a Mac.
3. Open the unzipped folder and double-click `index.html`. The game opens in your web browser.

If you use git, run `git clone https://github.com/Vocal101/sprout-siege.git` and open `index.html` the same way.

There's nothing else to install and no internet needed once it's downloaded. Chrome or Edge is recommended. Progress saves automatically in your browser, so the online version and a downloaded copy each keep their own save.

## How to play
Rotters walk in from the right side of the lawn, one row at a time. Plant defenders in the grid to stop them before they reach your house. Planting costs sun: click the sun that falls from the sky (or that sun-making plants produce) to collect it, then pick a seed packet from the top bar and click a tile to plant it. Each plant has a recharge time before you can plant it again. If a Rotter reaches the end of a row, its lawnmower clears that row once. If a second one gets through, you lose.

Beat levels to unlock new plants, then choose which ones to bring before each level. Coins from defeated Rotters buy upgrades at Mabel's Seed Cart.

## Controls
- **Click** a seed packet, then a tile, to plant. **Click** sun and coins to collect them.
- `1`-`9`, `0` select seed packets · `S` shovel (dig up a plant) · right-click to cancel
- `Esc` or `P` pause · the **Speed** button switches between x1 and x2
- Auto-collect sun can be turned on from the pause menu.

## What's in it
- **49 plants**: shooters, sun-makers, walls, mines, bombs, freezers, lobbers, water and roof plants, mushrooms for night levels, and upgrade plants that grow on top of others
- **Adventure mode**: 50 levels across 5 worlds (day, night, pool, fog and roof), ending with a boss fight against the Junk Colossus
- **16 minigames**, **8 puzzles** (Urn Smasher and Rot Commander) and **8 survival modes**, including endless
- **Zen Garden** to grow and care for plants, the **Almanac** of every plant and Rotter, and **Mabel's Seed Cart** shop
- 27 kinds of Rotters: kettle-helmeted, crate-carrying, hurdling, snorkeling, balloon-riding, burrowing and ladder-carrying ones, up to the Bale Giant
- Music and sound effects synthesized live with Web Audio

## Files
`js/core.js` engine, input, saving · `plants.js` / `enemies.js` / `levels.js` game data · `art.js` / `art_enemies.js` drawing · `battle.js` core battle, waves and placement · `battle_plants.js` plant behavior and projectiles · `battle_enemies.js` Rotter AI and damage · `battle_draw.js` battle rendering, HUD and input · `modes.js` minigames, puzzles and survival · `menus.js` all menus · `zen.js` Zen Garden · `audio.js` music and sound · `devtest.js` test harness (loads only with `?dev` in the URL)
