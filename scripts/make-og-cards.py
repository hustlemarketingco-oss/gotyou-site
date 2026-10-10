"""Generate branded 1200x630 share images.

  public/og/businesses/<slug>.jpg   one per GOTYOU partner (claimStatus "claimed") and per Google-scraped
                                    listing; partners are the ones who share their own page
  public/og/categories/<slug>.jpg   one per display category, the fallback for every other listing
  src/data/og-cards.json            the slugs that have their own card (read by the profile page)

Per-listing cards for all ~6k CRM leads would add ~300 MB to the repo and push the site past Cloudflare's
20k static-file limit, so they share the category card until they're claimed.
Re-run after adding or refreshing listings:  python scripts/make-og-cards.py
Requires Pillow (pip install pillow).
"""
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / "assets"
OUT = ROOT / "public" / "og" / "businesses"
W, H = 1200, 630
TOP, BOTTOM = (0x1E, 0x78, 0xDC), (0x3E, 0xB2, 0xF2)
LIME, INK = (228, 255, 26), (20, 24, 51)


def font(name, size):
    return ImageFont.truetype(str(FONTS / f"Poppins-{name}.ttf"), size)


def background():
    im = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        d.line((0, y, W, y), fill=tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    # skyline silhouette, like the site and app
    sky = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s = ImageDraw.Draw(sky)
    x = 0
    heights = [70, 110, 84, 130, 96, 150, 108, 76, 136, 92, 160, 112, 82, 142, 100, 128, 88, 152, 104, 80, 134, 96, 120, 86]
    widths = [60, 40, 70, 46, 64, 38, 74, 52, 44, 80, 50, 66, 48, 56, 72, 42, 68, 48, 70, 54, 46, 72, 44, 44]
    for h_, w_ in zip(heights, widths):
        s.rounded_rectangle((x, H - h_ - 30, x + w_, H), radius=6, fill=(255, 255, 255, 60))
        x += w_ + 6
    s.rectangle((0, H - 34, W, H), fill=(255, 255, 255, 255))
    im = Image.alpha_composite(im.convert("RGBA"), sky)
    return im


def fit(d, text, name, max_size, min_size, max_w, max_lines):
    """Largest font size at which text wraps into <= max_lines lines of <= max_w px."""
    for size in range(max_size, min_size - 1, -2):
        f = font(name, size)
        words, lines, cur = text.split(), [], ""
        for w in words:
            trial = f"{cur} {w}".strip()
            if d.textlength(trial, font=f) <= max_w:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        if len(lines) <= max_lines and all(d.textlength(l, font=f) <= max_w for l in lines):
            return f, lines
    f = font(name, min_size)
    return f, [text[: max(10, int(max_w / (min_size * 0.6)))] + "…"]


def star(d, cx, cy, r, fill):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)


def slugify(s):
    import re
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("&", "and").replace("'", "")).strip("-")


def category_card(category, logo):
    return card({"name": f"Local {category} spots", "category": category, "city": "Find them near you", "state": "",
                 "googleCategory": "GOTYOU directory"}, logo)


def card(b, logo):
    im = background()
    d = ImageDraw.Draw(im)
    im.alpha_composite(logo, (W - logo.width - 64, 56))
    x = 72
    chip = (b.get("googleCategory") or b["category"])
    cf = font("SemiBold", 28)
    cw = d.textlength(chip, font=cf)
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))  # translucent chip needs real alpha blending
    ImageDraw.Draw(layer).rounded_rectangle((x, 70, x + cw + 40, 70 + 52), radius=26, fill=(255, 255, 255, 46), outline=(255, 255, 255, 120), width=2)
    im.alpha_composite(layer)
    d = ImageDraw.Draw(im)
    d.text((x + 20, 79), chip, font=cf, fill="white")
    nf, lines = fit(d, b["name"], "ExtraBold", 88, 50, W - 2 * x - 40, 2)
    y = 160
    for l in lines:
        d.text((x, y), l, font=nf, fill="white")
        y += int(nf.size * 1.12)
    y += 18
    mf = font("Medium", 34)
    meta = ", ".join(x for x in (b["city"], b["state"]) if x)
    d.text((x, y), meta, font=mf, fill=(235, 245, 255))
    if b.get("googleRating"):
        mx = x + d.textlength(meta + "   ", font=mf)
        star(d, mx + 16, y + 25, 16, LIME)
        rating = f"{b['googleRating']:.1f}"
        sf = font("SemiBold", 34)
        d.text((mx + 40, y), rating, font=sf, fill=LIME)
        d.text((mx + 40 + d.textlength(rating + " ", font=sf), y), f"({b.get('googleReviewCount', 0):,} reviews)", font=mf, fill=(235, 245, 255))
    # footer pill
    pf = font("SemiBold", 26)
    tag = "Hours, directions & local rewards  ·  gotyou.co"
    tw = d.textlength(tag, font=pf)
    d.rounded_rectangle((x, H - 132, x + tw + 44, H - 80), radius=26, fill=LIME)
    d.text((x + 22, H - 124), tag, font=pf, fill=INK)
    return im.convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    logo = Image.open(ROOT / "public/images/brand/gotyou-logo-white.png").convert("RGBA")
    logo.thumbnail((150, 150))
    files = sorted((ROOT / "src/content/businesses").glob("*.json"))
    keep, cats = set(), set()
    for f in files:
        b = json.loads(f.read_text(encoding="utf-8"))
        cats.add(b["category"])
        if b.get("claimStatus") != "claimed" and b.get("source") != "gmaps-scraper":
            continue
        out = OUT / f"{b['slug']}.jpg"
        keep.add(out.name)
        if out.exists() and out.stat().st_mtime >= f.stat().st_mtime:
            continue  # card is newer than the listing; skip the redraw
        card(b, logo).save(out, "JPEG", quality=72, optimize=True, progressive=True)
    for old in OUT.glob("*.jpg"):
        if old.name not in keep:
            old.unlink()
    cat_dir = OUT.parent / "categories"
    cat_dir.mkdir(parents=True, exist_ok=True)
    for c in cats:
        category_card(c, logo).save(cat_dir / f"{slugify(c)}.jpg", "JPEG", quality=72, optimize=True, progressive=True)
    manifest = ROOT / "src" / "data" / "og-cards.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps(sorted(n[:-4] for n in keep)) + "\n", encoding="utf-8")
    print(f"{len(keep)} listing cards in {OUT}, {len(cats)} category cards in {cat_dir}")


if __name__ == "__main__":
    main()
