"""Canonical shared-volume path policy for renderer writes and cleanup."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Iterable


RAF_SIGNATURE = b"FUJIFILMCCD-RAW "
EDITED_DERIVATIVE = re.compile(
    r"^(?P<asset>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_"
    r"(?P<kind>fullsize|preview|thumbnail)_edited\.(?P<format>jpeg|webp)$"
)


class PathPolicyError(ValueError):
    pass


def _within(path: Path, roots: Iterable[Path]) -> bool:
    return any(path == root or path.is_relative_to(root) for root in roots)


def canonical_input(value: str, input_roots: tuple[Path, ...]) -> Path:
    source = Path(value)
    if not source.is_absolute():
        raise PathPolicyError("inputPath must be absolute")
    if str(source) != value:
        raise PathPolicyError("inputPath must already be canonical")
    try:
        resolved = source.resolve(strict=True)
    except OSError as exc:
        raise PathPolicyError(f"inputPath is unavailable: {exc}") from exc
    if source != resolved:
        raise PathPolicyError("inputPath must already be canonical")
    roots = tuple(root.resolve(strict=True) for root in input_roots if root.exists())
    if not roots or not _within(resolved, roots):
        raise PathPolicyError("inputPath is outside configured input roots")
    if source.is_symlink() or not resolved.is_file():
        raise PathPolicyError("inputPath must be a regular, non-symlink file")
    if resolved.suffix.casefold() != ".raf":
        raise PathPolicyError("inputPath must use the .RAF extension")
    with resolved.open("rb") as stream:
        if stream.read(len(RAF_SIGNATURE)) != RAF_SIGNATURE:
            raise PathPolicyError("inputPath is not a Fujifilm RAF")
    return resolved


def _prepare_parent(path: Path, output_root: Path) -> Path:
    root = output_root.resolve(strict=True)
    normalized = Path(os.path.abspath(path))
    if normalized == root or not normalized.is_relative_to(root):
        raise PathPolicyError("output path is outside the configured output root")

    relative_parent = normalized.parent.relative_to(root)
    cursor = root
    for component in relative_parent.parts:
        cursor = cursor / component
        if cursor.exists() or cursor.is_symlink():
            if cursor.is_symlink() or not cursor.is_dir():
                raise PathPolicyError("output parent contains a symlink or non-directory")
        else:
            cursor.mkdir(exist_ok=True)
            if cursor.is_symlink() or not cursor.is_dir():
                raise PathPolicyError("output parent contains a symlink or non-directory")
    resolved_parent = normalized.parent.resolve(strict=True)
    if resolved_parent != root and not resolved_parent.is_relative_to(root):
        raise PathPolicyError("output parent resolves outside the configured output root")
    return resolved_parent / normalized.name


def canonical_render_outputs(
    values: dict[str, str],
    formats: dict[str, str],
    output_root: Path,
) -> dict[str, Path]:
    resolved: dict[str, Path] = {}
    asset_ids: set[str] = set()
    expected_kinds = {
        "fullSize": "fullsize",
        "preview": "preview",
        "thumbnail": "thumbnail",
    }
    for name, value in values.items():
        path = Path(value)
        if not path.is_absolute():
            raise PathPolicyError(f"{name} output path must be absolute")
        if str(path) != value or path != Path(os.path.abspath(path)):
            raise PathPolicyError(f"{name} output path must already be canonical")
        match = EDITED_DERIVATIVE.fullmatch(path.name)
        if match is None or match.group("kind") != expected_kinds[name]:
            raise PathPolicyError(f"{name} output path has an invalid edited-derivative name")
        expected_format = formats[name]
        if match.group("format") != expected_format:
            raise PathPolicyError(
                f"{name} output extension must match requested {expected_format} format"
            )
        asset_ids.add(match.group("asset"))
        target = _prepare_parent(path, output_root)
        if target.is_symlink() or (target.exists() and not target.is_file()):
            raise PathPolicyError(f"{name} output target must be a regular file or absent")
        resolved[name] = target
    if len(asset_ids) != 1:
        raise PathPolicyError("all output paths must belong to the same asset UUID")
    if len(set(resolved.values())) != len(resolved):
        raise PathPolicyError("output paths must be distinct")
    return resolved


def canonical_cleanup_path(value: str, output_root: Path) -> Path:
    path = Path(value)
    if not path.is_absolute():
        raise PathPolicyError("cleanup path must be absolute")
    if str(path) != value or path != Path(os.path.abspath(path)):
        raise PathPolicyError("cleanup path must already be canonical")
    if EDITED_DERIVATIVE.fullmatch(path.name) is None:
        raise PathPolicyError("cleanup path has an invalid edited-derivative name")
    root = output_root.resolve(strict=True)
    normalized = Path(os.path.abspath(path))
    if normalized == root or not normalized.is_relative_to(root):
        raise PathPolicyError("cleanup path is outside the configured output root")
    resolved = normalized.resolve(strict=False)
    if resolved == root or not resolved.is_relative_to(root):
        raise PathPolicyError("cleanup path resolves outside the configured output root")
    if normalized.is_symlink():
        raise PathPolicyError("cleanup refuses symlinks")
    if normalized.exists() and not normalized.is_file():
        raise PathPolicyError("cleanup refuses non-regular files")
    return normalized
