use lightcraft_engine::{
    crs,
    develop::{DevelopSettings, Profile, apply_partial},
};
use lightcraft_geom::Orientation;
use lightcraft_meta::XmpData;
use quick_xml::{Reader, events::Event};

pub const MAX_XMP_BYTES: u64 = 128 * 1024 * 1024;

pub fn parse(xml: &str) -> Result<XmpData, String> {
    if xml.len() as u64 > MAX_XMP_BYTES {
        return Err("XMP exceeds 128 MiB".into());
    }
    // Bound nesting before building the strict XML tree. quick-xml streams the
    // packet but does not validate every XML name/namespace/character rule.
    let mut reader = Reader::from_str(xml);
    let mut depth = 0usize;
    loop {
        match reader
            .read_event()
            .map_err(|e| format!("Malformed XMP XML: {e}"))?
        {
            Event::Start(_) => {
                depth += 1;
                if depth > 64 {
                    return Err("XMP nesting exceeds 64 elements".into());
                }
            }
            Event::Empty(_) if depth >= 64 => {
                return Err("XMP nesting exceeds 64 elements".into());
            }
            Event::End(_) => {
                depth = depth.checked_sub(1).ok_or("Unexpected XML closing tag")?;
            }
            Event::DocType(_) => return Err("XMP document types are unsupported".into()),
            Event::Eof => break,
            _ => {}
        }
    }
    roxmltree::Document::parse_with_options(
        xml,
        roxmltree::ParsingOptions {
            nodes_limit: 200_000,
            ..Default::default()
        },
    )
    .map_err(|e| format!("Malformed XMP XML: {e}"))?;
    lightcraft_meta::parse_xmp(xml).map_err(|e| format!("XMP parse: {e}"))
}

pub fn has_applicable(packet: &XmpData) -> bool {
    if already_applied(packet) {
        return false;
    }
    packet.metadata.orientation.is_some() || has_crs_development(packet)
}

fn already_applied(packet: &XmpData) -> bool {
    packet
        .properties
        .get("crs:AlreadyApplied")
        .and_then(|v| v.first())
        .is_some_and(|v| v.eq_ignore_ascii_case("true"))
}

fn has_crs_development(packet: &XmpData) -> bool {
    if !crs::has_adjustments(&packet.properties) {
        return false;
    }
    let (mut partial, unmapped) = crs::to_partial_report(
        &packet.properties,
        Some(&packet.values),
        crs::Target::Any,
        1.0,
    );
    // The mapper synthesizes a neutral profile to clear old state when a Look
    // contains only identifiers or unsupported fields. This stateless helper
    // has no old profile. Explicit supported controls remain authoritative,
    // including False/0/identity curves and Amount0, over embedded RAW edits.
    let supported_profile = partial
        .get("profile")
        .and_then(|profile| serde_json::from_value::<Profile>(profile.clone()).ok())
        .is_some_and(|profile| {
            profile.imported_look().is_some_and(|look| {
                look.look_table.is_some()
                    || packet
                        .properties
                        .get("crs:Look/crs:Parameters/crs:ConvertToGrayscale")
                        .and_then(|values| values.first())
                        .is_some_and(|value| !value.trim().is_empty())
                    || (!unmapped
                        .iter()
                        .any(|name| name.starts_with("Look (invalid profile "))
                        && packet.properties.keys().any(|key| {
                            matches!(
                                key.as_str(),
                                "crs:Look/crs:Parameters/crs:Contrast2012"
                                    | "crs:Look/crs:Parameters/crs:Highlights2012"
                                    | "crs:Look/crs:Parameters/crs:Shadows2012"
                                    | "crs:Look/crs:Parameters/crs:Clarity2012"
                                    | "crs:Look/crs:Parameters/crs:ToneCurvePV2012"
                                    | "crs:Look/crs:Parameters/crs:ToneCurvePV2012Red"
                                    | "crs:Look/crs:Parameters/crs:ToneCurvePV2012Green"
                                    | "crs:Look/crs:Parameters/crs:ToneCurvePV2012Blue"
                            )
                        }))
            })
        });
    if let Some(object) = partial.as_object_mut() {
        if !supported_profile {
            object.remove("profile");
        }
        // A schema promotion describes settings; it is not an edit by itself.
        object.remove("version");
    }
    partial.as_object().is_some_and(|object| !object.is_empty())
}

