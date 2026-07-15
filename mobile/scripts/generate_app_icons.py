#!/usr/bin/env python3
"""Generates the alternate app icon assets for Android and iOS.

Variant families:
  - gradient: the five petals of the Immich logo dressed in a center-out
    radial gradient (bright cores fading to deep tips on light grounds, dark
    bases flaring to glowing tips on dark grounds) with a soft drop shadow
    under every petal, over a flat or gradient background.
  - retro:  a pixel-art take on the flower, after the "Retro Magnet" from
    immich.store (jagged pixel petals with darker pixel outlines).
  - scenic: a tiny landscape painted inside each petal, after the
    "Landscape Logo Magnet" from immich.store (sunset mountains, dusk
    skyline, desert dunes, moonlit ocean, misty pines).

Because neither Android vector drawables nor flutter_svg can render blur
filters, everything the shadows touch ships as rendered PNGs. Emits:

  - assets/app-icons/app-icon-<id>.png            (in-app previews)
  - android res: mipmap-<dpi>/ic_launcher_foreground_<id>.png,
                 drawable/ic_launcher_bg_<id>.xml (gradient grounds),
                 values/app_icon_colors.xml       (flat grounds),
                 mipmap-anydpi-v26/ic_launcher_<id>.xml
  - ios: Assets.xcassets/AppIcon<Name>.appiconset/{Contents.json,1024.png}

The PNGs are rendered with macOS `qlmanage`, so this script must run on
macOS. Run it from anywhere: `python3 mobile/scripts/generate_app_icons.py`.
"""

import json
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

MOBILE = Path(__file__).resolve().parent.parent

# Original petal colors, in SVG document order:
# top (red), upper-left (pink), upper-right (yellow),
# lower-left (blue), lower-right (green)
BASE_PETALS = ["#FA2921", "#ED79B5", "#FFB400", "#1E83F7", "#18C249"]

# The flower fills the logo's 192-unit viewBox; icons inset it to 78% (the
# padding of the original iOS icon) and the Android 108dp adaptive
# foreground to 27.55% (the geometry of the stock ic_launcher_foreground).
LOGO = 192
ICON_SCALE = 0.78
DROID_CANVAS = 108
DROID_SCALE = 0.2755

# Petal pixels only exist beyond the flower's hollow core, so the first
# radial stop sits partway out to keep the visible ramp full-range.
INNER_STOP = 0.18
SHADOW = '<filter id="ps" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#000000" flood-opacity="{opacity}"/></filter>'

# Adaptive icon foreground densities (108dp layer).
DENSITIES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

