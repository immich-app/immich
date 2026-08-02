"""Independent parser and evaluator for Fujifilm RAF lens metadata.

Fujifilm X-series RAF files carry an embedded TIFF at the RAF raw-data
offset.  Its ``0xf000`` IFD contains distortion, lateral chromatic-aberration,
and vignette tables:

``0xf00b`` (SRATIONAL array)
    A header, radial nodes, and geometric-distortion percentages.  X-T5
    mode zero fits corrected/output radius to distorted/source radius.

``0xf00f`` (SRATIONAL array)
    A header, radial nodes, red and blue radius deltas, then a repeated
    trailing header.

``0xf010`` (SRATIONAL array)
    ``(radius_reference, node_count)``, followed by ``node_count`` radius
    fractions and ``node_count`` light-transmission percentages.

``0xf011`` / ``0xf012`` (SLONG)
    Horizontal and vertical optical-center offsets in tenths of an active
    image pixel.

The parser below reads only bounded regions declared by the RAF header.  It
does not load or call Adobe code, LibRaw, ExifTool, or a lens-profile API.
Standard root-IFD Orientation tag ``0x0112`` is retained when present; the
four mirrored TIFF orientations are rejected if evaluation is requested.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path
import struct
from typing import Any, Dict, Optional, Sequence, Tuple

import numpy as np

from .raf import RAFFormatError, RAF_HEADER_SIZE, parse_raf_metadata


TAG_FUJI_RAW_IFD = 0xF000
TAG_FUJI_GEOMETRIC_DISTORTION_PARAMS = 0xF00B
TAG_FUJI_CHROMATIC_ABERRATION_PARAMS = 0xF00F
TAG_FUJI_VIGNETTING_PARAMS = 0xF010
TAG_FUJI_VIGNETTE_CENTER_X = 0xF011
TAG_FUJI_VIGNETTE_CENTER_Y = 0xF012
TAG_TIFF_ORIENTATION = 0x0112

TIFF_TYPE_SHORT = 3
TIFF_TYPE_SLONG = 9
TIFF_TYPE_SRATIONAL = 10
TIFF_TYPE_IFD = 13

MAX_TIFF_IFD_ENTRIES = 4096
MAX_FUJI_VIGNETTE_NODES = 256
MAX_FUJI_GEOMETRY_NODES = 256
MIN_FUJI_GEOMETRY_NODES = 4
MAX_FUJI_GEOMETRY_PERIMETER_PIXELS = 1_000_000

FUJI_WARP_FIT_SAMPLE_COUNT = 33
FUJI_GEOMETRY_TARGET = 0.99997
FUJI_GEOMETRY_SCALE_TOLERANCE = 1.0e-5
FUJI_GEOMETRY_SCALE_MAX_ITERATIONS = 30

VIGNETTE_MIN_TRANSMISSION = 0.0625
VIGNETTE_MAX_TRANSMISSION = 16.0
VIGNETTE_NODE_TRANSMISSION_CAP = 1.2

ORIENTATION_NATIVE = "native"
ORIENTATION_ROTATE_90_CW = "rotate_90_cw"
ORIENTATION_ROTATE_180 = "rotate_180"
ORIENTATION_ROTATE_90_CCW = "rotate_90_ccw"
VIGNETTE_ORIENTATIONS = (
    ORIENTATION_NATIVE,
    ORIENTATION_ROTATE_90_CW,
    ORIENTATION_ROTATE_180,
    ORIENTATION_ROTATE_90_CCW,
)
TIFF_ORIENTATION_TO_VIGNETTE_ORIENTATION = {
    1: ORIENTATION_NATIVE,
    3: ORIENTATION_ROTATE_180,
    6: ORIENTATION_ROTATE_90_CW,
    8: ORIENTATION_ROTATE_90_CCW,
}
TIFF_MIRRORED_ORIENTATIONS = (2, 4, 5, 7)


# These addresses document the static evidence behind this independent
# implementation.  They are not called at runtime.
CAMERA_RAW_STATIC_ANALYSIS: Dict[str, object] = {
    "camera_raw_version": "9.1.0.10",
    "camera_raw_sha256": (
        "f3f05149271f66979aeed0b06594bdf52fd19615eb8999a9533dae722e761048"
    ),
    "fuji_tag_parser_va": "0x1814cc45f",
    "fuji_distortion_tag_parser_va": "0x1814cc416",
    "fuji_chromatic_aberration_tag_parser_va": "0x1814cc4ec",
    "fuji_warp_pair_builder_va": "0x181838d30",
    "odd_polynomial_fit_va": "0x1817d2720",
    "odd_polynomial_evaluator_va": "0x1817d4030",
    "odd_polynomial_compose_refit_va": "0x1817d4070",
    "geometry_scale_solver_va": "0x1817d2b20",
    "geometry_scale_call_va": "0x1817d224a",
    "geometry_scale_baker_va": "0x1817d3a79",
    "red_ca_compose_call_va": "0x1817d234c",
    "blue_ca_compose_call_va": "0x1817d235a",
    "fuji_vignette_builder_va": "0x1818392d0",
    "piecewise_gain_evaluator_va": "0x180baa530",
    "piecewise_linear_evaluator_va": "0x18010ce80",
    "method": "static_analysis_only",
}


def vignette_orientation_from_tiff(value: int) -> str:
    """Map an unmirrored TIFF Orientation value to a vignette rotation.

    Mirrored TIFF orientations are valid metadata, but a radial center offset
    must be reflected as well as rotated.  This module deliberately rejects
    those values at evaluation time until that geometry is implemented.
    """

    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < 1
        or value > 8
    ):
        raise RAFFormatError(
            "TIFF Orientation must be an integer from 1 through 8"
        )
    orientation = TIFF_ORIENTATION_TO_VIGNETTE_ORIENTATION.get(value)
    if orientation is None:
        raise RAFFormatError(
            f"mirrored TIFF Orientation {value} is not supported for "
            "vignette evaluation"
        )
    return orientation


@dataclass(frozen=True)
class SignedRational:
    """One bounded TIFF SRATIONAL value, retained without losing precision."""

    numerator: int
    denominator: int

    def __post_init__(self) -> None:
        if self.denominator == 0:
            raise RAFFormatError(
                "Fuji embedded lens profile has a zero rational denominator"
            )

    @property
    def value(self) -> float:
        return self.numerator / self.denominator

    def manifest_value(self) -> Dict[str, object]:
        return {
            "numerator": self.numerator,
            "denominator": self.denominator,
            "value": self.value,
        }


@dataclass(frozen=True)
class OddRadialPolynomial:
    """Degree-seven odd radial mapping ``r -> c0*r+c1*r^3+...``."""

    coefficients: Tuple[float, float, float, float]

    def __post_init__(self) -> None:
        if len(self.coefficients) != 4:
            raise ValueError(
                "an odd degree-seven radial polynomial needs 4 coefficients"
            )
        coefficients = tuple(float(value) for value in self.coefficients)
        if not all(math.isfinite(value) for value in coefficients):
            raise ValueError("radial polynomial coefficients must be finite")
        object.__setattr__(self, "coefficients", coefficients)

    @classmethod
    def identity(cls) -> "OddRadialPolynomial":
        return cls((1.0, 0.0, 0.0, 0.0))

    @classmethod
    def fit(
        cls,
        input_radii: Any,
        output_radii: Any,
    ) -> "OddRadialPolynomial":
        """Least-squares fit using Camera Raw's ``[r,r^3,r^5,r^7]`` basis."""

        inputs = np.asarray(input_radii, dtype=np.float64)
        outputs = np.asarray(output_radii, dtype=np.float64)
        if inputs.ndim != 1 or outputs.ndim != 1 or inputs.shape != outputs.shape:
            raise ValueError(
                "radial fit inputs and outputs must be equal-length vectors"
            )
        if inputs.size < MIN_FUJI_GEOMETRY_NODES:
            raise ValueError("radial fit requires at least four samples")
        if not np.all(np.isfinite(inputs)) or not np.all(np.isfinite(outputs)):
            raise ValueError("radial fit samples must be finite")
        if np.array_equal(inputs, outputs):
            return cls.identity()

        squared = inputs * inputs
        design = np.column_stack(
            (
                inputs,
                inputs * squared,
                inputs * squared * squared,
                inputs * squared * squared * squared,
            )
        )
        coefficients, _, rank, _ = np.linalg.lstsq(design, outputs, rcond=None)
        if rank != 4:
            raise RAFFormatError(
                "Fuji embedded lens radial samples do not determine a "
                "degree-seven odd polynomial"
            )
        # Remove meaningless floating-point dust so identity components stay
        # exactly zero through repeated fit/compose operations.
        coefficients[np.abs(coefficients) < 1.0e-15] = 0.0
        return cls(tuple(float(value) for value in coefficients))

    @property
    def is_identity(self) -> bool:
        return self.coefficients == (1.0, 0.0, 0.0, 0.0)

    def evaluate(self, radius: Any) -> Any:
        query = np.asarray(radius, dtype=np.float64)
        squared = query * query
        c0, c1, c2, c3 = self.coefficients
        result = query * (
            c0 + squared * (c1 + squared * (c2 + squared * c3))
        )
        if np.ndim(radius) == 0:
            return float(result)
        return result

    def radial_scale(self, radius: Any) -> Any:
        """Return ``p(r)/r``, including the analytic value ``c0`` at zero."""

        query = np.asarray(radius, dtype=np.float64)
        squared = query * query
        c0, c1, c2, c3 = self.coefficients
        result = c0 + squared * (c1 + squared * (c2 + squared * c3))
        if np.ndim(radius) == 0:
            return float(result)
        return result

    def bake_coordinate_scale(self, scale: float) -> "OddRadialPolynomial":
        """Return ``p(scale*r)`` using Camera Raw's coefficient bake."""

        scale = float(scale)
        if not math.isfinite(scale) or scale <= 0.0:
            raise ValueError("geometry coordinate scale must be finite and positive")
        c0, c1, c2, c3 = self.coefficients
        scale2 = scale * scale
        return OddRadialPolynomial(
            (
                c0 * scale,
                c1 * scale * scale2,
                c2 * scale * scale2 * scale2,
                c3 * scale * scale2 * scale2 * scale2,
            )
        )

    def manifest_value(self) -> Dict[str, object]:
        return {
            "basis": ["r", "r^3", "r^5", "r^7"],
            "coefficients": list(self.coefficients),
            "identity": self.is_identity,
        }


