#![cfg(feature = "avif")]

use std::sync::atomic::AtomicBool;

use codecs::Options;
use codecs::color::{CicpColorPrimaries, CicpProfile, Target, TransferCharacteristics};
use codecs::image::{Image, Pixels, Samples};

fn decode(data: &[u8], color_space: Target, cancelled: bool) -> Option<Image> {
    let options = Options {
        color_space,
        target_size: None,
        max_pixel_size: 16384,
    };
    codecs::decode(data, &options, &AtomicBool::new(cancelled))
}

fn decode_srgb(data: &[u8]) -> Option<Pixels<u8>> {
    let Image {
        cicp:
            CicpProfile {
                color_primaries: CicpColorPrimaries::Bt709,
                transfer_characteristics: TransferCharacteristics::Srgb,
                ..
            },
        samples: Samples::U8(rgba),
    } = decode(data, Target::Srgb, false)?
    else {
        panic!("not decoded to sRGB");
    };
    Some(rgba)
}

// The pixels at (2, 8) and (13, 8), one in each half of a 16x16 fixture.
fn halves<T: Copy>(rgba: &Pixels<T>) -> [[T; 4]; 2] {
    assert_eq!((rgba.width(), rgba.height()), (16, 16));
    [rgba.pixels()[8 * 16 + 2], rgba.pixels()[8 * 16 + 13]]
}

fn assert_near(actual: [[u8; 4]; 2], expected: [[u8; 4]; 2], name: &str) {
    assert!(
        actual
            .as_flattened()
            .iter()
            .zip(expected.as_flattened())
            .all(|(&a, &b)| a.abs_diff(b) <= 4),
        "{name}: {actual:?}"
    );
}

#[test]
fn decodes_to_premultiplied_srgb() {
    let red_blue = [[200, 40, 40, 255], [40, 60, 200, 255]];
    for (name, data) in [
        ("8-bit 4:2:0", &include_bytes!("fixtures/srgb.avif")[..]),
        ("10-bit", include_bytes!("fixtures/ten_bit.avif")),
    ] {
        assert_near(halves(&decode_srgb(data).expect(name)), red_blue, name);
    }
    for (name, data) in [
        ("alpha", &include_bytes!("fixtures/alpha.avif")[..]),
        (
            "10-bit alpha",
            include_bytes!("fixtures/alpha_ten_bit.avif"),
        ),
        (
            "premultiplied alpha",
            include_bytes!("fixtures/premultiplied.avif"),
        ),
    ] {
        let rgba = decode_srgb(data).expect(name);
        assert_eq!(
            (rgba.width(), rgba.height(), rgba.pixels()),
            (2, 1, &[[128, 0, 0, 128], [0, 0, 255, 255]][..]),
            "{name}"
        );
    }
}

#[test]
fn converts_p3_to_srgb() {
    // ColorSync turns Display P3 (200, 40, 40) and (40, 200, 60) into these.
    let srgb = [[218, 0, 26, 255], [0, 204, 12, 255]];
    for (name, data) in [
        ("ICC profile", &include_bytes!("fixtures/p3_icc.avif")[..]),
        ("CICP", include_bytes!("fixtures/p3_nclx.avif")),
    ] {
        assert_near(halves(&decode_srgb(data).expect(name)), srgb, name);
    }
}

#[test]
fn keeps_p3_in_its_own_space() {
    let Some(Image {
        cicp:
            CicpProfile {
                color_primaries: CicpColorPrimaries::Smpte432,
                ..
            },
        samples: Samples::U8(rgba),
    }) = decode(
        include_bytes!("fixtures/p3_nclx.avif"),
        Target::Source,
        false,
    )
    else {
        panic!("not decoded to Display P3");
    };
    assert_near(
        halves(&rgba),
        [[200, 40, 40, 255], [40, 200, 60, 255]],
        "source",
    );
}

