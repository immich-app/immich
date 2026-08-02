#!/usr/bin/env python3
"""Version-gated X-T5 full-sensor LibRaw decoding prototype.

rawpy 0.21 exposes the complete unpacked X-T5 mosaic through ``raw_image``,
but its postprocessor uses LibRaw's 60,6 visible origin. Camera Raw uses the
RAF-declared 12,21 origin and 7728x5152 active dimensions instead. This module
uses the public LibRaw 0.21 C data layout to replace those geometry fields
before unpacking, then runs the same installed LibRaw postprocessor.

The 6x6 X-Trans table is expressed in output coordinates. Moving the visible
origin therefore also requires shifting both LibRaw X-Trans tables by the
origin delta. Omitting that shift swaps red and blue for the X-T5's 15-row
vertical origin change.

This is deliberately conservative:

* only the already-installed LibRaw bundled with rawpy is loaded;
* the ABI is hard-gated to LibRaw 0.21.2 on 64-bit Linux;
* OpenMP is forced to one worker before rawpy/LibRaw is imported;
* LibRaw's scene-dependent maximum adjustment is disabled;
* the RAF geometry and X-Trans layout are validated before mutation;
* no Adobe binary or API is loaded.

The default decode uses LibRaw's half-size mode, matching the existing preview
pipeline's cost. A full-resolution diagnostic decode is also available.
"""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import struct
import sys
from typing import Callable, Dict, Optional, Sequence, Tuple

# The environment must be configured before importing rawpy, because its
# extension loads LibRaw and libgomp as an import side effect. Keep NumPy and
# the project package below this block too: either can transitively load a
# numerical runtime before rawpy.
_RAWPY_PRELOADED_AT_IMPORT = "rawpy" in sys.modules
_PREVIOUS_OMP_NUM_THREADS = os.environ.get("OMP_NUM_THREADS")
if not _RAWPY_PRELOADED_AT_IMPORT:
    os.environ["OMP_NUM_THREADS"] = "1"

# Support both ``python -m scripts.libraw_full_sensor`` and the repository's
# documented direct-script convention.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np

from fuji_luts.raf import RAFFormatError, RAFMetadata, parse_raf_metadata


SUPPORTED_LIBRAW_VERSION = (0, 21, 2)
SUPPORTED_RAWPY_VERSION = "0.21.0"
SUPPORTED_LIBRAW_LIBRARY_SHA256 = (
    "d332fd8868ce6accf6822f680257def580be8ca9d5b149750c2e808a7ceb577a"
)
LIBRAW_XTRANS_FILTERS = 9
LIBRAW_BITMAP_IMAGE = 2
LIBRAW_PROPHOTO = 4
LIBRAW_ADJUST_MAXIMUM_THRESHOLD = 0.0
# LibRaw mode 0 is its conservative "Clip" policy. Alternate blend and
# reconstruction modes were rejected against the Lightroom high-range corpus.
LIBRAW_HIGHLIGHT_MODE = 0
LIBRAW_HEADROOM_USER_SATURATION = 65535
RAF_TAG_CAMERA_RAW_ACTIVE_SIZE = 0x0112
LIBRAW_DATA_OUTPUT_PARAMS_OFFSET = 0x13A0


class LibRawRawInsetCrop(ctypes.Structure):
    """Public ``libraw_raw_inset_crop_t`` from LibRaw 0.21.2."""

    _fields_ = (
        ("cleft", ctypes.c_ushort),
        ("ctop", ctypes.c_ushort),
        ("cwidth", ctypes.c_ushort),
        ("cheight", ctypes.c_ushort),
    )


class LibRawImageSizes(ctypes.Structure):
    """Public ``libraw_image_sizes_t`` from LibRaw 0.21.2."""

    _fields_ = (
        ("raw_height", ctypes.c_ushort),
        ("raw_width", ctypes.c_ushort),
        ("height", ctypes.c_ushort),
        ("width", ctypes.c_ushort),
        ("top_margin", ctypes.c_ushort),
        ("left_margin", ctypes.c_ushort),
        ("iheight", ctypes.c_ushort),
        ("iwidth", ctypes.c_ushort),
        ("raw_pitch", ctypes.c_uint),
        ("pixel_aspect", ctypes.c_double),
        ("flip", ctypes.c_int),
        ("mask", (ctypes.c_int * 4) * 8),
        ("raw_aspect", ctypes.c_ushort),
        ("raw_inset_crops", LibRawRawInsetCrop * 2),
    )