def compose_odd_radial_polynomials(
    first: OddRadialPolynomial,
    second: OddRadialPolynomial,
) -> OddRadialPolynomial:
    """Refit ``second(first(r))`` at exactly 33 uniformly spaced samples."""

    # These are algebraically exact and avoid manufacturing coefficient dust
    # when a RAF omits a component or supplies an all-zero correction table.
    if first.is_identity:
        return second
    if second.is_identity:
        return first
    samples = np.arange(FUJI_WARP_FIT_SAMPLE_COUNT, dtype=np.float64) / 32.0
    outputs = second.evaluate(first.evaluate(samples))
    return OddRadialPolynomial.fit(samples, outputs)


def _validated_geometry_crop(
    crop: Sequence[int],
) -> Tuple[int, int, int, int]:
    if len(crop) != 4:
        raise ValueError(
            "DefaultCropArea must be a half-open top, left, bottom, right rectangle"
        )
    values = []
    for value in crop:
        if isinstance(value, bool) or not isinstance(value, (int, np.integer)):
            raise TypeError("DefaultCropArea coordinates must be integers")
        values.append(int(value))
    top, left, bottom, right = values
    if right <= left or bottom <= top:
        raise ValueError("DefaultCropArea must have positive width and height")
    perimeter = 2 * ((right - left) + (bottom - top))
    if perimeter > MAX_FUJI_GEOMETRY_PERIMETER_PIXELS:
        raise ValueError("DefaultCropArea perimeter exceeds the safety limit")
    return top, left, bottom, right


def _fuji_geometry_scale_details(
    polynomial: OddRadialPolynomial,
    default_crop_area: Sequence[int],
) -> Tuple[float, float, float]:
    """Return scale, unscaled maximum ``p(r)/r``, and its sampled radius."""

    top, left, bottom, right = _validated_geometry_crop(default_crop_area)
    width = right - left
    height = bottom - top
    center_x = (left + right - 1) / 2.0
    center_y = (top + bottom - 1) / 2.0
    radius_normalization = 2.0 / math.hypot(width, height)

    max_factor = -math.inf
    worst_radius = 0.0

    def scan(xs: np.ndarray, ys: np.ndarray) -> None:
        nonlocal max_factor, worst_radius
        radii = np.hypot(xs - center_x, ys - center_y) * radius_normalization
        factors = polynomial.radial_scale(radii)
        index = int(np.argmax(factors))
        candidate = float(factors[index])
        if candidate > max_factor:
            max_factor = candidate
            worst_radius = float(radii[index])

    xs = np.arange(left, right, dtype=np.float64)
    scan(xs, np.full(xs.shape, top, dtype=np.float64))
    if bottom - 1 != top:
        scan(xs, np.full(xs.shape, bottom - 1, dtype=np.float64))
    ys = np.arange(top, bottom, dtype=np.float64)
    scan(np.full(ys.shape, left, dtype=np.float64), ys)
    if right - 1 != left:
        scan(np.full(ys.shape, right - 1, dtype=np.float64), ys)

    if not math.isfinite(max_factor):
        raise RAFFormatError("Fuji geometry scale scan produced a non-finite value")
    target = FUJI_GEOMETRY_TARGET
    tolerance = FUJI_GEOMETRY_SCALE_TOLERANCE
    if abs(max_factor - target) < tolerance:
        return 1.0, max_factor, worst_radius

    if max_factor >= target:
        low, high = 0.5, 1.0
    else:
        low, high = 1.0, 2.0
    scale = 1.0
    for _ in range(FUJI_GEOMETRY_SCALE_MAX_ITERATIONS):
        scale = (low + high) / 2.0
        scaled_radius = scale * worst_radius
        q = scale * polynomial.radial_scale(scaled_radius)
        if abs(q - target) < tolerance:
            break
        if q >= target:
            high = scale
        else:
            low = scale
    return scale, max_factor, worst_radius


def fuji_explicit_geometry_scale(
    polynomial: OddRadialPolynomial,
    default_crop_area: Sequence[int],
) -> float:
    """Reproduce Fuji's explicit boundary-preserving geometry scale."""

    return _fuji_geometry_scale_details(polynomial, default_crop_area)[0]


def _validate_geometry_nodes(
    header: SignedRational,
    radii: Tuple[SignedRational, ...],
    value_arrays: Sequence[Tuple[SignedRational, ...]],
    name: str,
) -> None:
    count = len(radii)
    if not MIN_FUJI_GEOMETRY_NODES <= count <= MAX_FUJI_GEOMETRY_NODES:
        raise RAFFormatError(f"Fuji {name} node count is outside supported bounds")
    if header.numerator <= 0 or header.denominator != count:
        raise RAFFormatError(
            f"Fuji {name} header denominator must equal its positive node count"
        )
    for values in value_arrays:
        if len(values) != count:
            raise RAFFormatError(f"Fuji {name} value-array counts differ")
    previous = -math.inf
    for rational in radii:
        radius = rational.value
        if not math.isfinite(radius) or radius < 0.0:
            raise RAFFormatError(f"Fuji {name} radii must be finite and nonnegative")
        if radius <= previous:
            raise RAFFormatError(f"Fuji {name} radii must be strictly increasing")
        previous = radius
    if radii[-1].value <= 0.0:
        raise RAFFormatError(f"Fuji {name} needs a positive radius")
    for values in value_arrays:
        if not all(math.isfinite(value.value) for value in values):
            raise RAFFormatError(f"Fuji {name} values must be finite")


