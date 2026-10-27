pub mod color;
pub mod convert;
pub mod image;
pub mod jxl;
mod resize;
pub mod rotate;
pub mod thumbhash;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