# Backgrounds: ("solid", color) | ("linear", start, end) diagonal top-left ->
# bottom-right | ("vertical", top, bottom) | ("radial", center, edge).
# Petals: five (inner, outer) gradient stop pairs in BASE_PETALS order.
VARIANTS = {
    "classic": {
        "bg": ("solid", "#FFFFFF"),
        "petals": [(c, c) for c in BASE_PETALS],  # the untouched default
        "shadow": 0,
    },
    "retro": {"bg": ("solid", "#FFFFFF"), "kind": "retro", "shadow": 0},
    "scenic": {"bg": ("solid", "#FFFFFF"), "kind": "scenic", "shadow": 0.22},
    "midnight": {
        "bg": ("linear", "#1B2A4A", "#0A0F1E"),
        "petals": [
            ("#B3170A", "#FF6A4D"),
            ("#C2408D", "#FF9DD6"),
            ("#C77F00", "#FFD54D"),
            ("#0F5BD1", "#5CB2FF"),
            ("#0E8A33", "#4DE87A"),
        ],
    },
    "ocean": {
        "bg": ("solid", "#FFFFFF"),
        "petals": [
            ("#7DD3FC", "#0369A1"),
            ("#A5F3FC", "#0891B2"),
            ("#93C5FD", "#1D4ED8"),
            ("#67E8F9", "#155E75"),
            ("#5EEAD4", "#0F766E"),
        ],
    },
    "sunset": {
        "bg": ("vertical", "#3B1D6E", "#150A38"),
        "petals": [
            ("#C2410C", "#FDBA74"),
            ("#6D28D9", "#C4B5FD"),
            ("#A16207", "#FDE047"),
            ("#A21CAF", "#F0ABFC"),
            ("#BE123C", "#FDA4AF"),
        ],
    },
    "forest": {
        "bg": ("solid", "#FFFFFF"),
        "petals": [
            ("#86EFAC", "#15803D"),
            ("#D9F99D", "#4D7C0F"),
            ("#6EE7B7", "#047857"),
            ("#BBF7D0", "#166534"),
            ("#BEF264", "#3F6212"),
        ],
    },
    "blossom": {
        "bg": ("vertical", "#FFF1F2", "#FECDD3"),
        "petals": [
            ("#FDA4AF", "#BE123C"),
            ("#FBCFE8", "#DB2777"),
            ("#F9A8D4", "#9D174D"),
            ("#FECDD3", "#E11D48"),
            ("#F5D0FE", "#A21CAF"),
        ],
    },
    "ink": {
        "bg": ("solid", "#FFFFFF"),
        "petals": [
            ("#94A3B8", "#0F172A"),
            ("#CBD5E1", "#475569"),
            ("#B0BCCC", "#1E293B"),
            ("#E2E8F0", "#64748B"),
            ("#9AA6B8", "#334155"),
        ],
    },
    "neon": {
        "bg": ("radial", "#1A1033", "#050208"),
        "petals": [
            ("#B3005E", "#FF4DA6"),
            ("#0090B3", "#33F0FF"),
            ("#B39B00", "#FFF04D"),
            ("#6600CC", "#B266FF"),
            ("#00B36B", "#4DFFB8"),
        ],
    },
    "gold": {
        "bg": ("linear", "#2B2118", "#141009"),
        "petals": [
            ("#92600A", "#FFD966"),
            ("#B8860B", "#FFF0B3"),
            ("#A5680A", "#FFC933"),
            ("#7A4E06", "#E6A817"),
            ("#9C6F0C", "#FFE080"),
        ],
    },
}


def is_dark(color: str) -> bool:
    r, g, b = (int(color[i : i + 2], 16) for i in (1, 3, 5))
    return 0.299 * r + 0.587 * g + 0.114 * b < 128


def darken(color: str, factor: float) -> str:
    r, g, b = (int(color[i : i + 2], 16) for i in (1, 3, 5))
    return f"#{int(r * factor):02X}{int(g * factor):02X}{int(b * factor):02X}"


def petal_path_data() -> list[str]:
    svg = (MOBILE / "assets" / "immich-logo.svg").read_text()
    return re.findall(r'<path d="([^"]+)"', svg)


# ---------------------------------------------------------------------------
# PNG helpers (qlmanage rendering + minimal decode/encode)
# ---------------------------------------------------------------------------


