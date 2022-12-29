import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

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

  Future<void> putRawData(dynamic data) async {
    encodeJson(dynamic toEncode) {
      return json.encode(toEncode);
    }

    final jsonString = await compute(encodeJson, data);

    final file = await _getCacheFile();

    if (!await file.exists()) {
      await file.create();
    }

    await file.writeAsString(jsonString);
  }

  dynamic readRawData() async {
    final file = await _getCacheFile();
    final data = await file.readAsString();

    decodeJson(String jsonData) {
      return json.decode(jsonData);
    }

    return await compute(decodeJson, data);
  }

  void put(T data);
  Future<T> get();
}
