#!/usr/bin/env python3
"""Render a quick DCP film-simulation preview from a RAF.

This is a validation renderer, not a complete replacement for Adobe Camera
Raw. rawpy/LibRaw performs decoding, white balance, demosaic, and the initial
conversion to linear ProPhoto RGB. LibRaw's scene-dependent auto-bright and
maximum adjustment are disabled. Deterministic pre-DCP exposure keeps the
exact RAF RawExposureBias correction separate from an empirical LibRaw-to-
Camera-Raw compatibility calibration. Embedded Fuji vignette, distortion, and
lateral-CA metadata supply the default linear lens stage. The extracted DCP
then supplies its Lightroom look table and profile tone curve.
"""

from __future__ import annotations

import argparse
from io import BytesIO
import json
import math
import os
from pathlib import Path
import re
import struct
import sys
import tempfile
from typing import Callable, Dict, Optional, Sequence, Tuple


def _configure_libraw_openmp(
    environ=None,
    loaded_modules=None,
) -> Dict[str, object]:
    """Force deterministic LibRaw threading before rawpy loads.

    LibRaw's OpenMP X-Trans path can produce different green-channel values
    when more than one OpenMP worker is active. Setting OMP_NUM_THREADS after
    rawpy has loaded LibRaw is too late, so retain whether configuration won
    that import-order race and reject an unsafe decode below.

    The injectable mappings keep this policy testable without importing
    rawpy or decoding a real RAW.
    """

    if environ is None:
        environ = os.environ
    if loaded_modules is None:
        loaded_modules = sys.modules

    rawpy_preloaded = "rawpy" in loaded_modules
    previous_threads = environ.get("OMP_NUM_THREADS")
    environ["OMP_NUM_THREADS"] = "1"
    return {
        "configured_before_rawpy_import": not rawpy_preloaded,
        "rawpy_preloaded": rawpy_preloaded,
        "previous_omp_num_threads": previous_threads,
    }


_LIBRAW_OPENMP_CONFIGURATION = _configure_libraw_openmp()

# The README invokes these tools as direct scripts. Make the repository
# package importable in that mode without requiring a caller-managed
# PYTHONPATH.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np
from PIL import Image, ImageDraw

from fuji_luts import (
    DEFAULT_DEVELOP_SETTINGS,
    DCPProfile,
    DevelopSettings,
    FujiLensGeometryModel,
    FujiLensWarp,
    FujiVignetteModel,
    RAFMetadata,
    RGBTable,
    apply_white_balance_forward_matrix_correction,
    apply_pv2012_exposure_controls,
    apply_pv2012_saturation_control,
    apply_pv2012_tone_controls,
    apply_pv2012_vibrance_control,
    measure_pv2012_image_statistics,
    apply_raf_active_crop,
    fuse_mraw_linear_prophoto,
    materialize_raf_multi_raw_frame,
    parse_raf_metadata,
    parse_raf_multi_raw,
    raw_exposure_correction_ev,
    read_fuji_lens_geometry_model,
    read_fuji_vignette_model,
    resolve_camera_white_balance,
    x_t5_white_balance_forward_matrix_correction,
)
from fuji_luts.lens import (
    ORIENTATION_NATIVE,
    ORIENTATION_ROTATE_180,
    ORIENTATION_ROTATE_90_CCW,
    ORIENTATION_ROTATE_90_CW,
    VIGNETTE_ORIENTATIONS,
)
from .libraw_full_sensor import (
    LIBRAW_HEADROOM_USER_SATURATION,
    _x_t5_headroom_normalization_from_levels,
    decode_x_t5_full_active,
    libraw_flip_orientation,
)


_D50_XYZ = np.array((0.9642, 1.0, 0.8249), dtype=np.float64)
_PROPHOTO_TO_PCS_SOURCE = np.array(
    (
        (0.7977, 0.1352, 0.0313),
        (0.2880, 0.7119, 0.0001),
        (0.0000, 0.0000, 0.8249),
    ),
    dtype=np.float64,
)
_SRGB_TO_PCS_SOURCE = np.array(
    (
        (0.4361, 0.3851, 0.1431),
        (0.2225, 0.7169, 0.0606),
        (0.0139, 0.0971, 0.7141),
    ),
    dtype=np.float64,
)

# Rounded tuning-split estimate from the Lightroom 9.1 X-T5 corpus.  This is
# deliberately not folded into CAMERA_RAW_FUJI_EXPOSURE_CONSTANT_EV: the
# latter is reconstructed Adobe metadata behavior, whereas this compensates
# for the independent LibRaw development path used by this renderer.
DEFAULT_LIBRAW_CAMERA_RAW_EXPOSURE_CALIBRATION_EV = -0.193
# Rounded tuning/validation result for the independent highlight stage.  The
# value is deliberately kept separate from exposure calibration: it shapes
# only the upper linear range after RAF and LibRaw compatibility exposure.
# DCP BaselineExposure and the public Develop Exposure control run later.
DEFAULT_HIGHLIGHT_SHOULDER_KNEE = 0.375
# Applying a shoulder to every image needlessly changes scenes whose developed
# source has essentially no out-of-domain highlight content.  This threshold
# was selected across 12 scenes and all 20 current X-T5 camera profiles.
DEFAULT_HIGHLIGHT_MINIMUM_OVERRANGE_PIXEL_FRACTION = 0.001
# Fujifilm three-frame M-RAW highlights need some of the shoulder to preserve
# the maximum-channel ratios.  A fully per-channel shoulder pulls bright cyan
# and orange pixels toward neutral white; a fully maximum-scaled shoulder is
# too saturated on small highlight regions.  These bounded coefficients were
# selected from the DXT50894 and DXT51946 Lightroom comparisons.  The amount
# grows only with actual out-of-domain content and never affects ordinary RAFs.
DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_BASE = 0.10
DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_SLOPE = 2.5
DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_MAXIMUM = 0.25
# The hue correction above restores channel separation, but Lightroom also
# retains noticeably more luminance separation inside M-RAW highlights.  A
# smooth endpoint-preserving curve supplies that missing local contrast: it
# leaves values at/below the lower bound and normalized white unchanged while
# bowing down only the interior of the highlight interval.  A strength below
# 1/pi keeps the scalar curve strictly monotonic.
DEFAULT_MRAW_HIGHLIGHT_CONTRAST_LOWER_BOUND = 0.35
DEFAULT_MRAW_HIGHLIGHT_CONTRAST_STRENGTH = 0.10
# Bright, saturated M-RAW scenes need more upper-range separation than the
# shared base curve.  In a severe scene, redistribute the curve strength by
# source saturation: relax it toward zero on neutral highlights and grow it to
# 0.25 on highly saturated highlights.  Low-headroom scenes retain the scalar
# 0.10 path exactly.
DEFAULT_MRAW_SEVERE_HEADROOM_START = 0.01
DEFAULT_MRAW_SEVERE_HEADROOM_END = 0.03
DEFAULT_MRAW_SATURATION_CONTRAST_START = 0.75
DEFAULT_MRAW_SATURATION_CONTRAST_END = 0.85
DEFAULT_MRAW_SATURATION_CONTRAST_MAXIMUM = 0.25
# Successfully fused M-RAW retains real values above the nominal sensor white.
# For chromatic profiles only, gradually favor maximum-channel hue retention
# and a slightly stronger contrast curve as that recovered headroom is
# approached.  Monochrome/filter profiles retain the shared input because
# their Lightroom residual is already substantially smaller.
DEFAULT_MRAW_FUSED_HEADROOM_START = 0.70
DEFAULT_MRAW_FUSED_HEADROOM_END = 1.00
DEFAULT_MRAW_FUSED_CONTRAST_MAXIMUM = 0.15
DEFAULT_MRAW_FUSED_REFINEMENT_FULL_WEIGHT_SPAN_EV = 0.05
DEFAULT_MRAW_FUSED_REFINEMENT_ZERO_WEIGHT_SPAN_EV = 0.25
MONOCHROME_PROFILE_SLUGS = frozenset(
    {
        "acros",
        "acros-g-filter",
        "acros-r-filter",
        "acros-ye-filter",
        "monochrome",
        "monochrome-g-filter",
        "monochrome-r-filter",
        "monochrome-ye-filter",
    }
)


def _smoothstep_range(
    values: np.ndarray | float,
    low: float,
    high: float,
) -> np.ndarray:
    """Return a bounded cubic transition from zero at ``low`` to one at ``high``."""

    position = np.clip(
        (np.asarray(values, dtype=np.float64) - low) / (high - low),
        0.0,
        1.0,
    )
    return position * position * (3.0 - 2.0 * position)


def _apply_mraw_highlight_contrast(
    linear_prophoto: np.ndarray,
    amount: float | np.ndarray,
    *,
    lower_bound: float = DEFAULT_MRAW_HIGHLIGHT_CONTRAST_LOWER_BOUND,
) -> np.ndarray:
    """Restore local M-RAW highlight separation without moving white."""

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("M-RAW highlight-contrast input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError(
            "M-RAW highlight-contrast input must use floating-point values"
        )
    if not np.all(np.isfinite(source)):
        raise ValueError("M-RAW highlight-contrast input must be finite")
    if isinstance(amount, bool):
        raise ValueError(
            "M-RAW highlight-contrast amount must be between 0 and 1/pi"
        )
    if (
        isinstance(lower_bound, bool)
        or not isinstance(lower_bound, (int, float))
        or not math.isfinite(float(lower_bound))
        or not 0.0 <= float(lower_bound) < 1.0
    ):
        raise ValueError(
            "M-RAW highlight-contrast lower bound must be in [0, 1)"
        )
    resolved_amount = np.asarray(amount, dtype=np.float64)
    if resolved_amount.ndim == 0:
        resolved_amount = np.broadcast_to(
            resolved_amount,
            source.shape[:2],
        )
    elif resolved_amount.shape != source.shape[:2]:
        raise ValueError(
            "M-RAW highlight-contrast amount map must match image dimensions"
        )
    if (
        not np.all(np.isfinite(resolved_amount))
        or np.any(resolved_amount < 0.0)
        or np.any(resolved_amount >= (1.0 / math.pi))
    ):
        raise ValueError(
            "M-RAW highlight-contrast amount must be between 0 and 1/pi"
        )
    resolved_lower_bound = float(lower_bound)
    maximum = np.max(source, axis=-1)
    position = np.clip(
        (maximum - resolved_lower_bound) / (1.0 - resolved_lower_bound),
        0.0,
        1.0,
    )
    reduction = (
        resolved_amount
        * (1.0 - resolved_lower_bound)
        * np.sin(np.pi * position) ** 2
    )
    mapped_maximum = maximum - reduction
    scale = np.ones_like(maximum)
    np.divide(
        mapped_maximum,
        maximum,
        out=scale,
        where=maximum > 1e-12,
    )
    return np.clip(
        source * scale[..., None],
        0.0,
        1.0,
    ).astype(source.dtype, copy=False)


def _parse_pixel_size(value: str) -> Tuple[int, int]:
    match = re.fullmatch(r"([1-9][0-9]*)[xX]([1-9][0-9]*)", value.strip())
    if match is None:
        raise argparse.ArgumentTypeError(
            "pixel size must use positive WIDTHxHEIGHT integers"
        )
    return int(match.group(1)), int(match.group(2))


