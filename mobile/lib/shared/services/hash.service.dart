import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:isar/isar.dart';

class HashService {
  HashService(this._db, this._backgroundService);
  final Isar _db;
  final BackgroundService _backgroundService;

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
          "_hashAssetCrypto took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetJavaBytes((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetJavaBytes took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetJavaFile((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetJavaFile took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      debugPrint("Hashed $totalBytes bytes");
      sw.stop();
    }
  }

  Future<List<int>?> getHash(Asset a) async {
    assert(a.isLocal, "can only get hash of local assets");
    final deviceAsset = await (Platform.isAndroid
        ? _db.androidDeviceAssets.get(a.localId.toInt())
        : _db.iOSDeviceAssets.getById(a.localId));
    // final List<int>? hash;
    // if (deviceAsset == null) {
    //   final file = await a.local!.originFile;
    //   if (file != null) {
    //     hash = await (Platform.isAndroid
    //         ? _hashAssetJavaFile(file)
    //         : _hashAssetCrypto(file));
    //     await _db.writeTxn(() => null)
    //   }
    // }
    final hash = deviceAsset?.hash;
    return hash;
  }

  Future<void> hashAssets(List<Asset> assets) async {
    if (Platform.isAndroid) {
      final List<AndroidDeviceAsset> toAdd = [];
      final List<int> ids = assets.map((a) => a.localId.toInt()).toList();
      final hashes = await _db.androidDeviceAssets.getAll(ids);

      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] == null) {
          final file = await assets[i].local!.originFile;
          if (file != null) {
            final h = await _hashAssetJavaFile(file);
            if (h != null) toAdd.add(AndroidDeviceAsset(id: ids[i], hash: h));
          }
        }
      }
      await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
    } else if (Platform.isIOS) {
      final List<IOSDeviceAsset> toAdd = [];
      final List<String> ids = assets.map((a) => a.localId).toList();
      final hashes = await _db.iOSDeviceAssets.getAllById(ids);

      for (int i = 0; i < assets.length; i++) {
        if (hashes[i] == null) {
          final file = await assets[i].local!.originFile;
          if (file != null) {
            final h = await _hashAssetCrypto(file);
            toAdd.add(IOSDeviceAsset(id: ids[i], hash: h));
          }
        }
      }
      await _db.writeTxn(() => _db.iOSDeviceAssets.putAll(toAdd));
    } else {
      throw Exception("hashAssets implementation missing");
    }
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

  Future<Uint8List?> _hashAssetJavaFile(File f) =>
      _backgroundService.digestFile(f.path);
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
