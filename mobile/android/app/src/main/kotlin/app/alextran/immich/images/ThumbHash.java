package app.alextran.immich.images;

public final class ThumbHash {
  static {
    // The decode lives in the shared Rust core (immich_core::thumbhash).
    System.loadLibrary("immich_core_ffi");
  }

  /**
   * Decodes a ThumbHash to an RGBA image. RGB is not be premultiplied by A.
   * The pixels live in a native buffer the caller owns (freed via
   * NativeBuffer.free or dart's malloc.free).
   *
   * @param hash The bytes of the ThumbHash.
   * @return The width, height, and pixels of the rendered placeholder image.
   */
  public static Image thumbHashToRGBA(byte[] hash) {
    int[] info = new int[3];
    long pointer = nativeDecode(hash, info);
    if (pointer == 0) {
      throw new IllegalArgumentException("Invalid thumbhash");
    }
    return new Image(info[0], info[1], pointer);
  }

  private static native long nativeDecode(byte[] hash, int[] outInfo);

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
}
