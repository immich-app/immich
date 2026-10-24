use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use jxl::api::{
    AlphaMode, Endianness, Event, ExtraChannel, JxlColorEncoding, JxlColorProfile, JxlColorType,
    JxlDataFormat, JxlDecoder, JxlDecoderOptions, JxlOutputBuffer, JxlParallelRunner,
    JxlParallelRunnerFun, JxlPixelFormat, JxlPrimaries, JxlTransferFunction, JxlWhitePoint,
};
use moxcms::{Layout, MatrixCoefficients, Transform16BitExecutor};
use rayon::prelude::*;

use crate::color::{self, CicpColorPrimaries, CicpProfile, Target, TransferCharacteristics};
use crate::image::{Image, Pixels, Samples};
use crate::resize;

/// A JPEG XL image whose header has been read.
pub struct Jxl<'a> {
    decoder: JxlDecoder,
    input: &'a [u8],
    /// The space of the output.
    cicp: CicpProfile,
    /// Converts wide samples to sRGB when the output is not in the source space.
    transform: Option<Arc<Transform16BitExecutor>>,
}

/// Runs on the global pool with up to this many threads, or inline with one.
struct Rayon(usize);

impl JxlParallelRunner for Rayon {
    fn run(&mut self, num: usize, fun: &JxlParallelRunnerFun<'_>) -> jxl::error::Result<()> {
        (0..num).into_par_iter().try_for_each(fun)
    }

    fn num_threads(&self) -> usize {
        self.0
    }
}

/// Stops handing out work once the flag is set.
struct Cancellable<'a> {
    pool: Rayon,
    cancelled: &'a AtomicBool,
}

impl JxlParallelRunner for Cancellable<'_> {
    fn run(&mut self, num: usize, fun: &JxlParallelRunnerFun<'_>) -> jxl::error::Result<()> {
        self.pool.run(num, fun)
    }

    fn num_threads(&self) -> usize {
        self.pool.num_threads()
    }

    // jxl-rs only calls this, and each of its tasks loops many items, so check cancellation here.
    fn run_ordered(
        &mut self,
        num: usize,
        max_threads: Option<usize>,
        fun: &JxlParallelRunnerFun<'_>,
    ) -> jxl::error::Result<()> {
        self.pool.run_ordered(num, max_threads, &|i| {
            if self.cancelled.load(Ordering::Relaxed) {
                // Any error stops the decode.
                return Err(jxl::error::Error::ApiUsageError("cancelled"));
            }
            fun(i)
        })
    }
}

impl<'a> Jxl<'a> {
    pub fn open(mut input: &'a [u8], target: Target) -> Option<Self> {
        let mut options = JxlDecoderOptions::default();
        // Colour transforms need straight alpha; premultiplying happens last.
        options.alpha_mode = AlphaMode::Unpremultiplied;
        let mut decoder = JxlDecoder::new(options);
        let Event::BasicInfo = decoder.process(&mut input, None, None).ok()? else {
            return None;
        };
        let extra = decoder.basic_info()?.extra_channels.len();
        // An integer pixel format ensures the output profile below is sRGB rather than float scRGB.
        decoder
            .set_pixel_format(JxlPixelFormat::rgba8(extra))
            .ok()?;
        let profile = decoder.output_color_profile()?;
        if let Some(cicp) = cicp(profile)
            && (target == Target::Source || color::is_srgb(cicp))
        {
            if color::is_hdr(cicp) {
                decoder
                    .set_pixel_format(JxlPixelFormat::rgba16(extra))
                    .ok()?;
            }
            return Some(Self {
                decoder,
                input,
                cicp,
                transform: None,
            });
        }
        let (transform, layout) = color::to_srgb(&profile.try_as_icc()?)?;
        decoder
            .set_pixel_format(JxlPixelFormat {
                color_type: match layout {
                    Layout::GrayAlpha => JxlColorType::GrayscaleAlpha,
                    _ => JxlColorType::Rgba,
                },
                color_data_format: Some(JxlDataFormat::U16 {
                    endianness: Endianness::native(),
                    bit_depth: 12,
                }),
                extra_channel_format: vec![None; extra],
            })
            .ok()?;
        Some(Self {
            decoder,
            input,
            cicp: color::SRGB,
            transform: Some(transform),
        })
    }

