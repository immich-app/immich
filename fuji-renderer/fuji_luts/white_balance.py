"""DNG-compatible Temperature/Tint and X-T5 white-balance helpers.

The temperature/tint coordinate conversion follows ``dng_temperature`` from
Adobe's publicly distributed DNG SDK for the 2000 K through 50000 K range.
The underlying Robertson reciprocal-temperature table is from Wyszecki &
Stiles, *Color Science*, second edition.  Only the small, deterministic
color-science portion needed by this independent renderer is implemented
here; no Adobe binary is loaded or called.
"""

from __future__ import annotations

import math
from typing import Any, Dict, Optional, Sequence, Tuple

import numpy as np

from .dcp import (
    DCPProfile,
    TAG_CALIBRATION_ILLUMINANT_1,
    TAG_CALIBRATION_ILLUMINANT_2,
    TAG_COLOR_MATRIX_1,
    TAG_COLOR_MATRIX_2,
    TAG_FORWARD_MATRIX_1,
    TAG_FORWARD_MATRIX_2,
)


_TINT_SCALE = -3000.0
_D50_XY = (0.3457, 0.3585)
_PROPHOTO_TO_XYZ_D50 = np.array(
    (
        (0.7976749, 0.1351917, 0.0313534),
        (0.2880402, 0.7118741, 0.0000857),
        (0.0, 0.0, 0.8252100),
    ),
    dtype=np.float64,
)
_XYZ_D50_TO_PROPHOTO = np.linalg.inv(_PROPHOTO_TO_XYZ_D50)

# Effective ``AnalogBalance * CameraCalibration`` for the X-T5 reference
# camera coordinates used by Camera Raw.  Adobe's public DNG color model
# applies this product before ColorMatrix when translating an xy white point
# to CameraNeutral.  RAF does not expose those DNG tags directly, so these
# diagonal terms were recovered from three independent Lightroom 9.1 As Shot
# readbacks and the corresponding LibRaw camera multipliers.  The fit
# residuals are bounded by 0.26 on Lightroom's 0..100 Temperature axis and
# 0.12 on its 0..100 Tint axis.
_X_T5_EFFECTIVE_AB_CC_DIAGONAL = (
    0.9260738967941271,
    1.0,
    1.0124223138148041,
)
_X_T5_CALIBRATION_PROVENANCE = {
    "camera_model": "Fujifilm X-T5",
    "lightroom_version": "9.1",
    "method": (
        "fixed_effective_analog_balance_times_camera_calibration_"
        "diagonal_fit"
    ),
    "evidence": (
        {
            "raw": "DXT50901.RAF",
            "lightroom_as_shot_position": {
                "temperature": 29.0,
                "tint": 50.0,
            },
        },
        {
            "raw": "DXT51391.RAF",
            "lightroom_as_shot_position": {
                "temperature": 23.0,
                "tint": 58.0,
            },
        },
        {
            "raw": "DXT51946.RAF",
            "lightroom_as_shot_position": {
                "temperature": 25.0,
                "tint": 51.666666666666664,
            },
        },
    ),
}

# Reciprocal megakelvin, 1960 UCS u/v, and isotherm slope.
_TEMPERATURE_TABLE = (
    (0.0, 0.18006, 0.26352, -0.24341),
    (10.0, 0.18066, 0.26589, -0.25479),
    (20.0, 0.18133, 0.26846, -0.26876),
    (30.0, 0.18208, 0.27119, -0.28539),
    (40.0, 0.18293, 0.27407, -0.30470),
    (50.0, 0.18388, 0.27709, -0.32675),
    (60.0, 0.18494, 0.28021, -0.35156),
    (70.0, 0.18611, 0.28342, -0.37915),
    (80.0, 0.18740, 0.28668, -0.40955),
    (90.0, 0.18880, 0.28997, -0.44278),
    (100.0, 0.19032, 0.29326, -0.47888),
    (125.0, 0.19462, 0.30141, -0.58204),
    (150.0, 0.19962, 0.30921, -0.70471),
    (175.0, 0.20525, 0.31647, -0.84901),
    (200.0, 0.21142, 0.32312, -1.0182),
    (225.0, 0.21807, 0.32909, -1.2168),
    (250.0, 0.22511, 0.33439, -1.4512),
    (275.0, 0.23247, 0.33904, -1.7298),
    (300.0, 0.24010, 0.34308, -2.0637),
    (325.0, 0.24702, 0.34655, -2.4681),
    (350.0, 0.25591, 0.34951, -2.9641),
    (375.0, 0.26400, 0.35200, -3.5814),
    (400.0, 0.27218, 0.35407, -4.3633),
    (425.0, 0.28039, 0.35577, -5.3762),
    (450.0, 0.28863, 0.35714, -6.7262),
    (475.0, 0.29685, 0.35823, -8.5955),
    (500.0, 0.30505, 0.35907, -11.324),
    (525.0, 0.31320, 0.35968, -15.628),
    (550.0, 0.32129, 0.36011, -23.325),
    (575.0, 0.32931, 0.36038, -40.770),
    (600.0, 0.33724, 0.36051, -116.45),
)

