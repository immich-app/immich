use std::sync::atomic::AtomicBool;

use native_core::jxl::{Cicp, Image, Jxl, Pixels, Primaries, Samples, Target, Transfer};

fn decode(data: &[u8], target: Target) -> Option<Image> {
    Jxl::open(data, target)?.decode(&AtomicBool::new(false))
}

fn decode_srgb(data: &[u8]) -> Option<Pixels<u8>> {
    let Image {
        cicp: Cicp::SRGB,
        samples: Samples::U8(rgba),
    } = decode(data, Target::Srgb)?
    else {
        panic!("not decoded to sRGB");
    };
    Some(rgba)
}

#[test]
fn decodes_to_premultiplied_srgb() {
    let cases: [(&str, &[u8], [u8; 8]); 5] = [
        (
            "sRGB with alpha",
            include_bytes!("fixtures/srgb_alpha.jxl"),
            [128, 0, 0, 128, 0, 0, 255, 255],
        ),
        (
            "Display P3",
            include_bytes!("fixtures/p3.jxl"),
            [255, 0, 0, 255, 255, 255, 255, 255],
        ),
        (
            "grayscale",
            include_bytes!("fixtures/gray.jxl"),
            [0, 0, 0, 255, 128, 128, 128, 255],
        ),
        (
            "grayscale with ICC profile",
            include_bytes!("fixtures/gray_icc.jxl"),
            [81, 81, 81, 255, 203, 203, 203, 255],
        ),
        (
            "animation",
            include_bytes!("fixtures/animated.jxl"),
            [255, 0, 0, 255, 255, 0, 0, 255],
        ),
    ];
    for (name, data, expected) in cases {
        let rgba = decode_srgb(data).expect(name);
        assert_eq!(
            (rgba.width(), rgba.height(), rgba.pixels().as_flattened()),
            (2, 1, &expected[..]),
            "{name}"
        );
    }
}

#[test]
fn converts_lossy_icc_to_srgb() {
    let rgba = decode_srgb(include_bytes!("fixtures/xyb_icc.jxl")).unwrap();
    for px in rgba.pixels() {
        assert!(
            px.iter()
                .zip([210, 119, 65, 255])
                .all(|(&a, b)| a.abs_diff(b) <= 3),
            "{px:?}"
        );
    }
}

#[test]
fn tone_maps_hdr() {
    let rgba = decode_srgb(include_bytes!("fixtures/pq_grays.jxl")).unwrap();
    let levels: Vec<u8> = rgba
        .pixels()
        .iter()
        .map(|px| {
            assert!(
                px[..3].iter().max().unwrap() - px[..3].iter().min().unwrap() <= 4,
                "{px:?} is not neutral"
            );
            px[1]
        })
        .collect();
    assert!(
        levels.is_sorted_by(|a, b| a < b) && levels[2] < 255,
        "{levels:?}"
    );
}

#[test]
fn keeps_spaces_that_cicp_describes() {
    let pq = decode(include_bytes!("fixtures/pq_alpha.jxl"), Target::Source);
    let Some(Image {
        cicp:
            Cicp {
                primaries: Primaries::Bt2020,
                transfer: Transfer::Pq,
            },
        samples: Samples::U16(rgba),
    }) = pq
    else {
        panic!("not decoded to BT.2100 PQ");
    };
    assert_eq!(
        rgba.pixels(),
        [[20000, 15000, 10000, 32768], [49271, 49271, 49271, 65535]]
    );
    let p3 = decode(include_bytes!("fixtures/p3.jxl"), Target::Source);
    let Some(Image {
        cicp:
            Cicp {
                primaries: Primaries::DisplayP3,
                transfer: Transfer::Srgb,
            },
        samples: Samples::U8(rgba),
    }) = p3
    else {
        panic!("not decoded to Display P3");
    };
    assert_eq!(rgba.pixels(), [[255, 0, 0, 255], [255, 255, 255, 255]]);
}

#[test]
fn converts_other_spaces_to_srgb() {
    let data = include_bytes!("fixtures/gray_icc.jxl");
    let Some(Image {
        cicp: Cicp::SRGB,
        samples: Samples::U8(rgba),
    }) = decode(data, Target::Source)
    else {
        panic!("not decoded to sRGB");
    };
    assert_eq!(rgba.pixels(), decode_srgb(data).unwrap().pixels());
}

#[test]
fn rejects_truncated_input() {
    let data = include_bytes!("fixtures/srgb_alpha.jxl");
    assert!(decode_srgb(&data[..data.len() / 2]).is_none());
}

#[test]
fn stops_when_cancelled() {
    let data = include_bytes!("fixtures/large.jxl");
    let decode = |cancelled| {
        Jxl::open(data, Target::Srgb)
            .unwrap()
            .decode(&AtomicBool::new(cancelled))
            .is_some()
    };
    assert_eq!((decode(false), decode(true)), (true, false));
}
