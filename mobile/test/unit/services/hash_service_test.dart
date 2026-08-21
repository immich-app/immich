import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:mocktail/mocktail.dart';

import '../factories/local_album_factory.dart';
import '../factories/local_asset_factory.dart';
import '../mocks.dart';

void main() {
  late HashService sut;
  final mocks = RepositoryMocks();

  setUp(() {
    sut = HashService(
      localAlbumRepository: mocks.localAlbum.repo,
      localAssetRepository: mocks.localAsset.repo,
      nativeSyncApi: mocks.nativeApi.api,
    );
  });

  tearDown(() {
    mocks.resetAll();
  });

  group('HashService', () {
    group('hashAssets', () {
      test('skips albums with no assets to hash', () async {
        final album = LocalAlbumFactory.create(assetCount: 0);
        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);

        await sut.hashAssets();

        verifyNever(mocks.nativeApi.hashAssets);
      });

      test('skips empty batches', () async {
        final album = LocalAlbumFactory.create();
        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);

        await sut.hashAssets();

        verifyNever(mocks.nativeApi.hashAssets);
      });

      test('processes assets when available', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();
        final result = HashResult(assetId: asset.id, hash: 'test-hash');

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
        when(
          () => mocks.nativeApi.api.hashAssets([asset.id], allowNetworkAccess: false),
        ).thenAnswer((_) async => [result]);

        await sut.hashAssets();

        verify(() => mocks.nativeApi.api.hashAssets([asset.id], allowNetworkAccess: false)).called(1);
        final captured =
            verify(() => mocks.localAsset.repo.updateHashes(captureAny())).captured.first as Map<String, String>;
        expect(captured.length, 1);
        expect(captured[asset.id], result.hash);
      });

      test('handles failed hashes', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
        when(
          () => mocks.nativeApi.api.hashAssets([asset.id], allowNetworkAccess: false),
        ).thenAnswer((_) async => [HashResult(assetId: asset.id, error: 'Failed to hash')]);

        await sut.hashAssets();

        final captured =
            verify(() => mocks.localAsset.repo.updateHashes(captureAny())).captured.first as Map<String, String>;
        expect(captured.length, 0);
      });

      test('handles null hash results', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset]);
        when(
          () => mocks.nativeApi.api.hashAssets([asset.id], allowNetworkAccess: false),
        ).thenAnswer((_) async => [HashResult(assetId: asset.id, hash: null)]);

        await sut.hashAssets();

        final captured =
            verify(() => mocks.localAsset.repo.updateHashes(captureAny())).captured.first as Map<String, String>;
        expect(captured.length, 0);
      });

      test('batches by size limit', () async {
        const batchSize = 2;
        final sut = HashService(
          localAlbumRepository: mocks.localAlbum.repo,
          localAssetRepository: mocks.localAsset.repo,
          nativeSyncApi: mocks.nativeApi.api,
          batchSize: batchSize,
        );

        final album = LocalAlbumFactory.create();
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();
        final asset3 = LocalAssetFactory.create();

        final capturedCalls = <List<String>>[];

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset1, asset2, asset3]);
        when(mocks.nativeApi.hashAssets).thenAnswer((invocation) async {
          final assetIds = invocation.positionalArguments[0] as List<String>;
          capturedCalls.add(List<String>.from(assetIds));
          return assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList();
        });

        await sut.hashAssets();

        expect(capturedCalls.length, 2, reason: 'Should make exactly 2 calls to hashAssets');
        expect(capturedCalls[0], [asset1.id, asset2.id], reason: 'First call should batch the first two assets');
        expect(capturedCalls[1], [asset3.id], reason: 'Second call should have the remaining asset');

        verify(() => mocks.localAsset.repo.updateHashes(any())).called(2);
      });

      test('handles mixed success and failure in batch', () async {
        final album = LocalAlbumFactory.create();
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [album]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(album.id)).thenAnswer((_) async => [asset1, asset2]);
        when(() => mocks.nativeApi.api.hashAssets([asset1.id, asset2.id], allowNetworkAccess: false)).thenAnswer(
          (_) async => [
            HashResult(assetId: asset1.id, hash: 'asset1-hash'),
            HashResult(assetId: asset2.id, error: 'Failed to hash asset2'),
          ],
        );

        await sut.hashAssets();

        final captured =
            verify(() => mocks.localAsset.repo.updateHashes(captureAny())).captured.first as Map<String, String>;
        expect(captured.length, 1);
        expect(captured[asset1.id], 'asset1-hash');
      });

      test('uses allowNetworkAccess based on album backup selection', () async {
        final selectedAlbum = LocalAlbumFactory.create(backupSelection: BackupSelection.selected);
        final nonSelectedAlbum = LocalAlbumFactory.create(id: 'album2', backupSelection: BackupSelection.excluded);
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();

        when(mocks.localAlbum.getBackupAlbums).thenAnswer((_) async => [selectedAlbum, nonSelectedAlbum]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(selectedAlbum.id)).thenAnswer((_) async => [asset1]);
        when(() => mocks.localAlbum.repo.getAssetsToHash(nonSelectedAlbum.id)).thenAnswer((_) async => [asset2]);
        when(mocks.nativeApi.hashAssets).thenAnswer((invocation) async {
          final assetIds = invocation.positionalArguments[0] as List<String>;
          return assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList();
        });

        await sut.hashAssets();

        verify(() => mocks.nativeApi.api.hashAssets([asset1.id], allowNetworkAccess: true)).called(1);
        verify(() => mocks.nativeApi.api.hashAssets([asset2.id], allowNetworkAccess: false)).called(1);
      });
    });
  });
}