@dataclass(frozen=True)
class FujiDistortionTable:
    header: SignedRational
    radius_rationals: Tuple[SignedRational, ...]
    distortion_percent_rationals: Tuple[SignedRational, ...]

    def __post_init__(self) -> None:
        _validate_geometry_nodes(
            self.header,
            self.radius_rationals,
            (self.distortion_percent_rationals,),
            "GeometricDistortionParams",
        )
        for value in self.distortion_percent_rationals:
            if 1.0 + value.value / 100.0 <= 0.0:
                raise RAFFormatError(
                    "Fuji distortion percentage produces a nonpositive radius"
                )

    @property
    def node_count(self) -> int:
        return len(self.radius_rationals)

    @property
    def polynomial(self) -> OddRadialPolynomial:
        x = np.asarray([value.value for value in self.radius_rationals])
        d = np.asarray(
            [value.value for value in self.distortion_percent_rationals]
        )
        # X-T5 mode zero: fit corrected/output radius -> distorted/source.
        return OddRadialPolynomial.fit(x / (1.0 + d / 100.0), x)

    def manifest_value(self) -> Dict[str, object]:
        return {
            "header": self.header.manifest_value(),
            "node_count": self.node_count,
            "radius_rationals": [
                value.manifest_value() for value in self.radius_rationals
            ],
            "distortion_percent_rationals": [
                value.manifest_value()
                for value in self.distortion_percent_rationals
            ],
            "mode_0_pairs": {
                "input": "x / (1 + distortion_percent / 100)",
                "output": "x",
            },
            "polynomial": self.polynomial.manifest_value(),
        }


@dataclass(frozen=True)
class FujiChromaticAberrationTable:
    header: SignedRational
    radius_rationals: Tuple[SignedRational, ...]
    red_delta_rationals: Tuple[SignedRational, ...]
    blue_delta_rationals: Tuple[SignedRational, ...]
    trailing_header: SignedRational

    def __post_init__(self) -> None:
        _validate_geometry_nodes(
            self.header,
            self.radius_rationals,
            (self.red_delta_rationals, self.blue_delta_rationals),
            "ChromaticAberrationParams",
        )
        if self.trailing_header != self.header:
            raise RAFFormatError(
                "Fuji ChromaticAberrationParams trailing header does not "
                "repeat its leading header"
            )
        for channel, values in (
            ("red", self.red_delta_rationals),
            ("blue", self.blue_delta_rationals),
        ):
            if any(1.0 + value.value <= 0.0 for value in values):
                raise RAFFormatError(
                    f"Fuji {channel} chromatic-aberration delta produces a "
                    "nonpositive radius"
                )

    @property
    def node_count(self) -> int:
        return len(self.radius_rationals)

    def channel_polynomial(self, channel: str) -> OddRadialPolynomial:
        if channel == "red":
            deltas = self.red_delta_rationals
        elif channel == "blue":
            deltas = self.blue_delta_rationals
        elif channel == "green":
            return OddRadialPolynomial.identity()
        else:
            raise ValueError("Fuji CA channel must be red, green, or blue")
        x = np.asarray([value.value for value in self.radius_rationals])
        delta = np.asarray([value.value for value in deltas])
        return OddRadialPolynomial.fit(x, x * (1.0 + delta))

    def manifest_value(self) -> Dict[str, object]:
        return {
            "header": self.header.manifest_value(),
            "trailing_header": self.trailing_header.manifest_value(),
            "trailing_header_repeats_leading": True,
            "node_count": self.node_count,
            "radius_rationals": [
                value.manifest_value() for value in self.radius_rationals
            ],
            "red_delta_rationals": [
                value.manifest_value() for value in self.red_delta_rationals
            ],
            "blue_delta_rationals": [
                value.manifest_value() for value in self.blue_delta_rationals
            ],
            "pairs": {"input": "x", "output": "x * (1 + channel_delta)"},
            "red_polynomial": self.channel_polynomial("red").manifest_value(),
            "blue_polynomial": self.channel_polynomial("blue").manifest_value(),
        }


