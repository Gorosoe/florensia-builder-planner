"""Regenerate data.js from data.json so index.html also works when opened from disk (file://)."""
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(root, 'data.json'), encoding='utf-8') as f:
    data = f.read()
with open(os.path.join(root, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('window.FLO_DATA=' + data + ';\n')
print('data.js written')
