#[cfg(feature = "codecs")]
pub use codecs;
#[cfg(feature = "convert")]
pub mod convert;
#[cfg(feature = "rotate")]
pub use codecs::rotate;
#[cfg(feature = "thumbhash")]
pub mod thumbhash;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
