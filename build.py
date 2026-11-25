"""Rebuild bundled original resources and offline game HTML. Python 3 stdlib only."""
from pathlib import Path
import json, base64, re
root=Path(__file__).resolve().parent
scene=json.loads((root/'assets/scene.json').read_text());sprites=json.loads((root/'assets/sprites.json').read_text())
files={l['file'] for l in scene['layers']}|{scene['backgroundExhibits']['file'],scene['skyAnimation']['mask']}|{a['image'] for c in sprites['characters'].values() for a in c.values()}|{a['image'] for a in sprites['effects'].values()}
files|={str(p.relative_to(root)) for p in (root/'assets/items').glob('*.png')}
sources={p:'data:image/png;base64,'+base64.b64encode((root/p).read_bytes()).decode() for p in sorted(files)}
(root/'game-data.js').write_text('const GAME_DATA = '+json.dumps(dict(scene=scene,sprites=sprites,sources=sources),ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
html=(root/'index.html').read_text();html=html.replace('<link rel="stylesheet" href="game.css">','<style>'+(root/'game.css').read_text().replace('assets/scene/loading-background.webp','data:image/webp;base64,'+base64.b64encode((root/'assets/scene/loading-background.webp').read_bytes()).decode())+'</style>');html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>\n'+(root/m[1]).read_text()+'\n</script>',html)
html=re.sub(r'(<img src=")(assets/hud/mobile/[^"]+)(")',lambda m:m[1]+'data:image/png;base64,'+base64.b64encode((root/m[2]).read_bytes()).decode()+m[3],html)
# Embed versioned browser and Home Screen icons for the standalone HTML.
html=re.sub(r'href="assets/favicon\.png(?:\?[^"]*)?"','href="data:image/png;base64,'+base64.b64encode((root/'assets/favicon.png').read_bytes()).decode()+'"',html)
html=re.sub(r'href="apple-touch-icon\.png(?:\?[^"]*)?"','href="data:image/png;base64,'+base64.b64encode((root/'apple-touch-icon.png').read_bytes()).decode()+'"',html)
html=re.sub(r'<link rel="manifest"[^>]*>','',html)
(root/'beetle-brawl-v0.1.14-play.html').write_text(html,encoding='utf-8');print('Embedded',len(files),'PNG resources.')
