# Converts the checked MRS CSV into the app's data file. Usage: python3 build_json.py input.csv output.json
import csv,json,sys
rows=list(csv.DictReader(open(sys.argv[1],encoding='utf-8-sig')))
def num(v):
    return None if v in ('',None) else round(float(v),2)
items=[];fixed=[]
for x in rows:
    mu,ml,mr=x['Metric unit'],x['Labour (metric)'],x['Composite (metric)']
    # 22 carriage rows: extraction shifted metric columns. PDF shows "1.61 km" with same labour/composite.
    if mu=='' and x['Unit']=='1 Mile':
        mu,ml,mr='1.61 km',x['Labour'],x['Composite']; fixed.append(x['Code'])
    deleted = x['Deleted'].strip().lower()=='yes' or x['Description'].strip().lower()=='deleted' or x['Remarks'].strip().lower().startswith('deleted')
    items.append({'c':x['Code'],'ch':x['Chapter'],'p':int(x['PDF page']),'d':' '.join(x['Description'].split()),
        'u':x['Unit'],'l':num(x['Labour']),'r':num(x['Composite']),
        'mu':mu,'ml':num(ml),'mr':num(mr),'s':x['Spec No'].strip(),'rm':x['Remarks'].strip(),'del':deleted})
chapters={}
for x in rows: chapters[x['Chapter']]=x['Chapter name']
out={'meta':{'edition':'MRS-2025 (1st Bi-Annual)','publisher':'MRS Cell, Finance Department, Government of Khyber Pakhtunkhwa',
  'sourceFile':'Market Rate System 2025 1st Bi Annual.pdf','basis':'Peshawar market rates; apply district location factor',
  'overheadsIncluded':'23.5% = 4% KP sales tax + 2% overheads + 7.5% income tax + 10% contractor profit (MRS-2025 preface, para 2)',
  'itemCount':len(items),'activeCount':sum(1 for i in items if not i['del']),'fixedRows':fixed,
  'checked':'All rates cross-checked against the official PDF text; page numbers verified'},
  'chapters':chapters,'items':items}
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('items',len(items),'active',out['meta']['activeCount'],'fixed',len(fixed))
