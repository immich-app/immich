use std::mem::MaybeUninit;
use std::ops::Range;
use std::ptr::NonNull;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock};

use jxl::api::{
    JxlColorEncoding, JxlColorProfile, JxlPrimaries, JxlTransferFunction, JxlWhitePoint,
    RenderingIntent,
};
use moxcms::{ColorProfile, Layout, MatrixCoefficients, Transform16BitExecutor};
use mp4parse::{ImageMirror, ImageRotation, ParseStrictness};
use quick_cache::sync::Cache;
use rav1d::include::dav1d::headers::{DAV1D_ADAPTIVE, DAV1D_ON, Dav1dSequenceHeader};
use rav1d::{
    Decoder, PixelLayout, PlanarImageComponent, Settings, dav1d_parse_sequence_header, pixel,
};
use yuv::{YuvGrayImage, YuvPlanarImage, YuvRange, YuvStandardMatrix};

use crate::Options;
use crate::color::{
    self, BAND, CicpColorPrimaries, CicpProfile, TRANSFORMS, Target, TransferCharacteristics,
    Transforms,
};
use crate::image::{self, Image, Pixels, Sample, Samples};
use crate::jxl::srgb_transform;
use crate::resize;
use crate::rotate::Orientation;

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
    let avif = Avif::decode(data, cancelled)?;
    let (cicp, has_alpha, orientation) = (avif.cicp, avif.alpha.is_some(), avif.orientation);
    // The image turns after resizing, so a quarter turn swaps the target's sides first.
    let target_size = options
        .target_size
        .map(|(tw, th)| orientation.dimensions(tw, th));
    let size = resize::cover(
        (avif.color.width(), avif.color.height()),
        target_size,
        options.max_pixel_size,
    );
    // An ICC profile describes the samples instead.
    let hdr = avif.icc.is_none() && color::is_hdr(cicp);
    let keep_space = options.color_space == Target::Source && describable(cicp);

    // Converting consumes the pictures, which frees them before resizing and turning allocate more.
    if hdr && keep_space {
        let rgba = avif.into_rgba16(cancelled)?;
        return Some(Image {
            cicp,
            samples: Samples::U16(rgba.resize(has_alpha, size)?.rotate(orientation)?),
        });
    }

    let transform = match &avif.icc {
        Some(icc) => Some(Arc::clone(icc)),
        None if color::is_srgb(cicp) || keep_space => None,
        None => Some(cicp_transform(cicp)?),
    };
    let rgba = avif.into_rgba8(transform.as_deref(), cancelled)?;
    Some(Image {
        cicp: if transform.is_some() {
            color::SRGB
        } else {
            cicp
        },
        samples: Samples::U8(rgba.resize(has_alpha, size)?.rotate(orientation)?),
    })
}

/// An AVIF image whose pictures have been decoded.
struct Avif {
    color: Picture,
    alpha: Option<Picture>,
    cicp: CicpProfile,
    /// The transform to sRGB of the ICC profile, if any.
    icc: Option<Arc<Transform16BitExecutor>>,
    range: YuvRange,
    matrix: Option<YuvStandardMatrix>,
    premultiplied: bool,
    orientation: Orientation,
}

