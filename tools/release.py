"""Bump the app version: updates ?v= on every css/js link in index.html and the cache list in sw.js.
Run after any change, before committing:  python3 tools/release.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = (root/"index.html").read_text(encoding="utf8")
sw = (root/"sw.js").read_text(encoding="utf8")
v = int(re.search(r'const VERSION = "lifebase-v(\d+)"', sw).group(1)) + 1
idx = re.sub(r'\?v=\d+', f'?v={v}', idx)
assets = re.findall(r'(?:href|src)="((?:css|js)/[^"?]+)\?v=\d+"', idx)
shell = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
         'icons/maskable-512.png', 'icons/apple-touch-icon.png'] + [f'{a}?v={v}' for a in assets]
sw = re.sub(r'const VERSION = "lifebase-v\d+"', f'const VERSION = "lifebase-v{v}"', sw)
sw = re.sub(r'const SHELL = \[[^\]]*\];', 'const SHELL = [\n  ' + ',\n  '.join(f'"{s}"' for s in shell) + '\n];', sw, flags=re.S)
(root/"index.html").write_text(idx, encoding="utf8")
(root/"sw.js").write_text(sw, encoding="utf8")
print(f"version {v}: {len(assets)} files")
