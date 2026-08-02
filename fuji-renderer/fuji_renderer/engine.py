"""Full-resolution X-T5 renderer and derivative staging."""

from __future__ import annotations

import hashlib
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from types import MappingProxyType
from typing import Any, Callable, Mapping, Sequence

from PIL import Image, ImageOps

from fuji_luts import DevelopSettings, parse_raf_metadata

from . import pipeline


PROCESS_MODEL = "lightroom-pv2012-independent-v6"
RENDERER_VERSION = PROCESS_MODEL
RENDERER_RELEASE = "film-simulation-baseline-v2"
FULL_SIZE_QUALITY = 95
FULL_SIZE_SUBSAMPLING = 0

# Hashes from the locally extracted Lightroom profile bundle used to validate
# film-simulation-baseline-v2. The profile payloads themselves are not shipped.
EXPECTED_PROFILE_SHA256: Mapping[str, str] = MappingProxyType(
    {
        "dcp/adobe-standard.dcp": "a8eb3c16ddfce3e2a18c76a473fe1c920063244547356cabccf57a60c0aca2dd",
        "dcp/acros.dcp": "d312500ffeabdad66ca55b9be2cb599910db5169a0015a32d8d9e8144f2e24d9",
        "dcp/acros-g-filter.dcp": "5cd8eade772ee25aae3d52b14152a26c4e3fa6f0fc799f220eb5e5dd03adaf28",
        "dcp/acros-r-filter.dcp": "ef591b0433765eb301ea6c49ab2d6d88976e45f29f3bacd9b785484d67ed52d6",
        "dcp/acros-ye-filter.dcp": "821916237cfd07f6a956236ee79f7423ad14fbca6749550fa9cdc4bed35cef17",
        "dcp/astia-soft.dcp": "fd97aa7b94c94f49e86e2fb31be2fd487cbf52d79ac035d4d79303f26b4c948c",
        "dcp/classic-chrome.dcp": "80046c8b6fd623aaef36cbf95f42bfa8a0525b0e49fa50ad9c289cdc3852d2d8",
        "dcp/eterna-cinema.dcp": "8705c628f17dab4a14a13e87d2b0330d33b55c5990cecc30dd50110b4b76afde",
        "dcp/monochrome.dcp": "1967312fce5e5696dec3ee8e043d8c6c4062fbef9300f938435a1df83a9bfcfa",
        "dcp/monochrome-g-filter.dcp": "2edd2750ae68a737878bf0d9e49bab32434beec1acfbd073d9dcb9eb080507c2",
        "dcp/monochrome-r-filter.dcp": "3c7d55a53550ef3f5a73e2ff52da57ddafdef18578b9fd8e46e12ca4eff0bdb5",
        "dcp/monochrome-ye-filter.dcp": "e084cf2cbdc94533b2a768d527376eb78bbf33c7d941d2f68d775edd4a7f669f",
        "dcp/pro-neg-hi.dcp": "263c26a7dec7b07af2f01380daca2381477b23606b5d69385888651a91708db2",
        "dcp/pro-neg-std.dcp": "2f36973c65a54f3556142139b8256c91115c310cf982c8c9e65ce6be8b95f30e",
        "dcp/provia-standard.dcp": "f3d355c90739e2379537691c0ef4e4c552e452bc5f9a2eb0e7e8623da38398ca",
        "dcp/reala-ace-v2.dcp": "59a59d1d5be465af1ae49917710a8af011c833b434355cf9b3c81d0205c65f23",
        "dcp/velvia-vivid.dcp": "953484543eebb43b75bad202570ef182aee2abba5b3ba59f9bfcf00e796302f5",
        "rgb-tables/bleach-bypass.rgbtable": "669324358aa733d6fc45789526a7ca49e5895743cc1945d5b8d5b0c5ac568068",
        "rgb-tables/classic-neg.rgbtable": "cf203fb3ab0b7d1b2deeda418e4f903ca56ab5a5e4d368e378bd272662f383c9",
        "rgb-tables/nostalgic-neg.rgbtable": "bbd4ef2db38f5ce253dc699c086ca945ccd85d9dc109f66d345b15e8569e0ec6",
        "rgb-tables/sepia.rgbtable": "51e2e05bb5cdf3e7625c88323694c2296c83463107517f60cec5594ec4ee1bab",
    }
)


@dataclass(frozen=True)
class ProfileSpec:
    dcp: str
    rgb_table: str | None = None


class ProfileBundleError(RuntimeError):
    pass