_ILLUMINANT_TEMPERATURES = {
    17: 2850.0,  # Standard Light A
    18: 6500.0,  # Standard Light B is treated as daylight by the SDK
    19: 6500.0,  # Standard Light C
    20: 5500.0,  # D55
    21: 6500.0,  # D65
    22: 7500.0,  # D75
    23: 5000.0,  # D50
    24: 3200.0,  # ISO studio tungsten
}


def lightroom_temperature_from_position(position: float) -> float:
    """Convert Lightroom's 0..100 external-control position to Kelvin.

    Lightroom exposes Temperature to external controls on a normalized axis
    even though its Develop UI and saved adjustments use Kelvin.  This is the
    exact piecewise-linear mapping used by Camera Raw 18.1 / Lightroom 9.1.
    """

    if isinstance(position, bool):
        raise TypeError("temperature position must be a real number")
    position = float(position)
    if not math.isfinite(position) or position < 0.0 or position > 100.0:
        raise ValueError("temperature position must be between 0 and 100")
    if position <= 59.0:
        return 2000.0 + 100.0 * position
    if position <= 69.5:
        return 7900.0 + 200.0 * (position - 59.0)
    if position <= 83.5:
        return 10000.0 + 500.0 * (position - 69.5)
    return 17000.0 + 2000.0 * (position - 83.5)


def lightroom_temperature_to_position(temperature: float) -> float:
    """Convert an absolute Lightroom Temperature in Kelvin to 0..100."""

    if isinstance(temperature, bool):
        raise TypeError("temperature must be a real number")
    temperature = float(temperature)
    if (
        not math.isfinite(temperature)
        or temperature < 2000.0
        or temperature > 50000.0
    ):
        raise ValueError("temperature must be between 2000 K and 50000 K")
    if temperature <= 7900.0:
        return (temperature - 2000.0) / 100.0
    if temperature <= 10000.0:
        return 59.0 + (temperature - 7900.0) / 200.0
    if temperature <= 17000.0:
        return 69.5 + (temperature - 10000.0) / 500.0
    return 83.5 + (temperature - 17000.0) / 2000.0


def lightroom_tint_from_position(position: float) -> float:
    """Convert Lightroom's normalized Tint control to its absolute value."""

    if isinstance(position, bool):
        raise TypeError("tint position must be a real number")
    position = float(position)
    if not math.isfinite(position) or position < 0.0 or position > 100.0:
        raise ValueError("tint position must be between 0 and 100")
    return 3.0 * position - 150.0


def lightroom_tint_to_position(tint: float) -> float:
    """Convert an absolute Lightroom Tint value to its 0..100 position."""

    if isinstance(tint, bool):
        raise TypeError("tint must be a real number")
    tint = float(tint)
    if not math.isfinite(tint) or tint < -150.0 or tint > 150.0:
        raise ValueError("tint must be between -150 and 150")
    return (tint + 150.0) / 3.0


