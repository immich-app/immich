import 'dart:convert';
import 'dart:ffi';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';
import 'package:isar/isar.dart';
import "package:ffi/ffi.dart";

class HashService {
  HashService(this._db, this._backgroundService) {
    final DynamicLibrary nativeHashLib = Platform.isAndroid
        ? DynamicLibrary.open('libnative_hash.so')
        : DynamicLibrary.process();
    sha1bytes = nativeHashLib
        .lookup<
            NativeFunction<
                Pointer<Uint8> Function(
                  Pointer<Uint8> data,
                  Uint64 len,
                )>>('sha1bytes')
        .asFunction();
    sha1file = nativeHashLib
        .lookup<
            NativeFunction<
                Pointer<Uint8> Function(
                  Pointer<Utf8> path,
                )>>('sha1file')
        .asFunction();
    sha1evp = nativeHashLib
        .lookup<
            NativeFunction<
                Pointer<Uint8> Function(
                  Pointer<Utf8> path,
                )>>('sha1evp')
        .asFunction();
    sha1evpBytes = nativeHashLib
        .lookup<
            NativeFunction<
                Pointer<Uint8> Function(
                  Pointer<Uint8> data,
                  Uint64 len,
                )>>('sha1evpBytes')
        .asFunction();
  }
  final Isar _db;
  final BackgroundService _backgroundService;
  late final Pointer<Uint8> Function(Pointer<Uint8> data, int len) sha1bytes;
  late final Pointer<Uint8> Function(Pointer<Utf8> path) sha1file;
  late final Pointer<Uint8> Function(Pointer<Utf8> path) sha1evp;
  late final Pointer<Uint8> Function(Pointer<Uint8> data, int len) sha1evpBytes;

  Future<void> benchmarkHashAssets(List<Asset> assets) async {
    if (Platform.isAndroid) {
      // final List<AndroidDeviceAsset> toAdd = [];
      // final List<int> ids = assets.map((a) => a.localId.toInt()).toList();
      // final hashes = await _db.androidDeviceAssets.getAll(ids);
      final Stopwatch sw = Stopwatch()..start();
      int totalBytes = 0;
      late Uint8List hash;

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
        hash = await _hashAssetCryptography((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetCryptography took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

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

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetNativeBytes((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetNativeBytes took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetNativeFile((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetNativeFile took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      sw.reset();
      for (final Asset a in assets) {
        hash = await _hashAssetNativeEvp((await a.local!.originFile)!);
      }
      debugPrint(
          "_hashAssetNativeEvp took ${sw.elapsedMilliseconds}ms ${_hexEncode(hash)}");

      debugPrint("Hashed $totalBytes bytes");

      // for (int i = 0; i < assets.length; i++) {
      //   if (hashes[i] == null) {
      //     final file = await assets[i].local!.originFile;
      //     if (file != null) {
      //       final h = await _hashAssetCrypto(file);
      //       toAdd.add(AndroidDeviceAsset(id: ids[i], hash: h));
      //     }
      //   }
      // }

      sw.stop();
      // await _db.writeTxn(() => _db.androidDeviceAssets.putAll(toAdd));
      // await _db.writeTxn(() => _db.androidDeviceAssets.clear());
    }
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
            toAdd.add(AndroidDeviceAsset(id: ids[i], hash: h));
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

  Future<void> speed() async {
    const int mb100 = 10 * 1024 * 1024;
    const int rounds = 100;

    final dataPtr = malloc.allocate<Uint8>(mb100);
    final data = dataPtr.asTypedList(mb100);

    final Stopwatch sw = Stopwatch()..start();
    late Uint8List hash;

    sw.reset();
    for (int i = 0; i < rounds; i++) {
      hash = sha1bytes(dataPtr, mb100).asTypedList(20);
    }
    debugPrint("sha1bytes took ${sw.elapsedMilliseconds} ${_hexEncode(hash)}");

    sw.reset();
    for (int i = 0; i < rounds; i++) {
      hash = sha1evpBytes(dataPtr, mb100).asTypedList(20);
    }
    debugPrint(
        "sha1evpBytes took ${sw.elapsedMilliseconds} ${_hexEncode(hash)}");

    sw.reset();
    hash = (await _backgroundService.digestSpeed(mb100, rounds))!;
    debugPrint("java took ${sw.elapsedMilliseconds} ${_hexEncode(hash)}");

    sw.reset();
    for (int i = 0; i < rounds; i++) {
      hash = Uint8List.fromList((await Sha1().hash(data)).bytes);
    }
    debugPrint("dart took ${sw.elapsedMilliseconds} ${_hexEncode(hash)}");
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

  Future<Uint8List> _hashAssetCryptography(File f) async {
    final sink = Sha1().newHashSink();
    await for (final chunk in f.openRead()) {
      sink.add(chunk);
    }
    sink.close();

    final h1 = (await sink.hash()).bytes;
    return Uint8List.fromList(h1);
  }

  Future<Uint8List> _hashAssetJavaBytes(File f) async {
    final data = await f.readAsBytes();
    final hash = await _backgroundService.digestBytes(data);
    return hash!;
  }

  Future<Uint8List> _hashAssetJavaFile(File f) async {
    final hash = await _backgroundService.digestFile(f.path);
    return hash!;
  }

  Future<Uint8List> _hashAssetNativeFile(File f) async {
    final path = f.path.toNativeUtf8();
    final hashPtr = sha1file(path);
    malloc.free(path);
    if (hashPtr.address != 0) {
      final hash = Uint8List.fromList(hashPtr.asTypedList(20));
      malloc.free(hashPtr);
      return hash;
    }
    return Uint8List(0);
  }

  Future<Uint8List> _hashAssetNativeEvp(File f) async {
    final path = f.path.toNativeUtf8();
    final hashPtr = sha1evp(path);
    malloc.free(path);
    if (hashPtr.address != 0) {
      final hash = Uint8List.fromList(hashPtr.asTypedList(20));
      malloc.free(hashPtr);
      return hash;
    }
    return Uint8List(0);
  }

  Future<Uint8List> _hashAssetNativeEvpBytes(File f) async {
    final bytes = await f.readAsBytes();
    final data = malloc.allocate<Uint8>(bytes.length);
    data.asTypedList(bytes.length).setAll(0, bytes);
    final hashPtr = sha1evpBytes(data, bytes.length);
    if (hashPtr.address != 0) {
      final hash = Uint8List.fromList(hashPtr.asTypedList(20));
      malloc.free(hashPtr);
      return hash;
    }
    return Uint8List(0);
  }

  Future<Uint8List> _hashAssetNativeBytes(File f) async {
    final bytes = await f.readAsBytes();
    final data = malloc.allocate<Uint8>(bytes.length);
    data.asTypedList(bytes.length).setAll(0, bytes);
    final hashPtr = sha1bytes(data, bytes.length);
    if (hashPtr.address != 0) {
      final hash = Uint8List.fromList(hashPtr.asTypedList(20));
      malloc.free(hashPtr);
      return hash;
    }
    return Uint8List(0);
  }
}

String _hexEncode(List<int> bytes) {
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
