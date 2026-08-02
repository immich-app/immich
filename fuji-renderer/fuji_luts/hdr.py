"""Conservative motion-gated fusion for Fujifilm three-frame M-RAW data.

The X-T5 HDR container carries primary, -2 EV, and +2 EV exposures.  Global
fusion is useful only when the frames are both geometrically and
radiometrically consistent.  This module therefore makes fusion opt-in per
scene through a conjunctive confidence gate and returns the primary frame
unchanged whenever any check fails.

All processing is independent and operates on already developed, lens-
corrected linear ProPhoto RGB.  It does not call Adobe code or APIs.
"""

from __future__ import annotations

import math
from typing import Dict, Sequence, Tuple

import numpy as np


PROPHOTO_LUMINANCE = np.array(
    (0.2880402, 0.7118741, 0.0000857),
    dtype=np.float64,
)
MRAW_REGISTRATION_LONG_EDGE = 900
MRAW_STATIC_GATE_THRESHOLDS = {
    "minimum_phase_response": 0.93,
    "minimum_ecc_correlation": 0.965,
    "maximum_gradient_rmse_after": 0.05,
    "maximum_central_80_percent_span_ev": 0.17,
    "minimum_fraction_within_0_35_ev": 0.98,
    "maximum_absolute_median_ev_error": 0.06,
    "minimum_tile_fraction_within_0_35_ev": 0.85,
    "maximum_tile_central_80_percent_span_ev": 0.65,
    "maximum_registration_translation_fraction": 0.01,
    "maximum_affine_linear_deviation": 0.02,
}
MRAW_STATIC_GATE_TILE_GRID = (12, 8)
MRAW_STATIC_GATE_MINIMUM_TILE_PIXELS = 300
MRAW_STATIC_GATE_MINIMUM_POPULATED_TILES = 24


def _require_rgb_float(name: str, image: np.ndarray) -> np.ndarray:
    result = np.asarray(image)
    if result.ndim != 3 or result.shape[-1] != 3:
        raise ValueError(f"{name} must be an RGB image")
    if result.dtype.kind != "f":
        raise TypeError(f"{name} must use floating-point values")
    if not np.all(np.isfinite(result)):
        raise ValueError(f"{name} must contain only finite values")
    return result


def _luminance(rgb: np.ndarray) -> np.ndarray:
    return np.einsum(
        "...c,c->...",
        np.asarray(rgb, dtype=np.float64),
        PROPHOTO_LUMINANCE,
    )


def _normalized_registration_signal(
    rgb: np.ndarray,
    scale_to_primary: float,
) -> np.ndarray:
    luminance = _luminance(rgb) * scale_to_primary
    signal = np.log1p(np.maximum(luminance, 0.0) * 20.0)
    low, high = np.percentile(signal, (2.0, 98.0))
    signal = np.clip(
        (signal - low) / max(float(high - low), 1e-6),
        0.0,
        1.0,
    )
    return signal.astype(np.float32)


def _gradient_signal(values: np.ndarray, cv2) -> np.ndarray:
    horizontal = cv2.Sobel(values, cv2.CV_32F, 1, 0, ksize=3)
    vertical = cv2.Sobel(values, cv2.CV_32F, 0, 1, ksize=3)
    magnitude = cv2.magnitude(horizontal, vertical)
    return cv2.GaussianBlur(magnitude, (0, 0), 1.0)


def _registration_error(
    reference: np.ndarray,
    candidate: np.ndarray,
    cv2,
) -> float:
    first = _gradient_signal(reference, cv2)
    second = _gradient_signal(candidate, cv2)
    return float(np.sqrt(np.mean((first - second) ** 2)))


