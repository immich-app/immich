#include <jni.h>

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_00024Companion_wrapPointer(
    JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void*)address, capacity);
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_wrapPointer(
    JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void*)address, capacity);
}
