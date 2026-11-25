# Genera le illustrazioni delle schede (stile unico) con Pollinations e le salva in img/idee/<id>.webp
import json, os, sys, time, urllib.parse, urllib.request, io
from PIL import Image
D = json.load(open('tools/illustrazioni.json'))
os.makedirs('img/idee', exist_ok=True)
solo = sys.argv[1:]
ok = fail = 0
for i, (k, sog) in enumerate(D['soggetti'].items()):
    out = f'img/idee/{k}.webp'
    if (solo and k not in solo) or (not solo and os.path.exists(out)):
        continue
    q = urllib.parse.quote(f"{sog}. {D['stile']}")
    url = f"https://image.pollinations.ai/prompt/{q}?width=960&height=600&nologo=true&model=flux&seed={1000+i}"
    for t in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'big-in-japan/1.0'})
            b = urllib.request.urlopen(req, timeout=180).read()
            im = Image.open(io.BytesIO(b)).convert('RGB')
            im.thumbnail((960, 600))
            im.save(out, 'WEBP', quality=72, method=6)
            ok += 1; print('ok', k, os.path.getsize(out)); break
        except Exception as e:
            print('riprovo', k, e); time.sleep(20 * (t + 1))
    else:
        fail += 1; print('FALLITO', k)
    time.sleep(6)
print('fatte', ok, 'fallite', fail)