class LibRawIParams(ctypes.Structure):
    """Public ``libraw_iparams_t`` from LibRaw 0.21.2."""

    _fields_ = (
        ("guard", ctypes.c_char * 4),
        ("make", ctypes.c_char * 64),
        ("model", ctypes.c_char * 64),
        ("software", ctypes.c_char * 64),
        ("normalized_make", ctypes.c_char * 64),
        ("normalized_model", ctypes.c_char * 64),
        ("maker_index", ctypes.c_uint),
        ("raw_count", ctypes.c_uint),
        ("dng_version", ctypes.c_uint),
        ("is_foveon", ctypes.c_uint),
        ("colors", ctypes.c_int),
        ("filters", ctypes.c_uint),
        ("xtrans", (ctypes.c_ubyte * 6) * 6),
        ("xtrans_abs", (ctypes.c_ubyte * 6) * 6),
        ("cdesc", ctypes.c_char * 5),
        ("xmplen", ctypes.c_uint),
        ("xmpdata", ctypes.c_void_p),
    )


class LibRawDataPrefix(ctypes.Structure):
    """Prefix of public ``libraw_data_t`` needed for geometry mutation."""

    _fields_ = (
        ("image", ctypes.c_void_p),
        ("sizes", LibRawImageSizes),
        ("idata", LibRawIParams),
    )


class LibRawProcessedImage(ctypes.Structure):
    """Header of public ``libraw_processed_image_t``."""

    _fields_ = (
        ("type", ctypes.c_int),
        ("height", ctypes.c_ushort),
        ("width", ctypes.c_ushort),
        ("colors", ctypes.c_ushort),
        ("bits", ctypes.c_ushort),
        ("data_size", ctypes.c_uint),
        ("data", ctypes.c_ubyte * 1),
    )


class LibRawOutputParamsPrefix(ctypes.Structure):
    """Prefix of public ``libraw_output_params_t`` through ``user_sat``."""

    _fields_ = (
        ("greybox", ctypes.c_uint * 4),
        ("cropbox", ctypes.c_uint * 4),
        ("aber", ctypes.c_double * 4),
        ("gamm", ctypes.c_double * 6),
        ("user_mul", ctypes.c_float * 4),
        ("bright", ctypes.c_float),
        ("threshold", ctypes.c_float),
        ("half_size", ctypes.c_int),
        ("four_color_rgb", ctypes.c_int),
        ("highlight", ctypes.c_int),
        ("use_auto_wb", ctypes.c_int),
        ("use_camera_wb", ctypes.c_int),
        ("use_camera_matrix", ctypes.c_int),
        ("output_color", ctypes.c_int),
        ("output_profile", ctypes.c_void_p),
        ("camera_profile", ctypes.c_void_p),
        ("bad_pixels", ctypes.c_void_p),
        ("dark_frame", ctypes.c_void_p),
        ("output_bps", ctypes.c_int),
        ("output_tiff", ctypes.c_int),
        ("output_flags", ctypes.c_int),
        ("user_flip", ctypes.c_int),
        ("user_qual", ctypes.c_int),
        ("user_black", ctypes.c_int),
        ("user_cblack", ctypes.c_int * 4),
        ("user_sat", ctypes.c_int),
    )


