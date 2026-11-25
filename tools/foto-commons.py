# Sceglie per ogni scheda una foto orizzontale da Wikimedia Commons, la ritaglia 16:10 e la salva in img/idee/<id>.webp con i crediti
import json, os, sys, time, io, urllib.parse, urllib.request, re
from PIL import Image, ImageDraw
H = {'User-Agent': 'big-in-japan/1.0 (https://github.com/AngeloBerardi/big-in-japan)'}
Q = json.load(open('tools/foto-query.json'))
os.makedirs('img/idee', exist_ok=True)
CR = json.load(open('img/idee/crediti.json')) if os.path.exists('img/idee/crediti.json') else {}
solo = sys.argv[1:]
def get(u):
    for t in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=60).read()
        except Exception as e: print('riprovo', e); time.sleep(5 * (t + 1))
    raise RuntimeError(u)
def testo(h): return re.sub('<[^>]+>', '', h or '').strip()[:120]
fogli = []
for k, q in Q.items():
    if solo and k not in solo: continue
    if not solo and os.path.exists(f'img/idee/{k}.webp'): continue
    u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action':'query','format':'json','generator':'search','gsrnamespace':6,'gsrlimit':20,'gsrsearch':q+' filetype:bitmap','prop':'imageinfo','iiprop':'url|size|mime|extmetadata','iiurlwidth':1200})
    j = json.loads(get(u)); P = sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p['index'])
    scelta = None
    for p in P:
        ii = p['imageinfo'][0]; w, h = ii['width'], ii['height']
        if ii['mime'] not in ('image/jpeg', 'image/png', 'image/webp') or w < 900 or w < h * 1.15 or re.search(r'logo|map|diagram|sign|menu', p['title'], re.I): continue
        scelta = (p, ii); break
    if not scelta: print('NIENTE', k, q); continue
    p, ii = scelta
    im = Image.open(io.BytesIO(get(ii['thumburl']))).convert('RGB')
    W, Hh = im.size; tw = min(W, int(Hh * 1.6)); th = int(tw / 1.6); l = (W - tw) // 2; t = (Hh - th) // 2
    im = im.crop((l, t, l + tw, t + th)).resize((960, 600), Image.LANCZOS)
    im.save(f'img/idee/{k}.webp', 'WEBP', quality=74, method=6)
    m = ii.get('extmetadata', {})
    CR[k] = {'file': p['title'], 'pagina': ii.get('descriptionurl', ''), 'autore': testo(m.get('Artist', {}).get('value')), 'licenza': testo(m.get('LicenseShortName', {}).get('value'))}
    print('ok', k, p['title']); time.sleep(1)
json.dump(CR, open('img/idee/crediti.json', 'w'), ensure_ascii=False, indent=1)
# foglio di controllo
F = sorted(f for f in os.listdir('img/idee') if f.endswith('.webp'))
S = Image.new('RGB', (6 * 240, ((len(F) + 5) // 6) * 170), 'white'); d = ImageDraw.Draw(S)
for i, f in enumerate(F):
    x, y = (i % 6) * 240, (i // 6) * 170
    S.paste(Image.open('img/idee/' + f).resize((236, 148)), (x + 2, y + 2)); d.text((x + 4, y + 152), f[:-5], fill='black')
S.save('tools/foglio-foto.jpg', quality=70)
