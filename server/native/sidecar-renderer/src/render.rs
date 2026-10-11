use crate::{decode::Source, xmp};
use lightcraft_engine::pipeline::{self, OutputSpace, RenderRequest};
use lightcraft_meta::XmpData;
use lightcraft_raster::Rgba8;

pub struct ResultImage {
    pub pixels: Rgba8,
    pub native_width: usize,
    pub native_height: usize,
    pub unmapped: Vec<String>,
}

pub fn develop(
    source: &Source,
    packet: &XmpData,
    size: Option<usize>,
    space: OutputSpace,
) -> Result<ResultImage, String> {
    let aspect = source.pixels.width as f64 / source.pixels.height as f64;
    let (settings, unmapped) = xmp::settings(
        packet,
        xmp::target(&source.info),
        aspect,
        source.orientation,
    );
    let frame = pipeline::frame_for(&source.pixels, &source.info, &settings, true);
    let (native_w, native_h) = frame.native_size();
    if !native_w.is_finite() || !native_h.is_finite() || native_w < 1.0 || native_h < 1.0 {
        return Err("XMP produces an invalid crop".into());
    }
    let scale = size.map_or(1.0, |s| (s as f64 / native_w.min(native_h)).min(1.0));
    let width = (native_w * scale).round().max(1.0) as usize;
    let height = (native_h * scale).round().max(1.0) as usize;
    let mut request = RenderRequest::fit(width, height);
    request.space = space;
    let rendered = pipeline::render(&source.pixels, &source.info, &settings, &request);
    let unmapped = lightcraft_engine::develop::unsupported_edits::bounded_names(
        unmapped
            .iter()
            .chain(rendered.unsupported_edits.iter())
            .map(String::as_str),
    );
    Ok(ResultImage {
        pixels: rendered.image,
        native_width: native_w.round().max(1.0) as usize,
        native_height: native_h.round().max(1.0) as usize,
        unmapped,
    })
}
