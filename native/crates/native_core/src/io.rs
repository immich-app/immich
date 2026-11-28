use napi_derive::napi;
use rs_vips::VipsImage as Image;
use rs_vips::enums::{ForeignKeep, ForeignSubsample};
use rs_vips::voption::{Setter, VOption};

use crate::vips::{self, Result};

#[derive(Clone, Copy)]
pub enum Source<'a> {
    File(&'a str),
    Buffer(&'a [u8]),
}

#[napi(object)]
pub struct Dimensions {
    pub width: u32,
    pub height: u32,
}

impl Source<'_> {
    pub fn open(self, strict: bool) -> Result<Image> {
        vips::init()?;
        let fail_on = if strict { "error" } else { "none" };
        let options = format!("memory=true,fail_on={fail_on}");
        Ok(match self {
            Self::File(path) => Image::new_from_file(format!("{path}[{options}]"))?,
            Self::Buffer(buffer) => Image::new_from_buffer(buffer, &options)?,
        })
    }

    pub fn dimensions(self) -> Result<Dimensions> {
        let image = self.open(false)?;
        Ok(Dimensions {
            width: image.get_width() as u32,
            height: image.get_height() as u32,
        })
    }
}

#[napi(string_enum = "lowercase")]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Format {
    Jpeg,
    Jxl,
    Webp,
}

#[napi(string_enum = "lowercase")]
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Effort {
    Low,
    Medium,
    High,
    Max,
}

#[napi(object)]
#[derive(Clone, Copy, Debug)]
pub struct Encode {
    pub format: Format,
    pub quality: u32,
    pub progressive: bool,
    pub effort: Effort,
    pub decoding_tier: u32,
}

impl Effort {
    fn webp(self) -> i32 {
        match self {
            Self::Low => 2,
            Self::Medium => 4,
            Self::High => 5,
            Self::Max => 6,
        }
    }

    fn jxl(self) -> i32 {
        match self {
            Self::Low => 3,
            Self::Medium => 5,
            Self::High => 7,
            Self::Max => 9,
        }
    }
}

impl Encode {
    pub fn carries_hdr(&self) -> bool {
        self.format == Format::Jxl
    }

    pub fn save(&self, image: &Image, path: &str) -> Result<()> {
        let options = VOption::new()
            .set("keep", ForeignKeep::Icc as i32)
            .set("Q", self.quality as i32);
        match self.format {
            Format::Jpeg => {
                let subsample = if self.quality >= 80 {
                    ForeignSubsample::Off
                } else {
                    ForeignSubsample::On
                };
                image.jpegsave_with_opts(
                    path,
                    options
                        .set("interlace", self.progressive)
                        .set("optimize_coding", true)
                        .set("subsample_mode", subsample as i32),
                )?
            }
            Format::Webp => {
                image.webpsave_with_opts(path, options.set("effort", self.effort.webp()))?
            }
            Format::Jxl => image.jxlsave_with_opts(
                path,
                options
                    .set("effort", self.effort.jxl())
                    .set("tier", self.decoding_tier as i32)
                    .set("interlace", self.progressive),
            )?,
        }
        Ok(())
    }
}
