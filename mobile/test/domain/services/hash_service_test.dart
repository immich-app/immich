import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/album.stub.dart';
import '../../fixtures/asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

void main() {
  late HashService sut;
  late MockLocalAlbumRepository mockAlbumRepo;
  late MockLocalAssetRepository mockAssetRepo;
  late MockNativeSyncApi mockNativeApi;

  setUp(() {
    mockAlbumRepo = MockLocalAlbumRepository();
    mockAssetRepo = MockLocalAssetRepository();
    mockNativeApi = MockNativeSyncApi();

    sut = HashService(
      localAlbumRepository: mockAlbumRepo,
      localAssetRepository: mockAssetRepo,
      nativeSyncApi: mockNativeApi,
    );

    registerFallbackValue(LocalAlbumStub.recent);
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(<String, String>{});

    when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});
  });

  group('HashService hashAssets', () {
    test('skips albums with no assets to hash', () async {
      when(
        () => mockAlbumRepo.getBackupAlbums(),
      ).thenAnswer((_) async => [LocalAlbumStub.recent.copyWith(assetCount: 0)]);
      when(() => mockAlbumRepo.getAssetsToHash(LocalAlbumStub.recent.id)).thenAnswer((_) async => []);

      await sut.hashAssets();

      verifyNever(() => mockNativeApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });
  });

  group('HashService _hashAssets', () {
    test('skips empty batches', () async {
      final album = LocalAlbumStub.recent;
      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => []);

      await sut.hashAssets();

      verifyNever(() => mockNativeApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    });

    test('processes assets when available', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;

      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
      when(
        () => mockNativeApi.hashAssets([asset.id], allowNetworkAccess: false),
      ).thenAnswer((_) async => [HashResult(assetId: asset.id, hash: 'test-hash')]);

      await sut.hashAssets();

      verify(() => mockNativeApi.hashAssets([asset.id], allowNetworkAccess: false)).called(1);
      final captured = verify(() => mockAssetRepo.updateHashes(captureAny())).captured.first as Map<String, String>;
      expect(captured.length, 1);
      expect(captured[asset.id], 'test-hash');
    });

    test('handles failed hashes', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;

      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
      when(
        () => mockNativeApi.hashAssets([asset.id], allowNetworkAccess: false),
      ).thenAnswer((_) async => [HashResult(assetId: asset.id, error: 'Failed to hash')]);

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny())).captured.first as Map<String, String>;
      expect(captured.length, 0);
    });

    test('handles null hash results', () async {
      final album = LocalAlbumStub.recent;
      final asset = LocalAssetStub.image1;

      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
      when(
        () => mockNativeApi.hashAssets([asset.id], allowNetworkAccess: false),
      ).thenAnswer((_) async => [HashResult(assetId: asset.id, hash: null)]);

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny())).captured.first as Map<String, String>;
      expect(captured.length, 0);
    });

    test('batches by size limit', () async {
      const batchSize = 2;
      final sut = HashService(
        localAlbumRepository: mockAlbumRepo,
        localAssetRepository: mockAssetRepo,
        nativeSyncApi: mockNativeApi,
        batchSize: batchSize,
      );

      final album = LocalAlbumStub.recent;
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;
      final asset3 = LocalAssetStub.image1.copyWith(id: 'image3', name: 'image3.jpg');

      final capturedCalls = <List<String>>[];

      when(() => mockAssetRepo.updateHashes(any())).thenAnswer((_) async => {});
      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset1, asset2, asset3]);
      when(() => mockNativeApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess'))).thenAnswer((
        invocation,
      ) async {
        final assetIds = invocation.positionalArguments[0] as List<String>;
        capturedCalls.add(List<String>.from(assetIds));
        return assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList();
      });

      await sut.hashAssets();

      expect(capturedCalls.length, 2, reason: 'Should make exactly 2 calls to hashAssets');
      expect(capturedCalls[0], [asset1.id, asset2.id], reason: 'First call should batch the first two assets');
      expect(capturedCalls[1], [asset3.id], reason: 'Second call should have the remaining asset');

      verify(() => mockAssetRepo.updateHashes(any())).called(2);
    });

    test('handles mixed success and failure in batch', () async {
      final album = LocalAlbumStub.recent;
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;

      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [album]);
      when(() => mockAlbumRepo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset1, asset2]);
      when(() => mockNativeApi.hashAssets([asset1.id, asset2.id], allowNetworkAccess: false)).thenAnswer(
        (_) async => [
          HashResult(assetId: asset1.id, hash: 'asset1-hash'),
          HashResult(assetId: asset2.id, error: 'Failed to hash asset2'),
        ],
      );

      await sut.hashAssets();

      final captured = verify(() => mockAssetRepo.updateHashes(captureAny())).captured.first as Map<String, String>;
      expect(captured.length, 1);
      expect(captured[asset1.id], 'asset1-hash');
    });

    test('uses allowNetworkAccess based on album backup selection', () async {
      final selectedAlbum = LocalAlbumStub.recent.copyWith(backupSelection: BackupSelection.selected);
      final nonSelectedAlbum = LocalAlbumStub.recent.copyWith(id: 'album2', backupSelection: BackupSelection.excluded);
      final asset1 = LocalAssetStub.image1;
      final asset2 = LocalAssetStub.image2;

      when(() => mockAlbumRepo.getBackupAlbums()).thenAnswer((_) async => [selectedAlbum, nonSelectedAlbum]);
      when(() => mockAlbumRepo.getAssetsToHash(selectedAlbum.id)).thenAnswer((_) async => [asset1]);
      when(() => mockAlbumRepo.getAssetsToHash(nonSelectedAlbum.id)).thenAnswer((_) async => [asset2]);
      when(() => mockNativeApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess'))).thenAnswer((
        invocation,
      ) async {
        final assetIds = invocation.positionalArguments[0] as List<String>;
        return assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList();
      });

      await sut.hashAssets();

      verify(() => mockNativeApi.hashAssets([asset1.id], allowNetworkAccess: true)).called(1);
      verify(() => mockNativeApi.hashAssets([asset2.id], allowNetworkAccess: false)).called(1);
    });
  });
}
