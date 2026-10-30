use std::ffi::c_int;
use std::fmt::Debug;
use std::mem::MaybeUninit;
use std::ptr::NonNull;
use std::slice;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock};

use jxl::api::{
    JxlColorEncoding, JxlColorProfile, JxlPrimaries, JxlTransferFunction, JxlWhitePoint,
    RenderingIntent,
};
use moxcms::{ColorProfile, Layout, MatrixCoefficients, Transform16BitExecutor};
use mp4parse::{ImageMirror, ImageRotation, ParseStrictness};
use quick_cache::sync::Cache;
use rav1d::include::dav1d::data::Dav1dData;
use rav1d::include::dav1d::dav1d::{Dav1dContext, Dav1dSettings};
use rav1d::include::dav1d::headers::{
    DAV1D_PIXEL_LAYOUT_I400, DAV1D_PIXEL_LAYOUT_I420, DAV1D_PIXEL_LAYOUT_I422,
    DAV1D_PIXEL_LAYOUT_I444, Dav1dPixelLayout, Dav1dSequenceHeader,
};
use rav1d::include::dav1d::picture::Dav1dPicture;
use rav1d::src::lib::{
    dav1d_close, dav1d_data_create, dav1d_data_unref, dav1d_default_settings, dav1d_get_picture,
    dav1d_open, dav1d_picture_unref, dav1d_send_data,
};
use yuv::{YuvGrayImage, YuvPlanarImage, YuvRange, YuvStandardMatrix};

use crate::Options;
use crate::color::{
    self, CicpColorPrimaries, CicpProfile, TRANSFORMS, Target, TransferCharacteristics, Transforms,
};
use crate::image::{Image, Pixels, Sample, Samples};
use crate::jxl::srgb_transform;
use crate::resize;
use crate::rotate::{Orientation, rotate};

/// Whether `data` starts with a file type box that lists an AVIF brand.
pub(crate) fn is_avif(data: &[u8]) -> bool {
    let Some(&size) = data.first_chunk() else {
        return false;
    };
    data.get(4..8) == Some(b"ftyp")
        && data
            .get(8..u32::from_be_bytes(size) as usize)
            .is_some_and(|brands| {
                // The second field is the minor version.
                brands
                    .as_chunks()
                    .0
                    .iter()
                    .enumerate()
                    .any(|(i, brand)| i != 1 && matches!(brand, b"avif" | b"avis"))
            })
}

