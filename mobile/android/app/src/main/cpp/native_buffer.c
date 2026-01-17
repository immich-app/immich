#include <jni.h>
#include <stdlib.h>
#include <android/bitmap.h>

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_images_LocalImagesImpl_allocateNative(
        JNIEnv *env, jclass clazz, jint size) {
    void *ptr = malloc(size);
    return (jlong) ptr;
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_images_LocalImagesImpl_freeNative(
        JNIEnv *env, jclass clazz, jlong address) {
    free((void *) address);
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_LocalImagesImpl_wrapAsBuffer(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_images_RemoteImagesImpl_lockBitmapPixels(
        JNIEnv *env, jclass clazz, jobject bitmap) {
    void *pixels = NULL;
    int result = AndroidBitmap_lockPixels(env, bitmap, &pixels);
    if (result != ANDROID_BITMAP_RESULT_SUCCESS) {
        return 0;
    }
    return (jlong) pixels;
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_images_RemoteImagesImpl_unlockBitmapPixels(
        JNIEnv *env, jclass clazz, jobject bitmap) {
    AndroidBitmap_unlockPixels(env, bitmap);
}
