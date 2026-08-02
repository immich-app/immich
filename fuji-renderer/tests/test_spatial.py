from types import SimpleNamespace

from PIL import Image

from fuji_renderer.engine import _resize_long_edge, _spatial_transform


def edit(action: str, **parameters: object) -> SimpleNamespace:
    return SimpleNamespace(action=action, parameters=SimpleNamespace(**parameters))


def test_spatial_edits_crop_first_and_rotate_clockwise() -> None:
    image = Image.new("RGB", (4, 3))
    transformed = _spatial_transform(
        [edit("crop", x=1, y=0, width=3, height=2), edit("rotate", angle=90)]
    )(image)
    assert transformed.size == (2, 3)


def test_mirror_axis_matches_immich_semantics() -> None:
    image = Image.new("RGB", (1, 2))
    image.putpixel((0, 0), (255, 0, 0))
    image.putpixel((0, 1), (0, 0, 255))
    transformed = _spatial_transform([edit("mirror", axis="horizontal")])(image)
    assert transformed.getpixel((0, 0)) == (0, 0, 255)


def test_derivative_size_is_a_long_edge_cap() -> None:
    image = Image.new("RGB", (600, 400))
    resized = _resize_long_edge(image, 300)
    assert resized.size == (300, 200)
