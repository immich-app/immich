use lightcraft_color::{D65, Mat3, SRGB, Xy, cct::xy_to_temp_tint};
use lightcraft_engine::pipeline::SourceInfo;
use lightcraft_geom::Orientation;
use lightcraft_raster::Rgb32f;
use std::ffi::{CStr, CString, c_char, c_void};
use std::os::unix::ffi::OsStrExt;
use std::path::Path;

#[repr(C)]
#[derive(Default)]
struct RawImage {
    owner: *mut c_void,
    data: *const u8,
    data_len: u32,
    width: u32,
    height: u32,
    channels: u32,
    orientation: u32,
    camera_wb: [f64; 3],
    daylight_wb: [f64; 3],
    camera_to_srgb: [f64; 9],
}

unsafe extern "C" {
    fn immich_libraw_version() -> *const c_char;
    fn immich_raw_decode(
        path: *const c_char,
        out: *mut RawImage,
        error: *mut c_char,
        len: u32,
    ) -> i32;
    fn immich_raw_free(image: *mut c_void);
    fn immich_raw_metadata(
        path: *const c_char,
        out: *mut RawImage,
        error: *mut c_char,
        len: u32,
    ) -> i32;
}

impl Drop for RawImage {
    fn drop(&mut self) {
        if !self.owner.is_null() {
            // SAFETY: owner was allocated by the shim and is released exactly once.
            unsafe { immich_raw_free(self.owner) };
        }
    }
}

pub struct Source {
    pub pixels: Rgb32f,
    pub info: SourceInfo,
    pub orientation: Orientation,
}

pub fn libraw_version() -> String {
    // SAFETY: LibRaw returns a static, nul-terminated version string.
    unsafe { CStr::from_ptr(immich_libraw_version()) }
        .to_string_lossy()
        .into_owned()
}

fn as_shot(raw: &RawImage) -> Option<(f64, f64)> {
    // The ratio converts an as-shot-neutral sensor sample into the daylight
    // balanced camera basis used by LibRaw's public camera-to-sRGB matrix.
    let mut neutral = [0.0; 3];
    for (i, n) in neutral.iter_mut().enumerate() {
        if raw.camera_wb[i] <= 0.0 || raw.daylight_wb[i] <= 0.0 {
            return None;
        }
        *n = raw.daylight_wb[i] / raw.camera_wb[i];
    }
    let m = &raw.camera_to_srgb;
    let rgb = Mat3([[m[0], m[1], m[2]], [m[3], m[4], m[5]], [m[6], m[7], m[8]]]).apply(neutral);
    let xyz = SRGB.to_xyz().apply(rgb);
    if !xyz.iter().all(|v| v.is_finite()) || xyz.iter().sum::<f64>() <= 0.0 {
        return None;
    }
    let xy = Xy::from_xyz(xyz);
    if !(0.1..0.7).contains(&xy.x) || !(0.1..0.7).contains(&xy.y) {
        return None;
    }
    let (temp, tint) = xy_to_temp_tint(xy);
    (temp.is_finite() && tint.is_finite()).then_some((temp, tint))
}

fn header_as_shot(path: &Path) -> Option<(f64, f64)> {
    let path = CString::new(path.as_os_str().as_bytes()).ok()?;
    let mut raw = RawImage::default();
    let mut error = [0 as c_char; 1024];
    // SAFETY: all buffers remain live for the call; the shim bounds and terminates error writes.
    let status = unsafe {
        immich_raw_metadata(
            path.as_ptr(),
            &mut raw,
            error.as_mut_ptr(),
            error.len() as u32,
        )
    };
    (status == 0).then(|| as_shot(&raw)).flatten()
}

pub fn orientation(path: &Path) -> Result<Orientation, String> {
    let path_c = CString::new(path.as_os_str().as_bytes()).map_err(|_| "Invalid source path")?;
    let mut raw = RawImage::default();
    let mut error = [0 as c_char; 1024];
    // SAFETY: the output and bounded error buffer remain live for this metadata-only call.
    let status = unsafe {
        immich_raw_metadata(
            path_c.as_ptr(),
            &mut raw,
            error.as_mut_ptr(),
            error.len() as u32,
        )
    };
    if status == 0 {
        return Ok(Orientation::from_exif(raw.orientation as u16));
    }
    let bytes = std::fs::read(path).map_err(|e| format!("Read image metadata: {e}"))?;
    let metadata = lightcraft_meta::embedded(&bytes);
    Ok(metadata
        .exif
        .as_deref()
        .map(lightcraft_meta::read_exif)
        .and_then(|m| m.orientation)
        .unwrap_or(Orientation::Normal))
}

