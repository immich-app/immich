#[cfg(feature = "codecs")]
pub use codecs;
#[cfg(feature = "server")]
pub mod colour;
#[cfg(feature = "convert")]
pub mod convert;
#[cfg(feature = "server")]
pub mod image;
#[cfg(feature = "server")]
pub mod io;
#[cfg(feature = "rotate")]
pub use codecs::rotate;
#[cfg(feature = "thumbhash")]
pub mod thumbhash;
#[cfg(feature = "server")]
pub mod vips;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
