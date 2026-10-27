use native_core::rotate::{Orientation, rotate};

#[test]
fn exif_orientations() {
    let src = [1u32, 2, 3, 4, 5, 6];
    let cases = [
        (1, (3, 2), [1, 2, 3, 4, 5, 6]),
        (2, (3, 2), [3, 2, 1, 6, 5, 4]),
        (3, (3, 2), [6, 5, 4, 3, 2, 1]),
        (4, (3, 2), [4, 5, 6, 1, 2, 3]),
        (5, (2, 3), [1, 4, 2, 5, 3, 6]),
        (6, (2, 3), [4, 1, 5, 2, 6, 3]),
        (7, (2, 3), [6, 3, 5, 2, 4, 1]),
        (8, (2, 3), [3, 6, 2, 5, 1, 4]),
        (9, (3, 2), [1, 2, 3, 4, 5, 6]),
    ];
    for (exif, size, expected) in cases {
        let orientation = Orientation::from(exif);
        let mut dst = [0; 6];
        rotate(&src, 3, 3, 2, orientation, &mut dst);
        assert_eq!(orientation.dimensions(3, 2), size);
        assert_eq!(dst, expected, "orientation {exif}");
    }
}

#[test]
fn padded_rows() {
    let src = [1u32, 2, 3, 99, 4, 5, 6, 99];
    let mut dst = [0; 6];
    rotate(&src, 4, 3, 2, Orientation::Rotate90, &mut dst);
    assert_eq!(dst, [4, 1, 5, 2, 6, 3]);
}
