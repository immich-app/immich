#include <jni.h>
#include <stdlib.h>
#include <string.h>

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeBuffer_allocate(
        JNIEnv *env, jclass clazz, jint size) {
    void *ptr = malloc(size);
    return (jlong) ptr;
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_NativeBuffer_free(
        JNIEnv *env, jclass clazz, jlong address) {
    free((void *) address);
}

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeBuffer_realloc(
        JNIEnv *env, jclass clazz, jlong address, jint size) {
    void *ptr = realloc((void *) address, size);
    return (jlong) ptr;
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_NativeBuffer_wrap(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_NativeBuffer_copy(
        JNIEnv *env, jclass clazz, jobject buffer, jlong destAddress, jint offset, jint length) {
    void *src = (*env)->GetDirectBufferAddress(env, buffer);
    if (src != NULL) {
        memcpy((void *) destAddress, (char *) src + offset, length);
    }
}

/**
 * Creates a JNI global reference to the given object and returns its address.
 * The caller is responsible for deleting the global reference when it's no longer needed.
 */
JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeBuffer_createGlobalRef(JNIEnv *env, jobject clazz, jobject obj) {
    if (obj == NULL) {
        return 0;
    }

    jobject globalRef = (*env)->NewGlobalRef(env, obj);
    return (jlong) globalRef;
}
