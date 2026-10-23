use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use moxcms::{
    ColorProfile, DataColorSpace, Layout, RenderingIntent, Transform16BitExecutor, TransformOptions,
};

use crate::image::Pixels;

/// The colour space decoded pixels should be in.
#[derive(Clone, Copy, PartialEq)]
pub enum Target {
    /// sRGB, converting and tone-mapping as needed.
    Srgb,
    /// The image's own space whenever [`Cicp`] can describe it, otherwise sRGB.
    Source,
}

/// ITU-T H.273 colour primaries.
#[derive(Clone, Copy, PartialEq)]
#[repr(u8)]
pub enum Primaries {
    Bt709 = 1,
    Bt2020 = 9,
    DisplayP3 = 12,
}

/// ITU-T H.273 transfer characteristics.
#[derive(Clone, Copy, PartialEq)]
#[repr(u8)]
pub enum Transfer {
    Srgb = 13,
    Pq = 16,
    Hlg = 18,
}

impl Transfer {
    pub(crate) fn is_hdr(self) -> bool {
        matches!(self, Self::Pq | Self::Hlg)
    }
}

/// A colour space as ITU-T H.273 code points, for full-range RGB.
#[derive(Clone, Copy, PartialEq)]
pub struct Cicp {
    pub primaries: Primaries,
    pub transfer: Transfer,
}

impl Cicp {
    pub const SRGB: Self = Self {
        primaries: Primaries::Bt709,
        transfer: Transfer::Srgb,
    };
}

/// Builds the transform from an ICC profile to sRGB, and the layout of the 12-bit samples it reads.
pub(crate) fn to_srgb(icc: &[u8]) -> Option<(Arc<Transform16BitExecutor>, Layout)> {
    let source = ColorProfile::new_from_slice(icc).ok()?;
    let layout = match source.color_space {
        DataColorSpace::Gray => Layout::GrayAlpha,
        _ => Layout::Rgba,
    };
    let options = TransformOptions {
        // Profiles that tone-map HDR, like those jxl-rs makes, may only have a perceptual table.
        rendering_intent: RenderingIntent::Perceptual,
        // The fixed-point path loses precision with the narrower samples it reads.
        prefer_fixed_point: false,
        ..Default::default()
    };
    // Going past 12-bit makes the transform's tables much slower to build for negligible benefit.
    let transform = source
        .create_transform_12bit(layout, &ColorProfile::new_srgb(), Layout::Rgba, options)
        .ok()?;
    Some((transform, layout))
}

/// Converts the 12-bit samples in `rgba`, `stride` bytes per row, to RGBA8 with `transform`.
pub(crate) fn convert_bands(
    transform: &Transform16BitExecutor,
    rgba: &mut Pixels<u8>,
    stride: usize,
    cancelled: &AtomicBool,
) -> Option<()> {
    let (w, h) = (rgba.width(), rgba.height());
    let buf = rgba.bytes_mut();
    // Narrowing in place keeps peak memory at the wide decode plus one band.
    let rows = 64;
    let mut converted = vec![0u16; w * 4 * rows.min(h)];
    for y in (0..h).step_by(rows) {
        if cancelled.load(Ordering::Relaxed) {
            return None;
        }
        let n = rows.min(h - y);
        let band = &buf[y * stride..][..n * stride];
        // SAFETY: any two bytes are a valid u16.
        let ([], src, []) = (unsafe { band.align_to::<u16>() }) else {
            return None;
        };
        transform.transform(src, &mut converted[..n * w * 4]).ok()?;
        // Pixels decode at least as wide as RGBA8, so this only overwrites converted rows.
        let narrowed = &mut buf[y * w * 4..][..n * w * 4];
        for (dst, &src) in narrowed.iter_mut().zip(&converted) {
            const NARROW: u32 = ((255 << 16) + 4095 / 2) / 4095;
            *dst = ((u32::from(src) * NARROW + (1 << 15)) >> 16) as u8;
        }
    }
    Some(())
}