pub fn load(path: &Path) -> Result<Source, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("Read image: {e}"))?;
    let enhanced = lightcraft_raw::is_enhanced_dng(&bytes);
    if lightcraft_raw::probe(&bytes).is_some() {
        let info = match lightcraft_raw::probe_info(&bytes) {
            Ok(info) => info,
            Err(error) => {
                if enhanced {
                    return Err(format!("Enhanced DNG header: {error}"));
                }
                eprintln!(
                    "Lightcraft RAW probing unavailable ({error}); developing RAW with LibRaw"
                );
                drop(bytes);
                return load_libraw(path);
            }
        };
        info.width
            .checked_mul(info.height)
            .filter(|&count| count > 0 && count <= 100_000_000)
            .ok_or("RAW source exceeds 100 million pixels or has invalid dimensions")?;
        let native_edge = info.width.max(info.height);
        // Native sensor bounds prevent source binning/downsampling, including
        // wide images with an axis above 16K and tightly cropped XMP edits.
        // The loader preserves upstream camera calibration and tone. Its
        // unsupported-RAW fallback is an embedded JPEG: accept only raw=true.
        let orientation = info.orientation;
        match lightcraft_engine::files::load_vec_builtin_profiles(bytes, native_edge) {
            Ok((pixels, mut info)) if info.raw => {
                // The pure-Rust camera look has already white-balanced the pixels. Replace only
                // its daylight-relative metadata, so As Shot remains pixel-identical while saved
                // absolute Temperature/Tint edits use a physical source white point.
                if info.relative_wb
                    && let Some((temp, tint)) = header_as_shot(path)
                {
                    info.as_shot_temp = temp;
                    info.as_shot_tint = tint;
                    info.relative_wb = false;
                }
                if std::env::var_os("LIGHTCRAFT_PROFILE").is_some() {
                    eprintln!(
                        "[source] Lightcraft {}x{}, calibrated camera tone {}",
                        pixels.width,
                        pixels.height,
                        info.camera_tone.is_some()
                    );
                }
                return Ok(Source {
                    pixels,
                    info,
                    orientation,
                });
            }
            Ok(_) => {
                if enhanced {
                    return Err(
                        "Enhanced DNG sensor decoding unavailable; refusing original-RAW fallback"
                            .into(),
                    );
                }
                eprintln!("Lightcraft sensor decoding unavailable; developing RAW with LibRaw")
            }
            Err(error) => {
                if enhanced {
                    return Err(format!("Enhanced DNG source preparation: {error}"));
                }
                eprintln!("Lightcraft source preparation failed ({error}); trying LibRaw")
            }
        }
    } else {
        drop(bytes);
    }
    load_libraw(path)
}

pub fn load_libraw(path: &Path) -> Result<Source, String> {
    let path_c = CString::new(path.as_os_str().as_bytes()).map_err(|_| "Invalid source path")?;
    let mut raw = RawImage::default();
    let mut error = [0 as c_char; 1024];
    // SAFETY: pointers remain live for the call; the shim bounds writes to error.
    let status = unsafe {
        immich_raw_decode(
            path_c.as_ptr(),
            &mut raw,
            error.as_mut_ptr(),
            error.len() as u32,
        )
    };
    if status < 0 {
        // SAFETY: the C shim terminates the bounded error buffer with a nul.
        return Err(unsafe { CStr::from_ptr(error.as_ptr()) }
            .to_string_lossy()
            .into_owned());
    }
    if status == 0 {
        let count = (raw.width as usize)
            .checked_mul(raw.height as usize)
            .filter(|&n| n > 0 && n <= 100_000_000)
            .ok_or("Invalid RAW dimensions")?;
        let expected = count
            .checked_mul(raw.channels as usize)
            .and_then(|n| n.checked_mul(2));
        if raw.data.is_null() || expected != Some(raw.data_len as usize) {
            return Err("Invalid RAW buffer length".into());
        }
        let as_shot = as_shot(&raw);
        let (temp, tint) = as_shot.unwrap_or_else(|| {
            eprintln!("Source has no usable as-shot white point; using daylight-relative WB");
            xy_to_temp_tint(D65)
        });
        let relative_wb = as_shot.is_none();
        // SAFETY: layout and length above are checked against the shim's owning allocation.
        let bytes = unsafe { std::slice::from_raw_parts(raw.data, raw.data_len as usize) };
        let stride = raw.channels as usize * 2;
        let mut data = Vec::with_capacity(count);
        for samples in bytes.chunks_exact(stride) {
            let read = |channel: usize| {
                let i = channel * 2;
                f32::from(u16::from_ne_bytes([samples[i], samples[i + 1]])) * (4.0 / 65535.0)
            };
            data.push(if raw.channels == 1 {
                [read(0); 3]
            } else {
                [read(0), read(1), read(2)]
            });
        }
        let image = Rgb32f {
            width: raw.width as usize,
            height: raw.height as usize,
            data,
        };
        if std::env::var_os("LIGHTCRAFT_PROFILE").is_some() {
            let maximum = image.data.iter().flatten().copied().fold(0.0_f32, f32::max);
            eprintln!(
                "[source] LibRaw {}x{}, WB {:.0}K tint {:.2}, max linear {:.4}",
                image.width, image.height, temp, tint, maximum
            );
        }
        let orientation = Orientation::from_exif(raw.orientation as u16);
        let native_long = image.width.max(image.height);
        drop(raw);
        return Ok(Source {
            pixels: image.into_oriented(orientation),
            orientation,
            info: SourceInfo {
                native_long,
                raw: true,
                as_shot_temp: temp,
                as_shot_tint: tint,
                relative_wb,
                ..Default::default()
            },
        });
    }
    let bytes = std::fs::read(path).map_err(|e| format!("Read image: {e}"))?;
    let decoded = lightcraft_codecs::decode(
        &bytes,
        lightcraft_codecs::DecodeOptions {
            max_size: None, // Keep source detail for tight XMP crops.
            max_pixels: 100_000_000,
        },
    )
    .map_err(|e| format!("Image decode: {e}"))?;
    if decoded
        .alpha
        .as_ref()
        .is_some_and(|a| a.data.iter().any(|&v| v < 1.0))
    {
        return Err("XMP development of transparent images is unsupported".into());
    }
    Ok(Source {
        pixels: decoded
            .to_working()
            .into_oriented(Orientation::from_exif(decoded.orientation)),
        info: SourceInfo {
            native_long: decoded.source_width.max(decoded.source_height) as usize,
            ..Default::default()
        },
        orientation: Orientation::from_exif(decoded.orientation),
    })
}
