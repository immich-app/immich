use native_core::convert::convert_1010102;

#[test]
fn channels_and_alpha() {
    for (a, byte) in [(0, 0), (1, 85), (2, 170), (3, 255)] {
        let src: [u32; 3] = [
            (0x0ff << 10) | (0x3ff << 20) | (a << 30),
            0x0ff | (0x3ff << 10) | (a << 30),
            0x3ff | (0x0ff << 20) | (a << 30),
        ];
        let mut dst = [0; 3];
        convert_1010102(&src, 3, 3, 1, &mut dst);
        assert_eq!(
            dst,
            [
                0xff4000 | (byte << 24),
                0x00ff40 | (byte << 24),
                0x4000ff | (byte << 24)
            ]
        );
    }
}

#[test]
fn padded_rows() {
    let src: [u32; 6] = [
        0xc00003ff, 0xc00ffc00, 0xdeadbeef, 0xfff00000, 0xffffffff, 0xdeadbeef,
    ];
    let mut dst = [0; 4];
    convert_1010102(&src, 3, 2, 2, &mut dst);
    assert_eq!(dst, [0xff0000ff, 0xff00ff00, 0xffff0000, 0xffffffff]);
}
