import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/hash.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';

import '../../mockito_targets.handles.dart';
import '../../mocks.dart';
import '../factories/local_album_factory.dart';
import '../factories/local_asset_factory.dart';

void main() {
  late HashService sut;
  late LocalAlbumRepositoryMock localAlbum;
  late LocalAssetRepositoryMock localAsset;
  late NativeSyncApiMock nativeApi;
  late TrashedLocalAssetRepositoryMock trashedAsset;

  setUp(() {
    final mocks = RepositoryMocks();
    localAlbum = mocks.localAlbum;
    localAsset = mocks.localAsset;
    nativeApi = mocks.nativeApi;
    trashedAsset = mocks.trashedAsset;

    sut = HashService(
      localAlbumRepository: localAlbum,
      localAssetRepository: localAsset,
      nativeSyncApi: nativeApi,
      trashedLocalAssetRepository: trashedAsset,
    );
  });

  group('HashService', () {
    group('hashAssets', () {
      test('skips albums with no assets to hash', () async {
        final album = LocalAlbumFactory.create(assetCount: 0);
        localAlbum.getBackupAlbums.mockResolvedValue([album]);

        await sut.hashAssets();

        nativeApi.hashAssets.not.called();
      });

      test('skips empty batches', () async {
        final album = LocalAlbumFactory.create();
        localAlbum.getBackupAlbums.mockResolvedValue([album]);

        await sut.hashAssets();

        nativeApi.hashAssets.not.called();
      });

      test('processes assets when available', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();
        final result = HashResult(assetId: asset.id, hash: 'test-hash');

        localAlbum.getBackupAlbums.mockResolvedValue([album]);
        localAlbum.getAssetsToHash.mockResolvedValue([asset]);
        nativeApi.hashAssets.mockResolvedValue([result]);

        await sut.hashAssets();

        nativeApi.hashAssets.calledWith([asset.id], allowNetworkAccess: false);
        final hashes = localAsset.updateHashes.calls.single.hashes;
        expect(hashes.length, 1);
        expect(hashes[asset.id], result.hash);
      });

      test('handles failed hashes', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();

        localAlbum.getBackupAlbums.mockResolvedValue([album]);
        localAlbum.getAssetsToHash.mockResolvedValue([asset]);
        nativeApi.hashAssets.mockResolvedValue([HashResult(assetId: asset.id, error: 'Failed to hash')]);

        await sut.hashAssets();

        final hashes = localAsset.updateHashes.calls.single.hashes;
        expect(hashes.length, 0);
      });

      test('handles null hash results', () async {
        final album = LocalAlbumFactory.create();
        final asset = LocalAssetFactory.create();

        localAlbum.getBackupAlbums.mockResolvedValue([album]);
        localAlbum.getAssetsToHash.mockResolvedValue([asset]);
        nativeApi.hashAssets.mockResolvedValue([HashResult(assetId: asset.id, hash: null)]);

        await sut.hashAssets();

        final hashes = localAsset.updateHashes.calls.single.hashes;
        expect(hashes.length, 0);
      });

      test('batches by size limit', () async {
        const batchSize = 2;
        final sut = HashService(
          localAlbumRepository: localAlbum,
          localAssetRepository: localAsset,
          nativeSyncApi: nativeApi,
          batchSize: batchSize,
          trashedLocalAssetRepository: trashedAsset,
        );

        final album = LocalAlbumFactory.create();
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();
        final asset3 = LocalAssetFactory.create();

        localAlbum.getBackupAlbums.mockResolvedValue([album]);
        localAlbum.getAssetsToHash.mockResolvedValue([asset1, asset2, asset3]);
        nativeApi.hashAssets.mockImplementation(
          (assetIds, {required allowNetworkAccess}) async =>
              assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList(),
        );

        await sut.hashAssets();

        final calls = nativeApi.hashAssets.calls;
        expect(calls, hasLength(2), reason: 'Should make exactly 2 calls to hashAssets');
        expect(calls[0].assetIds, [asset1.id, asset2.id], reason: 'First call should batch the first two assets');
        expect(calls[1].assetIds, [asset3.id], reason: 'Second call should have the remaining asset');

        localAsset.updateHashes.called(2);
      });

      test('handles mixed success and failure in batch', () async {
        final album = LocalAlbumFactory.create();
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();

        localAlbum.getBackupAlbums.mockResolvedValue([album]);
        localAlbum.getAssetsToHash.mockResolvedValue([asset1, asset2]);
        nativeApi.hashAssets.mockResolvedValue([
          HashResult(assetId: asset1.id, hash: 'asset1-hash'),
          HashResult(assetId: asset2.id, error: 'Failed to hash asset2'),
        ]);

        await sut.hashAssets();

        final hashes = localAsset.updateHashes.calls.single.hashes;
        expect(hashes.length, 1);
        expect(hashes[asset1.id], 'asset1-hash');
      });

      test('uses allowNetworkAccess based on album backup selection', () async {
        final selectedAlbum = LocalAlbumFactory.create(backupSelection: BackupSelection.selected);
        final nonSelectedAlbum = LocalAlbumFactory.create(id: 'album2', backupSelection: BackupSelection.excluded);
        final asset1 = LocalAssetFactory.create();
        final asset2 = LocalAssetFactory.create();

        localAlbum.getBackupAlbums.mockResolvedValue([selectedAlbum, nonSelectedAlbum]);
        localAlbum.getAssetsToHash.mockImplementation(
          (albumId) async => albumId == selectedAlbum.id ? [asset1] : [asset2],
        );
        nativeApi.hashAssets.mockImplementation(
          (assetIds, {required allowNetworkAccess}) async =>
              assetIds.map((id) => HashResult(assetId: id, hash: '$id-hash')).toList(),
        );

        await sut.hashAssets();

        nativeApi.hashAssets.calledWith([asset1.id], allowNetworkAccess: true);
        nativeApi.hashAssets.calledWith([asset2.id], allowNetworkAccess: false);
      });
    });
  });
}