def _validate_public_abi() -> None:
    """Reject platforms whose C layout cannot match LibRaw 0.21.2."""

    if (
        struct.calcsize("P") != 8
        or sys.platform != "linux"
        or sys.byteorder != "little"
    ):
        raise RuntimeError(
            "full-sensor prototype supports only little-endian 64-bit Linux "
            "LibRaw"
        )
    expected = {
        "image_sizes_size": 184,
        "sizes_offset": 8,
        "idata_offset": 192,
        "processed_data_offset": 16,
        "output_params_half_size_offset": 136,
        "output_params_user_sat_offset": 240,
        "data_half_size_offset": 0x1428,
    }
    actual = {
        "image_sizes_size": ctypes.sizeof(LibRawImageSizes),
        "sizes_offset": LibRawDataPrefix.sizes.offset,
        "idata_offset": LibRawDataPrefix.idata.offset,
        "processed_data_offset": LibRawProcessedImage.data.offset,
        "output_params_half_size_offset": (
            LibRawOutputParamsPrefix.half_size.offset
        ),
        "output_params_user_sat_offset": (
            LibRawOutputParamsPrefix.user_sat.offset
        ),
        "data_half_size_offset": (
            LIBRAW_DATA_OUTPUT_PARAMS_OFFSET
            + LibRawOutputParamsPrefix.half_size.offset
        ),
    }
    if actual != expected:
        raise RuntimeError(
            "installed platform does not match the validated LibRaw ABI: "
            f"expected {expected}, got {actual}"
        )


def _table_tuple(
    table: Sequence[Sequence[int]],
) -> Tuple[Tuple[int, ...], ...]:
    result = tuple(
        tuple(int(table[row][column]) for column in range(6))
        for row in range(6)
    )
    if len(result) != 6 or any(len(row) != 6 for row in result):
        raise ValueError("X-Trans table must be 6x6")
    if any(value not in (0, 1, 2) for row in result for value in row):
        raise ValueError("X-Trans table must contain only RGB indices 0..2")
    return result


def shift_xtrans_for_origin(
    table: Sequence[Sequence[int]],
    source_origin: Tuple[int, int],
    target_origin: Tuple[int, int],
) -> Tuple[Tuple[int, ...], ...]:
    """Shift an output-relative X-Trans table to a new raw origin.

    Origins use ``(left, top)`` order. For every absolute raw coordinate, the
    returned table assigns the same color as ``table`` did at the source
    origin.
    """

    source = _table_tuple(table)
    source_left, source_top = source_origin
    target_left, target_top = target_origin
    column_delta = (target_left - source_left) % 6
    row_delta = (target_top - source_top) % 6
    return tuple(
        tuple(
            source[
                (row + row_delta) % 6
            ][
                (column + column_delta) % 6
            ]
            for column in range(6)
        )
        for row in range(6)
    )


def libraw_flip_orientation(flip: int) -> str:
    """Describe LibRaw's dcraw-compatible output rotation code."""

    orientations = {
        0: "native",
        3: "rotate_180",
        5: "rotate_90_ccw",
        6: "rotate_90_cw",
    }
    try:
        return orientations[flip]
    except KeyError as exc:
        raise RuntimeError(
            f"unsupported LibRaw output rotation code {flip!r}"
        ) from exc


def camera_raw_active_size(metadata: RAFMetadata) -> Tuple[int, int]:
    """Read the X-T5 active width/height from RAF tag 0x0112.

    Camera Raw's X-T5 geometry path consumes 0x0112 in width,height order.
    All 144 local X-T5 samples also carry the equivalent transposed pair in
    0x0111, but the explicit Camera Raw tag keeps this probe unambiguous.
    """

    matches = [
        entry
        for entry in metadata.entries
        if entry.tag == RAF_TAG_CAMERA_RAW_ACTIVE_SIZE
    ]
    if len(matches) != 1:
        raise RAFFormatError(
            "Camera Raw active-size RAF tag 0x0112 must occur exactly once"
        )
    data = matches[0].data
    if len(data) != 4:
        raise RAFFormatError(
            "Camera Raw active-size RAF tag 0x0112 must contain four bytes"
        )
    width, height = struct.unpack(">HH", data)
    if width <= 0 or height <= 0:
        raise RAFFormatError("Camera Raw active dimensions must be positive")
    return width, height


