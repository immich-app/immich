import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:openapi/api.dart';
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
    final file = await _getCacheFile();
    await file.delete();
  }

  Future<void> putRawData(dynamic data) async {
    final jsonString = json.encode(data);
    final file = await _getCacheFile();

    if (!await file.exists()) {
      await file.create();
    }

    await file.writeAsString(jsonString);
  }

  dynamic readRawData() async {
    final file = await _getCacheFile();
    final data = await file.readAsString();
    return json.decode(data);
  }

  void put(T data);
  Future<T> get();
}

class AssetCacheService extends JsonCache<List<AssetResponseDto>> {
  AssetCacheService() : super("asset_cache");

  @override
  void put(List<AssetResponseDto> data) {
    putRawData(data.map((e) => e.toJson()).toList());
  }

  @override
  Future<List<AssetResponseDto>> get() async {
    try {
      final mapList = await readRawData() as List<dynamic>;

      final responseData = mapList
          .map((e) => AssetResponseDto.fromJson(e))
          .whereNotNull()
          .toList();

      return responseData;
    } catch (e) {
      debugPrint(e.toString());

      return [];
    }
  }
}

final assetCacheServiceProvider = Provider(
      (ref) => AssetCacheService(),
);