/// Decodes the primary image unless cancelled. Grids, essential crops or layers, gray ICC profiles
/// and HDR outside BT.709, P3 and BT.2020 return None.
pub(crate) fn decode(data: &[u8], options: &Options, cancelled: &AtomicBool) -> Option<Image> {
    let avif = mp4parse::read_avif(&mut &*data, ParseStrictness::Normal).ok()?;

    let color = Picture::decode(avif.primary_item_coded_data()?)?;
    let alpha = match avif.alpha_item_coded_data() {
        Some(data) => Some(Picture::decode(data)?),
        None => None,
    };

    let (w, h) = (color.width(), color.height());
    if cancelled.load(Ordering::Relaxed)
        || alpha
            .as_ref()
            .is_some_and(|alpha| (alpha.width(), alpha.height()) != (w, h))
    {
        return None;
    }

    // A colr box overrides the color description in the AV1 data (MIAF 7.3.6.4).
    let (pri, trc, mtrx, full_range) = match avif.nclx_colour_information_ptr() {
        Some(nclx) => {
            // mp4parse 0.17 keeps these fields private and only hands out this pointer.
            const _: () = assert!(size_of::<mp4parse::NclxColourInformation>() == 4);
            // SAFETY: the pointer points into `avif`, which outlives this read, at mp4parse's repr(C)
            // NclxColourInformation: primaries, transfer, matrix and the full range flag, a byte each.
            let [pri, trc, mtrx, full_range] = unsafe { nclx.ok()?.cast::<[u8; 4]>().read() };
            (pri.into(), trc.into(), mtrx.into(), full_range != 0)
        }
        None => {
            let seq = color.sequence_header()?;
            (seq.pri, seq.trc, seq.mtrx, seq.color_range != 0)
        }
    };

    let cicp = CicpProfile {
        // Unspecified primaries and transfer are taken as sRGB.
        color_primaries: match CicpColorPrimaries::try_from(u8::try_from(pri).ok()?).ok()? {
            CicpColorPrimaries::Unspecified => CicpColorPrimaries::Bt709,
            pri => pri,
        },
        transfer_characteristics: match TransferCharacteristics::try_from(u8::try_from(trc).ok()?)
            .ok()?
        {
            TransferCharacteristics::Unspecified => TransferCharacteristics::Srgb,
            trc => trc,
        },
        matrix_coefficients: MatrixCoefficients::Identity,
        full_range: true,
    };

    let icc = avif.icc_colour_information().transpose().ok()?;
    // An ICC profile describes the samples instead.
    let hdr = icc.is_none() && color::is_hdr(cicp);
    let keep_space = options.color_space == Target::Source && describable(cicp);

    let range = if full_range {
        YuvRange::Full
    } else {
        YuvRange::Limited
    };
    let matrix = matrix(mtrx)?;

    let rotation = avif.image_rotation().ok()?;
    // SAFETY: the pointer is null or points into `avif`, which outlives this borrow.
    let mirror = unsafe { avif.image_mirror_ptr().ok()?.as_ref() };
    let orientation = exif_orientation(rotation, mirror);
    // The image turns after resizing, so a quarter turn swaps the target's sides first.
    let target_size = options
        .target_size
        .map(|(tw, th)| orientation.dimensions(tw, th));
    let size = resize::cover((w, h), target_size, options.max_pixel_size);

    if hdr && keep_space {
        let mut rgba = Pixels::<u16>::zeroed(w, h, 8)?;
        color.to_rgba12(
            alpha.as_ref(),
            avif.premultiplied_alpha,
            rgba.bytes_mut(),
            range,
            matrix,
        )?;
        // 16 bits in the image's own transfer, like the jxl decoder's HDR output.
        for sample in rgba.pixels_mut().as_flattened_mut() {
            *sample = *sample << 4 | *sample >> 8;
        }
        return Some(Image {
            cicp,
            samples: Samples::U16(finish(rgba, alpha.is_some(), size, orientation, cancelled)?),
        });
    }

    let transform = match icc {
        Some(icc) => match color::icc_to_srgb(icc)? {
            (transform, Layout::Rgba) => Some(transform),
            _ => return None,
        },
        // yuv narrows deeper YUV samples to 8 bits itself, but not deeper gray or RGB ones.
        None if (color.bpc() == 8
            || matrix.is_some() && color.layout() != DAV1D_PIXEL_LAYOUT_I400)
            && (color::is_srgb(cicp) || keep_space) =>
        {
            None
        }
        None => Some(cicp_transform(cicp)?),
    };

    // The 12-bit samples for the transform need twice the room.
    let mut rgba = Pixels::<u8>::zeroed(w, h, if transform.is_some() { 8 } else { 4 })?;
    match &transform {
        None => color.to_rgba8(
            alpha.as_ref(),
            avif.premultiplied_alpha,
            rgba.bytes_mut(),
            range,
            matrix,
        )?,
        Some(transform) => {
            color.to_rgba12(
                alpha.as_ref(),
                avif.premultiplied_alpha,
                rgba.bytes_mut(),
                range,
                matrix,
            )?;
            color::convert_bands(transform.as_ref(), &mut rgba, w * 8, cancelled)?;
        }
    }
    Some(Image {
        cicp: if transform.is_some() {
            color::SRGB
        } else {
            cicp
        },
        samples: Samples::U8(finish(rgba, alpha.is_some(), size, orientation, cancelled)?),
    })
}

/// Whether the samples can stay in this space for [`Target::Source`].
fn describable(cicp: CicpProfile) -> bool {
    matches!(
        cicp.color_primaries,
        CicpColorPrimaries::Bt709 | CicpColorPrimaries::Smpte432 | CicpColorPrimaries::Bt2020
    ) && (cicp.transfer_characteristics == TransferCharacteristics::Srgb || color::is_hdr(cicp))
}

/// The matrix for YUV samples, or None for RGB ones.
fn matrix(mtrx: u32) -> Option<Option<YuvStandardMatrix>> {
    Some(
        match MatrixCoefficients::try_from(u8::try_from(mtrx).ok()?).ok()? {
            MatrixCoefficients::Identity => None,
            MatrixCoefficients::Bt709 => Some(YuvStandardMatrix::Bt709),
            // Unspecified is taken as BT.601.
            MatrixCoefficients::Unspecified
            | MatrixCoefficients::Bt470Bg
            | MatrixCoefficients::Smpte170m => Some(YuvStandardMatrix::Bt601),
            MatrixCoefficients::Fcc => Some(YuvStandardMatrix::Fcc),
            MatrixCoefficients::Smpte240m => Some(YuvStandardMatrix::Smpte240),
            MatrixCoefficients::Bt2020Ncl => Some(YuvStandardMatrix::Bt2020),
            _ => return None,
        },
    )
}

