from pathlib import Path

import pytest

from fuji_renderer.app import RevisionCoordinator, SupersededRenderError
from fuji_renderer.engine import StagedRender


def staged_render(tmp_path: Path) -> StagedRender:
    paths = {}
    for name in ("fullSize", "preview", "thumbnail"):
        staged = tmp_path / f"{name}.staged"
        final = tmp_path / f"{name}.final"
        staged.write_text(name, encoding="utf-8")
        paths[name] = (staged, final)
    return StagedRender(paths=paths, sizes={}, manifest={})


def test_superseded_revision_never_publishes(tmp_path: Path) -> None:
    coordinator = RevisionCoordinator()
    result = staged_render(tmp_path)
    key = tuple(str(result.paths[name][1]) for name in ("fullSize", "preview", "thumbnail"))
    coordinator.claim(key, "a" * 64)
    coordinator.claim(key, "b" * 64)
    with pytest.raises(SupersededRenderError):
        coordinator.publish(result, key, "a" * 64)
    assert not any(final.exists() for _, final in result.paths.values())


def test_current_revision_publishes_all_outputs(tmp_path: Path) -> None:
    coordinator = RevisionCoordinator()
    result = staged_render(tmp_path)
    key = tuple(str(result.paths[name][1]) for name in ("fullSize", "preview", "thumbnail"))
    coordinator.claim(key, "a" * 64)
    coordinator.publish(result, key, "a" * 64)
    assert all(final.is_file() for _, final in result.paths.values())