pub fn has_development(packet: &XmpData, source_orientation: Orientation) -> bool {
    !already_applied(packet)
        && (has_crs_development(packet)
            || packet
                .metadata
                .orientation
                .is_some_and(|o| o != source_orientation))
}

pub fn target(info: &lightcraft_engine::pipeline::SourceInfo) -> crs::Target {
    if !info.raw {
        crs::Target::Rendered
    } else if info.relative_wb {
        crs::Target::RawRelative
    } else {
        crs::Target::RawAbsolute
    }
}

/// Pixels are already oriented by the decoder. Apply only target × source⁻¹ to that image.
fn orientation_delta(source: Orientation, target: Orientation) -> Orientation {
    let (source_flip, source_turns) = source.to_parts();
    let (target_flip, target_turns) = target.to_parts();
    let flip = source_flip ^ target_flip;
    Orientation::from_parts(
        flip,
        (target_turns + if flip { source_turns } else { 4 - source_turns }) % 4,
    )
}

pub fn settings(
    packet: &XmpData,
    target: crs::Target,
    aspect: f64,
    source_orientation: Orientation,
) -> (DevelopSettings, Vec<String>) {
    let target_orientation = packet.metadata.orientation.unwrap_or(source_orientation);
    let orientation = orientation_delta(source_orientation, target_orientation);
    let sensor_aspect = if source_orientation.swaps_axes() {
        1.0 / aspect
    } else {
        aspect
    };
    let aspect = if orientation.swaps_axes() {
        1.0 / aspect
    } else {
        aspect
    };
    let (partial, unmapped) =
        crs::to_partial_report(&packet.properties, Some(&packet.values), target, aspect);
    let mut settings = apply_partial(&DevelopSettings::default(), &partial, 1.0);
    settings.orientation = orientation;
    // Lightroom stores two opposite corners of its rotated crop in original image
    // coordinates. Lightcraft stores an axis-aligned rectangle in the straightened frame.
    // Rotate the saved corners into that frame, then express it in the target orientation.
    let rect = settings.crop.geometry.rect;
    let angle = -settings.crop.geometry.angle;
    let rotation = lightcraft_geom::Affine::rotate_about(
        angle.to_radians(),
        lightcraft_geom::Point::new(sensor_aspect / 2.0, 0.5),
    );
    let a = rotation.apply(lightcraft_geom::Point::new(
        rect.x0 * sensor_aspect,
        rect.y0,
    ));
    let b = rotation.apply(lightcraft_geom::Point::new(
        rect.x1 * sensor_aspect,
        rect.y1,
    ));
    let straightened =
        lightcraft_geom::Rect::new(a.x / sensor_aspect, a.y, b.x / sensor_aspect, b.y);
    settings.crop.geometry.rect = target_orientation.map_norm_rect(straightened);
    settings.crop.geometry.angle = if target_orientation.to_parts().0 {
        -angle
    } else {
        angle
    };
    (settings, unmapped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn supported_profile_controls_remain_applicable() {
        for (amount, parameters) in [
            ("1", r#"crs:LookTable="E96CB8AF6484F8402BB0E6ECFC8AD0FC""#),
            ("0", r#"crs:LookTable="E96CB8AF6484F8402BB0E6ECFC8AD0FC""#),
            ("0", r#"crs:ConvertToGrayscale="True""#),
            ("1", r#"crs:Contrast2012="12""#),
            ("1", r#"crs:Contrast2012="0""#),
        ] {
            let xml = format!(
                r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"><crs:Look rdf:parseType="Resource" crs:Amount="{amount}"><crs:Parameters rdf:parseType="Resource" {parameters}/></crs:Look></rdf:Description>"#
            );
            let packet = parse(&xml).unwrap();
            assert!(has_applicable(&packet), "{xml}");
            assert!(has_development(&packet, Orientation::Normal), "{xml}");
        }
        let curve = parse(r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"><crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource"><crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>128, 180</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012></crs:Parameters></crs:Look></rdf:Description>"#).unwrap();
        assert!(has_applicable(&curve));
        assert!(has_development(&curve, Orientation::Normal));
    }

    #[test]
    fn white_balance_uses_the_decoded_source_calibration() {
        use lightcraft_engine::{develop::WbMode, pipeline::SourceInfo};
        let packet = parse(r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:WhiteBalance="Auto" crs:Temperature="5050" crs:Tint="-2" crs:IncrementalTemperature="25" crs:IncrementalTint="10"/>"#).unwrap();
        let absolute = SourceInfo {
            raw: true,
            relative_wb: false,
            ..Default::default()
        };
        let relative = SourceInfo {
            raw: true,
            relative_wb: true,
            ..Default::default()
        };
        let rendered = SourceInfo::default();
        let (absolute, _) = settings(&packet, target(&absolute), 1.5, Orientation::Normal);
        assert_eq!(absolute.wb.mode, WbMode::Custom);
        assert_eq!((absolute.wb.temp, absolute.wb.tint), (5050.0, -2.0));
        for info in [&relative, &rendered] {
            let (settings, _) = settings(&packet, target(info), 1.5, Orientation::Normal);
            assert_eq!(settings.wb.mode, WbMode::Custom);
            assert_eq!(settings.wb.temp, crs::rel_to_kelvin(25.0));
            assert_eq!(settings.wb.tint, 10.0);
        }
        let absolute_only = parse(r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:Temperature="5050" crs:Tint="-2"/>"#).unwrap();
        let (settings, unmapped) =
            settings(&absolute_only, target(&relative), 1.5, Orientation::Normal);
        assert_eq!(settings.wb.mode, WbMode::AsShot);
        assert!(
            unmapped
                .iter()
                .any(|name| name == "WhiteBalance (missing AsShotTemperature)")
        );
    }

    #[test]
    fn monochrome_look_is_development_and_preserves_gray_mixer() {
        let xml = r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:GrayMixerBlue="-35"><crs:Look><rdf:Description><crs:Parameters><rdf:Description crs:ConvertToGrayscale="True" crs:Exposure2012="3"/></crs:Parameters></rdf:Description></crs:Look></rdf:Description>"#;
        let packet = parse(xml).unwrap();
        assert!(has_applicable(&packet));
        assert!(has_development(&packet, Orientation::Normal));
        let (settings, unmapped) =
            settings(&packet, crs::Target::RawAbsolute, 1.5, Orientation::Normal);
        assert_eq!(
            settings.treatment,
            lightcraft_engine::develop::Treatment::Color
        );
        assert!(settings.is_bw());
        assert_eq!(settings.bw_mix.blue, -35.0);
        assert_eq!(settings.light.exposure, 0.0);
        assert!(unmapped.iter().any(|k| k == "Look"));

        let applied = parse(&xml.replace(
            "crs:GrayMixerBlue=",
            "crs:AlreadyApplied=\"True\" crs:GrayMixerBlue=",
        ))
        .unwrap();
        assert!(!has_applicable(&applied));
        assert!(!has_development(&applied, Orientation::Normal));
    }

    #[test]
    fn monochrome_look_only_packet_renders_color_pixels_in_grayscale() {
        let xml = r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"><crs:Look><rdf:Description><crs:Parameters><rdf:Description crs:ConvertToGrayscale="True"/></crs:Parameters></rdf:Description></crs:Look></rdf:Description>"#;
        let packet = parse(xml).unwrap();
        assert!(has_applicable(&packet));
        assert!(has_development(&packet, Orientation::Normal));
        let mut pixels = lightcraft_raster::Rgb32f::new(48, 32);
        for (i, pixel) in pixels.data.iter_mut().enumerate() {
            *pixel = [[0.3, 0.04, 0.02], [0.02, 0.3, 0.04], [0.04, 0.02, 0.3]][i % 3];
        }
        let source = crate::decode::Source {
            pixels,
            info: lightcraft_engine::pipeline::SourceInfo::default(),
            orientation: Orientation::Normal,
        };
        let output = crate::render::develop(
            &source,
            &packet,
            None,
            lightcraft_engine::pipeline::OutputSpace::Srgb,
        )
        .unwrap();
        assert_eq!((output.pixels.width, output.pixels.height), (48, 32));
        assert!(
            output
                .pixels
                .data
                .iter()
                .all(|p| { p[0].abs_diff(p[1]) <= 1 && p[1].abs_diff(p[2]) <= 1 })
        );
    }

    #[test]
    fn crop_bounds_follow_effective_target_orientation() {
        for (source, target, expected, angle) in [
            (8, None, [0.2, 0.3, 0.8, 0.9], 0.0),
            (8, Some(1), [0.1, 0.2, 0.7, 0.8], 0.0),
            (1, Some(8), [0.2, 0.3, 0.8, 0.9], 0.0),
            (8, Some(2), [0.3, 0.2, 0.9, 0.8], 0.0),
        ] {
            let attribute = target.map_or(String::new(), |o| format!("tiff:Orientation=\"{o}\""));
            let xml = format!(
                r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:tiff="http://ns.adobe.com/tiff/1.0/" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" {attribute} crs:HasCrop="True" crs:CropLeft="0.1" crs:CropTop="0.2" crs:CropRight="0.7" crs:CropBottom="0.8" crs:CropAngle="0"/>"#
            );
            let packet = parse(&xml).unwrap();
            let (s, _) = settings(
                &packet,
                crs::Target::RawAbsolute,
                1.6,
                Orientation::from_exif(source),
            );
            let rect = s.crop.geometry.rect;
            for (actual, expected) in [rect.x0, rect.y0, rect.x1, rect.y1]
                .into_iter()
                .zip(expected)
            {
                assert!(
                    (actual - expected).abs() < 1e-12,
                    "source={source} target={target:?}"
                );
            }
            assert_eq!(s.crop.geometry.angle, angle);
        }
    }

    #[test]
    fn tilted_crop_maps_back_to_saved_sensor_corners_for_all_orientations() {
        use lightcraft_geom::Point;
        for source in (1..=8).map(Orientation::from_exif) {
            for target in (1..=8).map(Orientation::from_exif) {
                let xml = format!(
                    r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:tiff="http://ns.adobe.com/tiff/1.0/" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" tiff:Orientation="{}" crs:HasCrop="True" crs:CropLeft="0.1" crs:CropTop="0.2" crs:CropRight="0.7" crs:CropBottom="0.8" crs:CropAngle="7"/>"#,
                    target.to_exif()
                );
                let input_aspect = if source.swaps_axes() { 1.0 / 1.6 } else { 1.6 };
                let (s, _) = settings(
                    &parse(&xml).unwrap(),
                    crs::Target::RawAbsolute,
                    input_aspect,
                    source,
                );
                let (w, h) = if target.swaps_axes() {
                    (1.0, 1.6)
                } else {
                    (1.6, 1.0)
                };
                let inverse = s.crop.geometry.output_to_source(w, h, 1.0, 1.0);
                let corners = [(0.0, 0.0), (1.0, 0.0), (0.0, 1.0), (1.0, 1.0)]
                    .map(|(x, y)| inverse.apply(Point::new(x, y)));
                for (x, y) in [(0.1 * 1.6, 0.2), (0.7 * 1.6, 0.8)] {
                    let expected = target.map(x, y, 1.6, 1.0);
                    assert!(
                        corners.iter().any(|p| (p.x - expected.0).abs() < 1e-12
                            && (p.y - expected.1).abs() < 1e-12)
                    );
                }
                assert_eq!(
                    s.crop.geometry.angle,
                    if target.to_parts().0 { 7.0 } else { -7.0 }
                );
            }
        }
    }

    #[test]
    fn orientation_delta_handles_all_rotations_and_reflections() {
        for source in (1..=8).map(Orientation::from_exif) {
            for target in (1..=8).map(Orientation::from_exif) {
                let delta = orientation_delta(source, target);
                for (x, y) in [(0.1, 0.2), (0.7, 0.8), (0.3, 0.9)] {
                    let source_point = source.map(x, y, 1.0, 1.0);
                    let actual = delta.map(source_point.0, source_point.1, 1.0, 1.0);
                    let expected = target.map(x, y, 1.0, 1.0);
                    assert!((actual.0 - expected.0).abs() < 1e-12);
                    assert!((actual.1 - expected.1).abs() < 1e-12);
                }
            }
        }
    }
}
