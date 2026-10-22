# Contributing

Thanks for helping! The planner is a plain static site: no build step, no framework, no package to install.
Open `index.html` in a browser (double-click works) and refresh after each change.

## How to send a change

1. Fork the repository on GitHub and clone your fork.
2. Make your change and check it in the browser, in both French and English (language menu in the header).
3. Commit, push to your fork and open a Pull Request describing what you changed and why.

## Project layout

```
index.html          page layout only (HTML); texts are marked with data-i18n attributes
css/style.css       all styles (light and dark theme)
lang/fr.js          French texts
lang/en.js          English texts
js/i18n.js          translation system: tx(), txn(), language detection and menu
js/core.js          game constants (classes, slots, stats), app state S, small helpers
js/class-formulas.js  base stat formulas and in-game corrections per class: the only file to edit after a class update
js/formulas.js      evaluates those formulas
js/rules.js         what a character can use, passives, and the full stat computation compute()
js/render-stats.js  header, stats panel and buff list rendering
js/equipment.js     equipment slots, item/essence picker, seals dialog
js/buffs.js         buff definitions (party, personal, spirit) and their effects
js/skills.js        skill tree: points, locks, rendering, skill details
js/builds.js        save / load / import / export of builds
js/events.js        event handlers for every control
js/boot.js          startup: loads the data and the last build
data.js, data.json  game data (generated, see README: "Updating the data after a game patch")
icons.webp          icon sprite sheet (generated)
tools/              scripts that generate data.json, data.js and icons.webp
```

The `js/` files are classic scripts loaded in order at the bottom of `index.html` and share the same global scope.
A function can call code from any file, but top-level code (outside functions) can only use files loaded before it.

## Adding a language

1. Copy `lang/en.js` to `lang/<code>.js` (for example `lang/de.js`; use the 2-letter browser language code).
2. In the new file:
   - change `registerLang("en", …)` to your code and `name:` to the language's own name (`"Deutsch"`);
   - adapt `plural:` if the language has different plural rules (it returns `"one"` or `"other"`);
   - translate every value. Keep the keys (left side) and the `{placeholders}` exactly as they are.
     Values in back-quotes (`` `…` ``) contain HTML: keep the tags and links.
3. In `index.html`, add `<script src="lang/<code>.js"></script>` right after the other `lang/*.js` lines.
4. Open the page: the language appears in the menu. Missing texts fall back to English, so you can translate in several steps.

Item, essence and skill names stay in English on purpose: they are the names players see in game.

## Adding or changing a text

- In JavaScript, never write interface text directly: add a key to **every** file in `lang/` and use
  `tx("my_key")`, or `tx("my_key", {name: value})` for a text with a `{name}` placeholder.
- For a text with a number that needs a plural, add `my_key_one` and `my_key_other` and use `txn("my_key", n)`
  (`{n}` is filled with the number).
- In `index.html`, keep the French text as the default content and mark the element:
  `data-i18n="key"` (text), `data-i18n-html="key"` (HTML content), or
  `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria-label` for attributes.

## Game rules

The stat rules (how % bonuses, flat bonuses, passives and buffs combine) are summarized in the README.
They were checked against in-game character sheets; if you change a formula, say in your Pull Request what you
compared it with (a screenshot of the in-game character window is ideal).