def apply_full_sensor_geometry(
    data: LibRawDataPrefix,
    *,
    target_origin: Tuple[int, int],
    target_size: Tuple[int, int],
) -> Dict[str, object]:
    """Mutate a just-identified LibRaw object to the declared active crop."""

    sizes = data.sizes
    idata = data.idata
    source_origin = (int(sizes.left_margin), int(sizes.top_margin))
    source_size = (int(sizes.width), int(sizes.height))
    full_size = (int(sizes.raw_width), int(sizes.raw_height))
    left, top = (int(value) for value in target_origin)
    width, height = (int(value) for value in target_size)

    if idata.filters != LIBRAW_XTRANS_FILTERS or idata.colors != 3:
        raise RuntimeError(
            "full-sensor prototype requires a three-color X-Trans LibRaw "
            f"decode, got filters={idata.filters}, colors={idata.colors}"
        )
    if min(left, top) < 0 or min(width, height) <= 0:
        raise RAFFormatError("active geometry must be positive and nonnegative")
    if left + width > full_size[0] or top + height > full_size[1]:
        raise RAFFormatError(
            "active geometry extends beyond LibRaw's full mosaic"
        )

    original_xtrans = _table_tuple(idata.xtrans)
    original_xtrans_abs = _table_tuple(idata.xtrans_abs)
    shifted_xtrans = shift_xtrans_for_origin(
        original_xtrans,
        source_origin,
        (left, top),
    )
    shifted_xtrans_abs = shift_xtrans_for_origin(
        original_xtrans_abs,
        source_origin,
        (left, top),
    )
    for name, shifted in (
        ("xtrans", shifted_xtrans),
        ("xtrans_abs", shifted_xtrans_abs),
    ):
        target = getattr(idata, name)
        for row in range(6):
            for column in range(6):
                target[row][column] = shifted[row][column]

    sizes.left_margin = left
    sizes.top_margin = top
    sizes.width = width
    sizes.height = height
    sizes.iwidth = width
    sizes.iheight = height

    return {
        "source_origin": list(source_origin),
        "source_size": list(source_size),
        "target_origin": [left, top],
        "target_size": [width, height],
        "full_mosaic_size": list(full_size),
        "xtrans_phase_shift": [
            (left - source_origin[0]) % 6,
            (top - source_origin[1]) % 6,
        ],
    }


def _output_params_prefix(
    data: LibRawDataPrefix,
) -> LibRawOutputParamsPrefix:
    """View the version-gated public output-parameter prefix."""

    address = (
        ctypes.addressof(data) + LIBRAW_DATA_OUTPUT_PARAMS_OFFSET
    )
    return LibRawOutputParamsPrefix.from_address(address)


class _BoundLibRaw:
    """Small owner for the installed LibRaw C API signatures."""

    def __init__(self, library_path: Path):
        self.path = library_path
        self.library = ctypes.CDLL(str(library_path))
        data_pointer = ctypes.POINTER(LibRawDataPrefix)
        image_pointer = ctypes.POINTER(LibRawProcessedImage)
        functions = (
            (
                "libraw_init",
                (ctypes.c_uint,),
                data_pointer,
            ),
            (
                "libraw_open_file",
                (data_pointer, ctypes.c_char_p),
                ctypes.c_int,
            ),
            (
                "libraw_unpack",
                (data_pointer,),
                ctypes.c_int,
            ),
            (
                "libraw_dcraw_process",
                (data_pointer,),
                ctypes.c_int,
            ),
            (
                "libraw_dcraw_make_mem_image",
                (data_pointer, ctypes.POINTER(ctypes.c_int)),
                image_pointer,
            ),
            (
                "libraw_get_cam_mul",
                (data_pointer, ctypes.c_int),
                ctypes.c_float,
            ),
            (
                "libraw_strerror",
                (ctypes.c_int,),
                ctypes.c_char_p,
            ),
            (
                "libraw_version",
                (),
                ctypes.c_char_p,
            ),
        )
        for name, arguments, result in functions:
            function = getattr(self.library, name)
            function.argtypes = list(arguments)
            function.restype = result
        setters = (
            (
                "libraw_set_user_mul",
                (data_pointer, ctypes.c_int, ctypes.c_float),
            ),
            (
                "libraw_set_output_color",
                (data_pointer, ctypes.c_int),
            ),
            (
                "libraw_set_output_bps",
                (data_pointer, ctypes.c_int),
            ),
            (
                "libraw_set_gamma",
                (data_pointer, ctypes.c_int, ctypes.c_float),
            ),
            (
                "libraw_set_no_auto_bright",
                (data_pointer, ctypes.c_int),
            ),
            (
                "libraw_set_adjust_maximum_thr",
                (data_pointer, ctypes.c_float),
            ),
            (
                "libraw_set_highlight",
                (data_pointer, ctypes.c_int),
            ),
            ("libraw_close", (data_pointer,)),
            ("libraw_dcraw_clear_mem", (image_pointer,)),
        )
        for name, arguments in setters:
            function = getattr(self.library, name)
            function.argtypes = list(arguments)
            function.restype = None

    def check(self, stage: str, error: int) -> None:
        if error:
            message = self.library.libraw_strerror(error).decode(
                "utf-8",
                errors="replace",
            )
            raise RuntimeError(f"LibRaw {stage} failed ({error}): {message}")