def render_svg(svg_text: str, size: int) -> bytes:
    """Renders an SVG (whose root width/height should equal size) to PNG."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        svg = Path(tmp_dir) / "render.svg"
        svg.write_text(svg_text)
        subprocess.run(
            ["qlmanage", "-t", "-s", str(size), "-o", tmp_dir, str(svg)],
            check=True,
            capture_output=True,
        )
        rendered = Path(tmp_dir) / "render.svg.png"
        if not rendered.exists():
            sys.exit("qlmanage failed to render SVG")
        return rendered.read_bytes()


def decode_png(png: bytes) -> tuple[int, int, list[bytearray]]:
    """Decodes an 8-bit RGB(A) PNG into rows of RGBA bytes."""
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    pos, idat = 8, b""
    width = height = color_type = None
    while pos < len(png):
        (length,) = struct.unpack(">I", png[pos : pos + 4])
        kind = png[pos + 4 : pos + 8]
        data = png[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", data[:10])
            assert bit_depth == 8 and color_type in (2, 6), "expected 8-bit RGB(A)"
        if kind == b"IDAT":
            idat += data
    channels = 4 if color_type == 6 else 3
    raw = zlib.decompress(idat)
    stride = width * channels
    rows = []
    previous = bytearray(stride)
    for y in range(height):
        row_start = y * (stride + 1)
        filter_type = raw[row_start]
        row = bytearray(raw[row_start + 1 : row_start + 1 + stride])
        for x in range(stride):
            a = row[x - channels] if x >= channels else 0
            b = previous[x]
            c = previous[x - channels] if x >= channels else 0
            if filter_type == 1:
                row[x] = (row[x] + a) & 0xFF
            elif filter_type == 2:
                row[x] = (row[x] + b) & 0xFF
            elif filter_type == 3:
                row[x] = (row[x] + (a + b) // 2) & 0xFF
            elif filter_type == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if pa <= pb and pa <= pc else b if pb <= pc else c
                row[x] = (row[x] + pred) & 0xFF
        previous = row
        if channels == 3:
            rows.append(bytearray(b"".join(row[x * 3 : x * 3 + 3] + b"\xff" for x in range(width))))
        else:
            rows.append(row)
    return width, height, rows


def encode_png_rgb(width: int, height: int, rows: list[bytearray]) -> bytes:
    """Encodes RGBA rows as an opaque RGB PNG (app icons must have no alpha)."""
    rgb = bytearray()
    for row in rows:
        rgb.append(0)
        for x in range(width):
            rgb += row[x * 4 : x * 4 + 3]
    out = bytearray(b"\x89PNG\r\n\x1a\n")

    def chunk(kind: bytes, data: bytes) -> None:
        out.extend(struct.pack(">I", len(data)))
        out.extend(kind)
        out.extend(data)
        out.extend(struct.pack(">I", zlib.crc32(kind + data)))

    chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    chunk(b"IDAT", zlib.compress(bytes(rgb), 9))
    chunk(b"IEND", b"")
    return bytes(out)


def strip_alpha(png: bytes) -> bytes:
    width, height, rows = decode_png(png)
    return encode_png_rgb(width, height, rows)


# ---------------------------------------------------------------------------
# Flower bodies (drawn in the logo's 192-unit space)
# ---------------------------------------------------------------------------


def gradient_body(variant: dict) -> tuple[str, str]:
    """Returns (defs, body) for a gradient/flat petal flower."""
    defs, paths = [], []
    shadow = variant.get("shadow", 0.28 if not is_dark(variant["bg"][1]) else 0.5)
    if shadow:
        defs.append(SHADOW.format(opacity=shadow))
    shadow_attr = ' filter="url(#ps)"' if shadow else ""
    for index, (data, (inner, outer)) in enumerate(zip(petal_path_data(), variant["petals"])):
        if inner == outer:
            fill = inner
        else:
            fill = f"url(#p{index})"
            defs.append(
                f'<radialGradient id="p{index}" gradientUnits="userSpaceOnUse" cx="96" cy="96" r="95">'
                f'<stop offset="{INNER_STOP}" stop-color="{inner}"/>'
                f'<stop offset="1" stop-color="{outer}"/>'
                f"</radialGradient>"
            )
        paths.append(f'<path d="{data}" fill="{fill}"{shadow_attr}/>')
    return "".join(defs), "\n".join(paths)


def retro_body(grid: int = 30) -> tuple[str, str]:
    """Pixel-art flower: sample the logo on a coarse grid, outline the edges."""
    scale = 10
    # Render over a magenta chroma key: qlmanage does not reliably preserve
    # alpha, so background cells are detected by color instead.
    key = "#FF00FF"
    paths = "\n".join(f'<path d="{d}" fill="{c}"/>' for d, c in zip(petal_path_data(), BASE_PETALS))
    svg = (
        f'<svg width="{grid * scale}" height="{grid * scale}" viewBox="0 0 192 192" '
        f'fill="none" xmlns="http://www.w3.org/2000/svg">'
        f'<rect width="192" height="192" fill="{key}"/>{paths}</svg>'
    )
    width, height, rows = decode_png(render_svg(svg, grid * scale))
    assert width == height == grid * scale

    targets = [tuple(int(c[i : i + 2], 16) for i in (1, 3, 5)) for c in BASE_PETALS + [key]]

    def classify(gx: int, gy: int) -> int | None:
        px = (gx * scale + scale // 2) * 4
        row = rows[gy * scale + scale // 2]
        r, g, b, a = row[px : px + 4]
        if a < 128:
            return None
        distances = [(r - t[0]) ** 2 + (g - t[1]) ** 2 + (b - t[2]) ** 2 for t in targets]
        nearest = distances.index(min(distances))
        # Anti-aliased blends between petals match nothing well; drop them so
        # the petals stay separated like the magnet art.
        if nearest == 5 or distances[nearest] > 4000:
            return None
        return nearest

    cells = [[classify(x, y) for x in range(grid)] for y in range(grid)]
    cell_size = LOGO / grid

    def cell_color(x: int, y: int) -> str | None:
        petal = cells[y][x]
        if petal is None:
            return None
        edge = any(
            nx < 0 or ny < 0 or nx >= grid or ny >= grid or cells[ny][nx] != petal
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
        )
        return darken(BASE_PETALS[petal], 0.6) if edge else BASE_PETALS[petal]

    # Merge horizontal runs of the same color into one rect (with a slight
    # vertical overlap) so no hairline seams show between cells.
    rects = []
    for y in range(grid):
        x = 0
        while x < grid:
            color = cell_color(x, y)
            if color is None:
                x += 1
                continue
            run = x
            while run < grid and cell_color(run, y) == color:
                run += 1
            rects.append(
                f'<rect x="{x * cell_size:.1f}" y="{y * cell_size:.1f}" '
                f'width="{(run - x) * cell_size + 0.1:.1f}" height="{cell_size + 0.5:.1f}" fill="{color}"/>'
            )
            x = run
    return "", "\n".join(rects)


def scenic_body(shadow: float) -> tuple[str, str]:
    """A miniature landscape clipped inside each petal, after the store magnet."""

    def sky(name: str, top: str, bottom: str, y1: float, y2: float) -> str:
        return (
            f'<linearGradient id="{name}" gradientUnits="userSpaceOnUse" x1="0" y1="{y1}" x2="0" y2="{y2}">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>'
        )

    defs = [SHADOW.format(opacity=shadow) if shadow else ""]
    defs += [
        sky("sky-peak", "#FFB35C", "#E8402B", 3, 93),
        sky("sky-city", "#F7C9DE", "#D9679F", 34, 120),
        sky("sky-dune", "#FFE99A", "#F0AE3C", 33, 123),
        sky("sky-sea", "#4A6DB5", "#1D3160", 77, 190),
        sky("sky-pine", "#A8D8B4", "#1F5C3D", 119, 190),
    ]
    for index, data in enumerate(petal_path_data()):
        defs.append(f'<clipPath id="c{index}"><path d="{data}"/></clipPath>')

    scenes = [
        # top petal: sunset over mountains
        """<rect x="50" y="0" width="95" height="95" fill="url(#sky-peak)"/>
