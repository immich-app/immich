use jni::objects::{JClass, JObject};
use jni::sys::{jint, jlong, jobject};
use jni::{EnvUnowned, Outcome};

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_allocate<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    size: jint,
) -> jlong {
    // SAFETY: malloc accepts the converted size and returns null on failure.
    unsafe { libc::malloc(size as usize) as jlong }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_free<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    address: jlong,
) {
    // SAFETY: callers pass a libc allocation from this module, or null.
    unsafe { libc::free(address as usize as *mut libc::c_void) }
}

#[no_mangle]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_realloc<'local>(
    _env: EnvUnowned<'local>,
    _class: JClass<'local>,
    address: jlong,
    size: jint,
) -> jlong {
    // SAFETY: callers pass a libc allocation from this module, or null.
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
            // SAFETY: Kotlin keeps this allocation live while the buffer is used.
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
            // This reference backs a process-wide singleton.
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
