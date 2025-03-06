abstract final class HashUtils {
  /// FNV-1a 64bit hash algorithm optimized for Dart Strings
  static int fastHash(String string) {
    int hash = 0xcbf29ce484222325;

    int i = 0;
    while (i < string.length) {
      final codeUnit = string.codeUnitAt(i++);
      hash ^= codeUnit >> 8;
      hash *= 0x100000001b3;
      hash ^= codeUnit & 0xFF;
      hash *= 0x100000001b3;
    }

    return hash;
  }
}
