pub use codecs::color::Profile;
use codecs::color::{CicpColorPrimaries, Output, TransferCharacteristics};
use moxcms::ColorProfile;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{BandFormat, Intent, Interpretation, PCS};
use rs_vips::voption::{Setter, VOption};

use crate::vips::{self, Error, Result};

fn tag(image: &Image, profile: Profile) -> Result<Image> {
    let mut image =
        image.copy_with_opts(VOption::new().set("interpretation", Interpretation::Rgb16 as i32))?;
    // Savers act on the tags, which no longer describe the pixels.
    for tag in [
        "cicp-colour-primaries",
        "cicp-transfer-characteristics",
        "cicp-matrix-coefficients",
        "cicp-full-range-flag",
        "clli-max-content-light-level",
        "clli-max-frame-average-light-level",
    ] {
        image.remove(tag)?;
    }
    let name = match profile {
        Profile::Srgb => "srgb",
        Profile::P3 => "p3",
    };
    image.set_blob_copy("icc-profile-data", &Image::profile_load(name)?)?;
    Ok(image)
}

pub fn cicp(image: &Image) -> Result<Option<(CicpColorPrimaries, TransferCharacteristics)>> {
    if image.get_typeof("cicp-transfer-characteristics")? == 0 {
        return Ok(None);
    }
    let tag = |name: &str| image.get_int(name).map(|code| u8::try_from(code).ok());
    let primaries = tag("cicp-colour-primaries")?.and_then(|code| code.try_into().ok());
    let transfer = tag("cicp-transfer-characteristics")?.and_then(|code| code.try_into().ok());
    Ok(match (primaries, transfer) {
        (Some(CicpColorPrimaries::Unspecified), _)
        | (_, Some(TransferCharacteristics::Unspecified)) => None,
        (Some(primaries), Some(transfer)) => Some((primaries, transfer)),
        _ => None,
    })
}

fn bands(image: &Image, first: i32, count: i32) -> Result<Image> {
    Ok(image.extract_band_with_opts(first, VOption::new().set("n", count))?)
}

/// Linear light with 1.0 at reference white.
#[derive(Clone)]
pub struct Linear {
    image: Image,
    primaries: ColorProfile,
}

impl Linear {
    pub fn scrgb(image: Image) -> Self {
        Self {
            image,
            primaries: ColorProfile::new_srgb(),
        }
    }

    pub fn new(image: &Image) -> Result<Self> {
        if cicp(image)?.is_some() {
            let options = VOption::new().set("in", image);
            return Ok(Self::scrgb(vips::operation("CICP2scRGB", options)?));
        }
        if let Some(linear) = Self::from_curves(image)? {
            return Ok(linear);
        }
        // Use lcms for profiles built on tables and for non-RGB images
        let xyz = image.icc_import_with_opts(
            VOption::new()
                .set("intent", Intent::Perceptual as i32)
                .set("embedded", true)
                .set("input_profile", "srgb")
                .set("pcs", PCS::Xyz as i32),
        )?;
        Ok(Self::scrgb(xyz.colourspace(Interpretation::Scrgb)?))
    }

    /// moxcms is much faster than lcms, so use it for most curves and primaries.
    fn from_curves(image: &Image) -> Result<Option<Self>> {
        let untagged = image.get_typeof("icc-profile-data")? == 0;
        let primaries = if untagged {
            ColorProfile::new_srgb()
        } else {
            match ColorProfile::new_from_slice(&image.get_blob("icc-profile-data")?) {
                Ok(profile)
                    if profile.is_matrix_shaper()
                        && profile.lut_a_to_b_perceptual.is_none()
                        && profile.lut_a_to_b_colorimetric.is_none() =>
                {
                    profile
                }
                _ => return Ok(None),
            }
        };
        let image = if untagged && image.get_interpretation()? != Interpretation::Srgb {
            image.colourspace(Interpretation::Rgb16)?
        } else {
            image.clone()
        };
        let (codes, opaque) = match (image.get_interpretation()?, image.get_format()?) {
            (Interpretation::Srgb, BandFormat::Uchar) => (256, 255.0),
            (Interpretation::Rgb16, BandFormat::Ushort) => (65536, 65535.0),
            _ => return Ok(None),
        };
        let curves = [
            &primaries.red_trc,
            &primaries.green_trc,
            &primaries.blue_trc,
        ]
        .map(|curve| curve.as_ref()?.make_linear_evaluator().ok());
        let [Some(red), Some(green), Some(blue)] = curves else {
            return Ok(None);
        };
        if image.get_bands() < 3 {
            return Ok(None);
        }
        let table: Vec<f32> = (0..codes)
            .flat_map(|code| {
                let value = code as f32 / (codes - 1) as f32;
                [&red, &green, &blue].map(|curve| curve.evaluate_value(value))
            })
            .collect();
        let table = vips::owned(table, codes, 1, 3, BandFormat::Float)?;
        let mut linear = bands(&image, 0, 3)?.maplut(&table)?;
        if image.hasalpha() {
            let alpha = bands(&image, 3, 1)?.linear(&[1.0 / opaque], &[0.0])?;
            linear = Image::bandjoin(&[linear, alpha])?;
        }
        let image = linear
            .copy_with_opts(VOption::new().set("interpretation", Interpretation::Scrgb as i32))?;
        Ok(Some(Self { image, primaries }))
    }