def _load_installed_libraw():
    """Load only rawpy's already-installed bundled LibRaw."""

    _validate_public_abi()
    if _RAWPY_PRELOADED_AT_IMPORT:
        raise RuntimeError(
            "rawpy was loaded before the full-sensor decoder configured "
            "OpenMP. Restart Python and import this module first."
        )
    if os.environ.get("OMP_NUM_THREADS") != "1":
        raise RuntimeError(
            "deterministic full-sensor decoding requires OMP_NUM_THREADS=1"
        )

    # Importing the installed extension resolves its private bundled-library
    # dependencies. The decode below still uses the public LibRaw C API.
    import rawpy

    package_root = Path(rawpy.__file__).resolve().parent.parent
    candidates = sorted(
        (package_root / "rawpy.libs").glob("libraw_r-*.so.*")
    )
    if len(candidates) != 1:
        raise RuntimeError(
            "expected exactly one bundled rawpy LibRaw library, found "
            f"{[str(candidate) for candidate in candidates]}"
        )
    library_path = candidates[0]
    library_sha256 = hashlib.sha256(library_path.read_bytes()).hexdigest()
    if library_sha256 != SUPPORTED_LIBRAW_LIBRARY_SHA256:
        raise RuntimeError(
            "full-sensor ABI has not been validated for the installed LibRaw "
            f"library hash {library_sha256}; expected "
            f"{SUPPORTED_LIBRAW_LIBRARY_SHA256}"
        )
    if rawpy.__version__ != SUPPORTED_RAWPY_VERSION:
        raise RuntimeError(
            "full-sensor decoder has not been validated for rawpy "
            f"{rawpy.__version__}; expected {SUPPORTED_RAWPY_VERSION}"
        )

    bound = _BoundLibRaw(library_path)
    version_text = bound.library.libraw_version().decode("ascii")
    version_tuple = tuple(int(value) for value in rawpy.libraw_version)
    if version_tuple != SUPPORTED_LIBRAW_VERSION:
        raise RuntimeError(
            "full-sensor ABI is validated only for LibRaw "
            f"{SUPPORTED_LIBRAW_VERSION}, installed version is "
            f"{version_tuple} ({version_text})"
        )
    return (
        bound,
        rawpy.__version__,
        version_tuple,
        version_text,
        library_sha256,
    )


def _validated_white_balance_multipliers(
    values: Sequence[float],
) -> Tuple[float, float, float, float]:
    """Validate one explicit LibRaw user-multiplier vector."""

    if isinstance(values, (str, bytes)) or len(values) != 4:
        raise ValueError(
            "white-balance multipliers must contain exactly four values"
        )
    result = []
    for index, value in enumerate(values):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(
                "white-balance multipliers must be real numbers"
            )
        numeric = float(value)
        if not np.isfinite(numeric):
            raise ValueError("white-balance multipliers must be finite")
        if numeric <= 0.0 and index < 3:
            raise ValueError(
                "RGB white-balance multipliers must be greater than zero"
            )
        if numeric < 0.0 and index == 3:
            raise ValueError(
                "the fourth white-balance multiplier cannot be negative"
            )
        result.append(numeric)
    return tuple(result)  # type: ignore