def _finite_pair(xy: Sequence[float]) -> Tuple[float, float]:
    if len(xy) != 2:
        raise ValueError("white point must contain exactly x and y")
    x = float(xy[0])
    y = float(xy[1])
    if not math.isfinite(x) or not math.isfinite(y):
        raise ValueError("white-point coordinates must be finite")
    if x <= 0.0 or y <= 0.0 or x + y >= 1.0:
        raise ValueError(f"invalid CIE xy white point {(x, y)!r}")
    return x, y


def temperature_tint_to_xy(
    temperature: float,
    tint: float,
) -> Tuple[float, float]:
    """Convert Lightroom/DNG Temperature and Tint to a CIE xy white point."""

    if isinstance(temperature, bool) or isinstance(tint, bool):
        raise TypeError("temperature and tint must be real numbers")
    temperature = float(temperature)
    tint = float(tint)
    if not math.isfinite(temperature) or temperature <= 0.0:
        raise ValueError("temperature must be finite and greater than zero")
    if not math.isfinite(tint):
        raise ValueError("tint must be finite")

    reciprocal = 1.0e6 / temperature
    offset = tint / _TINT_SCALE
    for index in range(len(_TEMPERATURE_TABLE) - 1):
        first = _TEMPERATURE_TABLE[index]
        second = _TEMPERATURE_TABLE[index + 1]
        if reciprocal < second[0] or index == len(_TEMPERATURE_TABLE) - 2:
            fraction = (second[0] - reciprocal) / (
                second[0] - first[0]
            )
            u = first[1] * fraction + second[1] * (1.0 - fraction)
            v = first[2] * fraction + second[2] * (1.0 - fraction)

            direction_1 = np.array((1.0, first[3]), dtype=np.float64)
            direction_2 = np.array((1.0, second[3]), dtype=np.float64)
            direction_1 /= np.linalg.norm(direction_1)
            direction_2 /= np.linalg.norm(direction_2)
            direction = (
                direction_1 * fraction
                + direction_2 * (1.0 - fraction)
            )
            direction /= np.linalg.norm(direction)
            u += float(direction[0]) * offset
            v += float(direction[1]) * offset

            denominator = u - 4.0 * v + 2.0
            return 1.5 * u / denominator, v / denominator

    raise AssertionError("temperature table interpolation did not converge")


def xy_to_temperature_tint(
    xy: Sequence[float],
) -> Tuple[float, float]:
    """Convert a CIE xy white point to Lightroom/DNG Temperature and Tint."""

    x, y = _finite_pair(xy)
    denominator = 1.5 - x + 6.0 * y
    u = 2.0 * x / denominator
    v = 3.0 * y / denominator
    last_distance = 0.0
    last_dv = 0.0
    last_du = 0.0

    for index in range(1, len(_TEMPERATURE_TABLE)):
        row = _TEMPERATURE_TABLE[index]
        du = 1.0
        dv = row[3]
        length = math.hypot(du, dv)
        du /= length
        dv /= length

        uu = u - row[1]
        vv = v - row[2]
        distance = -uu * dv + vv * du
        if distance <= 0.0 or index == len(_TEMPERATURE_TABLE) - 1:
            distance = max(-distance, 0.0)
            fraction = (
                0.0
                if index == 1
                else distance / (last_distance + distance)
            )
            previous = _TEMPERATURE_TABLE[index - 1]
            reciprocal = (
                previous[0] * fraction
                + row[0] * (1.0 - fraction)
            )
            temperature = 1.0e6 / reciprocal

            locus_u = previous[1] * fraction + row[1] * (
                1.0 - fraction
            )
            locus_v = previous[2] * fraction + row[2] * (
                1.0 - fraction
            )
            uu = u - locus_u
            vv = v - locus_v
            du = du * (1.0 - fraction) + last_du * fraction
            dv = dv * (1.0 - fraction) + last_dv * fraction
            length = math.hypot(du, dv)
            du /= length
            dv /= length
            tint = (uu * du + vv * dv) * _TINT_SCALE
            return temperature, tint

        last_distance = distance
        last_du = du
        last_dv = dv

    raise AssertionError("white-point table projection did not converge")


