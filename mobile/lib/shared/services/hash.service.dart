import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
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
import 'package:photo_manager/photo_manager.dart';

class HashService {
  HashService(this._db, this._backgroundService);
  final Isar _db;
  final BackgroundService _backgroundService;

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

  Future<List<int>> hashAsset(Asset a) async {
    assert(a.isLocal, "can only get hash of local assets");
    final deviceAsset = await (Platform.isAndroid
        ? _db.androidDeviceAssets.get(a.localId!.toInt())
        : _db.iOSDeviceAssets.getById(a.localId!));
    if (deviceAsset != null) return deviceAsset.hash;
    final file = await a.local!.originFile;
    if (file == null) throw Exception("File error asset ${a.localId}");
    final hash =
        await (Platform.isAndroid ? _hashFile(file) : _hashAssetCrypto(file));
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
    if (Platform.isAndroid) {
      final Stopwatch sw = Stopwatch()..start();
      final List<AndroidDeviceAsset> toAdd = [];
      final List<int> ids = assets.map((a) => a.id.toInt()).toList();
      hashes = await _db.androidDeviceAssets.getAll(ids);
      debugPrint("Checking hash DB took ${sw.elapsedMilliseconds}ms");
      sw.reset();
      int bytes = 0;
      final List<String> toHash = [];
      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] != null) continue;
        final file = await assets[i].originFile;
        if (file == null) throw Exception("File error asset ${assets[i].id}");
        bytes += file.lengthSync();
        toHash.add(file.path);
        final da = AndroidDeviceAsset(id: ids[i], hash: const []);
        toAdd.add(da);
        totalFiles++;
        hashes[i] = da;
        if (toHash.length == batchFileCount || bytes >= batchDataSize) {
          final h = await _hashFiles(toHash);
          for (int j = 0; j < h.length; j++) {
            toAdd[j].hash = h[j];
          }
          debugPrint(
            "Hashing ${toAdd.length} files / $bytes b took ${sw.elapsedMilliseconds}ms: ${(bytes / (1024 * 1024.0)) / sw.elapsedMilliseconds * 1000} mb/s",
          );
          await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
          toAdd.clear();
          toHash.clear();
          totalBytes += bytes;
          bytes = 0;
          sw.reset();
        }
      }
      final h = await _hashFiles(toHash);
      for (int j = 0; j < h.length; j++) {
        toAdd[j].hash = h[j];
      }
      totalBytes += bytes;
      await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
    } else if (Platform.isIOS) {
      final Stopwatch sw = Stopwatch()..start();
      final List<IOSDeviceAsset> toAdd = [];
      final List<String> ids = assets.map((a) => a.id).toList();
      hashes = await _db.iOSDeviceAssets.getAllById(ids);
      sw.reset();
      int bytes = 0;
      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] != null) continue;
        final file = await assets[i].originFile;
        if (file == null) throw Exception("File error asset ${assets[i].id}");
        bytes += file.lengthSync();
        final da =
            IOSDeviceAsset(id: ids[i], hash: await _hashAssetCrypto(file));
        toAdd.add(da);
        totalFiles++;
        hashes[i] = da;
        if (toAdd.length == batchFileCount) {
          debugPrint(
            "Hashing ${toAdd.length} files / $bytes b took ${sw.elapsedMilliseconds}ms: ${(bytes / (1024 * 1024.0)) / sw.elapsedMilliseconds * 1000} mb/s",
          );
          await _db.writeTxn(() => _db.iOSDeviceAssets.putAll(toAdd));
          toAdd.clear();
          totalBytes += bytes;
          bytes = 0;
          sw.reset();
        }
      }
      await _db.writeTxn(() => _db.iOSDeviceAssets.putAll(toAdd));
    } else {
      throw Exception("hashAssets implementation missing");
    }
    debugPrint(
      "Files: $totalFiles, Total time: ${totalTime.elapsedMilliseconds}ms, total bytes: $totalBytes, ${(totalBytes / (1024 * 1024.0)) / totalTime.elapsedMilliseconds * 1000} mb/s",
    );
    return assets
        .mapIndexed((i, a) => Asset.local(a, hashes[i]!.hash))
        .toList();
  }

  Future<Uint8List> _hashAssetCrypto(File f) async {
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

  Future<Uint8List> _hashFile(File f) async {
    final hash = await _backgroundService.digestFile(f.path);
    if (hash == null) throw Exception("Hashing ${f.path} failed");
    return hash;
  }

  Future<List<Uint8List>> _hashFiles(List<String> paths) async {
    final hash = await _backgroundService.digestFiles(paths);
    if (hash == null) throw Exception("Hashing ${paths.length} files failed");
    return hash;
  }
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(dbProvider),
    ref.watch(backgroundServiceProvider),
  ),
);
