use lightcraft_codecs::{EncodeImage, EncodeMeta};
use lightcraft_raster::Rgba8;
use serde_json::Value;
use std::process::{Command, Output};
use tempfile::TempDir;

fn packet(attrs: &str) -> String {
    format!(
        r#"<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" xmlns:tiff="http://ns.adobe.com/tiff/1.0/" {attrs}/></rdf:RDF></x:xmpmeta>"#
    )
}

fn fixture(alpha: u8) -> TempDir {
    let dir = tempfile::tempdir().expect("temporary fixture");
    let pixels = Rgba8::from_fn(160, 100, |x, y| {
        [40 + (x / 4) as u8, 40 + (y / 4) as u8, 50, alpha]
    });
    let png = lightcraft_codecs::encode_png(&EncodeImage::rgba8(&pixels), &EncodeMeta::default())
        .expect("fixture PNG");
    std::fs::write(dir.path().join("source.png"), png).expect("write fixture");
    dir
}

fn call(dir: &TempDir, xml: &str, extra: &[&str]) -> Output {
    std::fs::write(dir.path().join("source.xmp"), xml).expect("write sidecar");
    Command::new(env!("CARGO_BIN_EXE_immich-sidecar-renderer"))
        .arg("--original")
        .arg(dir.path().join("source.png"))
        .arg("--sidecar")
        .arg(dir.path().join("source.xmp"))
        .args(extra)
        .output()
        .expect("run renderer")
}

fn frame(output: &Output) -> (Value, &[u8]) {
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let end = output
        .stdout
        .iter()
        .position(|&b| b == b'\n')
        .expect("header delimiter");
    let header: Value = serde_json::from_slice(&output.stdout[..end]).expect("JSON header");
    let pixels = &output.stdout[end + 1..];
    if header["status"] == "developed" {
        assert_eq!(
            pixels.len() as u64,
            header["width"].as_u64().unwrap() * header["height"].as_u64().unwrap() * 4
        );
        assert!(pixels.chunks_exact(4).all(|p| p[3] == 255));
    } else {
        assert!(pixels.is_empty());
    }
    (header, pixels)
}

fn raw_fixture(xml: Option<&str>) -> TempDir {
    // Procedural, uncompressed CFA DNG: no camera files or cached JPEGs are fixtures.
    let mut entries = vec![
        (256u16, 4u16, 1u32, 48u32),
        (257, 4, 1, 32),
        (258, 3, 1, 16),
        (259, 3, 1, 1),
        (262, 3, 1, 32803),
        (273, 4, 1, 0),
        (277, 3, 1, 1),
        (278, 4, 1, 32),
        (279, 4, 1, 48 * 32 * 2),
        (33421, 3, 2, 2 | (2 << 16)),
        (33422, 1, 4, u32::from_le_bytes([0, 1, 1, 2])),
        (50706, 1, 4, u32::from_le_bytes([1, 4, 0, 0])),
        (50714, 3, 1, 0),
        (50717, 4, 1, 65535),
        (50721, 10, 9, 0),
        (50728, 5, 3, 0),
        (50778, 3, 1, 21),
    ];
    if let Some(xml) = xml {
        entries.push((700, 1, xml.len() as u32, 0));
    }
    entries.sort_by_key(|entry| entry.0);
    let data_start = 8 + 2 + 12 * entries.len() + 4;
    let mut extra = Vec::new();
    for (tag, _, _, value) in &mut entries {
        match tag {
            50721 => {
                *value = (data_start + extra.len()) as u32;
                for i in 0..9 {
                    extra.extend_from_slice(&(if i % 4 == 0 { 1i32 } else { 0 }).to_le_bytes());
                    extra.extend_from_slice(&1i32.to_le_bytes());
                }
            }
            50728 => {
                *value = (data_start + extra.len()) as u32;
                for _ in 0..3 {
                    extra.extend_from_slice(&1u32.to_le_bytes());
                    extra.extend_from_slice(&1u32.to_le_bytes());
                }
            }
            700 => {
                *value = (data_start + extra.len()) as u32;
                extra.extend_from_slice(xml.unwrap().as_bytes());
            }
            _ => {}
        }
    }
    while (data_start + extra.len()) % 2 != 0 {
        extra.push(0);
    }
    for entry in &mut entries {
        if entry.0 == 273 {
            entry.3 = (data_start + extra.len()) as u32;
        }
    }
    let mut bytes = vec![b'I', b'I', 42, 0, 8, 0, 0, 0];
    bytes.extend_from_slice(&(entries.len() as u16).to_le_bytes());
    for (tag, kind, count, value) in entries {
        bytes.extend_from_slice(&tag.to_le_bytes());
        bytes.extend_from_slice(&kind.to_le_bytes());
        bytes.extend_from_slice(&count.to_le_bytes());
        bytes.extend_from_slice(&value.to_le_bytes());
    }
    bytes.extend_from_slice(&0u32.to_le_bytes());
    bytes.extend_from_slice(&extra);
    for y in 0..32 {
        for x in 0..48 {
            let base = match (y % 2, x % 2) {
                (0, 0) => 35000u16,
                (1, 1) => 5000,
                _ => 17000,
            };
            bytes.extend_from_slice(&(base + (x * 40 + y * 20) as u16).to_le_bytes());
        }
    }
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("source.dng"), bytes).unwrap();
    dir
}

