use std::env;
use std::process::Command;

// rs-vips names the libraries to link but not where they are.
fn main() {
    println!("cargo:rerun-if-env-changed=PKG_CONFIG_PATH");
    if env::var_os("CARGO_FEATURE_IMAGE").is_none() {
        return;
    }
    let output = Command::new("pkg-config")
        .args(["--libs-only-L", "vips >= 8.19"])
        .output()
        .expect("pkg-config is needed to find libvips");
    assert!(output.status.success(), "libvips 8.19 or later is needed");
    for path in String::from_utf8_lossy(&output.stdout).split_whitespace() {
        if let Some(path) = path.strip_prefix("-L") {
            println!("cargo:rustc-link-search=native={path}");
        }
    }
}
