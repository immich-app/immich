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
}
