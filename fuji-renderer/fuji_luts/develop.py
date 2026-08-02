"""Lightroom-compatible public develop-adjustment settings.

This module deliberately keeps the user-facing adjustment request separate
from the empirical RAW-development compatibility controls in the validation
renderer.  In particular, :attr:`DevelopSettings.exposure` models Lightroom's
``Exposure2012`` control; it is not an alias for the renderer's historical
``base_exposure_ev`` diagnostic.

White balance is represented with optional absolute Lightroom values.  A RAW
file's default Temperature and Tint are image-dependent, so ``None`` means
"leave the As Shot value unchanged".  Numeric zero cannot safely represent
that state.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any, Dict, Optional

import numpy as np

from .pv2012_tone_tables import (
    TONE_CURVES,
    TONE_CURVE_STRENGTH,
    TONE_KNOT_X,
)


TONE_CONTROL_MINIMUM = -100.0
TONE_CONTROL_MAXIMUM = 100.0
EXPOSURE_MINIMUM_EV = -5.0
EXPOSURE_MAXIMUM_EV = 5.0

# These broad bounds are a public-input safety gate, not a claim about a
# particular Lightroom build.  Ground-truth manifests record the exact range
# returned by Lightroom's live controller for every calibration run.
TEMPERATURE_MINIMUM_K = 2000.0
TEMPERATURE_MAXIMUM_K = 50000.0
TINT_MINIMUM = -150.0
TINT_MAXIMUM = 150.0

DEVELOP_PROCESS_MODEL = "lightroom-pv2012-independent-v6"

_PV2012_DISTRIBUTION_EPSILON = 2.0 ** -12
_PV2012_DISTRIBUTION_MINIMUM_LOG2 = (
    math.log2(_PV2012_DISTRIBUTION_EPSILON) + 1.0
)
_PV2012_DISTRIBUTION_QUANTILES = (
    0.0001,
    0.001,
    0.005,
    0.01,
    0.99,
    0.995,
    0.999,
    0.9999,
)
_PV2012_DISTRIBUTION_RED = 0.30000001192092896
_PV2012_DISTRIBUTION_GREEN = 0.5899999737739563
_PV2012_DISTRIBUTION_BLUE = 0.11000001430511475
# The compatibility renderer currently receives LibRaw linear ProPhoto before
# Camera Raw's unconditional image-dependent output-tone spline.  Positive
# Whites is unusually sensitive to that missing domain: applying its recovered
# scalar kernel directly is too weak for low-key scenes, while one fixed gain
# badly overexposes bright scenes.  This compact q99 compensation was fitted
# on three independent X-T5 RAWs and is zero for the bright held-out frame.
_PV2012_PLUS_WHITES_Q99_NEUTRAL_LOG2 = -0.55
_PV2012_PLUS_WHITES_MAX_COMPATIBILITY_EV = 1.85
_PV2012_PLUS_WHITES_COMPATIBILITY_POWER = 2.5


def _bounded_number(
    name: str,
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"{name} must be a real number")
    numeric = float(value)
    if not math.isfinite(numeric):
        raise ValueError(f"{name} must be finite")
    if numeric < minimum or numeric > maximum:
        raise ValueError(
            f"{name} must be between {minimum:g} and {maximum:g}"
        )
    return numeric


def _optional_bounded_number(
    name: str,
    value: Optional[float],
    minimum: float,
    maximum: float,
) -> Optional[float]:
    if value is None:
        return None
    return _bounded_number(name, value, minimum, maximum)


@dataclass(frozen=True)
class DevelopSettings:
    """One independent-renderer equivalent of Lightroom's Basic controls.

    Tone and color amounts use the same nominal units exposed by Lightroom's
    controller.  ``temperature`` is absolute Kelvin and ``tint`` is the
    absolute Lightroom tint coordinate.  Leaving either white-balance field
    as ``None`` preserves that component of the RAW's As Shot white balance.
    """

    exposure: float = 0.0
    contrast: float = 0.0
    highlights: float = 0.0
    shadows: float = 0.0
    whites: float = 0.0
    blacks: float = 0.0
    temperature: Optional[float] = None
    tint: Optional[float] = None
    vibrance: float = 0.0
    saturation: float = 0.0

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "exposure",
            _bounded_number(
                "exposure",
                self.exposure,
                EXPOSURE_MINIMUM_EV,
                EXPOSURE_MAXIMUM_EV,
            ),
        )
        for name in (
            "contrast",
            "highlights",
            "shadows",
            "whites",
            "blacks",
            "vibrance",
            "saturation",
        ):
            object.__setattr__(
                self,
                name,
                _bounded_number(
                    name,
                    getattr(self, name),
                    TONE_CONTROL_MINIMUM,
                    TONE_CONTROL_MAXIMUM,
                ),
            )
        object.__setattr__(
            self,
            "temperature",
            _optional_bounded_number(
                "temperature",
                self.temperature,
                TEMPERATURE_MINIMUM_K,
                TEMPERATURE_MAXIMUM_K,
            ),
        )
        object.__setattr__(
            self,
            "tint",
            _optional_bounded_number(
                "tint",
                self.tint,
                TINT_MINIMUM,
                TINT_MAXIMUM,
            ),
        )

    @property
    def is_default(self) -> bool:
        """Whether rendering must take the exact historical no-op path."""

        return (
            self.exposure == 0.0
            and self.contrast == 0.0
            and self.highlights == 0.0
            and self.shadows == 0.0
            and self.whites == 0.0
            and self.blacks == 0.0
            and self.temperature is None
            and self.tint is None
            and self.vibrance == 0.0
            and self.saturation == 0.0
        )

    @property
    def has_white_balance_adjustment(self) -> bool:
        return self.temperature is not None or self.tint is not None

    @property
    def has_tone_adjustment(self) -> bool:
        return any(
            value != 0.0
            for value in (
                self.exposure,
                self.contrast,
                self.highlights,
                self.shadows,
                self.whites,
                self.blacks,
            )
        )

    @property
    def has_color_adjustment(self) -> bool:
        return self.vibrance != 0.0 or self.saturation != 0.0

    def manifest(self) -> Dict[str, object]:
        """Return a stable, JSON-safe description of the requested controls."""

        return {
            "process_model": DEVELOP_PROCESS_MODEL,
            "exposure": self.exposure,
            "contrast": self.contrast,
            "highlights": self.highlights,
            "shadows": self.shadows,
            "whites": self.whites,
            "blacks": self.blacks,
            "temperature": self.temperature,
            "tint": self.tint,
            "vibrance": self.vibrance,
            "saturation": self.saturation,
            "white_balance_mode": (
                "as_shot"
                if not self.has_white_balance_adjustment
                else "absolute_lightroom_coordinates"
            ),
            "is_default": self.is_default,
        }


DEFAULT_DEVELOP_SETTINGS = DevelopSettings()


@dataclass(frozen=True)
class PV2012ImageStatistics:
    """RAW-dependent log-luminance descriptor used by Camera Raw.

    Camera Raw builds this unweighted distribution before evaluating several
    PV2012 tone controls.  Values are log2 luminance samples after excluding
    only the near-zero floor.  Keeping the descriptor explicit avoids
    recomputing a multi-megapixel quantile partition for every independent
    slider probe.
    """

    q0001_log2: float
    q001_log2: float
    q005_log2: float
    q01_log2: float
    q99_log2: float
    q995_log2: float
    q999_log2: float
    q9999_log2: float
    included_sample_count: int

    def manifest(self) -> Dict[str, object]:
        return {
            "method": "camera_raw_pv2012_log_luminance_distribution",
            "epsilon": _PV2012_DISTRIBUTION_EPSILON,
            "minimum_included_log2": _PV2012_DISTRIBUTION_MINIMUM_LOG2,
            "luminance_coefficients": [
                _PV2012_DISTRIBUTION_RED,
                _PV2012_DISTRIBUTION_GREEN,
                _PV2012_DISTRIBUTION_BLUE,
            ],
            "quantiles_log2": {
                "0.0001": self.q0001_log2,
                "0.001": self.q001_log2,
                "0.005": self.q005_log2,
                "0.01": self.q01_log2,
                "0.99": self.q99_log2,
                "0.995": self.q995_log2,
                "0.999": self.q999_log2,
                "0.9999": self.q9999_log2,
            },
            "included_sample_count": self.included_sample_count,
        }


_TONE_KNOT_X = np.asarray(TONE_KNOT_X, dtype=np.float64)
_TONE_SLIDER_ANCHORS = (-100, -50, 0, 50, 100)
_TONE_CURVES = {
    key: np.asarray(values, dtype=np.float64)
    for key, values in TONE_CURVES.items()
}
_TONE_CURVE_STRENGTH = dict(TONE_CURVE_STRENGTH)
_PV2012_YCC_RED = 0.2880859375
_PV2012_YCC_GREEN = 0.7119140625
_PV2012_YCC_RED_INVERSE = 1.423828125
_PV2012_YCC_GREEN_INVERSE = 0.576171875
_PV2012_YCC_BLUE_INVERSE = 4.0
def _validated_rgb(rgb: Any) -> np.ndarray:
    source = np.asarray(rgb)
    if source.ndim < 1 or source.shape[-1] != 3:
        raise ValueError("develop input must be an RGB array")
    if not np.issubdtype(source.dtype, np.floating):
        raise TypeError("develop input must use floating-point values")
    if np.any(~np.isfinite(source)):
        raise ValueError("develop input must contain only finite values")
    return source


def measure_pv2012_image_statistics(rgb: Any) -> PV2012ImageStatistics:
    """Measure Camera Raw's recovered image-distribution descriptor."""

    source = _validated_rgb(rgb)
    work = np.asarray(source, dtype=np.float64)
    luminance = np.maximum(
        0.0,
        _PV2012_DISTRIBUTION_RED * work[..., 0]
        + _PV2012_DISTRIBUTION_GREEN * work[..., 1]
        + _PV2012_DISTRIBUTION_BLUE * work[..., 2],
    )
    log_luminance = np.log2(
        luminance + _PV2012_DISTRIBUTION_EPSILON
    )
    included = log_luminance[
        log_luminance >= _PV2012_DISTRIBUTION_MINIMUM_LOG2
    ].reshape(-1)
    sample_count = int(included.size)
    if sample_count == 0:
        quantile_values = np.full(
            len(_PV2012_DISTRIBUTION_QUANTILES),
            math.log2(_PV2012_DISTRIBUTION_EPSILON),
            dtype=np.float64,
        )
    else:
        indices = np.asarray(
            [
                min(
                    int(math.floor(sample_count * quantile)),
                    sample_count - 1,
                )
                for quantile in _PV2012_DISTRIBUTION_QUANTILES
            ],
            dtype=np.int64,
        )
        partitioned = np.partition(included, indices)
        quantile_values = partitioned[indices]
    return PV2012ImageStatistics(
        *(
            float(value)
            for value in quantile_values
        ),
        included_sample_count=sample_count,
    )