/// The transform from `cicp` to sRGB, built once per space.
fn cicp_transform(cicp: CicpProfile) -> Option<Arc<Transform16BitExecutor>> {
    if color::is_hdr(cicp) {
        // jxl-rs writes a tone-mapping table into the profiles it makes for PQ and HLG.
        let encoding = JxlColorEncoding::RgbColorSpace {
            white_point: JxlWhitePoint::D65,
            primaries: match cicp.color_primaries {
                CicpColorPrimaries::Bt709 => JxlPrimaries::SRGB,
                CicpColorPrimaries::Smpte432 => JxlPrimaries::P3,
                CicpColorPrimaries::Bt2020 => JxlPrimaries::BT2100,
                _ => return None,
            },
            transfer_function: match cicp.transfer_characteristics {
                TransferCharacteristics::Hlg => JxlTransferFunction::HLG,
                _ => JxlTransferFunction::PQ,
            },
            rendering_intent: RenderingIntent::Relative,
        };
        let (transform, _) = srgb_transform(&JxlColorProfile::Simple(encoding))?;
        return Some(transform);
    }

    static SPACES: LazyLock<Transforms<(u8, u8)>> = LazyLock::new(|| Cache::new(TRANSFORMS));
    let key = (
        cicp.color_primaries as u8,
        cicp.transfer_characteristics as u8,
    );
    let (transform, _) = SPACES
        .get_or_insert_with(&key, || {
            color::profile_to_srgb(&ColorProfile::new_from_cicp(cicp)).ok_or(())
        })
        .ok()?;
    Some(transform)
}

/// The EXIF orientation of turning counterclockwise as `irot` counts, then mirroring as `imir` says.
fn exif_orientation(rotation: ImageRotation, mirror: Option<&ImageMirror>) -> Orientation {
    match (rotation, mirror) {
        (ImageRotation::D0, None) => Orientation::Normal,
        (ImageRotation::D0, Some(ImageMirror::LeftRight))
        | (ImageRotation::D180, Some(ImageMirror::TopBottom)) => Orientation::FlipHorizontal,
        (ImageRotation::D0, Some(ImageMirror::TopBottom))
        | (ImageRotation::D180, Some(ImageMirror::LeftRight)) => Orientation::FlipVertical,
        (ImageRotation::D90, None) => Orientation::Rotate270,
        (ImageRotation::D90, Some(ImageMirror::LeftRight))
        | (ImageRotation::D270, Some(ImageMirror::TopBottom)) => Orientation::Transverse,
        (ImageRotation::D90, Some(ImageMirror::TopBottom))
        | (ImageRotation::D270, Some(ImageMirror::LeftRight)) => Orientation::Transpose,
        (ImageRotation::D180, None) => Orientation::Rotate180,
        (ImageRotation::D270, None) => Orientation::Rotate90,
    }
}

/// Premultiplies `rgba`, downscales it to `size` and turns it to `orientation`, unless cancelled.
fn finish<T: Sample>(
    rgba: Pixels<T>,
    alpha: bool,
    size: Option<(usize, usize)>,
    orientation: Orientation,
    cancelled: &AtomicBool,
) -> Option<Pixels<T>> {
    if cancelled.load(Ordering::Relaxed) {
        return None;
    }

    let rgba = rgba.premultiply_resize(alpha, size)?;
    if matches!(orientation, Orientation::Normal) {
        return Some(rgba);
    }

    let (w, h) = (rgba.width(), rgba.height());
    let (ow, oh) = orientation.dimensions(w, h);
    let mut out = Pixels::zeroed(ow, oh, size_of::<[T; 4]>())?;
    rotate(rgba.pixels(), w, w, h, orientation, out.pixels_mut());
    Some(out)
}

struct Picture(Dav1dPicture);

struct Decoder(Dav1dContext);

struct Data(Dav1dData);

impl Drop for Picture {
    fn drop(&mut self) {
        // SAFETY: the picture is empty or came from dav1d_get_picture, and is released once.
        unsafe { dav1d_picture_unref(Some(NonNull::from(&mut self.0))) };
    }
}

