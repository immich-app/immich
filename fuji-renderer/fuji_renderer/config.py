"""Environment configuration for shared media and profile mounts."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from .engine import verify_profile_bundle


def _absolute_path(name: str, value: str) -> Path:
    path = Path(value)
    if not path.is_absolute():
        raise ValueError(f"{name} must be an absolute container path")
    return path


@dataclass(frozen=True)
class RendererConfig:
    input_roots: tuple[Path, ...]
    output_root: Path
    profile_root: Path

    @classmethod
    def from_env(cls) -> "RendererConfig":
        input_value = os.environ.get("FUJI_RENDERER_INPUT_ROOTS", "/data")
        input_roots = tuple(
            _absolute_path("FUJI_RENDERER_INPUT_ROOTS", value)
            for value in input_value.split(os.pathsep)
            if value
        )
        if not input_roots:
            raise ValueError("FUJI_RENDERER_INPUT_ROOTS must contain at least one path")
        return cls(
            input_roots=input_roots,
            output_root=_absolute_path(
                "FUJI_RENDERER_OUTPUT_ROOT",
                os.environ.get("FUJI_RENDERER_OUTPUT_ROOT", "/data/thumbs"),
            ),
            profile_root=_absolute_path(
                "FUJI_RENDERER_PROFILE_ROOT",
                os.environ.get("FUJI_RENDERER_PROFILE_ROOT", "/profiles"),
            ),
        )

    def validate_startup(self) -> None:
        for root in self.input_roots:
            if root.exists() and (root.is_symlink() or not root.is_dir()):
                raise ValueError(
                    "FUJI_RENDERER_INPUT_ROOTS entries must be non-symlink directories"
                )
        available_inputs = [root for root in self.input_roots if root.is_dir()]
        if not available_inputs:
            raise FileNotFoundError("none of the configured renderer input roots exist")
        if not self.output_root.exists():
            self.output_root.mkdir(parents=True)
        if self.output_root.is_symlink() or not self.output_root.is_dir():
            raise ValueError("FUJI_RENDERER_OUTPUT_ROOT must be a non-symlink directory")
        if self.profile_root.is_symlink() or not self.profile_root.is_dir():
            raise ValueError("FUJI_RENDERER_PROFILE_ROOT must be a non-symlink directory")
        verify_profile_bundle(self.profile_root)
