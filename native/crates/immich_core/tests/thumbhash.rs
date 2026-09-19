use immich_core::thumbhash::decode;

// Expected pixels come from the old Swift decoder patched to round like the Java did (it truncated),
// taken at pixels whose values sit well away from a rounding boundary, so the check is exact on any libm.
const LANDSCAPE: &[u8] = &[
    0xdc, 0xf7, 0x0d, 0x35, 0x84, 0x85, 0x79, 0x78, 0x7f, 0x77, 0x77, 0xa5, 0x77, 0x48, 0x87, 0x66,
    0x86, 0x60, 0x57, 0x08, 0x76,
];
const PORTRAIT: &[u8] = &[
    0x93, 0x4a, 0x06, 0x2d, 0x06, 0x92, 0x56, 0xc3, 0x74, 0x05, 0x58, 0x67, 0xda, 0x8a, 0xb6, 0x67,
    0x94, 0x90, 0x51, 0x07, 0x19,
];
const ALPHA: &[u8] = &[
    0x60, 0x9a, 0x86, 0x3d, 0x0c, 0x3b, 0xb0, 0x59, 0x6c, 0x96, 0xa8, 0x45, 0x69, 0xf4, 0x84, 0xf9,
    0x0e, 0xa8, 0x27, 0x58, 0x76, 0x88, 0x70, 0x76, 0x47,
];

fn check(name: &str, hash: &[u8], size: (u32, u32), samples: &[(u32, u32, [u8; 4])]) {
    let (width, height, rgba) = decode(hash).unwrap();
    assert_eq!((width, height), size, "{name}");
    for &(x, y, expected) in samples {
        let i = ((y * width + x) * 4) as usize;
        assert_eq!(rgba[i..i + 4], expected, "{name} pixel {x},{y}");
    }
}

#[test]
fn matches_swift_placeholders() {
    check(
        "landscape",
        LANDSCAPE,
        (32, 23),
        &[
            (0, 0, [48, 83, 154, 255]),
            (11, 0, [59, 90, 156, 255]),
            (20, 0, [91, 113, 163, 255]),
            (29, 1, [109, 123, 156, 255]),
            (1, 11, [84, 92, 96, 255]),
            (10, 11, [77, 84, 89, 255]),
            (20, 11, [143, 144, 141, 255]),
            (30, 10, [164, 161, 153, 255]),
            (1, 22, [98, 84, 35, 255]),
            (9, 21, [69, 56, 12, 255]),
            (19, 22, [87, 72, 30, 255]),
            (30, 22, [79, 60, 13, 255]),
        ],
    );

    check(
        "portrait",
        PORTRAIT,
        (23, 32),
        &[
            (0, 0, [27, 53, 53, 255]),
            (5, 0, [57, 80, 87, 255]),
            (14, 1, [41, 57, 57, 255]),
            (22, 0, [42, 60, 37, 255]),
            (0, 15, [149, 100, 11, 255]),
            (7, 15, [166, 109, 28, 255]),
            (14, 15, [181, 114, 19, 255]),
            (22, 15, [204, 135, 10, 255]),
            (0, 30, [70, 47, 0, 255]),
            (7, 30, [106, 72, 18, 255]),
            (13, 31, [135, 88, 19, 255]),
            (22, 31, [159, 104, 0, 255]),
        ],
    );

    check(
        "alpha",
        ALPHA,
        (32, 32),
        &[
            (1, 0, [227, 76, 54, 0]),
            (10, 0, [147, 102, 114, 45]),
            (19, 0, [130, 156, 130, 94]),
            (31, 0, [192, 168, 23, 0]),
            (0, 15, [232, 65, 49, 162]),
            (10, 14, [142, 87, 106, 255]),
            (20, 14, [141, 152, 119, 255]),
            (31, 14, [231, 191, 50, 148]),
            (0, 31, [255, 33, 10, 0]),
            (11, 31, [213, 65, 76, 137]),
            (20, 31, [209, 109, 64, 137]),
            (31, 31, [255, 137, 0, 0]),
        ],
    );
}

#[test]
fn rejects_truncated_hash() {
    for len in 0..ALPHA.len() {
        assert!(decode(&ALPHA[..len]).is_none(), "length {len}");
    }
}