# Deliberately explicit: profile requests never become filesystem fragments.
PROFILE_SPECS: Mapping[str, ProfileSpec] = MappingProxyType(
    {
        "provia-standard": ProfileSpec("dcp/provia-standard.dcp"),
        "velvia-vivid": ProfileSpec("dcp/velvia-vivid.dcp"),
        "astia-soft": ProfileSpec("dcp/astia-soft.dcp"),
        "classic-chrome": ProfileSpec("dcp/classic-chrome.dcp"),
        "reala-ace-v2": ProfileSpec("dcp/reala-ace-v2.dcp"),
        "pro-neg-hi": ProfileSpec("dcp/pro-neg-hi.dcp"),
        "pro-neg-std": ProfileSpec("dcp/pro-neg-std.dcp"),
        "classic-neg": ProfileSpec(
            "dcp/provia-standard.dcp",
            "rgb-tables/classic-neg.rgbtable",
        ),
        "nostalgic-neg": ProfileSpec(
            "dcp/provia-standard.dcp",
            "rgb-tables/nostalgic-neg.rgbtable",
        ),
        "eterna-cinema": ProfileSpec("dcp/eterna-cinema.dcp"),
        "bleach-bypass": ProfileSpec(
            "dcp/provia-standard.dcp",
            "rgb-tables/bleach-bypass.rgbtable",
        ),
        "acros": ProfileSpec("dcp/acros.dcp"),
        "acros-g-filter": ProfileSpec("dcp/acros-g-filter.dcp"),
        "acros-r-filter": ProfileSpec("dcp/acros-r-filter.dcp"),
        "acros-ye-filter": ProfileSpec("dcp/acros-ye-filter.dcp"),
        "monochrome": ProfileSpec("dcp/monochrome.dcp"),
        "monochrome-g-filter": ProfileSpec("dcp/monochrome-g-filter.dcp"),
        "monochrome-r-filter": ProfileSpec("dcp/monochrome-r-filter.dcp"),
        "monochrome-ye-filter": ProfileSpec("dcp/monochrome-ye-filter.dcp"),
        "sepia": ProfileSpec(
            "dcp/provia-standard.dcp",
            "rgb-tables/sepia.rgbtable",
        ),
    }
)


def required_profile_paths(profile_root: Path) -> tuple[Path, ...]:
    return tuple(profile_root / item for item in EXPECTED_PROFILE_SHA256)


def missing_profile_paths(profile_root: Path) -> tuple[str, ...]:
    return tuple(
        str(path.relative_to(profile_root))
        for path in required_profile_paths(profile_root)
        if not path.is_file() or path.is_symlink()
    )


def verify_profile_bundle(profile_root: Path) -> None:
    missing = missing_profile_paths(profile_root)
    if missing:
        raise ProfileBundleError("missing required profile files: " + ", ".join(missing))
    mismatches = []
    for relative, expected in EXPECTED_PROFILE_SHA256.items():
        path = profile_root / relative
        with path.open("rb") as source:
            actual = hashlib.file_digest(source, "sha256").hexdigest()
        if actual != expected:
            mismatches.append(relative)
    if mismatches:
        raise ProfileBundleError(
            "mounted profiles do not match film-simulation-baseline-v2: "
            + ", ".join(mismatches)
        )


def _spatial_transform(edits: Sequence[Any]) -> Callable[[Image.Image], Image.Image]:
    def transform(image: Image.Image) -> Image.Image:
        result = image
        if edits and edits[0].action == "crop":
            crop = edits[0].parameters
            if crop.x + crop.width > result.width or crop.y + crop.height > result.height:
                raise ValueError(
                    "crop is outside the full-resolution rendered image "
                    f"({result.width}x{result.height})"
                )
            result = result.crop(
                (crop.x, crop.y, crop.x + crop.width, crop.y + crop.height)
            )

        for edit in edits:
            if edit.action == "crop":
                continue
            if edit.action == "rotate":
                transpose = {
                    0: None,
                    90: Image.Transpose.ROTATE_270,
                    180: Image.Transpose.ROTATE_180,
                    270: Image.Transpose.ROTATE_90,
                }[edit.parameters.angle]
                if transpose is not None:
                    result = result.transpose(transpose)
            elif edit.action == "mirror":
                result = (
                    ImageOps.flip(result)
                    if edit.parameters.axis == "horizontal"
                    else ImageOps.mirror(result)
                )
        return result

    return transform