<circle cx="96" cy="42" r="15" fill="#E01F10"/>
<path d="M50 74 L74 46 L88 62 L102 42 L122 68 L140 56 L140 95 L50 95 Z" fill="#A8281C"/>
<path d="M50 82 L70 62 L84 76 L100 58 L118 80 L138 68 L138 95 L50 95 Z" fill="#7A150D"/>""",
        # upper-left petal: city skyline at dusk
        """<rect x="-2" y="30" width="102" height="92" fill="url(#sky-city)"/>
<circle cx="30" cy="58" r="7" fill="#FBE7F1"/>
<path d="M-2 84 h10 v-16 h7 v10 h8 v-22 h7 v14 h9 v-8 h8 v18 h8 v-12 h9 v8 h8 v-16 h8 v14 h9 v-6 h9 v54 h-100 Z" fill="#9C4A7E"/>
<path d="M-2 96 h8 v-12 h9 v6 h8 v-18 h8 v12 h9 v-6 h9 v14 h8 v-10 h9 v8 h8 v-14 h8 v10 h9 v40 h-93 Z" fill="#5C2249"/>""",
        # upper-right petal: desert dunes
        """<rect x="105" y="28" width="92" height="98" fill="url(#sky-dune)"/>
<circle cx="164" cy="52" r="9" fill="#FFF6CF"/>
<path d="M105 92 Q136 70 158 88 Q178 104 196 92 L196 126 L105 126 Z" fill="#D99C2B"/>
<path d="M105 106 Q128 90 150 102 Q174 116 196 104 L196 126 L105 126 Z" fill="#B67A1D"/>""",
        # lower-left petal: moonlit sea
        """<rect x="6" y="74" width="92" height="120" fill="url(#sky-sea)"/>