#[test]
fn takes_colors_from_the_colr_box() {
    // p3_nclx.avif with its colr box set to BT.709, while its AV1 data still says Display P3.
    let mut data = include_bytes!("fixtures/p3_nclx.avif").to_vec();
    data[197] = 1;
    assert_near(
        halves(&decode_srgb(&data).unwrap()),
        [[200, 40, 40, 255], [40, 200, 60, 255]],
        "colr",
    );
}

#[test]
fn keeps_hdr_in_its_own_space() {
    let Some(Image {
        cicp:
            CicpProfile {
                color_primaries: CicpColorPrimaries::Bt2020,
                transfer_characteristics: TransferCharacteristics::Smpte2084,
                ..
            },
        samples: Samples::U16(rgba),
    }) = decode(include_bytes!("fixtures/pq.avif"), Target::Source, false)
    else {
        panic!("not decoded to PQ");
    };
    // libheif decodes these halves to (51520, 10304, 10304) and (10240, 15424, 51456).
    let high_bytes = halves(&rgba).map(|px| px.map(|s| (s >> 8) as u8));
    assert_near(high_bytes, [[201, 40, 40, 255], [40, 60, 201, 255]], "PQ");
}

#[test]
fn tone_maps_hdr_like_jpeg_xl() {
    // Gray steps of 4 pixels at 100, 203, 1000 and 4000 nits in PQ, and pq_grays.jxl has the first three.
    let rgba = decode_srgb(include_bytes!("fixtures/pq_grays.avif")).unwrap();
    let jxl = decode_srgb(include_bytes!("fixtures/pq_grays.jxl")).unwrap();
    let levels: Vec<[u8; 4]> = (0..4)
        .map(|step| rgba.pixels()[2 * 16 + step * 4 + 2])
        .collect();
    assert!(
        levels
            .iter()
            .zip(jxl.pixels())
            .all(|(avif, jxl)| { avif.iter().zip(jxl).all(|(&a, &b)| a.abs_diff(b) <= 2) })
            && levels[2][1] < levels[3][1]
            && levels[3][1] < 255,
        "{levels:?} vs {:?}",
        jxl.pixels()
    );
}

#[test]
fn turns_as_irot_says() {
    // 4x4 red then 4x4 blue in a row, stored with a quarter turn clockwise.
    let rgba = decode_srgb(include_bytes!("fixtures/rotated.avif")).unwrap();
    assert_eq!((rgba.width(), rgba.height()), (4, 8));
    assert_eq!(
        rgba.pixels(),
        [[[255, 0, 0, 255]; 16], [[0, 0, 255, 255]; 16]].as_flattened()
    );
}

#[test]
fn fits_the_target_size_to_the_turned_image() {
    // 2x4 fits the turned 4x8 image; against the stored 8x4 one it would not shrink it.
    let options = Options {
        color_space: Target::Srgb,
        target_size: Some((2, 4)),
        max_pixel_size: 16384,
    };
    let image = codecs::decode(
        include_bytes!("fixtures/rotated.avif"),
        &options,
        &AtomicBool::new(false),
    );
    let Some(Image {
        samples: Samples::U8(rgba),
        ..
    }) = image
    else {
        panic!("not decoded to 8 bits");
    };
    assert_eq!((rgba.width(), rgba.height()), (2, 4));
}

#[test]
fn rejects_what_it_cannot_show() {
    let srgb = include_bytes!("fixtures/srgb.avif");
    // A bit flipped in the AV1 data, which aborts the process with one rav1d frame context.
    let mut damaged = srgb.to_vec();
    damaged[277] ^= 1;
    for (name, data) in [
        ("grid", &include_bytes!("fixtures/grid.avif")[..]),
        ("truncated", &srgb[..srgb.len() / 2]),
        ("damaged", &damaged),
    ] {
        assert!(decode(data, Target::Srgb, false).is_none(), "{name}");
    }
}

#[test]
fn stops_when_cancelled() {
    let data = include_bytes!("fixtures/srgb.avif");
    assert_eq!(
        (
            decode(data, Target::Srgb, false).is_some(),
            decode(data, Target::Srgb, true).is_some()
        ),
        (true, false)
    );
}
