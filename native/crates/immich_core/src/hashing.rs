//! SHA-1 hashing. SHA-1 is immich's asset-identity checksum (server contract):
//! the algorithm is fixed. The win is in HOW it's computed — `sha1_file` mmaps the
//! file and feeds the OS-paged bytes straight to a hardware-accelerated digest, so
//! the whole file never lands in the caller's heap and there's no read+copy hop.

use sha1::{Digest, Sha1};
use std::fmt::Write;
use std::fs::File;
use std::io;
use std::path::Path;

/// Lowercase-hex SHA-1 of a byte slice.
pub fn sha1_hex(bytes: &[u8]) -> String {
    let digest = Sha1::digest(bytes);
    let mut out = String::with_capacity(40);
    for b in digest {
        let _ = write!(out, "{b:02x}");
    }
    out
}

/// Lowercase-hex SHA-1 of the file at `path`, read via mmap. The OS pages the file
/// in on demand, so memory stays bounded regardless of file size — no full read
/// into a buffer, no copy.
pub fn sha1_file(path: impl AsRef<Path>) -> io::Result<String> {
    let file = File::open(path)?;
    if file.metadata()?.len() == 0 {
        return Ok(sha1_hex(&[]));
    }
    // SAFETY: the file is opened read-only and the mapping is read as immutable
    // bytes for the duration of the hash. immich assets are not mutated in place;
    // a concurrent truncation could SIGBUS, which is the documented mmap trade-off.
    let mmap = unsafe { memmap2::Mmap::map(&file)? };
    Ok(sha1_hex(&mmap))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha1_known_vector() {
        // FIPS-180 worked example.
        assert_eq!(sha1_hex(b"abc"), "a9993e364706816aba3e25717850c26c9cd0d89d");
    }

    #[test]
    fn sha1_empty() {
        assert_eq!(sha1_hex(b""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    }

    #[test]
    fn sha1_file_matches_in_memory() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("immich_core_sha1_file_{}.bin", std::process::id()));
        let data: Vec<u8> = (0..100_000u32).map(|i| (i % 251) as u8).collect();
        std::fs::write(&path, &data).unwrap();
        assert_eq!(sha1_file(&path).unwrap(), sha1_hex(&data));
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn sha1_file_empty() {
        let path =
            std::env::temp_dir().join(format!("immich_core_empty_{}.bin", std::process::id()));
        std::fs::write(&path, b"").unwrap();
        assert_eq!(sha1_file(&path).unwrap(), sha1_hex(b""));
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn sha1_file_missing_errors() {
        assert!(sha1_file("/no/such/immich_core/file").is_err());
    }
}