def _smoothstep(
    edge_0: float,
    edge_1: float,
    value: np.ndarray,
) -> np.ndarray:
    coordinate = np.clip((value - edge_0) / (edge_1 - edge_0), 0.0, 1.0)
    return coordinate * coordinate * (3.0 - 2.0 * coordinate)


def _interpolated_tone_curve(
    control: str,
    amount: float,
) -> np.ndarray:
    """Interpolate a calibrated curve at an arbitrary slider position."""

    def anchor_curve(anchor: int) -> np.ndarray:
        if anchor == 0:
            return _TONE_KNOT_X
        curve = _TONE_CURVES[(control, anchor)]
        strength = _TONE_CURVE_STRENGTH.get((control, anchor), 1.0)
        return _TONE_KNOT_X + strength * (curve - _TONE_KNOT_X)

    if amount == 0.0:
        return _TONE_KNOT_X
    upper_index = int(
        np.searchsorted(_TONE_SLIDER_ANCHORS, amount, side="left")
    )
    if _TONE_SLIDER_ANCHORS[upper_index] == amount:
        anchor = _TONE_SLIDER_ANCHORS[upper_index]
        return anchor_curve(anchor)
    lower = _TONE_SLIDER_ANCHORS[upper_index - 1]
    upper = _TONE_SLIDER_ANCHORS[upper_index]
    lower_curve = anchor_curve(lower)
    upper_curve = anchor_curve(upper)
    fraction = (amount - lower) / (upper - lower)
    return lower_curve + fraction * (upper_curve - lower_curve)


