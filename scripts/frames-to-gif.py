"""Assemble les images d'une capture (frames.json : fichier et durée) en GIF réduit, pour le README.

Usage : python scripts/frames-to-gif.py <dossier des images> <fichier .gif>
"""

import json
import sys
from pathlib import Path

from PIL import Image

WIDTH = 960

folder, out = Path(sys.argv[1]), Path(sys.argv[2])
frames = json.loads((folder / "frames.json").read_text(encoding="utf-8"))

images, durations = [], []
for f in frames:
    img = Image.open(folder / f["file"]).convert("RGB")
    img = img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
    images.append(img)
    durations.append(f["ms"])

# Une palette commune évite le scintillement des couleurs d'une image à l'autre. Elle est calculée sur la première,
# celle du milieu et la dernière, pour garder les couleurs qui n'apparaissent qu'en cours de route (menu, catégorie).
picks = [images[0], images[len(images) // 2], images[-1]]
sample = Image.new("RGB", (WIDTH, sum(im.height for im in picks)))
y = 0
for im in picks:
    sample.paste(im, (0, y))
    y += im.height
palette = sample.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
images = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
images[0].save(out, save_all=True, append_images=images[1:], duration=durations, loop=0, optimize=True)
print(f"OK {out.name} ({len(images)} images, {out.stat().st_size // 1024} Ko)")
