pub mod convert;
pub mod rotate;
pub mod thumbhash;

pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
