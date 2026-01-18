#include <jni.h>
#include <stdlib.h>

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

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_images_LocalImagesImpl_reallocNative(
        JNIEnv *env, jclass clazz, jlong address, jint size) {
    void *ptr = realloc((void *) address, size);
    return (jlong) ptr;
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_images_LocalImagesImpl_wrapAsBuffer(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}
