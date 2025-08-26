#include <jni.h>
#include <stdlib.h>

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_00024Companion_allocateNative(
        JNIEnv *env, jclass clazz, jint size) {
    void *ptr = malloc(size);
    return (jlong) ptr;
}

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_allocateNative(
        JNIEnv *env, jclass clazz, jint size) {
    void *ptr = malloc(size);
    return (jlong) ptr;
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_00024Companion_freeNative(
        JNIEnv *env, jclass clazz, jlong address) {
    free((void *) address);
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_freeNative(
        JNIEnv *env, jclass clazz, jlong address) {
    free((void *) address);
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_00024Companion_wrapAsBuffer(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_ThumbnailsImpl_wrapAsBuffer(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}
