use std::marker::PhantomData;
use std::mem::ManuallyDrop;
use std::ptr::NonNull;
use std::slice;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use jxl::api::{
    AlphaMode, Endianness, Event, ExtraChannel, JxlColorEncoding, JxlColorProfile, JxlColorType,
    JxlDataFormat, JxlDecoder, JxlDecoderOptions, JxlOutputBuffer, JxlParallelRunner,
    JxlParallelRunnerFun, JxlPixelFormat, JxlPrimaries, JxlTransferFunction, JxlWhitePoint,
};
use moxcms::{
    ColorProfile, DataColorSpace, Layout, RenderingIntent, Transform16BitExecutor, TransformOptions,
};
use rayon::prelude::*;

/// A JPEG XL image whose header has been read.
pub struct Jxl<'a> {
    decoder: JxlDecoder,
    input: &'a [u8],
    /// The space of the output.
    cicp: Cicp,
    /// Converts wide samples to sRGB when the output is not in the source space.
    transform: Option<Arc<Transform16BitExecutor>>,
}

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
    fn is_hdr(self) -> bool {
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

/// Decoded pixels and the colour space they are in.
pub struct Image {
    pub cicp: Cicp,
    pub samples: Samples,
}

pub enum Samples {
    U8(Pixels<u8>),
    /// For HDR transfers, which need more than 8 bits.
    U16(Pixels<u16>),
}

/// Premultiplied RGBA pixels in a malloc'd buffer.
pub struct Pixels<T> {
    /// Initialized bytes from calloc or realloc that only self references.
    buf: NonNull<[u8]>,
    width: usize,
    height: usize,
    sample: PhantomData<T>,
}

trait Sample: Copy {
    const MAX: Self;

    /// Rounds like dividing the product by MAX would.
    fn scale(self, alpha: Self) -> Self;
}

impl Sample for u8 {
    const MAX: Self = u8::MAX;

    fn scale(self, alpha: Self) -> Self {
        let x = u16::from(self) * u16::from(alpha) + 128;
        ((x + (x >> 8)) >> 8) as u8
    }
}

impl Sample for u16 {
    const MAX: Self = u16::MAX;

    fn scale(self, alpha: Self) -> Self {
        let x = u32::from(self) * u32::from(alpha) + 32768;
        ((x + (x >> 16)) >> 16) as u16
    }
}

impl<T> Pixels<T> {
    /// Allocates pixels of u8 or u16 samples, the only kinds this module makes.
    fn zeroed(width: usize, height: usize, len: usize) -> Option<Self>
    where
        T: Sample,
    {
        // SAFETY: calloc has no preconditions.
        let ptr = NonNull::new(unsafe { libc::calloc(len, 1) }.cast())?;
        Some(Self {
            buf: NonNull::slice_from_raw_parts(ptr, len),
            width,
            height,
            sample: PhantomData,
        })
    }

    fn bytes_mut(&mut self) -> &mut [u8] {
        // SAFETY: self owns these initialized bytes.
        unsafe { self.buf.as_mut() }
    }

    fn pixels_mut(&mut self) -> &mut [[T; 4]] {
        let len = self.buf.len() / size_of::<[T; 4]>();
        // SAFETY: as for pixels, and self is borrowed mutably.
        unsafe { slice::from_raw_parts_mut(self.buf.as_ptr().cast(), len) }
    }

    /// Frees everything after the pixels.
    fn shrink(mut self) -> Option<Self> {
        let len = self.width * self.height * 4 * size_of::<T>();
        // SAFETY: the buffer is live and the pixels fill its first len bytes.
        let shrunk = unsafe { libc::realloc(self.buf.as_ptr().cast(), len) };
        // A failed realloc leaves the original buffer, which self still frees.
        self.buf = NonNull::slice_from_raw_parts(NonNull::new(shrunk.cast())?, len);
        Some(self)
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn pixels(&self) -> &[[T; 4]] {
        let len = self.buf.len() / size_of::<[T; 4]>();
        // SAFETY: self owns these initialized bytes, and its u8 or u16 samples are valid for any
        // bytes and aligned by malloc.
        unsafe { slice::from_raw_parts(self.buf.as_ptr().cast(), len) }
    }

    /// Hands the buffer to a C caller, who frees it with free().
    pub fn into_raw(self) -> *mut u8 {
        ManuallyDrop::new(self).buf.as_ptr().cast()
    }
}

impl<T> Drop for Pixels<T> {
    fn drop(&mut self) {
        // SAFETY: self owns the buffer, which came from calloc or realloc.
        unsafe { libc::free(self.buf.as_ptr().cast()) };
    }
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
            && (target == Target::Source || cicp == Cicp::SRGB)
        {
            if cicp.transfer.is_hdr() {
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
        let (transform, color_type) = to_srgb(profile)?;
        decoder
            .set_pixel_format(JxlPixelFormat {
                color_type,
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
            cicp: Cicp::SRGB,
            transform: Some(transform),
        })
    }

    /// Decodes the first frame unless cancelled.
    pub fn decode(mut self, cancelled: &AtomicBool) -> Option<Image> {
        let info = self.decoder.basic_info()?;
        let (w, h) = info.size;
        let alpha = info
            .extra_channels
            .iter()
            .any(|ec| ec.ec_type == ExtraChannel::Alpha);
        let format = self.decoder.current_pixel_format()?;
        let stride = w
            .checked_mul(format.color_type.samples_per_pixel())?
            .checked_mul(format.color_data_format?.bytes_per_sample())?;
        let len = stride.checked_mul(h)?;
        let samples = if self.cicp.transfer.is_hdr() {
            let mut rgba = Pixels::zeroed(w, h, len)?;
            self.decode_frame(&mut rgba, stride, cancelled)?;
            if alpha {
                premultiply(rgba.pixels_mut());
            }
            Samples::U16(rgba)
        } else {
            // The buffer is sized for the wide decode and ends up holding the RGBA8 result at its
            // front.
            let mut rgba = Pixels::zeroed(w, h, len)?;
            self.decode_frame(&mut rgba, stride, cancelled)?;
            self.convert_bands(&mut rgba, stride, cancelled)?;
            let mut rgba = rgba.shrink()?;
            if alpha {
                premultiply(rgba.pixels_mut());
            }
            Samples::U8(rgba)
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
                Event::FrameComplete { .. } => return Some(()),
                _ => return None,
            }
        }
    }

    fn convert_bands(
        &self,
        rgba: &mut Pixels<u8>,
        stride: usize,
        cancelled: &AtomicBool,
    ) -> Option<()> {
        let Some(transform) = &self.transform else {
            return Some(());
        };
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
}

/// The space of the decoded samples, if [`Cicp`] can describe it.
fn cicp(profile: &JxlColorProfile) -> Option<Cicp> {
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
    Some(Cicp {
        primaries: match primaries {
            JxlPrimaries::SRGB => Primaries::Bt709,
            JxlPrimaries::BT2100 => Primaries::Bt2020,
            JxlPrimaries::P3 => Primaries::DisplayP3,
            JxlPrimaries::Chromaticities { .. } => return None,
        },
        transfer: match transfer_function {
            JxlTransferFunction::SRGB => Transfer::Srgb,
            JxlTransferFunction::PQ => Transfer::Pq,
            JxlTransferFunction::HLG => Transfer::Hlg,
            _ => return None,
        },
    })
}

/// Builds the transform from the decoded profile to sRGB, and the colour type it reads.
fn to_srgb(profile: &JxlColorProfile) -> Option<(Arc<Transform16BitExecutor>, JxlColorType)> {
    let source = ColorProfile::new_from_slice(&profile.try_as_icc()?).ok()?;
    let (layout, color_type) = match source.color_space {
        DataColorSpace::Gray => (Layout::GrayAlpha, JxlColorType::GrayscaleAlpha),
        _ => (Layout::Rgba, JxlColorType::Rgba),
    };
    let options = TransformOptions {
        // jxl-rs only writes a perceptual table into the tone-mapping profiles of HDR images.
        rendering_intent: RenderingIntent::Perceptual,
        // The fixed-point path loses precision with the narrower samples it reads.
        prefer_fixed_point: false,
        ..Default::default()
    };
    // Going past 12-bit makes the transform's tables much slower to build for negligible benefit.
    let transform = source
        .create_transform_12bit(layout, &ColorProfile::new_srgb(), Layout::Rgba, options)
        .ok()?;
    Some((transform, color_type))
}

fn premultiply<T: Sample>(pixels: &mut [[T; 4]]) {
    // Alpha scaling itself at full opacity lets this vectorize as every lane does the same work.
    for px in pixels {
        let [r, g, b, a] = *px;
        *px = [r.scale(a), g.scale(a), b.scale(a), a.scale(T::MAX)];
    }
}
