# Immich sidecar renderer

This server helper develops an original photo using Lightroom XMP and streams an
RGBA bitmap into Immich's existing preview pipeline. It writes no image files.
Lightcraft is a pinned Cargo Git dependency: its public XMP mapper and CPU pipeline
are called directly, without copying their implementation or running its app.
The current [fork pin](https://github.com/ilyador/lightcraft/commit/80b44dee4e7d37f41871a0ee03d733a5679a5f0a)
keeps camera-preview calibration active, respects declared embedded-preview
color spaces before resizing, retains saved numeric white balance,
selects Enhanced DNG pixels and provides a source loader independent of external
camera-profile configuration. It also retains imported-profile monochrome
treatment and supported profile parameters, curves and conventional detail
controls. It consumes the rendering work in
[Lightcraft PR #1226](https://github.com/storytold/lightcraft/pull/1226);
Lightroom fidelity remains incomplete, including source color/exposure, profiles,
curve refinement, noise reduction and sharpening. Camera support follows file
metadata and decoder capabilities; the Immich adapter has no camera-model branches.

Build with Rust 1.94 or newer (Docker and CI use 1.98.0) and the system LibRaw
development package (`libraw-dev` on Debian or Ubuntu; version 0.21 or newer):

```sh
cargo build --release --locked
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
cargo fmt --check
```

Custom development installations can set `LIBRAW_INCLUDE_DIR` to the directory
containing `libraw/libraw.h` and `LIBRAW_LIB_DIR` to the directory containing
`libraw_r.so`. Production uses `pkg-config` and the distribution package.
For a bare `pnpm` server development process, set `IMMICH_SIDECAR_RENDERER` to the
absolute path of `target/release/immich-sidecar-renderer`. XMP packets are limited
to 128 MiB in both the helper and server adapter. This includes the archive's
large Lightroom mask data and embedded lookup tables; XML remains bounded to
64 nesting levels and 200,000 nodes, matching Lightcraft's node limit.

```sh
immich-sidecar-renderer --version
immich-sidecar-renderer --original PHOTO.NEF --sidecar PHOTO.xmp --colorspace srgb --size 1440
immich-sidecar-renderer --original PHOTO.dng --colorspace srgb --size 1440
```

`--size` specifies the output's short edge, preserving Immich's `fit: outside`
behavior, with no upscaling. Omit it for native developed resolution. Source
decoding retains native detail before applying XMP crop. Decoded pixels already
have their source orientation: an XMP orientation applies only the required
orientation delta. Lightroom's saved crop corners are converted through the
existing public affine/crop APIs before mapping into the target orientation,
including straighten angles and reflections. Output supports `srgb`
and `p3`; pixels are gamma-encoded in that space and ready for Sharp's existing
profile attachment and encoding.

Without `--sidecar`, the helper requires a RAW source, decodes its native image,
and applies applicable embedded XMP. With no development settings, it renders the
native RAW with the pipeline defaults. It never uses an embedded JPEG as the
source for this path. A supplied external sidecar takes precedence and retains
the metadata-only/AlreadyApplied skip behavior. Malformed embedded XMP or failed
native decoding exits with an error so Immich can retain the last valid cache.

Stdout contains a single JSON line (at most 64 KiB), then exactly
`width * height * 4` interleaved RGBA bytes. A developed header has:

```json
{
  "version": 1,
  "rendererVersion": "immich-sidecar-renderer/0.1.0/adapter/BUILD_HASH/lightcraft/80b44dee4e7d37f41871a0ee03d733a5679a5f0a/libraw/0.21.5-Release",
  "status": "developed",
  "isDeveloped": true,
  "width": 2160,
  "height": 1440,
  "channels": 4,
  "colorspace": "srgb",
  "nativeWidth": 6000,
  "nativeHeight": 4000,
  "unmapped": ["CameraProfile", "Look"]
}
```

Metadata-only packets with an unchanged source orientation, unsupported-only and
`AlreadyApplied` external packets return
`status: "skipped"`, `reason: "no-applicable-development"`, and no pixels. Errors
exit nonzero with diagnostics on stderr and no successful frame. Source/XMP
fingerprinting and safe cache publication belong to the caller.
Structured Look names/identifiers and unsupported-only profile parameters also
skip before decoding. Explicit supported neutral profile controls remain
authoritative over embedded RAW edits: nested color conversion, zero scalars,
identity curves and Amount 0 with a supported definition still render.
Native RAW responses always include a bitmap and `isDeveloped`: it is `true`
when applicable XMP was applied and `false` for default RAW rendering.

The source loader first reuses Lightcraft's existing RAW decoding, camera-preview
calibration and tone preparation. Only `SourceInfo.raw=true` is accepted: an
embedded-preview fallback is discarded. Enhanced DNGs use their retained enhanced
image, with inherited camera metadata and framing. JPEG XL decoding preserves
integer/float camera samples rather than display gamut mapping. Missing or failed
tiles reject the whole image; an enhanced decode failure never falls back to the
noisy original CFA. XYB tiles with ICC or non-linear encodings remain unsupported.
Unsupported RAW variants without a retained enhancement then use
LibRaw, preserving camera coverage including CR3. Selected external or embedded
XMP is applied after source preparation, once, in the CPU pipeline. Only bundled camera profiles
are used; external profile directories and the working directory cannot change the
preview. The source orientation is retained so an XMP orientation override applies
one delta, and Lightroom crop coordinates are mapped from the original image into
that effective orientation before cropping.

Enhanced DNG images take priority over their retained original CFA image. JPEG XL
camera samples use the existing pure Rust decoder with wide predictor buffers and
an unclipped colour-space matrix from Lightcraft's colour library. Corrupt or
unsupported enhanced data fails instead of falling back to its noisy original.
XYB tiles with non-linear transfer functions or ICC encodings remain unsupported.

LibRaw performs sensor decoding, black subtraction, camera white balance,
demosaicing, camera color conversion and default inset cropping through its
public API. A small C++ shim owns the LibRaw allocation; Rust converts its linear
Rec.2020 16-bit memory output to float and applies source orientation once. Source
white point is estimated from LibRaw's daylight/as-shot gain ratio and camera
matrix for Lightcraft's relative WB adjustment. For Lightcraft-prepared NEF/ARW
images, a header-only LibRaw read supplies this physical as-shot white point; it
keeps the prepared as-shot pixels unchanged and does not decode a second image.
Saved named/Auto white balance uses the XMP's numeric temperature/tint. CRS white
balance follows the decoded source's absolute or relative calibration, including
LibRaw's measured white point. Missing calibration uses an explicitly reported
daylight-relative fallback. Native source dimensions are retained for noise
reduction and sharpening scale.

Reversible attenuation reserves headroom during LibRaw's bounded integer
processing. This is not lossless floating-point RAW development: extreme sensor
or white-balance highlights and missing default inset crops can still differ from
Lightroom. Native framing follows the selected decoder: for the D3500 fixture,
Lightcraft now uses its declared 6000 × 4000 metadata crop within the
6016 × 4016 sensor plane; LibRaw's default inset also returns 6000 × 4000.
The helper reports the actual developed dimensions. Global settings
and local masks recognized by Lightcraft's CRS mapper are applied together. The
`unmapped` header merges CRS import and runtime pipeline diagnostics, including
CameraProfile, unsupported Look components, newer FilterList, depth, lens-blur
and encoded-table adjustments. The helper has no runtime table resource loader;
saved LookTable references report their missing resource when active. Amount 0
bypasses the table while preserving the profile's monochrome treatment. Unverified panel
Enable switches and unsupported nonzero local sliders/blend modes are reported. Lightroom
appearance remains approximate. Transparent inputs with applicable edits are
rejected because the current Lightcraft pipeline discards source alpha.

Unit and protocol tests cover orientation combinations, rotated crop corner round
trips, the subprocess contract, exposure, crop, short-edge sizing, upscale
clamping, native RAW dimensions, embedded grayscale/crop settings, external
precedence, AlreadyApplied handling, decoded-source white-balance targets, missing
runtime profile tables, Amount-0 monochrome treatment, output color space, skipped
packets and malformed XML/transparency errors. Fixtures are generated in the
tests; no private photographs or Lightroom exports are required. These checks
verify the integration contract, not Lightroom appearance parity.

`LIGHTCRAFT_PROFILE=1` enables source and pipeline timing diagnostics on stderr.
