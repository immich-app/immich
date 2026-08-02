from pathlib import Path

import pytest

from fuji_renderer.paths import (
    PathPolicyError,
    canonical_cleanup_path,
    canonical_input,
    canonical_render_outputs,
)


ASSET_ID = "01234567-89ab-4cde-8fab-0123456789ab"


def test_input_must_be_a_real_raf_below_an_allowed_root(tmp_path: Path) -> None:
    allowed = tmp_path / "allowed"
    allowed.mkdir()
    source = allowed / "source.RAF"
    source.write_bytes(b"FUJIFILMCCD-RAW " + b"test")
    assert canonical_input(str(source), (allowed,)) == source.resolve()

    outside = tmp_path / "outside.RAF"
    outside.write_bytes(b"FUJIFILMCCD-RAW " + b"test")
    with pytest.raises(PathPolicyError, match="outside configured"):
        canonical_input(str(outside), (allowed,))


def test_render_outputs_are_strict_and_create_safe_parents(tmp_path: Path) -> None:
    root = tmp_path / "thumbs"
    root.mkdir()
    target = root / "owner" / "01" / "23"
    outputs = canonical_render_outputs(
        {
            "fullSize": str(target / f"{ASSET_ID}_fullsize_fuji_edited.jpeg"),
            "preview": str(target / f"{ASSET_ID}_preview_fuji_edited.jpeg"),
            "thumbnail": str(target / f"{ASSET_ID}_thumbnail_fuji_edited.webp"),
        },
        {"fullSize": "jpeg", "preview": "jpeg", "thumbnail": "webp"},
        root,
    )
    assert target.is_dir()
    assert outputs["fullSize"].parent == target


def test_render_output_rejects_wrong_kind_and_format(tmp_path: Path) -> None:
    root = tmp_path / "thumbs"
    root.mkdir()
    with pytest.raises(PathPolicyError, match="invalid edited-derivative"):
        canonical_render_outputs(
            {
                "fullSize": str(root / f"{ASSET_ID}_preview_fuji_edited.jpeg"),
                "preview": str(root / f"{ASSET_ID}_preview_fuji_edited.jpeg"),
                "thumbnail": str(root / f"{ASSET_ID}_thumbnail_fuji_edited.webp"),
            },
            {"fullSize": "jpeg", "preview": "jpeg", "thumbnail": "webp"},
            root,
        )


def test_render_output_rejects_legacy_non_fuji_names(tmp_path: Path) -> None:
    root = tmp_path / "thumbs"
    root.mkdir()
    with pytest.raises(PathPolicyError, match="invalid edited-derivative"):
        canonical_render_outputs(
            {
                "fullSize": str(root / f"{ASSET_ID}_fullsize_edited.jpeg"),
                "preview": str(root / f"{ASSET_ID}_preview_edited.jpeg"),
                "thumbnail": str(root / f"{ASSET_ID}_thumbnail_edited.webp"),
            },
            {"fullSize": "jpeg", "preview": "jpeg", "thumbnail": "webp"},
            root,
        )


def test_cleanup_is_bounded_to_regular_edited_derivatives(tmp_path: Path) -> None:
    root = tmp_path / "thumbs"
    root.mkdir()
    fuji_target = root / f"{ASSET_ID}_preview_fuji_edited.jpeg"
    legacy_target = root / f"{ASSET_ID}_preview_edited.jpeg"
    assert canonical_cleanup_path(str(fuji_target), root) == fuji_target
    assert canonical_cleanup_path(str(legacy_target), root) == legacy_target

    symlink = root / f"{ASSET_ID}_thumbnail_fuji_edited.webp"
    symlink.symlink_to(tmp_path / "outside")
    with pytest.raises(PathPolicyError, match="outside|symlink"):
        canonical_cleanup_path(str(symlink), root)
