use std::sync::atomic::AtomicBool;

use color::Target;
use image::Image;

pub mod color;
pub mod image;
#[cfg(feature = "jxl")]
pub mod jxl;
mod resize;

/// A format that one of the enabled decoders reads.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Format {
    #[cfg(feature = "jxl")]
    Jxl,
}

pub struct Options {
    /// The colour space of the output.
    pub target: Target,
    /// Downscales to cover this size.
    pub cover: Option<(usize, usize)>,
    /// Downscales to fit within this many pixels per side.
    pub max_pixel_size: usize,
}

/// The format of `data`, if a decoder for it is enabled.
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
        Format::Jxl => jxl::Jxl::open(data, options.target)?.decode(
            options.cover,
            options.max_pixel_size,
            cancelled,
        ),
    }
}
