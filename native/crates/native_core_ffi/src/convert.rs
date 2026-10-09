use jni::EnvUnowned;
use jni::objects::{JClass, JIntArray, JObject};
use jni::sys::jlong;
use native_core::convert::convert_1010102;

use super::bitmap::{self, FORMAT_RGBA_1010102};

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_convert1010102<'caller>(
    env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    bitmap: JObject<'caller>,
    out_info: JIntArray<'caller>,
) -> jlong {
    bitmap::transform(
        env,
        bitmap,
        out_info,
        FORMAT_RGBA_1010102,
        |w, h| (w, h),
        convert_1010102,
    )
}
