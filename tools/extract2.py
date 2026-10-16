# Rebuilds data.json + icons.webp for the builder from a current Flandria database.sqlite3.
# usage: python3 extract2.py <database.sqlite3> <positions.json> <icons_dir> <out_dir>
import sqlite3, json, os, sys, math
from PIL import Image
DB, POS, ICONS, OUT = sys.argv[1:5]
c = sqlite3.connect(DB); c.row_factory = sqlite3.Row
EFFECT = {}  # name -> numeric code (Flandria EffectCode enum)
EFFECT_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'effect_code.py')
for line in open(EFFECT_SRC):
    if '=' in line and line.strip()[0].isupper():
        k, v = line.split('='); EFFECT[k.strip()] = int(v)
GRADE = {'BLUE': 0, 'GREEN': 1, 'YELLOW': 2, 'ORANGE': 3}
GENDER = {'MALE': 'Male', 'FEMALE': 'Female'}
BASE = {'Explorer': ['Excavator', 'Sniper'], 'Mercenary': ['Gladiator', 'Guardian Swordsman'],
        'Noble': ['Court Magician', 'Magic Knight'], 'Saint': ['Priest', 'Shaman']}
def classes(r):
    flag = lambda n: bool(r['is_' + n.lower().replace(' ', '_')])
    out = []
    for b, jobs in BASE.items():
        if flag(b): out.append(b)
        else: out += [j for j in jobs if flag(j)]
    return [] if out == list(BASE) else out
def effects(ref):
    out = []
    for r in c.execute('select effect_code, operator, value from effect where ref_code=? order by "index"', (ref,)):
        op, v = r[1], r[2]
        if op == '-': op, v = '+', -v
        out.append([EFFECT[r[0]], op, v])
    return out
def duration(d): return -1 if d is None else max(1, round(d / 1440))

icons = {}
def icon(name):
    if name not in icons: icons[name] = len(icons)
    return icons[name]

WEAPONS = ['one_handed_sword', 'two_handed_sword', 'dagger', 'rapier', 'cariad', 'rifle', 'duals']
items, seen = {}, set()
CRAFT = {x for (x,) in c.execute('select result_code from recipe union select result_code from production')}
def add(slot, it, r=None):
    if r is not None and r['item_set_code']: it['st'] = r['item_set_code']
    if r is not None and r['code'] in CRAFT: it['cr'] = 1  # craftable: no seals
    key = slot + json.dumps({k: v for k, v in it.items() if k not in ('i', 'cr')})
    if key in seen: return
    seen.add(key); items.setdefault(slot, []).append(it)

for t in WEAPONS:
    for r in c.execute(f'select * from {t} order by level_land, name'):
        add('weapon', dict(n=r['name'], i=icon(r['icon']), t=t, c=classes(r), l=r['level_land'], g=GRADE[r['grade']],
                           pa=[r['minimum_physical_damage'], r['maximum_physical_damage']],
                           ma=[r['minimum_magical_damage'], r['maximum_magical_damage']],
                           rg=int(r['attack_range']), sp=round(r['attack_speed'] * 1000), u=r['upgrade_rule_base_code'], b=effects(r['code'])), r)
for t in ['coat', 'pants', 'gauntlet', 'shoes']:
    for r in c.execute(f'select * from {t} order by level_land, name'):
        add(t, dict(n=r['name'], i=icon(r['icon']), c=classes(r), l=r['level_land'], g=GRADE[r['grade']],
                    pd=r['physical_defense'], md=r['magical_defense'], u=r['upgrade_rule_base_code'], b=effects(r['code'])), r)
for r in c.execute('select * from shield order by level_land, name'):
    add('shield', dict(n=r['name'], i=icon(r['icon']), c=classes(r), l=r['level_land'], g=GRADE[r['grade']],
                       pd=r['physical_defense'], md=r['magical_defense'], b=effects(r['code'])), r)
for t in ['hat', 'dress']:
    for r in c.execute(f'select * from {t} order by level_land, name'):
        add(t, dict(n=r['name'], i=icon(r['icon']), c=classes(r), l=r['level_land'], s=GENDER.get(r['gender'], ''),
                    d=duration(r['duration']), b=effects(r['code'])), r)