impl Avif {
    /// Decodes the primary item's pictures unless cancelled. Returning frees the container, which
    /// holds a copy of the file.
    fn decode(data: &[u8], cancelled: &AtomicBool) -> Option<Self> {
        let container = mp4parse::read_avif(&mut &*data, ParseStrictness::Normal).ok()?;

        let color = Picture::decode(container.primary_item_coded_data()?)?;
        let alpha = match container.alpha_item_coded_data() {
            Some(data) => Some(Picture::decode(data)?),
            None => None,
        };

        if cancelled.load(Ordering::Relaxed)
            || alpha.as_ref().is_some_and(|alpha| {
                (alpha.width(), alpha.height()) != (color.width(), color.height())
            })
        {
            return None;
        }

        // A colr box overrides the color description in the AV1 data (MIAF 7.3.6.4).
        let (pri, trc, mtrx, full_range) = match container.nclx_colour_information_ptr() {
            Some(nclx) => {
                // SAFETY: the pointer points into `container`, which outlives this borrow.
                let nclx = unsafe { &*nclx.ok()? };
                (
                    nclx.colour_primaries,
                    nclx.transfer_characteristics,
                    nclx.matrix_coefficients,
                    nclx.full_range_flag,
                )
            }
            // rav1d's enums count by these codes, but fold SMPTE 170M primaries, xvYCC and BT.1361
            // into BT.470BG, sRGB and BT.709.
            None => (
                color.0.color_primaries() as u8,
                color.0.transfer_characteristic() as u8,
                color.0.matrix_coefficients() as u8,
                color.0.color_range() == pixel::YUVRange::Full,
            ),
        };

        let cicp = CicpProfile {
            // Unspecified primaries and transfer are taken as sRGB.
            color_primaries: match CicpColorPrimaries::try_from(pri).ok()? {
                CicpColorPrimaries::Unspecified => CicpColorPrimaries::Bt709,
                pri => pri,
            },
            transfer_characteristics: match TransferCharacteristics::try_from(trc).ok()? {
                TransferCharacteristics::Unspecified => TransferCharacteristics::Srgb,
                trc => trc,
            },
            matrix_coefficients: MatrixCoefficients::Identity,
            full_range: true,
        };

        let range = if full_range {
            YuvRange::Full
        } else {
            YuvRange::Limited
        };
        let matrix = matrix(mtrx)?;

        let rotation = container.image_rotation().ok()?;
        // SAFETY: the pointer is null or points into `container`, which outlives this borrow.
        let mirror = unsafe { container.image_mirror_ptr().ok()?.as_ref() };
        let icc = match container.icc_colour_information().transpose().ok()? {
            Some(icc) => match color::icc_to_srgb(icc)? {
                (transform, Layout::Rgba) => Some(transform),
                _ => return None,
            },
            None => None,
        };
        Some(Self {
            color,
            alpha,
            cicp,
            icc,
            range,
            matrix,
            premultiplied: container.premultiplied_alpha,
            orientation: exif_orientation(rotation, mirror),
        })
    }

    /// Converts the pictures to premultiplied RGBA16 in their own space, unless cancelled.
    fn into_rgba16(self, cancelled: &AtomicBool) -> Option<Pixels<u16>> {
        let Self {
            color,
            alpha,
            range,
            matrix,
            premultiplied,
            ..
        } = self;
        let (w, h, has_alpha) = (color.width(), color.height(), alpha.is_some());
        let mut rgba = Pixels::<u16>::zeroed(w, h, 8)?;
        // Only 8-bit pictures go through RGBA8.
        let staged = if color.bpc() == 8 { BAND.min(h) } else { 0 };
        let mut rgba8 = vec![0; w * 4 * staged];
        for (i, band) in rgba.pixels_mut().chunks_mut(w * BAND).enumerate() {
            let rows = i * BAND..i * BAND + band.len() / w;
            color.to_rgba12(&rows, &mut rgba8, band.as_flattened_mut(), range, matrix)?;
            if let Some(alpha) = &alpha {
                // With no transform between, dividing color out and multiplying it back in only
                // clamps it to alpha.
                alpha.put_alpha(band, false, &rows)?;
            }
            // 16 bits in the image's own transfer, like the jxl decoder's HDR output.
            for sample in band.as_flattened_mut() {
                *sample = *sample << 4 | *sample >> 8;
            }
            if has_alpha && premultiplied {
                image::clamp(band);
            } else if has_alpha {
                image::premultiply(band);
            }
        }
        // Resizing costs ~10% of a thumbnail decode, wasted on tiles that scrolled away meanwhile.
        (!cancelled.load(Ordering::Relaxed)).then_some(rgba)
    }