def _profile_matrix(profile: DCPProfile, tag: int) -> np.ndarray:
    values = profile.rationals(tag)
    if values is None or len(values) != 9:
        raise ValueError(f"DCP tag {tag} is not a 3x3 matrix")
    matrix = np.asarray(values, dtype=np.float64).reshape(3, 3)
    if not np.all(np.isfinite(matrix)):
        raise ValueError(f"DCP tag {tag} contains non-finite values")
    return matrix


def _calibration_temperature(profile: DCPProfile, tag: int) -> float:
    values = profile.integers(tag)
    if not values:
        raise ValueError(f"DCP is missing calibration illuminant tag {tag}")
    try:
        return _ILLUMINANT_TEMPERATURES[values[0]]
    except KeyError as exc:
        raise ValueError(
            f"unsupported DCP calibration illuminant {values[0]}"
        ) from exc


def _interpolated_color_matrix(
    profile: DCPProfile,
    xy: Sequence[float],
) -> np.ndarray:
    return _interpolated_profile_matrix(
        profile,
        xy,
        TAG_COLOR_MATRIX_1,
        TAG_COLOR_MATRIX_2,
    )


def _interpolated_profile_matrix(
    profile: DCPProfile,
    xy: Sequence[float],
    first_tag: int,
    second_tag: int,
) -> np.ndarray:
    temperature, _ = xy_to_temperature_tint(xy)
    first_temperature = _calibration_temperature(
        profile,
        TAG_CALIBRATION_ILLUMINANT_1,
    )
    second_temperature = _calibration_temperature(
        profile,
        TAG_CALIBRATION_ILLUMINANT_2,
    )
    first = _profile_matrix(profile, first_tag)
    second = _profile_matrix(profile, second_tag)
    if first_temperature > second_temperature:
        first_temperature, second_temperature = (
            second_temperature,
            first_temperature,
        )
        first, second = second, first

    if temperature <= first_temperature:
        weight = 1.0
    elif temperature >= second_temperature:
        weight = 0.0
    else:
        reciprocal = 1.0 / temperature
        weight = (
            reciprocal - (1.0 / second_temperature)
        ) / (
            (1.0 / first_temperature)
            - (1.0 / second_temperature)
        )
    return weight * first + (1.0 - weight) * second