@dataclass(frozen=True)
class FujiLensWarp:
    """Resolved output-to-source radial warp for one half-open crop."""

    default_crop_area: Tuple[int, int, int, int]
    center_pixels: Tuple[float, float]
    radius_normalization: float
    geometry_scale: float
    unscaled_boundary_max: float
    boundary_worst_radius: float
    distortion_polynomial: OddRadialPolynomial
    red_polynomial: OddRadialPolynomial
    green_polynomial: OddRadialPolynomial
    blue_polynomial: OddRadialPolynomial

    def _channel_polynomial(self, channel: Any) -> OddRadialPolynomial:
        if channel in ("red", 0):
            return self.red_polynomial
        if channel in ("green", 1):
            return self.green_polynomial
        if channel in ("blue", 2):
            return self.blue_polynomial
        raise ValueError("Fuji warp channel must be red/green/blue or 0/1/2")

    def map_normalized_radius(self, radius: Any, channel: Any = "green") -> Any:
        return self._channel_polynomial(channel).evaluate(radius)

    def map_normalized_vectors(
        self,
        x: Any,
        y: Any,
        channel: Any = "green",
    ) -> Tuple[Any, Any]:
        x_values = np.asarray(x, dtype=np.float64)
        y_values = np.asarray(y, dtype=np.float64)
        x_values, y_values = np.broadcast_arrays(x_values, y_values)
        radius = np.hypot(x_values, y_values)
        scale = self._channel_polynomial(channel).radial_scale(radius)
        mapped_x = x_values * scale
        mapped_y = y_values * scale
        if np.ndim(x) == 0 and np.ndim(y) == 0:
            return float(mapped_x), float(mapped_y)
        return mapped_x, mapped_y

    def remap_coordinates(
        self,
        x: Any,
        y: Any,
        channel: Any = "green",
    ) -> Tuple[Any, Any]:
        """Map corrected-output pixel-center coordinates to source coordinates."""

        x_values = np.asarray(x, dtype=np.float64)
        y_values = np.asarray(y, dtype=np.float64)
        x_values, y_values = np.broadcast_arrays(x_values, y_values)
        if self._channel_polynomial(channel).is_identity:
            if np.ndim(x) == 0 and np.ndim(y) == 0:
                return float(x_values), float(y_values)
            return x_values.copy(), y_values.copy()
        normalized_x = (
            (x_values - self.center_pixels[0]) * self.radius_normalization
        )
        normalized_y = (
            (y_values - self.center_pixels[1]) * self.radius_normalization
        )
        source_x, source_y = self.map_normalized_vectors(
            normalized_x,
            normalized_y,
            channel,
        )
        source_x = self.center_pixels[0] + source_x / self.radius_normalization
        source_y = self.center_pixels[1] + source_y / self.radius_normalization
        if np.ndim(x) == 0 and np.ndim(y) == 0:
            return float(source_x), float(source_y)
        return source_x, source_y

    def remap_grid(
        self,
        channel: Any = "green",
        *,
        dtype: Any = np.float32,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Return dense absolute source-coordinate maps for the crop."""

        output_dtype = np.dtype(dtype)
        if output_dtype.kind != "f":
            raise TypeError("Fuji remap-grid dtype must be floating point")
        top, left, bottom, right = self.default_crop_area
        x, y = np.meshgrid(
            np.arange(left, right, dtype=np.float64),
            np.arange(top, bottom, dtype=np.float64),
        )
        source_x, source_y = self.remap_coordinates(x, y, channel)
        return (
            np.asarray(source_x, dtype=output_dtype),
            np.asarray(source_y, dtype=output_dtype),
        )

    def manifest_metadata(self) -> Dict[str, object]:
        return {
            "default_crop_area_half_open_top_left_bottom_right": list(
                self.default_crop_area
            ),
            "center_pixel_coordinates": list(self.center_pixels),
            "radius_normalization": self.radius_normalization,
            "explicit_geometry_scale": {
                "factor": self.geometry_scale,
                "unscaled_boundary_max": self.unscaled_boundary_max,
                "worst_sampled_radius": self.boundary_worst_radius,
                "target": FUJI_GEOMETRY_TARGET,
                "tolerance": FUJI_GEOMETRY_SCALE_TOLERANCE,
                "maximum_bisections": FUJI_GEOMETRY_SCALE_MAX_ITERATIONS,
                "perimeter_sampling": "every integer pixel on all four edges",
                "coefficient_bake": ["c0*s", "c1*s^3", "c2*s^5", "c3*s^7"],
            },
            "mapping": {
                "direction": "corrected_output_to_distorted_source",
                "composition": {
                    "red": "ca_red(distortion_scaled(r))",
                    "green": "distortion_scaled(r)",
                    "blue": "ca_blue(distortion_scaled(r))",
                    "refit_samples": "x=i/32 for i=0..32",
                },
                "distortion_scaled": self.distortion_polynomial.manifest_value(),
                "red": self.red_polynomial.manifest_value(),
                "green": self.green_polynomial.manifest_value(),
                "blue": self.blue_polynomial.manifest_value(),
            },
        }


@dataclass(frozen=True)
class FujiLensGeometryModel:
    """Parsed Fuji ``0xf00b`` distortion and ``0xf00f`` lateral-CA tables."""

    distortion: Optional[FujiDistortionTable] = None
    chromatic_aberration: Optional[FujiChromaticAberrationTable] = None
    center_x_tenths: int = 0
    center_y_tenths: int = 0
    active_image_size: Optional[Tuple[int, int]] = None
    active_crop_top_left: Optional[Tuple[int, int]] = None
    raw_image_full_size: Optional[Tuple[int, int]] = None
    source_path: Optional[str] = None
    source_file_size: Optional[int] = None
    raw_tiff_offset: Optional[int] = None
    raw_tiff_length: Optional[int] = None
    tiff_byte_order: Optional[str] = None
    center_x_tag_present: bool = False
    center_y_tag_present: bool = False
    camera_model: Optional[str] = None

    def __post_init__(self) -> None:
        if self.distortion is None and self.chromatic_aberration is None:
            raise RAFFormatError("Fuji lens geometry model contains no warp tables")
        if self.active_image_size is not None:
            width, height = self.active_image_size
            if (
                isinstance(width, bool)
                or isinstance(height, bool)
                or not isinstance(width, int)
                or not isinstance(height, int)
                or width <= 0
                or height <= 0
            ):
                raise RAFFormatError(
                    "Fuji lens geometry active image size must be positive integers"
                )

    @property
    def center_offset_pixels(self) -> Tuple[float, float]:
        return self.center_x_tenths / 10.0, self.center_y_tenths / 10.0

    def build_warp(
        self,
        default_crop_area: Optional[Sequence[int]] = None,
    ) -> FujiLensWarp:
        if default_crop_area is None:
            if self.active_image_size is None:
                raise RAFFormatError(
                    "DefaultCropArea or RAF RawImageCroppedSize is required "
                    "to build the Fuji lens warp"
                )
            width, height = self.active_image_size
            crop = (0, 0, height, width)
        else:
            crop = _validated_geometry_crop(default_crop_area)
        top, left, bottom, right = _validated_geometry_crop(crop)
        width = right - left
        height = bottom - top
        center = (
            (left + right - 1) / 2.0 + self.center_x_tenths / 10.0,
            (top + bottom - 1) / 2.0 + self.center_y_tenths / 10.0,
        )
        radius_normalization = 2.0 / math.hypot(width, height)

        raw_distortion = (
            OddRadialPolynomial.identity()
            if self.distortion is None
            else self.distortion.polynomial
        )
        if self.distortion is None:
            geometry_scale = 1.0
            maximum = 1.0
            worst_radius = 0.0
            scaled_distortion = raw_distortion
        else:
            geometry_scale, maximum, worst_radius = _fuji_geometry_scale_details(
                raw_distortion,
                crop,
            )
            scaled_distortion = raw_distortion.bake_coordinate_scale(
                geometry_scale
            )

        if self.chromatic_aberration is None:
            raw_red = OddRadialPolynomial.identity()
            raw_blue = OddRadialPolynomial.identity()
        else:
            raw_red = self.chromatic_aberration.channel_polynomial("red")
            raw_blue = self.chromatic_aberration.channel_polynomial("blue")
        # Camera Raw pre-scales distortion, then evaluates CA(distortion(r))
        # at x=i/32 and refits each final channel mapping.
        red = compose_odd_radial_polynomials(scaled_distortion, raw_red)
        blue = compose_odd_radial_polynomials(scaled_distortion, raw_blue)
        return FujiLensWarp(
            default_crop_area=(top, left, bottom, right),
            center_pixels=center,
            radius_normalization=radius_normalization,
            geometry_scale=geometry_scale,
            unscaled_boundary_max=maximum,
            boundary_worst_radius=worst_radius,
            distortion_polynomial=scaled_distortion,
            red_polynomial=red,
            green_polynomial=scaled_distortion,
            blue_polynomial=blue,
        )

    def remap_coordinates(
        self,
        x: Any,
        y: Any,
        channel: Any = "green",
        *,
        default_crop_area: Optional[Sequence[int]] = None,
    ) -> Tuple[Any, Any]:
        return self.build_warp(default_crop_area).remap_coordinates(x, y, channel)

    def manifest_metadata(
        self,
        default_crop_area: Optional[Sequence[int]] = None,
    ) -> Dict[str, object]:
        result: Dict[str, object] = {
            "source": "raf_embedded_fuji_ifd",
            "source_path": self.source_path,
            "source_file_size": self.source_file_size,
            "camera_model": self.camera_model,
            "tiff": {
                "base_offset": self.raw_tiff_offset,
                "bounded_length": self.raw_tiff_length,
                "byte_order": self.tiff_byte_order,
            },
            "tags": {
                "geometric_distortion": "0xf00b",
                "chromatic_aberration": "0xf00f",
                "center_x": "0xf011",
                "center_y": "0xf012",
                "geometric_distortion_present": self.distortion is not None,
                "chromatic_aberration_present": (
                    self.chromatic_aberration is not None
                ),
                "center_x_present": self.center_x_tag_present,
                "center_y_present": self.center_y_tag_present,
            },
            "center_tenths_pixels": [
                self.center_x_tenths,
                self.center_y_tenths,
            ],
            "distortion": (
                None if self.distortion is None else self.distortion.manifest_value()
            ),
            "chromatic_aberration": (
                None
                if self.chromatic_aberration is None
                else self.chromatic_aberration.manifest_value()
            ),
            "independent_reimplementation": dict(CAMERA_RAW_STATIC_ANALYSIS),
        }
        if default_crop_area is not None or self.active_image_size is not None:
            result["resolved_warp"] = self.build_warp(
                default_crop_area
            ).manifest_metadata()
        return result


@dataclass(frozen=True)
class FujiVignetteModel:
    """Camera Raw-compatible piecewise radial transmission model.

    Pixel coordinates use image-edge coordinates: the center of the first
    pixel is ``(0.5, 0.5)``.  ``active_image_size`` is the RAF-declared active
    image size before EXIF orientation.
    """

    radius_reference_pixels: int
    radius_fraction_rationals: Tuple[SignedRational, ...]
    transmission_percent_rationals: Tuple[SignedRational, ...]
    center_x_tenths: int = 0
    center_y_tenths: int = 0
    active_image_size: Optional[Tuple[int, int]] = None
    active_crop_top_left: Optional[Tuple[int, int]] = None
    raw_image_full_size: Optional[Tuple[int, int]] = None
    source_path: Optional[str] = None
    source_file_size: Optional[int] = None
    raw_tiff_offset: Optional[int] = None
    raw_tiff_length: Optional[int] = None
    tiff_byte_order: Optional[str] = None
    tiff_orientation: int = 1
    orientation_tag_present: bool = False
    center_x_tag_present: bool = False
    center_y_tag_present: bool = False
    camera_model: Optional[str] = None

    def __post_init__(self) -> None:
        if (
            isinstance(self.radius_reference_pixels, bool)
            or not isinstance(self.radius_reference_pixels, int)
            or self.radius_reference_pixels <= 0
        ):
            raise RAFFormatError(
                "Fuji vignette radius reference must be a positive integer"
            )

        node_count = len(self.radius_fraction_rationals)
        if not 2 <= node_count <= MAX_FUJI_VIGNETTE_NODES:
            raise RAFFormatError(
                "Fuji vignette node count is outside the supported bounds"
            )
        if len(self.transmission_percent_rationals) != node_count:
            raise RAFFormatError(
                "Fuji vignette radius and transmission node counts differ"
            )

        previous = -math.inf
        has_positive_radius = False
        for rational in self.radius_fraction_rationals:
            radius = rational.value
            if not math.isfinite(radius) or radius < 0.0:
                raise RAFFormatError(
                    "Fuji vignette radius fractions must be finite and "
                    "nonnegative"
                )
            if radius < previous:
                raise RAFFormatError(
                    "Fuji vignette radius fractions must be nondecreasing"
                )
            previous = radius
            has_positive_radius = has_positive_radius or radius > 0.0
        if not has_positive_radius:
            raise RAFFormatError(
                "Fuji vignette profile has no positive radius node"
            )

        for rational in self.transmission_percent_rationals:
            if not math.isfinite(rational.value):
                raise RAFFormatError(
                    "Fuji vignette transmissions must be finite"
                )

        for name, value in (
            ("active image", self.active_image_size),
            ("full raw image", self.raw_image_full_size),
        ):
            if value is None:
                continue
            if (
                len(value) != 2
                or isinstance(value[0], bool)
                or isinstance(value[1], bool)
                or not isinstance(value[0], int)
                or not isinstance(value[1], int)
                or value[0] <= 0
                or value[1] <= 0
            ):
                raise RAFFormatError(
                    f"Fuji vignette {name} size must contain positive integers"
                )

        if (
            isinstance(self.tiff_orientation, bool)
            or not isinstance(self.tiff_orientation, int)
            or self.tiff_orientation < 1
            or self.tiff_orientation > 8
        ):
            raise RAFFormatError(
                "TIFF Orientation must be an integer from 1 through 8"
            )

    @property
    def node_count(self) -> int:
        return len(self.radius_fraction_rationals)

    @property
    def radius_fraction_nodes(self) -> Tuple[float, ...]:
        return tuple(value.value for value in self.radius_fraction_rationals)

    @property
    def radius_nodes_pixels(self) -> Tuple[float, ...]:
        reference = float(self.radius_reference_pixels)
        return tuple(
            reference * value.value
            for value in self.radius_fraction_rationals
        )

    @property
    def transmission_percent_nodes(self) -> Tuple[float, ...]:
        return tuple(
            value.value for value in self.transmission_percent_rationals
        )

    @property
    def transmission_nodes(self) -> Tuple[float, ...]:
        # Camera Raw first caps the raw table values at 1.2.  Its piecewise
        # builder then constrains every positive-radius knot to be no greater
        # than the preceding knot, starting from the leading value 1.0.
        return tuple(
            min(
                VIGNETTE_NODE_TRANSMISSION_CAP,
                value.value / 100.0,
            )
            for value in self.transmission_percent_rationals
        )

    @property
    def center_offset_pixels(self) -> Tuple[float, float]:
        return (self.center_x_tenths / 10.0, self.center_y_tenths / 10.0)

    @property
    def active_center_pixels(self) -> Tuple[float, float]:
        if self.active_image_size is None:
            raise RAFFormatError(
                "RAF RawImageCroppedSize is required to locate the vignette "
                "center"
            )
        width, height = self.active_image_size
        offset_x, offset_y = self.center_offset_pixels
        return (width / 2.0 + offset_x, height / 2.0 + offset_y)

    @property
    def default_orientation(self) -> str:
        """Return the RAF orientation, rejecting unsupported reflections."""

        return vignette_orientation_from_tiff(self.tiff_orientation)

    def _piecewise_points(self) -> Tuple[np.ndarray, np.ndarray]:
        """Return knots after Camera Raw's leading point/duplicate handling."""

        radii = [0.0]
        values = [1.0]
        previous_transmission = 1.0
        for radius, transmission in zip(
            self.radius_nodes_pixels,
            self.transmission_nodes,
        ):
            # The Adobe builder skips nonpositive embedded radii.  Negative
            # radii are rejected while constructing this model, so zero is
            # the only possible skipped value here.
            if radius <= 0.0:
                continue
            transmission = min(previous_transmission, transmission)
            radii.append(radius)
            values.append(transmission)
            previous_transmission = transmission

        # dng_piecewise_linear averages values at identical x coordinates.
        unique_radii = []
        unique_values = []
        index = 0
        while index < len(radii):
            end = index + 1
            while end < len(radii) and radii[end] == radii[index]:
                end += 1
            unique_radii.append(radii[index])
            unique_values.append(sum(values[index:end]) / (end - index))
            index = end
        return (
            np.asarray(unique_radii, dtype=np.float64),
            np.asarray(unique_values, dtype=np.float64),
        )

    def transmission_at_radius_pixels(self, radius: Any) -> Any:
        """Evaluate un-clamped transmission at a radial pixel distance."""

        query = np.asarray(radius, dtype=np.float64)
        query = np.maximum(query, 0.0)
        radii, values = self._piecewise_points()
        result = np.interp(query, radii, values)
        if np.ndim(radius) == 0:
            return float(result)
        return result

    def gain_at_squared_radius_pixels(self, squared_radius: Any) -> Any:
        """Evaluate Camera Raw's vignette gain from squared pixel radius."""

        squared = np.asarray(squared_radius, dtype=np.float64)
        radius = np.sqrt(np.maximum(squared, 0.0))
        transmission = self.transmission_at_radius_pixels(radius)
        bounded = np.clip(
            transmission,
            VIGNETTE_MIN_TRANSMISSION,
            VIGNETTE_MAX_TRANSMISSION,
        )
        gain = np.reciprocal(bounded)
        if np.ndim(squared_radius) == 0:
            return float(gain)
        return gain

    def gain_at_radius_pixels(self, radius: Any) -> Any:
        """Evaluate Camera Raw's vignette gain from radial pixel distance."""

        query = np.asarray(radius, dtype=np.float64)
        query = np.maximum(query, 0.0)
        return self.gain_at_squared_radius_pixels(query * query)

    def _oriented_geometry(
        self,
        orientation: str,
    ) -> Tuple[Tuple[float, float], Tuple[int, int]]:
        if orientation not in VIGNETTE_ORIENTATIONS:
            choices = ", ".join(VIGNETTE_ORIENTATIONS)
            raise ValueError(
                f"unsupported vignette orientation {orientation!r}; "
                f"expected one of {choices}"
            )
        if self.active_image_size is None:
            raise RAFFormatError(
                "RAF RawImageCroppedSize is required to construct a vignette "
                "gain map"
            )

        width, height = self.active_image_size
        center_x, center_y = self.active_center_pixels
        if orientation == ORIENTATION_NATIVE:
            return (center_x, center_y), (width, height)
        if orientation == ORIENTATION_ROTATE_90_CW:
            return (height - center_y, center_x), (height, width)
        if orientation == ORIENTATION_ROTATE_180:
            return (width - center_x, height - center_y), (width, height)
        return (center_y, width - center_x), (height, width)

    def gain_map(
        self,
        output_shape: Sequence[int],
        *,
        orientation: Optional[str] = None,
        source_rect: Optional[Tuple[float, float, float, float]] = None,
        dtype: Any = np.float32,
    ) -> np.ndarray:
        """Return a radial gain map for a full image or an oriented crop.

        ``source_rect`` is ``(left, top, width, height)`` in oriented,
        full-resolution active-image edge coordinates.  Omitting it maps the
        complete active image to ``output_shape``.  This representation also
        handles deterministic downsampling without guessing a focal length or
        pixel pitch: both the stored knots and the query radius remain in
        active-image pixels.  For a geometry-warped lens, evaluate the
        vignette at the distorted/source coordinate (or apply this map before
        the warp); a post-warp output coordinate is not interchangeable.
        """

        try:
            output_height = int(output_shape[0])
            output_width = int(output_shape[1])
        except (IndexError, TypeError, ValueError) as exc:
            raise ValueError(
                "vignette output shape must contain height and width"
            ) from exc
        if (
            isinstance(output_shape[0], bool)
            or isinstance(output_shape[1], bool)
            or output_height != output_shape[0]
            or output_width != output_shape[1]
            or output_height <= 0
            or output_width <= 0
        ):
            raise ValueError(
                "vignette output height and width must be positive integers"
            )

        output_dtype = np.dtype(dtype)
        if output_dtype.kind != "f":
            raise TypeError("vignette gain-map dtype must be floating point")

        embedded_orientation = self.default_orientation
        if orientation is None:
            orientation = embedded_orientation
        center, oriented_size = self._oriented_geometry(orientation)
        oriented_width, oriented_height = oriented_size
        if source_rect is None:
            left = 0.0
            top = 0.0
            source_width = float(oriented_width)
            source_height = float(oriented_height)
        else:
            if len(source_rect) != 4:
                raise ValueError(
                    "vignette source_rect must be left, top, width, height"
                )
            left, top, source_width, source_height = map(float, source_rect)
            if not all(
                math.isfinite(value)
                for value in (left, top, source_width, source_height)
            ):
                raise ValueError("vignette source_rect values must be finite")
            if (
                left < 0.0
                or top < 0.0
                or source_width <= 0.0
                or source_height <= 0.0
                or left + source_width > oriented_width
                or top + source_height > oriented_height
            ):
                raise ValueError(
                    "vignette source_rect is outside the oriented active image"
                )

        step_x = source_width / output_width
        step_y = source_height / output_height
        x = (
            left
            + (np.arange(output_width, dtype=np.float64) + 0.5) * step_x
            - center[0]
        )
        x_squared = x * x
        result = np.empty(
            (output_height, output_width),
            dtype=output_dtype,
        )
        for row in range(output_height):
            y = top + (row + 0.5) * step_y - center[1]
            result[row] = self.gain_at_squared_radius_pixels(
                x_squared + y * y
            )
        return result

    def apply_linear(
        self,
        image: Any,
        *,
        orientation: Optional[str] = None,
        source_rect: Optional[Tuple[float, float, float, float]] = None,
    ) -> np.ndarray:
        """Multiply a floating-point linear image by the vignette gain map.

        Values are deliberately not clipped; highlight handling belongs to a
        later rendering stage.
        """

        pixels = np.asarray(image)
        if pixels.ndim < 2:
            raise ValueError("linear vignette input must have image dimensions")
        if pixels.dtype.kind != "f":
            raise TypeError(
                "linear vignette input must use a floating-point dtype"
            )
        gain_dtype = (
            np.float64 if pixels.dtype == np.dtype(np.float64) else np.float32
        )
        gain = self.gain_map(
            pixels.shape,
            orientation=orientation,
            source_rect=source_rect,
            dtype=gain_dtype,
        )
        broadcast_shape = gain.shape + (1,) * (pixels.ndim - 2)
        return pixels * gain.reshape(broadcast_shape)

    def manifest_metadata(self) -> Dict[str, object]:
        """Return JSON-compatible model inputs and algorithm provenance."""

        return {
            "source": "raf_embedded_fuji_ifd",
            "source_path": self.source_path,
            "source_file_size": self.source_file_size,
            "camera_model": self.camera_model,
            "tiff": {
                "base_offset": self.raw_tiff_offset,
                "bounded_length": self.raw_tiff_length,
                "byte_order": self.tiff_byte_order,
            },
            "tags": {
                "orientation": "0x0112",
                "vignetting_params": "0xf010",
                "center_x": "0xf011",
                "center_y": "0xf012",
                "orientation_present": self.orientation_tag_present,
                "center_x_present": self.center_x_tag_present,
                "center_y_present": self.center_y_tag_present,
            },
            "orientation": {
                "value": self.tiff_orientation,
                "present": self.orientation_tag_present,
                "defaulted_to_native": (
                    not self.orientation_tag_present
                ),
                "mirrored": (
                    self.tiff_orientation in TIFF_MIRRORED_ORIENTATIONS
                ),
                "supported_for_evaluation": (
                    self.tiff_orientation
                    in TIFF_ORIENTATION_TO_VIGNETTE_ORIENTATION
                ),
                "transform": (
                    TIFF_ORIENTATION_TO_VIGNETTE_ORIENTATION.get(
                        self.tiff_orientation
                    )
                ),
            },
            "model": {
                "radius_reference_pixels": self.radius_reference_pixels,
                "node_count": self.node_count,
                "header_signed_rational": {
                    "numerator": self.radius_reference_pixels,
                    "denominator": self.node_count,
                    "value": (
                        self.radius_reference_pixels / self.node_count
                    ),
                },
                "radius_fraction_rationals": [
                    value.manifest_value()
                    for value in self.radius_fraction_rationals
                ],
                "radius_nodes_pixels": list(self.radius_nodes_pixels),
                "transmission_percent_rationals": [
                    value.manifest_value()
                    for value in self.transmission_percent_rationals
                ],
                "transmission_nodes": list(self.transmission_nodes),
                "leading_knot": [0.0, 1.0],
                "center_tenths_pixels": [
                    self.center_x_tenths,
                    self.center_y_tenths,
                ],
                "center_offset_pixels": list(self.center_offset_pixels),
                "active_image_size": (
                    None
                    if self.active_image_size is None
                    else list(self.active_image_size)
                ),
                "active_crop_top_left": (
                    None
                    if self.active_crop_top_left is None
                    else list(self.active_crop_top_left)
                ),
                "raw_image_full_size": (
                    None
                    if self.raw_image_full_size is None
                    else list(self.raw_image_full_size)
                ),
                "transmission_node_rule": (
                    "cap each raw node at 1.2, then enforce a nonincreasing "
                    "sequence from the leading value 1"
                ),
                "evaluation": (
                    "gain = 1 / clamp(piecewise_linear("
                    "sqrt(max(radius_squared, 0))), 0.0625, 16)"
                ),
                "coordinate_convention": (
                    "active-image pixel-edge coordinates; first pixel center "
                    "is 0.5"
                ),
            },
            "independent_reimplementation": dict(
                CAMERA_RAW_STATIC_ANALYSIS
            ),
        }


@dataclass(frozen=True)
class _TIFFEntry:
    tag: int
    type_code: int
    count: int
    value_field: bytes
    value_or_offset: int


class _BoundedTIFFReader:
    """Small random-access TIFF reader constrained to one RAF raw region."""

    def __init__(
        self,
        source: Any,
        *,
        base_offset: int,
        length: int,
        byte_order: str,
    ) -> None:
        self.source = source
        self.base_offset = base_offset
        self.length = length
        self.byte_order = byte_order
        self.struct_prefix = "<" if byte_order == "II" else ">"

    def read(self, offset: int, length: int, name: str) -> bytes:
        if (
            isinstance(offset, bool)
            or isinstance(length, bool)
            or not isinstance(offset, int)
            or not isinstance(length, int)
            or offset < 0
            or length < 0
            or offset > self.length
            or length > self.length - offset
        ):
            raise RAFFormatError(
                f"Fuji embedded TIFF {name} is outside the RAF raw region"
            )
        self.source.seek(self.base_offset + offset)
        data = self.source.read(length)
        if len(data) != length:
            raise RAFFormatError(
                f"Fuji embedded TIFF {name} is truncated"
            )
        return data

    def unpack(self, format_code: str, data: bytes) -> Tuple[Any, ...]:
        return struct.unpack(self.struct_prefix + format_code, data)


def _read_ifd(
    reader: _BoundedTIFFReader,
    offset: int,
    name: str,
) -> Tuple[_TIFFEntry, ...]:
    count_data = reader.read(offset, 2, f"{name} entry count")
    entry_count = reader.unpack("H", count_data)[0]
    if entry_count > MAX_TIFF_IFD_ENTRIES:
        raise RAFFormatError(
            f"Fuji embedded TIFF {name} has too many entries"
        )

    table_length = entry_count * 12 + 4
    table = reader.read(offset + 2, table_length, f"{name} entries")
    entries = []
    for index in range(entry_count):
        entry_data = table[index * 12 : (index + 1) * 12]
        tag, type_code, count, value_or_offset = reader.unpack(
            "HHII",
            entry_data,
        )
        entries.append(
            _TIFFEntry(
                tag=tag,
                type_code=type_code,
                count=count,
                value_field=entry_data[8:12],
                value_or_offset=value_or_offset,
            )
        )
    return tuple(entries)


def _unique_entry(
    entries: Sequence[_TIFFEntry],
    tag: int,
    name: str,
) -> Optional[_TIFFEntry]:
    matches = [entry for entry in entries if entry.tag == tag]
    if len(matches) > 1:
        raise RAFFormatError(
            f"Fuji embedded TIFF contains duplicate {name} tag 0x{tag:04x}"
        )
    return None if not matches else matches[0]


def _read_inline_slong(
    reader: _BoundedTIFFReader,
    entry: Optional[_TIFFEntry],
    name: str,
) -> Tuple[int, bool]:
    if entry is None:
        return 0, False
    if entry.type_code != TIFF_TYPE_SLONG or entry.count != 1:
        raise RAFFormatError(
            f"Fuji {name} tag 0x{entry.tag:04x} must be one TIFF SLONG"
        )
    return reader.unpack("i", entry.value_field)[0], True


def _read_tiff_orientation(
    reader: _BoundedTIFFReader,
    entry: Optional[_TIFFEntry],
) -> Tuple[int, bool]:
    if entry is None:
        return 1, False
    if entry.type_code != TIFF_TYPE_SHORT or entry.count != 1:
        raise RAFFormatError(
            "TIFF Orientation tag 0x0112 must be one TIFF SHORT"
        )
    value = reader.unpack("H", entry.value_field[:2])[0]
    if value < 1 or value > 8:
        raise RAFFormatError(
            "TIFF Orientation tag 0x0112 must have a value from 1 through 8"
        )
    return value, True


def _read_vignette_values(
    reader: _BoundedTIFFReader,
    entry: _TIFFEntry,
) -> Tuple[
    int,
    Tuple[SignedRational, ...],
    Tuple[SignedRational, ...],
]:
    if entry.type_code != TIFF_TYPE_SRATIONAL:
        raise RAFFormatError(
            "Fuji VignettingParams tag 0xf010 must use TIFF SRATIONAL"
        )
    if entry.count < 3 or entry.count % 2 == 0:
        raise RAFFormatError(
            "Fuji VignettingParams tag 0xf010 must contain one header and "
            "matching radius/transmission arrays"
        )
    node_count = (entry.count - 1) // 2
    if node_count > MAX_FUJI_VIGNETTE_NODES:
        raise RAFFormatError(
            "Fuji VignettingParams node count exceeds the safety limit"
        )

    byte_length = entry.count * 8
    data = reader.read(
        entry.value_or_offset,
        byte_length,
        "VignettingParams tag 0xf010 payload",
    )
    values = []
    for index in range(entry.count):
        numerator, denominator = reader.unpack(
            "ii",
            data[index * 8 : (index + 1) * 8],
        )
        try:
            values.append(SignedRational(numerator, denominator))
        except RAFFormatError as exc:
            raise RAFFormatError(
                "Fuji VignettingParams tag 0xf010 rational "
                f"{index} has a zero denominator"
            ) from exc

    header = values[0]
    if header.numerator <= 0:
        raise RAFFormatError(
            "Fuji VignettingParams radius reference must be positive"
        )
    if header.denominator != node_count:
        raise RAFFormatError(
            "Fuji VignettingParams header denominator does not match its "
            "node count"
        )
    radii = tuple(values[1 : 1 + node_count])
    transmissions = tuple(values[1 + node_count :])
    return header.numerator, radii, transmissions


def _read_srational_array(
    reader: _BoundedTIFFReader,
    entry: _TIFFEntry,
    *,
    tag: int,
    name: str,
) -> Tuple[SignedRational, ...]:
    if entry.type_code != TIFF_TYPE_SRATIONAL:
        raise RAFFormatError(
            f"Fuji {name} tag 0x{tag:04x} must use TIFF SRATIONAL"
        )
    if entry.count == 0:
        raise RAFFormatError(f"Fuji {name} tag 0x{tag:04x} is empty")
    # The largest legal table below is 3*N+2.  Apply the bound before doing
    # arithmetic or reading its externally supplied offset.
    if entry.count > 3 * MAX_FUJI_GEOMETRY_NODES + 2:
        raise RAFFormatError(
            f"Fuji {name} tag 0x{tag:04x} exceeds the safety limit"
        )
    data = reader.read(
        entry.value_or_offset,
        entry.count * 8,
        f"{name} tag 0x{tag:04x} payload",
    )
    result = []
    for index in range(entry.count):
        numerator, denominator = reader.unpack(
            "ii",
            data[index * 8 : (index + 1) * 8],
        )
        try:
            result.append(SignedRational(numerator, denominator))
        except RAFFormatError as exc:
            raise RAFFormatError(
                f"Fuji {name} tag 0x{tag:04x} rational {index} has a "
                "zero denominator"
            ) from exc
    return tuple(result)


def _read_distortion_table(
    reader: _BoundedTIFFReader,
    entry: _TIFFEntry,
) -> FujiDistortionTable:
    values = _read_srational_array(
        reader,
        entry,
        tag=TAG_FUJI_GEOMETRIC_DISTORTION_PARAMS,
        name="GeometricDistortionParams",
    )
    if len(values) < 1 + 2 * MIN_FUJI_GEOMETRY_NODES or len(values) % 2 == 0:
        raise RAFFormatError(
            "Fuji GeometricDistortionParams tag 0xf00b must contain one "
            "header and matching radius/distortion arrays"
        )
    node_count = (len(values) - 1) // 2
    if node_count > MAX_FUJI_GEOMETRY_NODES:
        raise RAFFormatError(
            "Fuji GeometricDistortionParams node count exceeds the safety limit"
        )
    return FujiDistortionTable(
        header=values[0],
        radius_rationals=values[1 : 1 + node_count],
        distortion_percent_rationals=values[1 + node_count :],
    )


def _read_chromatic_aberration_table(
    reader: _BoundedTIFFReader,
    entry: _TIFFEntry,
) -> FujiChromaticAberrationTable:
    values = _read_srational_array(
        reader,
        entry,
        tag=TAG_FUJI_CHROMATIC_ABERRATION_PARAMS,
        name="ChromaticAberrationParams",
    )
    if (
        len(values) < 2 + 3 * MIN_FUJI_GEOMETRY_NODES
        or (len(values) - 2) % 3 != 0
    ):
        raise RAFFormatError(
            "Fuji ChromaticAberrationParams tag 0xf00f must contain a "
            "header, matching radius/red/blue arrays, and a trailing header"
        )
    node_count = (len(values) - 2) // 3
    if node_count > MAX_FUJI_GEOMETRY_NODES:
        raise RAFFormatError(
            "Fuji ChromaticAberrationParams node count exceeds the safety limit"
        )
    return FujiChromaticAberrationTable(
        header=values[0],
        radius_rationals=values[1 : 1 + node_count],
        red_delta_rationals=values[
            1 + node_count : 1 + 2 * node_count
        ],
        blue_delta_rationals=values[
            1 + 2 * node_count : 1 + 3 * node_count
        ],
        trailing_header=values[-1],
    )


def read_fuji_lens_geometry_model(
    path: Path,
) -> Optional[FujiLensGeometryModel]:
    """Read bounded Fuji distortion/CA metadata without calling vendor code."""

    source_path = Path(path)
    metadata = parse_raf_metadata(source_path)
    if (
        metadata.raw_offset < RAF_HEADER_SIZE
        or metadata.raw_length < 8
        or metadata.raw_offset > metadata.file_size
        or metadata.raw_length > metadata.file_size - metadata.raw_offset
    ):
        raise RAFFormatError(
            "RAF raw region containing the embedded TIFF is outside the file"
        )

    with source_path.open("rb") as source:
        source.seek(metadata.raw_offset)
        header = source.read(8)
        if len(header) != 8:
            raise RAFFormatError("Fuji embedded TIFF header is truncated")
        if header[:2] == b"II":
            byte_order = "II"
            prefix = "<"
        elif header[:2] == b"MM":
            byte_order = "MM"
            prefix = ">"
        else:
            raise RAFFormatError(
                "RAF raw region does not start with a TIFF byte-order marker"
            )
        magic, root_ifd_offset = struct.unpack(prefix + "HI", header[2:])
        if magic != 42:
            raise RAFFormatError("Fuji embedded TIFF has an invalid magic")

        reader = _BoundedTIFFReader(
            source,
            base_offset=metadata.raw_offset,
            length=metadata.raw_length,
            byte_order=byte_order,
        )
        root_entries = _read_ifd(reader, root_ifd_offset, "root IFD")
        fuji_entry = _unique_entry(
            root_entries,
            TAG_FUJI_RAW_IFD,
            "Fuji raw IFD",
        )
        if fuji_entry is None:
            return None
        if fuji_entry.type_code != TIFF_TYPE_IFD or fuji_entry.count != 1:
            raise RAFFormatError(
                "Fuji raw IFD tag 0xf000 must be one TIFF IFD pointer"
            )
        fuji_ifd_offset = reader.unpack("I", fuji_entry.value_field)[0]
        entries = _read_ifd(reader, fuji_ifd_offset, "Fuji raw IFD")

        distortion_entry = _unique_entry(
            entries,
            TAG_FUJI_GEOMETRIC_DISTORTION_PARAMS,
            "GeometricDistortionParams",
        )
        chromatic_entry = _unique_entry(
            entries,
            TAG_FUJI_CHROMATIC_ABERRATION_PARAMS,
            "ChromaticAberrationParams",
        )
        if distortion_entry is None and chromatic_entry is None:
            return None
        distortion = (
            None
            if distortion_entry is None
            else _read_distortion_table(reader, distortion_entry)
        )
        chromatic_aberration = (
            None
            if chromatic_entry is None
            else _read_chromatic_aberration_table(reader, chromatic_entry)
        )
        center_x, center_x_present = _read_inline_slong(
            reader,
            _unique_entry(
                entries,
                TAG_FUJI_VIGNETTE_CENTER_X,
                "lens center X",
            ),
            "lens center X",
        )
        center_y, center_y_present = _read_inline_slong(
            reader,
            _unique_entry(
                entries,
                TAG_FUJI_VIGNETTE_CENTER_Y,
                "lens center Y",
            ),
            "lens center Y",
        )

    return FujiLensGeometryModel(
        distortion=distortion,
        chromatic_aberration=chromatic_aberration,
        center_x_tenths=center_x,
        center_y_tenths=center_y,
        active_image_size=metadata.raw_image_cropped_size,
        active_crop_top_left=metadata.raw_image_crop_top_left,
        raw_image_full_size=metadata.raw_image_full_size,
        source_path=str(source_path),
        source_file_size=metadata.file_size,
        raw_tiff_offset=metadata.raw_offset,
        raw_tiff_length=metadata.raw_length,
        tiff_byte_order=byte_order,
        center_x_tag_present=center_x_present,
        center_y_tag_present=center_y_present,
        camera_model=metadata.camera_model,
    )


# Shorter public alias retained for callers that do not need to distinguish
# this model from the separately parsed vignette table.
read_fuji_geometry_model = read_fuji_lens_geometry_model


def read_fuji_vignette_model(
    path: Path,
) -> Optional[FujiVignetteModel]:
    """Read a Fuji embedded vignette model, or return ``None`` if absent.

    A present but malformed profile raises :class:`RAFFormatError`; only the
    legitimate absence of ``0xf000``/``0xf010`` is treated as no profile.
    """

    source_path = Path(path)
    metadata = parse_raf_metadata(source_path)
    if (
        metadata.raw_offset < RAF_HEADER_SIZE
        or metadata.raw_length < 8
        or metadata.raw_offset > metadata.file_size
        or metadata.raw_length > metadata.file_size - metadata.raw_offset
    ):
        raise RAFFormatError(
            "RAF raw region containing the embedded TIFF is outside the file"
        )

    with source_path.open("rb") as source:
        source.seek(metadata.raw_offset)
        header = source.read(8)
        if len(header) != 8:
            raise RAFFormatError("Fuji embedded TIFF header is truncated")
        byte_order_bytes = header[:2]
        if byte_order_bytes == b"II":
            byte_order = "II"
            prefix = "<"
        elif byte_order_bytes == b"MM":
            byte_order = "MM"
            prefix = ">"
        else:
            raise RAFFormatError(
                "RAF raw region does not start with a TIFF byte-order marker"
            )
        magic, root_ifd_offset = struct.unpack(prefix + "HI", header[2:])
        if magic != 42:
            raise RAFFormatError("Fuji embedded TIFF has an invalid magic")

        reader = _BoundedTIFFReader(
            source,
            base_offset=metadata.raw_offset,
            length=metadata.raw_length,
            byte_order=byte_order,
        )
        root_entries = _read_ifd(reader, root_ifd_offset, "root IFD")
        tiff_orientation, orientation_tag_present = _read_tiff_orientation(
            reader,
            _unique_entry(
                root_entries,
                TAG_TIFF_ORIENTATION,
                "Orientation",
            ),
        )
        fuji_entry = _unique_entry(
            root_entries,
            TAG_FUJI_RAW_IFD,
            "Fuji raw IFD",
        )
        if fuji_entry is None:
            return None
        if fuji_entry.type_code != TIFF_TYPE_IFD or fuji_entry.count != 1:
            raise RAFFormatError(
                "Fuji raw IFD tag 0xf000 must be one TIFF IFD pointer"
            )

        fuji_ifd_offset = reader.unpack("I", fuji_entry.value_field)[0]
        fuji_entries = _read_ifd(
            reader,
            fuji_ifd_offset,
            "Fuji raw IFD",
        )
        vignette_entry = _unique_entry(
            fuji_entries,
            TAG_FUJI_VIGNETTING_PARAMS,
            "VignettingParams",
        )
        if vignette_entry is None:
            return None

        radius_reference, radii, transmissions = _read_vignette_values(
            reader,
            vignette_entry,
        )
        center_x, center_x_present = _read_inline_slong(
            reader,
            _unique_entry(
                fuji_entries,
                TAG_FUJI_VIGNETTE_CENTER_X,
                "vignette center X",
            ),
            "vignette center X",
        )
        center_y, center_y_present = _read_inline_slong(
            reader,
            _unique_entry(
                fuji_entries,
                TAG_FUJI_VIGNETTE_CENTER_Y,
                "vignette center Y",
            ),
            "vignette center Y",
        )

    return FujiVignetteModel(
        radius_reference_pixels=radius_reference,
        radius_fraction_rationals=radii,
        transmission_percent_rationals=transmissions,
        center_x_tenths=center_x,
        center_y_tenths=center_y,
        active_image_size=metadata.raw_image_cropped_size,
        active_crop_top_left=metadata.raw_image_crop_top_left,
        raw_image_full_size=metadata.raw_image_full_size,
        source_path=str(source_path),
        source_file_size=metadata.file_size,
        raw_tiff_offset=metadata.raw_offset,
        raw_tiff_length=metadata.raw_length,
        tiff_byte_order=byte_order,
        tiff_orientation=tiff_orientation,
        orientation_tag_present=orientation_tag_present,
        center_x_tag_present=center_x_present,
        center_y_tag_present=center_y_present,
        camera_model=metadata.camera_model,
    )
