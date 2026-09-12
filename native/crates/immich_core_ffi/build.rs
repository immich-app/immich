use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Files that define exported items. A directory here would make Flutter rerun the hook every build.
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=src/log.rs");
    println!("cargo:rerun-if-changed=cbindgen.toml");
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    cbindgen::generate(&crate_dir)
        .unwrap_or_else(|e| panic!("cbindgen failed: {e}"))
        .write_to_file(Path::new(&crate_dir).join("include/immich_core.h"));

    // rustc exports only its own no_mangle items from the cdylib. package:sqlite3 loads this
    // library for the sqlite compiled into it, so its C API has to be visible too.
    match env::var("CARGO_CFG_TARGET_OS").unwrap().as_str() {
        "ios" | "macos" => println!("cargo:rustc-cdylib-link-arg=-Wl,-exported_symbol,_sqlite3*"),
        "android" => {
            let map = Path::new(&env::var("OUT_DIR").unwrap()).join("sqlite3.map");
            fs::write(&map, "{ global: sqlite3*; };\n").unwrap();
            println!(
                "cargo:rustc-cdylib-link-arg=-Wl,--version-script={}",
                map.display()
            );
        }
        _ => {}
    }
}