    /// Converts the pictures to premultiplied RGBA8 through `transform`, or else in their own
    /// space, unless cancelled.
    fn into_rgba8(
        self,
        transform: Option<&Transform16BitExecutor>,
        cancelled: &AtomicBool,
    ) -> Option<Pixels<u8>> {
        let Self {
            color,
            alpha,
            range,
            matrix,
            premultiplied,
            ..
        } = self;
        let (w, h, has_alpha) = (color.width(), color.height(), alpha.is_some());
        // yuv narrows deeper YUV samples to 8 bits itself, but not deeper gray or RGB ones.
        let direct = transform.is_none()
            && (color.bpc() == 8 || matrix.is_some() && color.layout() != PixelLayout::I400);

        let mut rgba = Pixels::<u8>::zeroed(w, h, 4)?;
        if direct {
            color.to_rgba8(&(0..h), rgba.bytes_mut(), range, matrix)?;
            if let Some(alpha) = &alpha {
                // Dividing 8-bit color out and multiplying it back in only clamps it to alpha.
                alpha.put_alpha(rgba.pixels_mut(), false, &(0..h))?;
                if premultiplied {
                    image::clamp(rgba.pixels_mut());
                } else {
                    image::premultiply(rgba.pixels_mut());
                }
            }
        } else {
            // The transform, and narrowing deeper gray or RGB samples, read 12-bit ones, which take
            // a band of rows at a time.
            let mut wide = vec![[0; 4]; w * BAND.min(h)];
            let mut converted = vec![0; w * 4 * BAND.min(h)];
            for (i, band) in rgba.pixels_mut().chunks_mut(w * BAND).enumerate() {
                if cancelled.load(Ordering::Relaxed) {
                    return None;
                }
                let rows = i * BAND..i * BAND + band.len() / w;
                let wide = &mut wide[..band.len()];
                let bytes = band.as_flattened_mut();
                color.to_rgba12(&rows, bytes, wide.as_flattened_mut(), range, matrix)?;
                if let Some(alpha) = &alpha {
                    // Only the transform needs color divided out of premultiplied alpha.
                    alpha.put_alpha(wide, premultiplied && transform.is_some(), &rows)?;
                }
                match transform {
                    Some(transform) => {
                        transform
                            .transform(wide.as_flattened(), &mut converted[..bytes.len()])
                            .ok()?;
                        color::narrow(&converted, bytes);
                    }
                    None => color::narrow(wide.as_flattened(), bytes),
                }
                if has_alpha && premultiplied && transform.is_none() {
                    image::clamp(band);
                } else if has_alpha {
                    image::premultiply(band);
                }
            }
        }
        // Resizing costs ~10% of a thumbnail decode, wasted on tiles that scrolled away meanwhile.
        (!cancelled.load(Ordering::Relaxed)).then_some(rgba)
    }
}

/// Whether the samples can stay in this space for [`Target::Source`].
fn describable(cicp: CicpProfile) -> bool {
    matches!(
        cicp.color_primaries,
        CicpColorPrimaries::Bt709 | CicpColorPrimaries::Smpte432 | CicpColorPrimaries::Bt2020
    ) && (cicp.transfer_characteristics == TransferCharacteristics::Srgb || color::is_hdr(cicp))
}

