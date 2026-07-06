//! EXIF-orientation rotation of RGBA8888 pixel buffers, ported from the Android
//! native_image.c (immich PR #29337). Lives here so the perf-critical pixel math
//! exists once, tested, callable from any platform's decode pipeline (Android RAW
//! today; the algorithm is platform-agnostic). The platform side keeps the bitmap
//! lock + output allocation and calls this to fill the destination buffer.

// EXIF orientation values (androidx ExifInterface.ORIENTATION_*).
const FLIP_HORIZONTAL: i32 = 2;
const ROTATE_180: i32 = 3;
const FLIP_VERTICAL: i32 = 4;
const TRANSPOSE: i32 = 5;
const ROTATE_90: i32 = 6;
const TRANSVERSE: i32 = 7;
const ROTATE_270: i32 = 8;

// 32x32 u32 tile = 4KB, L1-resident so a 90/270 transpose's scattered writes stay hot.
const TILE: usize = 32;

/// Whether the orientation swaps width and height (the 90/270 + transpose family).
pub fn swaps_dims(orientation: i32) -> bool {
    matches!(orientation, ROTATE_90 | ROTATE_270 | TRANSPOSE | TRANSVERSE)
}

// (base, step_x, step_y): src pixel (sx,sy) maps to dst pixel index
// base + sx*step_x + sy*step_y for a destination of width `dw`. Mirrors
// native_image.c affine_for byte-for-byte. i64 so the math stays correct on 32-bit.
fn affine_for(o: i32, sw: i64, sh: i64, dw: i64) -> (i64, i64, i64) {
    match o {
        ROTATE_90 => (sh - 1, dw, -1),
        ROTATE_270 => ((sw - 1) * dw, -dw, 1),
        ROTATE_180 => ((sh - 1) * dw + (sw - 1), -1, -dw),
        FLIP_HORIZONTAL => (sw - 1, -1, dw),
        FLIP_VERTICAL => ((sh - 1) * dw, 1, -dw),
        TRANSPOSE => (0, dw, 1),
        TRANSVERSE => ((sw - 1) * dw + (sh - 1), -dw, -1),
        _ => (0, 1, dw),
    }
}

/// Rotate `src` (RGBA8888, `sh` rows of `src_stride` bytes, `sw` pixels per row) into
/// `dst` (densely packed, `dw*dh*4` bytes) for the given EXIF orientation, where
/// (dw,dh) swap for the 90/270/transpose family. Returns `false` without touching
/// out-of-range memory if the sizes are inconsistent, so the caller can fall back.
/// Indexing is bounds-checked: a bad input fails safe (panic caught at the FFI
/// boundary / false here), never an out-of-bounds write like the raw C.
pub fn rotate_rgba8888(
    src: &[u8],
    src_stride: usize,
    sw: usize,
    sh: usize,
    orientation: i32,
    dst: &mut [u8],
) -> bool {
    if sw == 0 || sh == 0 || src_stride < sw * 4 {
        return false;
    }
    let dw = if swaps_dims(orientation) { sh } else { sw };
    let dh = if swaps_dims(orientation) { sw } else { sh };
    if src.len() < src_stride * sh || dst.len() < dw * dh * 4 {
        return false;
    }
    let (base, step_x, step_y) = affine_for(orientation, sw as i64, sh as i64, dw as i64);
    for ty in (0..sh).step_by(TILE) {
        let y_end = (ty + TILE).min(sh);
        for tx in (0..sw).step_by(TILE) {
            let x_end = (tx + TILE).min(sw);
            for sy in ty..y_end {
                let row = sy * src_stride;
                let mut idx = base + sy as i64 * step_y + tx as i64 * step_x;
                for sx in tx..x_end {
                    let s = row + sx * 4;
                    let d = idx as usize * 4;
                    dst[d..d + 4].copy_from_slice(&src[s..s + 4]);
                    idx += step_x;
                }
            }
        }
    }
    true
}

