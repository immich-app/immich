use std::path::Path;

fn main() {
    // Directory entries in Cargo's dep-info make Flutter rerun the hook every build.
    // Add new files here when they define exported items.
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=src/capi/mod.rs");
    println!("cargo:rerun-if-changed=src/capi/image.rs");
    println!("cargo:rerun-if-changed=src/capi/thumbhash.rs");
    println!("cargo:rerun-if-changed=cbindgen.toml");

    let crate_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let out = Path::new(&crate_dir).join("include").join("immich_core.h");
    std::fs::create_dir_all(out.parent().unwrap()).ok();

    match cbindgen::generate(&crate_dir) {
        Ok(bindings) => {
            bindings.write_to_file(&out);
        }
        Err(e) => panic!("cbindgen failed: {e}"),
    }
}
