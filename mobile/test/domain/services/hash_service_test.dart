import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:collection/collection.dart';
import 'package:file/memory.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/domain/models/device_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/services/hash.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../../service.mocks.dart';

class MockAsset extends Mock implements Asset {}

class MockAssetEntity extends Mock implements AssetEntity {}

void main() {
  late HashService sut;
  late BackgroundService mockBackgroundService;
  late IDeviceAssetRepository mockDeviceAssetRepository;

  setUp(() {
    mockBackgroundService = MockBackgroundService();
    mockDeviceAssetRepository = MockDeviceAssetRepository();

    sut = HashService(
      deviceAssetRepository: mockDeviceAssetRepository,
      backgroundService: mockBackgroundService,
    );

    when(() => mockDeviceAssetRepository.transaction<Null>(any()))
        .thenAnswer((_) async {
      final capturedCallback = verify(
        () => mockDeviceAssetRepository.transaction<Null>(captureAny()),
      ).captured;
      // Invoke the transaction callback
      await (capturedCallback.firstOrNull as Future<Null> Function()?)?.call();
    });
    when(() => mockDeviceAssetRepository.updateAll(any()))
        .thenAnswer((_) async => true);
    when(() => mockDeviceAssetRepository.deleteIds(any()))
        .thenAnswer((_) async => true);
  });

  group("HashService: No DeviceAsset entry", () {
    test("hash successfully", () async {
      final (mockAsset, file, deviceAsset, hash) =
          await _createAssetMock(AssetStub.image1);

      when(() => mockBackgroundService.digestFiles([file.path]))
          .thenAnswer((_) async => [hash]);
      // No DB entries for this asset
      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer((_) async => []);

      final result = await sut.hashAssets([mockAsset]);

      // Verify we stored the new hash in DB
      when(() => mockDeviceAssetRepository.transaction<Null>(any()))
          .thenAnswer((_) async {
        final capturedCallback = verify(
          () => mockDeviceAssetRepository.transaction<Null>(captureAny()),
        ).captured;
        // Invoke the transaction callback
        await (capturedCallback.firstOrNull as Future<Null> Function()?)
            ?.call();
        verify(
          () => mockDeviceAssetRepository.updateAll([
            deviceAsset.copyWith(modifiedTime: AssetStub.image1.fileModifiedAt),
          ]),
        ).called(1);
        verify(() => mockDeviceAssetRepository.deleteIds([])).called(1);
      });
      expect(
        result,
        [AssetStub.image1.copyWith(checksum: base64.encode(hash))],
      );
    });
  });

  group("HashService: Has DeviceAsset entry", () {
    test("when the asset is not modified", () async {
      final hash = utf8.encode("image1-hash");

      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer(
        (_) async => [
          DeviceAsset(
            assetId: AssetStub.image1.localId!,
            hash: hash,
            modifiedTime: AssetStub.image1.fileModifiedAt,
          ),
        ],
      );
      final result = await sut.hashAssets([AssetStub.image1]);

      verifyNever(() => mockBackgroundService.digestFiles(any()));
      verifyNever(() => mockBackgroundService.digestFile(any()));
      verifyNever(() => mockDeviceAssetRepository.updateAll(any()));
      verifyNever(() => mockDeviceAssetRepository.deleteIds(any()));

      expect(result, [
        AssetStub.image1.copyWith(checksum: base64.encode(hash)),
      ]);
    });

    test("hashed successful when asset is modified", () async {
      final (mockAsset, file, deviceAsset, hash) =
          await _createAssetMock(AssetStub.image1);

      when(() => mockBackgroundService.digestFiles([file.path]))
          .thenAnswer((_) async => [hash]);
      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer((_) async => [deviceAsset]);

      final result = await sut.hashAssets([mockAsset]);

      when(() => mockDeviceAssetRepository.transaction<Null>(any()))
          .thenAnswer((_) async {
        final capturedCallback = verify(
          () => mockDeviceAssetRepository.transaction<Null>(captureAny()),
        ).captured;
        // Invoke the transaction callback
        await (capturedCallback.firstOrNull as Future<Null> Function()?)
            ?.call();
        verify(
          () => mockDeviceAssetRepository.updateAll([
            deviceAsset.copyWith(modifiedTime: AssetStub.image1.fileModifiedAt),
          ]),
        ).called(1);
        verify(() => mockDeviceAssetRepository.deleteIds([])).called(1);
      });

      verify(() => mockBackgroundService.digestFiles([file.path])).called(1);

      expect(result, [
        AssetStub.image1.copyWith(checksum: base64.encode(hash)),
      ]);
    });
  });

  group("HashService: Cleanup", () {
    late Asset mockAsset;
    late Uint8List hash;
    late DeviceAsset deviceAsset;
    late File file;

    setUp(() async {
      (mockAsset, file, deviceAsset, hash) =
          await _createAssetMock(AssetStub.image1);

      when(() => mockBackgroundService.digestFiles([file.path]))
          .thenAnswer((_) async => [hash]);
      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer((_) async => [deviceAsset]);
    });

    test("cleanups DeviceAsset when local file cannot be obtained", () async {
      when(() => mockAsset.local).thenThrow(Exception("File not found"));
      final result = await sut.hashAssets([mockAsset]);

      verifyNever(() => mockBackgroundService.digestFiles(any()));
      verifyNever(() => mockBackgroundService.digestFile(any()));
      verifyNever(() => mockDeviceAssetRepository.updateAll(any()));
      verify(
        () => mockDeviceAssetRepository.deleteIds([AssetStub.image1.localId!]),
      ).called(1);

      expect(result, isEmpty);
    });

    test("cleanups DeviceAsset when hashing failed", () async {
      when(() => mockDeviceAssetRepository.transaction<Null>(any()))
          .thenAnswer((_) async {
        final capturedCallback = verify(
          () => mockDeviceAssetRepository.transaction<Null>(captureAny()),
        ).captured;
        // Invoke the transaction callback
        await (capturedCallback.firstOrNull as Future<Null> Function()?)
            ?.call();

        // Verify the callback inside the transaction because, doing it outside results
        // in a small delay before the callback is invoked, resulting in other LOCs getting executed
        // resulting in an incorrect state
        //
        // i.e, consider the following piece of code
        //   await _deviceAssetRepository.transaction(() async {
        //      await _deviceAssetRepository.updateAll(toBeAdded);
        //      await _deviceAssetRepository.deleteIds(toBeDeleted);
        //   });
        //   toBeDeleted.clear();
        // since the transaction method is mocked, the callback is not invoked until it is captured
        // and executed manually in the next event loop. However, the toBeDeleted.clear() is executed
        // immediately once the transaction stub is executed, resulting in the deleteIds method being
        // called with an empty list.
        //
        // To avoid this, we capture the callback and execute it within the transaction stub itself
        // and verify the results inside the transaction stub
        verify(() => mockDeviceAssetRepository.updateAll([])).called(1);
        verify(
          () =>
              mockDeviceAssetRepository.deleteIds([AssetStub.image1.localId!]),
        ).called(1);
      });

      when(() => mockBackgroundService.digestFiles([file.path])).thenAnswer(
        // Invalid hash, length != 20
        (_) async => [Uint8List.fromList(hash.slice(2).toList())],
      );

      final result = await sut.hashAssets([mockAsset]);

      verify(() => mockBackgroundService.digestFiles([file.path])).called(1);
      expect(result, isEmpty);
    });
  });

  group("HashService: Batch processing", () {
    test("processes assets in batches when size limit is reached", () async {
      // Setup multiple assets with large file sizes
      final (mock1, mock2, mock3) = await (
        _createAssetMock(AssetStub.image1),
        _createAssetMock(AssetStub.image2),
        _createAssetMock(AssetStub.image3),
      ).wait;

      final (asset1, file1, deviceAsset1, hash1) = mock1;
      final (asset2, file2, deviceAsset2, hash2) = mock2;
      final (asset3, file3, deviceAsset3, hash3) = mock3;

      when(() => mockDeviceAssetRepository.getForIds(any()))
          .thenAnswer((_) async => []);

      // Setup for multiple batch processing calls
      when(() => mockBackgroundService.digestFiles([file1.path, file2.path]))
          .thenAnswer((_) async => [hash1, hash2]);
      when(() => mockBackgroundService.digestFiles([file3.path]))
          .thenAnswer((_) async => [hash3]);

      final size = await file1.length() + await file2.length();

      sut = HashService(
        deviceAssetRepository: mockDeviceAssetRepository,
        backgroundService: mockBackgroundService,
        batchSizeLimit: size,
      );
      final result = await sut.hashAssets([asset1, asset2, asset3]);

      // Verify multiple batch process calls
      verify(() => mockBackgroundService.digestFiles([file1.path, file2.path]))
          .called(1);
      verify(() => mockBackgroundService.digestFiles([file3.path])).called(1);

      expect(
        result,
        [
          AssetStub.image1.copyWith(checksum: base64.encode(hash1)),
          AssetStub.image2.copyWith(checksum: base64.encode(hash2)),
          AssetStub.image3.copyWith(checksum: base64.encode(hash3)),
        ],
      );
    });

    test("processes assets in batches when file limit is reached", () async {
      // Setup multiple assets with large file sizes
      final (mock1, mock2, mock3) = await (
        _createAssetMock(AssetStub.image1),
        _createAssetMock(AssetStub.image2),
        _createAssetMock(AssetStub.image3),
      ).wait;

      final (asset1, file1, deviceAsset1, hash1) = mock1;
      final (asset2, file2, deviceAsset2, hash2) = mock2;
      final (asset3, file3, deviceAsset3, hash3) = mock3;

      when(() => mockDeviceAssetRepository.getForIds(any()))
          .thenAnswer((_) async => []);

      when(() => mockBackgroundService.digestFiles([file1.path]))
          .thenAnswer((_) async => [hash1]);
      when(() => mockBackgroundService.digestFiles([file2.path]))
          .thenAnswer((_) async => [hash2]);
      when(() => mockBackgroundService.digestFiles([file3.path]))
          .thenAnswer((_) async => [hash3]);

      sut = HashService(
        deviceAssetRepository: mockDeviceAssetRepository,
        backgroundService: mockBackgroundService,
        batchFileLimit: 1,
      );
      final result = await sut.hashAssets([asset1, asset2, asset3]);

      // Verify multiple batch process calls
      verify(() => mockBackgroundService.digestFiles([file1.path])).called(1);
      verify(() => mockBackgroundService.digestFiles([file2.path])).called(1);
      verify(() => mockBackgroundService.digestFiles([file3.path])).called(1);

      expect(
        result,
        [
          AssetStub.image1.copyWith(checksum: base64.encode(hash1)),
          AssetStub.image2.copyWith(checksum: base64.encode(hash2)),
          AssetStub.image3.copyWith(checksum: base64.encode(hash3)),
        ],
      );
    });

    test("HashService: Sort & Process different states", () async {
      final (asset1, file1, deviceAsset1, hash1) =
          await _createAssetMock(AssetStub.image1); // Will need rehashing
      final (asset2, file2, deviceAsset2, hash2) =
          await _createAssetMock(AssetStub.image2); // Will have matching hash
      final (asset3, file3, deviceAsset3, hash3) =
          await _createAssetMock(AssetStub.image3); // No DB entry
      final asset4 =
          AssetStub.image3.copyWith(localId: "image4"); // Cannot be hashed

      when(() => mockBackgroundService.digestFiles([file1.path, file3.path]))
          .thenAnswer((_) async => [hash1, hash3]);
      // DB entries are not sorted and a dummy entry added
      when(
        () => mockDeviceAssetRepository.getForIds([
          AssetStub.image1.localId!,
          AssetStub.image2.localId!,
          AssetStub.image3.localId!,
          asset4.localId!,
        ]),
      ).thenAnswer(
        (_) async => [
          // Same timestamp to reuse deviceAsset
          deviceAsset2.copyWith(modifiedTime: asset2.fileModifiedAt),
          deviceAsset1,
          deviceAsset3.copyWith(assetId: asset4.localId!),
        ],
      );

      final result = await sut.hashAssets([asset1, asset2, asset3, asset4]);

      // Verify correct processing of all assets
      verify(() => mockBackgroundService.digestFiles([file1.path, file3.path]))
          .called(1);
      expect(result.length, 3);
      expect(result, [
        AssetStub.image2.copyWith(checksum: base64.encode(hash2)),
        AssetStub.image1.copyWith(checksum: base64.encode(hash1)),
        AssetStub.image3.copyWith(checksum: base64.encode(hash3)),
      ]);
    });

    group("HashService: Edge cases", () {
      test("handles empty list of assets", () async {
        when(() => mockDeviceAssetRepository.getForIds(any()))
            .thenAnswer((_) async => []);

        final result = await sut.hashAssets([]);

        verifyNever(() => mockBackgroundService.digestFiles(any()));
        verifyNever(() => mockDeviceAssetRepository.updateAll(any()));
        verifyNever(() => mockDeviceAssetRepository.deleteIds(any()));

        expect(result, isEmpty);
      });

      test("handles all file access failures", () async {
        // No DB entries
        when(
          () => mockDeviceAssetRepository.getForIds(
            [AssetStub.image1.localId!, AssetStub.image2.localId!],
          ),
        ).thenAnswer((_) async => []);

        final result = await sut.hashAssets([
          AssetStub.image1,
          AssetStub.image2,
        ]);

        verifyNever(() => mockBackgroundService.digestFiles(any()));
        verifyNever(() => mockDeviceAssetRepository.updateAll(any()));
        expect(result, isEmpty);
      });
    });
  });
}