def _curve_interpolator(curve: np.ndarray) -> Any:
    return lambda values: np.interp(
        np.clip(values, 0.0, 1.0),
        _TONE_KNOT_X,
        curve,
    )


def _apply_maximum_scale_curve(
    rgb: np.ndarray,
    curve: Any,
) -> np.ndarray:
    """Map the largest RGB component and scale the other components."""

    work = np.asarray(rgb, dtype=np.float64)
    maximum = np.max(work, axis=-1)
    mapped_maximum = curve(maximum)
    scale = np.ones_like(maximum)
    np.divide(
        mapped_maximum,
        maximum,
        out=scale,
        where=maximum > 1e-12,
    )
    result = work * scale[..., None]
    black = maximum <= 1e-12
    if np.any(black):
        result[black] = mapped_maximum[black, None]
    return np.clip(result, 0.0, 1.0)


def _apply_calibrated_tone_control(
    rgb: np.ndarray,
    control: str,
    amount: float,
    *,
    operation: str,
) -> np.ndarray:
    if amount == 0.0:
        return rgb
    curve = _curve_interpolator(
        _interpolated_tone_curve(control, amount)
    )
    if operation == "extrema":
        return np.clip(
            _apply_rgb_extrema_curve(rgb, curve),
            0.0,
            1.0,
        )
    if operation == "maximum_scale":
        return _apply_maximum_scale_curve(rgb, curve)
    raise ValueError(f"unsupported calibrated tone operation: {operation}")