impl Drop for Decoder {
    fn drop(&mut self) {
        // SAFETY: the context came from dav1d_open and is closed once.
        unsafe { dav1d_close(Some(NonNull::from(&mut Some(self.0)))) };
    }
}

impl Drop for Data {
    fn drop(&mut self) {
        // SAFETY: the data is empty or came from dav1d_data_create, and unref is a no-op on data
        // that is empty or was consumed.
        unsafe { dav1d_data_unref(Some(NonNull::from(&mut self.0))) };
    }
}

impl Picture {
    fn decode(item: &[u8]) -> Option<Self> {
        let mut settings = MaybeUninit::<Dav1dSettings>::uninit();
        // SAFETY: settings is writable.
        unsafe { dav1d_default_settings(NonNull::from(&mut settings).cast()) };
        // SAFETY: dav1d_default_settings initialized every field.
        let mut settings = unsafe { settings.assume_init() };
        // One frame context makes rav1d 1.1 abort the process on corrupt input
        // (memorysafety/rav1d#1497), and two take two threads.
        settings.n_threads = 2;
        settings.max_frame_delay = 2;
        // A scalable image comes back as its top layer alone, not one picture per layer.
        settings.all_layers = 0;

        let mut context = None;
        // SAFETY: both pointers are valid for the call.
        unsafe {
            dav1d_open(
                Some(NonNull::from(&mut context)),
                Some(NonNull::from(&mut settings)),
            )
        };
        // An error leaves the context empty.
        let decoder = Decoder(context?);

        let mut data = Data(Dav1dData::default());
        // SAFETY: data is writable.
        let buf = unsafe { dav1d_data_create(Some(NonNull::from(&mut data.0)), item.len()) };
        if buf.is_null() {
            return None;
        }
        // SAFETY: rav1d allocated `item.len()` bytes at buf for this data.
        unsafe { slice::from_raw_parts_mut(buf, item.len()) }.copy_from_slice(item);

        let mut picture = Picture(Dav1dPicture::default());
        // Once all data is in, the first EAGAIN starts the drain that returns the frame.
        let mut draining = false;
        loop {
            if data.0.sz > 0 {
                // SAFETY: the context is open and data is valid.
                let sent =
                    unsafe { dav1d_send_data(Some(decoder.0), Some(NonNull::from(&mut data.0))) };
                if sent.0 != 0 && sent.0 != -libc::EAGAIN {
                    return None;
                }
            }
            // SAFETY: the context is open and picture is writable.
            match unsafe { dav1d_get_picture(Some(decoder.0), Some(NonNull::from(&mut picture.0))) }
                .0
            {
                0 => return Some(picture),
                again if again == -libc::EAGAIN && data.0.sz > 0 => {}
                again if again == -libc::EAGAIN && !draining => draining = true,
                _ => return None,
            }
        }
    }

    fn sequence_header(&self) -> Option<&Dav1dSequenceHeader> {
        self.0.seq_hdr.map(|header| {
            // SAFETY: a picture from rav1d keeps its sequence header for as long as it lives.
            unsafe { header.as_ref() }
        })
    }

    fn width(&self) -> usize {
        self.0.p.w as usize
    }

    fn height(&self) -> usize {
        self.0.p.h as usize
    }

    fn bpc(&self) -> c_int {
        self.0.p.bpc
    }

    fn layout(&self) -> Dav1dPixelLayout {
        self.0.p.layout
    }

    /// Plane `i` as samples of `T`, and its stride in samples.
    fn plane<T>(&self, i: usize) -> Option<(&[T], u32)> {
        let rows = if i > 0 && self.layout() == DAV1D_PIXEL_LAYOUT_I420 {
            self.height().div_ceil(2)
        } else {
            self.height()
        };
        let stride = usize::try_from(self.0.stride[i.min(1)]).ok()? / size_of::<T>();
        let samples = self.0.data[i]?.cast::<T>();
        // SAFETY: rav1d allocates each plane as at least `rows` rows of `stride`, aligned for its
        // samples, and keeps it until the picture is unreffed.
        let plane = unsafe { slice::from_raw_parts(samples.as_ptr(), stride * rows) };
        Some((plane, stride as u32))
    }

