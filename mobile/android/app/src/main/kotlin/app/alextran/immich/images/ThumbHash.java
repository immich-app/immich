package app.alextran.immich.images;

// Copyright (c) 2023 Evan Wallace
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import java.nio.ByteBuffer;

// modified to use native allocations
public final class ThumbHash {
  /**
   * Decodes a ThumbHash to an RGBA image. RGB is not be premultiplied by A.
   *
   * @param hash The bytes of the ThumbHash.
   * @return The width, height, and pixels of the rendered placeholder image.
   */
  public static Image thumbHashToRGBA(byte[] hash) {
    // Read the constants
    int header24 = (hash[0] & 255) | ((hash[1] & 255) << 8) | ((hash[2] & 255) << 16);
    int header16 = (hash[3] & 255) | ((hash[4] & 255) << 8);
    float l_dc = (float) (header24 & 63) / 63.0f;
    float p_dc = (float) ((header24 >> 6) & 63) / 31.5f - 1.0f;
    float q_dc = (float) ((header24 >> 12) & 63) / 31.5f - 1.0f;
    float l_scale = (float) ((header24 >> 18) & 31) / 31.0f;
    boolean hasAlpha = (header24 >> 23) != 0;
    float p_scale = (float) ((header16 >> 3) & 63) / 63.0f;
    float q_scale = (float) ((header16 >> 9) & 63) / 63.0f;
    boolean isLandscape = (header16 >> 15) != 0;
    int lx = Math.max(3, isLandscape ? hasAlpha ? 5 : 7 : header16 & 7);
    int ly = Math.max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7);
    float a_dc = hasAlpha ? (float) (hash[5] & 15) / 15.0f : 1.0f;
    float a_scale = (float) ((hash[5] >> 4) & 15) / 15.0f;

    // Read the varying factors (boost saturation by 1.25x to compensate for quantization)
    int ac_start = hasAlpha ? 6 : 5;
    int ac_index = 0;
    Channel l_channel = new Channel(lx, ly);
    Channel p_channel = new Channel(3, 3);
    Channel q_channel = new Channel(3, 3);
    Channel a_channel = null;
    ac_index = l_channel.decode(hash, ac_start, ac_index, l_scale);
    ac_index = p_channel.decode(hash, ac_start, ac_index, p_scale * 1.25f);
    ac_index = q_channel.decode(hash, ac_start, ac_index, q_scale * 1.25f);
    if (hasAlpha) {
      a_channel = new Channel(5, 5);
      a_channel.decode(hash, ac_start, ac_index, a_scale);
    }
    float[] l_ac = l_channel.ac;
    float[] p_ac = p_channel.ac;
    float[] q_ac = q_channel.ac;
    float[] a_ac = hasAlpha ? a_channel.ac : null;

    // Decode using the DCT into RGB
    float ratio = thumbHashToApproximateAspectRatio(hash);
    int w = Math.round(ratio > 1.0f ? 32.0f : 32.0f * ratio);
    int h = Math.round(ratio > 1.0f ? 32.0f / ratio : 32.0f);
    int size = w * h * 4;
    long pointer = ThumbnailsImpl.allocateNative(size);
    ByteBuffer rgba = ThumbnailsImpl.wrapAsBuffer(pointer, size);
    int cx_stop = Math.max(lx, hasAlpha ? 5 : 3);
    int cy_stop = Math.max(ly, hasAlpha ? 5 : 3);
    float[] fx = new float[cx_stop];
    float[] fy = new float[cy_stop];
    for (int y = 0, i = 0; y < h; y++) {
      for (int x = 0; x < w; x++, i += 4) {
        float l = l_dc, p = p_dc, q = q_dc, a = a_dc;

        // Precompute the coefficients
        for (int cx = 0; cx < cx_stop; cx++)
          fx[cx] = (float) Math.cos(Math.PI / w * (x + 0.5f) * cx);
        for (int cy = 0; cy < cy_stop; cy++)
          fy[cy] = (float) Math.cos(Math.PI / h * (y + 0.5f) * cy);

        // Decode L
        for (int cy = 0, j = 0; cy < ly; cy++) {
          float fy2 = fy[cy] * 2.0f;
          for (int cx = cy > 0 ? 0 : 1; cx * ly < lx * (ly - cy); cx++, j++)
            l += l_ac[j] * fx[cx] * fy2;
        }

        // Decode P and Q
        for (int cy = 0, j = 0; cy < 3; cy++) {
          float fy2 = fy[cy] * 2.0f;
          for (int cx = cy > 0 ? 0 : 1; cx < 3 - cy; cx++, j++) {
            float f = fx[cx] * fy2;
            p += p_ac[j] * f;
            q += q_ac[j] * f;
          }
        }

        // Decode A
        if (hasAlpha)
          for (int cy = 0, j = 0; cy < 5; cy++) {
            float fy2 = fy[cy] * 2.0f;
            for (int cx = cy > 0 ? 0 : 1; cx < 5 - cy; cx++, j++)
              a += a_ac[j] * fx[cx] * fy2;
          }

        // Convert to RGB
        float b = l - 2.0f / 3.0f * p;
        float r = (3.0f * l - b + q) / 2.0f;
        float g = r - q;
        rgba.put(i, (byte) Math.max(0, Math.round(255.0f * Math.min(1, r))));
        rgba.put(i + 1, (byte) Math.max(0, Math.round(255.0f * Math.min(1, g))));
        rgba.put(i + 2, (byte) Math.max(0, Math.round(255.0f * Math.min(1, b))));
        rgba.put(i + 3, (byte) Math.max(0, Math.round(255.0f * Math.min(1, a))));
      }
    }
    return new Image(w, h, pointer);
  }

  /**
   * Extracts the approximate aspect ratio of the original image.
   *
   * @param hash The bytes of the ThumbHash.
   * @return The approximate aspect ratio (i.e. width / height).
   */
  public static float thumbHashToApproximateAspectRatio(byte[] hash) {
    byte header = hash[3];
    boolean hasAlpha = (hash[2] & 0x80) != 0;
    boolean isLandscape = (hash[4] & 0x80) != 0;
    int lx = isLandscape ? hasAlpha ? 5 : 7 : header & 7;
    int ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7;
    return (float) lx / (float) ly;
  }

  public static final class Image {
    public int width;
    public int height;
    public long pointer;

    public Image(int width, int height, long pointer) {
      this.width = width;
      this.height = height;
      this.pointer = pointer;
    }
  }

  private static final class Channel {
    int nx;
    int ny;
    float[] ac;

    Channel(int nx, int ny) {
      this.nx = nx;
      this.ny = ny;
      int n = 0;
      for (int cy = 0; cy < ny; cy++)
        for (int cx = cy > 0 ? 0 : 1; cx * ny < nx * (ny - cy); cx++)
          n++;
      ac = new float[n];
    }

    int decode(byte[] hash, int start, int index, float scale) {
      for (int i = 0; i < ac.length; i++) {
        int data = hash[start + (index >> 1)] >> ((index & 1) << 2);
        ac[i] = ((float) (data & 15) / 7.5f - 1.0f) * scale;
        index++;
      }
      return index;
    }
  }
}