/// The matrix for YUV samples, or None for RGB ones.
fn matrix(mtrx: u8) -> Option<Option<YuvStandardMatrix>> {
    Some(match MatrixCoefficients::try_from(mtrx).ok()? {
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
    })
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

/// The number of tiles in the first frame of AV1 `data`, if it's a key or intra-only frame.
fn tiles(mut data: &[u8]) -> Option<u32> {
    let mut sequence = None;
    // An OBU leads with its type and flags, then the temporal and spatial layer of its frame, as
    // the bits an operating_point_idc sets, and its size (AV1 5.3).
    while let [header, rest @ ..] = data {
        let (layer, rest) = match (header & 4, rest) {
            (0, rest) => (0x101, rest),
            (_, [ids, rest @ ..]) => (1 << (ids >> 5) | 1 << ((ids >> 3 & 3) + 8), rest),
            _ => return None,
        };
        let (payload, next) = if header & 2 == 0 {
            (rest, &[][..])
        } else {
            let (leb128, rest) = rest.split_at(rest.iter().take(8).position(|&b| b < 128)? + 1);
            let size = leb128.iter().rfold(0, |n, b| n << 7 | usize::from(b & 127));
            rest.split_at_checked(size)?
        };
        match header >> 3 & 15 {
            1 => sequence = Some(&data[..data.len() - next.len()]),
            3 | 6 => return frame_tiles(&sequence_header(sequence?)?, payload, layer),
            _ => {}
        }
        data = next;
    }
    None
}

/// rav1d's reading of the sequence header OBU `obu`, or None where its decoder fails too.
fn sequence_header(obu: &[u8]) -> Option<Dav1dSequenceHeader> {
    let mut sequence = MaybeUninit::uninit();
    // SAFETY: rav1d reads the `obu.len()` bytes of `obu`, and writes a whole header to `sequence`
    // when it returns 0. A panic in it aborts, as it can't unwind out of extern "C". The one it's
    // known for, in builds with overflow checks, is on an OBU cut off before its payload, which
    // tiles() never passes.
    unsafe {
        let parsed = dav1d_parse_sequence_header(
            NonNull::new(sequence.as_mut_ptr()),
            Some(NonNull::from(obu).cast()),
            obu.len(),
        );
        (parsed.0 == 0).then(|| sequence.assume_init())
    }
}

/// The number of tiles in `frame`, the payload of a frame header OBU from `layer`, after
/// `sequence`, read up to tile_info (AV1 5.9).
fn frame_tiles(sequence: &Dav1dSequenceHeader, frame: &[u8], layer: u16) -> Option<u32> {
    let reduced = sequence.reduced_still_picture_header != 0;
    // Frames give a buffer_removal_time for each operating point with a decoder model that decodes
    // their layer, and shown ones, under a decoder model, a presentation time unless pictures are
    // evenly spaced. rav1d zeroes the lengths of fields the sequence header leaves out.
    let removals = sequence.operating_points[..usize::from(sequence.num_operating_points)]
        .iter()
        .filter(|op| {
            op.decoder_model_param_present != 0 && (op.idc == 0 || op.idc & layer == layer)
        })
        .count();
    let presentation_bits = if sequence.equal_picture_interval != 0 {
        0
    } else {
        usize::from(sequence.frame_presentation_delay_length)
    };
    let order_hint_bits = usize::from(sequence.order_hint_n_bits);
    let sb = if sequence.sb128 != 0 { 128 } else { 64 };

    let mut b = Bits(frame, 0);
    let (key_shown, error_resilient) = if reduced {
        (true, true)
    } else {
        // Stills are key or intra-only frames, not shown again.
        let (false, frame_type @ (0 | 2)) = (b.bit()?, b.f(2)?) else {
            return None;
        };
        let show = b.bit()?;
        b.skip(if show { presentation_bits } else { 1 });
        let key_shown = frame_type == 0 && show;
        (key_shown, key_shown || b.bit()?)
    };
    let disable_cdf_update = b.bit()?;
    // Adaptive leaves screen content tools to each frame.
    let screen_content = match sequence.screen_content_tools {
        DAV1D_ADAPTIVE => b.bit()?,
        tools => tools == DAV1D_ON,
    };
    if screen_content && sequence.force_integer_mv == DAV1D_ADAPTIVE {
        b.skip(1);
    }
    b.skip(sequence.frame_id_n_bits.into());
    let size_override = !reduced && b.bit()?;
    b.skip(order_hint_bits);
    if sequence.decoder_model_info_present != 0 && b.bit()? {
        b.skip(removals * usize::from(sequence.buffer_removal_delay_length));
    }
    if !key_shown && b.f(8)? != 0xff && error_resilient {
        b.skip(8 * order_hint_bits);
    }
    let (width, height) = if size_override {
        (
            b.f(sequence.width_n_bits.into())? + 1,
            b.f(sequence.height_n_bits.into())? + 1,
        )
    } else {
        (sequence.max_width as u32, sequence.max_height as u32)
    };
    let denominator = if sequence.super_res != 0 && b.bit()? {
        b.f(3)? + 9
    } else {
        8
    };
    if b.bit()? {
        b.skip(32);
    }
    if screen_content && denominator == 8 {
        b.skip(1);
    }
    if !reduced && !disable_cdf_update {
        b.skip(1);
    }

    // Tiles split the superblocks of the width superres downscales to.
    let cols = ((width * 8 + denominator / 2) / denominator).div_ceil(sb);
    let rows = height.div_ceil(sb);
    let tile_log2 =
        |size: u32, target: u32| target.div_ceil(size).next_power_of_two().trailing_zeros();
    let max_width = 4096 / sb;
    let min_cols_log2 = tile_log2(max_width, cols);
    let min_log2 = min_cols_log2.max(tile_log2(4096 * 2304 / (sb * sb), cols * rows));
    let (tile_cols, tile_rows) = if b.bit()? {
        let mut cols_log2 = min_cols_log2;
        while cols_log2 < tile_log2(1, cols.min(64)) && b.bit()? {
            cols_log2 += 1;
        }
        let mut rows_log2 = min_log2.saturating_sub(cols_log2);
        while rows_log2 < tile_log2(1, rows.min(64)) && b.bit()? {
            rows_log2 += 1;
        }
        let tiles = |sbs: u32, log2: u32| sbs.div_ceil(sbs.div_ceil(1 << log2));
        (tiles(cols, cols_log2), tiles(rows, rows_log2))
    } else {
        let (tile_cols, widest) = b.tile_sizes(cols, max_width)?;
        let area = if min_log2 > 0 {
            (cols * rows) >> (min_log2 + 1)
        } else {
            cols * rows
        };
        (tile_cols, b.tile_sizes(rows, (area / widest).max(1))?.0)
    };
    Some(tile_cols * tile_rows)
}

/// The big-endian bit fields of AV1 headers, from a bit position.
struct Bits<'a>(&'a [u8], usize);

