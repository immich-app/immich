#![cfg(feature = "server")]

use native_core::colour::{Colour, Profile};
use native_core::image::{Bitmap, Crop, Decode, Fit, Step, Transform};
use native_core::io::{Effort, Encode, Format, Source};
use native_core::vips;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{BandFormat, Interpretation};

const RED: [u8; 3] = [255, 0, 0];
const GREEN: [u8; 3] = [0, 255, 0];
const BLUE: [u8; 3] = [0, 0, 255];
const YELLOW: [u8; 3] = [255, 255, 0];

fn quadrants(width: usize, height: usize, alpha: Option<u8>) -> Vec<u8> {
    vips::init().unwrap();
    let bands = if alpha.is_some() { 4 } else { 3 };
    let mut pixels = Vec::with_capacity(width * height * bands);
    for y in 0..height {
        for x in 0..width {
            pixels.extend(match (x < width / 2, y < height / 2) {
                (true, true) => RED,
                (false, true) => GREEN,
                (true, false) => BLUE,
                (false, false) => YELLOW,
            });
            pixels.extend(alpha);
        }
    }
    Image::new_from_memory_copy(
        &pixels,
        width as i32,
        height as i32,
        bands as i32,
        BandFormat::Uchar,
    )
    .unwrap()
    .write_to_buffer(".png")
    .unwrap()
}

fn options(profile: Profile) -> Decode {
    Decode {
        profile,
        strict: true,
        orientation: None,
        size: None,
    }
}

fn transform() -> Transform {
    Transform {
        crop: None,
        steps: vec![],
        size: None,
        fit: Fit::Outside,
    }
}

fn srgb(png: &[u8]) -> Bitmap {
    Bitmap::decode(Source::Buffer(png), &options(Profile::Srgb)).unwrap()
}

fn corners(bitmap: &Bitmap, transform: &Transform) -> ([[u8; 3]; 4], u32, u32) {
    let (pixels, width, height) = bitmap.rgba(transform).unwrap();
    let at = |x: u32, y: u32| {
        let i = ((y * width + x) * 4) as usize;
        [pixels[i], pixels[i + 1], pixels[i + 2]]
    };
    let (right, bottom) = (width - 2, height - 2);
    (
        [at(1, 1), at(right, 1), at(1, bottom), at(right, bottom)],
        width,
        height,
    )
}

#[test]
fn applies_steps_in_order() {
    let bitmap = srgb(&quadrants(100, 60, None));
    let steps = |steps: &[Step]| Transform {
        steps: steps.to_vec(),
        ..transform()
    };
    assert_eq!(corners(&bitmap, &transform()).0, [RED, GREEN, BLUE, YELLOW]);
    let (colours, width, height) =
        corners(&bitmap, &steps(&[Step::Rotate90, Step::MirrorHorizontal]));
    assert_eq!(
        (colours, width, height),
        ([RED, BLUE, GREEN, YELLOW], 60, 100)
    );
    let (colours, ..) = corners(
        &bitmap,
        &steps(&[
            Step::MirrorVertical,
            Step::MirrorHorizontal,
            Step::Rotate270,
        ]),
    );
    assert_eq!(colours, [BLUE, RED, YELLOW, GREEN]);
}

#[test]
fn crops_before_steps() {
    let bitmap = srgb(&quadrants(100, 100, None));
    let transform = Transform {
        crop: Some(Crop {
            left: 0,
            top: 0,
            width: 50,
            height: 100,
        }),
        steps: vec![Step::Rotate90, Step::MirrorHorizontal],
        ..transform()
    };
    let (colours, width, height) = corners(&bitmap, &transform);
    assert_eq!((width, height), (100, 50));
    assert_eq!(colours[..2], [RED, BLUE]);
}

#[test]
fn applies_the_orientation_it_is_given() {
    let png = quadrants(100, 60, None);
    let expected = [
        (1, [RED, GREEN, BLUE, YELLOW]),
        (2, [GREEN, RED, YELLOW, BLUE]),
        (3, [YELLOW, BLUE, GREEN, RED]),
        (4, [BLUE, YELLOW, RED, GREEN]),
        (5, [RED, BLUE, GREEN, YELLOW]),
        (6, [BLUE, RED, YELLOW, GREEN]),
        (7, [YELLOW, GREEN, BLUE, RED]),
        (8, [GREEN, YELLOW, RED, BLUE]),
    ];
    for (orientation, colours) in expected {
        let options = Decode {
            orientation: Some(orientation),
            ..options(Profile::Srgb)
        };
        let bitmap = Bitmap::decode(Source::Buffer(&png), &options).unwrap();
        assert_eq!(bitmap.width(), if orientation >= 5 { 60 } else { 100 });
        assert_eq!(corners(&bitmap, &transform()).0, colours, "{orientation}");
    }
}

#[test]
fn sizes_by_the_fit() {
    let png = quadrants(400, 200, Some(128));
    let bitmap = srgb(&png);
    let sized = |size, fit| {
        let (_, width, height) = corners(
            &bitmap,
            &Transform {
                size: Some(size),
                fit,
                ..transform()
            },
        );
        (width, height)
    };
    assert_eq!(sized(100, Fit::Outside), (200, 100));
    assert_eq!(sized(100, Fit::Inside), (100, 50));
    assert_eq!(sized(1000, Fit::Outside), (400, 200));

    let options = Decode {
        size: Some(100),
        ..options(Profile::Srgb)
    };
    let decoded = Bitmap::decode(Source::Buffer(&png), &options).unwrap();
    assert_eq!((decoded.width(), decoded.height()), (200, 100));

    assert!(decoded.has_alpha());
    let (pixels, ..) = decoded.rgba(&transform()).unwrap();
    assert_eq!(pixels[..3], RED);
    assert!(pixels[3].abs_diff(128) <= 1);
}

