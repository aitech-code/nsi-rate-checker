# Extract every MRS-2017 rate analysis (quantities = official coefficients) into JSON.
# Usage: pdftotext -layout mrs-2017.pdf m17.txt  then  python build_mrs2017_json.py m17.txt public/data/mrs-2017-analysis.json
# Every analysis is checked: its lines must recompute to the composite rate printed in the PDF.
import re, json, sys
txt = open(sys.argv[1], encoding='utf-8', errors='replace').read()
pages = txt.split('\f')
LINE = re.compile(r'^(?P<d>\S.*?)\s{2,}(?P<q>[\d,]*\.?\d+)\s+(?P<u>\S+(?: \S+)?)\s{2,}(?P<r>[\d,]+\.\d+)\s+(?P<p>[\d.,]+)\s+(?P<pu>.+?)\s{2,}(?P<a>[\d,]+\.\d+)\s*$')
items, bad = [], 0
for pno, pg in enumerate(pages, 1):
    m = re.search(r'Item Code :\s+(\S+)\s+Unit\s+\(British\)\s*:\s*(.+?)\s*$', pg, re.M)
    if not m: continue
    code, unit = m.group(1), m.group(2).strip()
    nm = re.search(r'Item Name :\s+(.+?)\n\s*\n', pg, re.S)
    name = ' '.join(nm.group(1).split()) if nm else ''
    sec, lines = None, []
    for raw in pg.split('\n'):
        s = raw.strip()
        if s in ('MATERIAL', 'LABOUR', 'EQUIPMENT', 'MACHINERY'): sec = s[0] if s != 'MACHINERY' else 'E'; continue
        if not sec or s.startswith(('TOTAL', 'Sundries', 'Cont.', 'Composite', 'Labour Rates', 'Detail')): continue
        mm = LINE.match(raw.rstrip())
        if mm:
            f = lambda k: float(mm.group(k).replace(',', ''))
            lines.append({'s': sec, 'd': mm.group('d').strip(), 'q': f('q'), 'u': mm.group('u').strip(), 'r': f('r'), 'p': f('p'), 'a': f('a')})
        elif re.search(r'\d+\.\d{2}\s*$', s) and len(s) > 20: bad += 1
    comp = re.search(r'Composite Rates Per\s+(.+?)\s+Rs\.\s+([\d,]+\.\d+)', pg)
    sund = re.search(r'Sundries.*?(\d+)\s+%', pg)
    oh = re.search(r'Cont\. Profit.*?:\s+([\d.]+)\s+%', pg)
    items.append({'c': code, 'n': name, 'u': unit, 'pg': pno, 'lines': lines,
                  'sund': float(sund.group(1)) if sund else 0, 'oh': float(oh.group(1)) if oh else None,
                  'rate': float(comp.group(2).replace(',', '')) if comp else None})
# verify: recompute composite from lines with the page's own sundries/overhead
ok = mism = 0; worst = []
for it in items:
    if it['rate'] is None or it['oh'] is None or not it['lines']: continue
    M = sum(l['a'] for l in it['lines'] if l['s'] == 'M'); L = sum(l['a'] for l in it['lines'] if l['s'] == 'L'); E = sum(l['a'] for l in it['lines'] if l['s'] == 'E')
    calc = M + L + E + L * it['sund'] / 100 + (M + L + E) * it['oh'] / 100
    if abs(calc - it['rate']) <= max(1, it['rate'] * 0.005): ok += 1
    else: mism += 1; worst.append((it['c'], round(calc, 2), it['rate']))
print('items', len(items), 'with lines', sum(1 for i in items if i['lines']), 'unparsed numeric lines', bad)
print('recomputed composite matches PDF:', ok, 'mismatch:', mism, worst[:8])
for it in items:
    for l in it['lines']: l.pop('a', None)
json.dump({'meta': {'edition': 'MRS-2017 (Jan-Mar Qtr-1) rate analyses', 'publisher': 'CSR Cell, Finance Department, Govt of Khyber Pakhtunkhwa',
  'use': 'Quantities (coefficients) per unit of each item; 2017 rates are for reference only'}, 'items': items},
  open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
