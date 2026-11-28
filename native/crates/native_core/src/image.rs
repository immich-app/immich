use napi_derive::napi;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{Angle, Direction, Interpretation};

use crate::colour::{self, Colour, Linear, Profile};
use crate::io::{Encode, Source};
use crate::vips::{self, Result};

#[napi(object)]
#[derive(Clone, Copy, Debug)]
pub struct Decode {
    pub profile: Profile,
    pub strict: bool,
    pub orientation: Option<i32>,
    pub size: Option<u32>,
}

#[napi(string_enum = "lowercase")]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Fit {
    Inside,
    Outside,
}

#[napi(object)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Crop {
    pub left: u32,
    pub top: u32,
    pub width: u32,
    pub height: u32,
}

#[napi(string_enum = "camelCase")]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Step {
    Rotate90,
    Rotate180,
    Rotate270,
    MirrorHorizontal,
    MirrorVertical,
}

#[napi(object)]
#[derive(Clone, Debug)]
pub struct Transform {
    pub crop: Option<Crop>,
    pub steps: Vec<Step>,
    pub size: Option<u32>,
    pub fit: Fit,
}

impl Fit {
    fn scale(self, image: &Image, size: Option<u32>) -> Option<f64> {
        let (width, height) = (f64::from(image.get_width()), f64::from(image.get_height()));
        let side = match self {
            Self::Inside => width.max(height),
            Self::Outside => width.min(height),
        };
        size.map(|size| f64::from(size) / side)
            .filter(|&scale| scale < 1.0)
    }
}

impl Transform {
    fn arrange(&self, image: &Image) -> Result<Image> {
        let mut image = image.clone();
        if let Some(crop) = self.crop {
            image = image.extract_area(
                crop.left as i32,
                crop.top as i32,
                crop.width as i32,
                crop.height as i32,
            )?;
        }
        for step in &self.steps {
            image = match step {
                Step::Rotate90 => image.rot(Angle::D90)?,
                Step::Rotate180 => image.rot(Angle::D180)?,
                Step::Rotate270 => image.rot(Angle::D270)?,
                Step::MirrorHorizontal => image.flip(Direction::Horizontal)?,
                Step::MirrorVertical => image.flip(Direction::Vertical)?,
            };
        }
        Ok(image)
    }
}

#[derive(Clone)]
pub struct Bitmap {
    /// Encoding clips what resizing takes below black or above white, so it waits for the output.
    linear: Linear,
    colour: Colour,
    profile: Profile,
}

impl Bitmap {
    pub fn decode(source: Source, options: &Decode) -> Result<Self> {
        let image = source.open(options.strict)?;
        let colour = Colour::of(&image, options.profile)?;
        let mut linear = Linear::new(&image)?;
        if let Some(scale) = Fit::Outside.scale(&image, options.size) {
            linear = linear.resize(scale)?;
        }
        let linear = linear.map(|image| {
            let mut image = image.clone();
            if let Some(orientation) = options.orientation {
                image = image.copy()?;
                image.set_int("orientation", orientation)?;
            }
            Ok(image.autorot()?)
        })?;
        // Reading a pixel decodes the file, so the decoder's memory is released before the
        // copy is allocated.
        linear.image().getpoint(0, 0)?;
        Ok(Self {
            linear: linear.map(|image| Ok(image.copy_memory()?))?,
            colour,
            profile: options.profile,
        })
    }

    pub fn width(&self) -> u32 {
        self.linear.image().get_width() as u32
    }

    pub fn height(&self) -> u32 {
        self.linear.image().get_height() as u32
    }

    pub fn has_alpha(&self) -> bool {
        self.linear.image().hasalpha()
    }

    fn output(&self, transform: &Transform, hdr: bool) -> Result<Image> {
        let mut linear = self.linear.map(|image| transform.arrange(image))?;
        if let Some(scale) = transform.fit.scale(linear.image(), transform.size) {
            linear = linear.resize(scale)?;
        }
        let mut image = self.colour.encode(&linear)?;
        if self.colour == Colour::Pq {
            if hdr {
                return Ok(image);
            }
            image = colour::tone_map(&image, self.profile)?;
        }
        Ok(image.colourspace(Interpretation::Srgb)?)
    }

    pub fn save(&self, transform: &Transform, encode: Encode, path: &str) -> Result<()> {
        encode.save(&self.output(transform, encode.carries_hdr())?, path)
    }

    pub fn rgba(&self, transform: &Transform) -> Result<(Vec<u8>, u32, u32)> {
        let mut image = self.output(transform, false)?;
        if !image.hasalpha() {
            image = image.bandjoin_const(&[255.0])?;
        }
        let (width, height) = (image.get_width() as u32, image.get_height() as u32);
        Ok((vips::read(&image)?, width, height))
    }
}
