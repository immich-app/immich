"""Small, dependency-free reader for Adobe DCP profile metadata.

Adobe DCP files use a TIFF-style little-endian IFD. Camera Raw's protected
profiles use ``IIRC`` instead of the normal ``II*\\0`` four-byte signature,
but retain the same IFD layout.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import struct
from typing import Any, Dict, List, Mapping, Optional, Tuple


TIFF_TYPE_SIZES = {
    1: 1,   # BYTE
    2: 1,   # ASCII
    3: 2,   # SHORT
    4: 4,   # LONG
    5: 8,   # RATIONAL
    6: 1,   # SBYTE
    7: 1,   # UNDEFINED
    8: 2,   # SSHORT
    9: 4,   # SLONG
    10: 8,  # SRATIONAL
    11: 4,  # FLOAT
    12: 8,  # DOUBLE
}

TAG_UNIQUE_CAMERA_MODEL = 50708
TAG_COLOR_MATRIX_1 = 50721
TAG_COLOR_MATRIX_2 = 50722
TAG_CALIBRATION_ILLUMINANT_1 = 50778
TAG_CALIBRATION_ILLUMINANT_2 = 50779
TAG_PROFILE_CALIBRATION_SIGNATURE = 50932
TAG_PROFILE_NAME = 50936
TAG_PROFILE_HUE_SAT_MAP_DIMS = 50937
TAG_PROFILE_HUE_SAT_MAP_DATA_1 = 50938
TAG_PROFILE_HUE_SAT_MAP_DATA_2 = 50939
TAG_PROFILE_TONE_CURVE = 50940
TAG_PROFILE_COPYRIGHT = 50942
TAG_FORWARD_MATRIX_1 = 50964
TAG_FORWARD_MATRIX_2 = 50965
TAG_PROFILE_LOOK_TABLE_DIMS = 50981
TAG_PROFILE_LOOK_TABLE_DATA = 50982
TAG_PROFILE_HUE_SAT_MAP_ENCODING = 51107
TAG_PROFILE_LOOK_TABLE_ENCODING = 51108
TAG_BASELINE_EXPOSURE_OFFSET = 51109
TAG_DEFAULT_BLACK_RENDER = 51110

ENCODINGS = {
    0: "linear",
    1: "sRGB",
}


def _srgb_encode(values: Any, np: Any) -> Any:
    values = np.maximum(values, 0.0)
    return np.where(
        values <= 0.0031308,
        values * 12.92,
        1.055 * np.power(values, 1.0 / 2.4) - 0.055,
    )


def _srgb_decode(values: Any, np: Any) -> Any:
    values = np.maximum(values, 0.0)
    return np.where(
        values <= 0.04045,
        values / 12.92,
        np.power((values + 0.055) / 1.055, 2.4),
    )


def _rgb_to_hsv(rgb: Any, np: Any) -> Tuple[Any, Any, Any]:
    r, g, b = (rgb[..., channel] for channel in range(3))
    value = np.maximum(r, np.maximum(g, b))
    minimum = np.minimum(r, np.minimum(g, b))
    gap = value - minimum
    nonzero = gap > 0.0

    saturation = np.zeros_like(value)
    np.divide(gap, value, out=saturation, where=nonzero)
    hue = np.zeros_like(value)

    red = nonzero & (r == value)
    green = nonzero & ~red & (g == value)
    blue = nonzero & ~red & ~green
    hue[red] = (g[red] - b[red]) / gap[red]
    hue[red & (hue < 0.0)] += 6.0
    hue[green] = 2.0 + (b[green] - r[green]) / gap[green]
    hue[blue] = 4.0 + (r[blue] - g[blue]) / gap[blue]
    return hue, saturation, value


def _hsv_to_rgb(hue: Any, saturation: Any, value: Any, np: Any) -> Any:
    hue = np.mod(hue, 6.0)
    sector = np.floor(hue).astype(np.int64)
    fract = hue - sector
    low = value * (1.0 - saturation)
    falling = value * (1.0 - saturation * fract)
    rising = value * (1.0 - saturation * (1.0 - fract))

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
    gray = saturation <= 0.0
    output[gray] = np.stack((value[gray], value[gray], value[gray]), axis=-1)
    return output


def _solve_spline_slopes(x: Any, y: Any, np: Any) -> Any:
    count = len(x)
    if count < 2 or np.any(np.diff(x) <= 0.0):
        raise ValueError("tone-curve knots must be strictly increasing")

    slopes = np.empty(count, dtype=np.float64)
    width = x[1] - x[0]
    secant = (y[1] - y[0]) / width
    slopes[0] = secant

    for index in range(2, count):
        next_width = x[index] - x[index - 1]
        next_secant = (y[index] - y[index - 1]) / next_width
        slopes[index - 1] = (
            secant * next_width + next_secant * width
        ) / (width + next_width)
        width = next_width
        secant = next_secant

    slopes[-1] = 2.0 * secant - slopes[-2]
    slopes[0] = 2.0 * slopes[0] - slopes[1]

    if count > 2:
        e = np.zeros(count, dtype=np.float64)
        f = np.zeros(count, dtype=np.float64)
        g = np.zeros(count, dtype=np.float64)
        f[0] = 0.5
        e[-1] = 0.5
        g[0] = 0.75 * (slopes[0] + slopes[1])
        g[-1] = 0.75 * (slopes[-2] + slopes[-1])

        for index in range(1, count - 1):
            span = (x[index + 1] - x[index - 1]) * 2.0
            e[index] = (x[index + 1] - x[index]) / span
            f[index] = (x[index] - x[index - 1]) / span
            g[index] = 1.5 * slopes[index]

        for index in range(1, count):
            scale = 1.0 - f[index - 1] * e[index]
            if index != count - 1:
                f[index] /= scale
            g[index] = (g[index] - g[index - 1] * e[index]) / scale

        for index in range(count - 2, -1, -1):
            g[index] -= f[index] * g[index + 1]
        slopes = g

    return slopes


def _evaluate_spline(values: Any, x: Any, y: Any, slopes: Any, np: Any) -> Any:
    source = np.asarray(values, dtype=np.float64)
    result = np.empty_like(source)
    result[source <= x[0]] = y[0]
    result[source >= x[-1]] = y[-1]
    middle = (source > x[0]) & (source < x[-1])
    if np.any(middle):
        sample = source[middle]
        upper = np.searchsorted(x, sample, side="left")
        lower = upper - 1
        width = x[upper] - x[lower]
        b = (sample - x[lower]) / width
        c = (x[upper] - sample) / width
        result[middle] = (
            (
                y[lower] * (2.0 - c + b)
                + slopes[lower] * width * b
            )
            * c
            * c
            + (
                y[upper] * (2.0 - b + c)
                - slopes[upper] * width * c
            )
            * b
            * b
        )
    return result


def _apply_baseline_rgb_tone(
    rgb: Any,
    x: Any,
    y: Any,
    slopes: Any,
    np: Any,
) -> Any:
    """Apply a DCP tone curve using Adobe's hue-preserving RGB operation.

    This implements ``RefBaselineRGBTone`` from the Adobe DNG SDK. The curve
    is evaluated only for a pixel's minimum and maximum components; the
    remaining component is placed linearly between those two results.
    Applying the curve independently to all three channels would introduce
    hue shifts whenever the curve is nonlinear.
    """

    source = np.asarray(rgb)
    if source.shape[-1] != 3:
        raise ValueError("input array's last dimension must contain RGB")
    if not np.issubdtype(source.dtype, np.floating):
        raise ValueError("input array must use a floating-point dtype")

    # RefBaselineRGBTone pins each component before evaluating the table.
    pinned = np.clip(source.astype(np.float64, copy=False), 0.0, 1.0)
    low = np.min(pinned, axis=-1)
    high = np.max(pinned, axis=-1)
    curved_low = _evaluate_spline(low, x, y, slopes, np)
    curved_high = _evaluate_spline(high, x, y, slopes, np)

    span = high - low
    scale = np.zeros_like(span)
    np.divide(
        curved_high - curved_low,
        span,
        out=scale,
        where=span > 0.0,
    )
    result = (
        curved_low[..., None]
        + (pinned - low[..., None]) * scale[..., None]
    )
    return result.astype(source.dtype, copy=False)


@dataclass(frozen=True)
class TIFFEntry:
    tag: int
    value_type: int
    count: int
    data: bytes


class DCPProfile:
    """Parsed DCP IFD and its most useful camera-profile metadata."""

    def __init__(
        self,
        signature: bytes,
        entries: Mapping[int, TIFFEntry],
    ) -> None:
        self.signature = signature
        self.entries = dict(entries)

    @classmethod
    def from_bytes(cls, data: bytes) -> "DCPProfile":
        if len(data) < 10 or data[:2] != b"II":
            raise ValueError("not a little-endian DCP/TIFF payload")
        if data[:4] not in (b"IIRC", b"II*\x00"):
            raise ValueError(f"unsupported DCP signature {data[:4]!r}")

        ifd_offset = struct.unpack_from("<I", data, 4)[0]
        if ifd_offset + 2 > len(data):
            raise ValueError("DCP IFD offset lies outside the payload")
        entry_count = struct.unpack_from("<H", data, ifd_offset)[0]
        entries: Dict[int, TIFFEntry] = {}

        for index in range(entry_count):
            position = ifd_offset + 2 + index * 12
            if position + 12 > len(data):
                raise ValueError("truncated DCP IFD")
            tag, value_type, count = struct.unpack_from("<HHI", data, position)
            item_size = TIFF_TYPE_SIZES.get(value_type)
            if item_size is None:
                raise ValueError(f"unsupported TIFF type {value_type} for tag {tag}")
            byte_count = item_size * count
            inline = data[position + 8 : position + 12]
            if byte_count <= 4:
                raw = inline[:byte_count]
            else:
                value_offset = struct.unpack_from("<I", data, position + 8)[0]
                value_end = value_offset + byte_count
                if value_end > len(data):
                    raise ValueError(f"tag {tag} data lies outside the DCP payload")
                raw = data[value_offset:value_end]
            entries[tag] = TIFFEntry(tag, value_type, count, raw)

        return cls(data[:4], entries)

    @classmethod
    def from_file(cls, path: Path) -> "DCPProfile":
        return cls.from_bytes(Path(path).read_bytes())

    def _entry(self, tag: int) -> Optional[TIFFEntry]:
        return self.entries.get(tag)

    def ascii(self, tag: int) -> Optional[str]:
        entry = self._entry(tag)
        if entry is None:
            return None
        if entry.value_type != 2:
            raise ValueError(f"tag {tag} is not ASCII")
        return entry.data.split(b"\x00", 1)[0].decode("utf-8", "replace")

    def integers(self, tag: int) -> Optional[Tuple[int, ...]]:
        entry = self._entry(tag)
        if entry is None:
            return None
        formats = {
            1: "B",
            3: "H",
            4: "I",
            6: "b",
            8: "h",
            9: "i",
        }
        value_format = formats.get(entry.value_type)
        if value_format is None:
            raise ValueError(f"tag {tag} is not an integer type")
        return struct.unpack(f"<{entry.count}{value_format}", entry.data)

    def rationals(self, tag: int) -> Optional[Tuple[float, ...]]:
        entry = self._entry(tag)
        if entry is None:
            return None
        if entry.value_type not in (5, 10):
            raise ValueError(f"tag {tag} is not a rational type")
        pair_format = "II" if entry.value_type == 5 else "ii"
        values: List[float] = []
        for index in range(entry.count):
            numerator, denominator = struct.unpack_from(
                f"<{pair_format}", entry.data, index * 8
            )
            values.append(
                numerator / denominator if denominator != 0 else float("nan")
            )
        return tuple(values)

    def floats(self, tag: int) -> Optional[Tuple[float, ...]]:
        entry = self._entry(tag)
        if entry is None:
            return None
        value_format = {11: "f", 12: "d"}.get(entry.value_type)
        if value_format is None:
            raise ValueError(f"tag {tag} is not a floating-point type")
        return struct.unpack(f"<{entry.count}{value_format}", entry.data)

    def _single_integer(self, tag: int, default: Optional[int] = None) -> Optional[int]:
        values = self.integers(tag)
        return values[0] if values else default

    def metadata(self) -> Dict[str, Any]:
        hue_dims = self.integers(TAG_PROFILE_HUE_SAT_MAP_DIMS)
        look_dims = self.integers(TAG_PROFILE_LOOK_TABLE_DIMS)
        tone_entry = self._entry(TAG_PROFILE_TONE_CURVE)
        look_entry = self._entry(TAG_PROFILE_LOOK_TABLE_DATA)
        hue_1_entry = self._entry(TAG_PROFILE_HUE_SAT_MAP_DATA_1)
        hue_2_entry = self._entry(TAG_PROFILE_HUE_SAT_MAP_DATA_2)
        look_encoding = self._single_integer(
            TAG_PROFILE_LOOK_TABLE_ENCODING, 0
        )
        hue_encoding = self._single_integer(
            TAG_PROFILE_HUE_SAT_MAP_ENCODING, 0
        )

        return {
            "signature": self.signature.decode("ascii", "replace"),
            "protected": self.signature == b"IIRC",
            "camera_model": self.ascii(TAG_UNIQUE_CAMERA_MODEL),
            "calibration_signature": self.ascii(
                TAG_PROFILE_CALIBRATION_SIGNATURE
            ),
            "profile_name": self.ascii(TAG_PROFILE_NAME),
            "copyright": self.ascii(TAG_PROFILE_COPYRIGHT),
            "calibration_illuminants": [
                self._single_integer(TAG_CALIBRATION_ILLUMINANT_1),
                self._single_integer(TAG_CALIBRATION_ILLUMINANT_2),
            ],
            "has_color_matrix_1": self._entry(TAG_COLOR_MATRIX_1) is not None,
            "has_color_matrix_2": self._entry(TAG_COLOR_MATRIX_2) is not None,
            "has_forward_matrix_1": self._entry(TAG_FORWARD_MATRIX_1) is not None,
            "has_forward_matrix_2": self._entry(TAG_FORWARD_MATRIX_2) is not None,
            "hue_sat_map_dimensions": list(hue_dims) if hue_dims else None,
            "hue_sat_map_entries_1": (
                hue_1_entry.count // 3 if hue_1_entry else 0
            ),
            "hue_sat_map_entries_2": (
                hue_2_entry.count // 3 if hue_2_entry else 0
            ),
            "hue_sat_map_encoding": ENCODINGS.get(
                hue_encoding, f"unknown ({hue_encoding})"
            ),
            "look_table_dimensions": list(look_dims) if look_dims else None,
            "look_table_entries": look_entry.count // 3 if look_entry else 0,
            "look_table_encoding": ENCODINGS.get(
                look_encoding, f"unknown ({look_encoding})"
            ),
            "tone_curve_points": tone_entry.count // 2 if tone_entry else 0,
            "baseline_exposure_offset": self.rationals(
                TAG_BASELINE_EXPOSURE_OFFSET
            ),
            "default_black_render": self._single_integer(
                TAG_DEFAULT_BLACK_RENDER
            ),
        }

    def apply_look_table(self, rgb: Any) -> Any:
        """Apply ProfileLookTable to normalized linear ProPhoto/D50 RGB.

        This implements Adobe's non-HDR ``BaselineHueSatMap`` path, including
        cyclic hue interpolation and the optional sRGB encoding of HSV's value
        coordinate. Camera matrices, white balance, exposure, and the profile
        tone curve are separate pipeline stages.
        """

        try:
            import numpy as np
        except ImportError as exc:  # pragma: no cover - environment dependent
            raise RuntimeError("NumPy is required to apply a DCP look table") from exc

        dims = self.integers(TAG_PROFILE_LOOK_TABLE_DIMS)
        values = self.floats(TAG_PROFILE_LOOK_TABLE_DATA)
        if not dims or not values:
            raise ValueError("DCP does not contain a ProfileLookTable")
        hue_divisions, sat_divisions, val_divisions = dims
        if hue_divisions < 2 or sat_divisions < 2 or val_divisions < 2:
            raise ValueError(f"unsupported look-table dimensions {dims}")

        source = np.asarray(rgb)
        if source.shape[-1] != 3:
            raise ValueError("input array's last dimension must contain RGB")
        if not np.issubdtype(source.dtype, np.floating):
            raise ValueError("input array must use a floating-point dtype")
        work = np.asarray(source, dtype=np.float64)
        if np.any(~np.isfinite(work)) or np.any(work < 0.0) or np.any(work > 1.0):
            raise ValueError(
                "DCP look-table input must be finite, normalized linear "
                "ProPhoto RGB in [0, 1]"
            )

        table = np.asarray(values, dtype=np.float64).reshape(
            val_divisions, hue_divisions, sat_divisions, 3
        )
        hue, saturation, value = _rgb_to_hsv(work, np)

        encoding = self._single_integer(TAG_PROFILE_LOOK_TABLE_ENCODING, 0)
        if encoding == 1:
            encoded_value = _srgb_encode(value, np)
        elif encoding == 0:
            encoded_value = value
        else:
            raise ValueError(f"unsupported ProfileLookTableEncoding {encoding}")

        hue_scaled = hue * (hue_divisions / 6.0)
        sat_scaled = saturation * (sat_divisions - 1)
        val_scaled = encoded_value * (val_divisions - 1)
        hue_0 = np.clip(
            np.floor(hue_scaled).astype(np.int64), 0, hue_divisions - 1
        )
        hue_1 = (hue_0 + 1) % hue_divisions
        sat_0 = np.clip(
            np.floor(sat_scaled).astype(np.int64), 0, sat_divisions - 2
        )
        val_0 = np.clip(
            np.floor(val_scaled).astype(np.int64), 0, val_divisions - 2
        )
        sat_1 = sat_0 + 1
        val_1 = val_0 + 1

        hue_f = hue_scaled - hue_0
        sat_f = sat_scaled - sat_0
        val_f = val_scaled - val_0

        def interpolate_saturation(sat_index: Any) -> Any:
            at_v0 = (
                (1.0 - hue_f)[..., None] * table[val_0, hue_0, sat_index]
                + hue_f[..., None] * table[val_0, hue_1, sat_index]
            )
            at_v1 = (
                (1.0 - hue_f)[..., None] * table[val_1, hue_0, sat_index]
                + hue_f[..., None] * table[val_1, hue_1, sat_index]
            )
            return (
                (1.0 - val_f)[..., None] * at_v0
                + val_f[..., None] * at_v1
            )

        lower = interpolate_saturation(sat_0)
        upper = interpolate_saturation(sat_1)
        modifications = (
            (1.0 - sat_f)[..., None] * lower + sat_f[..., None] * upper
        )

        hue = hue + modifications[..., 0] * (6.0 / 360.0)
        saturation = np.minimum(
            saturation * modifications[..., 1], 1.0
        )
        encoded_value = np.clip(
            encoded_value * modifications[..., 2], 0.0, 1.0
        )
        value = (
            _srgb_decode(encoded_value, np)
            if encoding == 1
            else encoded_value
        )
        output = _hsv_to_rgb(hue, saturation, value, np)
        return output.astype(source.dtype, copy=False)

    def apply_tone_curve(self, rgb: Any) -> Any:
        """Apply ProfileToneCurve to linear RGB without changing pixel hue."""

        try:
            import numpy as np
        except ImportError as exc:  # pragma: no cover - environment dependent
            raise RuntimeError("NumPy is required to apply a DCP tone curve") from exc

        points = self.floats(TAG_PROFILE_TONE_CURVE)
        if not points or len(points) < 4 or len(points) % 2:
            raise ValueError("DCP does not contain a valid ProfileToneCurve")
        coordinates = np.asarray(points, dtype=np.float64).reshape(-1, 2)
        x = coordinates[:, 0]
        y = coordinates[:, 1]
        slopes = _solve_spline_slopes(x, y, np)

        return _apply_baseline_rgb_tone(rgb, x, y, slopes, np)

    def apply_look_and_tone(self, rgb: Any) -> Any:
        """Apply the DCP creative stages to normalized linear ProPhoto RGB."""

        return self.apply_tone_curve(self.apply_look_table(rgb))
