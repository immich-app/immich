//! RGBA8888 EXIF rotation and RGBA_1010102 conversion.

// androidx ExifInterface orientation values.
const FLIP_HORIZONTAL: i32 = 2;
const ROTATE_180: i32 = 3;
const FLIP_VERTICAL: i32 = 4;
const TRANSPOSE: i32 = 5;
const ROTATE_90: i32 = 6;
const TRANSVERSE: i32 = 7;
const ROTATE_270: i32 = 8;

// Keep transpose writes inside a 4 KB tile.
const TILE: usize = 32;

pub fn swaps_dims(orientation: i32) -> bool {
    matches!(orientation, ROTATE_90 | ROTATE_270 | TRANSPOSE | TRANSVERSE)
}

// src(sx, sy) maps to base + sx*step_x + sy*step_y in dst.
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

/// Rotates RGBA8888 pixels for an EXIF orientation.
/// Returns false when the dimensions or buffers are invalid.
pub fn rotate_rgba8888(
    src: &[u8],
    src_stride: usize,
    sw: usize,
    sh: usize,
    orientation: i32,
    dst: &mut [u8],
) -> bool {
    let Some(src_row_len) = sw.checked_mul(4) else {
        return false;
    };
    if sw == 0 || sh == 0 || src_stride < src_row_len {
        return false;
    }
    let dw = if swaps_dims(orientation) { sh } else { sw };
    let dh = if swaps_dims(orientation) { sw } else { sh };
    let Some(src_len) = src_stride.checked_mul(sh) else {
        return false;
    };
    let Some(dst_len) = dw.checked_mul(dh).and_then(|len| len.checked_mul(4)) else {
        return false;
    };
    if src.len() < src_len || dst.len() < dst_len {
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

#[inline]
fn scale10(v: u32) -> u32 {
    (v * 16336 + 32768) >> 16
}

/// Converts little-endian RGBA_1010102 pixels to RGBA8888.
/// Returns false when the dimensions or buffers are invalid.
pub fn rgba1010102_to_rgba8888(
    src: &[u8],
    src_stride: usize,
    w: usize,
    h: usize,
    dst: &mut [u8],
) -> bool {
    let Some(row_len) = w.checked_mul(4) else {
        return false;
    };
    if w == 0 || h == 0 || src_stride < row_len {
        return false;
    }
    let Some(src_len) = src_stride.checked_mul(h) else {
        return false;
    };
    let Some(dst_len) = w.checked_mul(h).and_then(|len| len.checked_mul(4)) else {
        return false;
    };
    if src.len() < src_len || dst.len() < dst_len {
        return false;
    }
    // Plain arithmetic auto-vectorizes to NEON and measured faster than a LUT on-device (#29631).
    for y in 0..h {
        let s_row = y * src_stride;
        let d_row = y * w * 4;
        for x in 0..w {
            let s = s_row + x * 4;
            // Avoid unaligned u32 reads.
            let px = u32::from_le_bytes([src[s], src[s + 1], src[s + 2], src[s + 3]]);
            let d = d_row + x * 4;
            let r = scale10(px & 0x3FF);
            let g = scale10((px >> 10) & 0x3FF);
            let b = scale10((px >> 20) & 0x3FF);
            let a = ((px >> 30) & 0x3) * 85;
            let rgba = r | (g << 8) | (b << 16) | (a << 24);
            dst[d..d + 4].copy_from_slice(&rgba.to_le_bytes());
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    // Independent EXIF mapping for the affine tests.
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
    fn swaps_dims_only_for_the_90_270_transpose_family() {
        for o in [TRANSPOSE, ROTATE_90, TRANSVERSE, ROTATE_270] {
            assert!(swaps_dims(o), "o={o}");
        }
        for o in [0, 1, FLIP_HORIZONTAL, ROTATE_180, FLIP_VERTICAL, 9, -1] {
            assert!(!swaps_dims(o), "o={o}");
        }
    }

    #[test]
    fn identity_for_normal_orientation() {
        let src: Vec<u8> = (0..24u8).collect();
        let mut dst = vec![0u8; 24];
        assert!(rotate_rgba8888(&src, 8, 2, 3, 1, &mut dst));
        assert_eq!(src, dst);
    }

    #[test]
    fn respects_src_stride_padding() {
        let (sw, sh, stride) = (2usize, 2usize, 12usize);
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
            assert_eq!(&dst[i * 4..i * 4 + 4], &pixel(3 - i));
        }
    }

    #[test]
    fn rejects_bad_sizes() {
        let src = vec![0u8; 16];
        let mut small = vec![0u8; 4];
        assert!(!rotate_rgba8888(&src, 8, 2, 2, ROTATE_90, &mut small));
        assert!(!rotate_rgba8888(&src, 4, 2, 2, 1, &mut small));
        assert!(!rotate_rgba8888(
            &src,
            usize::MAX,
            usize::MAX,
            1,
            1,
            &mut small
        ));
        assert!(!rotate_rgba8888(&src, usize::MAX, 1, 2, 1, &mut small));
    }

    #[test]
    fn scale10_matches_exact_mapping() {
        for v in 0..1024 {
            assert_eq!(scale10(v), (v * 255 + 511) / 1023, "v={v}");
        }
    }

    // 179 and 111 distinguish rounded scaling from `>> 2`.
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
            assert_eq!(scale10(v), want, "v={v}");
        }
        for (a, want) in [0, 85, 170, 255].into_iter().enumerate() {
            assert_eq!(a as u32 * 85, want);
        }
    }

    #[test]
    fn convert_packing() {
        let red = 0x0000_03FFu32.to_le_bytes();
        let alpha = 0xC000_0000u32.to_le_bytes();
        let mut src = Vec::new();
        src.extend_from_slice(&red);
        src.extend_from_slice(&alpha);
        let mut dst = vec![0u8; 8];
        assert!(rgba1010102_to_rgba8888(&src, 8, 2, 1, &mut dst));
        assert_eq!(&dst[0..4], &[255, 0, 0, 0]);
        assert_eq!(&dst[4..8], &[0, 0, 0, 255]);
    }

    #[test]
    fn convert_respects_src_stride_padding() {
        let (w, h, stride) = (2usize, 2usize, 12usize);
        let px = |v: u32| (v | 0xC000_0000).to_le_bytes();
        let mut src = vec![0u8; stride * h];
        for (i, v) in [0u32, 179, 111, 1023].iter().enumerate() {
            let (x, y) = (i % w, i / w);
            src[y * stride + x * 4..y * stride + x * 4 + 4].copy_from_slice(&px(*v));
        }
        let mut dst = vec![0u8; w * h * 4];
        assert!(rgba1010102_to_rgba8888(&src, stride, w, h, &mut dst));
        for (i, want) in [0u8, 45, 28, 255].iter().enumerate() {
            assert_eq!(dst[i * 4], *want, "R of pixel {i}");
            assert_eq!(dst[i * 4 + 3], 255, "A of pixel {i}");
        }
    }

    #[test]
    fn convert_rejects_bad_sizes() {
        let src = vec![0u8; 16];
        let mut small = vec![0u8; 4];
        assert!(!rgba1010102_to_rgba8888(&src, 0, 0, 0, &mut small));
        assert!(!rgba1010102_to_rgba8888(&src, 4, 2, 2, &mut small));
        assert!(!rgba1010102_to_rgba8888(&src, 8, 2, 2, &mut small));
        assert!(!rgba1010102_to_rgba8888(
            &src,
            usize::MAX,
            usize::MAX,
            1,
            &mut small,
        ));
        assert!(!rgba1010102_to_rgba8888(&src, usize::MAX, 1, 2, &mut small));
    }
}