def apply_pv2012_tone_controls(
    rgb: Any,
    settings: DevelopSettings,
) -> np.ndarray:
    """Apply Camera Raw's calibrated pre-profile PV2012 tone-map stage."""

    source = _validated_rgb(rgb)
    if not isinstance(settings, DevelopSettings):
        raise TypeError("settings must be a DevelopSettings instance")
    if all(
        value == 0.0
        for value in (
            settings.contrast,
            settings.highlights,
            settings.shadows,
            settings.blacks,
        )
    ):
        return source

    work = np.asarray(source, dtype=np.float64)
    for control, amount, operation in (
        ("contrast", settings.contrast, "extrema"),
        ("highlights", settings.highlights, "extrema"),
        ("shadows", settings.shadows, "maximum_scale"),
        ("blacks", settings.blacks, "extrema"),
    ):
        work = _apply_calibrated_tone_control(
            work,
            control,
            amount,
            operation=operation,
        )
    return work.astype(source.dtype, copy=False)


def _hue_preserving_highlight_clip(rgb: np.ndarray) -> np.ndarray:
    """Clamp values above one while retaining each channel's relative rank.

    Camera Raw's scalar exposure kernel sorts the channel extrema, clips or
    rolls those extrema, and reconstructs the middle channel at its original
    relative position.  For the no-extra-rolloff case this vector form is
    equivalent and avoids the hue skews caused by independent channel clips.
    """

    source = np.asarray(rgb, dtype=np.float64)
    maximum = np.max(source, axis=-1)
    over = maximum > 1.0
    if not np.any(over):
        return source

    minimum = np.min(source, axis=-1)
    span = maximum - minimum
    clipped_minimum = np.minimum(minimum, 1.0)
    clipped_maximum = np.minimum(maximum, 1.0)
    relative = np.zeros_like(source)
    np.divide(
        source - minimum[..., None],
        span[..., None],
        out=relative,
        where=span[..., None] > 1e-12,
    )
    reconstructed = (
        clipped_minimum[..., None]
        + relative
        * (clipped_maximum - clipped_minimum)[..., None]
    )
    flat = span <= 1e-12
    if np.any(flat):
        reconstructed[flat] = clipped_maximum[flat, None]
    result = source.copy()
    result[over] = reconstructed[over]
    return result


def _exposure_rolloff_segment(
    encoded: np.ndarray,
    stops: float,
    *,
    inverse: bool,
) -> np.ndarray:
    """Evaluate one recovered Camera Raw two-stop exposure segment."""

    z = 2.0 ** (stops / 2.2)
    x_0 = 0.5 / z
    width = 1.0 - x_0
    slope_0 = z
    slope_1 = max(0.1, 1.0 / (1.0 + 12.0 * (z - 1.0)))

    def hermite(coordinate: np.ndarray) -> np.ndarray:
        coordinate_2 = coordinate * coordinate
        coordinate_3 = coordinate_2 * coordinate
        return (
            (2.0 * coordinate_3 - 3.0 * coordinate_2 + 1.0) * 0.5
            + (
                coordinate_3
                - 2.0 * coordinate_2
                + coordinate
            )
            * width
            * slope_0
            + (-2.0 * coordinate_3 + 3.0 * coordinate_2)
            + (coordinate_3 - coordinate_2) * width * slope_1
        )

    if not inverse:
        coordinate = np.clip((encoded - x_0) / width, 0.0, 1.0)
        return np.where(
            encoded < x_0,
            z * encoded,
            hermite(coordinate),
        )

    # The Hermite branch is monotonic.  A fixed bisection count is both
    # deterministic and more stable near its flattened highlight endpoint
    # than solving the cubic with generic polynomial roots.
    lower = np.zeros_like(encoded)
    upper = np.ones_like(encoded)
    for _ in range(24):
        middle = (lower + upper) * 0.5
        below = hermite(middle) < encoded
        lower = np.where(below, middle, lower)
        upper = np.where(below, upper, middle)
    coordinate = (lower + upper) * 0.5
    inverse_high = x_0 + width * coordinate
    return np.where(encoded < 0.5, encoded / z, inverse_high)


