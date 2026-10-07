use immich_core::rotate::{Orientation, rotate};
use jni::EnvUnowned;
use jni::objects::{JClass, JIntArray, JObject};
use jni::sys::{jint, jlong};

use super::bitmap::{self, FORMAT_RGBA_8888};

#[unsafe(no_mangle)]
pub extern "system" fn Java_app_alextran_immich_NativeImage_rotate<'caller>(
    env: EnvUnowned<'caller>,
    _class: JClass<'caller>,
    bitmap: JObject<'caller>,
    orientation: jint,
    out_info: JIntArray<'caller>,
) -> jlong {
    let orientation: Orientation = orientation.into();
    bitmap::transform(
        env,
        bitmap,
        out_info,
        FORMAT_RGBA_8888,
        |w, h| orientation.dimensions(w, h),
        |src, stride, w, h, dst| rotate(src, stride, w, h, orientation, dst),
    )
}
