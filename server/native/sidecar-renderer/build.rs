fn main() {
    use std::hash::{Hash, Hasher};
    let mut hash = std::collections::hash_map::DefaultHasher::new();
    for path in [
        "build.rs",
        "Cargo.toml",
        "Cargo.lock",
        "src/main.rs",
        "src/decode.rs",
        "src/render.rs",
        "src/xmp.rs",
        "src/libraw_shim.cpp",
    ] {
        println!("cargo:rerun-if-changed={path}");
        path.hash(&mut hash);
        std::fs::read(path)
            .expect("read renderer build input")
            .hash(&mut hash);
    }
    println!(
        "cargo:rustc-env=IMMICH_RENDERER_BUILD={:016x}",
        hash.finish()
    );
    println!("cargo:rerun-if-env-changed=LIBRAW_INCLUDE_DIR");
    println!("cargo:rerun-if-env-changed=LIBRAW_LIB_DIR");
    println!("cargo:rerun-if-env-changed=IMMICH_LIGHTCRAFT_REV");
    let mut shim = cc::Build::new();
    shim.cpp(true).std("c++17").file("src/libraw_shim.cpp");
    if let Some(include) = std::env::var_os("LIBRAW_INCLUDE_DIR") {
        shim.include(include);
        if let Some(lib) = std::env::var_os("LIBRAW_LIB_DIR") {
            println!("cargo:rustc-link-search=native={}", lib.to_string_lossy());
        }
        println!("cargo:rustc-link-lib=raw_r");
    } else {
        let library = pkg_config::Config::new()
            .atleast_version("0.21")
            .probe("libraw_r")
            .expect("install libraw-dev (>=0.21), or set LIBRAW_INCLUDE_DIR and LIBRAW_LIB_DIR");
        for include in library.include_paths {
            shim.include(include);
        }
    }
    shim.compile("immich_libraw_shim");
}
