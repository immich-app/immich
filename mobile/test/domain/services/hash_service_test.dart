import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/album.stub.dart';
import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

class MockFile extends Mock implements File {}

void main() {
  late HashService sut;
  late MockLocalAlbumRepository mockAlbumRepo;
  late MockLocalAssetRepository mockAssetRepo;
  late MockStorageRepository mockStorageRepo;
  late MockNativeSyncApi mockNativeApi;

  setUp(() {
    mockAlbumRepo = MockLocalAlbumRepository();
    mockAssetRepo = MockLocalAssetRepository();
    mockStorageRepo = MockStorageRepository();
    mockNativeApi = MockNativeSyncApi();

    sut = HashService(
      localAlbumRepository: mockAlbumRepo,
      localAssetRepository: mockAssetRepo,
      storageRepository: mockStorageRepo,
      nativeSyncApi: mockNativeApi,
    );

    registerFallbackValue(LocalAlbumStub.recent);
    registerFallbackValue(LocalAssetStub.image1);

    when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});
  });

  group('HashService hashAssets', () {
    test('processes albums in correct order', () async {
      final album1 = LocalAlbumStub.recent
          .copyWith(id: "1", backupSelection: BackupSelection.none);
      final album2 = LocalAlbumStub.recent
          .copyWith(id: "2", backupSelection: BackupSelection.excluded);
      final album3 = LocalAlbumStub.recent
          .copyWith(id: "3", backupSelection: BackupSelection.selected);
      final album4 = LocalAlbumStub.recent.copyWith(
        id: "4",
        backupSelection: BackupSelection.selected,
        isIosSharedAlbum: true,
      );

      when(() => mockAlbumRepo.getAll())
          .thenAnswer((_) async => [album1, album2, album4, album3]);
      when(() => mockAlbumRepo.getAssetsToHash(any()))
          .thenAnswer((_) async => []);

      await sut.hashAssets();

      verifyInOrder([
        () => mockAlbumRepo.getAll(),
        () => mockAlbumRepo.getAssetsToHash(album3.id),
        () => mockAlbumRepo.getAssetsToHash(album4.id),
        () => mockAlbumRepo.getAssetsToHash(album1.id),
        () => mockAlbumRepo.getAssetsToHash(album2.id),
      ]);
    });

    test('skips albums with no assets to hash', () async {
      when(() => mockAlbumRepo.getAll()).thenAnswer(
        (_) async => [LocalAlbumStub.recent.copyWith(assetCount: 0)],
      );
      when(() => mockAlbumRepo.getAssetsToHash(LocalAlbumStub.recent.id))
          .thenAnswer((_) async => []);

      await sut.hashAssets();

      verifyNever(() => mockStorageRepo.getFileForAsset(any()));
      verifyNever(() => mockNativeApi.hashPaths(any()));
    });
  });

  group('HashService _hashAssets', () {
    test('skips assets without files', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;
      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset]);
      when(() => mockStorageRepo.getFileForAsset(asset))
          .thenAnswer((_) async => null);

      await sut.hashAssets();

      verifyNever(() => mockNativeApi.hashPaths(any()));
    });

    test('processes assets when available', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;
      final mockFile = MockFile();
      final hash = Uint8List.fromList(List.generate(20, (i) => i));

      when(() => mockFile.length()).thenAnswer((_) async => 1000);
      when(() => mockFile.path).thenReturn('image-path');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset]);
      when(() => mockStorageRepo.getFileForAsset(asset))
          .thenAnswer((_) async => mockFile);
      when(() => mockNativeApi.hashPaths(['image-path'])).thenAnswer(
        (_) async => [hash],
      );

      await sut.hashAssets();

      verify(() => mockNativeApi.hashPaths(['image-path'])).called(1);
      final captured = verify(() => mockAssetRepo.updateHashes(captureAny()))
          .captured
          .first as List<LocalAsset>;
      expect(captured.length, 1);
      expect(captured[0].checksum, base64.encode(hash));
    });

    test('handles failed hashes', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;
      final mockFile = MockFile();
      when(() => mockFile.length()).thenAnswer((_) async => 1000);
      when(() => mockFile.path).thenReturn('image-path');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset]);
      when(() => mockStorageRepo.getFileForAsset(asset))
          .thenAnswer((_) async => mockFile);
      when(() => mockNativeApi.hashPaths(['image-path']))
          .thenAnswer((_) async => [null]);
      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny()))
          .captured
          .first as List<LocalAsset>;
      expect(captured.length, 0);
    });

    test('handles invalid hash length', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;
      final mockFile = MockFile();
      when(() => mockFile.length()).thenAnswer((_) async => 1000);
      when(() => mockFile.path).thenReturn('image-path');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset]);
      when(() => mockStorageRepo.getFileForAsset(asset))
          .thenAnswer((_) async => mockFile);

      final invalidHash = Uint8List.fromList([1, 2, 3]);
      when(() => mockNativeApi.hashPaths(['image-path']))
          .thenAnswer((_) async => [invalidHash]);
      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny()))
          .captured
          .first as List<LocalAsset>;
      expect(captured.length, 0);
    });

    test('batches by file count limit', () async {
      final sut = HashService(
        localAlbumRepository: mockAlbumRepo,
        localAssetRepository: mockAssetRepo,
        storageRepository: mockStorageRepo,
        nativeSyncApi: mockNativeApi,
        batchFileLimit: 1,
      );

      final album = LocalAlbumStub.recent;
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;
      final mockFile1 = MockFile();
      final mockFile2 = MockFile();
      when(() => mockFile1.length()).thenAnswer((_) async => 100);
      when(() => mockFile1.path).thenReturn('path-1');
      when(() => mockFile2.length()).thenAnswer((_) async => 100);
      when(() => mockFile2.path).thenReturn('path-2');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset1, asset2]);
      when(() => mockStorageRepo.getFileForAsset(asset1))
          .thenAnswer((_) async => mockFile1);
      when(() => mockStorageRepo.getFileForAsset(asset2))
          .thenAnswer((_) async => mockFile2);

      final hash = Uint8List.fromList(List.generate(20, (i) => i));
      when(() => mockNativeApi.hashPaths(any()))
          .thenAnswer((_) async => [hash]);
      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});

      await sut.hashAssets();

      verify(() => mockNativeApi.hashPaths(['path-1'])).called(1);
      verify(() => mockNativeApi.hashPaths(['path-2'])).called(1);
      verify(() => mockAssetRepo.updateHashes(any())).called(2);
    });

    test('batches by size limit', () async {
      final sut = HashService(
        localAlbumRepository: mockAlbumRepo,
        localAssetRepository: mockAssetRepo,
        storageRepository: mockStorageRepo,
        nativeSyncApi: mockNativeApi,
        batchSizeLimit: 80,
      );

      final album = LocalAlbumStub.recent;
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;
      final mockFile1 = MockFile();
      final mockFile2 = MockFile();
      when(() => mockFile1.length()).thenAnswer((_) async => 100);
      when(() => mockFile1.path).thenReturn('path-1');
      when(() => mockFile2.length()).thenAnswer((_) async => 100);
      when(() => mockFile2.path).thenReturn('path-2');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset1, asset2]);
      when(() => mockStorageRepo.getFileForAsset(asset1))
          .thenAnswer((_) async => mockFile1);
      when(() => mockStorageRepo.getFileForAsset(asset2))
          .thenAnswer((_) async => mockFile2);

      final hash = Uint8List.fromList(List.generate(20, (i) => i));
      when(() => mockNativeApi.hashPaths(any()))
          .thenAnswer((_) async => [hash]);
      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});

      await sut.hashAssets();

      verify(() => mockNativeApi.hashPaths(['path-1'])).called(1);
      verify(() => mockNativeApi.hashPaths(['path-2'])).called(1);
      verify(() => mockAssetRepo.updateHashes(any())).called(2);
    });

    test('handles mixed success and failure in batch', () async {
      final album = LocalAlbumStub.recent;
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;
      final mockFile1 = MockFile();
      final mockFile2 = MockFile();
      when(() => mockFile1.length()).thenAnswer((_) async => 100);
      when(() => mockFile1.path).thenReturn('path-1');
      when(() => mockFile2.length()).thenAnswer((_) async => 100);
      when(() => mockFile2.path).thenReturn('path-2');

      when(() => mockAlbumRepo.getAll()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id))
          .thenAnswer((_) async => [asset1, asset2]);
      when(() => mockStorageRepo.getFileForAsset(asset1))
          .thenAnswer((_) async => mockFile1);
      when(() => mockStorageRepo.getFileForAsset(asset2))
          .thenAnswer((_) async => mockFile2);

      final validHash = Uint8List.fromList(List.generate(20, (i) => i));
      when(() => mockNativeApi.hashPaths(['path-1', 'path-2']))
          .thenAnswer((_) async => [validHash, null]);
      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny()))
          .captured
          .first as List<LocalAsset>;
      expect(captured.length, 1);
      expect(captured.first.id, asset1.id);
    });
  });
}
