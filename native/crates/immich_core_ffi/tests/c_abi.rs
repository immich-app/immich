#![allow(clippy::unwrap_used, clippy::undocumented_unsafe_blocks)]

use std::ffi::CStr;
use std::ptr;

use immich_core_ffi::{
    immich_core_free, immich_core_free_string, immich_core_orientation_swaps_dims,
    immich_core_rgba1010102_to_rgba8888, immich_core_rotate_rgba8888, immich_core_thumbhash_decode,
    immich_core_version,
};

const THUMBHASH: [u8; 21] = [
    0xd5, 0x07, 0x12, 0x1d, 0x04, 0x67, 0x87, 0x8f, 0x77, 0x57, 0x87, 0x48, 0x87, 0x87, 0x97, 0x87,
    0x58, 0x78, 0x90, 0x95, 0x08,
];

#[test]
fn version_is_a_valid_c_string_and_frees() {
    let p = immich_core_version();
    assert!(!p.is_null());
    let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap();
    assert!(!s.is_empty());
    assert!(s.chars().next().unwrap().is_ascii_digit());
    unsafe { immich_core_free_string(p) };
}

#[test]
fn free_string_accepts_null() {
    unsafe { immich_core_free_string(ptr::null_mut()) };
}

#[test]
fn swaps_dims_matches_the_exif_family() {
    for o in [5, 6, 7, 8] {
        assert!(immich_core_orientation_swaps_dims(o), "o={o}");
    }
    for o in [-1, 0, 1, 2, 3, 4, 9] {
        assert!(!immich_core_orientation_swaps_dims(o), "o={o}");
    }
}

#[test]
fn rotate_180_matches_expected_bytes() {
    let src: [u8; 8] = [255, 0, 0, 255, 0, 255, 0, 255];
    let mut dst = [0u8; 8];
    let ok = unsafe {
        immich_core_rotate_rgba8888(src.as_ptr(), src.len(), 8, 2, 1, 3, dst.as_mut_ptr(), 8)
    };
    assert!(ok);
    assert_eq!(dst, [0, 255, 0, 255, 255, 0, 0, 255]);
}

#[test]
fn rotate_90_swaps_output_dims() {
    let src: [u8; 8] = [255, 0, 0, 255, 0, 255, 0, 255];
    let mut dst = [0u8; 8];
    let ok = unsafe {
        immich_core_rotate_rgba8888(src.as_ptr(), src.len(), 8, 2, 1, 6, dst.as_mut_ptr(), 8)
    };
    assert!(ok);
    assert_eq!(dst, [255, 0, 0, 255, 0, 255, 0, 255]);
}

#[test]
fn rotate_rejects_bad_input_without_touching_dst() {
    let src = [0u8; 16];
    let mut dst = [0xAAu8; 16];
    unsafe {
        assert!(!immich_core_rotate_rgba8888(
            ptr::null(),
            16,
            8,
            2,
            2,
            3,
            dst.as_mut_ptr(),
            16
        ));
        assert!(!immich_core_rotate_rgba8888(
            src.as_ptr(),
            16,
            8,
            2,
            2,
            3,
            ptr::null_mut(),
            16
        ));
        assert!(!immich_core_rotate_rgba8888(
            src.as_ptr(),
            8,
            8,
            2,
            2,
            3,
            dst.as_mut_ptr(),
            16
        ));
        assert!(!immich_core_rotate_rgba8888(
            src.as_ptr(),
            16,
            8,
            2,
            2,
            3,
            dst.as_mut_ptr(),
            8
        ));
    }
    assert!(dst.iter().all(|&b| b == 0xAA));
}

#[test]
fn convert_matches_skia_ground_truth() {
    // 179 and 111 distinguish rounded scaling from `>> 2`.
    let px = |r: u32, g: u32, b: u32, a: u32| -> [u8; 4] {
        ((r & 0x3FF) | ((g & 0x3FF) << 10) | ((b & 0x3FF) << 20) | ((a & 0x3) << 30)).to_le_bytes()
    };
    let mut src = Vec::new();
    src.extend_from_slice(&px(1023, 0, 0, 3));
    src.extend_from_slice(&px(179, 111, 0, 3));
    let mut dst = [0u8; 8];
    let ok = unsafe {
        immich_core_rgba1010102_to_rgba8888(src.as_ptr(), src.len(), 8, 2, 1, dst.as_mut_ptr(), 8)
    };
    assert!(ok);
    assert_eq!(&dst[0..4], &[255, 0, 0, 255]);
    assert_eq!(&dst[4..8], &[45, 28, 0, 255]);
}

#[test]
fn convert_rejects_bad_input_without_touching_dst() {
    let src = [0u8; 16];
    let mut dst = [0xAAu8; 16];
    unsafe {
        assert!(!immich_core_rgba1010102_to_rgba8888(
            ptr::null(),
            16,
            8,
            2,
            2,
            dst.as_mut_ptr(),
            16
        ));
        assert!(!immich_core_rgba1010102_to_rgba8888(
            src.as_ptr(),
            16,
            8,
            2,
            2,
            ptr::null_mut(),
            16
        ));
        assert!(!immich_core_rgba1010102_to_rgba8888(
            src.as_ptr(),
            8,
            8,
            2,
            2,
            dst.as_mut_ptr(),
            16
        ));
        assert!(!immich_core_rgba1010102_to_rgba8888(
            src.as_ptr(),
            16,
            8,
            2,
            2,
            dst.as_mut_ptr(),
            8
        ));
    }
    assert!(dst.iter().all(|&b| b == 0xAA));
}

#[test]
fn thumbhash_decodes_into_a_malloc_buffer() {
    let mut info = [0u32; 3];
    let ptr = unsafe {
        immich_core_thumbhash_decode(THUMBHASH.as_ptr(), THUMBHASH.len(), info.as_mut_ptr())
    };
    assert!(!ptr.is_null());
    assert_eq!(info, [23, 32, 92]);

    let len = (info[0] * info[1] * 4) as usize;
    let pixels = unsafe { std::slice::from_raw_parts(ptr, len) };
    assert!(pixels.chunks_exact(4).all(|px| px[3] == 255));
    assert!(pixels.chunks_exact(4).any(|px| px[0] != pixels[0]));
    unsafe { immich_core_free(ptr) };
}

#[test]
fn free_accepts_null() {
    unsafe { immich_core_free(ptr::null_mut()) };
}

#[test]
fn thumbhash_rejects_bad_input() {
    let mut info = [7u32; 3];
    unsafe {
        assert!(immich_core_thumbhash_decode(ptr::null(), 21, info.as_mut_ptr()).is_null());
        assert!(immich_core_thumbhash_decode(THUMBHASH.as_ptr(), 4, info.as_mut_ptr()).is_null());
        assert!(
            immich_core_thumbhash_decode(THUMBHASH.as_ptr(), THUMBHASH.len(), ptr::null_mut())
                .is_null()
        );
    }
    assert_eq!(info, [7, 7, 7]);
}

#[test]
fn runtime_is_shared_across_external_callers() {
    let a = immich_core_ffi::runtime::runtime() as *const _;
    let b = immich_core_ffi::runtime::runtime() as *const _;
    assert_eq!(a, b);
    let out = immich_core_ffi::runtime::runtime().block_on(async { 7 * 6 });
    assert_eq!(out, 42);
}
