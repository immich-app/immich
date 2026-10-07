use std::path::Path;

fn main() {
    // Files that define exported items. A directory here would make Flutter rerun the hook every build.
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=cbindgen.toml");
    let crate_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    cbindgen::generate(&crate_dir)
        .unwrap_or_else(|e| panic!("cbindgen failed: {e}"))
        .write_to_file(Path::new(&crate_dir).join("include/immich_core.h"));
}
