import 'dart:io';

import 'package:path_provider/path_provider.dart';

@Deprecated("only kept to remove its files after migration")
abstract class JsonCache<T> {
  final String cacheFileName;

  JsonCache(this.cacheFileName);

  Future<File> _getCacheFile() async {
    final basePath = await getTemporaryDirectory();
    final basePathName = basePath.path;

    final file = File("$basePathName/$cacheFileName.bin");

    return file;
  }

  Future<bool> isValid() async {
    final file = await _getCacheFile();
    return await file.exists();
  }

  Future<void> invalidate() async {
    try {
      final file = await _getCacheFile();
      await file.delete();
    } on FileSystemException {
      // file is already deleted
    }
  }

  void put(T data);
  Future<T?> get();
}