fn call_raw(dir: &TempDir, extra: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_immich-sidecar-renderer"))
        .arg("--original")
        .arg(dir.path().join("source.dng"))
        .args(extra)
        .output()
        .unwrap()
}

#[test]
fn raw_without_external_xmp_decodes_native_pixels_and_reports_the_logical_base() {
    let dir = raw_fixture(None);
    let output = call_raw(&dir, &["--size", "16"]);
    let (header, pixels) = frame(&output);
    assert_eq!(header["isDeveloped"], false);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(24), Some(16))
    );
    assert_eq!(
        (
            header["nativeWidth"].as_u64(),
            header["nativeHeight"].as_u64()
        ),
        (Some(48), Some(32))
    );
    assert!(pixels.chunks_exact(4).any(|p| p[0].abs_diff(p[2]) > 10));
}

#[test]
fn embedded_xmp_applies_black_and_white_and_crop_at_native_resolution() {
    let dir = raw_fixture(Some(&packet(
        r#"crs:ConvertToGrayscale="True" crs:HasCrop="True" crs:CropLeft="0.25" crs:CropRight="0.75" crs:CropTop="0" crs:CropBottom="1""#,
    )));
    let output = call_raw(&dir, &[]);
    let (header, pixels) = frame(&output);
    assert_eq!(header["isDeveloped"], true);
    assert_eq!(
        (
            header["nativeWidth"].as_u64(),
            header["nativeHeight"].as_u64()
        ),
        (Some(24), Some(32))
    );
    assert!(
        pixels
            .chunks_exact(4)
            .all(|p| p[0].abs_diff(p[1]) <= 1 && p[1].abs_diff(p[2]) <= 1)
    );
}

