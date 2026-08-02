"""Strict HTTP models for the internal renderer API."""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .engine import PROFILE_SPECS


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=False)


class DevelopSettingsRequest(StrictModel):
    exposure: float = Field(default=0.0, ge=-5.0, le=5.0)
    contrast: float = Field(default=0.0, ge=-100.0, le=100.0)
    highlights: float = Field(default=0.0, ge=-100.0, le=100.0)
    shadows: float = Field(default=0.0, ge=-100.0, le=100.0)
    whites: float = Field(default=0.0, ge=-100.0, le=100.0)
    blacks: float = Field(default=0.0, ge=-100.0, le=100.0)
    temperature: float | None = Field(default=None, ge=2000.0, le=50_000.0)
    tint: float | None = Field(default=None, ge=-150.0, le=150.0)
    vibrance: float = Field(default=0.0, ge=-100.0, le=100.0)
    saturation: float = Field(default=0.0, ge=-100.0, le=100.0)


class CropParameters(StrictModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(ge=1)
    height: int = Field(ge=1)


class RotateParameters(StrictModel):
    angle: Literal[0, 90, 180, 270]


class MirrorParameters(StrictModel):
    axis: Literal["horizontal", "vertical"]


class CropEdit(StrictModel):
    action: Literal["crop"]
    parameters: CropParameters


class RotateEdit(StrictModel):
    action: Literal["rotate"]
    parameters: RotateParameters


class MirrorEdit(StrictModel):
    action: Literal["mirror"]
    parameters: MirrorParameters


SpatialEdit = Annotated[
    Union[CropEdit, RotateEdit, MirrorEdit],
    Field(discriminator="action"),
]


class RenderOutputs(StrictModel):
    full_size_path: str = Field(alias="fullSizePath", min_length=1, max_length=4096)
    preview_path: str = Field(alias="previewPath", min_length=1, max_length=4096)
    thumbnail_path: str = Field(alias="thumbnailPath", min_length=1, max_length=4096)


class DerivativeSettings(StrictModel):
    format: Literal["jpeg", "webp"]
    quality: int = Field(ge=1, le=100)
    progressive: bool = False
    size: int = Field(ge=1)


class RenderImageSettings(StrictModel):
    preview: DerivativeSettings
    thumbnail: DerivativeSettings


class RenderRequest(StrictModel):
    input_path: str = Field(alias="inputPath", min_length=1, max_length=4096)
    profile_slug: str = Field(alias="profileSlug", min_length=1, max_length=64)
    render_revision: str = Field(
        alias="renderRevision",
        pattern=r"^[0-9a-f]{64}$",
    )
    settings: DevelopSettingsRequest
    spatial_edits: list[SpatialEdit] = Field(
        alias="spatialEdits",
        default_factory=list,
        max_length=4,
    )
    outputs: RenderOutputs
    image: RenderImageSettings

    @field_validator("profile_slug")
    @classmethod
    def validate_profile_slug(cls, value: str) -> str:
        if value not in PROFILE_SPECS:
            allowed = ", ".join(PROFILE_SPECS)
            raise ValueError(f"profileSlug must be one of: {allowed}")
        return value

    @field_validator("spatial_edits")
    @classmethod
    def validate_spatial_edits(cls, value: list[SpatialEdit]) -> list[SpatialEdit]:
        counts: dict[str, int] = {}
        for edit in value:
            key = (
                f"mirror:{edit.parameters.axis}"
                if edit.action == "mirror"
                else edit.action
            )
            counts[key] = counts.get(key, 0) + 1
        duplicates = sorted(key for key, count in counts.items() if count > 1)
        if duplicates:
            raise ValueError(f"duplicate spatial edits are not allowed: {', '.join(duplicates)}")
        crop_index = next((index for index, edit in enumerate(value) if edit.action == "crop"), None)
        if crop_index not in (None, 0):
            raise ValueError("crop must be the first spatial edit")
        return value


class OutputResult(StrictModel):
    path: str
    width: int
    height: int


class RenderSummary(StrictModel):
    process_model: str = Field(alias="processModel")
    camera_model: str = Field(alias="cameraModel")
    full_resolution_demosaic: bool = Field(alias="fullResolutionDemosaic")
    raw_highlight_headroom_effective: bool = Field(alias="rawHighlightHeadroomEffective")
    multi_raw_fusion_enabled: bool = Field(alias="multiRawFusionEnabled")


class RenderResponse(StrictModel):
    output_path: str = Field(alias="outputPath")
    profile_slug: str = Field(alias="profileSlug")
    width: int
    height: int
    renderer_version: str = Field(alias="rendererVersion")
    renderer_release: str = Field(alias="rendererRelease")
    render_revision: str = Field(alias="renderRevision")
    outputs: dict[Literal["fullSize", "preview", "thumbnail"], OutputResult]
    render_summary: RenderSummary = Field(alias="renderSummary")


class CleanupRequest(StrictModel):
    paths: list[str] = Field(min_length=1, max_length=64)

    @field_validator("paths")
    @classmethod
    def validate_unique_paths(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("cleanup paths must be unique")
        if any(not path or len(path) > 4096 for path in value):
            raise ValueError("cleanup paths must contain 1 to 4096 characters")
        return value


class CleanupResponse(StrictModel):
    removed_paths: list[str] = Field(alias="removedPaths")
    missing_paths: list[str] = Field(alias="missingPaths")


class PingResponse(StrictModel):
    status: Literal["ok"]
    renderer_version: str = Field(alias="rendererVersion")
    renderer_release: str = Field(alias="rendererRelease")
    profile_count: int = Field(alias="profileCount")
