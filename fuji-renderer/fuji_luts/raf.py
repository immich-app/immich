"""Bounds-checked reader for the metadata directory in Fujifilm RAF files.

RAF files begin with a fixed 108-byte header.  The big-endian words at
offsets 92 and 96 locate a compact metadata directory.  That directory starts
with a 32-bit entry count followed by records of the form::

    uint16 tag
    uint16 payload_length
    byte[payload_length] payload

This is deliberately a small, pure-Python parser.  It reads only the bounded
metadata region declared by the RAF header and does not invoke a camera-raw
library or an external metadata program.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct
from typing import Any, Dict, Optional, Tuple


RAF_SIGNATURE = b"FUJIFILMCCD-RAW "
RAF_HEADER_SIZE = 108
MAX_RAF_METADATA_BYTES = 16 * 1024 * 1024

# Fujifilm HDR RAFs concatenate several complete RAF blocks and describe them
# in a bounded table between the outer header and embedded JPEG.  X-T5 files
# observed in the Lightroom comparison corpus use this exact versioned layout.
FUJI_MRAW_TABLE_OFFSET = 0x94
FUJI_MRAW_IDENTIFIER = b"FUJIFILMM-RAW   "
FUJI_MRAW_FORMAT_VERSION = "1.00"
FUJI_MRAW_CONTAINER_VERSION = 2
FUJI_MRAW_RECORDS_OFFSET = 0xC0
FUJI_MRAW_TAGGED_PAYLOAD_BYTES = 0x40
FUJI_MRAW_TAG_COUNT = 7
FUJI_MRAW_RECORD_STRIDE = 0x50
MAX_FUJI_MRAW_FRAMES = 16

TAG_MRAW_FRAME_INDEX = 0x2001
TAG_MRAW_EXPOSURE_EV = 0x2003
TAG_MRAW_EXPOSURE_AUXILIARY_EV = 0x2004
TAG_MRAW_EXPOSURE_SECONDS = 0x2005
TAG_MRAW_F_NUMBER = 0x2006
TAG_MRAW_ISO = 0x2007
TAG_MRAW_UNKNOWN_0X2008 = 0x2008
FUJI_MRAW_TAG_SEQUENCE = (
    TAG_MRAW_FRAME_INDEX,
    TAG_MRAW_EXPOSURE_EV,
    TAG_MRAW_EXPOSURE_AUXILIARY_EV,
    TAG_MRAW_EXPOSURE_SECONDS,
    TAG_MRAW_F_NUMBER,
    TAG_MRAW_ISO,
    TAG_MRAW_UNKNOWN_0X2008,
)

TAG_RAW_IMAGE_FULL_SIZE = 0x0100
TAG_RAW_IMAGE_CROP_TOP_LEFT = 0x0110
# Camera Raw parses all three size pairs separately.  Its X-T5 model branch
# selects tag 0x0112; retain the older 0x0111 name for compatibility with
# callers and RAF variants that do not carry the preferred pair.
TAG_RAW_IMAGE_CROPPED_SIZE = 0x0111
TAG_RAW_IMAGE_CROP_SIZE_ADOBE_XT5 = 0x0112
TAG_RAW_IMAGE_ALTERNATE_SIZE = 0x0113
TAG_RAW_IMAGE_ASPECT_RATIO = 0x0115
TAG_RAW_ZOOM_ACTIVE = 0x0117
TAG_RAW_ZOOM_TOP_LEFT = 0x0118
TAG_RAW_ZOOM_SIZE = 0x0119
TAG_RAW_BIT_DEPTH = 0x0141
TAG_RAW_EXPOSURE_BIAS = 0x9650
TAG_RAW_EXPOSURE_AUXILIARY = 0x9651

# X-T5 DR100 files report -0.72 EV in RawExposureBias.  DR200 and DR400
# reduce raw capture exposure by one and two further stops respectively.
FUJI_XT5_DR100_RAW_EXPOSURE_BIAS_EV = -0.72
# Camera Raw 9.1's supported-Fujifilm path negates RAF tag 0x9650 and
# subtracts 0.5 EV. Keep this processing constant separate from the X-T5's
# -0.72 EV DR100 metadata baseline used only to infer the selected DR mode.
CAMERA_RAW_FUJI_EXPOSURE_CONSTANT_EV = -0.5
LIBRAW_HALF_SIZE_SCALE = 2


class RAFFormatError(ValueError):
    """Raised when a RAF header or metadata directory is malformed."""


@dataclass(frozen=True)
class RAFTag:
    """One entry from the RAF metadata directory."""

    tag: int
    data: bytes


@dataclass(frozen=True)
class RAFMultiRawFrame:
    """One exposure record and bounded RAF block in a Fujifilm M-RAW file."""

    frame_index: int
    block_offset: int
    block_length: int
    exposure_ev: float
    exposure_auxiliary_ev: float
    exposure_seconds: float
    f_number: float
    iso: int
    unknown_tag_0x2008: int
    metadata_offset: int
    metadata_length: int
    raw_offset: int
    raw_length: int
    raw_exposure_bias_ev: Optional[float]

    def manifest_metadata(self) -> Dict[str, object]:
        """Return reproducible, JSON-compatible frame metadata."""

        return {
            "frame_index": self.frame_index,
            "block_offset": self.block_offset,
            "block_length": self.block_length,
            "exposure_ev": self.exposure_ev,
            "exposure_auxiliary_ev": self.exposure_auxiliary_ev,
            "exposure_seconds": self.exposure_seconds,
            "f_number": self.f_number,
            "iso": self.iso,
            "unknown_tag_0x2008": self.unknown_tag_0x2008,
            "metadata_offset": self.metadata_offset,
            "metadata_length": self.metadata_length,
            "raw_offset": self.raw_offset,
            "raw_length": self.raw_length,
            "raw_exposure_bias_ev": self.raw_exposure_bias_ev,
        }


@dataclass(frozen=True)
class RAFMultiRaw:
    """Validated Fujifilm M-RAW container metadata."""

    format_version: str
    container_version: int
    record_version: str
    tagged_payload_bytes: int
    tag_count: int
    frames: Tuple[RAFMultiRawFrame, ...]

    def manifest_metadata(self) -> Dict[str, object]:
        """Return reproducible, JSON-compatible container metadata."""

        return {
            "format": "Fujifilm M-RAW",
            "identifier": FUJI_MRAW_IDENTIFIER.decode("ascii"),
            "format_version": self.format_version,
            "container_version": self.container_version,
            "record_version": self.record_version,
            "tagged_payload_bytes": self.tagged_payload_bytes,
            "tag_count": self.tag_count,
            "frame_count": len(self.frames),
            "frames": [
                frame.manifest_metadata() for frame in self.frames
            ],
        }


def raw_exposure_correction_ev(raw_exposure_bias_ev: Optional[float]) -> float:
    """Return Camera Raw's deterministic correction for Fuji RAF tag 0x9650.

    A missing bias is treated as zero additional correction so this metadata
    improvement remains compatible with older Fujifilm RAF variants that do
    not carry tag 0x9650.
    """

    if raw_exposure_bias_ev is None:
        return 0.0
    bias = float(raw_exposure_bias_ev)
    if not math.isfinite(bias):
        raise RAFFormatError("RawExposureBias must be finite")
    return CAMERA_RAW_FUJI_EXPOSURE_CONSTANT_EV - bias


@dataclass(frozen=True)
class RAFMetadata:
    """Header locations and selected metadata from one RAF file."""

    file_size: int
    format_version: str
    camera_id: str
    camera_model: str
    directory_version: str
    jpeg_offset: int
    jpeg_length: int
    metadata_offset: int
    metadata_length: int
    raw_offset: int
    raw_length: int
    entries: Tuple[RAFTag, ...]

    def _entry_data(self, tag: int) -> Optional[bytes]:
        for entry in self.entries:
            if entry.tag == tag:
                return entry.data
        return None

    def _u16_pair(self, tag: int, name: str) -> Optional[Tuple[int, int]]:
        data = self._entry_data(tag)
        if data is None:
            return None
        if len(data) != 4:
            raise RAFFormatError(
                f"{name} tag 0x{tag:04x} must contain four bytes"
            )
        return struct.unpack(">HH", data)

    def _u32(self, tag: int, name: str) -> Optional[int]:
        data = self._entry_data(tag)
        if data is None:
            return None
        if len(data) != 4:
            raise RAFFormatError(
                f"{name} tag 0x{tag:04x} must contain four bytes"
            )
        return struct.unpack(">I", data)[0]

    def _signed_rational16(
        self,
        tag: int,
        name: str,
    ) -> Optional[float]:
        data = self._entry_data(tag)
        if data is None:
            return None
        if len(data) != 4:
            raise RAFFormatError(
                f"{name} tag 0x{tag:04x} must contain four bytes"
            )
        numerator, denominator = struct.unpack(">hh", data)
        if denominator == 0:
            raise RAFFormatError(
                f"{name} tag 0x{tag:04x} has a zero denominator"
            )
        return numerator / denominator

    @property
    def raw_image_full_size(self) -> Optional[Tuple[int, int]]:
        """Full raw dimensions as ``(width, height)``."""

        pair = self._u16_pair(
            TAG_RAW_IMAGE_FULL_SIZE,
            "RawImageFullSize",
        )
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_image_crop_top_left(self) -> Optional[Tuple[int, int]]:
        """Raw crop origin as ``(left, top)``."""

        pair = self._u16_pair(
            TAG_RAW_IMAGE_CROP_TOP_LEFT,
            "RawImageCropTopLeft",
        )
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_image_size_tag_0x0111(self) -> Optional[Tuple[int, int]]:
        """RAF tag 0x0111 dimensions as ``(width, height)``."""
        pair = self._u16_pair(
            TAG_RAW_IMAGE_CROPPED_SIZE,
            "RAF image size 0x0111",
        )
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_image_size_tag_0x0112(self) -> Optional[Tuple[int, int]]:
        """RAF tag 0x0112 dimensions as ``(width, height)``.

        Unlike the neighboring size records, this payload is already ordered
        width then height.  Static analysis of Camera Raw 9.1 shows that its
        X-T5 model branch reads this pair for the final active crop.
        """

        pair = self._u16_pair(
            TAG_RAW_IMAGE_CROP_SIZE_ADOBE_XT5,
            "RAF image size 0x0112",
        )
        return pair

    @property
    def raw_image_size_tag_0x0113(self) -> Optional[Tuple[int, int]]:
        """RAF tag 0x0113 alternate dimensions as ``(width, height)``."""

        pair = self._u16_pair(
            TAG_RAW_IMAGE_ALTERNATE_SIZE,
            "RAF image size 0x0113",
        )
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_image_cropped_size(self) -> Optional[Tuple[int, int]]:
        """Camera Raw-compatible active dimensions as ``(width, height)``.

        X-T5 files use tag 0x0112.  Falling back to 0x0111 keeps the parser
        usable for older RAF variants and existing synthetic callers.
        """

        preferred = self.raw_image_size_tag_0x0112
        return (
            preferred
            if preferred is not None
            else self.raw_image_size_tag_0x0111
        )

    @property
    def raw_image_aspect_ratio(self) -> Optional[Tuple[int, int]]:
        """Selected in-camera aspect ratio as ``(width, height)``."""

        pair = self._u16_pair(
            TAG_RAW_IMAGE_ASPECT_RATIO,
            "RawImageAspectRatio",
        )
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_zoom_active(self) -> Optional[bool]:
        value = self._u32(TAG_RAW_ZOOM_ACTIVE, "RawZoomActive")
        return None if value is None else bool(value)

    @property
    def raw_zoom_top_left(self) -> Optional[Tuple[int, int]]:
        pair = self._u16_pair(TAG_RAW_ZOOM_TOP_LEFT, "RawZoomTopLeft")
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_zoom_size(self) -> Optional[Tuple[int, int]]:
        pair = self._u16_pair(TAG_RAW_ZOOM_SIZE, "RawZoomSize")
        return None if pair is None else (pair[1], pair[0])

    @property
    def raw_bit_depth(self) -> Optional[int]:
        pair = self._u16_pair(TAG_RAW_BIT_DEPTH, "RawBitDepth")
        return None if pair is None else pair[0]

    @property
    def raw_exposure_bias_primary_ev(self) -> Optional[float]:
        return self._signed_rational16(
            TAG_RAW_EXPOSURE_BIAS,
            "RawExposureBias",
        )

    @property
    def raw_exposure_auxiliary_0x9651_ev(self) -> Optional[float]:
        """Return undocumented tag 0x9651 without assigning it semantics."""

        return self._signed_rational16(
            TAG_RAW_EXPOSURE_AUXILIARY,
            "RAF tag 0x9651",
        )

    @property
    def raw_exposure_bias_ev(self) -> Optional[float]:
        """Return the documented Fujifilm ``RawExposureBias`` tag 0x9650."""

        return self.raw_exposure_bias_primary_ev

    def manifest_metadata(self) -> Dict[str, object]:
        """Return JSON-compatible metadata used to reproduce a render."""

        bias = self.raw_exposure_bias_ev
        correction = raw_exposure_correction_ev(bias)
        correction_factor = 2.0**correction
        dynamic_range_ev = (
            0.0
            if bias is None
            else max(
                0.0,
                FUJI_XT5_DR100_RAW_EXPOSURE_BIAS_EV - bias,
            )
        )
        inferred_dr_percent = 100.0 * (2.0**dynamic_range_ev)
        if math.isclose(
            inferred_dr_percent,
            round(inferred_dr_percent),
            rel_tol=0.0,
            abs_tol=1e-9,
        ):
            inferred_dr_percent = int(round(inferred_dr_percent))

        def dimensions(
            value: Optional[Tuple[int, int]],
        ) -> Optional[list]:
            return None if value is None else list(value)

        return {
            "format_version": self.format_version,
            "camera_id": self.camera_id,
            "camera_model": self.camera_model,
            "directory_version": self.directory_version,
            "file_size": self.file_size,
            "jpeg_offset": self.jpeg_offset,
            "jpeg_length": self.jpeg_length,
            "metadata_offset": self.metadata_offset,
            "metadata_length": self.metadata_length,
            "raw_offset": self.raw_offset,
            "raw_length": self.raw_length,
            "raw_image_full_size": dimensions(self.raw_image_full_size),
            "raw_image_crop_top_left": dimensions(
                self.raw_image_crop_top_left
            ),
            "raw_image_cropped_size": dimensions(
                self.raw_image_cropped_size
            ),
            "raw_image_cropped_size_source_tag": (
                "0x0112"
                if self.raw_image_size_tag_0x0112 is not None
                else (
                    "0x0111"
                    if self.raw_image_size_tag_0x0111 is not None
                    else None
                )
            ),
            "raw_image_size_tag_0x0111": dimensions(
                self.raw_image_size_tag_0x0111
            ),
            "raw_image_size_tag_0x0112": dimensions(
                self.raw_image_size_tag_0x0112
            ),
            "raw_image_size_tag_0x0113": dimensions(
                self.raw_image_size_tag_0x0113
            ),
            "raw_image_aspect_ratio": dimensions(
                self.raw_image_aspect_ratio
            ),
            "raw_zoom_active": self.raw_zoom_active,
            "raw_zoom_top_left": dimensions(self.raw_zoom_top_left),
            "raw_zoom_size": dimensions(self.raw_zoom_size),
            "raw_bit_depth": self.raw_bit_depth,
            "raw_exposure_bias_tag_0x9650_ev": (
                self.raw_exposure_bias_primary_ev
            ),
            "raw_exposure_auxiliary_tag_0x9651_ev": (
                self.raw_exposure_auxiliary_0x9651_ev
            ),
            "raw_exposure_bias_ev": bias,
            "dr100_raw_exposure_bias_ev": (
                FUJI_XT5_DR100_RAW_EXPOSURE_BIAS_EV
            ),
            "camera_raw_fuji_exposure_constant_ev": (
                CAMERA_RAW_FUJI_EXPOSURE_CONSTANT_EV
            ),
            "raw_exposure_correction_ev": correction,
            "raw_exposure_correction_factor": correction_factor,
            "raw_dynamic_range_percent_inferred_from_bias": (
                inferred_dr_percent
            ),
        }


def apply_raf_active_crop(
    decoded: Any,
    metadata: RAFMetadata,
    *,
    decode_scale: int = LIBRAW_HALF_SIZE_SCALE,
) -> Tuple[Any, Dict[str, object]]:
    """Center-crop a LibRaw decode to the RAF-declared active image area.

    LibRaw has already removed part of the sensor border by the time
    ``postprocess(half_size=True)`` returns, so the RAF crop origin cannot be
    applied directly to that array.  The remaining border is centered: the
    decoded dimensions must fall between ``RawImageCroppedSize`` and
    ``RawImageFullSize`` at the declared decode scale.  That bounded interval
    also identifies whether LibRaw applied a 90-degree camera orientation.

    If the RAF has no cropped-size tag, the image is returned unchanged and
    the provenance records that no crop was available.  Incomplete or
    inconsistent geometry is rejected instead of cropping an arbitrary image.
    """

    if not isinstance(decode_scale, int) or isinstance(decode_scale, bool):
        raise RAFFormatError("RAF active-crop decode scale must be an integer")
    if decode_scale <= 0:
        raise RAFFormatError("RAF active-crop decode scale must be positive")

    shape = getattr(decoded, "shape", None)
    if shape is None or len(shape) < 2:
        raise RAFFormatError(
            "decoded image must have at least height and width dimensions"
        )
    source_height = int(shape[0])
    source_width = int(shape[1])
    if source_width <= 0 or source_height <= 0:
        raise RAFFormatError("decoded image dimensions must be positive")

    active_raw = metadata.raw_image_cropped_size
    base_provenance: Dict[str, object] = {
        "decode_scale": decode_scale,
        "decoded_size_before": [source_width, source_height],
        "raw_image_cropped_size": (
            None if active_raw is None else list(active_raw)
        ),
        "raw_image_full_size": (
            None
            if metadata.raw_image_full_size is None
            else list(metadata.raw_image_full_size)
        ),
        "raw_image_crop_top_left": (
            None
            if metadata.raw_image_crop_top_left is None
            else list(metadata.raw_image_crop_top_left)
        ),
    }
    if active_raw is None:
        base_provenance.update(
            {
                "applied": False,
                "reason": "raw_image_cropped_size_missing",
                "orientation": None,
                "target_size": None,
                "decoded_size_after": [source_width, source_height],
                "crop_pixels": {
                    "left": 0,
                    "top": 0,
                    "right": 0,
                    "bottom": 0,
                },
            }
        )
        return decoded, base_provenance

    full_raw = metadata.raw_image_full_size
    if full_raw is None:
        raise RAFFormatError(
            "RawImageFullSize is required to validate the RAF active crop"
        )

    def scaled_dimensions(
        dimensions: Tuple[int, int],
        name: str,
    ) -> Tuple[int, int]:
        width, height = dimensions
        if width <= 0 or height <= 0:
            raise RAFFormatError(f"{name} dimensions must be positive")
        if width % decode_scale or height % decode_scale:
            raise RAFFormatError(
                f"{name} dimensions {width}x{height} are not divisible by "
                f"decode scale {decode_scale}"
            )
        return width // decode_scale, height // decode_scale

    active_scaled = scaled_dimensions(active_raw, "RawImageCroppedSize")
    full_scaled = scaled_dimensions(full_raw, "RawImageFullSize")
    if (
        active_raw[0] > full_raw[0]
        or active_raw[1] > full_raw[1]
    ):
        raise RAFFormatError(
            "RawImageCroppedSize exceeds RawImageFullSize"
        )

    crop_origin = metadata.raw_image_crop_top_left
    if crop_origin is not None:
        left_raw, top_raw = crop_origin
        if left_raw < 0 or top_raw < 0:
            raise RAFFormatError("RawImageCropTopLeft cannot be negative")
        if (
            left_raw + active_raw[0] > full_raw[0]
            or top_raw + active_raw[1] > full_raw[1]
        ):
            raise RAFFormatError(
                "RAF active crop extends beyond RawImageFullSize"
            )

    orientations = (
        (
            "metadata_native",
            active_scaled,
            full_scaled,
        ),
        (
            "rotated_90_or_270",
            (active_scaled[1], active_scaled[0]),
            (full_scaled[1], full_scaled[0]),
        ),
    )
    candidates = []
    seen_geometry = set()
    for orientation, target, full in orientations:
        geometry = (target, full)
        if geometry in seen_geometry:
            continue
        seen_geometry.add(geometry)
        target_width, target_height = target
        full_width, full_height = full
        if (
            target_width <= source_width <= full_width
            and target_height <= source_height <= full_height
        ):
            candidates.append((orientation, target))

    if len(candidates) != 1:
        active_text = f"{active_scaled[0]}x{active_scaled[1]}"
        full_text = f"{full_scaled[0]}x{full_scaled[1]}"
        raise RAFFormatError(
            "decoded dimensions "
            f"{source_width}x{source_height} are inconsistent with RAF "
            f"active/full dimensions {active_text}/{full_text} at decode "
            f"scale {decode_scale}"
        )

    orientation, (target_width, target_height) = candidates[0]
    horizontal_border = source_width - target_width
    vertical_border = source_height - target_height
    left = horizontal_border // 2
    right = horizontal_border - left
    top = vertical_border // 2
    bottom = vertical_border - top
    cropped = decoded[
        top : source_height - bottom,
        left : source_width - right,
        ...,
    ]
    if tuple(cropped.shape[:2]) != (target_height, target_width):
        raise RAFFormatError(
            "internal RAF active-crop error produced unexpected dimensions"
        )

    applied = bool(left or top or right or bottom)
    base_provenance.update(
        {
            "applied": applied,
            "reason": (
                "centered_libraw_border_removed"
                if applied
                else "decoded_image_already_matches_active_area"
            ),
            "orientation": orientation,
            "target_size": [target_width, target_height],
            "decoded_size_after": [target_width, target_height],
            "crop_pixels": {
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
            },
        }
    )
    return cropped, base_provenance


def _decode_ascii(data: bytes, name: str) -> str:
    try:
        return data.rstrip(b"\0 ").decode("ascii")
    except UnicodeDecodeError as exc:
        raise RAFFormatError(f"RAF {name} is not ASCII") from exc


def _validate_region(
    name: str,
    offset: int,
    length: int,
    file_size: int,
) -> None:
    if offset < 0 or length < 0 or offset > file_size:
        raise RAFFormatError(f"RAF {name} region is outside the file")
    if length > file_size - offset:
        raise RAFFormatError(f"RAF {name} region is truncated")


def _parse_raf_directory(
    directory: bytes,
    metadata_length: int,
) -> Tuple[RAFTag, ...]:
    """Parse one bounded compact RAF metadata directory."""

    entry_count = struct.unpack_from(">I", directory, 0)[0]
    maximum_entry_count = (metadata_length - 4) // 4
    if entry_count > maximum_entry_count:
        raise RAFFormatError(
            "RAF metadata entry count cannot fit in the declared region"
        )

    cursor = 4
    entries = []
    seen = set()
    for index in range(entry_count):
        if cursor + 4 > metadata_length:
            raise RAFFormatError(
                f"RAF metadata entry {index} header is truncated"
            )
        tag, payload_length = struct.unpack_from(">HH", directory, cursor)
        cursor += 4
        payload_end = cursor + payload_length
        if payload_end > metadata_length:
            raise RAFFormatError(
                f"RAF metadata tag 0x{tag:04x} payload is truncated"
            )
        if tag in seen:
            raise RAFFormatError(
                f"RAF metadata contains duplicate tag 0x{tag:04x}"
            )
        seen.add(tag)
        entries.append(RAFTag(tag, directory[cursor:payload_end]))
        cursor = payload_end

    return tuple(entries)


def _parse_raf_metadata_block(
    source_path: Path,
    block_offset: int,
    block_length: int,
) -> RAFMetadata:
    """Parse one RAF block inside a possibly concatenated source file."""

    if (
        isinstance(block_offset, bool)
        or isinstance(block_length, bool)
        or not isinstance(block_offset, int)
        or not isinstance(block_length, int)
        or block_offset < 0
        or block_length < RAF_HEADER_SIZE
    ):
        raise RAFFormatError("RAF block bounds are invalid")

    with source_path.open("rb") as source:
        source.seek(0, 2)
        source_size = source.tell()
        _validate_region(
            "block",
            block_offset,
            block_length,
            source_size,
        )
        source.seek(block_offset)
        header = source.read(RAF_HEADER_SIZE)
        if len(header) != RAF_HEADER_SIZE:
            raise RAFFormatError("RAF header is truncated")
        if not header.startswith(RAF_SIGNATURE):
            raise RAFFormatError(
                f"not a Fujifilm RAF block at offset {block_offset}: "
                f"{source_path}"
            )

        jpeg_offset, jpeg_length = struct.unpack_from(">II", header, 84)
        metadata_offset, metadata_length = struct.unpack_from(
            ">II",
            header,
            92,
        )
        raw_offset, raw_length = struct.unpack_from(">II", header, 100)

        if metadata_offset < RAF_HEADER_SIZE:
            raise RAFFormatError("RAF metadata overlaps the fixed header")
        _validate_region(
            "metadata",
            metadata_offset,
            metadata_length,
            block_length,
        )
        if metadata_length < 4:
            raise RAFFormatError("RAF metadata directory is truncated")
        if metadata_length > MAX_RAF_METADATA_BYTES:
            raise RAFFormatError(
                "RAF metadata directory exceeds the safety limit of "
                f"{MAX_RAF_METADATA_BYTES} bytes"
            )

        source.seek(block_offset + metadata_offset)
        directory = source.read(metadata_length)
        if len(directory) != metadata_length:
            raise RAFFormatError("RAF metadata directory is truncated")

    result = RAFMetadata(
        file_size=block_length,
        format_version=_decode_ascii(header[16:20], "format version"),
        camera_id=_decode_ascii(header[20:28], "camera ID"),
        camera_model=_decode_ascii(header[28:60], "camera model"),
        directory_version=_decode_ascii(
            header[60:64],
            "directory version",
        ),
        jpeg_offset=jpeg_offset,
        jpeg_length=jpeg_length,
        metadata_offset=metadata_offset,
        metadata_length=metadata_length,
        raw_offset=raw_offset,
        raw_length=raw_length,
        entries=_parse_raf_directory(directory, metadata_length),
    )

    # Validate the selected known fields now so malformed metadata cannot stay
    # latent until a later render stage.
    result.manifest_metadata()
    return result


def parse_raf_metadata(path: Path) -> RAFMetadata:
    """Parse the first RAF block and its bounded big-endian metadata tags."""

    source_path = Path(path)
    try:
        file_size = source_path.stat().st_size
    except OSError:
        raise
    return _parse_raf_metadata_block(source_path, 0, file_size)


def _mraw_u32(data: bytes, name: str) -> int:
    if len(data) != 4:
        raise RAFFormatError(f"Fujifilm M-RAW {name} must contain four bytes")
    return struct.unpack(">I", data)[0]


def _mraw_signed_rational16(data: bytes, name: str) -> float:
    if len(data) != 4:
        raise RAFFormatError(f"Fujifilm M-RAW {name} must contain four bytes")
    numerator, denominator = struct.unpack(">hh", data)
    if denominator == 0:
        raise RAFFormatError(
            f"Fujifilm M-RAW {name} has a zero denominator"
        )
    return numerator / denominator


def _mraw_unsigned_rational32(data: bytes, name: str) -> float:
    if len(data) != 8:
        raise RAFFormatError(f"Fujifilm M-RAW {name} must contain eight bytes")
    numerator, denominator = struct.unpack(">II", data)
    if denominator == 0:
        raise RAFFormatError(
            f"Fujifilm M-RAW {name} has a zero denominator"
        )
    value = numerator / denominator
    if not math.isfinite(value) or value <= 0.0:
        raise RAFFormatError(f"Fujifilm M-RAW {name} must be positive")
    return value


def _parse_mraw_record(
    record: bytes,
    record_index: int,
) -> Dict[str, object]:
    """Parse one fixed-size, tagged Fujifilm M-RAW frame record."""

    if len(record) != FUJI_MRAW_RECORD_STRIDE:
        raise RAFFormatError("Fujifilm M-RAW frame record is truncated")
    block_offset, block_length = struct.unpack_from(">QQ", record, 0)
    cursor = 16
    payloads: Dict[int, bytes] = {}
    observed_tags = []
    for tag_index in range(FUJI_MRAW_TAG_COUNT):
        if cursor + 4 > len(record):
            raise RAFFormatError(
                f"Fujifilm M-RAW record {record_index} tag header is "
                "truncated"
            )
        tag, payload_length = struct.unpack_from(">HH", record, cursor)
        cursor += 4
        payload_end = cursor + payload_length
        if payload_end > len(record):
            raise RAFFormatError(
                f"Fujifilm M-RAW record {record_index} tag 0x{tag:04x} "
                "is truncated"
            )
        if tag in payloads:
            raise RAFFormatError(
                f"Fujifilm M-RAW record {record_index} contains duplicate "
                f"tag 0x{tag:04x}"
            )
        observed_tags.append(tag)
        payloads[tag] = record[cursor:payload_end]
        cursor = payload_end

    if cursor != len(record):
        raise RAFFormatError(
            f"Fujifilm M-RAW record {record_index} tagged payload does not "
            "fill its declared record"
        )
    if tuple(observed_tags) != FUJI_MRAW_TAG_SEQUENCE:
        raise RAFFormatError(
            f"Fujifilm M-RAW record {record_index} has unsupported tag "
            f"sequence {[hex(tag) for tag in observed_tags]}"
        )

    exposure_ev = _mraw_signed_rational16(
        payloads[TAG_MRAW_EXPOSURE_EV],
        "exposure EV",
    )
    exposure_auxiliary_ev = _mraw_signed_rational16(
        payloads[TAG_MRAW_EXPOSURE_AUXILIARY_EV],
        "auxiliary exposure EV",
    )
    if not math.isclose(
        exposure_ev,
        exposure_auxiliary_ev,
        rel_tol=0.0,
        abs_tol=1e-12,
    ):
        raise RAFFormatError(
            f"Fujifilm M-RAW record {record_index} exposure tags disagree"
        )

    frame_index = _mraw_u32(
        payloads[TAG_MRAW_FRAME_INDEX],
        "frame index",
    )
    iso = _mraw_u32(payloads[TAG_MRAW_ISO], "ISO")
    if iso <= 0:
        raise RAFFormatError("Fujifilm M-RAW ISO must be positive")
    return {
        "frame_index": frame_index,
        "block_offset": block_offset,
        "block_length": block_length,
        "exposure_ev": exposure_ev,
        "exposure_auxiliary_ev": exposure_auxiliary_ev,
        "exposure_seconds": _mraw_unsigned_rational32(
            payloads[TAG_MRAW_EXPOSURE_SECONDS],
            "exposure time",
        ),
        "f_number": _mraw_unsigned_rational32(
            payloads[TAG_MRAW_F_NUMBER],
            "f-number",
        ),
        "iso": iso,
        "unknown_tag_0x2008": _mraw_u32(
            payloads[TAG_MRAW_UNKNOWN_0X2008],
            "tag 0x2008",
        ),
    }


def parse_raf_multi_raw(path: Path) -> Optional[RAFMultiRaw]:
    """Parse and strictly validate an optional Fujifilm M-RAW frame table.

    Normal single-frame RAFs return ``None``.  A present M-RAW identifier is
    version-gated and fully bounds-checked so corrupt frame offsets are never
    used as file ranges.
    """

    source_path = Path(path)
    primary_source_metadata = parse_raf_metadata(source_path)
    file_size = primary_source_metadata.file_size
    with source_path.open("rb") as source:
        if file_size < FUJI_MRAW_TABLE_OFFSET + len(FUJI_MRAW_IDENTIFIER):
            return None
        source.seek(FUJI_MRAW_TABLE_OFFSET)
        identifier = source.read(len(FUJI_MRAW_IDENTIFIER))
        if identifier != FUJI_MRAW_IDENTIFIER:
            return None

        fixed = source.read(
            FUJI_MRAW_RECORDS_OFFSET
            - FUJI_MRAW_TABLE_OFFSET
            - len(FUJI_MRAW_IDENTIFIER)
        )
        if len(fixed) != 28:
            raise RAFFormatError("Fujifilm M-RAW table header is truncated")
        format_version = _decode_ascii(
            fixed[0:4],
            "M-RAW format version",
        )
        container_version, frame_count = struct.unpack_from(">II", fixed, 4)
        record_version = _decode_ascii(
            fixed[12:16],
            "M-RAW record version",
        )
        reserved = fixed[16:24]
        tagged_payload_bytes, tag_count = struct.unpack_from(">HH", fixed, 24)

        if format_version != FUJI_MRAW_FORMAT_VERSION:
            raise RAFFormatError(
                "unsupported Fujifilm M-RAW format version "
                f"{format_version!r}"
            )
        if container_version != FUJI_MRAW_CONTAINER_VERSION:
            raise RAFFormatError(
                "unsupported Fujifilm M-RAW container version "
                f"{container_version}"
            )
        if record_version != FUJI_MRAW_FORMAT_VERSION:
            raise RAFFormatError(
                "unsupported Fujifilm M-RAW record version "
                f"{record_version!r}"
            )
        if reserved != b"\0" * len(reserved):
            raise RAFFormatError("Fujifilm M-RAW reserved bytes are nonzero")
        if not 2 <= frame_count <= MAX_FUJI_MRAW_FRAMES:
            raise RAFFormatError(
                f"Fujifilm M-RAW frame count {frame_count} is invalid"
            )
        if tagged_payload_bytes != FUJI_MRAW_TAGGED_PAYLOAD_BYTES:
            raise RAFFormatError(
                "unsupported Fujifilm M-RAW tagged payload size "
                f"{tagged_payload_bytes}"
            )
        if tag_count != FUJI_MRAW_TAG_COUNT:
            raise RAFFormatError(
                f"unsupported Fujifilm M-RAW tag count {tag_count}"
            )

        table_length = frame_count * FUJI_MRAW_RECORD_STRIDE
        records_blob = source.read(table_length)
        if len(records_blob) != table_length:
            raise RAFFormatError("Fujifilm M-RAW frame table is truncated")

    raw_records = [
        _parse_mraw_record(
            records_blob[
                index * FUJI_MRAW_RECORD_STRIDE :
                (index + 1) * FUJI_MRAW_RECORD_STRIDE
            ],
            index,
        )
        for index in range(frame_count)
    ]
    if [record["frame_index"] for record in raw_records] != list(
        range(frame_count)
    ):
        raise RAFFormatError(
            "Fujifilm M-RAW frame IDs must be ordered uniquely from zero"
        )

    expected_offset = 0
    for record in raw_records:
        block_offset = int(record["block_offset"])
        block_length = int(record["block_length"])
        if block_offset != expected_offset:
            raise RAFFormatError(
                "Fujifilm M-RAW frame blocks must be contiguous"
            )
        _validate_region(
            "M-RAW frame block",
            block_offset,
            block_length,
            file_size,
        )
        expected_offset = block_offset + block_length
    if expected_offset != file_size:
        raise RAFFormatError(
            "Fujifilm M-RAW frame blocks do not cover the complete file"
        )

    block_metadata = [
        _parse_raf_metadata_block(
            source_path,
            int(record["block_offset"]),
            int(record["block_length"]),
        )
        for record in raw_records
    ]
    first_block = block_metadata[0]
    table_end = (
        FUJI_MRAW_RECORDS_OFFSET
        + frame_count * FUJI_MRAW_RECORD_STRIDE
    )
    first_payload_offsets = [
        offset
        for offset, length in (
            (first_block.jpeg_offset, first_block.jpeg_length),
            (first_block.metadata_offset, first_block.metadata_length),
            (first_block.raw_offset, first_block.raw_length),
        )
        if length > 0
    ]
    if first_payload_offsets and table_end > min(first_payload_offsets):
        raise RAFFormatError(
            "Fujifilm M-RAW table overlaps the first frame payload"
        )

    def block_fingerprint(metadata: RAFMetadata) -> Tuple[object, ...]:
        white_balance = metadata._entry_data(0x0131)
        return (
            metadata.format_version,
            metadata.camera_id,
            metadata.camera_model,
            metadata.directory_version,
            metadata.metadata_length,
            metadata.raw_length,
            metadata.raw_image_full_size,
            metadata.raw_image_crop_top_left,
            metadata.raw_image_size_tag_0x0111,
            metadata.raw_image_size_tag_0x0112,
            metadata.raw_image_size_tag_0x0113,
            metadata.raw_bit_depth,
            white_balance,
        )

    expected_fingerprint = block_fingerprint(first_block)
    for index, (record, metadata) in enumerate(
        zip(raw_records, block_metadata)
    ):
        _validate_region(
            f"M-RAW frame {index} raw",
            metadata.raw_offset,
            metadata.raw_length,
            int(record["block_length"]),
        )
        if metadata.raw_offset + metadata.raw_length != int(
            record["block_length"]
        ):
            raise RAFFormatError(
                f"Fujifilm M-RAW frame {index} raw payload does not end at "
                "its block boundary"
            )
        if block_fingerprint(metadata) != expected_fingerprint:
            raise RAFFormatError(
                f"Fujifilm M-RAW frame {index} camera/geometry metadata "
                "does not match frame zero"
            )

    reference = raw_records[0]
    if not math.isclose(
        float(reference["exposure_ev"]),
        0.0,
        rel_tol=0.0,
        abs_tol=1e-12,
    ):
        raise RAFFormatError("Fujifilm M-RAW frame zero must declare 0 EV")
    reference_signal = (
        float(reference["exposure_seconds"])
        * int(reference["iso"])
        / (float(reference["f_number"]) ** 2)
    )
    for index, record in enumerate(raw_records):
        signal = (
            float(record["exposure_seconds"])
            * int(record["iso"])
            / (float(record["f_number"]) ** 2)
        )
        measured_ev = math.log2(signal / reference_signal)
        if not math.isclose(
            measured_ev,
            float(record["exposure_ev"]),
            rel_tol=0.0,
            abs_tol=0.15,
        ):
            raise RAFFormatError(
                f"Fujifilm M-RAW frame {index} exposure settings disagree "
                "with its EV tag"
            )

    frames = tuple(
        RAFMultiRawFrame(
            frame_index=int(record["frame_index"]),
            block_offset=int(record["block_offset"]),
            block_length=int(record["block_length"]),
            exposure_ev=float(record["exposure_ev"]),
            exposure_auxiliary_ev=float(
                record["exposure_auxiliary_ev"]
            ),
            exposure_seconds=float(record["exposure_seconds"]),
            f_number=float(record["f_number"]),
            iso=int(record["iso"]),
            unknown_tag_0x2008=int(record["unknown_tag_0x2008"]),
            metadata_offset=metadata.metadata_offset,
            metadata_length=metadata.metadata_length,
            raw_offset=metadata.raw_offset,
            raw_length=metadata.raw_length,
            raw_exposure_bias_ev=metadata.raw_exposure_bias_ev,
        )
        for record, metadata in zip(raw_records, block_metadata)
    )
    return RAFMultiRaw(
        format_version=format_version,
        container_version=container_version,
        record_version=record_version,
        tagged_payload_bytes=tagged_payload_bytes,
        tag_count=tag_count,
        frames=frames,
    )


def materialize_raf_multi_raw_frame(
    path: Path,
    frame_index: int,
    output_path: Path,
    *,
    chunk_bytes: int = 4 * 1024 * 1024,
) -> Dict[str, object]:
    """Build a bounded standalone RAF wrapper for one M-RAW exposure.

    Auxiliary Fujifilm M-RAW blocks omit the primary block's camera identity
    and embedded JPEG, so LibRaw cannot identify them in isolation.  This
    helper retains the validated primary header/JPEG/table, substitutes the
    selected block's compact metadata directory, and streams only that
    block's raw payload into the primary block's declared raw region.

    The destination must not already exist.  Every source range comes from a
    freshly parsed, bounds-checked M-RAW container.
    """

    source_path = Path(path)
    destination = Path(output_path)
    if (
        isinstance(frame_index, bool)
        or not isinstance(frame_index, int)
        or frame_index < 0
    ):
        raise RAFFormatError("M-RAW frame index must be a nonnegative integer")
    if (
        isinstance(chunk_bytes, bool)
        or not isinstance(chunk_bytes, int)
        or chunk_bytes <= 0
    ):
        raise ValueError("M-RAW copy chunk size must be a positive integer")

    container = parse_raf_multi_raw(source_path)
    if container is None:
        raise RAFFormatError("RAF does not contain a Fujifilm M-RAW table")
    if frame_index >= len(container.frames):
        raise RAFFormatError(
            f"M-RAW frame index {frame_index} is outside "
            f"0..{len(container.frames) - 1}"
        )

    primary = container.frames[0]
    selected = container.frames[frame_index]
    primary_metadata_end = (
        primary.metadata_offset + primary.metadata_length
    )
    if primary_metadata_end > primary.raw_offset:
        raise RAFFormatError("primary M-RAW metadata overlaps its raw payload")
    if selected.metadata_length != primary.metadata_length:
        raise RAFFormatError(
            "selected M-RAW metadata length differs from the primary"
        )
    if selected.raw_length != primary.raw_length:
        raise RAFFormatError(
            "selected M-RAW raw length differs from the primary"
        )
    expected_output_size = primary.raw_offset + primary.raw_length
    if expected_output_size != primary.block_length:
        raise RAFFormatError(
            "primary M-RAW raw payload does not end at its block boundary"
        )

    digest = hashlib.sha256()

    def copy_region(source, destination_handle, offset: int, length: int):
        source.seek(offset)
        remaining = length
        while remaining:
            chunk = source.read(min(remaining, chunk_bytes))
            if not chunk:
                raise RAFFormatError(
                    "M-RAW source range became truncated while copying"
                )
            destination_handle.write(chunk)
            digest.update(chunk)
            remaining -= len(chunk)

    destination_created = False
    try:
        with source_path.open("rb") as source, destination.open("xb") as out:
            destination_created = True
            copy_region(source, out, 0, primary.metadata_offset)
            copy_region(
                source,
                out,
                selected.block_offset + selected.metadata_offset,
                selected.metadata_length,
            )
            copy_region(
                source,
                out,
                primary_metadata_end,
                primary.raw_offset - primary_metadata_end,
            )
            copy_region(
                source,
                out,
                selected.block_offset + selected.raw_offset,
                selected.raw_length,
            )
    except Exception:
        if destination_created:
            try:
                destination.unlink()
            except FileNotFoundError:
                pass
        raise

    actual_size = destination.stat().st_size
    if actual_size != expected_output_size:
        try:
            destination.unlink()
        except FileNotFoundError:
            pass
        raise RAFFormatError(
            "materialized M-RAW frame has an unexpected output size"
        )
    materialized_metadata = parse_raf_metadata(destination)
    if (
        materialized_metadata.raw_offset != primary.raw_offset
        or materialized_metadata.raw_length != primary.raw_length
        or not math.isclose(
            materialized_metadata.raw_exposure_bias_ev or 0.0,
            selected.raw_exposure_bias_ev or 0.0,
            rel_tol=0.0,
            abs_tol=1e-12,
        )
    ):
        try:
            destination.unlink()
        except FileNotFoundError:
            pass
        raise RAFFormatError(
            "materialized M-RAW frame failed metadata verification"
        )

    return {
        "frame_index": selected.frame_index,
        "output": str(destination),
        "output_size": actual_size,
        "output_sha256": digest.hexdigest(),
        "primary_wrapper_ranges": {
            "identity_jpeg_and_table": [0, primary.metadata_offset],
            "post_metadata_prefix": [
                primary_metadata_end,
                primary.raw_offset - primary_metadata_end,
            ],
        },
        "selected_source_ranges": {
            "metadata": [
                selected.block_offset + selected.metadata_offset,
                selected.metadata_length,
            ],
            "raw": [
                selected.block_offset + selected.raw_offset,
                selected.raw_length,
            ],
        },
        "raw_exposure_bias_ev": selected.raw_exposure_bias_ev,
        "independent_reimplementation": True,
        "calls_adobe_runtime": False,
    }