    fn planar<T: Copy + Debug>(&self) -> Option<YuvPlanarImage<'_, T>> {
        let (y_plane, y_stride) = self.plane(0)?;
        let (u_plane, u_stride) = self.plane(1)?;
        let (v_plane, v_stride) = self.plane(2)?;
        Some(YuvPlanarImage {
            y_plane,
            y_stride,
            u_plane,
            u_stride,
            v_plane,
            v_stride,
            width: self.width() as u32,
            height: self.height() as u32,
        })
    }

    fn gray<T: Copy + Debug>(&self) -> Option<YuvGrayImage<'_, T>> {
        let (y_plane, y_stride) = self.plane(0)?;
        Some(YuvGrayImage {
            y_plane,
            y_stride,
            width: self.width() as u32,
            height: self.height() as u32,
        })
    }

    /// Converts a picture and its `alpha` to RGBA8 at the front of `rgba`, a deeper one only from YUV.
    fn to_rgba8(
        &self,
        alpha: Option<&Self>,
        premultiplied: bool,
        rgba: &mut [u8],
        range: YuvRange,
        matrix: Option<YuvStandardMatrix>,
    ) -> Option<()> {
        let stride = self.width() as u32 * 4;
        if self.bpc() > 8 {
            let convert = match (self.layout(), self.bpc() == 10) {
                (DAV1D_PIXEL_LAYOUT_I420, true) => yuv::i010_to_rgba,
                (DAV1D_PIXEL_LAYOUT_I420, false) => yuv::i012_to_rgba,
                (DAV1D_PIXEL_LAYOUT_I422, true) => yuv::i210_to_rgba,
                (DAV1D_PIXEL_LAYOUT_I422, false) => yuv::i212_to_rgba,
                (DAV1D_PIXEL_LAYOUT_I444, true) => yuv::i410_to_rgba,
                (DAV1D_PIXEL_LAYOUT_I444, false) => yuv::i412_to_rgba,
                _ => return None,
            };
            convert(&self.planar()?, rgba, stride, range, matrix?).ok()?;
        } else {
            match (self.layout(), matrix) {
                (DAV1D_PIXEL_LAYOUT_I400, Some(matrix)) => {
                    yuv::yuv400_to_rgba(&self.gray()?, rgba, stride, range, matrix)
                }
                (DAV1D_PIXEL_LAYOUT_I420, Some(matrix)) => {
                    yuv::yuv420_to_rgba(&self.planar()?, rgba, stride, range, matrix)
                }
                (DAV1D_PIXEL_LAYOUT_I422, Some(matrix)) => {
                    yuv::yuv422_to_rgba(&self.planar()?, rgba, stride, range, matrix)
                }
                (DAV1D_PIXEL_LAYOUT_I444, Some(matrix)) => {
                    yuv::yuv444_to_rgba(&self.planar()?, rgba, stride, range, matrix)
                }
                (DAV1D_PIXEL_LAYOUT_I444, None) => {
                    yuv::gbr_to_rgba(&self.planar()?, rgba, stride, range)
                }
                _ => return None,
            }
            .ok()?;
        }

        match alpha {
            Some(alpha) => alpha.put_alpha(rgba.as_chunks_mut().0, premultiplied),
            None => Some(()),
        }
    }

    /// Converts a picture and its `alpha` to 12-bit RGBA, which takes all of `rgba`.
    fn to_rgba12(
        &self,
        alpha: Option<&Self>,
        premultiplied: bool,
        rgba: &mut [u8],
        range: YuvRange,
        matrix: Option<YuvStandardMatrix>,
    ) -> Option<()> {
        if self.bpc() == 8 {
            self.to_rgba8(None, false, rgba, range, matrix)?;
            // Widening from the back only overwrites bytes already read.
            for i in (0..rgba.len() / 2).rev() {
                let v = u16::from(rgba[i]);
                [rgba[2 * i], rgba[2 * i + 1]] = (v << 4 | v >> 4).to_ne_bytes();
            }
        }

        // SAFETY: any two bytes are a valid u16.
        let ([], rgba, []) = (unsafe { rgba.align_to_mut::<u16>() }) else {
            return None;
        };

        if self.bpc() > 8 {
            let stride = self.width() as u32 * 4;
            let ten = self.bpc() == 10;
            match (self.layout(), matrix) {
                (DAV1D_PIXEL_LAYOUT_I400, Some(matrix)) => {
                    let convert = if ten {
                        yuv::y010_to_rgba10
                    } else {
                        yuv::y012_to_rgba12
                    };
                    convert(&self.gray()?, rgba, stride, range, matrix)
                }
                (layout, Some(matrix)) => {
                    let convert = match (layout, ten) {
                        (DAV1D_PIXEL_LAYOUT_I420, true) => yuv::i010_to_rgba10,
                        (DAV1D_PIXEL_LAYOUT_I420, false) => yuv::i012_to_rgba12,
                        (DAV1D_PIXEL_LAYOUT_I422, true) => yuv::i210_to_rgba10,
                        (DAV1D_PIXEL_LAYOUT_I422, false) => yuv::i212_to_rgba12,
                        (_, true) => yuv::i410_to_rgba10,
                        (_, false) => yuv::i412_to_rgba12,
                    };
                    convert(&self.planar()?, rgba, stride, range, matrix)
                }
                (DAV1D_PIXEL_LAYOUT_I444, None) => {
                    let convert = if ten {
                        yuv::gb10_to_rgba10
                    } else {
                        yuv::gb12_to_rgba12
                    };
                    convert(&self.planar()?, rgba, stride, range)
                }
                _ => return None,
            }
            .ok()?;

            if ten {
                for sample in &mut *rgba {
                    *sample = *sample << 2 | *sample >> 8;
                }
            }
        }

        match alpha {
            Some(alpha) => alpha.put_alpha(rgba.as_chunks_mut().0, premultiplied),
            None => Some(()),
        }
    }

    /// Writes this monochrome picture into the alpha of `rgba`, at the depth of its samples, and
    /// divides it out of color that was `premultiplied`, as the steps after expect straight color.
    fn put_alpha<T: Sample + Into<u32> + TryFrom<u32>>(
        &self,
        rgba: &mut [[T; 4]],
        premultiplied: bool,
    ) -> Option<()> {
        if self.bpc() == 8 {
            self.put_alpha_from::<u8, T>(rgba, premultiplied)
        } else {
            self.put_alpha_from::<u16, T>(rgba, premultiplied)
        }
    }

    fn put_alpha_from<S: Copy + Into<u32>, T: Sample + Into<u32> + TryFrom<u32>>(
        &self,
        rgba: &mut [[T; 4]],
        premultiplied: bool,
    ) -> Option<()> {
        // 16-bit pixels here hold 12-bit samples.
        let max = if size_of::<T>() == 1 { 255 } else { 4095 };
        let depth = self.bpc() as u32;
        let (low, span) = if self.sequence_header()?.color_range == 0 {
            (16 << (depth - 8), 219 << (depth - 8))
        } else {
            (0, (1 << depth) - 1)
        };

        let (plane, stride) = self.plane::<S>(0)?;
        let w = self.width();
        for (row, px) in plane.chunks(stride as usize).zip(rgba.chunks_exact_mut(w)) {
            for (&a, px) in row.iter().zip(px) {
                let a = (a.into().saturating_sub(low).min(span) * max + span / 2) / span;
                px[3] = T::try_from(a).ok()?;
                if premultiplied {
                    for c in &mut px[..3] {
                        let straight = ((*c).into() * max + a / 2).checked_div(a).unwrap_or(0);
                        *c = T::try_from(straight.min(max)).ok()?;
                    }
                }
            }
        }
        Some(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn turns_counterclockwise_then_mirrors() {
        use ImageMirror::{LeftRight, TopBottom};
        use ImageRotation::{D0, D90, D180, D270};
        // 1 2
        // 3 4
        let square = || {
            let mut square = Pixels::<u8>::zeroed(2, 2, 4).unwrap();
            for (i, px) in square.pixels_mut().iter_mut().enumerate() {
                px[0] = i as u8 + 1;
            }
            square
        };
        for (rotation, mirror, expected) in [
            (D0, None, [1, 2, 3, 4]),
            (D0, Some(LeftRight), [2, 1, 4, 3]),
            (D0, Some(TopBottom), [3, 4, 1, 2]),
            (D90, None, [2, 4, 1, 3]),
            (D90, Some(LeftRight), [4, 2, 3, 1]),
            (D90, Some(TopBottom), [1, 3, 2, 4]),
            (D180, None, [4, 3, 2, 1]),
            (D180, Some(LeftRight), [3, 4, 1, 2]),
            (D180, Some(TopBottom), [2, 1, 4, 3]),
            (D270, None, [3, 1, 4, 2]),
            (D270, Some(LeftRight), [1, 3, 2, 4]),
            (D270, Some(TopBottom), [4, 2, 3, 1]),
        ] {
            let orientation = exif_orientation(rotation, mirror.as_ref());
            let out = finish(square(), false, None, orientation, &AtomicBool::new(false)).unwrap();
            let firsts: Vec<_> = out.pixels().iter().map(|px| px[0]).collect();
            assert_eq!(firsts, expected);
        }
    }
}
