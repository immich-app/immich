import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/domain/services/device_sync.service.dart';
import 'package:immich_mobile/platform/messages.g.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/local_album.stub.dart';
import '../../fixtures/local_asset.stub.dart';
import '../../fixtures/platform_asset.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

void main() {
  late IAlbumMediaRepository albumMediaRepo;
  late ILocalAlbumRepository localAlbumRepo;
  late ImHostApi hostApi;
  late MockPlatform platform;
  late DeviceSyncService sut;

  setUp(() {
    albumMediaRepo = MockAlbumMediaRepository();
    localAlbumRepo = MockLocalAlbumRepository();
    hostApi = MockHostApi();
    platform = MockPlatform();

    sut = DeviceSyncService(
      albumMediaRepository: albumMediaRepo,
      localAlbumRepository: localAlbumRepo,
      hostApi: hostApi,
      platform: platform,
    );

    registerFallbackValue(LocalAlbumStub.album1);
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(
      SyncDelta(hasChanges: true, updates: [], deletes: [], albumAssets: {}),
    );
    registerFallbackValue(SortLocalAlbumsBy.id);

    when(
      () => albumMediaRepo.getAll(
        withModifiedTime: any(named: 'withModifiedTime'),
      ),
    ).thenAnswer((_) async => []);
    when(() => albumMediaRepo.getAll()).thenAnswer((_) async => []);
    when(
      () => albumMediaRepo.getAssetsForAlbum(
        any(),
        updateTimeCond: any(named: 'updateTimeCond'),
      ),
    ).thenAnswer((_) async => []);
    when(() => albumMediaRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);
    when(() => localAlbumRepo.getAll(sortBy: any(named: 'sortBy')))
        .thenAnswer((_) async => []);
    when(() => localAlbumRepo.getAll()).thenAnswer((_) async => []);
    when(
      () => localAlbumRepo.upsert(
        any(),
        toUpsert: any(named: 'toUpsert'),
        toDelete: any(named: 'toDelete'),
      ),
    ).thenAnswer((_) async => {});
    when(() => localAlbumRepo.upsert(any())).thenAnswer((_) async => {});
    when(() => localAlbumRepo.delete(any())).thenAnswer((_) async => true);
    when(() => localAlbumRepo.updateAll(any())).thenAnswer((_) async => {});
    when(() => localAlbumRepo.processDelta(any())).thenAnswer((_) async => {});
    when(() => localAlbumRepo.syncAlbumDeletes(any(), any()))
        .thenAnswer((_) async => {});
    when(() => localAlbumRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);
    when(() => hostApi.shouldFullSync()).thenAnswer((_) async => true);
    when(() => hostApi.getMediaChanges()).thenAnswer(
      (_) async => SyncDelta(
        hasChanges: false,
        updates: [],
        deletes: [],
        albumAssets: {},
      ),
    );
    when(() => hostApi.getAssetIdsForAlbum(any())).thenAnswer((_) async => []);
    when(() => hostApi.checkpointSync()).thenAnswer((_) async => {});
    when(() => platform.isAndroid).thenReturn(false);
  });

  group('sync', () {
    test(
      'performs full sync and checkpoints when shouldFullSync is true',
      () async {
        when(() => hostApi.shouldFullSync()).thenAnswer((_) async => true);
        when(() => albumMediaRepo.getAll())
            .thenAnswer((_) async => [LocalAlbumStub.album1]);
        when(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => []);

        await sut.sync();

        verify(() => hostApi.shouldFullSync()).called(1);
        verify(() => albumMediaRepo.getAll()).called(1);
        verify(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verify(() => hostApi.checkpointSync()).called(1);
        verifyNever(() => hostApi.getMediaChanges());
      },
    );

    test(
      'skips sync and does not checkpoint when shouldFullSync is false and no media changes',
      () async {
        when(() => hostApi.shouldFullSync()).thenAnswer((_) async => false);
        when(() => hostApi.getMediaChanges()).thenAnswer(
          (_) async => SyncDelta(
            hasChanges: false,
            updates: [],
            deletes: [],
            albumAssets: {},
          ),
        );

        await sut.sync();

        verify(() => hostApi.shouldFullSync()).called(1);
        verify(() => hostApi.getMediaChanges()).called(1);
        verifyNever(
          () => albumMediaRepo.getAll(
            withModifiedTime: any(named: 'withModifiedTime'),
          ),
        );
        verifyNever(() => localAlbumRepo.updateAll(any()));
        verifyNever(() => localAlbumRepo.processDelta(any()));
        verifyNever(() => hostApi.checkpointSync());
      },
    );

    test(
      'processes delta and checkpoints for non-Android when shouldFullSync is false and media changes exist',
      () async {
        final delta = SyncDelta(
          hasChanges: true,
          updates: [PlatformAssetStub.image1],
          deletes: ["deleted"],
          albumAssets: {
            "albumId": ["asset1", "asset2"],
          },
        );
        final devAlbums = [LocalAlbumStub.album1];

        when(() => hostApi.shouldFullSync()).thenAnswer((_) async => false);
        when(() => hostApi.getMediaChanges()).thenAnswer((_) async => delta);
        when(() => albumMediaRepo.getAll(withModifiedTime: true))
            .thenAnswer((_) async => devAlbums);
        when(() => platform.isAndroid).thenReturn(false);

        await sut.sync();

        verifyInOrder([
          () => hostApi.shouldFullSync(),
          () => hostApi.getMediaChanges(),
          () => albumMediaRepo.getAll(withModifiedTime: true),
          () => localAlbumRepo.updateAll(devAlbums),
          () => localAlbumRepo.processDelta(delta),
          () => hostApi.checkpointSync(),
        ]);
        verifyNever(() => hostApi.getAssetIdsForAlbum(any()));
      },
    );

    test(
      'processes delta, Android logic, and checkpoints when shouldFullSync is false and media changes exist',
      () async {
        final delta = SyncDelta(
          hasChanges: true,
          updates: [PlatformAssetStub.image1],
          deletes: ["deleted"],
          albumAssets: {
            "dbAlbumId": ["asset1", "asset2"],
          },
        );
        final devAlbums = [LocalAlbumStub.album1];
        final dbAlbums = [LocalAlbumStub.album2.copyWith(id: "dbAlbumId")];
        final assetIds = ["asset1", "asset2"];

        when(() => hostApi.shouldFullSync()).thenAnswer((_) async => false);
        when(() => hostApi.getMediaChanges()).thenAnswer((_) async => delta);
        when(() => albumMediaRepo.getAll(withModifiedTime: true))
            .thenAnswer((_) async => devAlbums);
        when(() => localAlbumRepo.getAll()).thenAnswer((_) async => dbAlbums);
        when(() => platform.isAndroid).thenReturn(true);
        when(() => hostApi.getAssetIdsForAlbum(dbAlbums.first.id))
            .thenAnswer((_) async => assetIds);

        await sut.sync();

        verifyInOrder([
          () => hostApi.shouldFullSync(),
          () => hostApi.getMediaChanges(),
          () => albumMediaRepo.getAll(withModifiedTime: true),
          () => localAlbumRepo.updateAll(devAlbums),
          () => localAlbumRepo.processDelta(delta),
          () => platform.isAndroid,
          () => localAlbumRepo.getAll(),
          () => hostApi.getAssetIdsForAlbum(dbAlbums.first.id),
          () => localAlbumRepo.syncAlbumDeletes(dbAlbums.first.id, assetIds),
          () => hostApi.checkpointSync(),
        ]);
      },
    );

    test('handles error from shouldFullSync and does not checkpoint', () async {
      when(() => hostApi.shouldFullSync()).thenThrow(Exception("Host error"));
      await sut.sync();
      verify(() => hostApi.shouldFullSync()).called(1);
      verifyNever(() => hostApi.getMediaChanges());
      verifyNever(() => hostApi.checkpointSync());
    });

    test(
      'handles error from getMediaChanges and does not checkpoint',
      () async {
        when(() => hostApi.shouldFullSync()).thenAnswer((_) async => false);
        when(() => hostApi.getMediaChanges())
            .thenThrow(Exception("Host error"));
        await sut.sync();
        verify(() => hostApi.shouldFullSync()).called(1);
        verify(() => hostApi.getMediaChanges()).called(1);
        verifyNever(() => localAlbumRepo.updateAll(any()));
        verifyNever(() => hostApi.checkpointSync());
      },
    );
  });

  group('fullSync', () {
    test(
      'completes and checkpoints when no albums exist on device or DB',
      () async {
        when(() => albumMediaRepo.getAll()).thenAnswer((_) async => []);
        when(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => []);
        await sut.fullSync();
        verify(() => albumMediaRepo.getAll()).called(1);
        verify(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verifyNever(
          () => localAlbumRepo.upsert(
            any(),
            toUpsert: any(named: 'toUpsert'),
            toDelete: any(named: 'toDelete'),
          ),
        );
        verifyNever(() => localAlbumRepo.delete(any()));
        verify(() => hostApi.checkpointSync()).called(1);
      },
    );

    test('calls addAlbum for new device albums and checkpoints', () async {
      final devAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      final album1Assets = [LocalAssetStub.image1];

      when(() => albumMediaRepo.getAll()).thenAnswer((_) async => devAlbums);
      when(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => []);
      when(() => albumMediaRepo.getAssetsForAlbum(devAlbums.first.id))
          .thenAnswer((_) async => album1Assets);

      await sut.fullSync();

      verify(() => albumMediaRepo.getAll()).called(1);
      verify(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(() => albumMediaRepo.getAssetsForAlbum(devAlbums.first.id))
          .called(1);
      verify(
        () => localAlbumRepo.upsert(
          devAlbums.first,
          toUpsert: album1Assets,
          toDelete: [],
        ),
      ).called(1);
      verify(() => albumMediaRepo.getAssetsForAlbum(devAlbums[1].id)).called(1);
      verify(
        () => localAlbumRepo.upsert(devAlbums[1], toUpsert: [], toDelete: []),
      ).called(1);
      verify(() => hostApi.checkpointSync()).called(1);
    });

    test(
      'calls removeAlbum for DB albums not on device and checkpoints',
      () async {
        final dbAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
        when(() => albumMediaRepo.getAll()).thenAnswer((_) async => []);
        when(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => dbAlbums);
        await sut.fullSync();
        verify(() => albumMediaRepo.getAll()).called(1);
        verify(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verify(() => localAlbumRepo.delete(dbAlbums.first.id)).called(1);
        verify(() => localAlbumRepo.delete(dbAlbums[1].id)).called(1);
        verify(() => hostApi.checkpointSync()).called(1);
      },
    );

    test(
      'calls updateAlbum for common albums which then calls fullDiff and checkpoints',
      () async {
        final dbAlbum = LocalAlbumStub.album1
            .copyWith(updatedAt: DateTime(2023, 12, 31), assetCount: 1);
        final devAlbum = LocalAlbumStub.album1
            .copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 3);

        when(() => albumMediaRepo.getAll()).thenAnswer((_) async => [devAlbum]);
        when(() => localAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => [dbAlbum]);
        when(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).thenAnswer((_) async => [LocalAssetStub.image2]);

        final devAssets = [LocalAssetStub.image1, LocalAssetStub.image2];
        final dbAssets = [LocalAssetStub.image1, LocalAssetStub.video1];

        when(() => albumMediaRepo.getAssetsForAlbum(devAlbum.id))
            .thenAnswer((_) async => devAssets);
        when(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => dbAssets);

        await sut.fullSync();

        verify(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).called(2);
        verify(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
        verify(
          () => localAlbumRepo.upsert(
            any(
              that: predicate<LocalAlbum>(
                (a) =>
                    a.id == LocalAlbumStub.album1.id &&
                    a.assetCount == devAlbum.assetCount &&
                    a.updatedAt == devAlbum.updatedAt &&
                    a.backupSelection == dbAlbum.backupSelection,
              ),
            ),
            toUpsert: [LocalAssetStub.image2],
            toDelete: [LocalAssetStub.video1.id],
          ),
        ).called(1);
        verify(() => hostApi.checkpointSync()).called(1);
      },
    );

    test(
      'handles repository errors gracefully and does not checkpoint',
      () async {
        when(() => albumMediaRepo.getAll()).thenThrow(Exception("Repo error"));
        await sut.fullSync();
        verify(() => albumMediaRepo.getAll()).called(1);
        verifyNever(() => localAlbumRepo.getAll(sortBy: any(named: 'sortBy')));
        verifyNever(() => hostApi.checkpointSync());
      },
    );
  });

  group('addAlbum', () {
    test('gets assets and upserts for album with assetCount > 0', () async {
      final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 1);
      final assets = [LocalAssetStub.image1];
      when(() => albumMediaRepo.getAssetsForAlbum(newAlbum.id))
          .thenAnswer((_) async => assets);
      await sut.addAlbum(newAlbum);
      verify(() => albumMediaRepo.getAssetsForAlbum(newAlbum.id)).called(1);
      verify(
        () => localAlbumRepo.upsert(newAlbum, toUpsert: assets, toDelete: []),
      ).called(1);
    });

    test(
      'skips getting assets and upserts with empty list for album with assetCount = 0',
      () async {
        final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
        await sut.addAlbum(newAlbum);
        verifyNever(() => albumMediaRepo.getAssetsForAlbum(newAlbum.id));
        verify(
          () => localAlbumRepo.upsert(newAlbum, toUpsert: [], toDelete: []),
        ).called(1);
      },
    );
  });

  group('removeAlbum', () {
    test('calls localAlbumRepository.delete', () async {
      final album = LocalAlbumStub.album1;
      await sut.removeAlbum(album);
      verify(() => localAlbumRepo.delete(album.id)).called(1);
    });
  });

  group('updateAlbum', () {
    final dbAlbum = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 1);

    test('returns early (false) if albums are considered equal', () async {
      final result = await sut.updateAlbum(dbAlbum, dbAlbum);
      expect(result, false);
      verifyNever(
        () => albumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
    });

    test('calls checkAddition and returns true if it succeeds', () async {
      final updatedAlbum =
          dbAlbum.copyWith(updatedAt: DateTime(2024, 1, 2), assetCount: 2);
      final newAsset = LocalAssetStub.image2;
      when(
        () => albumMediaRepo.getAssetsForAlbum(
          updatedAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      final result = await sut.updateAlbum(dbAlbum, updatedAlbum);

      expect(result, isTrue);
      verify(
        () => albumMediaRepo.getAssetsForAlbum(
          updatedAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(
        () => localAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == updatedAlbum.assetCount &&
                  a.updatedAt == updatedAlbum.updatedAt &&
                  a.backupSelection == dbAlbum.backupSelection,
            ),
          ),
          toUpsert: [newAsset],
          toDelete: any(named: 'toDelete', that: isEmpty),
        ),
      ).called(1);
    });

    test(
      'calls fullDiff and returns true if _albumsEqual is false and checkAddition returns false',
      () async {
        final updatedAlbum = dbAlbum.copyWith(
          name: "Changed Name",
          updatedAt: DateTime(2024, 1, 2),
          assetCount: 0,
        );
        final dbAssets = [
          LocalAssetStub.image1.copyWith(id: "${dbAlbum.id}_asset1"),
        ];
        when(() => albumMediaRepo.getAssetsForAlbum(updatedAlbum.id))
            .thenAnswer((_) async => []);
        when(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => dbAssets);

        final result = await sut.updateAlbum(dbAlbum, updatedAlbum);

        expect(result, isTrue);
        verifyNever(
          () => albumMediaRepo.getAssetsForAlbum(
            updatedAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        );
        verify(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
        verify(
          () => localAlbumRepo.upsert(
            any(
              that: predicate<LocalAlbum>(
                (a) =>
                    a.id == dbAlbum.id &&
                    a.assetCount == updatedAlbum.assetCount &&
                    a.updatedAt == updatedAlbum.updatedAt &&
                    a.name == updatedAlbum.name &&
                    a.backupSelection == dbAlbum.backupSelection,
              ),
            ),
            toUpsert: [],
            toDelete: [dbAssets.first.id],
          ),
        ).called(1);
      },
    );
  });

  group('checkAddition', () {
    final dbAlbum = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1, 10, 0, 0), assetCount: 1);
    final devAlbumBase =
        dbAlbum.copyWith(updatedAt: DateTime(2024, 1, 1, 11, 0, 0));

    test('returns true and updates assets/metadata on success', () async {
      final devAlbum = devAlbumBase.copyWith(assetCount: 2);
      final newAsset = LocalAssetStub.image2;
      when(
        () => albumMediaRepo.getAssetsForAlbum(
          devAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      final result = await sut.checkAddition(dbAlbum, devAlbum);

      expect(result, isTrue);
      verify(
        () => albumMediaRepo.getAssetsForAlbum(
          devAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(
        () => localAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == devAlbum.assetCount &&
                  a.updatedAt == devAlbum.updatedAt &&
                  a.backupSelection == dbAlbum.backupSelection,
            ),
          ),
          toUpsert: [newAsset],
          toDelete: any(named: 'toDelete', that: isEmpty),
        ),
      ).called(1);
    });

    test(
      'returns false if deviceAlbum.assetCount <= dbAlbum.assetCount',
      () async {
        final result = await sut.checkAddition(
          dbAlbum,
          devAlbumBase.copyWith(assetCount: 1),
        );
        expect(result, isFalse);
        verifyNever(
          () => albumMediaRepo.getAssetsForAlbum(
            any(),
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        );

        final result2 = await sut.checkAddition(
          dbAlbum,
          devAlbumBase.copyWith(assetCount: 0),
        );
        expect(result2, isFalse);
        verifyNever(
          () => albumMediaRepo.getAssetsForAlbum(
            any(),
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        );
      },
    );

    test(
      'returns false if no new assets found by query (when assetCount increased)',
      () async {
        final devAlbum = devAlbumBase.copyWith(assetCount: 2);
        when(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).thenAnswer((_) async => []);
        final result = await sut.checkAddition(dbAlbum, devAlbum);
        expect(result, isFalse);
        verify(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).called(1);
      },
    );

    test(
      'returns false if asset count mismatch after finding new assets',
      () async {
        final devAlbum = devAlbumBase.copyWith(assetCount: 3);
        final newAsset =
            LocalAssetStub.image2.copyWith(id: "asset2_for_mismatch");
        when(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).thenAnswer((_) async => [newAsset]);
        final result = await sut.checkAddition(dbAlbum, devAlbum);
        expect(result, isFalse);
        verify(
          () => albumMediaRepo.getAssetsForAlbum(
            devAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).called(1);
      },
    );
  });

  group('fullDiff', () {
    final dbAlbumBase = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 2);
    final devAlbumBase = dbAlbumBase.copyWith(updatedAt: DateTime(2024, 1, 2));
    final dbAsset1 = LocalAssetStub.image1;
    final dbAsset2 = LocalAssetStub.image2;
    final devAsset1Updated = dbAsset1.copyWith(updatedAt: DateTime(2025));
    final devAsset3New = LocalAssetStub.video1;

    test('handles empty device album -> deletes all DB assets', () async {
      final dbAlbum = dbAlbumBase.copyWith();
      final devAlbumEmpty = devAlbumBase.copyWith(assetCount: 0);
      when(() => albumMediaRepo.getAssetsForAlbum(devAlbumEmpty.id))
          .thenAnswer((_) async => []);
      when(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => [dbAsset1, dbAsset2]);

      final result = await sut.fullDiff(dbAlbum, devAlbumEmpty);

      expect(result, isTrue);
      verifyNever(() => albumMediaRepo.getAssetsForAlbum(devAlbumEmpty.id));
      verify(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(
        () => localAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == devAlbumEmpty.assetCount &&
                  a.updatedAt == devAlbumEmpty.updatedAt &&
                  a.backupSelection == dbAlbum.backupSelection,
            ),
          ),
          toUpsert: [],
          toDelete: [dbAsset1.id, dbAsset2.id],
        ),
      ).called(1);
    });

    test('handles empty DB album -> adds all device assets', () async {
      final dbAlbumEmpty = dbAlbumBase.copyWith(assetCount: 0);
      final devAssets = [devAsset1Updated, devAsset3New];
      final devAlbumWithAssets =
          devAlbumBase.copyWith(assetCount: devAssets.length);
      when(() => albumMediaRepo.getAssetsForAlbum(devAlbumWithAssets.id))
          .thenAnswer((_) async => devAssets);
      when(() => localAlbumRepo.getAssetsForAlbum(dbAlbumEmpty.id))
          .thenAnswer((_) async => []);

      final result = await sut.fullDiff(dbAlbumEmpty, devAlbumWithAssets);

      expect(result, isTrue);
      verify(() => albumMediaRepo.getAssetsForAlbum(devAlbumWithAssets.id))
          .called(1);
      verifyNever(() => localAlbumRepo.getAssetsForAlbum(dbAlbumEmpty.id));
      verify(
        () => localAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbumEmpty.id &&
                  a.assetCount == devAlbumWithAssets.assetCount &&
                  a.updatedAt == devAlbumWithAssets.updatedAt &&
                  a.backupSelection == dbAlbumEmpty.backupSelection,
            ),
          ),
          toUpsert: any(named: 'toUpsert', that: containsAllInOrder(devAssets)),
          toDelete: [],
        ),
      ).called(1);
    });

    test('handles mix of additions, updates, and deletions', () async {
      final dbAlbum = dbAlbumBase.copyWith(assetCount: 2);
      final devAssets = [devAsset1Updated, devAsset3New];
      final devAlbum = devAlbumBase.copyWith(assetCount: devAssets.length);
      final dbAssetsInRepo = [dbAsset1, dbAsset2];
      when(() => albumMediaRepo.getAssetsForAlbum(devAlbum.id))
          .thenAnswer((_) async => devAssets);
      when(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => dbAssetsInRepo);

      final result = await sut.fullDiff(dbAlbum, devAlbum);

      expect(result, isTrue);
      verify(() => albumMediaRepo.getAssetsForAlbum(devAlbum.id)).called(1);
      verify(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(
        () => localAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == devAlbum.assetCount &&
                  a.updatedAt == devAlbum.updatedAt &&
                  a.backupSelection == dbAlbum.backupSelection,
            ),
          ),
          toUpsert: any(
            named: 'toUpsert',
            that: containsAllInOrder([devAsset1Updated, devAsset3New]),
          ),
          toDelete: [dbAsset2.id],
        ),
      ).called(1);
    });

    test(
      'handles identical assets (only metadata update if album changed)',
      () async {
        final dbAlbum = dbAlbumBase.copyWith(assetCount: 2);
        final devAlbumMetaChg =
            devAlbumBase.copyWith(updatedAt: DateTime(2025), assetCount: 2);
        final commonAssets = [
          dbAsset1,
          dbAsset2.copyWith(updatedAt: dbAsset1.updatedAt),
        ];
        when(() => albumMediaRepo.getAssetsForAlbum(devAlbumMetaChg.id))
            .thenAnswer((_) async => commonAssets);
        when(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => commonAssets);

        final result = await sut.fullDiff(dbAlbum, devAlbumMetaChg);

        expect(result, isTrue);
        verify(() => albumMediaRepo.getAssetsForAlbum(devAlbumMetaChg.id))
            .called(1);
        verify(() => localAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
        verify(
          () => localAlbumRepo.upsert(
            any(
              that: predicate<LocalAlbum>(
                (a) =>
                    a.id == dbAlbum.id &&
                    a.assetCount == devAlbumMetaChg.assetCount &&
                    a.updatedAt == devAlbumMetaChg.updatedAt &&
                    a.backupSelection == dbAlbum.backupSelection,
              ),
            ),
            toUpsert: [],
            toDelete: [],
          ),
        ).called(1);
      },
    );
  });
}