def x_t5_white_balance_forward_matrix_correction(
    profile: DCPProfile,
    as_shot_xy: Sequence[float],
    target_xy: Sequence[float],
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Return an empirical X-T5 WB-dependent linear-ProPhoto correction.

    LibRaw already maps the demosaiced camera data into linear ProPhoto RGB,
    but its white-balance-dependent camera characterization is not identical
    to Camera Raw's.  A relative transform made from the X-T5 Adobe Standard
    ForwardMatrix pair substantially reduces that residual at extreme white
    balances.  Its direction is chosen from independent Lightroom reference
    renders, then normalized so neutral RGB remains exactly neutral.

    This is an independent compatibility correction.  It is deliberately not
    presented as the orientation or complete application of an internal Adobe
    transform, and no Adobe binary or runtime API is used.
    """

    as_shot = _finite_pair(as_shot_xy)
    target = _finite_pair(target_xy)
    forward_as_shot = _interpolated_profile_matrix(
        profile,
        as_shot,
        TAG_FORWARD_MATRIX_1,
        TAG_FORWARD_MATRIX_2,
    )
    forward_target = _interpolated_profile_matrix(
        profile,
        target,
        TAG_FORWARD_MATRIX_1,
        TAG_FORWARD_MATRIX_2,
    )
    relative = (
        _XYZ_D50_TO_PROPHOTO
        @ forward_as_shot
        @ np.linalg.inv(forward_target)
        @ _PROPHOTO_TO_XYZ_D50
    )
    row_sums = np.sum(relative, axis=1)
    if (
        not np.all(np.isfinite(relative))
        or not np.all(np.isfinite(row_sums))
        or np.any(np.abs(row_sums) < 1.0e-12)
    ):
        raise ValueError("profile produced an invalid relative ForwardMatrix")
    correction = relative / row_sums[:, np.newaxis]
    profile_metadata = profile.metadata()
    manifest: Dict[str, Any] = {
        "method": (
            "inverse_direction_neutral_preserving_relative_forward_matrix"
        ),
        "status": "independent_lightroom_compatibility_correction",
        "camera_model": profile_metadata.get("camera_model"),
        "profile_name": profile_metadata.get("profile_name"),
        "source_tags": ["ForwardMatrix1", "ForwardMatrix2"],
        "formula": (
            "XYZ_D50_to_ProPhoto * ForwardMatrix(as_shot) * "
            "inverse(ForwardMatrix(target)) * ProPhoto_to_XYZ_D50; "
            "normalize each output row to sum to one"
        ),
        "stage": (
            "decoded_linear_prophoto_before_exposure_highlight_noise_profile"
        ),
        "as_shot_xy": list(as_shot),
        "target_xy": list(target),
        "pre_normalization_row_sums": [
            float(value) for value in row_sums
        ],
        "matrix": correction.tolist(),
        "neutral_preserving": True,
        "interpretation": (
            "Empirical inverse-direction relative correction selected by "
            "held-out Lightroom 9.1 X-T5 renders; this does not claim the "
            "orientation or complete behavior of Adobe's internal "
            "ForwardMatrix pipeline."
        ),
        "validation": {
            "lightroom_version": "9.1",
            "camera_model": "Fujifilm X-T5",
            "raw": "DXT51946.RAF",
            "profiles": ["Camera PROVIA/Standard", "Camera ACROS"],
            "probes": ["Temperature position 0", "Tint position 100"],
        },
        "calls_adobe_runtime": False,
    }
    return correction, manifest


def apply_white_balance_forward_matrix_correction(
    linear_prophoto: np.ndarray,
    correction: np.ndarray,
) -> np.ndarray:
    """Apply a 3x3 WB compatibility correction to linear ProPhoto RGB."""

    source = np.asarray(linear_prophoto)
    matrix = np.asarray(correction, dtype=np.float64)
    if source.ndim < 1 or source.shape[-1] != 3:
        raise ValueError("linear ProPhoto input must end in three RGB channels")
    if matrix.shape != (3, 3) or not np.all(np.isfinite(matrix)):
        raise ValueError("white-balance correction must be a finite 3x3 matrix")
    result = np.einsum(
        "...j,ij->...i",
        source,
        matrix,
        optimize=True,
    )
    if np.issubdtype(source.dtype, np.floating):
        return result.astype(source.dtype, copy=False)
    return result


def _x_t5_xyz_to_camera_matrix(
    profile: DCPProfile,
    xy: Sequence[float],
) -> np.ndarray:
    """Return ``AnalogBalance * CameraCalibration * ColorMatrix``."""

    calibration = np.diag(
        np.asarray(_X_T5_EFFECTIVE_AB_CC_DIAGONAL, dtype=np.float64)
    )
    return calibration @ _interpolated_color_matrix(profile, xy)


def _xy_to_xyz(xy: Sequence[float]) -> np.ndarray:
    x, y = _finite_pair(xy)
    return np.array((x / y, 1.0, (1.0 - x - y) / y), dtype=np.float64)


def camera_neutral_for_white(
    profile: DCPProfile,
    temperature: float,
    tint: float,
) -> np.ndarray:
    """Return normalized X-T5 camera-neutral values for a requested white."""

    xy = temperature_tint_to_xy(temperature, tint)
    camera_white = _x_t5_xyz_to_camera_matrix(profile, xy) @ _xy_to_xyz(xy)
    maximum = float(np.max(camera_white))
    if not math.isfinite(maximum) or maximum <= 0.0:
        raise ValueError("profile produced an invalid camera white")
    return np.clip(camera_white / maximum, 0.001, 1.0)


def camera_neutral_to_xy(
    profile: DCPProfile,
    neutral: Sequence[float],
) -> Tuple[float, float]:
    """Invert a three-channel camera neutral using DNG's fixed-point method."""

    vector = np.asarray(neutral, dtype=np.float64)
    if vector.shape != (3,) or not np.all(np.isfinite(vector)):
        raise ValueError("camera neutral must contain three finite values")
    if np.any(vector <= 0.0):
        raise ValueError("camera neutral values must be greater than zero")

    last = _D50_XY
    for pass_index in range(30):
        matrix = _x_t5_xyz_to_camera_matrix(profile, last)
        next_xy = _finite_pair(
            _xyz_to_xy(np.linalg.inv(matrix) @ vector)
        )
        if abs(next_xy[0] - last[0]) + abs(next_xy[1] - last[1]) < 1e-7:
            return next_xy
        if pass_index == 29:
            next_xy = (
                (last[0] + next_xy[0]) * 0.5,
                (last[1] + next_xy[1]) * 0.5,
            )
        last = next_xy
    return last


def _xyz_to_xy(xyz: Sequence[float]) -> Tuple[float, float]:
    vector = np.asarray(xyz, dtype=np.float64)
    if vector.shape != (3,) or not np.all(np.isfinite(vector)):
        raise ValueError("XYZ white must contain three finite values")
    total = float(np.sum(vector))
    if total <= 0.0:
        return _D50_XY
    return float(vector[0] / total), float(vector[1] / total)


def resolve_camera_white_balance(
    profile: DCPProfile,
    camera_multipliers: Sequence[float],
    temperature: Optional[float],
    tint: Optional[float],
) -> Tuple[Tuple[float, float, float, float], Dict[str, Any]]:
    """Resolve absolute Lightroom controls to LibRaw user multipliers.

    Missing Temperature or Tint components retain the corresponding As Shot
    coordinate.  The target multipliers preserve LibRaw's existing green
    scale so changing white balance does not introduce an unrelated exposure
    adjustment.
    """

    current = np.asarray(camera_multipliers, dtype=np.float64)
    if (
        current.shape != (4,)
        or not np.all(np.isfinite(current))
        or np.any(current[:3] <= 0.0)
        or current[3] < 0.0
    ):
        raise ValueError(
            "camera multipliers must contain positive finite RGB values "
            "and a non-negative fourth value"
        )

    neutral = 1.0 / current[:3]
    neutral /= np.max(neutral)
    as_shot_xy = camera_neutral_to_xy(profile, neutral)
    as_shot_temperature, as_shot_tint = xy_to_temperature_tint(as_shot_xy)
    resolved_temperature = (
        as_shot_temperature if temperature is None else float(temperature)
    )
    resolved_tint = as_shot_tint if tint is None else float(tint)
    target_neutral = camera_neutral_for_white(
        profile,
        resolved_temperature,
        resolved_tint,
    )
    target_ratios = 1.0 / target_neutral
    target_ratios /= target_ratios[1]
    target = (
        float(target_ratios[0] * current[1]),
        float(current[1]),
        float(target_ratios[2] * current[1]),
        float(current[3]),
    )
    manifest: Dict[str, Any] = {
        "method": (
            "dng_temperature_robertson_table_plus_dual_illuminant_"
            "color_matrix_plus_x_t5_reference_camera_calibration"
        ),
        "camera_calibration": {
            **_X_T5_CALIBRATION_PROVENANCE,
            "effective_analog_balance_times_camera_calibration": [
                [
                    _X_T5_EFFECTIVE_AB_CC_DIAGONAL[0],
                    0.0,
                    0.0,
                ],
                [0.0, _X_T5_EFFECTIVE_AB_CC_DIAGONAL[1], 0.0],
                [
                    0.0,
                    0.0,
                    _X_T5_EFFECTIVE_AB_CC_DIAGONAL[2],
                ],
            ],
            "application": (
                "left_multiply_interpolated_color_matrix_before_"
                "camera_neutral_conversion"
            ),
            "calls_adobe_runtime": False,
        },
        "as_shot": {
            "temperature": as_shot_temperature,
            "tint": as_shot_tint,
            "xy": list(as_shot_xy),
            "camera_multipliers": [float(value) for value in current],
        },
        "requested": {
            "temperature": temperature,
            "tint": tint,
        },
        "resolved": {
            "temperature": resolved_temperature,
            "tint": resolved_tint,
            "xy": list(
                temperature_tint_to_xy(
                    resolved_temperature,
                    resolved_tint,
                )
            ),
            "camera_multipliers": list(target),
        },
        "calls_adobe_runtime": False,
    }
    return target, manifest
