use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

pub use moxcms::{CicpColorPrimaries, CicpProfile, TransferCharacteristics};
use moxcms::{
    ColorProfile, DataColorSpace, Layout, MatrixCoefficients, RenderingIntent,
    Transform16BitExecutor, TransformOptions,
};

use crate::image::Pixels;

/// The colour space decoded pixels should be in.
#[derive(Clone, Copy, PartialEq)]
pub enum Target {
    /// sRGB, converting and tone-mapping as needed.
    Srgb,
    /// The image's own space whenever CICP can describe it, otherwise sRGB.
    Source,
}

pub(crate) const SRGB: CicpProfile = CicpProfile {
    color_primaries: CicpColorPrimaries::Bt709,
    transfer_characteristics: TransferCharacteristics::Srgb,
    matrix_coefficients: MatrixCoefficients::Identity,
    full_range: true,
};

pub(crate) fn is_srgb(cicp: CicpProfile) -> bool {
    cicp.color_primaries == SRGB.color_primaries
        && cicp.transfer_characteristics == SRGB.transfer_characteristics
}

pub(crate) fn is_hdr(cicp: CicpProfile) -> bool {
    matches!(
        cicp.transfer_characteristics,
        TransferCharacteristics::Smpte2084 | TransferCharacteristics::Hlg
    )
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
