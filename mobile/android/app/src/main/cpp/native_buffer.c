#include <jni.h>
#include <stdlib.h>
#include <string.h>

JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeBuffer_allocate(
        JNIEnv *env, jclass clazz, jint size) {
    if (size <= 0) {
        return 0;
    }
    void *ptr = malloc((size_t) size);
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
    if (address == 0 || size <= 0) {
        return 0;
    }
    void *ptr = realloc((void *) address, (size_t) size);
    return (jlong) ptr;
}

JNIEXPORT jobject JNICALL
Java_app_alextran_immich_NativeBuffer_wrap(
        JNIEnv *env, jclass clazz, jlong address, jint capacity) {
    if (address == 0 || capacity <= 0) {
        return NULL;
    }
    return (*env)->NewDirectByteBuffer(env, (void *) address, capacity);
}

JNIEXPORT void JNICALL
Java_app_alextran_immich_NativeBuffer_copy(
        JNIEnv *env, jclass clazz, jobject srcBuffer, jobject destBuffer, jint offset, jint length) {
    if (srcBuffer == NULL || destBuffer == NULL || offset < 0 || length < 0) {
        return;
    }
    jlong srcCapacity = (*env)->GetDirectBufferCapacity(env, srcBuffer);
    jlong destCapacity = (*env)->GetDirectBufferCapacity(env, destBuffer);
    if (srcCapacity < 0 || destCapacity < 0) {
        return;
    }
    if ((jlong) offset + (jlong) length > srcCapacity) {
        return;
    }
    if ((jlong) length > destCapacity) {
        return;
    }
    const char *src = (const char *) (*env)->GetDirectBufferAddress(env, srcBuffer);
    void *dest = (*env)->GetDirectBufferAddress(env, destBuffer);
    if (src == NULL || dest == NULL) {
        return;
    }
    memcpy(dest, src + (size_t) offset, (size_t) length);
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
