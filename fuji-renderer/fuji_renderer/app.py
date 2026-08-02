"""Internal HTTP API for deterministic Fuji RAW development."""

from __future__ import annotations

import asyncio
import logging
import os
import threading
from collections import OrderedDict
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException

from .config import RendererConfig
from .engine import (
    PROCESS_MODEL,
    PROFILE_SPECS,
    ProfileBundleError,
    RENDERER_RELEASE,
    RENDERER_VERSION,
    StagedRender,
    stage_render,
    verify_profile_bundle,
)
from .models import (
    CleanupRequest,
    CleanupResponse,
    OutputResult,
    PingResponse,
    RenderRequest,
    RenderResponse,
    RenderSummary,
)
from .paths import (
    PathPolicyError,
    canonical_cleanup_path,
    canonical_input,
    canonical_render_outputs,
)


LOGGER = logging.getLogger("fuji_renderer")


class SupersededRenderError(RuntimeError):
    pass


class RevisionCoordinator:
    """Track the newest request for each immutable three-path output set."""

    def __init__(self, maximum_entries: int = 1024) -> None:
        self._maximum_entries = maximum_entries
        self._latest: OrderedDict[tuple[str, ...], str] = OrderedDict()
        self._lock = threading.Lock()

    def claim(self, key: tuple[str, ...], revision: str) -> None:
        with self._lock:
            self._latest[key] = revision
            self._latest.move_to_end(key)
            while len(self._latest) > self._maximum_entries:
                self._latest.popitem(last=False)

    def publish(self, staged: StagedRender, key: tuple[str, ...], revision: str) -> None:
        # Publish smaller browsing derivatives first and FullSize last. The
        # database is updated only after the complete response succeeds.
        with self._lock:
            for name in ("thumbnail", "preview", "fullSize"):
                temporary, final = staged.paths[name]
                if self._latest.get(key) != revision:
                    raise SupersededRenderError(
                        "render was superseded before derivative publication"
                    )
                if final.is_symlink() or (final.exists() and not final.is_file()):
                    raise PathPolicyError("output target changed before publication")
                os.replace(temporary, final)


def _key(outputs: dict[str, Path]) -> tuple[str, ...]:
    return tuple(str(outputs[name]) for name in ("fullSize", "preview", "thumbnail"))


def _cleanup_paths(paths: list[Path]) -> tuple[list[str], list[str]]:
    removed: list[str] = []
    missing: list[str] = []
    for path in paths:
        if path.is_symlink() or (path.exists() and not path.is_file()):
            raise PathPolicyError("cleanup target changed after validation")
        try:
            path.unlink()
        except FileNotFoundError:
            missing.append(str(path))
        else:
            removed.append(str(path))
    return removed, missing


def create_app(config: RendererConfig | None = None) -> FastAPI:
    resolved_config = config or RendererConfig.from_env()
    render_semaphore = asyncio.Semaphore(1)
    revisions = RevisionCoordinator()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await asyncio.to_thread(resolved_config.validate_startup)
        yield

    application = FastAPI(
        title="Immich Fuji Renderer",
        version=RENDERER_VERSION,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )

    @application.get("/ping", response_model=PingResponse, response_model_by_alias=True)
    async def ping() -> PingResponse:
        try:
            await asyncio.to_thread(verify_profile_bundle, resolved_config.profile_root)
        except ProfileBundleError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        return PingResponse(
            status="ok",
            rendererVersion=RENDERER_VERSION,
            rendererRelease=RENDERER_RELEASE,
            profileCount=len(PROFILE_SPECS),
        )

    @application.post("/render", response_model=RenderResponse, response_model_by_alias=True)
    async def render(request: RenderRequest) -> RenderResponse:
        try:
            input_path = canonical_input(request.input_path, resolved_config.input_roots)
            outputs = canonical_render_outputs(
                {
                    "fullSize": request.outputs.full_size_path,
                    "preview": request.outputs.preview_path,
                    "thumbnail": request.outputs.thumbnail_path,
                },
                {
                    "fullSize": "jpeg",
                    "preview": request.image.preview.format,
                    "thumbnail": request.image.thumbnail.format,
                },
                resolved_config.output_root,
            )
        except PathPolicyError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        output_key = _key(outputs)
        revisions.claim(output_key, request.render_revision)
        staged: StagedRender | None = None
        try:
            async with render_semaphore:
                staged = await asyncio.to_thread(
                    stage_render,
                    input_path=input_path,
                    profile_root=resolved_config.profile_root,
                    profile_slug=request.profile_slug,
                    settings=request.settings,
                    spatial_edits=request.spatial_edits,
                    full_size_path=outputs["fullSize"],
                    preview_path=outputs["preview"],
                    thumbnail_path=outputs["thumbnail"],
                    preview_settings=request.image.preview,
                    thumbnail_settings=request.image.thumbnail,
                )
                await asyncio.to_thread(
                    revisions.publish,
                    staged,
                    output_key,
                    request.render_revision,
                )
        except SupersededRenderError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        except (FileNotFoundError, PathPolicyError, ProfileBundleError) as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception:
            LOGGER.exception("Fuji RAW rendering failed")
            raise HTTPException(status_code=500, detail="Fuji RAW rendering failed") from None
        finally:
            if staged is not None:
                staged.cleanup()

        assert staged is not None
        manifest = staged.manifest
        full_width, full_height = staged.sizes["fullSize"]
        active_crop = manifest.get("active_crop", {})
        multi_raw = active_crop.get("multi_raw", {}) if isinstance(active_crop, dict) else {}
        headroom = manifest.get("raw_highlight_headroom", {})
        raw_metadata = manifest.get("raw_metadata", {})
        if not isinstance(multi_raw, dict):
            multi_raw = {}
        if not isinstance(headroom, dict):
            headroom = {}
        if not isinstance(raw_metadata, dict):
            raw_metadata = {}
        return RenderResponse(
            outputPath=str(outputs["fullSize"]),
            profileSlug=request.profile_slug,
            width=full_width,
            height=full_height,
            rendererVersion=RENDERER_VERSION,
            rendererRelease=RENDERER_RELEASE,
            renderRevision=request.render_revision,
            outputs={
                name: OutputResult(
                    path=str(outputs[name]),
                    width=staged.sizes[name][0],
                    height=staged.sizes[name][1],
                )
                for name in ("fullSize", "preview", "thumbnail")
            },
            renderSummary=RenderSummary(
                processModel=PROCESS_MODEL,
                cameraModel=str(raw_metadata.get("camera_model", "X-T5")),
                fullResolutionDemosaic=True,
                rawHighlightHeadroomEffective=bool(headroom.get("effective")),
                multiRawFusionEnabled=bool(multi_raw.get("fusion_enabled")),
            ),
        )

    @application.post("/cleanup", response_model=CleanupResponse, response_model_by_alias=True)
    async def cleanup(request: CleanupRequest) -> CleanupResponse:
        try:
            paths = [
                canonical_cleanup_path(value, resolved_config.output_root)
                for value in request.paths
            ]
        except PathPolicyError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        try:
            async with render_semaphore:
                removed, missing = await asyncio.to_thread(_cleanup_paths, paths)
        except PathPolicyError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return CleanupResponse(removedPaths=removed, missingPaths=missing)

    return application


app = create_app()