def _exposure_rolloff_curve(
    values: np.ndarray,
    stops: float,
) -> np.ndarray:
    """Apply Camera Raw's recovered signed exposure shoulder.

    The normal positive PV2012 pixel path uses the rational rolloff recovered
    from Camera Raw's CPU kernel.  It preserves the white endpoint while
    retaining an exact ``2**stops`` gain in the low linear range.  Negative
    exposure retains the separately recovered segmented inverse path until
    Camera Raw's initial negative-exposure partition is fully characterized.
    """

    if stops == 0.0:
        return values
    if stops > 0.0:
        work = np.clip(
            np.asarray(values, dtype=np.float64),
            0.0,
            1.0,
        )
        gain_squared = 2.0 ** (2.0 * stops)
        return work * np.sqrt(
            gain_squared
            / (1.0 + (gain_squared - 1.0) * work * work)
        )

    encoded = np.power(
        np.clip(np.asarray(values, dtype=np.float64), 0.0, 1.0),
        1.0 / 2.2,
    )
    magnitude = abs(float(stops))
    segments = [
        min(max(magnitude - 2.0 * index, 0.0), 2.0)
        for index in range(4)
    ]
    indices = range(4) if stops > 0.0 else range(3, -1, -1)
    for index in indices:
        segment_stops = segments[index]
        if segment_stops == 0.0:
            continue
        encoded = _exposure_rolloff_segment(
            encoded,
            segment_stops,
            inverse=stops < 0.0,
        )
    return np.power(np.clip(encoded, 0.0, 1.0), 2.2)


def _apply_rgb_extrema_curve(
    rgb: np.ndarray,
    curve: Any,
) -> np.ndarray:
    """Map RGB extrema and retain the middle channel's relative position."""

    work = np.asarray(rgb, dtype=np.float64)
    minimum = np.min(work, axis=-1)
    maximum = np.max(work, axis=-1)
    mapped_minimum = curve(minimum)
    mapped_maximum = curve(maximum)
    span = maximum - minimum
    scale = np.zeros_like(span)
    np.divide(
        mapped_maximum - mapped_minimum,
        span,
        out=scale,
        where=span > 1e-12,
    )
    result = (
        mapped_minimum[..., None]
        + (work - minimum[..., None]) * scale[..., None]
    )
    gray = span <= 1e-12
    if np.any(gray):
        result[gray] = mapped_maximum[gray, None]
    return result


def _apply_exposure_rolloff_rgb(
    rgb: np.ndarray,
    stops: float,
) -> np.ndarray:
    return _apply_rgb_extrema_curve(
        rgb,
        lambda values: _exposure_rolloff_curve(values, stops),
    )


def _apply_minus_whites(rgb: np.ndarray, normalized: float) -> np.ndarray:
    """Apply the calibrated negative-Whites compatibility kernel.

    Camera Raw's recovered native scalar is extrema-mapped.  On the
    independent LibRaw input domain, a bounded luminance carrier reproduces
    Lightroom's exported X-T5 effect substantially more closely across all
    calibration scenes while retaining the recovered exponent.
    """

    exponent = 3.0 ** (normalized / 2.0)
    luminance = (
        rgb[..., 0]
        + 2.0 * rgb[..., 1]
        + rgb[..., 2]
    ) * 0.25
    scale = (
        np.power(np.clip(luminance, 0.0, 1.0), exponent)
        + 1.0
        - luminance
    )
    return np.clip(rgb * scale[..., None], 0.0, 1.0)


def _apply_plus_whites(
    rgb: np.ndarray,
    normalized: float,
    *,
    direct_exposure: float,
    residual_rolloff: float,
    statistics: PV2012ImageStatistics,
) -> np.ndarray:
    """Apply Camera Raw's RAW-dependent positive-Whites extrema warp."""

    distribution_pivot = (
        statistics.q99_log2
        - min(
            (statistics.q99_log2 - statistics.q01_log2) / 5.0,
            1.0,
        )
    )
    pivot_input = float(
        np.clip(
            2.0 ** (direct_exposure + distribution_pivot),
            0.0,
            1.0,
        )
    )
    clip_base = float(
        np.clip(
            _exposure_rolloff_curve(
                np.asarray(pivot_input, dtype=np.float64),
                residual_rolloff,
            ),
            0.5,
            1.0,
        )
    )
    clip_exponent = (0.5 * normalized) ** math.sqrt(2.0)
    clip_value = clip_base ** clip_exponent
    clip_squared = clip_value * clip_value

    def curve(values: np.ndarray) -> np.ndarray:
        values = np.clip(values, 0.0, 1.0)
        return np.minimum(
            1.0,
            values
            * (1.0 + values / clip_squared)
            / (1.0 + values),
        )

    return np.clip(
        _apply_rgb_extrema_curve(rgb, curve),
        0.0,
        1.0,
    )


