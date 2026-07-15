#!/usr/bin/env python3
"""Generates the alternate app icon assets for Android and iOS.

Recolors the five petals of the Immich logo for each icon variant and emits:
  - assets/app-icons/app-icon-<id>.svg            (in-app previews)
  - android res: drawable/ic_launcher_foreground_<id>.xml,
                 mipmap-anydpi-v26/ic_launcher_<id>.xml,
                 values/app_icon_colors.xml
  - ios: Assets.xcassets/AppIcon<Name>.appiconset/{Contents.json,1024.png}

The iOS PNGs are rendered with macOS `qlmanage`, so this script must run on
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
BASE_BACKGROUND = "#FFFFFF"

# id -> (asset suffix, background, petal colors in BASE_PETALS order).
# "classic" is the default icon and only gets a preview SVG; its native
# assets are the stock ic_launcher / AppIcon.
VARIANTS = {
    "classic": (BASE_BACKGROUND, BASE_PETALS),
    "midnight": ("#0F172A", BASE_PETALS),
    "ocean": ("#FFFFFF", ["#0284C7", "#38BDF8", "#1D4ED8", "#0891B2", "#14B8A6"]),
    "sunset": ("#1E1B4B", ["#F97316", "#7C3AED", "#FACC15", "#C026D3", "#F43F5E"]),
    "forest": ("#FFFFFF", ["#16A34A", "#84CC16", "#4ADE80", "#15803D", "#65A30D"]),
    "blossom": ("#FFF1F2", ["#E11D48", "#FB7185", "#F472B6", "#BE185D", "#F9A8D4"]),
    "ink": ("#FFFFFF", ["#111827", "#6B7280", "#374151", "#9CA3AF", "#4B5563"]),
    "neon": ("#0A0A12", ["#FF2D95", "#00E5FF", "#FFD600", "#7C4DFF", "#00FF9D"]),
    "gold": ("#1C1917", ["#FBBF24", "#FDE68A", "#F59E0B", "#D97706", "#FCD34D"]),
}


def recolor(text: str, petals: list[str]) -> str:
    for base, new in zip(BASE_PETALS, petals):
        pattern = re.compile(re.escape(base), re.IGNORECASE)
        text = pattern.sub(new, text)
    return text


def petal_paths() -> str:
    svg = (MOBILE / "assets" / "immich-logo.svg").read_text()
    return "\n".join(re.findall(r"<path[^>]*/>", svg))


def icon_svg(background: str, petals: list[str], size: int) -> str:
    # The flower spans the full 192px viewBox; scale it down so the icon
    # keeps the same padding as the original iOS app icon.
    scale = 0.78
    offset = 192 * (1 - scale) / 2
    paths = recolor(petal_paths(), petals)
    return f"""<svg width="{size}" height="{size}" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="192" height="192" fill="{background}"/>
<g transform="translate({offset:g} {offset:g}) scale({scale})">
{paths}
</g>
</svg>
"""


def write_previews() -> None:
    out = MOBILE / "assets" / "app-icons"
    out.mkdir(exist_ok=True)
    for variant, (background, petals) in VARIANTS.items():
        (out / f"app-icon-{variant}.svg").write_text(icon_svg(background, petals, 192))
    print(f"previews: {out}")


def write_android() -> None:
    res = MOBILE / "android" / "app" / "src" / "main" / "res"
    foreground = (res / "drawable" / "ic_launcher_foreground.xml").read_text()

    colors = ['<?xml version="1.0" encoding="utf-8"?>', "<resources>"]
    for variant, (background, petals) in VARIANTS.items():
        if variant == "classic":
            continue
        (res / "drawable" / f"ic_launcher_foreground_{variant}.xml").write_text(
            recolor(foreground, petals)
        )
        colors.append(f'    <color name="ic_launcher_background_{variant}">{background}</color>')
        (res / "mipmap-anydpi-v26" / f"ic_launcher_{variant}.xml").write_text(
            f"""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background_{variant}"/>
  <foreground android:drawable="@drawable/ic_launcher_foreground_{variant}"/>
  <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
"""
        )
    colors.append("</resources>")
    (res / "values" / "app_icon_colors.xml").write_text("\n".join(colors) + "\n")
    print(f"android res: {res}")


def strip_alpha(png: bytes) -> bytes:
    """Re-encodes an RGBA PNG as opaque RGB (required for app icons)."""
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    pos, chunks, idat = 8, [], b""
    width = height = bit_depth = color_type = None
    while pos < len(png):
        (length,) = struct.unpack(">I", png[pos : pos + 4])
        kind = png[pos + 4 : pos + 8]
        data = png[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", data[:10])
        if kind == b"IDAT":
            idat += data
        else:
            chunks.append((kind, data))
    if color_type != 6 or bit_depth != 8:
        return png  # already opaque

    raw = zlib.decompress(idat)
    stride = width * 4
    rgb = bytearray()
    previous = bytearray(width * 4)
    for y in range(height):
        row_start = y * (stride + 1)
        filter_type = raw[row_start]
        row = bytearray(raw[row_start + 1 : row_start + 1 + stride])
        for x in range(stride):
            a = row[x - 4] if x >= 4 else 0
            b = previous[x]
            c = previous[x - 4] if x >= 4 else 0
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


def write_ios() -> None:
    xcassets = MOBILE / "ios" / "Runner" / "Assets.xcassets"
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        for variant, (background, petals) in VARIANTS.items():
            if variant == "classic":
                continue
            svg = tmp / f"{variant}.svg"
            svg.write_text(icon_svg(background, petals, 1024))
            subprocess.run(
                ["qlmanage", "-t", "-s", "1024", "-o", tmp_dir, str(svg)],
                check=True,
                capture_output=True,
            )
            rendered = tmp / f"{variant}.svg.png"
            if not rendered.exists():
                sys.exit(f"qlmanage failed to render {svg}")

            iconset = xcassets / f"AppIcon{variant.capitalize()}.appiconset"
            shutil.rmtree(iconset, ignore_errors=True)
            iconset.mkdir()
            (iconset / "1024.png").write_bytes(strip_alpha(rendered.read_bytes()))
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
