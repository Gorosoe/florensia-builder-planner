// Base stat formulas per class: the ONLY place to edit when a game update changes how classes scale.
// The game computes these on its servers, so they are not in the game files. Original values come from the
// Flandria planner (community-derived) and were checked against in-game character sheets.
//
// Every derived stat is:  (level × lv[0]) ^ lv[1]  +  Σ ((stat − offset) × mult) ^ exp  +  add
//   lv:    [mult, exp]                    level term
//   terms: [[stat, offset, mult, exp]…]   one entry per character stat that feeds this value (str, dex, con, int, wis, vol)
//   add:   constant
// (a negative (stat − offset) × mult keeps its sign: −(|x| ^ exp))
//
// Keys: hp, mp, mel/rng/mag (base melee/ranged/magic attack, before weapons), hm/hr/hg (melee/ranged/magic
// accuracy), cr (critical, same for all three), av (evasion).
const CLASS_FORMULAS={
  mercenary:{
    hp:  {lv:[13,1.2],  terms:[["con",13,13,1.2]],                 add:-50},
    mp:  {lv:[10,1.2],  terms:[["wis",6,10,1.2]],                  add:60},
    mel: {lv:[1,1.1],   terms:[["str",10,1.5,1.1]],                add:-10},
    rng: {lv:[1,1.1],   terms:[["str",10,1.4,1.1]],                add:-10},
    mag: {lv:[1,1.1],   terms:[["int",5,1.4,1.1]],                 add:0},
    hm:  {lv:[1.5,1.1], terms:[["dex",12,1.5,1.1]],                add:40},
    hr:  {lv:[1.5,1.1], terms:[["dex",12,1.5,1.1]],                add:40},
    hg:  {lv:[1.5,1.1], terms:[["dex",12,1.5,1.1]],                add:40},
    cr:  {lv:[1,1.1],   terms:[["vol",9,3,1.1]],                   add:0},
    av:  {lv:[1,1.1],   terms:[["dex",12,0.5,1.1]],                add:6},
  },
  explorer:{
    hp:  {lv:[12,1.2],  terms:[["con",9,13,1.2]],                  add:20},
    mp:  {lv:[10,1.2],  terms:[["wis",6,10,1.2]],                  add:60},
    mel: {lv:[1,1.1],   terms:[["str",9,1.4,1.1]],                 add:-11},
    rng: {lv:[1,1.1],   terms:[["str",9,1.5,1.1]],                 add:-11},
    mag: {lv:[1,1.1],   terms:[["int",5,1.4,1.1]],                 add:-5},
    hm:  {lv:[1.6,1.1], terms:[["dex",12,1.5,1.1]],                add:45},
    hr:  {lv:[1.6,1.1], terms:[["dex",12,1.6,1.1]],                add:45},
    hg:  {lv:[1.6,1.1], terms:[["dex",13,1.5,1.1]],                add:40},
    cr:  {lv:[1,1.1],   terms:[["vol",10,3,1.1]],                  add:0},
    av:  {lv:[1.2,1.1], terms:[["dex",10,0.6,1.1]],                add:2},
  },
  noble:{
    hp:  {lv:[12,1.2],  terms:[["con",4,10,1.2]],                  add:40},
    mp:  {lv:[11,1.2],  terms:[["wis",13,12,1.2]],                 add:60},
    mel: {lv:[1,1.1],   terms:[["str",6,1.4,1.1],["int",12,0.8,1.1]], add:-10},
    rng: {lv:[1,1.1],   terms:[["str",6,1.4,1.1],["int",12,0.8,1.1]], add:-10},
    mag: {lv:[1,1.1],   terms:[["int",12,1.6,1.1]],                add:-8},
    hm:  {lv:[2,1.1],   terms:[["dex",9,2.2,1.1]],                 add:30},
    hr:  {lv:[2,1.1],   terms:[["dex",9,2.2,1.1]],                 add:30},
    hg:  {lv:[1.5,1.1], terms:[["dex",14,2.2,1.1],["int",14,1,1.1]], add:40},
    cr:  {lv:[1,1.1],   terms:[["vol",8,3,1.1]],                   add:0},
    av:  {lv:[1.2,1.1], terms:[["dex",10,1,1.1]],                  add:3},
  },
  saint:{
    hp:  {lv:[12,1.2],  terms:[["con",6,11,1.2]],                  add:20},
    mp:  {lv:[11,1.2],  terms:[["wis",13,12,1.2]],                 add:60},
    mel: {lv:[1,1.1],   terms:[["str",6,1.4,1.1],["int",12,0.8,1.1]], add:-8},
    rng: {lv:[1,1.1],   terms:[["str",6,1.4,1.1],["int",12,0.8,1.1]], add:-8},
    mag: {lv:[1,1.1],   terms:[["int",11,1.6,1.1]],                add:0},
    hm:  {lv:[2,1.1],   terms:[["dex",9,2.2,1.1]],                 add:35},
    hr:  {lv:[2,1.1],   terms:[["dex",9,2.2,1.1]],                 add:35},
    hg:  {lv:[1.5,1.1], terms:[["dex",12,2.2,1.1],["int",12,1,1.1]], add:45},
    cr:  {lv:[1,1.1],   terms:[["vol",10,3,1.1]],                  add:0},
    av:  {lv:[1.2,1.1], terms:[["dex",10,1,1.1]],                  add:3},
  },
};

// In-game corrections measured on character sheets, added on top of the formulas above (flat, not affected by % bonuses).
// Mercenary melee attack, checked on a level 112 Gladiator: +29.2 barehanded; with a weapon +171.5 min / +227.5 max,
// plus perStr for each STR point above strFrom.
const CLASS_CALIBRATION={
  mercenary:{melee:{bare:[29.2,29.2],weapon:[171.5,227.5],perStr:0.36,strFrom:21}},
};