def apply_pv2012_exposure_controls(
    rgb: Any,
    settings: DevelopSettings,
    *,
    profile_baseline_exposure_ev: float = 0.0,
    image_statistics: Optional[PV2012ImageStatistics] = None,
) -> np.ndarray:
    """Apply Camera Raw's bounded Exposure and Whites stage.

    ``profile_baseline_exposure_ev`` is the selected DCP's
    ``BaselineExposureOffset``.  Camera Raw adds that offset to the public
    Exposure value before evaluating its bounded shoulder; it is not a plain
    linear multiplier.  Keeping it explicit also lets array-only callers use
    the public slider without inventing profile metadata.
    """

    source = _validated_rgb(rgb)
    if not isinstance(settings, DevelopSettings):
        raise TypeError("settings must be a DevelopSettings instance")
    baseline_exposure = _bounded_number(
        "profile_baseline_exposure_ev",
        profile_baseline_exposure_ev,
        -8.0,
        8.0,
    )
    if (
        image_statistics is not None
        and not isinstance(image_statistics, PV2012ImageStatistics)
    ):
        raise TypeError(
            "image_statistics must be a PV2012ImageStatistics instance"
        )
    total_exposure = settings.exposure + baseline_exposure
    if (
        total_exposure == 0.0
        and settings.whites == 0.0
    ):
        return source

    work = np.asarray(source, dtype=np.float64)
    if total_exposure <= 0.0:
        # Camera Raw's initial negative-exposure partition is independent of
        # the recovered positive path and remains represented by its signed
        # bounded shoulder.
        if total_exposure != 0.0:
            work = _apply_exposure_rolloff_rgb(work, total_exposure)
        if settings.whites < 0.0:
            work = _apply_minus_whites(
                work,
                -settings.whites / 50.0,
            )
        elif settings.whites > 0.0:
            statistics = (
                measure_pv2012_image_statistics(source)
                if image_statistics is None
                else image_statistics
            )
            work = _apply_plus_whites(
                work,
                settings.whites / 50.0,
                direct_exposure=0.0,
                residual_rolloff=0.0,
                statistics=statistics,
            )
        return work.astype(source.dtype, copy=False)

    statistics = (
        measure_pv2012_image_statistics(source)
        if image_statistics is None
        else image_statistics
    )
    # Camera Raw measures how much linear headroom remains above its 99.99th
    # percentile, reserving one stop for the bounded shoulder.  Normalized
    # profile white is log2(1) == 0.
    direct_exposure = float(
        np.clip(
            -statistics.q9999_log2 - 1.0,
            0.0,
            total_exposure,
        )
    )
    residual_rolloff = total_exposure - direct_exposure
    normalized_whites = settings.whites / 50.0
    whites_kernel = 0.0
    if normalized_whites < 0.0:
        whites_kernel = -normalized_whites
        shifted = min(direct_exposure, whites_kernel)
        direct_exposure -= shifted
        residual_rolloff += shifted
    elif normalized_whites > 0.0:
        whites_kernel = -normalized_whites
        shifted = min(residual_rolloff, normalized_whites)
        residual_rolloff -= shifted
        direct_exposure += shifted
        # Fold the absent upstream output-tone domain into an equivalent
        # scene-dependent direct adjustment.  It vanishes for bright images
        # and is bounded below the two-stop Whites range.
        compatibility_distance = max(
            -statistics.q99_log2
            + _PV2012_PLUS_WHITES_Q99_NEUTRAL_LOG2,
            0.0,
        )
        compatibility_headroom = min(
            compatibility_distance * compatibility_distance,
            _PV2012_PLUS_WHITES_MAX_COMPATIBILITY_EV,
        )
        direct_exposure += compatibility_headroom * (
            settings.whites / 100.0
        ) ** _PV2012_PLUS_WHITES_COMPATIBILITY_POWER

    if direct_exposure != 0.0:
        work = _hue_preserving_highlight_clip(
            work * (2.0 ** direct_exposure)
        )
    if whites_kernel < 0.0:
        work = _apply_plus_whites(
            work,
            -whites_kernel,
            direct_exposure=direct_exposure,
            residual_rolloff=residual_rolloff,
            statistics=statistics,
        )
    if residual_rolloff != 0.0:
        work = _apply_exposure_rolloff_rgb(
            work,
            residual_rolloff,
        )
    if whites_kernel > 0.0:
        # The independent LibRaw/profile path lacks Camera Raw's exact
        # intermediate scale domain.  Applying the recovered negative kernel
        # after its bounded exposure stage reproduces the observed X-T5
        # effect substantially better while retaining the exact scalar warp.
        work = _apply_minus_whites(work, whites_kernel)

    return work.astype(source.dtype, copy=False)