Future<(Asset, File, DeviceAsset, Uint8List)> _createAssetMock(
  Asset asset,
) async {
  final random = Random();
  final hash =
      Uint8List.fromList(List.generate(20, (i) => random.nextInt(255)));
  final mockAsset = MockAsset();
  final mockAssetEntity = MockAssetEntity();
  final fs = MemoryFileSystem();
  final deviceAsset = DeviceAsset(
    assetId: asset.localId!,
    hash: Uint8List.fromList(hash),
    modifiedTime: DateTime.now(),
  );
  final tmp = await fs.systemTempDirectory.createTemp();
  final file = tmp.childFile("${asset.fileName}-path");
  await file.writeAsString("${asset.fileName}-content");

  when(() => mockAsset.localId).thenReturn(asset.localId);
  when(() => mockAsset.fileName).thenReturn(asset.fileName);
  when(() => mockAsset.fileCreatedAt).thenReturn(asset.fileCreatedAt);
  when(() => mockAsset.fileModifiedAt).thenReturn(asset.fileModifiedAt);
  when(() => mockAsset.copyWith(checksum: any(named: "checksum")))
      .thenReturn(asset.copyWith(checksum: base64.encode(hash)));
  when(() => mockAsset.local).thenAnswer((_) => mockAssetEntity);
  when(() => mockAssetEntity.originFile).thenAnswer((_) async => file);

  return (mockAsset, file, deviceAsset, hash);
}