for r in c.execute('select * from accessory order by level_land, name'):
    add(r['accessory_type'].lower(), dict(n=r['name'], i=icon(r['icon']), c=classes(r), l=r['level_land'], s=GENDER.get(r['gender'], ''),
                                          d=duration(r['duration']), b=effects(r['code']), **({'cs': 1} if r['item_flag'] in ('CASH', 'EVENT') else {})), r)

sets = []
setidx = {}
for r in c.execute('select code, name from item_set order by code'):
    n = c.execute('select count(*) from item_set_item where set_code=?', (r['code'],)).fetchone()[0]
    setidx[r['code']] = len(sets); sets.append(dict(n=r['name'], c=n, b=effects(r['code'])))
for s_ in items.values():
    for it in s_:
        if 'st' in it:
            if it['st'] in setidx: it['st'] = setidx[it['st']]
            else: del it['st']
essences = []
for r in c.execute('select * from essence order by is_core desc, required_level, name'):
    essences.append(dict(n=r['name'], i=icon(r['icon']), k=r['is_core'], t=r['equip_type'], l=r['required_level'],
                         g=GRADE[r['grade']], b=effects(r['code'])))

ucodes = {it['u'] for s in items.values() for it in s if it.get('u')}
upg = {}
for r in c.execute('select code, base_code, level from upgrade_rule order by base_code, level'):
    if r['base_code'] in ucodes: upg.setdefault(r['base_code'], {})[r['level']] = effects(r['code'])
upg = {k: [v.get(i, []) for i in range(max(v) + 1)] for k, v in upg.items()}

WLET = {'P': 'Duals', 'R': 'Rifle', 'C': 'Cariad', 'B': 'Shield', 'A': 'Rapier', 'T': 'Two-handed Sword',
        'S': 'One-handed Sword', 'D': 'Dagger', 'F': 'Fishing Rod'}
pos = json.load(open(POS))
req = {}
for a, b in c.execute('select skill_code, required_skill_code from player_required_skill'):
    req.setdefault(a, []).append(b)
skills = {}
for cls in ['explorer', 'mercenary', 'noble', 'saint']:
    sk = {}
    for code, p in pos[cls].items():
        rows = c.execute('select * from player_skill where reference_code=? order by skill_level', (code,)).fetchall()
        mx = rows[0]['skill_max_level']
        lvs = [r for r in rows if 1 <= r['skill_level'] <= mx] or rows
        r1 = lvs[0]
        w = ', '.join(WLET[x] for x in r1['required_weapons'] if x in WLET) or 'All'
        sk[code] = dict(n=r1['name'], c=classes(r1), w=w, d=rows[0]['description'], x=p['x'], y=p['y'],
                        r=[x for x in req.get(code, []) if x in pos[cls]],
                        lv=[[r['required_level_land'], r['mana_cost'], round(r['cooldown'] * 1000), r['cast_time'], r['cast_distance'],
                             r['effect_range'], r['duration'], r['description']] for r in lvs])
    skills[cls] = sk

json.dump(dict(items=items, upgrades=upg, skills=skills, essences=essences, sets=sets), open(f'{OUT}/data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print({k: len(v) for k, v in items.items()}, len(upg), len(icons))
lower = {f.lower().replace('_', ''): f for f in os.listdir(ICONS)}
cols = 48; rows_ = math.ceil(len(icons) / cols)
sheet = Image.new('RGBA', (cols * 32, rows_ * 32))
missing = []
for name, idx in icons.items():
    f = lower.get(name.lower().replace('_', ''))
    if not f: missing.append(name); continue
    sheet.paste(Image.open(os.path.join(ICONS, f)).convert('RGBA').resize((32, 32)), ((idx % cols) * 32, (idx // cols) * 32))
sheet.save(f'{OUT}/icons.webp', 'WEBP', quality=82, method=6)
json.dump(missing, open(f'{OUT}/missing_icons.json', 'w'))
print('missing icons', len(missing), os.path.getsize(f'{OUT}/icons.webp'), os.path.getsize(f'{OUT}/data.json'))
