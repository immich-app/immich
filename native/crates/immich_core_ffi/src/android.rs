use jni::EnvUnowned;
use jni::errors::ThrowRuntimeExAndDefault;
use jni::objects::{JByteArray, JByteBuffer, JClass, JIntArray, JObject, JString};
use jni::sys::{jint, jlong, jobject};

use super::log::ImmichCoreLogLevel;
use super::thumbhash::immich_core_thumbhash;

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_core_NativeCore_nativeLog<'caller>(
    mut env: EnvUnowned<'caller>,
    _this: JObject<'caller>,
    dir: JString<'caller>,
    level: jint,
    logger: JString<'caller>,
    message: JString<'caller>,
) {
    let level = match level {
        0 => ImmichCoreLogLevel::Info,
        1 => ImmichCoreLogLevel::Warning,
        2 => ImmichCoreLogLevel::Severe,
        _ => return,
    };
    env.with_env(|env| -> jni::errors::Result<()> {
        let dir = dir.mutf8_chars(env)?.to_str().into_owned();
        let logger = logger.mutf8_chars(env)?.to_str().into_owned();
        let message = message.mutf8_chars(env)?.to_str().into_owned();
        super::log::log(&dir, level, &logger, &message);
        Ok(())
    })
    .resolve::<ThrowRuntimeExAndDefault>();
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_allocate<'caller>(
    _env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    size: jint,
) -> jlong {
    // SAFETY: malloc accepts any size.
    unsafe { libc::malloc(size as usize) as jlong }
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_free<'caller>(
    _env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    address: jlong,
) {
    // SAFETY: the caller passes null or a live C allocation it owns.
    unsafe { libc::free(address as *mut _) };
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_realloc<'caller>(
    _env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    address: jlong,
    size: jint,
) -> jlong {
    // SAFETY: the caller passes null or a live C allocation it owns.
    unsafe { libc::realloc(address as *mut _, size as usize) as jlong }
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_wrap<'caller>(
    env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    address: jlong,
    capacity: jint,
) -> jobject {
    // jni's new_direct_byte_buffer rejects null and clears the java exception, the C did neither.
    let raw = env.as_raw();
    // SAFETY: raw is the VM's JNIEnv and android JNI is at least 1.6, so the 1.4 table exists.
    unsafe { ((**raw).v1_4.NewDirectByteBuffer)(raw, address as *mut _, capacity as jlong) }
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_copy<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    buffer: JByteBuffer<'caller>,
    dest: jlong,
    offset: jint,
    length: jint,
) {
    env.with_env(|env| -> jni::errors::Result<()> {
        if let Ok(src) = env.get_direct_buffer_address(&buffer) {
            // SAFETY: the caller supplies valid, non-overlapping ranges for the copy.
            unsafe {
                let src = src.offset(offset as isize).cast();
                libc::memcpy(dest as *mut _, src, length as usize);
            }
        }
        Ok(())
    })
    .resolve::<ThrowRuntimeExAndDefault>();
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeBuffer_createGlobalRef<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    obj: JObject<'caller>,
) -> jlong {
    env.with_env(|env| -> jni::errors::Result<_> {
        // Transfer the global reference to the caller without deleting it.
        Ok(env.new_global_ref(obj).map_or(0, |r| r.into_raw() as jlong))
    })
    .resolve::<ThrowRuntimeExAndDefault>()
}

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_images_ThumbHash_decode<'caller>(
    mut env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    hash: JByteArray<'caller>,
    info: JIntArray<'caller>,
) -> jlong {
    env.with_env(|env| -> jni::errors::Result<jlong> {
        let hash = env.convert_byte_array(&hash)?;
        let (mut width, mut height) = (0, 0);
        // SAFETY: the hash bytes and both output pointers are valid for this call.
        let rgba =
            unsafe { immich_core_thumbhash(hash.as_ptr(), hash.len(), &mut width, &mut height) };
        if !rgba.is_null()
            && let Err(err) = info.set_region(env, 0, &[width, height, width * 4])
        {
            // SAFETY: this malloc buffer has not been transferred to Dart.
            unsafe { libc::free(rgba.cast()) };
            return Err(err);
        }
        Ok(rgba as jlong)
    })
    .resolve::<ThrowRuntimeExAndDefault>()
}
