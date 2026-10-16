# Florensia Build Planner

A character build planner for the MMORPG **Florensia**: stats, equipment (weapons, armor, dresses, hats, jewelry), upgrade levels, essences, seals, item sets, skill tree, passives and buffs (including pet buffs).

The interface is available in English and French: it follows the browser's language and can be switched in the header. Item and skill names stay in English, as in the game.

**Live site:** https://gorosoe.github.io/florensia-builder-planner/

> **Unofficial fan project.** Florensia and its names, data and icons belong to their respective owners. This project is not affiliated with the game's publisher.

## Usage

- **Online:** open the live site above.
- **Locally:** double-click `index.html`. No server is needed.

## Files

| File | Purpose |
|---|---|
| `index.html` | The planner (HTML, CSS and JavaScript in a single file) |
| `data.json` | Game data: items, upgrades, essences, sets, skills |
| `data.js` | Copy of `data.json` loaded by the page, so it also works when opened from disk |
| `icons.webp` | Icon sprite sheet (32 px) |
| `tree-*.png` | Skill tree backgrounds |
| `tools/extract2.py` | Builds `data.json` and `icons.webp` from Flandria's SQLite database |
| `tools/effect_code.py` | Game effect codes (taken from Flandria) |
| `tools/positions.json` | Skill positions in the skill trees |
| `tools/make_datajs.py` | Rebuilds `data.js` from `data.json` |

## Updating the data after a game patch

1. Update your Flandria database (`database.sqlite3`) with Flandria's own tools.
2. Generate the data:
   ```
   python tools/extract2.py path/to/database.sqlite3 tools/positions.json path/to/icons .
   ```
   (`path/to/icons` is the folder of PNG icons exported by Flandria.)
3. Rebuild `data.js`:
   ```
   python tools/make_datajs.py
   ```
4. Commit and push the changed files.

## How stats are calculated

- Percentage bonuses apply to the character's base value (class, level and stat points), plus the weapon's base damage for attack.
- Flat bonuses (upgrades, essences, seals, sets, passives, buffs) are added afterwards.
- Defense is the exception: its percentage bonuses apply after all other bonuses.
- Attack speed = weapon speed ÷ (1 + speed bonuses).
- Range = 1.1 m + weapon range.
- Seals: 0 to 5 per item, with options and value ranges taken from the game tables according to the item's level. Never on cash jewelry, shields or craftable items, except Realm items of level 101 to 105.
- Mercenary/Gladiator base attack is calibrated against in-game character sheets at level 112; other classes may be slightly off.

## Credits and license

- Stat formulas, skill trees and data extraction are based on [Flandria](https://github.com/HealYouDown/flandria) by HealYouDown, licensed under AGPL-3.0.
- This project is distributed under the same license: **GNU Affero General Public License v3.0**. See [LICENSE](LICENSE).
