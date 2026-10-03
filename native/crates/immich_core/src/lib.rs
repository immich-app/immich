pub mod convert;
pub mod rotate;
pub mod thumbhash;

pub fn core_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
