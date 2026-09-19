import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/asset_media_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/asset.stub.dart';
import '../../service.mocks.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late MockAssetMediaApi api;
  late StorageRepository sut;
  late Directory root;
  late Directory originals;
  late Directory temp;
  late File file;

  setUp(() {
    api = MockAssetMediaApi();
    root = Directory.systemTemp.createTempSync('storage-test');
    final cache = Directory('${root.path}/Caches');
    originals = Directory('${cache.path}/immich/originals')..createSync(recursive: true);
    temp = Directory('${root.path}/tmp');
    sut = StorageRepository(api, cacheDirectory: () async => cache, temporaryDirectory: temp);
    file = File('${originals.path}/IMG_0001.HEIC')..writeAsStringSync('still');
  });

  tearDown(() {
    AssetMediaFlutterApi.setUp(null);
    root.deleteSync(recursive: true);
  });

  test('returns the file and its original name when native is done', () async {
    when(
      () => api.getFile('image1', AssetMediaFileKind.original),
    ).thenAnswer((_) async => AssetMediaFile(path: file.path, originalFileName: 'IMG_0001.HEIC', isLivePhoto: true));

    final result = await sut.getFileForAsset('image1');

    expect(result?.file.path, file.path);
    expect(result?.originalFileName, 'IMG_0001.HEIC');
    expect(result?.isLivePhoto, isTrue);
  });

  test('treats an empty original name as missing', () async {
    when(
      () => api.getFile('image1', AssetMediaFileKind.original),
    ).thenAnswer((_) async => AssetMediaFile(path: file.path, originalFileName: '', isLivePhoto: false));

    final result = await sut.getFileForAsset('image1');

    expect(result?.originalFileName, isNull);
  });

  test('returns null when native cannot find the asset', () async {
    when(() => api.getFile('image1', AssetMediaFileKind.original)).thenAnswer((_) async => null);

    expect(await sut.getFileForAsset('image1'), isNull);
  });

  test('asks native for the live photo video when the motion file is wanted', () async {
    when(
      () => api.getFile('image1', AssetMediaFileKind.livePhotoVideo),
    ).thenAnswer((_) async => AssetMediaFile(path: file.path, originalFileName: 'IMG_0001.MOV', isLivePhoto: true));

    final result = await sut.getMotionFileForAsset(LocalAssetStub.image1);

    expect(result?.originalFileName, 'IMG_0001.MOV');
  });

  test('forwards native progress to the caller only while the fetch runs', () async {
    final progress = <double>[];
    Future<void> sendProgress(double value) =>
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.handlePlatformMessage(
          'dev.flutter.pigeon.immich_mobile.AssetMediaFlutterApi.onFileProgress',
          AssetMediaFlutterApi.pigeonChannelCodec.encodeMessage(<Object?>['image1', value]),
          null,
        );
    when(
      () => api.getFile('image1', AssetMediaFileKind.livePhotoVideo),
    ).thenAnswer((_) async => AssetMediaFile(path: file.path, isLivePhoto: true));
    when(() => api.getFile('image1', AssetMediaFileKind.original)).thenAnswer((_) async {
      await sendProgress(0.5);
      await sut.getMotionFileForAsset(LocalAssetStub.image1);
      await sendProgress(0.7);
      return AssetMediaFile(path: file.path, isLivePhoto: true);
    });

    await sut.getFileForAsset('image1', onProgress: progress.add);
    await sendProgress(1.0);

    expect(progress, [0.5, 0.7]);
  });

  group('clearCache on iOS', () {
    setUp(() => debugDefaultTargetPlatformOverride = TargetPlatform.iOS);
    tearDown(() => debugDefaultTargetPlatformOverride = null);

    test('deletes the staged originals and leaves the temp directory alone', () async {
      final body = File('${temp.path}/upload-body')..createSync(recursive: true);

      await sut.clearCache();

      expect(file.existsSync(), isFalse);
      expect(originals.existsSync(), isTrue);
      expect(body.existsSync(), isTrue);
    });

    test('creates the temp directory when it is missing', () async {
      await sut.clearCache();

      expect(temp.existsSync(), isTrue);
    });
  });
}
