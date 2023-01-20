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

  static Future<String> _computeEncodeJson(dynamic toEncode) async {
    return json.encode(toEncode);
  }

  Future<void> putRawData(dynamic data) async {
    final jsonString = await compute(_computeEncodeJson, data);

    final file = await _getCacheFile();

    if (!await file.exists()) {
      await file.create();
    }

    await file.writeAsString(jsonString);
  }

  static Future<dynamic> _computeDecodeJson(String jsonString) async {
    return json.decode(jsonString);
  }

  Future<dynamic> readRawData() async {
    final file = await _getCacheFile();
    final data = await file.readAsString();

    return await compute(_computeDecodeJson, data);
  }

  void put(T data);
  Future<T> get();
}