#[test]
fn external_xmp_takes_precedence_over_embedded_development() {
    let dir = raw_fixture(Some(&packet(r#"crs:ConvertToGrayscale="True""#)));
    let sidecar = dir.path().join("override.xmp");
    std::fs::write(&sidecar, packet(r#"crs:ConvertToGrayscale="False""#)).unwrap();
    let output = call_raw(&dir, &["--sidecar", sidecar.to_str().unwrap()]);
    let (header, pixels) = frame(&output);
    assert_eq!(header["isDeveloped"], true);
    assert!(pixels.chunks_exact(4).any(|p| p[0].abs_diff(p[2]) > 10));
}

#[test]
fn already_applied_embedded_settings_are_not_applied_again() {
    let plain = raw_fixture(None);
    let applied = raw_fixture(Some(&packet(
        r#"crs:AlreadyApplied="True" crs:Exposure2012="2" crs:ConvertToGrayscale="True""#,
    )));
    let plain_output = call_raw(&plain, &[]);
    let applied_output = call_raw(&applied, &[]);
    assert_eq!(frame(&applied_output).0["isDeveloped"], false);
    assert_eq!(frame(&plain_output).1, frame(&applied_output).1);
}

#[test]
fn missing_runtime_profile_table_is_reported_and_amount_zero_preserves_monochrome() {
    let dir = fixture(255);
    let packet = |amount: &str| {
        format!(
            r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/" crs:ConvertToGrayscale="False"><crs:Look rdf:parseType="Resource" crs:Amount="{amount}"><crs:Parameters rdf:parseType="Resource" crs:ConvertToGrayscale="True" crs:LookTable="E96CB8AF6484F8402BB0E6ECFC8AD0FC"/></crs:Look></rdf:Description>"#
        )
    };
    let unresolved = call(&dir, &packet("1.2"), &[]);
    let (header, pixels) = frame(&unresolved);
    assert_eq!(header["isDeveloped"], true);
    assert!(header["unmapped"].as_array().unwrap().iter().any(|name| {
        name.as_str().is_some_and(|name| {
            name.starts_with("LookTable E96CB8AF6484F8402BB0E6ECFC8AD0FC")
                && name.contains("missing resource")
        })
    }));
    assert!(
        pixels
            .chunks_exact(4)
            .all(|p| p[0].abs_diff(p[1]) <= 1 && p[1].abs_diff(p[2]) <= 1)
    );

    let bypassed = call(&dir, &packet("0"), &[]);
    let (header, pixels) = frame(&bypassed);
    assert!(!header["unmapped"].as_array().unwrap().iter().any(|name| {
        name.as_str()
            .is_some_and(|name| name.contains("missing resource"))
    }));
    assert!(
        pixels
            .chunks_exact(4)
            .all(|p| p[0].abs_diff(p[1]) <= 1 && p[1].abs_diff(p[2]) <= 1)
    );
}

#[test]
fn malformed_embedded_xmp_fails_without_publishing_pixels() {
    let dir = raw_fixture(Some("<broken>"));
    let output = call_raw(&dir, &[]);
    assert!(!output.status.success());
    assert!(output.stdout.is_empty());
}

#[test]
fn version_is_fast_and_matches_frame() {
    let version = Command::new(env!("CARGO_BIN_EXE_immich-sidecar-renderer"))
        .arg("--version")
        .output()
        .unwrap();
    assert!(version.status.success());
    let dir = fixture(255);
    let output = call(&dir, &packet(r#"crs:Exposure2012="1""#), &[]);
    let (header, _) = frame(&output);
    assert_eq!(
        header["rendererVersion"],
        String::from_utf8(version.stdout).unwrap().trim()
    );
}

#[test]
fn metadata_only_and_already_applied_do_not_decode_original() {
    let dir = tempfile::tempdir().unwrap();
    for attrs in [
        "",
        r#"crs:CameraProfile="Adobe Standard" crs:Look="unsupported""#,
        r#"crs:Exposure2012="2" crs:AlreadyApplied="True""#,
    ] {
        let output = call(&dir, &packet(attrs), &[]);
        assert_eq!(frame(&output).0["status"], "skipped");
    }

    let original = fixture(255);
    let output = call(
        &original,
        &packet(r#"crs:Look="unsupported" crs:Exposure2012="1""#),
        &[],
    );
    let (header, _) = frame(&output);
    assert_eq!(header["status"], "developed");
    assert!(
        header["unmapped"]
            .as_array()
            .unwrap()
            .iter()
            .any(|name| name == "Look")
    );
}

#[test]
fn unsupported_imported_profiles_do_not_decode_original() {
    let dir = tempfile::tempdir().unwrap();
    for look in [
        r#"<crs:Look><rdf:Description crs:Name="Unresolved name only" crs:UUID="unknown"/></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource" crs:Exposure2012="3"/></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource" crs:LookTable="invalid"/></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource" crs:Amount="1.2"/>"#,
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource" crs:Contrast2012="invalid"/></crs:Look>"#,
    ] {
        let xml = format!(
            r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/">{look}</rdf:Description>"#
        );
        let output = call(&dir, &xml, &[]);
        assert_eq!(frame(&output).0["status"], "skipped", "{look}");
    }
}

#[test]
fn external_supported_neutral_profiles_override_embedded_monochrome() {
    let dir = raw_fixture(Some(&packet(r#"crs:ConvertToGrayscale="True""#)));
    let sidecar = dir.path().join("override.xmp");
    for definition in [
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource" crs:ConvertToGrayscale="False"/></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource" crs:Contrast2012="0"/></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource"><crs:Parameters rdf:parseType="Resource"><crs:ToneCurvePV2012><rdf:Seq><rdf:li>0, 0</rdf:li><rdf:li>255, 255</rdf:li></rdf:Seq></crs:ToneCurvePV2012></crs:Parameters></crs:Look>"#,
        r#"<crs:Look rdf:parseType="Resource" crs:Amount="0"><crs:Parameters rdf:parseType="Resource" crs:LookTable="E96CB8AF6484F8402BB0E6ECFC8AD0FC"/></crs:Look>"#,
    ] {
        let xml = format!(
            r#"<rdf:Description xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/">{definition}</rdf:Description>"#
        );
        std::fs::write(&sidecar, xml).unwrap();
        let output = call_raw(&dir, &["--sidecar", sidecar.to_str().unwrap()]);
        let (header, pixels) = frame(&output);
        assert_eq!(header["status"], "developed", "{definition}");
        assert_eq!(header["isDeveloped"], true, "{definition}");
        assert!(pixels.chunks_exact(4).any(|p| p[0].abs_diff(p[2]) > 10));
        assert!(!header["unmapped"].as_array().unwrap().iter().any(|name| {
            name.as_str()
                .is_some_and(|name| name.contains("missing resource"))
        }));
    }
}

#[test]
fn exposure_changes_pixels_and_crop_preserves_short_edge_size() {
    let dir = fixture(255);
    let low = call(&dir, &packet(r#"crs:Exposure2012="0""#), &[]);
    let bright = call(&dir, &packet(r#"crs:Exposure2012="1""#), &[]);
    let mean = |output: &Output| {
        let (_, pixels) = frame(output);
        pixels
            .chunks_exact(4)
            .map(|p| p[0] as u64 + p[1] as u64 + p[2] as u64)
            .sum::<u64>() as f64
            / (pixels.len() as f64 * 0.75)
    };
    assert!(mean(&bright) > mean(&low) + 10.0);
    let xml = packet(
        r#"crs:Exposure2012="1" crs:CropLeft="0.25" crs:CropRight="0.75" crs:CropTop="0" crs:CropBottom="1" crs:HasCrop="True""#,
    );
    let crop = call(&dir, &xml, &["--size", "40"]);
    let (header, _) = frame(&crop);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(40), Some(50))
    );
    assert_eq!(
        (
            header["nativeWidth"].as_u64(),
            header["nativeHeight"].as_u64()
        ),
        (Some(80), Some(100))
    );
    let clamped = call(&dir, &xml, &["--size", "200"]);
    let (header, _) = frame(&clamped);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(80), Some(100))
    );
}

#[test]
fn malformed_xml_and_transparency_fail_without_stdout() {
    let dir = fixture(255);
    for xml in [
        "<broken>",
        "<a/><b/>",
        "text<a/>",
        "<a>&unknown;</a>",
        "<!DOCTYPE a><a/>",
        "<a><b></a>",
        "<1/>",
        "<a>&#xFFFF;</a>",
        "<a>&#0;</a>",
        "<unknown:prefix/>",
        "<a duplicate=\"1\" duplicate=\"2\"/>",
    ] {
        let result = call(&dir, xml, &[]);
        assert!(!result.status.success(), "accepted {xml}");
        assert!(result.stdout.is_empty());
    }
    let transparent = fixture(128);
    let result = call(&transparent, &packet(r#"crs:Exposure2012="1""#), &[]);
    assert!(!result.status.success());
    assert!(result.stdout.is_empty());
}

#[test]
fn p3_is_encoded_in_the_requested_space() {
    let dir = fixture(255);
    let xml = packet(r#"crs:Exposure2012="0.5" crs:Saturation="25""#);
    let srgb = call(&dir, &xml, &["--colorspace", "srgb"]);
    let p3 = call(&dir, &xml, &["--colorspace", "p3"]);
    assert_eq!(frame(&p3).0["colorspace"], "p3");
    assert_ne!(frame(&srgb).1, frame(&p3).1);
}

#[test]
fn exif_orientation_is_applied_once() {
    let dir = tempfile::tempdir().unwrap();
    let pixels = Rgba8::from_fn(160, 100, |x, y| {
        [40 + (x / 4) as u8, 40 + (y / 4) as u8, 50, 255]
    });
    // One little-endian TIFF IFD containing EXIF Orientation=6.
    let exif: [u8; 26] = [
        b'I', b'I', 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
    ];
    let png = lightcraft_codecs::encode_png(
        &EncodeImage::rgba8(&pixels),
        &EncodeMeta {
            exif: Some(&exif),
            ..Default::default()
        },
    )
    .unwrap();
    std::fs::write(dir.path().join("source.png"), png).unwrap();
    let output = call(&dir, &packet(r#"crs:Exposure2012="0""#), &[]);
    let (header, _) = frame(&output);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(100), Some(160))
    );
}

#[test]
fn xmp_packet_size_is_limited_to_128_mibibytes() {
    let dir = fixture(255);
    // A sparse file verifies the read bound without allocating the oversized
    // packet in the test process or needing a large committed fixture.
    std::fs::File::create(dir.path().join("source.xmp"))
        .unwrap()
        .set_len(128 * 1024 * 1024 + 1)
        .unwrap();
    let result = Command::new(env!("CARGO_BIN_EXE_immich-sidecar-renderer"))
        .arg("--original")
        .arg(dir.path().join("source.png"))
        .arg("--sidecar")
        .arg(dir.path().join("source.xmp"))
        .output()
        .unwrap();
    assert!(!result.status.success());
    assert!(result.stdout.is_empty());
    assert!(String::from_utf8_lossy(&result.stderr).contains("128 MiB"));
}

#[test]
fn rotation_only_packets_develop_real_deltas_and_skip_identity_and_already_applied() {
    let dir = fixture(255);
    let rotated = call(&dir, &packet(r#"tiff:Orientation="6""#), &[]);
    let (header, _) = frame(&rotated);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(100), Some(160))
    );
    assert_eq!(
        frame(&call(&dir, &packet(r#"tiff:Orientation="1""#), &[])).0["status"],
        "skipped"
    );
    assert_eq!(
        frame(&call(
            &dir,
            &packet(r#"tiff:Orientation="6" crs:AlreadyApplied="True" crs:Exposure2012="2""#),
            &[]
        ))
        .0["status"],
        "skipped"
    );

    // This source has a valid EXIF orientation but no image data to decode. An unchanged
    // metadata-only orientation must still skip, rather than fail sensor/image decoding.
    let exif: [u8; 26] = [
        b'I', b'I', 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
    ];
    std::fs::write(dir.path().join("source.png"), exif).unwrap();
    let same = call(&dir, &packet(r#"tiff:Orientation="6""#), &[]);
    assert_eq!(frame(&same).0["status"], "skipped");
    let changed = call(&dir, &packet(r#"tiff:Orientation="8""#), &[]);
    assert!(!changed.status.success());
    assert!(changed.stdout.is_empty());
}

#[test]
fn xmp_orientation_replaces_source_orientation_instead_of_accumulating() {
    let dir = tempfile::tempdir().unwrap();
    let pixels = Rgba8::from_fn(160, 100, |x, y| {
        [40 + (x / 4) as u8, 40 + (y / 4) as u8, 50, 255]
    });
    let exif: [u8; 26] = [
        b'I', b'I', 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
    ];
    let png = lightcraft_codecs::encode_png(
        &EncodeImage::rgba8(&pixels),
        &EncodeMeta {
            exif: Some(&exif),
            ..Default::default()
        },
    )
    .unwrap();
    std::fs::write(dir.path().join("source.png"), png).unwrap();
    let base = call(&dir, &packet(r#"crs:Exposure2012="0""#), &[]);
    let same = call(
        &dir,
        &packet(r#"crs:Exposure2012="0" tiff:Orientation="6""#),
        &[],
    );
    assert_eq!(frame(&base).1, frame(&same).1);
    let reset = call(
        &dir,
        &packet(r#"crs:Exposure2012="0" tiff:Orientation="1""#),
        &[],
    );
    assert_eq!(
        (
            frame(&reset).0["width"].as_u64(),
            frame(&reset).0["height"].as_u64()
        ),
        (Some(160), Some(100))
    );
}

#[test]
fn rotated_crop_selects_the_original_sensor_region() {
    let dir = fixture(255);
    let attrs = r#"crs:HasCrop="True" crs:CropLeft="0.5" crs:CropTop="0" crs:CropRight="1" crs:CropBottom="1""#;
    let upright = call(&dir, &packet(attrs), &[]);
    let (original, _) = frame(&upright);
    assert_eq!(
        (original["width"].as_u64(), original["height"].as_u64()),
        (Some(80), Some(100))
    );
    let rotated = call(
        &dir,
        &packet(&format!(r#"{attrs} tiff:Orientation="8""#)),
        &[],
    );
    let (rotated_header, rotated_pixels) = frame(&rotated);
    assert_eq!(
        (
            rotated_header["width"].as_u64(),
            rotated_header["height"].as_u64()
        ),
        (Some(100), Some(80))
    );
    // The x ramp comes from the selected right half even after rotation (source red >=60).
    assert!(rotated_pixels.chunks_exact(4).all(|p| p[0] >= 60));
}

#[test]
fn tilted_crop_uses_rotated_corner_dimensions() {
    let dir = fixture(255);
    let attrs = r#"crs:HasCrop="True" crs:CropLeft="0.25" crs:CropTop="0.2" crs:CropRight="0.75" crs:CropBottom="0.8" crs:CropAngle="10""#;
    let upright = call(&dir, &packet(attrs), &[]);
    let (header, _) = frame(&upright);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(89), Some(45))
    );
    let rotated = call(
        &dir,
        &packet(&format!(r#"{attrs} tiff:Orientation="8""#)),
        &[],
    );
    let (header, _) = frame(&rotated);
    assert_eq!(
        (header["width"].as_u64(), header["height"].as_u64()),
        (Some(45), Some(89))
    );
}
