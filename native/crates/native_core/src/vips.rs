use std::fmt;
use std::sync::OnceLock;

use rs_vips::enums::BandFormat;
use rs_vips::voption::{Setter, VOption, call};
use rs_vips::{Vips, VipsImage as Image, bindings};

#[derive(Debug)]
pub struct Error(pub(crate) String);

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for Error {}

impl From<rs_vips::error::Error> for Error {
    fn from(error: rs_vips::error::Error) -> Self {
        // The binding has already copied libvips' message into its own.
        Vips::error_clear();
        Self(error.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;

unsafe extern "C" {
    fn vips_unlimited_set(unlimited: i32);
}

pub fn init() -> Result<()> {
    static STARTED: OnceLock<std::result::Result<(), String>> = OnceLock::new();
    STARTED
        .get_or_init(|| {
            Vips::init("immich").map_err(|error| error.to_string())?;
            // Its cache would keep each decoded file in memory until the next one is opened.
            Vips::cache_set_max(0);
            // One thread per image, as with sharp; jobs running side by side are the parallelism.
            Vips::concurrency_set(1);
            // SAFETY: libvips is initialised and the setter takes a plain flag.
            unsafe { vips_unlimited_set(1) };
            Ok(())
        })
        .clone()
        .map_err(Error)
}

pub fn version() -> Result<String> {
    Ok(Vips::version_string()?)
}

/// Without the copy the binding's `write_to_memory` makes.
pub fn read<T: Copy + Default>(image: &Image) -> Result<Vec<T>> {
    // SAFETY: `image` is a live image; `samples` is the size libvips gives for it and outlives `target`.
    unsafe {
        let source = image.as_mut_ptr();
        let header = &*source;
        if bindings::vips_format_sizeof(header.BandFmt) as usize != size_of::<T>() {
            return Err(Error("the image's samples are another size".into()));
        }
        let mut samples = vec![T::default(); (header.Xsize * header.Ysize * header.Bands) as usize];
        let target = bindings::vips_image_new_from_memory(
            samples.as_mut_ptr().cast(),
            size_of_val(samples.as_slice()),
            header.Xsize,
            header.Ysize,
            header.Bands,
            header.BandFmt,
        );
        let status = bindings::vips_image_write(source, target);
        bindings::g_object_unref(target.cast());
        if status != 0 {
            return Err(failure("could not read pixels"));
        }
        Ok(samples)
    }
}

/// Without the copy the binding's `new_from_memory_copy` makes.
pub(crate) fn owned<T>(
    samples: Vec<T>,
    width: i32,
    height: i32,
    bands: i32,
    format: BandFormat,
) -> Result<Image> {
    unsafe extern "C" fn release<T>(samples: bindings::gpointer) {
        // SAFETY: this is the box `owned` gave libvips, handed back once.
        drop(unsafe { Box::from_raw(samples.cast::<Vec<T>>()) });
    }
    let samples = Box::new(samples);
    // SAFETY: the samples stay in their box until libvips finalises the image and releases them.
    unsafe {
        let image = bindings::vips_image_new_from_memory(
            samples.as_ptr().cast(),
            size_of_val(samples.as_slice()),
            width,
            height,
            bands,
            format as _,
        );
        if image.is_null() {
            return Err(failure("could not wrap samples"));
        }
        bindings::g_object_set_data_full(
            image.cast(),
            c"samples".as_ptr(),
            Box::into_raw(samples).cast(),
            Some(release::<T>),
        );
        Ok(Image::from(image))
    }
}

/// For the failures the binding does not report.
fn failure(what: &str) -> Error {
    let detail = Vips::error_buffer().unwrap_or_default();
    Vips::error_clear();
    Error(format!("{what}: {detail}"))
}

/// For the operations the binding has no method for.
pub(crate) fn operation(name: &str, options: VOption) -> Result<Image> {
    // The binding takes a null image as the request for an output, and reports a failed build
    // through the status.
    let mut out = Image::from(std::ptr::null_mut());
    if call(name, options.set("out", &mut out))? != 0 {
        return Err(failure(name));
    }
    Ok(out)
}
