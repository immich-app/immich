//! `NativeBuffer` — the libc-heap allocator Kotlin and Dart share. Ports of the
//! former native_buffer.c, preserving its exact contracts.
//!
//! `jint` sizes/offsets sign-extend through `as usize` exactly like C's
//! `int` → `size_t` conversion, so negative inputs stay huge-and-failing (malloc
//! returns NULL) rather than becoming new behavior.
//!
//! The env-using calls run inside `EnvUnowned::with_env`, which upgrades the
//! FFI-safe native-method env to a real `Env` and wraps the closure in
//! `catch_unwind` — so a JNI error or a panic maps to the sentinel (0/null) and
//! the caller falls back, never unwinding into the JVM. The pure allocator calls
//! don't touch the env and contain no panicking code, so they run directly.

use jni::objects::{JByteBuffer, JClass, JObject};
use jni::sys::{jint, jlong, jobject};
use jni::{EnvUnowned, Outcome};

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_allocate<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    size: jint,
) -> jlong {
    // SAFETY: plain libc allocation; a negative size sign-extends huge and malloc
    // returns NULL, which flows back to Kotlin as 0 — same as the C it replaces.
    unsafe { libc::malloc(size as usize) as jlong }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_free<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    address: jlong,
) {
    // SAFETY: `address` came from allocate/realloc above (libc heap), or is 0,
    // which libc free accepts as a no-op.
    unsafe { libc::free(address as usize as *mut libc::c_void) }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_realloc<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    address: jlong,
    size: jint,
) -> jlong {
    // SAFETY: exact libc realloc semantics — NULL acts as malloc, OOM returns NULL
    // without freeing the original. The grown pointer is later freed by Dart, so it
    // must stay on the libc heap.
    unsafe { libc::realloc(address as usize as *mut libc::c_void, size as usize) as jlong }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_wrap<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    address: jlong,
    capacity: jint,
) -> jobject {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jobject> {
            // SAFETY: `address`/`capacity` describe a live allocation from allocate or
            // realloc; the ByteBuffer only borrows it and Kotlin controls the lifetime.
            let buffer = unsafe {
                env.new_direct_byte_buffer(address as usize as *mut u8, capacity as usize)
            }?;
            Ok(buffer.into_raw())
        })
        .into_outcome();
    match outcome {
        Outcome::Ok(buffer) => buffer,
        Outcome::Err(e) => {
            super::log_error(&format!("buffer wrap failed: {e}"));
            std::ptr::null_mut()
        }
        Outcome::Panic(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_copy<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    buffer: JByteBuffer<'local>,
    dest_address: jlong,
    offset: jint,
    length: jint,
) {
    // A non-direct buffer makes get_direct_buffer_address return Err, which becomes
    // Outcome::Err here: a silent no-op, exactly like the C's NULL check.
    crate::log::ensure_panic_hook();
    let _ = env
        .with_env(|env| -> jni::errors::Result<()> {
            let src = env.get_direct_buffer_address(&buffer)?;
            if !src.is_null() {
                // SAFETY: `src` is the direct buffer's backing store and `dest` is a
                // live libc allocation sized by the caller.
                unsafe {
                    libc::memcpy(
                        dest_address as usize as *mut libc::c_void,
                        src.add(offset as usize) as *const libc::c_void,
                        length as usize,
                    );
                }
            }
            Ok(())
        })
        .into_outcome();
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_createGlobalRef<'local>(
    mut env: EnvUnowned<'local>,
    _class: JClass<'local>,
    obj: JObject<'local>,
) -> jlong {
    crate::log::ensure_panic_hook();
    let outcome = env
        .with_env(|env| -> jni::errors::Result<jlong> {
            if obj.is_null() {
                return Ok(0);
            }
            // The caller owns the reference for the process lifetime (it backs a
            // never-released singleton), so hand out the raw ref and leak the wrapper
            // via into_raw — dropping the Global would delete the ref under Kotlin.
            Ok(env.new_global_ref(&obj)?.into_raw() as jlong)
        })
        .into_outcome();
    match outcome {
        Outcome::Ok(raw) => raw,
        Outcome::Err(e) => {
            super::log_error(&format!("global ref failed: {e}"));
            0
        }
        Outcome::Panic(_) => 0,
    }
}