impl Bits<'_> {
    /// The next `n` bits, or None past the end.
    fn f(&mut self, n: u32) -> Option<u32> {
        (0..n).try_fold(0, |value, _| {
            let bit = self.0.get(self.1 / 8)? >> (7 - self.1 % 8) & 1;
            self.1 += 1;
            Some(value << 1 | u32::from(bit))
        })
    }

    fn bit(&mut self) -> Option<bool> {
        Some(self.f(1)? == 1)
    }

    /// Skips `n` bits, leaving reads past the end to fail.
    fn skip(&mut self, n: usize) {
        self.1 += n;
    }

    /// A value below `n` in the fewest bits that tell them apart.
    fn ns(&mut self, n: u32) -> Option<u32> {
        let w = n.ilog2() + 1;
        let m = (1 << w) - n;
        let v = self.f(w - 1)?;
        Some(if v < m { v } else { (v << 1) - m + self.f(1)? })
    }

    /// The number and the largest of the tiles of up to `max` superblocks that split `sbs`.
    fn tile_sizes(&mut self, sbs: u32, max: u32) -> Option<(u32, u32)> {
        let (mut start, mut count, mut largest) = (0, 0, 0);
        while start < sbs {
            let size = self.ns(max.min(sbs - start))? + 1;
            (start, count, largest) = (start + size, count + 1, largest.max(size));
        }
        Some((count, largest))
    }
}

struct Picture(rav1d::Picture);

impl Picture {
    fn decode(item: &[u8]) -> Option<Self> {
        // rav1d takes empty data for a caller bug and aborts debug builds on it.
        if item.is_empty() {
            return None;
        }
        let mut settings = Settings::new();
        // rav1d's workers decode a frame's tiles side by side, but slow down images of one tile, so
        // only tiled ones get them, four of them as that did best on phones decoding two images at
        // once. They don't catch panics, so one on a worker leaves this thread waiting. A frame
        // delay of 1 keeps one frame context, which has the frame once its data is in.
        let tiled = tiles(item).is_some_and(|n| n > 1);
        settings.set_n_threads(if tiled { 4 } else { 1 });
        settings.set_max_frame_delay(1);
        // A scalable image comes back as its top layer alone, not one picture per layer.
        settings.set_all_layers(false);
        let mut decoder = Decoder::with_settings(&settings).ok()?;
        decoder.send_data(item.into(), None, None, None).ok()?;
        decoder.get_picture().ok().map(Self)
    }

    fn width(&self) -> usize {
        self.0.width() as usize
    }

    fn height(&self) -> usize {
        self.0.height() as usize
    }

    /// The bits per sample, though rav1d documents bit_depth as their storage size.
    fn bpc(&self) -> usize {
        self.0.bit_depth()
    }