def _configure_opencv_runtime(cv2) -> Dict[str, object]:
    """Disable OpenCL and request serial OpenCV execution where supported.

    OpenCV's macOS wheels use Grand Central Dispatch.  That backend ignores
    ``setNumThreads`` and reports the host concurrency even though the request
    is harmless; rejecting it made native gallery Develop impossible.  Other
    backends must still confirm the one-thread request so an unexpected build
    cannot silently weaken the deterministic Linux validation path.
    """

    cv2.setNumThreads(1)
    if hasattr(cv2, "ocl"):
        cv2.ocl.setUseOpenCL(False)
    reported_threads = int(cv2.getNumThreads())
    parallel_framework = "unknown"
    get_build_information = getattr(cv2, "getBuildInformation", None)
    if callable(get_build_information):
        for line in get_build_information().splitlines():
            if "Parallel framework:" in line:
                parallel_framework = line.split(":", 1)[1].strip()
                break
    gcd_scheduler = parallel_framework.casefold() == "gcd"
    if reported_threads != 1 and not gcd_scheduler:
        raise RuntimeError(
            "deterministic M-RAW registration requires one OpenCV thread"
        )
    return {
        "library": "opencv",
        "version": str(cv2.__version__),
        "requested_threads": 1,
        "reported_threads": reported_threads,
        "thread_limit_enforced": reported_threads == 1,
        "parallel_framework": parallel_framework,
        "thread_control": (
            "opencv_set_num_threads"
            if reported_threads == 1
            else "macos_gcd_scheduler_ignores_opencv_thread_limit"
        ),
        "opencl_enabled": bool(
            cv2.ocl.useOpenCL() if hasattr(cv2, "ocl") else False
        ),
    }


def _register_frame(
    primary: np.ndarray,
    auxiliary: np.ndarray,
    scale_to_primary: float,
) -> Tuple[np.ndarray, Dict[str, object]]:
    """Register one exposure with phase correlation then gradient ECC."""

    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(
            "OpenCV is required for Fujifilm M-RAW registration: "
            "python -m pip install opencv-python"
        ) from exc
    runtime = _configure_opencv_runtime(cv2)

    primary_signal = _normalized_registration_signal(primary, 1.0)
    auxiliary_signal = _normalized_registration_signal(
        auxiliary,
        scale_to_primary,
    )
    height, width = primary_signal.shape
    downsample_scale = min(
        1.0,
        MRAW_REGISTRATION_LONG_EDGE / max(height, width),
    )
    small_size = (
        max(64, round(width * downsample_scale)),
        max(64, round(height * downsample_scale)),
    )
    template = cv2.resize(
        primary_signal,
        small_size,
        interpolation=cv2.INTER_AREA,
    )
    moving = cv2.resize(
        auxiliary_signal,
        small_size,
        interpolation=cv2.INTER_AREA,
    )
    window = cv2.createHanningWindow(small_size, cv2.CV_32F)
    phase_shift, phase_response = cv2.phaseCorrelate(
        template,
        moving,
        window,
    )
    before = _registration_error(template, moving, cv2)
    candidates = [
        (
            before,
            np.array(
                ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0)),
                dtype=np.float32,
            ),
        )
    ]
    for sign in (1.0, -1.0):
        matrix = np.array(
            (
                (1.0, 0.0, sign * phase_shift[0]),
                (0.0, 1.0, sign * phase_shift[1]),
            ),
            dtype=np.float32,
        )
        moved = cv2.warpAffine(
            moving,
            matrix,
            small_size,
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REFLECT,
        )
        candidates.append(
            (_registration_error(template, moved, cv2), matrix)
        )
    phase_error, phase_alignment = min(
        candidates,
        key=lambda item: item[0],
    )

    selected_matrix = phase_alignment
    selected_flags = cv2.INTER_LINEAR
    selected_error = phase_error
    ecc_correlation = None
    method = "phase_correlation_translation"
    try:
        ecc_initial = cv2.invertAffineTransform(phase_alignment)
        ecc_correlation, ecc_inverse = cv2.findTransformECC(
            _gradient_signal(template, cv2),
            _gradient_signal(moving, cv2),
            ecc_initial,
            cv2.MOTION_AFFINE,
            (
                cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT,
                150,
                1e-6,
            ),
            None,
            3,
        )
        ecc_aligned = cv2.warpAffine(
            moving,
            ecc_inverse,
            small_size,
            flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
            borderMode=cv2.BORDER_REFLECT,
        )
        ecc_error = _registration_error(template, ecc_aligned, cv2)
        if ecc_error < selected_error:
            selected_matrix = ecc_inverse
            selected_flags = cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP
            selected_error = ecc_error
            method = "phase_correlation_then_gradient_ecc_affine"
    except cv2.error:
        method = "phase_correlation_translation_ecc_failed"

    full_affine = selected_matrix.astype(np.float64)
    full_affine[:, 2] /= downsample_scale
    affine_linear_deviation = float(
        np.max(
            np.abs(
                full_affine[:, :2]
                - np.array(
                    ((1.0, 0.0), (0.0, 1.0)),
                    dtype=np.float64,
                )
            )
        )
    )
    translation_fraction = float(
        np.hypot(full_affine[0, 2], full_affine[1, 2])
        / max(width, height)
    )
    registered = cv2.warpAffine(
        auxiliary,
        full_affine.astype(np.float32),
        (width, height),
        flags=selected_flags,
        borderMode=cv2.BORDER_REFLECT,
    )
    # BORDER_REFLECT is useful while estimating alignment, but reflected
    # pixels are not real auxiliary exposure samples and must never
    # contribute to radiance fusion.  A warped unit mask identifies complete
    # source support; zero-valued auxiliaries receive exactly zero bracket
    # weight, leaving the primary frame at those pixels.
    support = cv2.warpAffine(
        np.ones((height, width), dtype=np.float32),
        full_affine.astype(np.float32),
        (width, height),
        flags=selected_flags,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=0.0,
    )
    valid_support = support >= (1.0 - 1e-6)
    registered[~valid_support] = 0.0
    aligned_small = cv2.warpAffine(
        moving,
        selected_matrix,
        small_size,
        flags=selected_flags,
        borderMode=cv2.BORDER_REFLECT,
    )
    after = _registration_error(template, aligned_small, cv2)
    return registered.astype(auxiliary.dtype, copy=False), {
        "method": method,
        "runtime": runtime,
        "phase_shift_small_pixels": [
            float(phase_shift[0]),
            float(phase_shift[1]),
        ],
        "phase_response": float(phase_response),
        "downsample_scale": float(downsample_scale),
        "analysis_size": list(small_size),
        "full_resolution_size": [width, height],
        "selected_warp_full_resolution": full_affine.tolist(),
        "translation_fraction_of_long_edge": translation_fraction,
        "affine_linear_deviation_from_identity": affine_linear_deviation,
        "valid_source_support_fraction": float(np.mean(valid_support)),
        "out_of_support_policy": (
            "zero_auxiliary_weight_primary_frame_only"
        ),
        "opencv_warp_inverse_map": bool(
            selected_flags & cv2.WARP_INVERSE_MAP
        ),
        "ecc_correlation": (
            float(ecc_correlation)
            if ecc_correlation is not None
            else None
        ),
        "gradient_rmse_before": before,
        "gradient_rmse_after": after,
        "improvement_fraction": (
            1.0 - after / before if before > 0.0 else None
        ),
    }


