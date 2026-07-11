use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=src");
    println!("cargo:rerun-if-changed=cbindgen.toml");

    let crate_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let out = Path::new(&crate_dir).join("include").join("immich_core.h");
    std::fs::create_dir_all(out.parent().unwrap()).ok();

    // Hard-fail, not a warning: the header is committed and consumed by ffigen +
    // Swift, so a silent codegen failure would leave a stale header in the tree.
    match cbindgen::generate(&crate_dir) {
        Ok(bindings) => {
            bindings.write_to_file(&out);
        }
        Err(e) => panic!("cbindgen failed: {e}"),
    }
}