def _x_t5_headroom_normalization_from_levels(
    black_levels: Sequence[int],
    white_level: int,
) -> Dict[str, object]:
    """Validate X-T5 levels and describe uint16-to-linear normalization."""

    black_levels = tuple(int(value) for value in black_levels)
    white_level = int(white_level)
    if len(black_levels) != 4 or len(set(black_levels)) != 1:
        raise RuntimeError(
            "X-T5 highlight-headroom decode requires one shared four-channel "
            f"black level, got {black_levels!r}"
        )
    black_level = black_levels[0]
    if not 0 <= black_level < white_level < LIBRAW_HEADROOM_USER_SATURATION:
        raise RuntimeError(
            "X-T5 highlight-headroom black/white levels are invalid: "
            f"black={black_level}, white={white_level}"
        )
    normalization_divisor = white_level - black_level
    uint16_to_linear_scale = (
        LIBRAW_HEADROOM_USER_SATURATION
        / (65535.0 * normalization_divisor)
    )
    return {
        "enabled": True,
        "method": "libraw_user_sat_with_uint16_linear_normalization",
        "libraw_user_sat": LIBRAW_HEADROOM_USER_SATURATION,
        "black_levels": list(black_levels),
        "white_level": white_level,
        "normalization_divisor": normalization_divisor,
        "uint16_to_linear_scale": uint16_to_linear_scale,
        "purpose": (
            "preserve white-balanced sensor values above profile white "
            "instead of clipping them inside LibRaw's uint16 scale_colors"
        ),
    }


def _x_t5_headroom_normalization(source_path: Path) -> Dict[str, object]:
    """Read public X-T5 black/white levels before the low-scale decode."""

    import rawpy

    with rawpy.imread(str(source_path)) as raw:
        return _x_t5_headroom_normalization_from_levels(
            raw.black_level_per_channel,
            raw.white_level,
        )


