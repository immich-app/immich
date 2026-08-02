# Renderer provenance

The independent color/RAW implementation in this directory was vendored from
the workspace repository `fuji-xt5-luts` at commit:

```text
22ac9ce55c0f685281b00ff20682c1e2f9157df1
Recover X-T5 highlight headroom
tag: film-simulation-baseline-v2
```

The following files are byte-for-byte copies from that commit:

- `fuji_luts/__init__.py`
- `fuji_luts/dcp.py`
- `fuji_luts/develop.py`
- `fuji_luts/hdr.py`
- `fuji_luts/lens.py`
- `fuji_luts/pv2012_tone_tables.py`
- `fuji_luts/raf.py`
- `fuji_luts/rgbtable.py`
- `fuji_luts/white_balance.py`
- `fuji_renderer/libraw_full_sensor.py` (source path
  `scripts/libraw_full_sensor.py`)

`fuji_renderer/pipeline.py` came from `scripts/render_preview.py`. Its renderer
math is unchanged. The service adaptation changes its local full-sensor import
and adds one optional PIL image callback after linear-ProPhoto-to-sRGB output
conversion but before the first JPEG encoding. That callback implements
Immich crop/rotate/mirror operations without an extra lossy round trip.

The extractor, reverse-engineering utilities, Lightroom controller, generated
renders, manifests containing private host paths, and all DCP/RGB-table/CUBE/
XMP payloads are intentionally not vendored.