def _temporary_sibling(final_path: Path) -> Path:
    descriptor, value = tempfile.mkstemp(
        prefix=f".{final_path.stem}.",
        suffix=final_path.suffix,
        dir=final_path.parent,
    )
    os.close(descriptor)
    return Path(value)


def _fsync_file(path: Path) -> None:
    path.chmod(0o664)
    with path.open("rb") as source:
        os.fsync(source.fileno())


def _resize_long_edge(source: Image.Image, size: int) -> Image.Image:
    longest = max(source.size)
    if longest <= size:
        return source.copy()
    scale = size / longest
    dimensions = (
        max(1, round(source.width * scale)),
        max(1, round(source.height * scale)),
    )
    return source.resize(dimensions, Image.Resampling.LANCZOS)


def _save_derivative(image: Image.Image, path: Path, settings: Any) -> None:
    resized = _resize_long_edge(image, settings.size)
    try:
        if settings.format == "jpeg":
            resized.save(
                path,
                format="JPEG",
                quality=settings.quality,
                subsampling=0 if settings.quality >= 80 else 2,
                progressive=settings.progressive,
            )
        else:
            resized.save(
                path,
                format="WEBP",
                quality=settings.quality,
                method=6,
            )
    finally:
        resized.close()
    _fsync_file(path)


@dataclass
class StagedRender:
    paths: dict[str, tuple[Path, Path]]
    sizes: dict[str, tuple[int, int]]
    manifest: dict[str, Any]

    def cleanup(self) -> None:
        for staged, _ in self.paths.values():
            try:
                staged.unlink()
            except FileNotFoundError:
                pass


def stage_render(
    *,
    input_path: Path,
    profile_root: Path,
    profile_slug: str,
    settings: Any,
    spatial_edits: Sequence[Any],
    full_size_path: Path,
    preview_path: Path,
    thumbnail_path: Path,
    preview_settings: Any,
    thumbnail_settings: Any,
) -> StagedRender:
    """Render and stage all outputs without changing any published path."""

    verify_profile_bundle(profile_root)
    if profile_slug not in PROFILE_SPECS:
        raise ValueError(f"unsupported profile slug: {profile_slug}")
    metadata = parse_raf_metadata(input_path)
    if metadata.camera_model != "X-T5":
        raise ValueError(
            f"only Fujifilm X-T5 RAF files are supported, got {metadata.camera_model!r}"
        )

    spec = PROFILE_SPECS[profile_slug]
    dcp_path = profile_root / spec.dcp
    rgb_table_path = profile_root / spec.rgb_table if spec.rgb_table else None
    for required in (dcp_path, rgb_table_path):
        if required is not None and (not required.is_file() or required.is_symlink()):
            raise FileNotFoundError(f"required profile file is unavailable: {required}")

    develop_settings = DevelopSettings(**settings.model_dump())
    final_paths = {
        "fullSize": full_size_path,
        "preview": preview_path,
        "thumbnail": thumbnail_path,
    }
    staged_paths = {
        name: _temporary_sibling(path) for name, path in final_paths.items()
    }
    result = StagedRender(
        paths={
            name: (staged_paths[name], final_paths[name])
            for name in final_paths
        },
        sizes={},
        manifest={},
    )
    try:
        manifest = pipeline.render(
            raw_path=input_path,
            dcp_path=dcp_path,
            output_path=staged_paths["fullSize"],
            # Full-resolution X-Trans interpolation, with a no-op long-edge cap.
            max_width=1_000_000_000,
            full_resolution_demosaic=True,
            apply_default_lens_corrections=True,
            apply_default_exposure_calibration=True,
            apply_default_highlight_reconstruction=True,
            preserve_raw_highlight_headroom=True,
            apply_default_color_noise_reduction=True,
            develop_settings=develop_settings,
            rgb_table_path=rgb_table_path,
            image_transform=_spatial_transform(spatial_edits),
        )
        _fsync_file(staged_paths["fullSize"])

        with Image.open(staged_paths["fullSize"]) as encoded:
            encoded.load()
            source = encoded.convert("RGB")
        try:
            _save_derivative(source, staged_paths["preview"], preview_settings)
            _save_derivative(source, staged_paths["thumbnail"], thumbnail_settings)
        finally:
            source.close()

        sizes = {}
        for name, staged in staged_paths.items():
            with Image.open(staged) as image:
                sizes[name] = image.size
        result.sizes = sizes
        result.manifest = manifest
        return result
    except Exception:
        result.cleanup()
        raise