<circle cx="52" cy="116" r="13" fill="#D8E4F2"/>
<path d="M6 138 L30 124 L48 138 L6 148 Z" fill="#16264D"/>
<path d="M6 144 Q30 138 52 146 Q74 154 96 146 L96 194 L6 194 Z" fill="#22407E"/>
<path d="M28 158 q10 -4 22 0 M46 170 q12 -4 24 0 M22 178 q10 -4 20 0" stroke="#7FA3DC" stroke-width="2.6" fill="none" stroke-linecap="round"/>""",
        # lower-right petal: misty pines
        """<rect x="78" y="115" width="108" height="80" fill="url(#sky-pine)"/>
<path d="M96 194 L104 162 L112 194 Z M112 194 L122 152 L132 194 Z M132 194 L142 164 L152 194 Z M150 194 L160 150 L170 194 Z M168 194 L176 166 L184 194 Z" fill="#143D28"/>
<rect x="78" y="152" width="108" height="7" fill="#DFF2E4" opacity="0.5"/>
<rect x="78" y="168" width="108" height="5" fill="#DFF2E4" opacity="0.35"/>""",
    ]

    shadow_attr = ' filter="url(#ps)"' if shadow else ""
    body = []
    for index, scene in enumerate(scenes):
        body.append(f'<g{shadow_attr}><g clip-path="url(#c{index})">\n{scene}\n</g></g>')
    return "".join(defs), "\n".join(body)


def flower_body(variant: dict) -> tuple[str, str]:
    kind = variant.get("kind", "gradient")
    if kind == "retro":
        return retro_body()
    if kind == "scenic":
        return scenic_body(variant.get("shadow", 0.22))
    return gradient_body(variant)


# ---------------------------------------------------------------------------
# Canvas assembly
# ---------------------------------------------------------------------------


def bg_svg(bg: tuple) -> tuple[str, str]:
    """Returns (defs snippet, fill ref) for the icon background."""
    kind = bg[0]
    if kind == "solid":
        return "", bg[1]
    if kind == "radial":
        defs = (
            f'<radialGradient id="bg" gradientUnits="userSpaceOnUse" cx="96" cy="96" r="136">'
            f'<stop offset="0" stop-color="{bg[1]}"/><stop offset="1" stop-color="{bg[2]}"/>'
            f"</radialGradient>"
        )
    else:
        x2, y2 = ("192", "192") if kind == "linear" else ("0", "192")
        defs = (
            f'<linearGradient id="bg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{x2}" y2="{y2}">'
            f'<stop offset="0" stop-color="{bg[1]}"/><stop offset="1" stop-color="{bg[2]}"/>'
            f"</linearGradient>"
        )
    return defs, "url(#bg)"


def icon_svg(variant: dict, size: int) -> str:
    """Full square icon: background + inset flower."""
    offset = LOGO * (1 - ICON_SCALE) / 2
    bg_defs, bg_fill = bg_svg(variant["bg"])
    defs, body = flower_body(variant)
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>{bg_defs}{defs}</defs>
<rect width="192" height="192" fill="{bg_fill}"/>
<g transform="translate({offset:g} {offset:g}) scale({ICON_SCALE})">
{body}
</g>
</svg>
"""


