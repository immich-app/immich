import 'dart:convert';
import 'dart:io';

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

  group("HashService: Has matching DeviceAsset entry", () {
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
  });

  group("HashService: No matching DeviceAsset entry", () {
    late Asset mockAsset;
    // hash should be 20 char long
    final hash = utf8.encode("image1-checksum-hash");
    final deviceAsset = DeviceAsset(
      assetId: AssetStub.image1.localId!,
      hash: hash,
      modifiedTime: DateTime.now(),
    );
    late File file;

    setUp(() async {
      mockAsset = MockAsset();
      final mockAssetEntity = MockAssetEntity();
      final fs = MemoryFileSystem();
      final tmp = await fs.systemTempDirectory.createTemp();
      file = tmp.childFile("image1-path");
      await file.writeAsString("image1-content");

      when(() => mockAsset.localId).thenReturn(AssetStub.image1.localId);
      when(() => mockAsset.fileName).thenReturn(AssetStub.image1.fileName);
      when(() => mockAsset.fileCreatedAt)
          .thenReturn(AssetStub.image1.fileCreatedAt);
      when(() => mockAsset.fileModifiedAt)
          .thenReturn(AssetStub.image1.fileModifiedAt);
      when(() => mockAsset.copyWith(checksum: any(named: "checksum")))
          .thenReturn(AssetStub.image1.copyWith(checksum: base64.encode(hash)));

      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer(
        (_) async => [
          DeviceAsset(
            assetId: AssetStub.image1.localId!,
            hash: hash,
            modifiedTime: DateTime.now(),
          ),
        ],
      );
      when(() => mockAsset.local).thenAnswer((_) => mockAssetEntity);
      when(() => mockAssetEntity.originFile).thenAnswer((_) async => file);
      when(() => mockBackgroundService.digestFiles([file.path]))
          .thenAnswer((_) async => [hash]);
      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer((_) async => [deviceAsset]);
    });

    test("cleanups DeviceAsset when local file cannot be obtained", () async {
      when(
        () => mockDeviceAssetRepository.getForIds([AssetStub.image1.localId!]),
      ).thenAnswer(
        (_) async => [
          DeviceAsset(
            assetId: AssetStub.image1.localId!,
            hash: hash,
            modifiedTime: DateTime.now(),
          ),
        ],
      );

      final result = await sut.hashAssets([AssetStub.image1]);

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

    test("hashed successful", () async {
      final result = await sut.hashAssets([mockAsset]);

      verify(() => mockBackgroundService.digestFiles([file.path])).called(1);
      verify(
        () => mockDeviceAssetRepository.updateAll([
          deviceAsset.copyWith(modifiedTime: AssetStub.image1.fileModifiedAt),
        ]),
      ).called(1);
      verify(() => mockDeviceAssetRepository.deleteIds([])).called(1);

      expect(result, [
        AssetStub.image1.copyWith(checksum: base64.encode(hash)),
      ]);
    });
  });
}