    pub fn image(&self) -> &Image {
        &self.image
    }

    /// The same light after `change`, which must not touch the pixels' values.
    pub fn map(&self, change: impl FnOnce(&Image) -> Result<Image>) -> Result<Self> {
        Ok(Self {
            image: change(&self.image)?,
            primaries: self.primaries.clone(),
        })
    }

    pub fn resize(&self, scale: f64) -> Result<Self> {
        let image = if self.image.hasalpha() {
            self.image.premultiply()?.resize(scale)?.unpremultiply()?
        } else {
            self.image.resize(scale)?
        };
        Ok(Self {
            image,
            primaries: self.primaries.clone(),
        })
    }

    fn to(&self, target: &ColorProfile) -> Result<Image> {
        let matrix = self.primaries.transform_matrix(target);
        let matrix: [f64; 9] = std::array::from_fn(|i| matrix.v[i / 3][i % 3]);
        if (0..9).all(|i| (matrix[i] - f64::from(u8::from(i % 4 == 0))).abs() < 1e-9) {
            return Ok(self.image.clone());
        }
        let matrix = Image::new_matrix_from_array(3, 3, &matrix)?;
        let colour = bands(&self.image, 0, 3)?.recomb(&matrix)?;
        if self.image.hasalpha() {
            return Ok(Image::bandjoin(&[colour, bands(&self.image, 3, 1)?])?);
        }
        Ok(colour)
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Colour {
    Pq,
    Sdr(Profile),
}

impl Colour {
    pub fn of(image: &Image, profile: Profile) -> Result<Self> {
        Ok(match cicp(image)? {
            Some((_, TransferCharacteristics::Smpte2084 | TransferCharacteristics::Hlg)) => {
                Self::Pq
            }
            _ => Self::Sdr(profile),
        })
    }

    pub fn encode(self, linear: &Linear) -> Result<Image> {
        match self {
            Self::Pq => {
                let mut pq = vips::operation(
                    "scRGB2CICP",
                    VOption::new()
                        .set("in", &linear.to(&ColorProfile::new_srgb())?)
                        .set("colour_primaries", CicpColorPrimaries::Bt2020 as i32)
                        .set(
                            "transfer_characteristics",
                            TransferCharacteristics::Smpte2084 as i32,
                        )
                        .set("depth", 16),
                )?
                .copy()?;
                // Whatever profile came with the source describes something else.
                pq.remove("icc-profile-data")?;
                Ok(pq)
            }
            Self::Sdr(profile) => {
                let sdr = linear.to(&profile.colorimetry())?;
                tag(&sdr.colourspace(Interpretation::Rgb16)?, profile)
            }
        }
    }
}

pub fn tone_map(image: &Image, profile: Profile) -> Result<Image> {
    let output = Output {
        profile,
        alpha: image.hasalpha(),
        wide: true,
    };
    let transform = codecs::jxl::hdr_transform(
        CicpColorPrimaries::Bt2020,
        TransferCharacteristics::Smpte2084,
        output,
    )
    .expect("moxcms reads the profile jxl-rs makes for BT.2020 PQ");
    let (width, height, bands) = (image.get_width(), image.get_height(), image.get_bands());
    let mut mapped = vec![0u16; (width * height * bands) as usize];
    transform
        .transform(&vips::read(image)?, &mut mapped)
        .map_err(|error| Error(error.to_string()))?;
    let mapped = vips::owned(mapped, width, height, bands, BandFormat::Ushort)?;
    tag(&mapped, profile)
}
