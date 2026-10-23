# Cuts each rendered nav-* and eng-* image to a full pill with a thin border, transparent outside,
# so the README shows a floating pill instead of a pill inside a framed rectangle.
# Usage: uv run --with pillow python -I docs/assets/readme/source/pill.py docs/assets/readme
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

LINE = {False: (220, 226, 220), True: (44, 82, 70)}
SS = 4


def mask(w, h, inset):
    m = Image.new('L', (w * SS, h * SS), 0)
    r = (h - 2 * inset) * SS / 2
    ImageDraw.Draw(m).rounded_rectangle((inset * SS, inset * SS, (w - inset) * SS - 1, (h - inset) * SS - 1), radius=r, fill=255)
    return m.resize((w, h), Image.LANCZOS)


for f in sorted(Path(sys.argv[1]).glob('*.webp')):
    if not f.name.startswith(('nav-', 'eng-')):
        continue
    img = Image.open(f).convert('RGBA')
    w, h = img.size
    # The renderer adds a 3 px frame and rounded corners; trim them before drawing the pill.
    img = img.crop((4, 4, w - 4, h - 4))
    w, h = img.size
    outer, inner = mask(w, h, 0), mask(w, h, 3)
    line = LINE[f.stem.endswith('-dark')]
    img.paste(Image.new('RGBA', (w, h), line + (255,)), (0, 0), ImageChops.subtract(outer, inner))
    img.putalpha(outer)
    img.save(f, 'WEBP', lossless=True, method=6)
    print(f.name, w, h)
