import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:photo_manager/photo_manager.dart';

class HashService {
  HashService(this._db, this._backgroundService);
  final Isar _db;
  final BackgroundService _backgroundService;
  final _log = Logger('HashService');

  Future<List<Asset>> getHashedAssets(
    AssetPathEntity album, {
    int start = 0,
    int end = 0x7fffffffffffffff,
    Set<String>? excludedAssets,
  }) async {
    final entities = await album.getAssetListRange(start: start, end: end);
    final filtered = excludedAssets == null
        ? entities
        : entities.where((e) => !excludedAssets.contains(e.id)).toList();
    return hashAssets(filtered);
  }

  Future<List<int>?> hashAsset(Asset a) async {
    assert(a.isLocal, "can only get hash of local assets");
    final deviceAsset = await (Platform.isAndroid
        ? _db.androidDeviceAssets.get(a.localId!.toInt())
        : _db.iOSDeviceAssets.getById(a.localId!));
    if (deviceAsset != null) return deviceAsset.hash;
    final file = await a.local!.originFile;
    if (file == null) {
      _log.warning("Failed to get file for asset ${a.id}, skipping");
      return null;
    }
    final hash =
        await (Platform.isAndroid ? _hashFile(file) : _hashAssetCrypto(file));
    if (hash == null) {
      _log.warning("Failed to hash file ${file.path} for asset ${a.id}");
      return null;
    }
    if (Platform.isAndroid) {
      final da = AndroidDeviceAsset(id: a.localId!.toInt(), hash: hash);
      await _db.writeTxn(() => _db.androidDeviceAssets.put(da));
    } else {
      final da = IOSDeviceAsset(id: a.localId!, hash: hash);
      await _db.writeTxn(() => _db.iOSDeviceAssets.put(da));
    }
    return hash;
  }

  Future<List<Asset>> hashAssets(List<AssetEntity> assets) async {
    final Stopwatch totalTime = Stopwatch()..start();
    const int batchFileCount = 128;
    const int batchDataSize = 1024 * 1024 * 1024; // 1GB
    int totalBytes = 0;
    int totalFiles = 0;
    final List<DeviceAsset?> hashes;
    final Stopwatch sw = Stopwatch()..start();
    final List<DeviceAsset> toAdd = [];
    final ids = assets
        .map(Platform.isAndroid ? (a) => a.id.toInt() : (a) => a.id)
        .toList();
    hashes = await (Platform.isAndroid
        ? _db.androidDeviceAssets.getAll(ids.cast())
        : _db.iOSDeviceAssets.getAllById(ids.cast()));
    debugPrint("Checking hash DB took ${sw.elapsedMilliseconds}ms");
    sw.reset();
    int bytes = 0;
    final List<String> toHash = [];
    for (int i = 0; i < assets.length; i++) {
      if (hashes[i] != null) continue;
      final file = await assets[i].originFile;
      if (file == null) {
        _log.warning("Failed to get file for asset ${assets[i].id}, skipping");
        continue;
      }
      bytes += file.lengthSync();
      toHash.add(file.path);
      final da = Platform.isAndroid
          ? AndroidDeviceAsset(id: ids[i] as int, hash: const [])
          : IOSDeviceAsset(id: ids[i] as String, hash: const []);
      toAdd.add(da);
      totalFiles++;
      hashes[i] = da;
      if (toHash.length == batchFileCount ||
          bytes >= batchDataSize ||
          (i + 1 == assets.length && toHash.isNotEmpty)) {
        final h = await _hashFiles(toHash);
        bool anyNull = false;
        for (int j = 0; j < h.length; j++) {
          if (h[j] != null) {
            toAdd[j].hash = h[j]!;
          } else {
            _log.warning("Failed to hash file ${toHash[j]}, skipping");
            anyNull = true;
          }
        }
        debugPrint(
          "Hashing ${toAdd.length} files / $bytes b took ${sw.elapsedMilliseconds}ms: ${(bytes / (1024 * 1024.0)) / sw.elapsedMilliseconds * 1000} mb/s",
        );
        final validHashes =
            anyNull ? toAdd.where((e) => e.hash.isNotEmpty).toList() : toAdd;
        await _db.writeTxn(
          () => Platform.isAndroid
              ? _db.androidDeviceAssets.putAll(validHashes.cast())
              : _db.iOSDeviceAssets.putAll(validHashes.cast()),
        );
        toAdd.clear();
        toHash.clear();
        totalBytes += bytes;
        bytes = 0;
        sw.reset();
      }
    }
    if (totalFiles > 0) {
      debugPrint(
        "Files: $totalFiles, Total time: ${totalTime.elapsedMilliseconds}ms, total bytes: $totalBytes, ${(totalBytes / (1024 * 1024.0)) / totalTime.elapsedMilliseconds * 1000} mb/s",
      );
    }
    final List<Asset> result = [];
    for (int i = 0; i < assets.length; i++) {
      if (hashes[i] != null && hashes[i]!.hash.isNotEmpty) {
        result.add(Asset.local(assets[i], hashes[i]!.hash));
      }
    }
    return result;
  }

  Future<Uint8List?> _hashAssetCrypto(File f) async {
    late Digest output;
    final sink = sha1.startChunkedConversion(
      ChunkedConversionSink<Digest>.withCallback((accumulated) {
        output = accumulated.first;
      }),
    );
    await for (final chunk in f.openRead()) {
      sink.add(chunk);
    }
    sink.close();
    return Uint8List.fromList(output.bytes);
  }

  Future<Uint8List?> _hashFile(File f) => _backgroundService.digestFile(f.path);

  Future<List<Uint8List?>> _hashFiles(List<String> paths) async {
    if (Platform.isAndroid) {
      final List<Uint8List?>? hashes =
          await _backgroundService.digestFiles(paths);
      if (hashes == null) {
        throw Exception("Hashing ${paths.length} files failed");
      }
      return hashes;
    } else if (Platform.isIOS) {
      final List<Uint8List?> result = List.filled(paths.length, null);
      for (int i = 0; i < paths.length; i++) {
        result[i] = await _hashAssetCrypto(File(paths[i]));
      }
      return result;
    } else {
      throw Exception("_hashFiles implementation missing");
    }
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(dbProvider),
    ref.watch(backgroundServiceProvider),
  ),
);
