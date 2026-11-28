#![cfg(feature = "server")]

use std::path::PathBuf;

use native_core::colour::Profile;
use native_core::image::{Bitmap, Decode, Fit, Transform};
use native_core::io::{Effort, Encode, Format, Source};
use native_core::vips;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{Intent, OperationMath2, PCS};
use rs_vips::voption::{Setter, VOption};

const SDR: [&str; 11] = [
    "albums/nature/el_torcal_rocks.jpg",
    "albums/nature/silver_fir.jpg",
    "metadata/gps-position/thompson-springs.jpg",
    "metadata/faces/portrait-orientation-6.jpg",
    "formats/png/density_plot.png",
    "formats/webp/denali.webp",
    "formats/heic/IMG_2682.heic",
    "formats/avif/8bit-sRGB.avif",
    "formats/jxl/8bit-sRGB.jxl",
    "formats/jxl/16bit-HDR-P3-nclx.jxl",
    "formats/motionphoto/pixel-8a.jpg",
];

const P3: [f64; 9] = [
    0.4865709, 0.2656677, 0.1982173, 0.2289746, 0.6917385, 0.0792869, 0.0, 0.0451134, 1.0439444,
];
const BT2020: [f64; 9] = [
    0.6369580, 0.1446169, 0.1688810, 0.2627002, 0.6779981, 0.0593017, 0.0, 0.0280727, 1.0609851,
];

fn asset(name: &str) -> String {
    vips::init().unwrap();
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../e2e/test-assets")
        .join(name);
    assert!(
        path.exists(),
        "{} is missing: check out the e2e/test-assets submodule",
        path.display()
    );
    path.to_str().unwrap().to_owned()
}

fn tempdir(name: &str) -> String {
    let directory = std::env::temp_dir().join(format!("native-core-{name}-{}", std::process::id()));
    std::fs::create_dir_all(&directory).unwrap();
    directory.to_str().unwrap().to_owned()
}

fn save(path: &str, profile: Profile, format: Format, out: &str) {
    let options = Decode {
        profile,
        strict: true,
        orientation: None,
        size: Some(512),
    };
    let transform = Transform {
        crop: None,
        steps: vec![],
        size: Some(512),
        fit: Fit::Inside,
    };
    let encode = Encode {
        format,
        quality: 95,
        progressive: false,
        effort: Effort::Low,
        decoding_tier: 0,
    };
    Bitmap::decode(Source::File(path), &options)
        .unwrap()
        .save(&transform, encode, out)
        .unwrap();
}

fn xyz(image: &Image) -> Image {
    image
        .icc_import_with_opts(
            VOption::new()
                .set("pcs", PCS::Xyz as i32)
                .set("embedded", true)
                .set("input_profile", "srgb")
                .set("intent", Intent::Perceptual as i32),
        )
        .unwrap()
}

// lcms's own conversion into `profile`, which clips the same colours outside its gamut.
fn reference(path: &str, profile: Profile) -> Vec<[f64; 3]> {
    let image = Image::new_from_file(path).unwrap().autorot().unwrap();
    let image = if image.get_bands() == 1 {
        Image::bandjoin(&[image.clone(), image.clone(), image]).unwrap()
    } else {
        image
    };
    let name = match profile {
        Profile::Srgb => "srgb",
        Profile::P3 => "p3",
    };
    let converted = image
        .icc_transform_with_opts(
            name,
            VOption::new()
                .set("embedded", true)
                .set("input_profile", "srgb")
                .set("intent", Intent::Perceptual as i32)
                .set("depth", 16),
        )
        .unwrap();
    grid(&xyz(&converted))
}

fn pq(image: &Image, primaries: &[f64; 9]) -> Image {
    let (m1, m2) = (0.1593017578125, 78.84375);
    let (c1, c2, c3) = (0.8359375, 18.8515625, 18.6875);
    let power = image
        .linear(&[1.0 / 65535.0], &[0.0])
        .unwrap()
        .math2_const(OperationMath2::Pow, &[1.0 / m2])
        .unwrap();
    let rgb = power
        .linear(&[1.0], &[-c1])
        .unwrap()
        .clamp_with_opts(VOption::new().set("min", 0.0).set("max", f64::INFINITY))
        .unwrap()
        .divide(&power.linear(&[-c3], &[c2]).unwrap())
        .unwrap()
        .math2_const(OperationMath2::Pow, &[1.0 / m1])
        .unwrap()
        .linear(&[10000.0], &[0.0])
        .unwrap();
    rgb.recomb(&Image::new_matrix_from_array(3, 3, primaries).unwrap())
        .unwrap()
}

// Cell means in linear light, which resizing leaves alone.
fn grid(image: &Image) -> Vec<[f64; 3]> {
    let (width, height) = (image.get_width(), image.get_height());
    (0..64)
        .map(|i| {
            let (x, y) = (i % 8, i / 8);
            let (left, top) = (x * width / 8, y * height / 8);
            let cell = image
                .extract_area(
                    left,
                    top,
                    (x + 1) * width / 8 - left,
                    (y + 1) * height / 8 - top,
                )
                .unwrap();
            let stats = cell.stats().unwrap();
            [1, 2, 3].map(|band| stats.getpoint(4, band).unwrap()[0])
        })
        .collect()
}

fn difference(a: &[[f64; 3]], b: &[[f64; 3]], white: f64) -> f64 {
    let lab = |[x, y, z]: [f64; 3]| {
        let f = |t: f64| {
            if t > 216.0 / 24389.0 {
                t.cbrt()
            } else {
                (24389.0 / 27.0 * t + 16.0) / 116.0
            }
        };
        let [fx, fy, fz] = [x / 0.95047, y, z / 1.08883].map(|t| f(t / white));
        [116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz)]
    };
    a.iter()
        .zip(b)
        .map(|(a, b)| {
            let (a, b) = (lab(*a), lab(*b));
            (0..3).map(|i| (a[i] - b[i]).powi(2)).sum::<f64>().sqrt()
        })
        .fold(0.0, f64::max)
}

#[test]
fn keeps_the_colours_of_sdr_images() {
    let directory = tempdir("assets-sdr");
    let out = format!("{directory}/out.jpg");
    for name in SDR {
        let path = asset(name);
        for profile in [Profile::Srgb, Profile::P3] {
            save(&path, profile, Format::Jpeg, &out);
            let written = grid(&xyz(&Image::new_from_file(&out).unwrap()));
            let error = difference(&written, &reference(&path, profile), 100.0);
            assert!(error < 1.5, "{name} as {profile:?}: ΔE {error:.2}");
        }
    }
    std::fs::remove_dir_all(directory).unwrap();
}

#[test]
fn keeps_the_light_of_hdr_images() {
    let path = asset("formats/avif/10bit-HDR-P3-nclx.avif");
    let source = grid(&pq(&Image::new_from_file(&path).unwrap(), &P3));
    let directory = tempdir("assets-hdr");
    let out = format!("{directory}/out.jxl");
    save(&path, Profile::P3, Format::Jxl, &out);
    let written = Image::new_from_file(&out).unwrap();
    assert_eq!(
        written.get_int("cicp-transfer-characteristics").unwrap(),
        16
    );
    assert_eq!(written.get_int("cicp-colour-primaries").unwrap(), 9);
    let error = difference(&grid(&pq(&written, &BT2020)), &source, 203.0);
    assert!(error < 1.5, "ΔE {error:.2}");
    std::fs::remove_dir_all(directory).unwrap();
}