    /// Decodes the first frame unless cancelled, downscaled to cover `target` pixels and to fit
    /// within `max_pixel_size`.
    pub fn decode(
        mut self,
        target: Option<(usize, usize)>,
        max_pixel_size: usize,
        cancelled: &AtomicBool,
    ) -> Option<Image> {
        let info = self.decoder.basic_info()?;
        let (w, h) = info.size;
        let alpha = info
            .extra_channels
            .iter()
            .any(|ec| ec.ec_type == ExtraChannel::Alpha);
        let format = self.decoder.current_pixel_format()?;
        let pixel_bytes =
            format.color_type.samples_per_pixel() * format.color_data_format?.bytes_per_sample();
        let stride = w.checked_mul(pixel_bytes)?;
        let size = resize::cover((w, h), target, max_pixel_size);
        let samples = if color::is_hdr(self.cicp) {
            let mut rgba = Pixels::zeroed(w, h, pixel_bytes)?;
            self.decode_frame(&mut rgba, stride, cancelled)?;
            Samples::U16(rgba.premultiply_resize(alpha, size)?)
        } else {
            // The buffer is sized for the wide decode and ends up holding the RGBA8 result at its
            // front.
            let mut rgba = Pixels::zeroed(w, h, pixel_bytes)?;
            self.decode_frame(&mut rgba, stride, cancelled)?;
            if let Some(transform) = &self.transform {
                color::convert_bands(transform.as_ref(), &mut rgba, stride, cancelled)?;
            }
            Samples::U8(rgba.premultiply_resize(alpha, size)?)
        };
        Some(Image {
            cicp: self.cicp,
            samples,
        })
    }

    fn decode_frame<T>(
        &mut self,
        rgba: &mut Pixels<T>,
        stride: usize,
        cancelled: &AtomicBool,
    ) -> Option<()> {
        let (w, h) = (rgba.width(), rgba.height());
        let buf = rgba.bytes_mut();
        // The pool only pays off for large images, since thumbs are already decoded in parallel.
        let threads = if w * h > 512 * 512 {
            rayon::current_num_threads()
        } else {
            1
        };
        let mut runner = Cancellable {
            pool: Rayon(threads),
            cancelled,
        };
        loop {
            let output = &mut [JxlOutputBuffer::new(buf, h, stride)];
            match self
                .decoder
                .process(&mut self.input, Some(output), Some(&mut runner))
                .ok()?
            {
                Event::FrameHeader => {}
                // Resizing costs ~10% of a thumbnail decode, wasted on tiles that scrolled away
                // meanwhile.
                Event::FrameComplete { .. } => {
                    return (!cancelled.load(Ordering::Relaxed)).then_some(());
                }
                _ => return None,
            }
        }
    }
}

/// The space of the decoded samples, if CICP can describe it.
fn cicp(profile: &JxlColorProfile) -> Option<CicpProfile> {
    let JxlColorProfile::Simple(encoding) = profile else {
        return None;
    };
    let (primaries, transfer_function) = match encoding {
        JxlColorEncoding::RgbColorSpace {
            white_point: JxlWhitePoint::D65,
            primaries,
            transfer_function,
            ..
        } => (primaries, transfer_function),
        // Gray samples decode to neutral RGB, which any primaries reproduce.
        JxlColorEncoding::GrayscaleColorSpace {
            white_point: JxlWhitePoint::D65,
            transfer_function,
            ..
        } => (&JxlPrimaries::SRGB, transfer_function),
        _ => return None,
    };
    Some(CicpProfile {
        color_primaries: match primaries {
            JxlPrimaries::SRGB => CicpColorPrimaries::Bt709,
            JxlPrimaries::BT2100 => CicpColorPrimaries::Bt2020,
            JxlPrimaries::P3 => CicpColorPrimaries::Smpte432,
            JxlPrimaries::Chromaticities { .. } => return None,
        },
        transfer_characteristics: match transfer_function {
            JxlTransferFunction::SRGB => TransferCharacteristics::Srgb,
            JxlTransferFunction::PQ => TransferCharacteristics::Smpte2084,
            JxlTransferFunction::HLG => TransferCharacteristics::Hlg,
            _ => return None,
        },
        matrix_coefficients: MatrixCoefficients::Identity,
        full_range: true,
    })
}
