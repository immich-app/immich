//! Shared native logic for Immich.

#[cfg(feature = "image")]
pub mod image;

#[cfg(feature = "thumbhash")]
pub mod thumbhash;

pub fn core_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_is_present() {
        assert!(!core_version().is_empty());
    }
}