// 10-bit -> 8-bit, matching Skia's Bitmap.copy(ARGB_8888): round(v * 255 / 1023).
// Compile-time LUT so it's one lookup per channel, not a mul+div per pixel. The
// integer form equals round-half-up for all 1024 inputs and v*255/1023 never lands
// on x.5, so it's exact for every value (verified on-device against Skia).
const SCALE10: [u8; 1024] = {
    let mut lut = [0u8; 1024];
    let mut v = 0usize;
    while v < 1024 {
        lut[v] = ((v as u32 * 255 + 511) / 1023) as u8;
        v += 1;
    }
    lut
};

// 2-bit alpha -> 8-bit (a * 85). Photos decode opaque (a == 3 -> 255).
const ALPHA2: [u8; 4] = [0, 85, 170, 255];

/// Convert an Android RGBA_1010102 buffer (what a 10-bit HEIC/AVIF decodes to on
/// API 33+) to RGBA8888, byte-for-byte with Skia's `Bitmap.copy(ARGB_8888)`. Each
/// src pixel is a little-endian u32 with R in bits 0-9, G in 10-19, B in 20-29,
/// A in 30-31 (standard RGB10_A2 packing). `src` is `h` rows of `src_stride` bytes,
/// `dst` the caller's densely packed `w*h*4`. Returns false on inconsistent sizes
/// so the caller can fall back — same contract as [`rotate_rgba8888`], no alloc.
pub fn rgba1010102_to_rgba8888(
    src: &[u8],
    src_stride: usize,
    w: usize,
    h: usize,
    dst: &mut [u8],
) -> bool {
    if w == 0 || h == 0 || src_stride < w * 4 {
        return false;
    }
    if src.len() < src_stride * h || dst.len() < w * h * 4 {
        return false;
    }
    for y in 0..h {
        let s_row = y * src_stride;
        let d_row = y * w * 4;
        for x in 0..w {
            let s = s_row + x * 4;
            // explicit little-endian — dodges an unaligned *const u32 read on non-x86
            let px = u32::from_le_bytes([src[s], src[s + 1], src[s + 2], src[s + 3]]);
            let d = d_row + x * 4;
            dst[d] = SCALE10[(px & 0x3FF) as usize];
            dst[d + 1] = SCALE10[((px >> 10) & 0x3FF) as usize];
            dst[d + 2] = SCALE10[((px >> 20) & 0x3FF) as usize];
            dst[d + 3] = ALPHA2[((px >> 30) & 0x3) as usize];
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    // Independent textbook EXIF transform: src(sx,sy) -> dst(dx,dy). Verifies the
    // affine port against orientation *semantics*, not against itself.
    fn ref_dst_xy(o: i32, sx: usize, sy: usize, sw: usize, sh: usize) -> (usize, usize) {
        match o {
            FLIP_HORIZONTAL => (sw - 1 - sx, sy),
            ROTATE_180 => (sw - 1 - sx, sh - 1 - sy),
            FLIP_VERTICAL => (sx, sh - 1 - sy),
            TRANSPOSE => (sy, sx),
            ROTATE_90 => (sh - 1 - sy, sx),
            TRANSVERSE => (sh - 1 - sy, sw - 1 - sx),
            ROTATE_270 => (sy, sw - 1 - sx),
            _ => (sx, sy),
        }
    }

    fn pixel(i: usize) -> [u8; 4] {
        [
            (i & 0xff) as u8,
            ((i >> 8) & 0xff) as u8,
            ((i >> 16) & 0xff) as u8,
            0xff,
        ]
    }

    fn check(o: i32, sw: usize, sh: usize) {
        let mut src = vec![0u8; sw * sh * 4];
        for sy in 0..sh {
            for sx in 0..sw {
                let i = sy * sw + sx;
                src[i * 4..i * 4 + 4].copy_from_slice(&pixel(i));
            }
        }
        let (dw, dh) = if swaps_dims(o) { (sh, sw) } else { (sw, sh) };
        let mut dst = vec![0u8; dw * dh * 4];
        assert!(rotate_rgba8888(&src, sw * 4, sw, sh, o, &mut dst));
        for sy in 0..sh {
            for sx in 0..sw {
                let (dx, dy) = ref_dst_xy(o, sx, sy, sw, sh);
                let di = dy * dw + dx;
                let si = sy * sw + sx;
                assert_eq!(&dst[di * 4..di * 4 + 4], &pixel(si), "o={o} src({sx},{sy})");
            }
        }
    }

    #[test]
    fn all_orientations_match_exif_reference() {
        for o in [1, 2, 3, 4, 5, 6, 7, 8] {
            check(o, 4, 3);
            check(o, 1, 5);
            check(o, 5, 1);
            check(o, 40, 33); // spans multiple tiles
        }
    }

    #[test]
    fn identity_for_normal_orientation() {
        let src: Vec<u8> = (0..24u8).collect(); // 2x3 RGBA
        let mut dst = vec![0u8; 24];
        assert!(rotate_rgba8888(&src, 8, 2, 3, 1, &mut dst));
        assert_eq!(src, dst);
    }

    #[test]
    fn respects_src_stride_padding() {
        let (sw, sh, stride) = (2usize, 2usize, 12usize); // 4 bytes row padding
        let mut src = vec![0u8; stride * sh];
        for sy in 0..sh {
            for sx in 0..sw {
                let i = sy * sw + sx;
                src[sy * stride + sx * 4..sy * stride + sx * 4 + 4].copy_from_slice(&pixel(i));
            }
        }
        let mut dst = vec![0u8; sw * sh * 4];
        assert!(rotate_rgba8888(&src, stride, sw, sh, ROTATE_180, &mut dst));
        for i in 0..4 {
            assert_eq!(&dst[i * 4..i * 4 + 4], &pixel(3 - i)); // 180: i -> N-1-i
        }
    }

    #[test]
    fn rejects_bad_sizes() {
        let src = vec![0u8; 16];
        let mut small = vec![0u8; 4];
        assert!(!rotate_rgba8888(&src, 8, 2, 2, ROTATE_90, &mut small)); // dst too small
        assert!(!rotate_rgba8888(&src, 4, 2, 2, 1, &mut small)); // stride < sw*4
    }

    // On-device (Pixel 9a) vs Skia's Bitmap.copy(ARGB_8888). 179/111 rule out `>> 2`.
    #[test]
    fn scale10_matches_skia() {
        for (v, want) in [
            (0, 0),
            (111, 28),
            (179, 45),
            (230, 57),
            (304, 76),
            (1023, 255),
        ] {
            assert_eq!(SCALE10[v], want, "SCALE10[{v}]");
        }
        assert_eq!(ALPHA2, [0, 85, 170, 255]);
    }

    // px = little-endian u32; R low 10 bits, A top 2.
    #[test]
    fn convert_packing() {
        let red = 0x0000_03FFu32.to_le_bytes(); // R=1023, rest 0
        let alpha = 0xC000_0000u32.to_le_bytes(); // A=3, rest 0
        let mut src = Vec::new();
        src.extend_from_slice(&red);
        src.extend_from_slice(&alpha);
        let mut dst = vec![0u8; 8];
        assert!(rgba1010102_to_rgba8888(&src, 8, 2, 1, &mut dst));
        assert_eq!(&dst[0..4], &[255, 0, 0, 0]); // opaque-less red
        assert_eq!(&dst[4..8], &[0, 0, 0, 255]); // opaque black
    }

    #[test]
    fn convert_rejects_bad_sizes() {
        let src = vec![0u8; 16];
        let mut small = vec![0u8; 4];
        assert!(!rgba1010102_to_rgba8888(&src, 0, 0, 0, &mut small)); // zero dims
        assert!(!rgba1010102_to_rgba8888(&src, 4, 2, 2, &mut small)); // stride < w*4
        assert!(!rgba1010102_to_rgba8888(&src, 8, 2, 2, &mut small)); // dst too small
    }
}
