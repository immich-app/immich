#include <jni.h>
#include <stdlib.h>
#include <stdint.h>
#include <android/bitmap.h>

// Cache-friendly block size for the tiled rotation (in pixels). 32x32 uint32 = 4KB, fits L1.
#define TILE 32

// EXIF orientation values (androidx.exifinterface.media.ExifInterface.ORIENTATION_*).
enum {
  ORIENTATION_FLIP_HORIZONTAL = 2,
  ORIENTATION_ROTATE_180 = 3,
  ORIENTATION_FLIP_VERTICAL = 4,
  ORIENTATION_TRANSPOSE = 5,
  ORIENTATION_ROTATE_90 = 6,
  ORIENTATION_TRANSVERSE = 7,
  ORIENTATION_ROTATE_270 = 8,
};

// The orientations that swap width and height. Must stay in sync with affine_for's dim usage.
static int swaps_dims(int o) {
  return o == ORIENTATION_ROTATE_90 || o == ORIENTATION_ROTATE_270 ||
         o == ORIENTATION_TRANSPOSE || o == ORIENTATION_TRANSVERSE;
}

// A source pixel (sx, sy) maps to destination index base + sx*stepX + sy*stepY, where dw is the
// destination width. This affine form covers all 8 EXIF orientations and matches the pixel layout
// of Bitmap.createBitmap(src, matrixForExifOrientation(o)). int64_t so it stays correct on
// armeabi-v7a (32-bit long) regardless of how large MAX_RAW_DECODE_PIXELS grows.
static void affine_for(int o, int sw, int sh, int dw, int64_t *base, int64_t *stepX, int64_t *stepY) {
  switch (o) {
    case ORIENTATION_ROTATE_90:       *base = sh - 1;                             *stepX = dw;  *stepY = -1;  break;
    case ORIENTATION_ROTATE_270:      *base = (int64_t) (sw - 1) * dw;            *stepX = -dw; *stepY = 1;   break;
    case ORIENTATION_ROTATE_180:      *base = (int64_t) (sh - 1) * dw + (sw - 1); *stepX = -1;  *stepY = -dw; break;
    case ORIENTATION_FLIP_HORIZONTAL: *base = sw - 1;                             *stepX = -1;  *stepY = dw;  break;
    case ORIENTATION_FLIP_VERTICAL:   *base = (int64_t) (sh - 1) * dw;            *stepX = 1;   *stepY = -dw; break;
    case ORIENTATION_TRANSPOSE:       *base = 0;                                  *stepX = dw;  *stepY = 1;   break;
    case ORIENTATION_TRANSVERSE:      *base = (int64_t) (sw - 1) * dw + (sh - 1); *stepX = -dw; *stepY = -1;  break;
    default:                          *base = 0;                                  *stepX = 1;   *stepY = dw;  break;
  }
}

// Copy each source pixel (whole uint32, so channel order/premult is irrelevant) to its rotated
// destination, walking TILE x TILE blocks so the scattered writes of a 90/270 transpose stay
// cache-resident. dst is densely packed (rowBytes == dw*4, no padding), which the affine math relies on.
static void rotate_tiled(const uint8_t *src, int srcStride, uint32_t *dst,
                         int sw, int sh, int64_t base, int64_t stepX, int64_t stepY) {
  for (int ty = 0; ty < sh; ty += TILE) {
    int yEnd = ty + TILE < sh ? ty + TILE : sh;
    for (int tx = 0; tx < sw; tx += TILE) {
      int xEnd = tx + TILE < sw ? tx + TILE : sw;
      for (int sy = ty; sy < yEnd; sy++) {
        const uint32_t *srcRow = (const uint32_t *) (src + (size_t) sy * srcStride);
        int64_t idx = base + (int64_t) sy * stepY + (int64_t) tx * stepX;
        for (int sx = tx; sx < xEnd; sx++) {
          dst[idx] = srcRow[sx];
          idx += stepX;
        }
      }
    }
  }
}

// Rotates an RGBA_8888 bitmap to the given EXIF orientation into a freshly malloc'd buffer (free it
// via NativeBuffer.free). Fills outInfo with {width, height, rowBytes} and returns the buffer
// address, or 0 if the bitmap can't be handled (e.g. a non-8888 format) so the caller can fall back.
JNIEXPORT jlong JNICALL
Java_app_alextran_immich_NativeImage_rotate(
    JNIEnv *env, jclass clazz, jobject bitmap, jint orientation, jintArray outInfo) {
  AndroidBitmapInfo info;
  if (AndroidBitmap_getInfo(env, bitmap, &info) != ANDROID_BITMAP_RESULT_SUCCESS) {
    return 0;
  }
  if (info.format != ANDROID_BITMAP_FORMAT_RGBA_8888) {
    return 0;
  }

  int sw = (int) info.width;
  int sh = (int) info.height;
  int dw = swaps_dims(orientation) ? sh : sw;
  int dh = swaps_dims(orientation) ? sw : sh;

  uint32_t *dst = (uint32_t *) malloc((size_t) dw * dh * 4);
  if (dst == NULL) {
    return 0;
  }

  void *srcPixels = NULL;
  if (AndroidBitmap_lockPixels(env, bitmap, &srcPixels) != ANDROID_BITMAP_RESULT_SUCCESS) {
    free(dst);
    return 0;
  }

  int64_t base, stepX, stepY;
  affine_for(orientation, sw, sh, dw, &base, &stepX, &stepY);
  rotate_tiled((const uint8_t *) srcPixels, (int) info.stride, dst, sw, sh, base, stepX, stepY);

  AndroidBitmap_unlockPixels(env, bitmap);

  jint dims[3] = {dw, dh, dw * 4};
  (*env)->SetIntArrayRegion(env, outInfo, 0, 3, dims);
  // Keep ownership in C until the buffer is safely handed back: if outInfo was somehow too small,
  // SetIntArrayRegion left a pending exception and Kotlin will never receive (or free) dst.
  if ((*env)->ExceptionCheck(env)) {
    free(dst);
    return 0;
  }
  return (jlong) dst;
}