def foreground_svg(variant: dict, size: int) -> str:
    """Android adaptive-icon foreground layer (transparent, 108dp geometry)."""
    offset = (DROID_CANVAS - LOGO * DROID_SCALE) / 2
    defs, body = flower_body(variant)
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 {DROID_CANVAS} {DROID_CANVAS}" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>{defs}</defs>
<g transform="translate({offset:g} {offset:g}) scale({DROID_SCALE})">
{body}
</g>
</svg>
"""


# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------


def write_previews() -> None:
    out = MOBILE / "assets" / "app-icons"
    out.mkdir(exist_ok=True)
    for stale in out.glob("app-icon-*.svg"):
        stale.unlink()
    for variant_id, variant in VARIANTS.items():
        (out / f"app-icon-{variant_id}.png").write_bytes(render_svg(icon_svg(variant, 384), 384))
    print(f"previews: {out}")


def android_bg_gradient(bg: tuple) -> str:
    if bg[0] == "radial":
        geometry = 'android:type="radial" android:centerX="54" android:centerY="54" android:gradientRadius="77"'
    elif bg[0] == "vertical":
        geometry = 'android:type="linear" android:startX="0" android:startY="0" android:endX="0" android:endY="108"'
    else:
        geometry = 'android:type="linear" android:startX="0" android:startY="0" android:endX="108" android:endY="108"'
    return f"""<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:aapt="http://schemas.android.com/aapt"
  android:width="108dp"
  android:height="108dp"
  android:viewportWidth="108"
  android:viewportHeight="108">
  <path android:pathData="M0,0h108v108h-108z">
    <aapt:attr name="android:fillColor">
      <gradient {geometry}>
        <item android:offset="0" android:color="#FF{bg[1].lstrip('#')}" />
        <item android:offset="1" android:color="#FF{bg[2].lstrip('#')}" />
      </gradient>
    </aapt:attr>
  </path>
</vector>
"""


def write_android() -> None:
    res = MOBILE / "android" / "app" / "src" / "main" / "res"
    for stale in (res / "drawable").glob("ic_launcher_foreground_*.xml"):
        stale.unlink()
    colors = ['<?xml version="1.0" encoding="utf-8"?>', "<resources>"]
    for variant_id, variant in VARIANTS.items():
        if variant_id == "classic":
            continue

        base = render_svg(foreground_svg(variant, DENSITIES["xxxhdpi"]), DENSITIES["xxxhdpi"])
        with tempfile.TemporaryDirectory() as tmp_dir:
            base_png = Path(tmp_dir) / "fg.png"
            base_png.write_bytes(base)
            for density, pixels in DENSITIES.items():
                target = res / f"mipmap-{density}" / f"ic_launcher_foreground_{variant_id}.png"
                if pixels == DENSITIES["xxxhdpi"]:
                    target.write_bytes(base)
                else:
                    subprocess.run(
                        ["sips", "-z", str(pixels), str(pixels), str(base_png), "--out", str(target)],
                        check=True,
                        capture_output=True,
                    )

        bg = variant["bg"]
        if bg[0] == "solid":
            colors.append(f'    <color name="ic_launcher_background_{variant_id}">{bg[1]}</color>')
            background_ref = f"@color/ic_launcher_background_{variant_id}"
            (res / "drawable" / f"ic_launcher_bg_{variant_id}.xml").unlink(missing_ok=True)
        else:
            (res / "drawable" / f"ic_launcher_bg_{variant_id}.xml").write_text(android_bg_gradient(bg))
            background_ref = f"@drawable/ic_launcher_bg_{variant_id}"

        (res / "mipmap-anydpi-v26" / f"ic_launcher_{variant_id}.xml").write_text(
            f"""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="{background_ref}"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground_{variant_id}"/>
  <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
"""
        )
    colors.append("</resources>")
    (res / "values" / "app_icon_colors.xml").write_text("\n".join(colors) + "\n")
    print(f"android res: {res}")


def write_ios() -> None:
    xcassets = MOBILE / "ios" / "Runner" / "Assets.xcassets"
    for variant_id, variant in VARIANTS.items():
        if variant_id == "classic":
            continue
        iconset = xcassets / f"AppIcon{variant_id.capitalize()}.appiconset"
        shutil.rmtree(iconset, ignore_errors=True)
        iconset.mkdir()
        (iconset / "1024.png").write_bytes(strip_alpha(render_svg(icon_svg(variant, 1024), 1024)))
        (iconset / "Contents.json").write_text(
            json.dumps(
                {
                    "images": [
                        {
                            "filename": "1024.png",
                            "idiom": "universal",
                            "platform": "ios",
                            "size": "1024x1024",
                        }
                    ],
                    "info": {"author": "xcode", "version": 1},
                },
                indent=2,
            )
            + "\n"
        )
    print(f"ios appiconsets: {xcassets}")


if __name__ == "__main__":
    write_previews()
    write_android()
    write_ios()