def _rgb_to_hsv(rgb: np.ndarray) -> tuple:
    red, green, blue = (rgb[..., index] for index in range(3))
    value = np.maximum(red, np.maximum(green, blue))
    minimum = np.minimum(red, np.minimum(green, blue))
    gap = value - minimum
    saturation = np.zeros_like(value)
    nonzero = value > 0.0
    np.divide(gap, value, out=saturation, where=nonzero)

    hue = np.zeros_like(value)
    chromatic = gap > 0.0
    is_red = chromatic & (red == value)
    is_green = chromatic & ~is_red & (green == value)
    is_blue = chromatic & ~is_red & ~is_green
    hue[is_red] = (green[is_red] - blue[is_red]) / gap[is_red]
    hue[is_red & (hue < 0.0)] += 6.0
    hue[is_green] = (
        2.0 + (blue[is_green] - red[is_green]) / gap[is_green]
    )
    hue[is_blue] = (
        4.0 + (red[is_blue] - green[is_blue]) / gap[is_blue]
    )
    return hue, saturation, value


def _hsv_to_rgb(
    hue: np.ndarray,
    saturation: np.ndarray,
    value: np.ndarray,
) -> np.ndarray:
    hue = np.mod(hue, 6.0)
    sector = np.floor(hue).astype(np.int64)
    fraction = hue - sector
    low = value * (1.0 - saturation)
    falling = value * (1.0 - saturation * fraction)
    rising = value * (1.0 - saturation * (1.0 - fraction))
    output = np.empty(hue.shape + (3,), dtype=np.float64)
    choices = (
        (value, rising, low),
        (falling, value, low),
        (low, value, rising),
        (low, falling, value),
        (rising, low, value),
        (value, low, falling),
    )
    for index, channels in enumerate(choices):
        mask = sector == index
        for channel in range(3):
            output[..., channel][mask] = channels[channel][mask]
    return output


def _apply_pv2012_ycc_chroma_scale(
    rgb: np.ndarray,
    scale: np.ndarray,
) -> np.ndarray:
    """Round-trip through Camera Raw's recovered bounded YCC shader."""

    luminance = np.clip(
        _PV2012_YCC_RED * rgb[..., 0]
        + _PV2012_YCC_GREEN * rgb[..., 1],
        0.0,
        1.0,
    )
    saturation_1 = scale / _PV2012_YCC_RED_INVERSE
    saturation_2 = scale / _PV2012_YCC_BLUE_INVERSE
    chroma_1 = np.clip(
        (rgb[..., 0] - luminance) * saturation_1 + 0.5,
        0.0,
        1.0,
    )
    chroma_2 = np.clip(
        (rgb[..., 2] - luminance) * saturation_2 + 0.5,
        0.0,
        1.0,
    )
    centered_1 = chroma_1 - 0.5
    centered_2 = chroma_2 - 0.5
    result = np.empty_like(rgb)
    result[..., 0] = np.clip(
        luminance + _PV2012_YCC_RED_INVERSE * centered_1,
        0.0,
        1.0,
    )
    result[..., 1] = np.clip(
        luminance - _PV2012_YCC_GREEN_INVERSE * centered_1,
        0.0,
        1.0,
    )
    result[..., 2] = np.clip(
        luminance + _PV2012_YCC_BLUE_INVERSE * centered_2,
        0.0,
        1.0,
    )
    return result


def apply_pv2012_saturation_control(
    rgb: Any,
    settings: DevelopSettings,
) -> np.ndarray:
    """Apply global Saturation in Camera Raw's bounded YCC stage."""

    source = _validated_rgb(rgb)
    if not isinstance(settings, DevelopSettings):
        raise TypeError("settings must be a DevelopSettings instance")
    if settings.saturation == 0.0:
        return source

    work = np.clip(
        np.asarray(source, dtype=np.float64),
        0.0,
        1.0,
    )
    result = _apply_pv2012_ycc_chroma_scale(
        work,
        np.full(
            work.shape[:-1],
            1.0 + settings.saturation / 100.0,
            dtype=np.float64,
        ),
    )
    return result.astype(source.dtype, copy=False)