def _require_deterministic_libraw(
    configuration=None,
    environ=None,
) -> None:
    if configuration is None:
        configuration = _LIBRAW_OPENMP_CONFIGURATION
    if environ is None:
        environ = os.environ

    if not configuration["configured_before_rawpy_import"]:
        raise RuntimeError(
            "rawpy was imported before the renderer could configure "
            "deterministic LibRaw threading. Restart the Python process and "
            "import scripts.render_preview (or run the renderer CLI) before "
            "importing rawpy."
        )
    if environ.get("OMP_NUM_THREADS") != "1":
        raise RuntimeError(
            "deterministic LibRaw decoding requires OMP_NUM_THREADS=1; "
            "the setting changed after renderer initialization"
        )


def _libraw_determinism_manifest() -> Dict[str, object]:
    _require_deterministic_libraw()
    return {
        "enabled": True,
        "environment": {"OMP_NUM_THREADS": "1"},
        "configured_before_rawpy_import": True,
    }


def _normalized_to_pcs(source: np.ndarray) -> np.ndarray:
    return (_D50_XYZ / source.sum(axis=1))[:, None] * source


def _linear_prophoto_to_srgb(rgb: np.ndarray) -> np.ndarray:
    prophoto_to_pcs = _normalized_to_pcs(_PROPHOTO_TO_PCS_SOURCE)
    srgb_to_pcs = _normalized_to_pcs(_SRGB_TO_PCS_SOURCE)
    matrix = np.linalg.inv(srgb_to_pcs) @ prophoto_to_pcs
    linear = np.clip(np.asarray(rgb, dtype=np.float64) @ matrix.T, 0.0, 1.0)
    encoded = np.where(
        linear <= 0.0031308,
        linear * 12.92,
        1.055 * np.power(linear, 1.0 / 2.4) - 0.055,
    )
    return np.clip(encoded, 0.0, 1.0)


def _srgb_to_linear_prophoto(srgb: np.ndarray) -> np.ndarray:
    """Convert normalized encoded sRGB to normalized linear ProPhoto RGB."""

    encoded = np.clip(np.asarray(srgb, dtype=np.float64), 0.0, 1.0)
    linear_srgb = np.where(
        encoded <= 0.04045,
        encoded / 12.92,
        np.power((encoded + 0.055) / 1.055, 2.4),
    )
    prophoto_to_pcs = _normalized_to_pcs(_PROPHOTO_TO_PCS_SOURCE)
    srgb_to_pcs = _normalized_to_pcs(_SRGB_TO_PCS_SOURCE)
    prophoto_to_srgb = np.linalg.inv(srgb_to_pcs) @ prophoto_to_pcs
    linear_prophoto = linear_srgb @ np.linalg.inv(prophoto_to_srgb).T
    return np.clip(linear_prophoto, 0.0, 1.0)