def _radiometric_features(
    primary: np.ndarray,
    auxiliary: np.ndarray,
    tag_scale_to_primary: float,
) -> Dict[str, object]:
    """Measure centered exposure consistency after geometric registration."""

    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(
            "OpenCV is required for Fujifilm M-RAW radiometric analysis"
        ) from exc
    height, width = primary.shape[:2]
    scale = min(
        1.0,
        MRAW_REGISTRATION_LONG_EDGE / max(height, width),
    )
    analysis_size = (
        max(64, round(width * scale)),
        max(64, round(height * scale)),
    )
    if analysis_size == (width, height):
        analysis_primary = primary
        analysis_auxiliary = auxiliary
    else:
        analysis_primary = cv2.resize(
            primary,
            analysis_size,
            interpolation=cv2.INTER_AREA,
        )
        analysis_auxiliary = cv2.resize(
            auxiliary,
            analysis_size,
            interpolation=cv2.INTER_AREA,
        )
    primary_y = _luminance(analysis_primary)
    auxiliary_y = _luminance(analysis_auxiliary)
    normalized_y = auxiliary_y * tag_scale_to_primary
    valid = (
        np.isfinite(primary_y)
        & np.isfinite(auxiliary_y)
        & (primary_y >= 0.01)
        & (primary_y <= 0.70)
        & (auxiliary_y >= 0.003)
        & (auxiliary_y <= 0.70)
    )
    border = min(8, max(0, min(valid.shape) // 8))
    if border:
        valid[:border] = False
        valid[-border:] = False
        valid[:, :border] = False
        valid[:, -border:] = False
    sample_count = int(np.count_nonzero(valid))
    minimum_samples = min(10_000, max(256, valid.size // 100))
    if sample_count < minimum_samples:
        return {
            "valid": False,
            "reason": "too_few_unclipped_pixels",
            "sample_pixels": sample_count,
            "minimum_sample_pixels": minimum_samples,
            "analysis_size": list(analysis_size),
        }

    residual_image = np.log2(
        np.maximum(primary_y, 1e-8)
        / np.maximum(normalized_y, 1e-8)
    )
    residual = residual_image[valid]
    median = float(np.median(residual))
    centered = residual - median
    centered_image = residual_image - median
    p10, p90 = np.percentile(centered, (10.0, 90.0))
    tile_columns, tile_rows = MRAW_STATIC_GATE_TILE_GRID
    tile_consistent_fractions = []
    tile_spans = []
    analysis_height, analysis_width = valid.shape
    for row in range(tile_rows):
        top = row * analysis_height // tile_rows
        bottom = (row + 1) * analysis_height // tile_rows
        for column in range(tile_columns):
            left = column * analysis_width // tile_columns
            right = (column + 1) * analysis_width // tile_columns
            tile_valid = valid[top:bottom, left:right]
            tile_residual = centered_image[
                top:bottom,
                left:right,
            ][tile_valid]
            if tile_residual.size < MRAW_STATIC_GATE_MINIMUM_TILE_PIXELS:
                continue
            tile_consistent_fractions.append(
                float(np.mean(np.abs(tile_residual) <= 0.35))
            )
            tile_p10, tile_p90 = np.percentile(
                tile_residual,
                (10.0, 90.0),
            )
            tile_spans.append(float(tile_p90 - tile_p10))
    if len(tile_consistent_fractions) < (
        MRAW_STATIC_GATE_MINIMUM_POPULATED_TILES
    ):
        return {
            "valid": False,
            "reason": "too_few_populated_radiometric_tiles",
            "sample_pixels": sample_count,
            "analysis_size": list(analysis_size),
            "tile_grid": list(MRAW_STATIC_GATE_TILE_GRID),
            "populated_tiles": len(tile_consistent_fractions),
            "minimum_populated_tiles": (
                MRAW_STATIC_GATE_MINIMUM_POPULATED_TILES
            ),
        }
    return {
        "valid": True,
        "sample_pixels": sample_count,
        "analysis_size": list(analysis_size),
        "median_ev_error_after_tag_normalization": median,
        "central_80_percent_span_ev": float(p90 - p10),
        "median_absolute_deviation_ev": float(
            np.median(np.abs(centered))
        ),
        "fraction_within_0_35_ev": float(
            np.mean(np.abs(centered) <= 0.35)
        ),
        "tile_grid": list(MRAW_STATIC_GATE_TILE_GRID),
        "minimum_valid_pixels_per_tile": (
            MRAW_STATIC_GATE_MINIMUM_TILE_PIXELS
        ),
        "populated_tiles": len(tile_consistent_fractions),
        "minimum_populated_tiles": (
            MRAW_STATIC_GATE_MINIMUM_POPULATED_TILES
        ),
        "minimum_tile_fraction_within_0_35_ev": min(
            tile_consistent_fractions
        ),
        "maximum_tile_central_80_percent_span_ev": max(tile_spans),
        "fitted_scale_to_primary": float(
            tag_scale_to_primary * (2.0**median)
        ),
    }


def _static_gate_decision(
    auxiliaries: Sequence[Dict[str, object]],
) -> Dict[str, object]:
    """Apply the conservative conjunctive scene-static gate."""

    if len(auxiliaries) != 2:
        raise ValueError("M-RAW static gate requires exactly two auxiliaries")
    radiometric_valid = all(
        bool(item["radiometric"].get("valid"))
        for item in auxiliaries
    )
    ecc_values = [
        item["registration"].get("ecc_correlation")
        for item in auxiliaries
    ]
    observed = {
        "minimum_phase_response": min(
            float(item["registration"]["phase_response"])
            for item in auxiliaries
        ),
        "minimum_ecc_correlation": (
            min(float(value) for value in ecc_values)
            if all(value is not None for value in ecc_values)
            else None
        ),
        "maximum_gradient_rmse_after": max(
            float(item["registration"]["gradient_rmse_after"])
            for item in auxiliaries
        ),
        "maximum_central_80_percent_span_ev": (
            max(
                float(
                    item["radiometric"][
                        "central_80_percent_span_ev"
                    ]
                )
                for item in auxiliaries
            )
            if radiometric_valid
            else None
        ),
        "minimum_fraction_within_0_35_ev": (
            min(
                float(
                    item["radiometric"]["fraction_within_0_35_ev"]
                )
                for item in auxiliaries
            )
            if radiometric_valid
            else None
        ),
        "maximum_absolute_median_ev_error": (
            max(
                abs(
                    float(
                        item["radiometric"][
                            "median_ev_error_after_tag_normalization"
                        ]
                    )
                )
                for item in auxiliaries
            )
            if radiometric_valid
            else None
        ),
        "minimum_tile_fraction_within_0_35_ev": (
            min(
                float(
                    item["radiometric"][
                        "minimum_tile_fraction_within_0_35_ev"
                    ]
                )
                for item in auxiliaries
            )
            if radiometric_valid
            else None
        ),
        "maximum_tile_central_80_percent_span_ev": (
            max(
                float(
                    item["radiometric"][
                        "maximum_tile_central_80_percent_span_ev"
                    ]
                )
                for item in auxiliaries
            )
            if radiometric_valid
            else None
        ),
        "maximum_registration_translation_fraction": max(
            float(
                item["registration"][
                    "translation_fraction_of_long_edge"
                ]
            )
            for item in auxiliaries
        ),
        "maximum_affine_linear_deviation": max(
            float(
                item["registration"][
                    "affine_linear_deviation_from_identity"
                ]
            )
            for item in auxiliaries
        ),
    }
    thresholds = dict(MRAW_STATIC_GATE_THRESHOLDS)
    checks = {
        "radiometric_samples": radiometric_valid,
        "phase_response": (
            observed["minimum_phase_response"]
            >= thresholds["minimum_phase_response"]
        ),
        "ecc_correlation": (
            observed["minimum_ecc_correlation"] is not None
            and observed["minimum_ecc_correlation"]
            >= thresholds["minimum_ecc_correlation"]
        ),
        "gradient_rmse": (
            observed["maximum_gradient_rmse_after"]
            <= thresholds["maximum_gradient_rmse_after"]
        ),
        "radiometric_span": (
            observed["maximum_central_80_percent_span_ev"] is not None
            and observed["maximum_central_80_percent_span_ev"]
            <= thresholds["maximum_central_80_percent_span_ev"]
        ),
        "radiometric_consistent_fraction": (
            observed["minimum_fraction_within_0_35_ev"] is not None
            and observed["minimum_fraction_within_0_35_ev"]
            >= thresholds["minimum_fraction_within_0_35_ev"]
        ),
        "radiometric_median": (
            observed["maximum_absolute_median_ev_error"] is not None
            and observed["maximum_absolute_median_ev_error"]
            <= thresholds["maximum_absolute_median_ev_error"]
        ),
        "tile_radiometric_consistent_fraction": (
            observed["minimum_tile_fraction_within_0_35_ev"] is not None
            and observed["minimum_tile_fraction_within_0_35_ev"]
            >= thresholds["minimum_tile_fraction_within_0_35_ev"]
        ),
        "tile_radiometric_span": (
            observed["maximum_tile_central_80_percent_span_ev"] is not None
            and observed["maximum_tile_central_80_percent_span_ev"]
            <= thresholds["maximum_tile_central_80_percent_span_ev"]
        ),
        "registration_translation": (
            observed["maximum_registration_translation_fraction"]
            <= thresholds["maximum_registration_translation_fraction"]
        ),
        "affine_linear_part": (
            observed["maximum_affine_linear_deviation"]
            <= thresholds["maximum_affine_linear_deviation"]
        ),
    }
    return {
        "passed": all(checks.values()),
        "checks": checks,
        "observed": observed,
        "thresholds": thresholds,
        "policy": "all_checks_must_pass_otherwise_primary_frame_fallback",
    }


def _smoothstep(values: np.ndarray, low: float, high: float) -> np.ndarray:
    position = np.clip((values - low) / (high - low), 0.0, 1.0)
    return position * position * (3.0 - 2.0 * position)


def _bracket_weight(luminance: np.ndarray) -> np.ndarray:
    safe = np.clip(luminance, 0.0, 1.0)
    weight = np.exp(-0.5 * ((safe - 0.38) / 0.24) ** 2)
    weight *= _smoothstep(safe, 0.002, 0.03)
    weight *= 1.0 - _smoothstep(safe, 0.82, 0.995)
    return weight


def _radiance_merge(
    normalized_frames: Sequence[np.ndarray],
    native_frames: Sequence[np.ndarray],
) -> np.ndarray:
    if len(normalized_frames) != 3 or len(native_frames) != 3:
        raise ValueError("radiance merge requires exactly three frames")
    weights = [_bracket_weight(_luminance(frame)) for frame in native_frames]
    denominator = np.sum(weights, axis=0)
    numerator = np.zeros_like(normalized_frames[0], dtype=np.float64)
    for frame, weight in zip(normalized_frames, weights):
        numerator += np.asarray(frame, dtype=np.float64) * weight[..., None]
    primary = np.asarray(normalized_frames[0], dtype=np.float64)
    merged = primary.copy()
    valid = denominator > 1e-8
    merged[valid] = numerator[valid] / denominator[valid, None]
    return merged.astype(normalized_frames[0].dtype, copy=False)


def fuse_mraw_linear_prophoto(
    frames: Sequence[np.ndarray],
    exposure_evs: Sequence[float],
) -> Tuple[np.ndarray, Dict[str, object]]:
    """Fuse one validated M-RAW triplet or return frame zero unchanged."""

    if len(frames) != 3 or len(exposure_evs) != 3:
        raise ValueError("M-RAW fusion requires three frames and three EVs")
    resolved_frames = [
        _require_rgb_float(f"M-RAW frame {index}", frame)
        for index, frame in enumerate(frames)
    ]
    if any(frame.shape != resolved_frames[0].shape for frame in resolved_frames):
        raise ValueError("M-RAW frames must have identical shapes")
    resolved_evs = [float(value) for value in exposure_evs]
    if not all(math.isfinite(value) for value in resolved_evs):
        raise ValueError("M-RAW exposure EVs must be finite")
    if not math.isclose(resolved_evs[0], 0.0, abs_tol=1e-12):
        raise ValueError("M-RAW primary exposure must be 0 EV")
    if not (resolved_evs[1] < 0.0 < resolved_evs[2]):
        raise ValueError(
            "M-RAW auxiliaries must be ordered dark then bright"
        )

    auxiliaries = []
    registered_frames = [resolved_frames[0]]
    fitted_scales = [1.0]
    for index in (1, 2):
        tag_scale = float(2.0 ** (-resolved_evs[index]))
        registered, registration = _register_frame(
            resolved_frames[0],
            resolved_frames[index],
            tag_scale,
        )
        radiometric = _radiometric_features(
            resolved_frames[0],
            registered,
            tag_scale,
        )
        fitted_scale = (
            float(radiometric["fitted_scale_to_primary"])
            if radiometric.get("valid")
            else tag_scale
        )
        registered_frames.append(registered)
        fitted_scales.append(fitted_scale)
        auxiliaries.append(
            {
                "frame_index": index,
                "exposure_ev": resolved_evs[index],
                "tag_scale_to_primary": tag_scale,
                "fitted_scale_to_primary": fitted_scale,
                "registration": registration,
                "radiometric": radiometric,
            }
        )

    gate = _static_gate_decision(auxiliaries)
    manifest: Dict[str, object] = {
        "requested": True,
        "fusion_enabled": bool(gate["passed"]),
        "method": "registered_exposure_weighted_radiance_merge",
        "input_space": "lens_corrected_linear_prophoto",
        "frame_order": ["primary_0_ev", "dark_negative_ev", "bright_positive_ev"],
        "exposure_normalization": (
            "M-RAW tag EV refined by robust registered midtone median"
        ),
        "registration": (
            "phase_correlation_then_gradient_ecc_affine"
        ),
        "interpolation": "opencv_linear_border_reflect",
        "out_of_support_policy": (
            "auxiliary_weight_zero_primary_frame_only"
        ),
        "weights": {
            "center_luminance": 0.38,
            "sigma": 0.24,
            "black_fade": [0.002, 0.03],
            "highlight_fade": [0.82, 0.995],
        },
        "gate": gate,
        "auxiliaries": auxiliaries,
        "fallback": (
            None
            if gate["passed"]
            else "primary_frame_zero_unchanged"
        ),
        "independent_reimplementation": True,
        "calls_adobe_runtime": False,
    }
    if not gate["passed"]:
        return resolved_frames[0], manifest

    normalized = [
        frame * scale
        for frame, scale in zip(registered_frames, fitted_scales)
    ]
    merged = _radiance_merge(normalized, registered_frames)
    return merged, manifest