def apply_pv2012_vibrance_control(
    rgb: Any,
    settings: DevelopSettings,
) -> np.ndarray:
    """Apply Camera Raw's recovered PV2012 Vibrance extrema shader."""

    source = _validated_rgb(rgb)
    if not isinstance(settings, DevelopSettings):
        raise TypeError("settings must be a DevelopSettings instance")
    if settings.vibrance == 0.0:
        return source

    work = np.clip(
        np.asarray(source, dtype=np.float64),
        0.0,
        1.0,
    )
    minimum = np.min(work, axis=-1)
    maximum = np.max(work, axis=-1)
    span = maximum - minimum
    middle = np.sum(work, axis=-1) - minimum - maximum
    relative_middle = np.zeros_like(span)
    np.divide(
        middle - minimum,
        span,
        out=relative_middle,
        where=span > 1e-12,
    )
    q = np.clip(relative_middle, 0.0, 1.0)

    smooth_maximum = maximum - (
        0.5 * span * q * q * (1.0 - q)
    )
    smooth_minimum = minimum + (
        0.5 * span * q * (1.0 - q) * (1.0 - q)
    )
    smooth_saturation = np.zeros_like(smooth_maximum)
    np.divide(
        smooth_maximum - smooth_minimum,
        smooth_maximum,
        out=smooth_saturation,
        where=smooth_maximum > 1e-12,
    )
    smooth_saturation = np.clip(smooth_saturation, 0.0, 1.0)

    hue, _, _ = _rgb_to_hsv(work)
    amount = settings.vibrance / 100.0
    black_coordinate = np.minimum(16.0 * smooth_maximum, 1.0)
    black_weight = black_coordinate * (2.0 - black_coordinate)

    if amount > 0.0:
        hue_weight = np.where(
            hue + 1.0 >= 6.0,
            hue - 5.0,
            hue + 1.0,
        )
        skin_weight = np.minimum(
            np.clip(hue_weight, 0.0, 1.0),
            np.clip(7.0 - 4.0 * hue_weight, 0.0, 1.0),
        )
        protection = skin_weight * (
            1.0 - smooth_saturation * smooth_saturation
        )
        effective = amount * (
            1.0 + (amount - 1.0) * protection
        )
        response = (
            effective
            * (
                (5.0 / 6.0)
                - (17.0 / 42.0) * protection
            )
            * (1.0 - smooth_minimum)
            * black_weight
        )
        adjusted_saturation = smooth_saturation / np.maximum(
            1.0 - response * (1.0 - smooth_saturation),
            1e-12,
        )
        saturation_weight = (
            smooth_saturation * (1.0 - smooth_saturation)
        )
        saturation_weight = saturation_weight * (
            2.0 - saturation_weight
        )
        adjusted_maximum = smooth_maximum * (
            1.0
            + 0.25
            * effective
            * black_weight
            * saturation_weight
            * (1.0 - np.minimum(smooth_maximum, 1.0))
        )
    else:
        saturation_weight = (
            smooth_saturation * (1.0 - smooth_saturation)
        )
        luminance_response = (
            (-amount)
            * black_weight
            * saturation_weight
            * (2.0 - saturation_weight)
        )
        adjusted_saturation = (
            smooth_saturation
            * (
                1.0
                + amount
                + (-amount)
                * smooth_saturation
                * (0.5 * smooth_saturation + 0.5)
                * black_weight
            )
            * (1.0 + 0.25 * amount)
        )
        adjusted_maximum = smooth_maximum * (
            1.0
            - luminance_response
            * (1.0 - np.minimum(smooth_maximum, 1.0))
        )

    adjusted_saturation = np.clip(adjusted_saturation, 0.0, 1.0)
    adjusted_maximum = np.clip(adjusted_maximum, 0.0, 1.0)
    adjusted_minimum = adjusted_maximum * (
        1.0 - adjusted_saturation
    )

    alpha = 0.5 * q * q * (1.0 - q)
    beta = 0.5 * q * (1.0 - q) * (1.0 - q)
    denominator = np.maximum(1.0 - alpha - beta, 1e-12)
    target_maximum = (
        adjusted_maximum * (1.0 - beta)
        - alpha * adjusted_minimum
    ) / denominator
    target_minimum = (
        adjusted_minimum * (1.0 - alpha)
        - beta * adjusted_maximum
    ) / denominator
    target_maximum = np.clip(target_maximum, 0.0, 1.0)
    target_minimum = np.clip(target_minimum, 0.0, 1.0)

    scale = np.zeros_like(span)
    np.divide(
        target_maximum - target_minimum,
        span,
        out=scale,
        where=span > 1e-12,
    )
    result = (
        target_minimum[..., None]
        + (work - minimum[..., None]) * scale[..., None]
    )
    neutral = span <= 1e-12
    if np.any(neutral):
        result[neutral] = work[neutral]
    return np.clip(result, 0.0, 1.0).astype(source.dtype, copy=False)


def apply_pv2012_color_controls(
    rgb: Any,
    settings: DevelopSettings,
) -> np.ndarray:
    """Apply both color controls without profile-stage interleaving.

    Renderers that support enhanced profiles call the two stage-specific
    functions at their native checkpoints.  This convenience function keeps
    the public array API useful for callers that have one already-profiled
    buffer.
    """

    source = _validated_rgb(rgb)
    if not isinstance(settings, DevelopSettings):
        raise TypeError("settings must be a DevelopSettings instance")
    if not settings.has_color_adjustment:
        return source
    saturated = apply_pv2012_saturation_control(source, settings)
    return apply_pv2012_vibrance_control(saturated, settings)
