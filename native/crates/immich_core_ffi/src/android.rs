use jni::EnvUnowned;
use jni::errors::ThrowRuntimeExAndDefault;
use jni::objects::{JObject, JString};
use jni::sys::jint;

use super::log::ImmichCoreLogLevel;

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