#[test]
fn clips_once_when_resizing_twice() {
    vips::init().unwrap();
    // Resizing rings below black beside a thin line, and only the output may clip it.
    let (width, height) = (240, 160);
    let line: Vec<u8> = (0..width * height)
        .flat_map(|i| {
            if i % width == width / 2 {
                [255; 3]
            } else {
                [0; 3]
            }
        })
        .collect();
    let png = Image::new_from_memory_copy(&line, width, height, 3, BandFormat::Uchar)
        .unwrap()
        .write_to_buffer(".png")
        .unwrap();
    let options = Decode {
        size: Some(120),
        ..options(Profile::Srgb)
    };
    let fit = Transform {
        size: Some(100),
        fit: Fit::Inside,
        ..transform()
    };
    let (pixels, ..) = Bitmap::decode(Source::Buffer(&png), &options)
        .unwrap()
        .rgba(&fit)
        .unwrap();

    let linear = Image::new_from_buffer(&png, "")
        .unwrap()
        .colourspace(Interpretation::Scrgb)
        .unwrap()
        .resize(0.75)
        .unwrap();
    let expected = linear
        .resize(100.0 / f64::from(linear.get_width()))
        .unwrap()
        .colourspace(Interpretation::Srgb)
        .unwrap()
        .write_to_memory();
    let worst = pixels
        .chunks(4)
        .zip(expected.chunks(3))
        .flat_map(|(actual, expected)| actual.iter().zip(expected))
        .map(|(actual, expected)| actual.abs_diff(*expected))
        .max();
    assert!(worst <= Some(1), "{worst:?}");
}

#[test]
fn converts_untagged_images_as_srgb() {
    let bitmap = Bitmap::decode(
        Source::Buffer(&quadrants(100, 100, None)),
        &options(Profile::P3),
    )
    .unwrap();
    let red = corners(&bitmap, &transform()).0[0];
    assert!(
        red.iter()
            .zip([234, 51, 35])
            .all(|(a, e)| a.abs_diff(e) <= 1),
        "{red:?}"
    );
}

fn encode(format: Format) -> Encode {
    Encode {
        format,
        quality: 80,
        progressive: false,
        effort: Effort::Low,
        decoding_tier: 0,
    }
}

#[test]
fn writes_each_format_with_its_profile_alone() {
    let bitmap = srgb(&quadrants(400, 200, None));
    let directory = tempdir("sdr");
    let transform = Transform {
        size: Some(100),
        ..transform()
    };
    for (extension, format) in [
        ("jpg", Format::Jpeg),
        ("webp", Format::Webp),
        ("jxl", Format::Jxl),
    ] {
        let path = format!("{directory}/out.{extension}");
        bitmap.save(&transform, encode(format), &path).unwrap();
        let written = Source::File(&path).open(true).unwrap();
        assert_eq!((written.get_width(), written.get_height()), (200, 100));
        assert_ne!(
            written.get_typeof("icc-profile-data").unwrap(),
            0,
            "{extension}"
        );
        assert_eq!(written.get_typeof("exif-data").unwrap(), 0, "{extension}");
    }
    std::fs::remove_dir_all(directory).unwrap();
}

fn tempdir(name: &str) -> String {
    let directory = std::env::temp_dir().join(format!("native-core-{name}-{}", std::process::id()));
    std::fs::create_dir_all(&directory).unwrap();
    directory.to_str().unwrap().to_owned()
}

#[test]
fn keeps_hdr_for_the_formats_that_carry_it() {
    let pq = include_bytes!("../../codecs/tests/fixtures/pq.avif");
    let bitmap = Bitmap::decode(Source::Buffer(pq), &options(Profile::Srgb)).unwrap();
    let directory = tempdir("hdr");

    let jxl = format!("{directory}/out.jxl");
    bitmap
        .save(&transform(), encode(Format::Jxl), &jxl)
        .unwrap();
    let colour = |path: &str| {
        let written = Source::File(path).open(true).unwrap();
        (Colour::of(&written, Profile::Srgb).unwrap(), written)
    };
    assert_eq!(colour(&jxl).0, Colour::Pq);

    let webp = format!("{directory}/out.webp");
    bitmap
        .save(&transform(), encode(Format::Webp), &webp)
        .unwrap();
    let (sdr, written) = colour(&webp);
    assert_eq!(sdr, Colour::Sdr(Profile::Srgb));
    assert_ne!(written.get_typeof("icc-profile-data").unwrap(), 0);

    std::fs::remove_dir_all(directory).unwrap();
}

#[test]
fn reads_dimensions_without_decoding() {
    let size = Source::Buffer(&quadrants(40, 20, None))
        .dimensions()
        .unwrap();
    assert_eq!((size.width, size.height), (40, 20));
    assert!(Source::Buffer(b"not an image").dimensions().is_err());
}

#[test]
fn fails_to_open_a_missing_file() {
    assert!(Source::File("/nonexistent.jpg").open(true).is_err());
}