def decode_x_t5_full_active(
    raw_path: Path,
    *,
    half_size: bool = True,
    white_balance_multipliers: Optional[Sequence[float]] = None,
    white_balance_resolver: Optional[
        Callable[
            [Tuple[float, float, float, float]],
            Sequence[float],
        ]
    ] = None,
    preserve_highlight_headroom: bool = False,
) -> Tuple[np.ndarray, Dict[str, object]]:
    """Decode one X-T5 RAF at Camera Raw's full active sensor geometry."""

    if (
        white_balance_multipliers is not None
        and white_balance_resolver is not None
    ):
        raise ValueError(
            "provide explicit white-balance multipliers or a resolver, "
            "not both"
        )
    if not isinstance(preserve_highlight_headroom, bool):
        raise TypeError("preserve_highlight_headroom must be boolean")
    source_path = Path(raw_path).resolve()
    metadata = parse_raf_metadata(source_path)
    if metadata.camera_model != "X-T5":
        raise RAFFormatError(
            f"full-sensor prototype requires an X-T5 RAF, got "
            f"{metadata.camera_model!r}"
        )
    full_size = metadata.raw_image_full_size
    target_origin = metadata.raw_image_crop_top_left
    target_size = camera_raw_active_size(metadata)
    if full_size is None or target_origin is None:
        raise RAFFormatError("X-T5 RAF is missing full active geometry")
    headroom_normalization = (
        _x_t5_headroom_normalization(source_path)
        if preserve_highlight_headroom
        else {
            "enabled": False,
            "method": "libraw_default_uint16_scale",
            "normalization_divisor": 65535,
            "uint16_to_linear_scale": 1.0 / 65535.0,
        }
    )

    (
        bound,
        rawpy_version,
        version_tuple,
        version_text,
        library_sha256,
    ) = (
        _load_installed_libraw()
    )
    library = bound.library
    context = library.libraw_init(0)
    if not context:
        raise MemoryError("LibRaw could not allocate a decoder")
    processed: Optional[ctypes.POINTER(LibRawProcessedImage)] = None
    try:
        bound.check(
            "open",
            library.libraw_open_file(context, os.fsencode(source_path)),
        )
        sizes = context.contents.sizes
        identified_full_size = (
            int(sizes.raw_width),
            int(sizes.raw_height),
        )
        if identified_full_size != full_size:
            raise RAFFormatError(
                "LibRaw and RAF full-mosaic geometry disagree: "
                f"{identified_full_size} != {full_size}"
            )
        identified_make = bytes(context.contents.idata.make).split(
            b"\0",
            1,
        )[0].decode("ascii", errors="replace")
        identified_model = bytes(context.contents.idata.model).split(
            b"\0",
            1,
        )[0].decode("ascii", errors="replace")
        normalized_model = bytes(
            context.contents.idata.normalized_model
        ).split(b"\0", 1)[0].decode("ascii", errors="replace")
        if identified_model != "X-T5" and normalized_model != "X-T5":
            raise RAFFormatError(
                "LibRaw did not identify the source as an X-T5: "
                f"model={identified_model!r}, "
                f"normalized_model={normalized_model!r}"
            )
        libraw_flip = int(sizes.flip)
        output_orientation = libraw_flip_orientation(libraw_flip)
        geometry = apply_full_sensor_geometry(
            context.contents,
            target_origin=target_origin,
            target_size=target_size,
        )
        output_params = _output_params_prefix(context.contents)
        output_params.half_size = int(bool(half_size))
        if preserve_highlight_headroom:
            output_params.user_sat = LIBRAW_HEADROOM_USER_SATURATION

        camera_multipliers = [
            float(library.libraw_get_cam_mul(context, index))
            for index in range(4)
        ]
        if (
            not all(np.isfinite(camera_multipliers))
            or any(value <= 0.0 for value in camera_multipliers[:3])
            or camera_multipliers[3] < 0.0
        ):
            raise RuntimeError(
                "LibRaw returned invalid camera white-balance multipliers: "
                f"{camera_multipliers}"
            )
        if white_balance_resolver is not None:
            applied_multipliers = _validated_white_balance_multipliers(
                white_balance_resolver(tuple(camera_multipliers))
            )
        elif white_balance_multipliers is not None:
            applied_multipliers = _validated_white_balance_multipliers(
                white_balance_multipliers
            )
        else:
            applied_multipliers = tuple(camera_multipliers)
        for index, value in enumerate(applied_multipliers):
            library.libraw_set_user_mul(context, index, value)
        library.libraw_set_output_color(context, LIBRAW_PROPHOTO)
        library.libraw_set_output_bps(context, 16)
        library.libraw_set_gamma(context, 0, 1.0)
        library.libraw_set_gamma(context, 1, 1.0)
        library.libraw_set_no_auto_bright(context, 1)
        library.libraw_set_adjust_maximum_thr(
            context,
            LIBRAW_ADJUST_MAXIMUM_THRESHOLD,
        )
        library.libraw_set_highlight(context, LIBRAW_HIGHLIGHT_MODE)

        bound.check("unpack", library.libraw_unpack(context))
        bound.check("process", library.libraw_dcraw_process(context))
        memory_error = ctypes.c_int()
        processed = library.libraw_dcraw_make_mem_image(
            context,
            ctypes.byref(memory_error),
        )
        bound.check("memory output", memory_error.value)
        if not processed:
            raise MemoryError("LibRaw returned no processed image")

        header = processed.contents
        if (
            header.type != LIBRAW_BITMAP_IMAGE
            or header.colors != 3
            or header.bits != 16
        ):
            raise RuntimeError(
                "unexpected LibRaw output header: "
                f"type={header.type}, colors={header.colors}, "
                f"bits={header.bits}"
            )
        expected_bytes = (
            int(header.width)
            * int(header.height)
            * int(header.colors)
            * 2
        )
        if int(header.data_size) != expected_bytes:
            raise RuntimeError(
                "LibRaw output length does not match its dimensions"
            )
        scale = 2 if half_size else 1
        if target_size[0] % scale or target_size[1] % scale:
            raise RAFFormatError(
                "X-T5 active dimensions are not divisible by the requested "
                f"decode scale {scale}"
            )
        native_output_size = (
            target_size[0] // scale,
            target_size[1] // scale,
        )
        expected_output_size = (
            native_output_size[::-1]
            if libraw_flip in (5, 6)
            else native_output_size
        )
        actual_output_size = (int(header.width), int(header.height))
        if actual_output_size != expected_output_size:
            raise RuntimeError(
                "LibRaw output dimensions disagree with the active geometry "
                f"and rotation: {actual_output_size} != "
                f"{expected_output_size}"
            )
        address = (
            ctypes.addressof(header) + LibRawProcessedImage.data.offset
        )
        buffer = (ctypes.c_ubyte * expected_bytes).from_address(address)
        rgb = (
            np.ctypeslib.as_array(buffer)
            .view("<u2")
            .reshape(header.height, header.width, header.colors)
            .copy()
        )
    finally:
        if processed:
            library.libraw_dcraw_clear_mem(processed)
        library.libraw_close(context)

    manifest: Dict[str, object] = {
        "decoder": "installed_libraw_public_c_api_full_sensor_prototype",
        "raw": str(source_path),
        "rawpy_version": rawpy_version,
        "libraw_version": list(version_tuple),
        "libraw_version_text": version_text,
        "libraw_library": str(bound.path),
        "libraw_library_sha256": library_sha256,
        "openmp": {"OMP_NUM_THREADS": "1"},
        "identified_camera": {
            "make": identified_make,
            "model": identified_model,
            "normalized_model": normalized_model,
        },
        "camera_white_balance_multipliers": camera_multipliers,
        "applied_white_balance_multipliers": list(applied_multipliers),
        "white_balance_override": (
            white_balance_multipliers is not None
            or white_balance_resolver is not None
        ),
        "scene_dependent_adjust_maximum_threshold": (
            LIBRAW_ADJUST_MAXIMUM_THRESHOLD
        ),
        "libraw_highlight_mode": {
            "value": LIBRAW_HIGHLIGHT_MODE,
            "name": "Clip",
            "explicit": True,
            "alternate_modes_validation": (
                "blend_and_reconstruction_modes_rejected_against_"
                "lightroom_high_range_corpus"
            ),
        },
        "output": {
            "space": "linear_prophoto",
            "bits_per_channel": 16,
            "storage_dtype": str(rgb.dtype),
            "highlight_headroom": headroom_normalization,
            "size": [int(rgb.shape[1]), int(rgb.shape[0])],
            "orientation_applied": True,
            "orientation": output_orientation,
            "libraw_flip": libraw_flip,
            "libraw_half_size": bool(half_size),
        },
        "geometry": {
            **geometry,
            "decode_scale": 2 if half_size else 1,
        },
    }
    return rgb, manifest


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Probe an X-T5 RAF through LibRaw at Camera Raw's full active "
            "sensor geometry"
        )
    )
    parser.add_argument("raw", type=Path)
    parser.add_argument(
        "--output-npy",
        type=Path,
        help="optional destination for the full uint16 linear-ProPhoto array",
    )
    parser.add_argument(
        "--full-resolution",
        action="store_true",
        help=(
            "run full-resolution X-Trans interpolation instead of LibRaw's "
            "fast deterministic half-size preview"
        ),
    )
    arguments = parser.parse_args()

    rgb, manifest = decode_x_t5_full_active(
        arguments.raw,
        half_size=not arguments.full_resolution,
    )
    manifest["output"]["sha256"] = hashlib.sha256(
        memoryview(rgb)
    ).hexdigest()
    if arguments.output_npy is not None:
        destination = arguments.output_npy.resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        np.save(destination, rgb, allow_pickle=False)
        manifest["output"]["npy"] = str(destination)
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
