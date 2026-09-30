/// Converts `h` rows of `w` RGBA_1010102 pixels, `stride` pixels apart in `src`, to dense RGBA_8888
/// in `dst`.
pub fn convert_1010102(src: &[u32], stride: usize, w: usize, h: usize, dst: &mut [u32]) {
    // Each 10-bit channel rounds v*255/1023 (16.16 fixed point) and alpha maps to a*85. Plain
    // arithmetic on purpose: the loop auto-vectorizes and beat a lookup table on-device.
    for y in 0..h {
        for (out, &px) in dst[y * w..][..w].iter_mut().zip(&src[y * stride..][..w]) {
            let r = ((px & 0x3ff) * 16336 + 32768) >> 16;
            let g = (((px >> 10) & 0x3ff) * 16336 + 32768) >> 16;
            let b = (((px >> 20) & 0x3ff) * 16336 + 32768) >> 16;
            let a = (px >> 30) * 85;
            *out = r | (g << 8) | (b << 16) | (a << 24);
        }
    }
}
