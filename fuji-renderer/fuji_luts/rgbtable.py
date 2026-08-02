"""Adobe DNG RGB-table decoding and tetrahedral interpolation.

The binary format is the one implemented by ``dng_rgb_table::GetStream`` in
Adobe's DNG SDK.  The table's samples are stored as unsigned 16-bit deltas
from an identity transform.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import struct
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple


PRIMARIES = {
    0: "sRGB",
    1: "Adobe RGB",
    2: "ProPhoto RGB",
    3: "Display P3",
    4: "Rec. 2020",
}

GAMMA = {
    0: "linear",
    1: "sRGB",
    2: "1.8",
    3: "2.2",
    4: "Rec. 2020",
}

GAMUT = {
    0: "clip",
    1: "extend",
}

# Matrices used by Adobe's DNG SDK. SetMatrixToPCS normalizes each row so
# device white maps exactly to the D50 profile connection space.
_D50_XYZ = (0.9642, 1.0, 0.8249)
_ADOBE_TO_PCS_SOURCE = (
    (0.6097, 0.2053, 0.1492),
    (0.3111, 0.6257, 0.0632),
    (0.0195, 0.0609, 0.7446),
)
_PROPHOTO_TO_PCS_SOURCE = (
    (0.7977, 0.1352, 0.0313),
    (0.2880, 0.7119, 0.0001),
    (0.0000, 0.0000, 0.8249),
)


def _normalized_to_pcs_matrix(source: Any, np: Any) -> Any:
    matrix = np.asarray(source, dtype=np.float64)
    return (_D50_XYZ / matrix.sum(axis=1))[:, None] * matrix


def _spline_segment(
    x: Any,
    x0: float,
    y0: float,
    slope0: float,
    x1: float,
    y1: float,
    slope1: float,
) -> Any:
    width = x1 - x0
    b = (x - x0) / width
    c = (x1 - x) / width
    return (
        (y0 * (2.0 - c + b) + slope0 * width * b) * c * c
        + (y1 * (2.0 - b + c) - slope1 * width * c) * b * b
    )


def _dng_gamma22_encode(values: Any, np: Any) -> Any:
    values = np.maximum(values, 0.0)
    x1 = 0.0034800731
    encoded = np.power(values, 1.0 / 2.2)
    low = values <= x1
    if np.any(low):
        encoded[low] = _spline_segment(
            values[low],
            0.0,
            0.0,
            32.0,
            x1,
            0.0763027458,
            9.9661890075,
        )
    return encoded


def _dng_gamma22_decode(values: Any, np: Any) -> Any:
    values = np.maximum(values, 0.0)
    decoded = np.power(values, 2.2)
    low = (values > 0.0) & (values < 0.0763027458)
    if np.any(low):
        target = values[low]
        lower = np.zeros_like(target)
        upper = np.full_like(target, 0.0034800731)
        # Adobe's SDK numerically inverts the spline in this range.
        for _ in range(32):
            middle = (lower + upper) * 0.5
            trial = _spline_segment(
                middle,
                0.0,
                0.0,
                32.0,
                0.0034800731,
                0.0763027458,
                9.9661890075,
            )
            lower = np.where(trial < target, middle, lower)
            upper = np.where(trial >= target, middle, upper)
        decoded[low] = (lower + upper) * 0.5
    return decoded


@dataclass(frozen=True)
class RGBTable:
    """A decoded Adobe RGB table.

    ``samples`` is in Adobe/DNG order: R is the outer dimension, then G, with
    B changing fastest. Each channel is an unsigned value in [0, 65535].
    """

    dimensions: int
    divisions: int
    samples: Tuple[Tuple[int, int, int], ...]
    primaries: int
    gamma: int
    gamut: int
    min_amount: float
    max_amount: float
    flags: int = 0

    @classmethod
    def from_bytes(cls, data: bytes) -> "RGBTable":
        if len(data) < 44:
            raise ValueError("RGB table is too short")

        table_type, version, dimensions, divisions = struct.unpack_from(
            "<4I", data, 0
        )
        if table_type != 1:
            raise ValueError(f"unsupported big-table type {table_type}; expected 1")
        if version != 1:
            raise ValueError(f"unsupported RGB-table version {version}")
        if dimensions not in (1, 3):
            raise ValueError(f"unsupported RGB-table dimensions {dimensions}")
        if divisions < 2:
            raise ValueError(f"invalid division count {divisions}")

        point_count = divisions if dimensions == 1 else divisions**3
        samples_end = 16 + point_count * 3 * 2
        required_size = samples_end + 3 * 4 + 2 * 8
        if len(data) < required_size:
            raise ValueError(
                f"truncated RGB table: got {len(data)} bytes, need {required_size}"
            )

        deltas = struct.unpack_from(f"<{point_count * 3}H", data, 16)
        identity = [
            (index * 0xFFFF + (divisions >> 1)) // (divisions - 1)
            for index in range(divisions)
        ]

        samples = []
        delta_index = 0
        if dimensions == 1:
            for index in range(divisions):
                base = identity[index]
                samples.append(
                    tuple((deltas[delta_index + c] + base) & 0xFFFF for c in range(3))
                )
                delta_index += 3
        else:
            for r_index in range(divisions):
                for g_index in range(divisions):
                    for b_index in range(divisions):
                        bases = (
                            identity[r_index],
                            identity[g_index],
                            identity[b_index],
                        )
                        samples.append(
                            tuple(
                                (deltas[delta_index + c] + bases[c]) & 0xFFFF
                                for c in range(3)
                            )
                        )
                        delta_index += 3

        primaries, gamma, gamut = struct.unpack_from("<3I", data, samples_end)
        min_amount, max_amount = struct.unpack_from("<2d", data, samples_end + 12)
        flags = (
            struct.unpack_from("<I", data, samples_end + 28)[0]
            if len(data) >= samples_end + 32
            else 0
        )

        if primaries not in PRIMARIES:
            raise ValueError(f"unknown primaries value {primaries}")
        if gamma not in GAMMA:
            raise ValueError(f"unknown gamma value {gamma}")
        if gamut not in GAMUT:
            raise ValueError(f"unknown gamut value {gamut}")

        return cls(
            dimensions=dimensions,
            divisions=divisions,
            samples=tuple(samples),
            primaries=primaries,
            gamma=gamma,
            gamut=gamut,
            min_amount=min_amount,
            max_amount=max_amount,
            flags=flags,
        )

    @classmethod
    def from_file(cls, path: Path) -> "RGBTable":
        return cls.from_bytes(Path(path).read_bytes())

    def metadata(self) -> Dict[str, Any]:
        return {
            "dimensions": self.dimensions,
            "divisions": self.divisions,
            "primaries": PRIMARIES[self.primaries],
            "primaries_code": self.primaries,
            "gamma": GAMMA[self.gamma],
            "gamma_code": self.gamma,
            "gamut": GAMUT[self.gamut],
            "gamut_code": self.gamut,
            "min_amount": self.min_amount,
            "max_amount": self.max_amount,
            "flags": self.flags,
        }

    def metadata_json(self) -> str:
        return json.dumps(self.metadata(), indent=2, sort_keys=True)

    def _sample(self, r_index: int, g_index: int, b_index: int) -> Tuple[int, int, int]:
        d = self.divisions
        return self.samples[(r_index * d + g_index) * d + b_index]

    def cube_lines(self, title: str = "Adobe RGB table") -> Iterable[str]:
        """Yield a standard .cube representation at amount 1.0.

        A .cube file cannot encode the RGB table's color-space metadata. The
        comments and title therefore state the required input/output domain.
        """

        if self.dimensions != 3:
            raise ValueError("only 3D RGB tables can be written as a .cube file")

        yield f'TITLE "{title}"'
        yield (
            f"# Domain: {PRIMARIES[self.primaries]}, {GAMMA[self.gamma]} gamma; "
            f"gamut={GAMUT[self.gamut]}"
        )
        yield "# Use tetrahedral interpolation for DNG-SDK-equivalent results."
        yield f"LUT_3D_SIZE {self.divisions}"
        yield "DOMAIN_MIN 0.0 0.0 0.0"
        yield "DOMAIN_MAX 1.0 1.0 1.0"

        # The .cube convention changes R fastest. The Adobe stream changes B
        # fastest, so transpose the traversal while preserving sample values.
        for b_index in range(self.divisions):
            for g_index in range(self.divisions):
                for r_index in range(self.divisions):
                    sample = self._sample(r_index, g_index, b_index)
                    yield " ".join(f"{value / 65535.0:.10f}" for value in sample)

    def write_cube(self, path: Path, title: str = "Adobe RGB table") -> None:
        text = "\n".join(self.cube_lines(title)) + "\n"
        Path(path).write_text(text, encoding="utf-8")

    def apply_encoded(self, rgb: Any, amount: float = 1.0) -> Any:
        """Apply the table to an encoded RGB NumPy array using tetrahedral interpolation.

        The array's last axis must be RGB, values must be in [0, 1], and its
        color primaries and transfer curve must match ``metadata()``. For the
        four X-T5 enhanced profiles in Lightroom 9.1, that means encoded
        Adobe RGB with the DNG SDK's 2.2 transfer curve.
        """

        try:
            import numpy as np
        except ImportError as exc:  # pragma: no cover - environment dependent
            raise RuntimeError("NumPy is required to apply an RGB table") from exc

        if self.dimensions != 3:
            raise ValueError("only 3D RGB tables are supported by apply_encoded")
        if not self.min_amount <= amount <= self.max_amount:
            raise ValueError(
                f"amount {amount} is outside [{self.min_amount}, {self.max_amount}]"
            )

        source = np.asarray(rgb)
        if source.shape[-1] != 3:
            raise ValueError("input array's last dimension must contain RGB")
        if not np.issubdtype(source.dtype, np.floating):
            raise ValueError("input array must use a floating-point dtype")

        work = np.clip(source, 0.0, 1.0).astype(np.float64, copy=False)
        table = (
            np.asarray(self.samples, dtype=np.float64)
            .reshape(self.divisions, self.divisions, self.divisions, 3)
            / 65535.0
        )

        scaled = work * (self.divisions - 1)
        index = np.floor(scaled).astype(np.int64)
        index = np.clip(index, 0, self.divisions - 2)
        fract = scaled - index

        ri, gi, bi = (index[..., channel] for channel in range(3))
        rf, gf, bf = (fract[..., channel] for channel in range(3))

        p1 = np.empty(index.shape, dtype=np.int64)
        p2 = np.empty(index.shape, dtype=np.int64)
        f1 = np.empty(ri.shape, dtype=np.float64)
        f2 = np.empty(ri.shape, dtype=np.float64)
        f3 = np.empty(ri.shape, dtype=np.float64)

        case_1 = (gf >= rf) & (bf >= gf)
        case_2 = (gf >= rf) & ~case_1 & (bf >= rf)
        case_3 = (gf >= rf) & ~case_1 & ~case_2
        case_4 = (gf < rf) & (bf >= rf)
        case_5 = (gf < rf) & ~case_4 & (bf >= gf)
        case_6 = (gf < rf) & ~case_4 & ~case_5

        cases = (
            (case_1, (0, 0, 1), (0, 1, 1), bf, gf, rf),
            (case_2, (0, 1, 0), (0, 1, 1), gf, bf, rf),
            (case_3, (0, 1, 0), (1, 1, 0), gf, rf, bf),
            (case_4, (0, 0, 1), (1, 0, 1), bf, rf, gf),
            (case_5, (1, 0, 0), (1, 0, 1), rf, bf, gf),
            (case_6, (1, 0, 0), (1, 1, 0), rf, gf, bf),
        )

        for mask, offset_1, offset_2, value_1, value_2, value_3 in cases:
            p1[mask] = offset_1
            p2[mask] = offset_2
            f1[mask] = value_1[mask]
            f2[mask] = value_2[mask]
            f3[mask] = value_3[mask]

        base = table[ri, gi, bi]
        sample_1 = table[
            ri + p1[..., 0], gi + p1[..., 1], bi + p1[..., 2]
        ]
        sample_2 = table[
            ri + p2[..., 0], gi + p2[..., 1], bi + p2[..., 2]
        ]
        sample_3 = table[ri + 1, gi + 1, bi + 1]

        w0 = 1.0 - f1
        w1 = f1 - f2
        w2 = f2 - f3
        result = (
            w0[..., None] * base
            + w1[..., None] * sample_1
            + w2[..., None] * sample_2
            + f3[..., None] * sample_3
        )

        if amount != 1.0:
            result = np.clip(work + amount * (result - work), 0.0, 1.0)

        return result.astype(source.dtype, copy=False)

    def apply_linear_prophoto(self, rgb: Any, amount: float = 1.0) -> Any:
        """Apply the table at its proper DNG pipeline stage.

        Input and output are linear ProPhoto/D50 RGB. This method performs the
        Adobe-RGB matrix conversion and DNG gamma-2.2 encoding declared by the
        four X-T5 enhanced profiles, applies the table, then reverses both
        conversions. It mirrors the non-HDR, gamut-clipping path in Adobe's
        DNG SDK.
        """

        try:
            import numpy as np
        except ImportError as exc:  # pragma: no cover - environment dependent
            raise RuntimeError("NumPy is required to apply an RGB table") from exc

        if self.primaries != 1 or self.gamma != 3:
            raise NotImplementedError(
                "linear-ProPhoto application currently supports the X-T5 "
                "tables' Adobe RGB primaries and DNG gamma 2.2"
            )

        source = np.asarray(rgb)
        if source.shape[-1] != 3:
            raise ValueError("input array's last dimension must contain RGB")
        if not np.issubdtype(source.dtype, np.floating):
            raise ValueError("input array must use a floating-point dtype")

        prophoto_to_pcs = _normalized_to_pcs_matrix(
            _PROPHOTO_TO_PCS_SOURCE, np
        )
        adobe_to_pcs = _normalized_to_pcs_matrix(_ADOBE_TO_PCS_SOURCE, np)
        prophoto_to_adobe = np.linalg.inv(adobe_to_pcs) @ prophoto_to_pcs
        adobe_to_prophoto = np.linalg.inv(prophoto_to_adobe)

        work = np.asarray(source, dtype=np.float64)
        adobe_linear = work @ prophoto_to_adobe.T
        adobe_linear = np.clip(adobe_linear, 0.0, 1.0)
        adobe_encoded = _dng_gamma22_encode(adobe_linear, np)
        transformed = self.apply_encoded(adobe_encoded, amount).astype(
            np.float64, copy=False
        )
        adobe_output = _dng_gamma22_decode(transformed, np)
        output = adobe_output @ adobe_to_prophoto.T
        output = np.clip(output, 0.0, 1.0)
        return output.astype(source.dtype, copy=False)
