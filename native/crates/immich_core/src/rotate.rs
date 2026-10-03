#[derive(Clone, Copy)]
pub enum Orientation {
    Normal,
    FlipHorizontal,
    Rotate180,
    FlipVertical,
    Transpose,
    Rotate90,
    Transverse,
    Rotate270,
}

impl From<i32> for Orientation {
    fn from(value: i32) -> Self {
        match value {
            2 => Self::FlipHorizontal,
            3 => Self::Rotate180,
            4 => Self::FlipVertical,
            5 => Self::Transpose,
            6 => Self::Rotate90,
            7 => Self::Transverse,
            8 => Self::Rotate270,
            _ => Self::Normal,
        }
    }
}

impl Orientation {
    pub fn dimensions(self, w: usize, h: usize) -> (usize, usize) {
        match self {
            Self::Transpose | Self::Rotate90 | Self::Transverse | Self::Rotate270 => (h, w),
            _ => (w, h),
        }
    }
}

/// Copies `h` rows of `w` pixels, `stride` pixels apart in `src`, into `dst` with `orientation`
/// applied. `dst` is dense: `orientation.dimensions(w, h)` pixels.
pub fn rotate(
    src: &[u32],
    stride: usize,
    w: usize,
    h: usize,
    orientation: Orientation,
    dst: &mut [u32],
) {
    assert!(w <= stride && h.saturating_mul(stride) <= src.len() && w * h <= dst.len());
    let (dw, _) = orientation.dimensions(w, h);
    let (w, h, dw) = (w as isize, h as isize, dw as isize);
    // A source pixel (x, y) lands at base + x * step_x + y * step_y in the dense dw-wide output,
    // the same layout as Bitmap.createBitmap(src, matrixForExifOrientation(orientation)).
    let (base, step_x, step_y) = match orientation {
        Orientation::FlipHorizontal => (w - 1, -1, dw),
        Orientation::Rotate180 => ((h - 1) * dw + w - 1, -1, -dw),
        Orientation::FlipVertical => ((h - 1) * dw, 1, -dw),
        Orientation::Transpose => (0, dw, 1),
        Orientation::Rotate90 => (h - 1, dw, -1),
        Orientation::Transverse => ((w - 1) * dw + h - 1, -dw, -1),
        Orientation::Rotate270 => ((w - 1) * dw, -dw, 1),
        Orientation::Normal => (0, 1, dw),
    };
    let (src, dst) = (src.as_ptr(), dst.as_mut_ptr());
    // 32x32 u32 tiles are 4KB, so the scattered writes of a 90/270 transpose stay in L1.
    for ty in (0..h).step_by(32) {
        for tx in (0..w).step_by(32) {
            for y in ty..(ty + 32).min(h) {
                // SAFETY: src holds h rows of stride pixels (asserted above).
                let row = unsafe { src.add(y as usize * stride) };
                let mut idx = base + y * step_y + tx * step_x;
                for x in tx..(tx + 32).min(w) {
                    // SAFETY: the affine mapping stays within the w*h output and x stays within its row.
                    unsafe { dst.add(idx as usize).write(row.add(x as usize).read()) };
                    idx += step_x;
                }
            }
        }
    }
}
