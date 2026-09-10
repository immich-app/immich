import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const photoManagerChannel = MethodChannel('com.fluttercandies/photo_manager');

  late Directory tempDirectory;
  late StorageRepository repository;
  late List<MethodCall> photoManagerCalls;

  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    tempDirectory = Directory.systemTemp.createTempSync('storage-repository-test');
    repository = StorageRepository(tempDirectory: tempDirectory);
    photoManagerCalls = [];

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(photoManagerChannel, (
      call,
    ) async {
      photoManagerCalls.add(call);
      return null;
    });
  });

  tearDown(() async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      photoManagerChannel,
      null,
    );
    debugDefaultTargetPlatformOverride = null;
    if (tempDirectory.existsSync()) {
      tempDirectory.deleteSync(recursive: true);
    }
  });

  test('clearCacheAndGetSize returns the size of deleted temporary files', () async {
    final photoManagerCache = Directory('${tempDirectory.path}/.image')..createSync();
    final otherTempCache = Directory('${tempDirectory.path}/manual-test-cache')..createSync();

    File('${photoManagerCache.path}/image-cache.bin').writeAsBytesSync(List.filled(1024 * 1024, 0));
    File('${otherTempCache.path}/temp-cache.bin').writeAsBytesSync(List.filled(2 * 1024 * 1024, 0));

    final clearedBytes = await repository.clearCacheAndGetSize();

    expect(clearedBytes, 3 * 1024 * 1024);
    expect(tempDirectory.existsSync(), isFalse);
    expect(photoManagerCalls.map((call) => call.method), contains('clearFileCache'));
  });

  test('clearCacheAndGetSize returns zero when there are no temporary files', () async {
    final clearedBytes = await repository.clearCacheAndGetSize();

    expect(clearedBytes, 0);
    expect(tempDirectory.existsSync(), isFalse);
    expect(photoManagerCalls.map((call) => call.method), contains('clearFileCache'));
  });
}
