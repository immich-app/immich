use std::sync::atomic::AtomicBool;

use color::Target;
use image::Image;

pub mod color;
pub mod image;
#[cfg(feature = "jxl")]
pub mod jxl;
mod resize;

enum Format {
    #[cfg(feature = "jxl")]
    Jxl,
}

pub struct Options {
    pub color_space: Target,

    /// Downscales to the smallest size that still fills this.
    pub target_size: Option<(usize, usize)>,

    /// Downscales to fit within this many pixels per side.
    pub max_pixel_size: usize,
}

fn probe(data: &[u8]) -> Option<Format> {
    #[cfg(feature = "jxl")]
    if matches!(
        ::jxl::api::check_signature(data),
        ::jxl::api::JxlSignature::Codestream | ::jxl::api::JxlSignature::Container
    ) {
        return Some(Format::Jxl);
    }

    None
}

/// Decodes the first frame of `data` unless cancelled.
pub fn decode(data: &[u8], options: &Options, cancelled: &AtomicBool) -> Option<Image> {
    match probe(data)? {
        #[cfg(feature = "jxl")]
        Format::Jxl => jxl::Jxl::open(data, options.color_space)?.decode(
            options.target_size,
            options.max_pixel_size,
            cancelled,
        ),
    }
}
