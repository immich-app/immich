#![cfg(feature = "server")]

use native_core::colour::{self, Colour, Linear, Profile};
use native_core::vips;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{BandFormat, Interpretation};

fn bt2020(colours: &[[f32; 3]]) -> Image {
    let bytes: Vec<u8> = colours
        .iter()
        .flatten()
        .flat_map(|sample| sample.to_ne_bytes())
        .collect();
    let to_bt709 = [
        1.660491,
        -0.58764114,
        -0.07284986,
        -0.12455047,
        1.1328999,
        -0.00834942,
        -0.01815076,
        -0.1005789,
        1.11872966,
    ];
    Image::new_from_memory_copy(&bytes, colours.len() as i32, 1, 3, BandFormat::Float)
        .unwrap()
        .recomb(&Image::new_matrix_from_array(3, 3, &to_bt709).unwrap())
        .unwrap()
}

fn first_row(image: &Image) -> Vec<[u8; 3]> {
    let image = image.colourspace(Interpretation::Srgb).unwrap();
    vips::read::<u8>(&image)
        .unwrap()
        .as_chunks::<3>()
        .0
        .to_vec()
}

#[test]
fn tone_maps_hdr() {
    vips::init().unwrap();
    let greys = [0.1f32, 0.5, 1.0, 2.0, 4.0, 10.0].map(|level| [level; 3]);
    let pq = Colour::Pq.encode(&Linear::scrgb(bt2020(&greys))).unwrap();
    let sdr = colour::tone_map(&pq, Profile::Srgb).unwrap();
    assert_eq!(colour::cicp(&sdr).unwrap(), None);
    let levels: Vec<u8> = first_row(&sdr).iter().map(|pixel| pixel[1]).collect();
    assert!(
        levels.is_sorted_by(|a, b| a < b) && levels[2] < 250,
        "{levels:?}"
    );
}

fn p3_red(primaries: i32, transfer: i32) -> Image {
    let mut image = Image::new_from_memory_copy(&[255, 0, 0], 1, 1, 3, BandFormat::Uchar).unwrap();
    image.set_int("cicp-colour-primaries", primaries).unwrap();
    image
        .set_int("cicp-transfer-characteristics", transfer)
        .unwrap();
    image.set_int("cicp-matrix-coefficients", 0).unwrap();
    image.set_int("cicp-full-range-flag", 1).unwrap();
    let srgb = Image::profile_load("srgb").unwrap();
    image.set_blob_copy("icc-profile-data", &srgb).unwrap();
    image
}

#[test]
fn cicp_takes_priority_over_a_profile() {
    vips::init().unwrap();
    let close = |actual: [u8; 3], expected: [u8; 3]| {
        assert!(
            actual.iter().zip(expected).all(|(a, e)| a.abs_diff(e) <= 1),
            "{actual:?}"
        );
    };
    let p3 = |image: &Image| {
        let linear = Linear::new(image).unwrap();
        first_row(&Colour::Sdr(Profile::P3).encode(&linear).unwrap())[0]
    };
    close(p3(&p3_red(12, 13)), [255, 0, 0]);
    close(p3(&p3_red(2, 2)), [234, 51, 35]);
}
