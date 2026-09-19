#include <jni.h>
#include <stdlib.h>
#include <stdint.h>
#include <android/bitmap.h>

// Convert an RGBA_1010102 buffer to densely-packed RGBA_8888, matching Skia's
// Bitmap.copy(ARGB_8888) byte-for-byte so it's a drop-in for the intermediate 8888 bitmap.
// Each source pixel is a native (little-endian on every Android ABI) u32 with R in bits 0-9,
// G in 10-19, B in 20-29, A in 30-31 (standard RGB10_A2). Each 10-bit channel maps to 8-bit via
// round(v*255/1023). The 2-bit alpha maps to a*85. Both are kept as plain arithmetic as the whole
// loop auto-vectorizes to NEON and measures faster than a LUT on-device. Output is R,G,B,A bytes
// per pixel, i.e. Android ARGB_8888 memory == Dart PixelFormat.rgba8888.
static void convert_1010102(const uint8_t *src, int srcStride, uint32_t *dst, int w, int h) {
  for (int y = 0; y < h; y++) {
    const uint32_t *srcRow = (const uint32_t *) (src + (size_t) y * srcStride);
    uint32_t *dstRow = dst + (size_t) y * w;
    for (int x = 0; x < w; x++) {
      uint32_t px = srcRow[x];
      uint32_t r = ((px & 0x3FF) * 16336u + 32768u) >> 16;
      uint32_t g = (((px >> 10) & 0x3FF) * 16336u + 32768u) >> 16;
      uint32_t b = (((px >> 20) & 0x3FF) * 16336u + 32768u) >> 16;
      uint32_t a = ((px >> 30) & 0x3) * 85u;
      dstRow[x] = r | (g << 8) | (b << 16) | (a << 24);
    }
  }
}

// Converts an RGBA_1010102 bitmap (what a 10-bit HEIC/AVIF decodes to on API 33+) into a freshly
// malloc'd RGBA_8888 buffer. Fills outInfo with {width, height, rowBytes} and returns the buffer
// address, or 0 (so the caller falls back to a Skia copy) if the bitmap isn't 1010102 or can't be
// locked. Same ownership contract as rotate: free the returned buffer via NativeBuffer.free.
JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeImage_convert1010102(
    JNIEnv *env, jclass clazz, jobject bitmap, jintArray outInfo) {
  AndroidBitmapInfo info;
  if (AndroidBitmap_getInfo(env, bitmap, &info) != ANDROID_BITMAP_RESULT_SUCCESS) {
    return 0;
  }
  if (info.format != ANDROID_BITMAP_FORMAT_RGBA_1010102) {
    return 0;
  }

  int w = (int) info.width;
  int h = (int) info.height;

  uint32_t *dst = (uint32_t *) malloc((size_t) w * h * 4);
  if (dst == NULL) {
    return 0;
  }

  void *srcPixels = NULL;
  if (AndroidBitmap_lockPixels(env, bitmap, &srcPixels) != ANDROID_BITMAP_RESULT_SUCCESS) {
    free(dst);
    return 0;
  }

  convert_1010102((const uint8_t *) srcPixels, (int) info.stride, dst, w, h);

  AndroidBitmap_unlockPixels(env, bitmap);

  jint dims[3] = {w, h, w * 4};
  (*env)->SetIntArrayRegion(env, outInfo, 0, 3, dims);
  if ((*env)->ExceptionCheck(env)) {
    free(dst);
    return 0;
  }
  return (jlong) dst;
}
