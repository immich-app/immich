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

  Future<void> benchmarkHashAssets(List<Asset> assets) async {
    if (Platform.isAndroid) {
      final Stopwatch sw = Stopwatch()..start();
      int totalBytes = 0;
      Uint8List? hash;

      sw.reset();
      for (final Asset a in assets) {
        totalBytes += await _readFile((await a.local!.originFile)!);
      }
      debugPrint("reading file took ${sw.elapsedMilliseconds}ms");

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetCrypto((await a.local!.originFile)!);
      }
      debugPrint(
        "_hashAssetCrypto took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}",
      );

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetJavaBytes((await a.local!.originFile)!);
      }
      debugPrint(
        "_hashAssetJavaBytes took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}",
      );

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashFile((await a.local!.originFile)!);
      }
      debugPrint(
        "_hashAssetJavaFile took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}",
      );

      debugPrint("Hashed $totalBytes bytes");
      sw.stop();
    }
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
    const int batchSize = 100;
    final List<DeviceAsset?> hashes;
    if (Platform.isAndroid) {
      final Stopwatch sw = Stopwatch()..start();
      final List<AndroidDeviceAsset> toAdd = [];
      final List<int> ids = assets.map((a) => a.id.toInt()).toList();
      hashes = await _db.androidDeviceAssets.getAll(ids);
      debugPrint("Checking hash DB took ${sw.elapsedMilliseconds}ms");
      sw.reset();
      int bytes = 0;
      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] != null) continue;
        final file = await assets[i].originFile;
        if (file == null) throw Exception("File error asset ${assets[i].id}");
        bytes += file.lengthSync();
        final da = AndroidDeviceAsset(id: ids[i], hash: await _hashFile2(file));
        toAdd.add(da);
        hashes[i] = da;
        if (toAdd.length == batchSize) {
          debugPrint(
            "Hashing $batchSize files / $bytes b took ${sw.elapsedMilliseconds}ms: ${(bytes / (1024 * 1024.0)) / sw.elapsedMilliseconds * 1000} mb/s",
          );
          await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
          toAdd.clear();
          bytes = 0;
          sw.reset();
        }
      }
      debugPrint(
        "Hashing ${toAdd.length} files / $bytes b took ${sw.elapsedMilliseconds}ms: ${(bytes / (1024 * 1024.0)) / sw.elapsedMilliseconds * 1000} mb/s",
      );
      await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
    } else if (Platform.isIOS) {
      final List<IOSDeviceAsset> toAdd = [];
      final List<String> ids = assets.map((a) => a.id).toList();
      hashes = await _db.iOSDeviceAssets.getAllById(ids);
      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] != null) continue;
        final file = await assets[i].originFile;
        if (file == null) throw Exception("File error asset ${assets[i].id}");
        final da =
            IOSDeviceAsset(id: ids[i], hash: await _hashAssetCrypto(file));
        toAdd.add(da);
        hashes[i] = da;
        if (toAdd.length == batchSize) {
          await _db.writeTxn(() => _db.iOSDeviceAssets.putAll(toAdd));
          toAdd.clear();
        }
      }
      await _db.writeTxn(() => _db.iOSDeviceAssets.putAll(toAdd));
    } else {
      throw Exception("hashAssets implementation missing");
    }
    return assets
        .mapIndexed((i, a) => Asset.local(a, hashes[i]!.hash))
        .toList();
  }

  Future<int> _readFile(File f) async {
    int bytes = 0;
    await for (final chunk in f.openRead()) {
      bytes += chunk.length;
    }
    return bytes;
  }

  Future<Uint8List> _hashAssetCrypto(File f) async {
    late Digest output;
    final sink2 = sha1.startChunkedConversion(
      ChunkedConversionSink<Digest>.withCallback((accumulated) {
        output = accumulated.first;
      }),
    );
    await for (final chunk in f.openRead()) {
      sink2.add(chunk);
    }
    sink2.close();
    final h2 = output.bytes;
    return Uint8List.fromList(h2);
  }

  Future<Uint8List?> _hashAssetJavaBytes(File f) async {
    final data = await f.readAsBytes();
    return _backgroundService.digestBytes(data);
  }

  Future<Uint8List> _hashFile(File f) async {
    final hash = await _backgroundService.digestFile(f.path);
    if (hash == null) throw Exception("Hashing ${f.path} failed");
    return hash;
  }

  Future<Uint8List> _hashFile2(File f) async {
    final hash = await _backgroundService.digestFile2(f.path);
    if (hash == null) throw Exception("Hashing ${f.path} failed");
    return hash;
  }
}

String _hexEncode(List<int>? bytes) {
  if (bytes == null) return "";
  const hexDigits = '0123456789abcdef';
  var charCodes = Uint8List(bytes.length * 2);
  for (var i = 0, j = 0; i < bytes.length; i++) {
    var byte = bytes[i];
    charCodes[j++] = hexDigits.codeUnitAt((byte >> 4) & 0xF);
    charCodes[j++] = hexDigits.codeUnitAt(byte & 0xF);
  }
  return String.fromCharCodes(charCodes);
}

final hashServiceProvider = Provider(
  (ref) => HashService(
    ref.watch(dbProvider),
    ref.watch(backgroundServiceProvider),
  ),
);
