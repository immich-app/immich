abstract final class IsarHelpers {
  const IsarHelpers._();

  /// FNV-1a 64bit hash algorithm optimized for Dart Strings
  /// Ref: https://isar.dev/recipes/string_ids.html#fast-hash-function
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