    fn layout(&self) -> PixelLayout {
        self.0.pixel_layout()
    }

    /// `rows` of plane `i` as samples of `T`, and its stride in samples.
    fn plane<T: Sample>(&self, i: usize, rows: &Range<usize>) -> Option<(&[T], u32)> {
        // Bands start on even rows, so each has its subsampled chroma rows to itself.
        let (start, end) = if i > 0 && self.layout() == PixelLayout::I420 {
            (rows.start / 2, rows.end.div_ceil(2))
        } else {
            (rows.start, rows.end)
        };
        let component = PlanarImageComponent::try_from(i).ok()?;
        // rav1d documents the stride in pixels, but gives bytes.
        let stride = self.0.stride(component) as usize / size_of::<T>();
        // SAFETY: Sample is u8 or u16, which any bytes are valid as.
        let ([], plane, []) = (unsafe { self.0.plane(component).align_to::<T>() }) else {
            return None;
        };
        // The plane runs on past the picture's rows.
        Some((plane.get(stride * start..stride * end)?, stride as u32))
    }

    fn planar<T: Sample>(&self, rows: &Range<usize>) -> Option<YuvPlanarImage<'_, T>> {
        let (y_plane, y_stride) = self.plane(0, rows)?;
        let (u_plane, u_stride) = self.plane(1, rows)?;
        let (v_plane, v_stride) = self.plane(2, rows)?;
        Some(YuvPlanarImage {
            y_plane,
            y_stride,
            u_plane,
            u_stride,
            v_plane,
            v_stride,
            width: self.width() as u32,
            height: rows.len() as u32,
        })
    }

    fn gray<T: Sample>(&self, rows: &Range<usize>) -> Option<YuvGrayImage<'_, T>> {
        let (y_plane, y_stride) = self.plane(0, rows)?;
        Some(YuvGrayImage {
            y_plane,
            y_stride,
            width: self.width() as u32,
            height: rows.len() as u32,
        })
    }

    /// Converts `rows` of a picture to RGBA8 in `rgba`, a deeper one only from YUV.
    fn to_rgba8(
        &self,
        rows: &Range<usize>,
        rgba: &mut [u8],
        range: YuvRange,
        matrix: Option<YuvStandardMatrix>,
    ) -> Option<()> {
        let stride = self.width() as u32 * 4;
        if self.bpc() > 8 {
            let convert = match (self.layout(), self.bpc() == 10) {
                (PixelLayout::I420, true) => yuv::i010_to_rgba,
                (PixelLayout::I420, false) => yuv::i012_to_rgba,
                (PixelLayout::I422, true) => yuv::i210_to_rgba,
                (PixelLayout::I422, false) => yuv::i212_to_rgba,
                (PixelLayout::I444, true) => yuv::i410_to_rgba,
                (PixelLayout::I444, false) => yuv::i412_to_rgba,
                _ => return None,
            };
            convert(&self.planar(rows)?, rgba, stride, range, matrix?).ok()?;
        } else {
            match (self.layout(), matrix) {
                (PixelLayout::I400, Some(matrix)) => {
                    yuv::yuv400_to_rgba(&self.gray(rows)?, rgba, stride, range, matrix)
                }
                (PixelLayout::I420, Some(matrix)) => {
                    yuv::yuv420_to_rgba(&self.planar(rows)?, rgba, stride, range, matrix)
                }
                (PixelLayout::I422, Some(matrix)) => {
                    yuv::yuv422_to_rgba(&self.planar(rows)?, rgba, stride, range, matrix)
                }
                (PixelLayout::I444, Some(matrix)) => {
                    yuv::yuv444_to_rgba(&self.planar(rows)?, rgba, stride, range, matrix)
                }
                (PixelLayout::I444, None) => {
                    yuv::gbr_to_rgba(&self.planar(rows)?, rgba, stride, range)
                }
                _ => return None,
            }
            .ok()?;
        }
        Some(())
    }

    /// Converts `rows` of a picture to 12-bit RGBA in `wide`, an 8-bit one through RGBA8 in `rgba`.
    fn to_rgba12(
        &self,
        rows: &Range<usize>,
        rgba: &mut [u8],
        wide: &mut [u16],
        range: YuvRange,
        matrix: Option<YuvStandardMatrix>,
    ) -> Option<()> {
        if self.bpc() == 8 {
            self.to_rgba8(rows, rgba, range, matrix)?;
            for (wide, &v) in wide.iter_mut().zip(&*rgba) {
                let v = u16::from(v);
                *wide = v << 4 | v >> 4;
            }
        } else {
            let stride = self.width() as u32 * 4;
            let ten = self.bpc() == 10;
            match (self.layout(), matrix) {
                (PixelLayout::I400, Some(matrix)) => {
                    let convert = if ten {
                        yuv::y010_to_rgba10
                    } else {
                        yuv::y012_to_rgba12
                    };
                    convert(&self.gray(rows)?, wide, stride, range, matrix)
                }
                (layout, Some(matrix)) => {
                    let convert = match (layout, ten) {
                        (PixelLayout::I420, true) => yuv::i010_to_rgba10,
                        (PixelLayout::I420, false) => yuv::i012_to_rgba12,
                        (PixelLayout::I422, true) => yuv::i210_to_rgba10,
                        (PixelLayout::I422, false) => yuv::i212_to_rgba12,
                        (_, true) => yuv::i410_to_rgba10,
                        (_, false) => yuv::i412_to_rgba12,
                    };
                    convert(&self.planar(rows)?, wide, stride, range, matrix)
                }
                (PixelLayout::I444, None) => {
                    let convert = if ten {
                        yuv::gb10_to_rgba10
                    } else {
                        yuv::gb12_to_rgba12
                    };
                    convert(&self.planar(rows)?, wide, stride, range)
                }
                _ => return None,
            }
            .ok()?;

            if ten {
                for sample in wide {
                    *sample = *sample << 2 | *sample >> 8;
                }
            }
        }
        Some(())
    }

    /// Writes `rows` of this monochrome picture into the alpha of `rgba`, at the depth of its
    /// samples, and divides it out of color that was `premultiplied`, as the steps after expect
    /// straight color.
    fn put_alpha<T: Sample + Into<u32> + TryFrom<u32>>(
        &self,
        rgba: &mut [[T; 4]],
        premultiplied: bool,
        rows: &Range<usize>,
    ) -> Option<()> {
        if self.bpc() == 8 {
            self.put_alpha_from::<u8, T>(rgba, premultiplied, rows)
        } else {
            self.put_alpha_from::<u16, T>(rgba, premultiplied, rows)
        }
    }

    fn put_alpha_from<S: Sample + Into<u32>, T: Sample + Into<u32> + TryFrom<u32>>(
        &self,
        rgba: &mut [[T; 4]],
        premultiplied: bool,
        rows: &Range<usize>,
    ) -> Option<()> {
        // 16-bit pixels here hold 12-bit samples.
        let max = if size_of::<T>() == 1 { 255 } else { 4095 };
        let depth = self.bpc() as u32;
        let (low, span) = if self.0.color_range() == pixel::YUVRange::Limited {
            (16 << (depth - 8), 219 << (depth - 8))
        } else {
            (0, (1 << depth) - 1)
        };
        // Dividing once per value instead of per pixel, as rav1d keeps samples within their depth.
        let mut table = [T::default(); 4096];
        for (a, t) in (0..).zip(&mut table[..1 << depth]) {
            let a = (u32::saturating_sub(a, low).min(span) * max + span / 2) / span;
            *t = T::try_from(a).ok()?;
        }

        let (plane, stride) = self.plane::<S>(0, rows)?;
        let w = self.width();
        for (row, px) in plane.chunks(stride as usize).zip(rgba.chunks_exact_mut(w)) {
            for (&a, px) in row.iter().zip(px) {
                // Samples are already below 4096, but the remainder drops the bounds check.
                px[3] = table[a.into() as usize % 4096];
                if premultiplied {
                    let a = px[3].into();
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
            let out = square().rotate(orientation).unwrap();
            let firsts: Vec<_> = out.pixels().iter().map(|px| px[0]).collect();
            assert_eq!(firsts, expected);
        }
    }
}