def _camera_iso_speed(path: Path) -> int | None:
    """Read ISO speed from the RAF's bounded embedded JPEG EXIF."""

    try:
        with Image.open(BytesIO(_extract_raf_jpeg(path))) as source:
            value = source.getexif().get_ifd(0x8769).get(0x8827)
    except (AttributeError, KeyError, OSError, SyntaxError, TypeError):
        return None
    if isinstance(value, (tuple, list)):
        value = value[0] if value else None
    try:
        iso_speed = int(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return iso_speed if iso_speed > 0 else None


def _default_chroma_denoise_strength(iso_speed: int | None) -> float:
    """Return the preview NLM strength for Lightroom's default color NR.

    Camera Raw's default Color Noise Reduction amount is 25, but its effective
    threshold is driven by the camera noise model. This independent preview
    approximation uses the RAF's ISO as a conservative proxy. The categories
    were selected on tuning RAWs and checked against held-out ISO 125, 500,
    6400, and 12800 captures.
    """

    if iso_speed is None or iso_speed <= 200:
        return 0.0
    if iso_speed <= 800:
        return 3.0
    if iso_speed <= 3200:
        return 5.0
    return 6.0


def _apply_default_color_noise_reduction(
    linear_prophoto: np.ndarray,
    iso_speed: int | None,
) -> np.ndarray:
    """Approximate Lightroom's default color NR before profile rendering.

    OpenCV's independent non-local-means implementation is applied once to
    encoded sRGB chroma, with luminance strength zero. The result is converted
    back to linear ProPhoto before the DCP LookTable and tone curve.
    """

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("color-noise input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError("color-noise input must use floating-point values")

    strength = _default_chroma_denoise_strength(iso_speed)
    if strength == 0.0:
        return source
    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(
            "OpenCV is required for Lightroom-default color noise "
            "reduction: python -m pip install opencv-python"
        ) from exc

    encoded = _linear_prophoto_to_srgb(source)
    rgb8 = np.rint(encoded * 255.0).astype(np.uint8)
    bgr8 = cv2.cvtColor(rgb8, cv2.COLOR_RGB2BGR)
    filtered_bgr8 = cv2.fastNlMeansDenoisingColored(
        bgr8,
        None,
        0.0,
        strength,
        7,
        21,
    )
    filtered_rgb = (
        cv2.cvtColor(filtered_bgr8, cv2.COLOR_BGR2RGB).astype(np.float64)
        / 255.0
    )
    result = _srgb_to_linear_prophoto(filtered_rgb)
    return result.astype(source.dtype, copy=False)


def _default_color_noise_manifest(
    iso_speed: int | None,
    enabled: bool,
) -> Dict[str, object]:
    strength = (
        _default_chroma_denoise_strength(iso_speed) if enabled else 0.0
    )
    return {
        "enabled": bool(enabled and strength > 0.0),
        "requested": bool(enabled),
        "lightroom_default_amount": 25,
        "camera_iso_speed": iso_speed,
        "iso_source": "raf_embedded_jpeg_exif",
        "algorithm": "opencv_fast_nl_means_colored",
        "luminance_strength": 0.0,
        "chroma_strength": strength,
        "template_window_size": 7,
        "search_window_size": 21,
        "stage": "after_profile_exposure_before_dcp_look_table",
        "status": "independent_preview_approximation",
    }


def _apply_default_highlight_reconstruction(
    linear_prophoto: np.ndarray,
    enabled: bool = True,
    *,
    knee: float = DEFAULT_HIGHLIGHT_SHOULDER_KNEE,
    minimum_overrange_pixel_fraction: float = (
        DEFAULT_HIGHLIGHT_MINIMUM_OVERRANGE_PIXEL_FRACTION
    ),
    apply_mraw_highlight_treatment: bool = False,
    apply_fused_chromatic_refinement: bool = False,
    fused_chromatic_refinement_weight: float = 1.0,
    mraw_severe_headroom_fraction: Optional[float] = None,
) -> np.ndarray:
    """Bound profile-exposed highlights with a smooth rational shoulder.

    LibRaw's normalized output can exceed the eventual DCP input domain after
    RAF and compatibility exposure correction.  A hard clamp destroys that
    headroom.  This independent compatibility stage instead uses a monotonic,
    unit-slope rational shoulder above ``knee`` and retains the historical
    hard-clamp path as an explicit diagnostic opt-out.  Validated M-RAW inputs
    add a later hue-preserving upper-range contrast treatment before PV2012 and
    DCP BaselineExposure.
    """

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("highlight-reconstruction input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError(
            "highlight-reconstruction input must use floating-point values"
        )
    if not np.all(np.isfinite(source)):
        raise ValueError("highlight-reconstruction input must be finite")
    if not isinstance(enabled, bool):
        raise TypeError("highlight-reconstruction enable must be boolean")
    decision = _default_highlight_reconstruction_decision(
        source,
        enabled,
        knee=knee,
        minimum_overrange_pixel_fraction=(
            minimum_overrange_pixel_fraction
        ),
        apply_mraw_highlight_treatment=apply_mraw_highlight_treatment,
        apply_fused_chromatic_refinement=(
            apply_fused_chromatic_refinement
        ),
        fused_chromatic_refinement_weight=(
            fused_chromatic_refinement_weight
        ),
        mraw_severe_headroom_fraction=mraw_severe_headroom_fraction,
    )
    fused_refinement_enabled = bool(
        decision["fused_chromatic_refinement_enabled"]
    )

    if not decision["enabled"]:
        return np.clip(source, 0.0, 1.0)

    resolved_knee = float(decision["knee_linear_prophoto"])
    headroom = 1.0 - resolved_knee
    delta = np.maximum(source - resolved_knee, 0.0)
    shoulder = (
        resolved_knee
        + headroom * delta / (delta + headroom)
    )
    per_channel = np.where(source <= resolved_knee, source, shoulder)
    base_hue_preservation_amount = float(
        decision["hue_preservation_amount"]
    )
    source_maximum = np.max(source, axis=-1)
    fused_headroom_gate = np.zeros_like(source_maximum, dtype=np.float64)
    if fused_refinement_enabled:
        fused_headroom_gate = _smoothstep_range(
            source_maximum,
            DEFAULT_MRAW_FUSED_HEADROOM_START,
            DEFAULT_MRAW_FUSED_HEADROOM_END,
        ) * float(decision["fused_chromatic_refinement_weight"])
    if base_hue_preservation_amount == 0.0:
        result = per_channel
    else:
        maximum = source_maximum
        maximum_delta = np.maximum(maximum - resolved_knee, 0.0)
        mapped_maximum = np.where(
            maximum <= resolved_knee,
            maximum,
            resolved_knee
            + headroom
            * maximum_delta
            / (maximum_delta + headroom),
        )
        maximum_scale = np.ones_like(maximum)
        np.divide(
            mapped_maximum,
            maximum,
            out=maximum_scale,
            where=maximum > 1e-12,
        )
        hue_preserving = np.clip(
            source * maximum_scale[..., None],
            0.0,
            1.0,
        )
        hue_preservation_amount = (
            base_hue_preservation_amount
            + fused_headroom_gate
            * (
                DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_MAXIMUM
                - base_hue_preservation_amount
            )
        )
        result = (
            per_channel
            + hue_preservation_amount[..., None]
            * (hue_preserving - per_channel)
        )
    base_highlight_contrast_amount = float(
        decision["highlight_contrast_amount"]
    )
    if base_highlight_contrast_amount > 0.0:
        source_minimum = np.min(source, axis=-1)
        source_saturation = np.zeros_like(source_maximum, dtype=np.float64)
        np.divide(
            source_maximum - source_minimum,
            source_maximum,
            out=source_saturation,
            where=source_maximum > 1e-12,
        )
        saturation_gate = _smoothstep_range(
            np.clip(source_saturation, 0.0, 1.0),
            DEFAULT_MRAW_SATURATION_CONTRAST_START,
            DEFAULT_MRAW_SATURATION_CONTRAST_END,
        )
        scene_gate = float(
            _smoothstep_range(
                float(decision["source_severe_headroom_pixel_fraction"]),
                DEFAULT_MRAW_SEVERE_HEADROOM_START,
                DEFAULT_MRAW_SEVERE_HEADROOM_END,
            )
        )
        if scene_gate == 0.0 and not fused_refinement_enabled:
            highlight_contrast_amount: float | np.ndarray = (
                base_highlight_contrast_amount
            )
        else:
            saturation_adaptive_amount = (
                (1.0 - scene_gate) * base_highlight_contrast_amount
                + scene_gate
                * DEFAULT_MRAW_SATURATION_CONTRAST_MAXIMUM
                * saturation_gate
            )
            fused_adaptive_amount = (
                base_highlight_contrast_amount
                + (1.0 - scene_gate)
                * fused_headroom_gate
                * (
                    DEFAULT_MRAW_FUSED_CONTRAST_MAXIMUM
                    - base_highlight_contrast_amount
                )
            )
            highlight_contrast_amount = np.maximum(
                saturation_adaptive_amount,
                fused_adaptive_amount
                if fused_refinement_enabled
                else saturation_adaptive_amount,
            )
        result = _apply_mraw_highlight_contrast(
            result,
            highlight_contrast_amount,
        )
    return np.clip(result, 0.0, 1.0).astype(source.dtype, copy=False)


def _default_highlight_reconstruction_decision(
    linear_prophoto: np.ndarray,
    requested: bool,
    *,
    knee: float = DEFAULT_HIGHLIGHT_SHOULDER_KNEE,
    minimum_overrange_pixel_fraction: float = (
        DEFAULT_HIGHLIGHT_MINIMUM_OVERRANGE_PIXEL_FRACTION
    ),
    apply_mraw_highlight_treatment: bool = False,
    apply_fused_chromatic_refinement: bool = False,
    fused_chromatic_refinement_weight: float = 1.0,
    mraw_severe_headroom_fraction: Optional[float] = None,
) -> Dict[str, object]:
    """Choose the shoulder only for images with material source headroom."""

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("highlight-reconstruction input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError(
            "highlight-reconstruction input must use floating-point values"
        )
    if not np.all(np.isfinite(source)):
        raise ValueError("highlight-reconstruction input must be finite")
    if not isinstance(requested, bool):
        raise TypeError("highlight-reconstruction enable must be boolean")
    if not isinstance(apply_mraw_highlight_treatment, bool):
        raise TypeError("M-RAW highlight treatment enable must be boolean")
    if not isinstance(apply_fused_chromatic_refinement, bool):
        raise TypeError("fused chromatic refinement enable must be boolean")
    if apply_fused_chromatic_refinement and not apply_mraw_highlight_treatment:
        raise ValueError(
            "fused chromatic refinement requires M-RAW highlight treatment"
        )
    if (
        isinstance(fused_chromatic_refinement_weight, bool)
        or not isinstance(fused_chromatic_refinement_weight, (int, float))
        or not math.isfinite(float(fused_chromatic_refinement_weight))
        or not 0.0 <= float(fused_chromatic_refinement_weight) <= 1.0
    ):
        raise ValueError(
            "fused chromatic refinement weight must be between 0 and 1"
        )
    resolved_fused_refinement_weight = (
        float(fused_chromatic_refinement_weight)
        if apply_fused_chromatic_refinement
        else 0.0
    )
    if mraw_severe_headroom_fraction is None:
        resolved_severe_headroom_fraction = 0.0
    elif (
        isinstance(mraw_severe_headroom_fraction, bool)
        or not isinstance(mraw_severe_headroom_fraction, (int, float))
        or not math.isfinite(float(mraw_severe_headroom_fraction))
        or not 0.0 <= float(mraw_severe_headroom_fraction) <= 1.0
    ):
        raise ValueError(
            "M-RAW severe-headroom fraction must be between 0 and 1"
        )
    else:
        resolved_severe_headroom_fraction = float(
            mraw_severe_headroom_fraction
        )
    if (
        isinstance(knee, bool)
        or not isinstance(knee, (int, float))
        or not math.isfinite(float(knee))
        or not 0.0 < float(knee) < 1.0
    ):
        raise ValueError("highlight-reconstruction knee must be between 0 and 1")
    if (
        isinstance(minimum_overrange_pixel_fraction, bool)
        or not isinstance(
            minimum_overrange_pixel_fraction,
            (int, float),
        )
        or not math.isfinite(float(minimum_overrange_pixel_fraction))
        or not 0.0 <= float(minimum_overrange_pixel_fraction) <= 1.0
    ):
        raise ValueError(
            "highlight-reconstruction overrange threshold must be between "
            "0 and 1"
        )

    overrange_fraction = float(
        np.mean(np.any(source > 1.0, axis=-1), dtype=np.float64)
    )
    severe_headroom_scene_weight = float(
        _smoothstep_range(
            resolved_severe_headroom_fraction,
            DEFAULT_MRAW_SEVERE_HEADROOM_START,
            DEFAULT_MRAW_SEVERE_HEADROOM_END,
        )
    )
    threshold = float(minimum_overrange_pixel_fraction)
    applied = bool(requested and overrange_fraction >= threshold)
    fused_refinement_enabled = bool(
        applied
        and apply_fused_chromatic_refinement
        and resolved_fused_refinement_weight > 0.0
    )
    hue_preservation_amount = (
        min(
            DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_MAXIMUM,
            DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_BASE
            + DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_SLOPE
            * overrange_fraction,
        )
        if applied and apply_mraw_highlight_treatment
        else 0.0
    )
    highlight_contrast_amount = (
        DEFAULT_MRAW_HIGHLIGHT_CONTRAST_STRENGTH
        if applied and apply_mraw_highlight_treatment
        else 0.0
    )
    if not requested:
        reason = "explicit_diagnostic_opt_out"
    elif applied:
        reason = "source_overrange_fraction_meets_threshold"
    else:
        reason = "source_overrange_fraction_below_threshold"
    return {
        "requested": requested,
        "enabled": applied,
        "decision_reason": reason,
        "source_any_channel_overrange_pixel_fraction": overrange_fraction,
        "source_severe_headroom_pixel_fraction": (
            resolved_severe_headroom_fraction
        ),
        "severe_headroom_scene_weight": severe_headroom_scene_weight,
        "minimum_overrange_pixel_fraction": threshold,
        "threshold_comparison": (
            "source_any_channel_overrange_pixel_fraction >= "
            "minimum_overrange_pixel_fraction"
        ),
        "method": (
            (
                "adaptive_partial_hue_preserving_rational_shoulder_with_"
                "endpoint_preserving_highlight_contrast"
                if hue_preservation_amount > 0.0
                else "per_channel_rational_shoulder"
            )
            if applied
            else "hard_clip"
        ),
        "knee_linear_prophoto": float(knee) if applied else None,
        "mraw_highlight_treatment_requested": (
            apply_mraw_highlight_treatment
        ),
        "fused_chromatic_refinement_requested": (
            apply_fused_chromatic_refinement
        ),
        "fused_chromatic_refinement_enabled": fused_refinement_enabled,
        "fused_chromatic_refinement_weight": (
            resolved_fused_refinement_weight
        ),
        "hue_preservation_amount": hue_preservation_amount,
        "hue_preservation_amount_range": (
            [
                hue_preservation_amount,
                hue_preservation_amount
                + resolved_fused_refinement_weight
                * (
                    DEFAULT_MRAW_HIGHLIGHT_HUE_PRESERVATION_MAXIMUM
                    - hue_preservation_amount
                ),
            ]
            if fused_refinement_enabled
            else [hue_preservation_amount, hue_preservation_amount]
        ),
        "highlight_contrast_amount": highlight_contrast_amount,
        "highlight_contrast_amount_range": (
            [
                (
                    highlight_contrast_amount
                    if fused_refinement_enabled
                    else (1.0 - severe_headroom_scene_weight)
                    * highlight_contrast_amount
                ),
                max(
                    (1.0 - severe_headroom_scene_weight)
                    * highlight_contrast_amount
                    + severe_headroom_scene_weight
                    * DEFAULT_MRAW_SATURATION_CONTRAST_MAXIMUM,
                    (
                        highlight_contrast_amount
                        + (1.0 - severe_headroom_scene_weight)
                        * resolved_fused_refinement_weight
                        * (
                            DEFAULT_MRAW_FUSED_CONTRAST_MAXIMUM
                            - highlight_contrast_amount
                        )
                    )
                    if fused_refinement_enabled
                    else 0.0,
                ),
            ]
            if highlight_contrast_amount > 0.0
            else [0.0, 0.0]
        ),
        "highlight_contrast_lower_bound": (
            DEFAULT_MRAW_HIGHLIGHT_CONTRAST_LOWER_BOUND
            if highlight_contrast_amount > 0.0
            else None
        ),
    }


def _default_highlight_reconstruction_manifest(
    linear_prophoto: np.ndarray,
    requested: bool,
    *,
    knee: float = DEFAULT_HIGHLIGHT_SHOULDER_KNEE,
    minimum_overrange_pixel_fraction: float = (
        DEFAULT_HIGHLIGHT_MINIMUM_OVERRANGE_PIXEL_FRACTION
    ),
    apply_mraw_highlight_treatment: bool = False,
    apply_fused_chromatic_refinement: bool = False,
    fused_chromatic_refinement_weight: float = 1.0,
    mraw_severe_headroom_fraction: Optional[float] = None,
) -> Dict[str, object]:
    """Describe the independently calibrated, content-gated highlight stage."""

    decision = _default_highlight_reconstruction_decision(
        linear_prophoto,
        requested,
        knee=knee,
        minimum_overrange_pixel_fraction=(
            minimum_overrange_pixel_fraction
        ),
        apply_mraw_highlight_treatment=apply_mraw_highlight_treatment,
        apply_fused_chromatic_refinement=(
            apply_fused_chromatic_refinement
        ),
        fused_chromatic_refinement_weight=(
            fused_chromatic_refinement_weight
        ),
        mraw_severe_headroom_fraction=mraw_severe_headroom_fraction,
    )

    return {
        **decision,
        "disabled_behavior": "hard_clip_to_dcp_domain_0_to_1",
        "formula_above_knee": (
            "k + (1-k)*(x-k)/(x-k+1-k)"
            if decision["enabled"]
            else None
        ),
        "hue_preservation": {
            "method": "maximum_channel_scale_blended_with_per_channel_result",
            "amount": decision["hue_preservation_amount"],
            "amount_formula": (
                "min(0.25, 0.10 + 2.5 * source_overrange_fraction)"
                if decision["mraw_highlight_treatment_requested"]
                else None
            ),
            "scope": "validated_three_frame_fujifilm_m_raw_only",
            "fused_chromatic_refinement": {
                "requested": decision[
                    "fused_chromatic_refinement_requested"
                ],
                "enabled": decision[
                    "fused_chromatic_refinement_enabled"
                ],
                "fusion_quality_weight": decision[
                    "fused_chromatic_refinement_weight"
                ],
                "source_maximum_smoothstep": [
                    DEFAULT_MRAW_FUSED_HEADROOM_START,
                    DEFAULT_MRAW_FUSED_HEADROOM_END,
                ],
                "amount_range": decision[
                    "hue_preservation_amount_range"
                ],
            },
        },
        "highlight_contrast": {
            "method": "maximum_channel_endpoint_preserving_sine_squared",
            "amount": decision["highlight_contrast_amount"],
            "lower_bound": decision["highlight_contrast_lower_bound"],
            "formula": (
                "m - amount*(1-low)*sin(pi*(m-low)/(1-low))^2"
                if decision["highlight_contrast_amount"] > 0.0
                else None
            ),
            "scope": "validated_three_frame_fujifilm_m_raw_only",
            "amount_range": decision[
                "highlight_contrast_amount_range"
            ],
            "saturation_refinement": {
                "primary_severe_headroom_fraction_smoothstep": [
                    DEFAULT_MRAW_SEVERE_HEADROOM_START,
                    DEFAULT_MRAW_SEVERE_HEADROOM_END,
                ],
                "source_saturation_smoothstep": [
                    DEFAULT_MRAW_SATURATION_CONTRAST_START,
                    DEFAULT_MRAW_SATURATION_CONTRAST_END,
                ],
                "maximum_amount": (
                    DEFAULT_MRAW_SATURATION_CONTRAST_MAXIMUM
                ),
                "amount_formula": (
                    "(1-scene_weight)*0.10 + scene_weight*0.25*"
                    "smoothstep(clipped_source_saturation,0.75,0.85)"
                ),
                "fully_severe_scene_neutral_amount": (
                    DEFAULT_MRAW_HIGHLIGHT_CONTRAST_STRENGTH
                    if decision["fused_chromatic_refinement_enabled"]
                    else 0.0
                ),
            },
            "fused_chromatic_refinement": {
                "requested": decision[
                    "fused_chromatic_refinement_requested"
                ],
                "enabled": decision[
                    "fused_chromatic_refinement_enabled"
                ],
                "fusion_quality_weight": decision[
                    "fused_chromatic_refinement_weight"
                ],
                "source_maximum_smoothstep": [
                    DEFAULT_MRAW_FUSED_HEADROOM_START,
                    DEFAULT_MRAW_FUSED_HEADROOM_END,
                ],
                "maximum_amount": DEFAULT_MRAW_FUSED_CONTRAST_MAXIMUM,
                "combined_amount_formula": (
                    "max(saturation_amount, 0.10 + "
                    "(1-scene_weight)*fusion_quality_weight*"
                    "smoothstep(source_maximum,0.70,1.00)*(0.15-0.10))"
                ),
                "fusion_quality_weight_formula": {
                    "metric": "maximum_central_80_percent_span_ev",
                    "full_weight_at_or_below": (
                        DEFAULT_MRAW_FUSED_REFINEMENT_FULL_WEIGHT_SPAN_EV
                    ),
                    "zero_weight_at_or_above": (
                        DEFAULT_MRAW_FUSED_REFINEMENT_ZERO_WEIGHT_SPAN_EV
                    ),
                    "mapping": "1 - smoothstep(span, full, zero)",
                },
            },
        },
        "properties": (
            (
                [
                    "continuous",
                    "monotonic",
                    "bounded_to_dcp_domain",
                    "highlight_contrast_preserves_rgb_ray_hue",
                    "highlight_contrast_fixed_at_lower_bound_and_white",
                ]
                if decision["highlight_contrast_amount"] > 0.0
                else [
                    "continuous_unit_slope_at_knee",
                    "monotonic",
                    "bounded_to_dcp_domain",
                ]
            )
            if decision["enabled"]
            else ["hard_clip_to_dcp_domain"]
        ),
        "stage": (
            "after_raf_compatibility_and_user_base_exposure_before_default_"
            "color_noise_reduction_pv2012_controls_dcp_baseline_exposure_"
            "and_dcp_creative_stages"
        ),
        "provenance": {
            "camera": "Fujifilm X-T5",
            "reference_renderer": "Adobe Lightroom Desktop 9.1 / Camera Raw",
            "selection": (
                "shoulder knee and content gate selected from exact-size "
                "12-scene validation across all 20 current camera profiles; "
                "M-RAW hue and contrast terms selected from DXT50894 and "
                "DXT51946 all-profile comparisons"
            ),
            "status": "independent_empirical_compatibility_approximation",
            "not_an_adobe_formula": True,
            "calls_adobe_runtime": False,
        },
    }


def _resolve_pre_dcp_exposure(
    raw_exposure_bias_ev: Optional[float],
    raw_exposure_correction_ev_value: float,
    user_base_exposure_ev: float,
    apply_default_exposure_calibration: bool,
) -> Tuple[float, Dict[str, object]]:
    """Resolve distinct metadata, compatibility, and user exposure stages."""

    if not isinstance(apply_default_exposure_calibration, bool):
        raise TypeError("default exposure calibration enable must be boolean")
    raw_correction = float(raw_exposure_correction_ev_value)
    user_adjustment = float(user_base_exposure_ev)
    if not math.isfinite(raw_correction):
        raise ValueError("RAF exposure correction must be finite")
    if not math.isfinite(user_adjustment):
        raise ValueError("user base exposure adjustment must be finite")

    calibration_ev = (
        DEFAULT_LIBRAW_CAMERA_RAW_EXPOSURE_CALIBRATION_EV
        if apply_default_exposure_calibration
        else 0.0
    )
    total_ev = raw_correction + calibration_ev + user_adjustment
    calibration_manifest: Dict[str, object] = {
        "requested": apply_default_exposure_calibration,
        "enabled": apply_default_exposure_calibration,
        "configured_ev": (
            DEFAULT_LIBRAW_CAMERA_RAW_EXPOSURE_CALIBRATION_EV
        ),
        "applied_ev": calibration_ev,
        "method": (
            "fixed_empirical_libraw_to_camera_raw_compatibility_offset"
        ),
        "stage": (
            "after_default_lens_corrections_before_dcp_profile_baseline_"
            "exposure_and_default_color_noise_reduction"
        ),
        "provenance": {
            "camera": "Fujifilm X-T5",
            "reference_renderer": "Adobe Lightroom Desktop 9.1 / Camera Raw",
            "selection": (
                "fixed from default-render exposure residuals on tuning "
                "scenes only"
            ),
            "validation": (
                "checked on held-out X-T5 scenes across the 20-profile "
                "Lightroom comparison set"
            ),
            "status": "independent_empirical_compatibility_calibration",
            "not_an_adobe_formula": True,
            "calls_adobe_runtime": False,
        },
    }
    exposure_manifest: Dict[str, object] = {
        "stage": "decoded_linear_prophoto_before_dcp_creative_stages",
        "order": [
            "raf_metadata_correction",
            "libraw_to_camera_raw_compatibility_calibration",
            "user_diagnostic_adjustment",
            "dcp_profile_baseline_exposure",
        ],
        "raf_metadata_correction": {
            "raw_exposure_bias_ev": raw_exposure_bias_ev,
            "applied_ev": raw_correction,
            "method": "camera_raw_fuji_metadata_formula",
            "formula_when_tag_0x9650_is_present": (
                "-0.5 EV - RawExposureBias"
            ),
            "missing_tag_behavior": "0 EV",
            "status": "exact_reconstructed_camera_raw_metadata_behavior",
            "changed_by_compatibility_calibration": False,
        },
        "libraw_to_camera_raw_compatibility_calibration": (
            calibration_manifest
        ),
        "user_diagnostic_adjustment": {
            "applied_ev": user_adjustment,
            "source": "render API base_exposure_ev / --base-exposure-ev",
            "default_ev": 0.0,
            "semantics": (
                "additional adjustment after the default compatibility "
                "calibration"
            ),
        },
        "total_ev_before_dcp_profile_baseline": total_ev,
        "dcp_profile_baseline_exposure": (
            "added separately from each selected profile"
        ),
    }
    return total_ev, exposure_manifest


def _read_default_lens_models(
    raw_path: Path,
) -> Tuple[
    Optional[FujiLensGeometryModel],
    Optional[FujiVignetteModel],
]:
    """Parse each independent Fuji embedded-lens model exactly once."""

    return (
        read_fuji_lens_geometry_model(raw_path),
        read_fuji_vignette_model(raw_path),
    )


def _rotate_native_to_orientation(
    native: np.ndarray,
    orientation: str,
) -> np.ndarray:
    if orientation == ORIENTATION_NATIVE:
        return native
    if orientation == ORIENTATION_ROTATE_90_CW:
        return np.rot90(native, k=3)
    if orientation == ORIENTATION_ROTATE_180:
        return np.rot90(native, k=2)
    if orientation == ORIENTATION_ROTATE_90_CCW:
        return np.rot90(native, k=1)
    choices = ", ".join(VIGNETTE_ORIENTATIONS)
    raise ValueError(
        f"unsupported decoded orientation {orientation!r}; "
        f"expected one of {choices}"
    )


def _rotate_orientation_to_native(
    oriented: np.ndarray,
    orientation: str,
) -> np.ndarray:
    if orientation == ORIENTATION_NATIVE:
        return oriented
    if orientation == ORIENTATION_ROTATE_90_CW:
        return np.rot90(oriented, k=1)
    if orientation == ORIENTATION_ROTATE_180:
        return np.rot90(oriented, k=2)
    if orientation == ORIENTATION_ROTATE_90_CCW:
        return np.rot90(oriented, k=3)
    choices = ", ".join(VIGNETTE_ORIENTATIONS)
    raise ValueError(
        f"unsupported decoded orientation {orientation!r}; "
        f"expected one of {choices}"
    )


def _resolved_decode_orientation(
    active_crop: Dict[str, object],
) -> str:
    """Resolve LibRaw's already-applied unmirrored output orientation."""

    value = active_crop.get("orientation")
    if value in VIGNETTE_ORIENTATIONS:
        return str(value)
    if value == "metadata_native":
        return ORIENTATION_NATIVE
    if value == "rotated_90_or_270":
        raise RuntimeError(
            "legacy LibRaw crop metadata identifies a 90-degree rotation but "
            "not its direction; an exact output orientation is required for "
            "default lens corrections"
        )
    if value is None:
        return ORIENTATION_NATIVE
    raise RuntimeError(f"unsupported LibRaw output orientation {value!r}")


def _fuji_preview_remap_grid(
    warp: FujiLensWarp,
    output_shape: Tuple[int, int],
    channel: int,
    *,
    row_start: int = 0,
    row_stop: Optional[int] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """Project one preview row range through a full-active Fuji warp."""

    output_height, output_width = output_shape
    if row_stop is None:
        row_stop = output_height
    if (
        output_height <= 0
        or output_width <= 0
        or row_start < 0
        or row_stop <= row_start
        or row_stop > output_height
    ):
        raise ValueError("invalid Fuji preview remap dimensions or row range")

    top, left, bottom, right = warp.default_crop_area
    step_x = (right - left) / output_width
    step_y = (bottom - top) / output_height
    full_x = (
        left
        + (np.arange(output_width, dtype=np.float64) + 0.5) * step_x
        - 0.5
    )
    full_y = (
        top
        + (np.arange(row_start, row_stop, dtype=np.float64) + 0.5) * step_y
        - 0.5
    )
    source_full_x, source_full_y = warp.remap_coordinates(
        full_x[None, :],
        full_y[:, None],
        channel,
    )
    map_x = (
        (source_full_x - left + 0.5) / step_x - 0.5
    ).astype(np.float32)
    map_y = (
        (source_full_y - top + 0.5) / step_y - 0.5
    ).astype(np.float32)
    return map_x, map_y


def _apply_fuji_radial_remap(
    native: np.ndarray,
    geometry_model: FujiLensGeometryModel,
    *,
    chunk_rows: int = 256,
) -> Tuple[np.ndarray, Dict[str, object]]:
    """Apply Fuji's per-channel corrected-output to source-coordinate warp.

    The polynomial coefficients and explicit geometry scale are resolved on
    the full RAF active rectangle. Preview coordinates are projected into
    that rectangle before lookup, so half-size and full-resolution decodes
    retain exactly the same normalized lens model.
    """

    source = np.asarray(native)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("Fuji radial-remap input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError("Fuji radial-remap input must use floating-point values")
    if (
        isinstance(chunk_rows, bool)
        or not isinstance(chunk_rows, int)
        or chunk_rows <= 0
    ):
        raise ValueError("Fuji radial-remap chunk size must be a positive integer")

    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(
            "OpenCV is required for default Fuji lens corrections: "
            "python -m pip install opencv-python"
        ) from exc

    warp = geometry_model.build_warp()
    top, left, bottom, right = warp.default_crop_area
    full_width = right - left
    full_height = bottom - top
    output_height, output_width = source.shape[:2]

    polynomials = (
        warp.red_polynomial,
        warp.green_polynomial,
        warp.blue_polynomial,
    )
    if all(polynomial.is_identity for polynomial in polynomials):
        return source, {
            "enabled": False,
            "reason": "all_channel_mappings_are_identity",
            "library": "opencv",
            "interpolation": "INTER_CUBIC",
            "border_mode": "BORDER_REPLICATE",
            "resampling_status": (
                "independent_renderer_choice_not_recovered_from_adobe"
            ),
            "active_buffer_boundary_note": (
                "per-channel CA can sample beyond the active image; this "
                "renderer replicates the active edge because Adobe's sensor-"
                "halo and boundary policy are not yet recovered"
            ),
            "chunk_rows": chunk_rows,
            "preview_native_size": [output_width, output_height],
            "full_active_size": [full_width, full_height],
            "full_active_crop_half_open_top_left_bottom_right": [
                top,
                left,
                bottom,
                right,
            ],
            "coordinate_projection": (
                "preview pixel center -> full active pixel center -> "
                "Fuji output-to-source warp -> preview source coordinate"
            ),
        }

    result = np.empty_like(source)
    for channel, polynomial in enumerate(polynomials):
        if polynomial.is_identity:
            result[..., channel] = source[..., channel]
            continue
        for row_start in range(0, output_height, chunk_rows):
            row_stop = min(output_height, row_start + chunk_rows)
            map_x, map_y = _fuji_preview_remap_grid(
                warp,
                (output_height, output_width),
                channel,
                row_start=row_start,
                row_stop=row_stop,
            )
            result[row_start:row_stop, :, channel] = cv2.remap(
                source[..., channel],
                map_x,
                map_y,
                interpolation=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )

    return result, {
        "enabled": True,
        "library": "opencv",
        "interpolation": "INTER_CUBIC",
        "border_mode": "BORDER_REPLICATE",
        "resampling_status": (
            "independent_renderer_choice_not_recovered_from_adobe"
        ),
        "active_buffer_boundary_note": (
            "per-channel CA can sample beyond the active image; this renderer "
            "replicates the active edge because Adobe's sensor-halo and "
            "boundary policy are not yet recovered"
        ),
        "chunk_rows": chunk_rows,
        "preview_native_size": [output_width, output_height],
        "full_active_size": [full_width, full_height],
        "full_active_crop_half_open_top_left_bottom_right": [
            top,
            left,
            bottom,
            right,
        ],
        "coordinate_projection": (
            "preview pixel center -> full active pixel center -> "
            "Fuji output-to-source warp -> preview source coordinate"
        ),
        "mapping_direction": "corrected_output_to_distorted_source",
        "channel_order": ["red", "green", "blue"],
        "applied_components": [
            component
            for component, applied in (
                (
                    "geometric_distortion",
                    not warp.distortion_polynomial.is_identity,
                ),
                (
                    "lateral_chromatic_aberration",
                    (
                        warp.red_polynomial.coefficients
                        != warp.green_polynomial.coefficients
                        or warp.blue_polynomial.coefficients
                        != warp.green_polynomial.coefficients
                    ),
                ),
            )
            if applied
        ],
    }


def _apply_default_lens_corrections(
    linear_prophoto: np.ndarray,
    *,
    decoded_orientation: str,
    geometry_model: Optional[FujiLensGeometryModel],
    vignette_model: Optional[FujiVignetteModel],
    enabled: bool,
) -> Tuple[np.ndarray, Dict[str, object]]:
    """Apply Lightroom-default embedded Fuji corrections in linear light."""

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("default-lens-correction input must be an RGB image")
    if source.dtype.kind != "f":
        raise TypeError(
            "default-lens-correction input must use floating-point values"
        )
    if decoded_orientation not in VIGNETTE_ORIENTATIONS:
        choices = ", ".join(VIGNETTE_ORIENTATIONS)
        raise ValueError(
            f"unsupported decoded orientation {decoded_orientation!r}; "
            f"expected one of {choices}"
        )

    geometry_metadata = (
        None
        if geometry_model is None
        else geometry_model.manifest_metadata()
    )
    vignette_metadata = (
        None
        if vignette_model is None
        else vignette_model.manifest_metadata()
    )
    base_manifest: Dict[str, object] = {
        "requested": bool(enabled),
        "enabled": False,
        "stage": "decoded_linear_prophoto_before_profile_exposure",
        "before_preview_downsampling": True,
        "order": [
            "restore_native_orientation",
            "vignette_gain_at_distorted_source_coordinate",
            "per_channel_corrected_output_to_source_radial_remap",
            "restore_libraw_output_orientation",
        ],
        "decoded_orientation": decoded_orientation,
        "processing_orientation": ORIENTATION_NATIVE,
        "geometry": geometry_metadata,
        "vignette": vignette_metadata,
        "radial_remap": {
            "enabled": False,
            "reason": "not_requested_or_metadata_absent",
        },
        "independent_reimplementation": True,
        "calls_adobe_runtime": False,
    }
    if not enabled:
        base_manifest["reason"] = "disabled_by_diagnostic_option"
        return source, base_manifest
    if geometry_model is None and vignette_model is None:
        base_manifest["reason"] = "fuji_embedded_lens_metadata_absent"
        return source, base_manifest

    native = np.ascontiguousarray(
        _rotate_orientation_to_native(source, decoded_orientation)
    )
    applied_components = []
    if vignette_model is not None:
        native = vignette_model.apply_linear(
            native,
            orientation=ORIENTATION_NATIVE,
        )
        applied_components.append("vignette")

    if geometry_model is not None:
        native, radial_manifest = _apply_fuji_radial_remap(
            native,
            geometry_model,
        )
        base_manifest["radial_remap"] = radial_manifest
        if radial_manifest["enabled"]:
            applied_components.extend(radial_manifest["applied_components"])

    corrected = _rotate_native_to_orientation(native, decoded_orientation)
    if corrected.strides[-1] < 0 or any(
        stride < 0 for stride in corrected.strides
    ):
        corrected = np.ascontiguousarray(corrected)
    base_manifest.update(
        {
            "enabled": True,
            "reason": "fuji_embedded_lens_metadata_applied",
            "applied_components": applied_components,
            "corrected_decode_size": [
                int(corrected.shape[1]),
                int(corrected.shape[0]),
            ],
        }
    )
    return corrected, base_manifest


def _downsample_average(rgb: np.ndarray, max_long_edge: int) -> np.ndarray:
    """Downsample by whole average blocks without changing orientation.

    The limit applies to the long edge.  Using only the array width selected a
    different block factor after EXIF rotation and could trim two columns from
    portrait X-T5 images, changing their 3:2 aspect ratio.
    """

    if (
        isinstance(max_long_edge, bool)
        or not isinstance(max_long_edge, int)
        or max_long_edge <= 0
    ):
        raise ValueError("maximum preview long edge must be a positive integer")
    factor = max(
        1,
        int(np.ceil(max(rgb.shape[0], rgb.shape[1]) / max_long_edge)),
    )
    if factor == 1:
        return rgb
    height = (rgb.shape[0] // factor) * factor
    width = (rgb.shape[1] // factor) * factor
    trimmed = rgb[:height, :width]
    return trimmed.reshape(
        height // factor,
        factor,
        width // factor,
        factor,
        3,
    ).mean(axis=(1, 3))


def _resize_linear_exact(
    rgb: np.ndarray,
    target_size: Tuple[int, int],
) -> np.ndarray:
    """Resize unclipped linear RGB to an exact comparison size.

    Lightroom's controller previews are bounded by both width and height, so
    their landscape and portrait outputs do not share one long-edge limit.
    Resizing each float32 channel independently avoids an 8-bit round trip
    before the exposure and profile stages.
    """

    if (
        not isinstance(target_size, tuple)
        or len(target_size) != 2
        or any(
            isinstance(value, bool)
            or not isinstance(value, int)
            or value <= 0
            for value in target_size
        )
    ):
        raise ValueError("target preview size must be two positive integers")
    if not isinstance(rgb, np.ndarray) or rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError("linear preview must have shape (height, width, 3)")

    target_width, target_height = target_size
    source_height, source_width = rgb.shape[:2]
    source_ratio = source_width / source_height
    target_ratio = target_width / target_height
    if not math.isclose(source_ratio, target_ratio, rel_tol=0.0, abs_tol=1e-6):
        raise ValueError(
            "target preview size must preserve the decoded aspect ratio"
        )
    if (target_width, target_height) == (source_width, source_height):
        return rgb

    channels = []
    for channel_index in range(3):
        channel = Image.fromarray(
            np.asarray(rgb[..., channel_index], dtype=np.float32),
            mode="F",
        )
        resized = channel.resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS,
        )
        channels.append(np.asarray(resized, dtype=np.float32))
    return np.stack(channels, axis=-1)


def _extract_raf_jpeg(path: Path) -> bytes:
    with path.open("rb") as handle:
        header = handle.read(108)
        if not header.startswith(b"FUJIFILMCCD-RAW "):
            raise ValueError(f"not a Fujifilm RAF: {path}")
        jpeg_offset, jpeg_size = struct.unpack_from(">2I", header, 84)
        handle.seek(jpeg_offset)
        jpeg = handle.read(jpeg_size)
    if not jpeg.startswith(b"\xff\xd8"):
        raise ValueError("RAF embedded preview is not a JPEG")
    return jpeg


def _multi_raw_default_render_manifest(
    multi_raw,
) -> Dict[str, object]:
    """Initialize bounded M-RAW provenance before the conservative gate."""

    if multi_raw is None:
        return {
            "detected": False,
            "selected_frame_index": 0,
            "auxiliary_frames_used": False,
            "fusion_enabled": False,
        }
    manifest = multi_raw.manifest_metadata()
    manifest.update(
        {
            "detected": True,
            "selected_frame_index": 0,
            "auxiliary_frames_used": False,
            "fusion_enabled": False,
            "default_policy": "primary_frame_zero",
            "policy_reason": (
                "three-frame global fusion regressed motion and held-out "
                "Lightroom references; auxiliary frames remain parsed "
                "provenance until a dense motion-safe merge is validated"
            ),
            "independent_reimplementation": True,
            "calls_adobe_runtime": False,
        }
    )
    return manifest


def _uses_mraw_highlight_treatment(
    active_crop: Dict[str, object],
) -> bool:
    """Whether this decode needs the validated M-RAW highlight treatment."""

    multi_raw = active_crop.get("multi_raw")
    return bool(
        isinstance(multi_raw, dict)
        and multi_raw.get("format") == "Fujifilm M-RAW"
        and multi_raw.get("detected") is True
        and multi_raw.get("frame_count") == 3
    )


def _mraw_fusion_succeeded(active_crop: Dict[str, object]) -> bool:
    """Whether the independent renderer accepted all three M-RAW frames."""

    return bool(
        _uses_mraw_highlight_treatment(active_crop)
        and isinstance(active_crop.get("multi_raw"), dict)
        and active_crop["multi_raw"].get("fusion_enabled") is True
    )


def _mraw_fusion_supports_chromatic_refinement(
    active_crop: Dict[str, object],
) -> bool:
    """Whether accepted fusion exposes enough quality data for refinement."""

    return _mraw_fusion_chromatic_refinement_weight(active_crop) > 0.0


def _mraw_fusion_chromatic_refinement_weight(
    active_crop: Dict[str, object],
) -> float:
    """Attenuate profile-aware highlight shaping by fusion dispersion."""

    if not _mraw_fusion_succeeded(active_crop):
        return 0.0
    multi_raw = active_crop.get("multi_raw")
    if not isinstance(multi_raw, dict):
        return 0.0
    fusion = multi_raw.get("fusion")
    if not isinstance(fusion, dict):
        return 0.0
    gate = fusion.get("gate")
    if not isinstance(gate, dict):
        return 0.0
    observed = gate.get("observed")
    if not isinstance(observed, dict):
        return 0.0
    span = observed.get("maximum_central_80_percent_span_ev")
    if (
        not isinstance(span, (int, float))
        or isinstance(span, bool)
        or not math.isfinite(float(span))
    ):
        return 0.0
    return float(
        1.0
        - _smoothstep_range(
            float(span),
            DEFAULT_MRAW_FUSED_REFINEMENT_FULL_WEIGHT_SPAN_EV,
            DEFAULT_MRAW_FUSED_REFINEMENT_ZERO_WEIGHT_SPAN_EV,
        )
    )


def _decoder_highlight_headroom_manifest(
    active_crop: Dict[str, object],
) -> object:
    """Return either full-sensor or portable decoder headroom provenance."""

    decoder = active_crop.get("decoder")
    if not isinstance(decoder, dict):
        return None
    output = decoder.get("output")
    if isinstance(output, dict) and "highlight_headroom" in output:
        return output["highlight_headroom"]
    return decoder.get("highlight_headroom")


def _raw_highlight_headroom_policy(
    active_crop: Dict[str, object],
    *,
    requested: bool,
    camera_model: object,
) -> Dict[str, object]:
    """Summarize requested versus effective X-T5 decoder headroom."""

    decoder = _decoder_highlight_headroom_manifest(active_crop)
    effective = bool(
        isinstance(decoder, dict) and decoder.get("enabled") is True
    )
    if effective:
        reason = "validated_x_t5_libraw_user_sat_enabled"
    elif not requested:
        reason = "explicit_legacy_opt_out"
    elif camera_model != "X-T5":
        reason = "unsupported_camera_model"
    else:
        reason = "x_t5_decoder_headroom_not_effective"
    return {
        "requested": requested,
        "effective": effective,
        "camera_model": camera_model,
        "reason": reason,
        "decoder": decoder,
    }


def _raw_highlight_statistics(
    linear_prophoto: np.ndarray,
    *,
    frame_index: int = 0,
    headroom_decode_effective: bool = False,
    tile_rows: int = 512,
) -> Dict[str, object]:
    """Measure severe WB headroom before lens, resize, fusion, or profiles."""

    source = np.asarray(linear_prophoto)
    if source.ndim != 3 or source.shape[-1] != 3:
        raise ValueError("raw-highlight statistics require an RGB image")
    if source.dtype.kind != "f":
        raise TypeError("raw-highlight statistics require floating-point RGB")
    if not np.all(np.isfinite(source)):
        raise ValueError("raw-highlight statistics require finite RGB")
    if isinstance(tile_rows, bool) or not isinstance(tile_rows, int) or tile_rows <= 0:
        raise ValueError("raw-highlight statistics tile_rows must be positive")
    if isinstance(frame_index, bool) or not isinstance(frame_index, int) or frame_index < 0:
        raise ValueError("raw-highlight statistics frame_index must be nonnegative")
    if not isinstance(headroom_decode_effective, bool):
        raise TypeError("raw-highlight headroom effective flag must be boolean")

    severe_count = 0
    pixel_count = source.shape[0] * source.shape[1]
    source_maximum = -math.inf
    sampled_maxima: list[np.ndarray] = []
    for top in range(0, source.shape[0], tile_rows):
        tile = source[top : top + tile_rows]
        maximum = np.max(tile, axis=-1)
        minimum = np.min(tile, axis=-1)
        middle = np.sum(tile, axis=-1) - maximum - minimum
        severe_count += int(
            np.count_nonzero(
                (maximum > 1.02) & ((maximum - middle) > 0.05)
            )
        )
        source_maximum = max(source_maximum, float(np.max(maximum)))
        sampled_maxima.append(maximum[::4, ::4].reshape(-1))
    sampled = np.concatenate(sampled_maxima)
    return {
        "stage": (
            "white_balanced_linear_prophoto_after_decode_before_lens_resize_"
            "multi_raw_fusion_and_profile_exposure"
        ),
        "scope": "primary_frame" if frame_index == 0 else "auxiliary_frame",
        "frame_index": frame_index,
        "headroom_decode_effective": headroom_decode_effective,
        "severe_headroom_gate_eligible": headroom_decode_effective,
        "pixel_count": pixel_count,
        "source_maximum": source_maximum,
        "source_maximum_p99_sampled": float(
            np.percentile(sampled, 99.0)
        ),
        "percentile_sampling_stride": 4,
        "severe_headroom_pixel_count": severe_count,
        "severe_headroom_pixel_fraction": severe_count / pixel_count,
        "severe_definition": {
            "largest_channel_greater_than": 1.02,
            "largest_minus_second_largest_greater_than": 0.05,
        },
    }


def _mraw_severe_headroom_fraction(
    active_crop: Dict[str, object],
) -> Optional[float]:
    statistics = active_crop.get("raw_highlight_statistics")
    if not isinstance(statistics, dict):
        return None
    if statistics.get("severe_headroom_gate_eligible") is not True:
        return None
    value = statistics.get("severe_headroom_pixel_fraction")
    return float(value) if isinstance(value, (int, float)) else None


def _decode_raf_linear_prophoto(
    raw_path: Path,
    max_width: int,
    full_resolution_demosaic: bool = False,
    *,
    lens_geometry_model: Optional[FujiLensGeometryModel] = None,
    lens_vignette_model: Optional[FujiVignetteModel] = None,
    apply_default_lens_corrections: bool = False,
    target_size: Optional[Tuple[int, int]] = None,
    white_balance_resolver: Optional[
        Callable[
            [Tuple[float, float, float, float]],
            Sequence[float],
        ]
    ] = None,
    preserve_raw_highlight_headroom: bool = True,
    _allow_multi_raw_fusion: bool = True,
    _multi_raw_frame_index: int = 0,
) -> Tuple[
    np.ndarray,
    RAFMetadata,
    Dict[str, object],
    str,
    Tuple[int, ...],
    Dict[str, object],
]:
    """Decode one RAF without LibRaw's scene-dependent auto-bright.

    The default half-size X-Trans path keeps interactive previews economical.
    Full-resolution interpolation remains explicit because it uses roughly
    twice the memory and is materially slower before the same preview
    downsampling step.
    """

    _require_deterministic_libraw()
    if not isinstance(preserve_raw_highlight_headroom, bool):
        raise TypeError("preserve_raw_highlight_headroom must be boolean")
    if (
        isinstance(_multi_raw_frame_index, bool)
        or not isinstance(_multi_raw_frame_index, int)
        or _multi_raw_frame_index < 0
    ):
        raise ValueError("M-RAW frame index must be a nonnegative integer")
    raf_metadata = parse_raf_metadata(raw_path)
    # Tests and third-party callers may provide a minimal metadata stand-in;
    # strict M-RAW parsing is tied to the concrete bounded RAF parser.
    multi_raw = (
        parse_raf_multi_raw(raw_path)
        if (
            _allow_multi_raw_fusion
            and isinstance(raf_metadata, RAFMetadata)
        )
        else None
    )

    camera_model = getattr(raf_metadata, "camera_model", None)
    preserve_x_t5_headroom = bool(
        preserve_raw_highlight_headroom and camera_model == "X-T5"
    )
    # The geometry-override decoder intentionally hard-gates its ctypes ABI
    # to the validated Linux rawpy/LibRaw build.  The gallery is also useful
    # on native macOS, where rawpy exposes the same LibRaw 0.21 public
    # postprocess path but the private structure layout must not be assumed.
    # Keep the exact full-active path on Linux and use only rawpy's public API
    # elsewhere.
    portable_x_t5_decode = camera_model == "X-T5" and sys.platform != "linux"

    if camera_model == "X-T5" and not portable_x_t5_decode:
        full_sensor_options: Dict[str, object] = {
            "half_size": not full_resolution_demosaic,
        }
        if white_balance_resolver is not None:
            full_sensor_options["white_balance_resolver"] = (
                white_balance_resolver
            )
        if preserve_x_t5_headroom:
            full_sensor_options["preserve_highlight_headroom"] = True
        decoded, decoder_manifest = decode_x_t5_full_active(
            raw_path,
            **full_sensor_options,
        )
        geometry = decoder_manifest["geometry"]
        output = decoder_manifest["output"]
        active_crop = {
            "applied": True,
            "stage": "before_libraw_unpack",
            "method": "libraw_public_geometry_override",
            "source_origin": geometry["source_origin"],
            "source_size": geometry["source_size"],
            "target_origin": geometry["target_origin"],
            "target_size_full_resolution": geometry["target_size"],
            "full_mosaic_size": geometry["full_mosaic_size"],
            "xtrans_phase_shift": geometry["xtrans_phase_shift"],
            "decode_scale": geometry["decode_scale"],
            "decoded_size_after": output["size"],
            "orientation": output["orientation"],
            "libraw_flip": output["libraw_flip"],
            "decoder": decoder_manifest,
        }
        rawpy_version = str(decoder_manifest["rawpy_version"])
        libraw_version = tuple(decoder_manifest["libraw_version"])
    else:
        try:
            import rawpy
        except ImportError as exc:
            raise RuntimeError(
                "rawpy is required: python -m pip install rawpy"
            ) from exc
        postprocess_options: Dict[str, object] = {
            "use_camera_wb": True,
            "no_auto_bright": True,
            "output_color": rawpy.ColorSpace.ProPhoto,
            "gamma": (1.0, 1.0),
            "output_bps": 16,
            "half_size": not full_resolution_demosaic,
            "adjust_maximum_thr": 0.0,
        }
        public_libraw_flip = None
        portable_headroom_manifest: Dict[str, object] = {
            "enabled": False,
            "method": "libraw_default_uint16_scale",
            "normalization_divisor": 65535,
            "uint16_to_linear_scale": 1.0 / 65535.0,
        }
        with rawpy.imread(str(raw_path)) as raw:
            if portable_x_t5_decode:
                raw_sizes = getattr(raw, "sizes", None)
                flip_value = getattr(raw_sizes, "flip", None)
                if flip_value is not None:
                    public_libraw_flip = int(flip_value)
            if white_balance_resolver is not None:
                camera_multipliers = tuple(
                    float(value) for value in raw.camera_whitebalance
                )
                resolved_multipliers = tuple(
                    float(value)
                    for value in white_balance_resolver(camera_multipliers)
                )
                if len(resolved_multipliers) != 4:
                    raise RuntimeError(
                        "resolved rawpy white balance must contain four "
                        "multipliers"
                    )
                postprocess_options.update(
                    {
                        "use_camera_wb": False,
                        "user_wb": resolved_multipliers,
                    }
                )
            if preserve_x_t5_headroom:
                portable_headroom_manifest = (
                    _x_t5_headroom_normalization_from_levels(
                        raw.black_level_per_channel,
                        raw.white_level,
                    )
                )
                postprocess_options["user_sat"] = (
                    LIBRAW_HEADROOM_USER_SATURATION
                )
            decoded = raw.postprocess(**postprocess_options)
            rawpy_version = rawpy.__version__
            libraw_version = tuple(rawpy.libraw_version)

        if full_resolution_demosaic:
            decoded, active_crop = apply_raf_active_crop(
                decoded,
                raf_metadata,
                decode_scale=1,
            )
        else:
            decoded, active_crop = apply_raf_active_crop(
                decoded,
                raf_metadata,
            )
        if portable_x_t5_decode:
            if public_libraw_flip is not None:
                active_crop["orientation"] = libraw_flip_orientation(
                    public_libraw_flip
                )
                active_crop["libraw_flip"] = public_libraw_flip
            active_crop["decoder"] = {
                "method": "rawpy_public_postprocess",
                "platform": sys.platform,
                "reason": (
                    "full_sensor_ctypes_abi_not_validated_on_this_platform"
                ),
                "rawpy_version": str(rawpy_version),
                "libraw_version": list(libraw_version),
                "decode_scale": 1 if full_resolution_demosaic else 2,
                "orientation_source": (
                    "rawpy_public_image_sizes_flip"
                    if public_libraw_flip is not None
                    else "legacy_active_crop_geometry_only"
                ),
                "white_balance_mode": (
                    "explicit_user_multipliers"
                    if white_balance_resolver is not None
                    else "camera_white_balance"
                ),
                "highlight_headroom": portable_headroom_manifest,
            }

    headroom_manifest = _decoder_highlight_headroom_manifest(active_crop)
    if (
        isinstance(headroom_manifest, dict)
        and headroom_manifest.get("enabled") is True
    ):
        linear = decoded.astype(np.float32) * float(
            headroom_manifest["uint16_to_linear_scale"]
        )
    else:
        linear = decoded.astype(np.float32) / 65535.0
    headroom_decode_effective = bool(
        isinstance(headroom_manifest, dict)
        and headroom_manifest.get("enabled") is True
    )
    active_crop["raw_highlight_statistics"] = _raw_highlight_statistics(
        linear,
        frame_index=_multi_raw_frame_index,
        headroom_decode_effective=headroom_decode_effective,
    )
    if (
        apply_default_lens_corrections
        and (
            lens_geometry_model is not None
            or lens_vignette_model is not None
        )
    ):
        decoded_orientation = _resolved_decode_orientation(active_crop)
    else:
        orientation_value = active_crop.get("orientation")
        decoded_orientation = (
            str(orientation_value)
            if orientation_value in VIGNETTE_ORIENTATIONS
            else ORIENTATION_NATIVE
        )
    linear, lens_manifest = _apply_default_lens_corrections(
        linear,
        decoded_orientation=decoded_orientation,
        geometry_model=lens_geometry_model,
        vignette_model=lens_vignette_model,
        enabled=apply_default_lens_corrections,
    )
    if target_size is None:
        linear = _downsample_average(linear, max_width).astype(np.float32)
    else:
        linear = _resize_linear_exact(linear, target_size)

    multi_raw_manifest = _multi_raw_default_render_manifest(multi_raw)
    frame_headroom_policies: list[Dict[str, object]] = []
    if multi_raw is not None:
        primary_headroom = _decoder_highlight_headroom_manifest(active_crop)
        primary_effective = bool(
            isinstance(primary_headroom, dict)
            and primary_headroom.get("enabled") is True
        )
        if preserve_x_t5_headroom and not primary_effective:
            raise RuntimeError(
                "requested X-T5 highlight headroom was not effective on "
                "M-RAW primary frame 0"
            )
        frame_headroom_policies.append(
            {
                "frame_index": 0,
                "requested": preserve_x_t5_headroom,
                "effective": primary_effective,
                "normalization": primary_headroom,
            }
        )
    if multi_raw is not None and len(multi_raw.frames) != 3:
        multi_raw_manifest.update(
            {
                "base_frame_index": 0,
                "auxiliary_frames_analyzed": False,
                "auxiliary_frames_used": False,
                "fusion_enabled": False,
                "default_policy": "primary_frame_zero",
                "policy_reason": (
                    "independent default fusion currently supports exactly "
                    "the validated three-frame 0/-2/+2 EV X-T5 container; "
                    "unsupported frame count falls back to frame zero"
                ),
                "supported_fusion_frame_count": 3,
                "observed_frame_count": len(multi_raw.frames),
            }
        )
    elif multi_raw is not None:
        frames = [linear]
        wrapper_manifests = []
        with tempfile.TemporaryDirectory(
            prefix="fuji-mraw-frames-"
        ) as temporary:
            temporary_root = Path(temporary)
            for frame in multi_raw.frames[1:]:
                wrapper_path = (
                    temporary_root
                    / f"frame-{frame.frame_index}.RAF"
                )
                wrapper_manifest = materialize_raf_multi_raw_frame(
                    raw_path,
                    frame.frame_index,
                    wrapper_path,
                )
                # The temporary path is intentionally gone when this function
                # returns; retain reproducible ranges/hash rather than a stale
                # filesystem location.
                wrapper_manifest["output"] = (
                    "temporary_wrapper_removed_after_decode"
                )
                wrapper_manifests.append(wrapper_manifest)
                (
                    auxiliary,
                    _,
                    auxiliary_active_crop,
                    _,
                    _,
                    _,
                ) = _decode_raf_linear_prophoto(
                    wrapper_path,
                    max_width,
                    full_resolution_demosaic,
                    lens_geometry_model=lens_geometry_model,
                    lens_vignette_model=lens_vignette_model,
                    apply_default_lens_corrections=(
                        apply_default_lens_corrections
                    ),
                    target_size=target_size,
                    white_balance_resolver=white_balance_resolver,
                    preserve_raw_highlight_headroom=(
                        preserve_x_t5_headroom
                    ),
                    _allow_multi_raw_fusion=False,
                    _multi_raw_frame_index=frame.frame_index,
                )
                auxiliary_headroom = _decoder_highlight_headroom_manifest(
                    auxiliary_active_crop
                )
                auxiliary_effective = bool(
                    isinstance(auxiliary_headroom, dict)
                    and auxiliary_headroom.get("enabled") is True
                )
                if preserve_x_t5_headroom and not auxiliary_effective:
                    raise RuntimeError(
                        "requested X-T5 highlight headroom was not effective "
                        f"on M-RAW auxiliary frame {frame.frame_index}"
                    )
                frame_headroom_policies.append(
                    {
                        "frame_index": frame.frame_index,
                        "requested": preserve_x_t5_headroom,
                        "effective": auxiliary_effective,
                        "normalization": auxiliary_headroom,
                    }
                )
                frames.append(auxiliary)

        linear, fusion_manifest = fuse_mraw_linear_prophoto(
            frames,
            [frame.exposure_ev for frame in multi_raw.frames],
        )
        fusion_enabled = bool(fusion_manifest["fusion_enabled"])
        multi_raw_manifest.update(
            {
                "selected_frame_index": None if fusion_enabled else 0,
                "base_frame_index": 0,
                "auxiliary_frames_analyzed": True,
                "auxiliary_frames_used": fusion_enabled,
                "fusion_enabled": fusion_enabled,
                "default_policy": (
                    "static_scene_motion_gated_three_frame_fusion"
                    if fusion_enabled
                    else "primary_frame_zero"
                ),
                "policy_reason": (
                    "all conservative geometric and radiometric static-scene "
                    "checks passed"
                    if fusion_enabled
                    else "one or more conservative static-scene checks "
                    "failed; exact primary-frame fallback used"
                ),
                "materialized_auxiliary_frames": wrapper_manifests,
                "frame_highlight_headroom": frame_headroom_policies,
                "fusion": fusion_manifest,
            }
        )
    if (
        frame_headroom_policies
        and "frame_highlight_headroom" not in multi_raw_manifest
    ):
        multi_raw_manifest["frame_highlight_headroom"] = (
            frame_headroom_policies
        )
    active_crop["multi_raw"] = multi_raw_manifest
    return (
        linear,
        raf_metadata,
        active_crop,
        rawpy_version,
        libraw_version,
        lens_manifest,
    )


def _comparison(
    camera_path: Path,
    rendered_path: Path,
    output_path: Path,
) -> None:
    with Image.open(camera_path) as camera_source, Image.open(
        rendered_path
    ) as rendered_source:
        camera = camera_source.convert("RGB")
        rendered = rendered_source.convert("RGB")
        panel_width = min(camera.width, rendered.width, 1800)
        panel_height = round(panel_width * 2 / 3)
        camera.thumbnail((panel_width, panel_height), Image.Resampling.LANCZOS)
        rendered.thumbnail((panel_width, panel_height), Image.Resampling.LANCZOS)
        panel_height = min(camera.height, rendered.height)
        camera = camera.crop((0, 0, camera.width, panel_height))
        rendered = rendered.crop((0, 0, rendered.width, panel_height))

        header_height = 48
        canvas = Image.new(
            "RGB",
            (camera.width + rendered.width, panel_height + header_height),
            "white",
        )
        canvas.paste(camera, (0, header_height))
        canvas.paste(rendered, (camera.width, header_height))
        draw = ImageDraw.Draw(canvas)
        draw.text((16, 15), "In-camera JPEG (reference)", fill="black")
        draw.text(
            (camera.width + 16, 15),
            "Extracted Lightroom DCP (rawpy preview)",
            fill="black",
        )
        canvas.save(output_path, quality=94, subsampling=0)


def render(
    raw_path: Path,
    dcp_path: Path,
    output_path: Path,
    max_width: int,
    camera_reference: Path = None,
    comparison: Path = None,
    base_exposure_ev: float = 0.0,
    apply_default_color_noise_reduction: bool = True,
    full_resolution_demosaic: bool = False,
    apply_default_lens_corrections: bool = True,
    apply_default_exposure_calibration: bool = True,
    target_size: Optional[Tuple[int, int]] = None,
    apply_default_highlight_reconstruction: bool = True,
    preserve_raw_highlight_headroom: bool = True,
    develop_settings: Optional[DevelopSettings] = None,
    rgb_table_path: Optional[Path] = None,
    image_transform: Optional[Callable[[Image.Image], Image.Image]] = None,
) -> dict:
    settings = (
        DEFAULT_DEVELOP_SETTINGS
        if develop_settings is None
        else develop_settings
    )
    if not isinstance(settings, DevelopSettings):
        raise TypeError("develop_settings must be a DevelopSettings instance")
    profile = DCPProfile.from_file(dcp_path)
    rgb_table = (
        RGBTable.from_file(rgb_table_path)
        if rgb_table_path is not None
        else None
    )
    metadata = profile.metadata()
    lens_geometry_model, lens_vignette_model = _read_default_lens_models(
        raw_path
    )

    white_balance_resolution: Dict[str, object] = {}
    white_balance_resolver = None
    white_balance_correction = None
    if settings.has_white_balance_adjustment:
        white_balance_profile = DCPProfile.from_file(
            dcp_path.parent / "adobe-standard.dcp"
        )

        def white_balance_resolver(camera_multipliers):
            nonlocal white_balance_correction
            resolved, manifest = resolve_camera_white_balance(
                white_balance_profile,
                camera_multipliers,
                settings.temperature,
                settings.tint,
            )
            correction, correction_manifest = (
                x_t5_white_balance_forward_matrix_correction(
                    white_balance_profile,
                    manifest["as_shot"]["xy"],
                    manifest["resolved"]["xy"],
                )
            )
            manifest["relative_forward_matrix_correction"] = (
                correction_manifest
            )
            if not white_balance_resolution:
                white_balance_correction = correction
                white_balance_resolution.update(manifest)
            return resolved

    (
        linear,
        raf_metadata,
        active_crop,
        rawpy_version,
        libraw_version,
        lens_manifest,
    ) = _decode_raf_linear_prophoto(
        raw_path,
        max_width,
        full_resolution_demosaic,
        lens_geometry_model=lens_geometry_model,
        lens_vignette_model=lens_vignette_model,
        apply_default_lens_corrections=apply_default_lens_corrections,
        target_size=target_size,
        white_balance_resolver=white_balance_resolver,
        preserve_raw_highlight_headroom=preserve_raw_highlight_headroom,
    )
    if white_balance_correction is not None:
        linear = apply_white_balance_forward_matrix_correction(
            linear,
            white_balance_correction,
        )
    raw_exposure_bias_ev = raf_metadata.raw_exposure_bias_ev
    raw_exposure_ev = raw_exposure_correction_ev(raw_exposure_bias_ev)
    pre_dcp_exposure_ev, exposure_manifest = _resolve_pre_dcp_exposure(
        raw_exposure_bias_ev,
        raw_exposure_ev,
        base_exposure_ev,
        apply_default_exposure_calibration,
    )

    baseline = metadata.get("baseline_exposure_offset")
    baseline_ev = float(baseline[0]) if baseline else 0.0
    profile_exposure_ev = pre_dcp_exposure_ev + baseline_ev
    profile_exposed = linear * (2.0 ** pre_dcp_exposure_ev)
    apply_mraw_highlight_treatment = _uses_mraw_highlight_treatment(
        active_crop
    )
    fused_chromatic_refinement_weight = (
        _mraw_fusion_chromatic_refinement_weight(active_crop)
    )
    apply_fused_chromatic_refinement = bool(
        apply_mraw_highlight_treatment
        and fused_chromatic_refinement_weight > 0.0
        and dcp_path.stem not in MONOCHROME_PROFILE_SLUGS
    )
    mraw_severe_headroom_fraction = _mraw_severe_headroom_fraction(
        active_crop
    )
    highlight_manifest = _default_highlight_reconstruction_manifest(
        profile_exposed,
        apply_default_highlight_reconstruction,
        apply_mraw_highlight_treatment=apply_mraw_highlight_treatment,
        apply_fused_chromatic_refinement=(
            apply_fused_chromatic_refinement
        ),
        fused_chromatic_refinement_weight=(
            fused_chromatic_refinement_weight
        ),
        mraw_severe_headroom_fraction=mraw_severe_headroom_fraction,
    )
    linear = _apply_default_highlight_reconstruction(
        profile_exposed,
        apply_default_highlight_reconstruction,
        apply_mraw_highlight_treatment=apply_mraw_highlight_treatment,
        apply_fused_chromatic_refinement=(
            apply_fused_chromatic_refinement
        ),
        fused_chromatic_refinement_weight=(
            fused_chromatic_refinement_weight
        ),
        mraw_severe_headroom_fraction=mraw_severe_headroom_fraction,
    )
    iso_speed = _camera_iso_speed(raw_path)
    if apply_default_color_noise_reduction:
        linear = _apply_default_color_noise_reduction(
            linear,
            iso_speed,
        )
    image_statistics = measure_pv2012_image_statistics(linear)
    linear = apply_pv2012_tone_controls(linear, settings)
    linear = apply_pv2012_exposure_controls(
        linear,
        settings,
        profile_baseline_exposure_ev=baseline_ev,
        image_statistics=image_statistics,
    )
    linear = apply_pv2012_saturation_control(linear, settings)
    simulated = profile.apply_look_and_tone(linear)
    if rgb_table is not None:
        simulated = rgb_table.apply_linear_prophoto(simulated)
    simulated = apply_pv2012_vibrance_control(simulated, settings)
    srgb = _linear_prophoto_to_srgb(simulated)
    image = Image.fromarray(
        np.rint(srgb * 255.0).astype(np.uint8),
        mode="RGB",
    )
    if image_transform is not None:
        image = image_transform(image)
        if not isinstance(image, Image.Image):
            raise TypeError("image_transform must return a PIL Image")
        if image.mode != "RGB":
            image = image.convert("RGB")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, quality=95, subsampling=0)

    if camera_reference is not None:
        camera_reference.parent.mkdir(parents=True, exist_ok=True)
        camera_reference.write_bytes(_extract_raf_jpeg(raw_path))
    if comparison is not None:
        if camera_reference is None:
            raise ValueError("comparison requires a camera-reference path")
        _comparison(camera_reference, output_path, comparison)

    return {
        "raw": str(raw_path),
        "dcp": str(dcp_path),
        "rgb_table": (
            str(rgb_table_path) if rgb_table_path is not None else None
        ),
        "profile": metadata["profile_name"],
        "output": str(output_path),
        "output_size": list(image.size),
        "preview_max_long_edge": max_width,
        "preview_target_size": list(target_size) if target_size else None,
        "preview_resampling": {
            "method": (
                "float32_lanczos_exact"
                if target_size
                else "integer_block_average"
            ),
            "stage": "after_default_lens_corrections_before_profile",
        },
        "full_resolution_demosaic": full_resolution_demosaic,
        "raw_metadata": raf_metadata.manifest_metadata(),
        "active_crop": active_crop,
        "raw_exposure_bias_ev": raw_exposure_bias_ev,
        "raw_exposure_correction_ev": raw_exposure_ev,
        "base_exposure_ev": base_exposure_ev,
        "user_base_exposure_ev": base_exposure_ev,
        "default_exposure_calibration": exposure_manifest[
            "libraw_to_camera_raw_compatibility_calibration"
        ],
        "exposure_pipeline": exposure_manifest,
        "pre_dcp_exposure_ev": pre_dcp_exposure_ev,
        "baseline_exposure_ev": baseline_ev,
        "develop_settings": {
            **settings.manifest(),
            "stages": {
                "white_balance": (
                    "camera_multipliers_before_demosaic_and_color_conversion"
                ),
                "exposure": (
                    "after_pv2012_tone_map_before_dcp_profile_look_table"
                ),
                "tone": (
                    "linear_prophoto_before_exposure_and_dcp_profile_"
                    "look_table"
                ),
                "color": (
                    "after_complete_camera_profile_before_output_conversion"
                ),
            },
            "white_balance_resolution": (
                white_balance_resolution
                if settings.has_white_balance_adjustment
                else {
                    "enabled": False,
                    "mode": "as_shot_exact_legacy_decode_path",
                }
            ),
            "effective_profile_exposure_ev": profile_exposure_ev,
            "baseline_exposure_application": {
                "method": "pv2012_bounded_exposure_shoulder",
                "stage": (
                    "after_tone_map_together_with_user_exposure_before_dcp_"
                    "look_table"
                ),
                "plain_linear_multiplier": False,
            },
            "image_statistics": image_statistics.manifest(),
        },
        "default_highlight_reconstruction": highlight_manifest,
        "raw_highlight_headroom": {
            **_raw_highlight_headroom_policy(
                active_crop,
                requested=preserve_raw_highlight_headroom,
                camera_model=getattr(raf_metadata, "camera_model", None),
            )
        },
        "default_color_noise_reduction": _default_color_noise_manifest(
            iso_speed,
            apply_default_color_noise_reduction,
        ),
        "default_lens_corrections": lens_manifest,
        "libraw_no_auto_bright": True,
        "libraw_adjust_maximum_threshold": 0.0,
        "libraw_determinism": _libraw_determinism_manifest(),
        "rawpy": rawpy_version,
        "libraw": list(libraw_version),
        "note": (
            "Validation preview: LibRaw supplies the initial camera-to-ProPhoto "
            "conversion; Adobe Camera Raw can differ in demosaic, exposure, "
            "highlight handling, and camera-matrix interpolation."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("raw", type=Path)
    parser.add_argument("dcp", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--rgb-table",
        type=Path,
        help=(
            "optional enhanced-profile RGB table applied after the base DCP; "
            "Fujifilm enhanced simulations use PROVIA as that base"
        ),
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=2400,
        help=(
            "maximum preview long edge in pixels; the option name is retained "
            "for compatibility"
        ),
    )
    parser.add_argument(
        "--target-size",
        type=_parse_pixel_size,
        help=(
            "exact WIDTHxHEIGHT comparison size; preserves float linear data "
            "and overrides --max-width downsampling"
        ),
    )
    parser.add_argument("--camera-reference", type=Path)
    parser.add_argument("--comparison", type=Path)
    parser.add_argument(
        "--base-exposure-ev",
        type=float,
        default=0.0,
        help=(
            "additional diagnostic exposure applied before the DCP creative "
            "stages, on top of the exact RAF correction and default "
            "LibRaw-to-Camera-Raw compatibility calibration (default: 0)"
        ),
    )
    parser.add_argument(
        "--exposure",
        type=float,
        default=0.0,
        help="Lightroom-style Exposure2012 adjustment in EV",
    )
    for option in (
        "contrast",
        "highlights",
        "shadows",
        "whites",
        "blacks",
        "saturation",
    ):
        parser.add_argument(
            f"--{option}",
            type=float,
            default=0.0,
            help=f"Lightroom-style {option.title()} adjustment (-100..100)",
        )
    parser.add_argument(
        "--temperature",
        type=float,
        help=(
            "absolute Lightroom-style white-balance temperature in Kelvin; "
            "omitting it preserves the As Shot temperature"
        ),
    )
    parser.add_argument(
        "--tint",
        type=float,
        help=(
            "absolute Lightroom-style tint; omitting it preserves the "
            "As Shot tint"
        ),
    )
    parser.add_argument(
        "--vibrance",
        "--viberance",
        dest="vibrance",
        type=float,
        default=0.0,
        help="Lightroom-style Vibrance adjustment (-100..100)",
    )
    parser.add_argument(
        "--disable-default-highlight-reconstruction",
        action="store_true",
        help=(
            "disable the independently calibrated Lightroom-compatible "
            "highlight shoulder and use the diagnostic hard-clipping path"
        ),
    )
    parser.add_argument(
        "--disable-raw-highlight-headroom",
        action="store_true",
        help=(
            "use the legacy clipped LibRaw scale instead of retaining X-T5 "
            "white-balanced sensor values above nominal white"
        ),
    )
    parser.add_argument(
        "--disable-default-color-noise-reduction",
        action="store_true",
        help=(
            "disable the independent approximation of Lightroom's default "
            "Color Noise Reduction amount 25"
        ),
    )
    parser.add_argument(
        "--full-resolution-demosaic",
        action="store_true",
        help=(
            "use full-resolution X-Trans interpolation before preview "
            "downsampling (higher memory and runtime)"
        ),
    )
    parser.add_argument(
        "--disable-default-lens-corrections",
        action="store_true",
        help=(
            "disable the independent embedded Fuji vignette, geometric-"
            "distortion, and lateral-chromatic-aberration corrections"
        ),
    )
    parser.add_argument(
        "--disable-default-exposure-calibration",
        action="store_true",
        help=(
            "disable the empirical -0.193 EV LibRaw-to-Camera-Raw "
            "compatibility calibration"
        ),
    )
    args = parser.parse_args()
    develop_settings = DevelopSettings(
        exposure=args.exposure,
        contrast=args.contrast,
        highlights=args.highlights,
        shadows=args.shadows,
        whites=args.whites,
        blacks=args.blacks,
        temperature=args.temperature,
        tint=args.tint,
        vibrance=args.vibrance,
        saturation=args.saturation,
    )
    result = render(
        raw_path=args.raw,
        dcp_path=args.dcp,
        output_path=args.output,
        max_width=args.max_width,
        rgb_table_path=args.rgb_table,
        camera_reference=args.camera_reference,
        comparison=args.comparison,
        base_exposure_ev=args.base_exposure_ev,
        apply_default_highlight_reconstruction=(
            not args.disable_default_highlight_reconstruction
        ),
        preserve_raw_highlight_headroom=(
            not args.disable_raw_highlight_headroom
        ),
        apply_default_color_noise_reduction=(
            not args.disable_default_color_noise_reduction
        ),
        full_resolution_demosaic=args.full_resolution_demosaic,
        apply_default_lens_corrections=(
            not args.disable_default_lens_corrections
        ),
        apply_default_exposure_calibration=(
            not args.disable_default_exposure_calibration
        ),
        target_size=args.target_size,
        develop_settings=develop_settings,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
