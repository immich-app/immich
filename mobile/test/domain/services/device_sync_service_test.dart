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
  late IAlbumMediaRepository mockAlbumMediaRepo;
  late ILocalAlbumRepository mockLocalAlbumRepo;
  late ImHostService mockHostService;
  late MockPlatform mockPlatformInstance;
  late DeviceSyncService sut;

  Future<T> mockTransaction<T>(Future<T> Function() action) => action();

  setUp(() {
    mockAlbumMediaRepo = MockAlbumMediaRepository();
    mockLocalAlbumRepo = MockLocalAlbumRepository();
    mockHostService = MockHostService();
    mockPlatformInstance = MockPlatform();

    sut = DeviceSyncService(
      albumMediaRepository: mockAlbumMediaRepo,
      localAlbumRepository: mockLocalAlbumRepo,
      hostService: mockHostService,
      platform: mockPlatformInstance,
    );

    registerFallbackValue(LocalAlbumStub.album1);
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(
      SyncDelta(hasChanges: true, updates: [], deletes: []),
    );

    when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
    when(() => mockAlbumMediaRepo.refresh(any())).thenAnswer(
      (inv) async => LocalAlbumStub.album1.copyWith(
        id: inv.positionalArguments.first as String,
        assetCount: 0,
      ),
    );
    when(
      () => mockAlbumMediaRepo.getAssetsForAlbum(
        any(),
        updateTimeCond: any(named: 'updateTimeCond'),
      ),
    ).thenAnswer((_) async => []);
    when(() => mockAlbumMediaRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);

    when(() => mockLocalAlbumRepo.getAll(sortBy: any(named: 'sortBy')))
        .thenAnswer((_) async => []);
    when(() => mockLocalAlbumRepo.getAll()).thenAnswer((_) async => []);
    when(
      () => mockLocalAlbumRepo.upsert(
        any(),
        toUpsert: any(named: 'toUpsert'),
        toDelete: any(named: 'toDelete'),
      ),
    ).thenAnswer((_) async => {});
    when(() => mockLocalAlbumRepo.delete(any())).thenAnswer((_) async => true);
    when(() => mockLocalAlbumRepo.updateAll(any())).thenAnswer((_) async => {});
    when(() => mockLocalAlbumRepo.processDelta(any()))
        .thenAnswer((_) async => {});
    when(() => mockLocalAlbumRepo.syncAlbumDeletes(any(), any()))
        .thenAnswer((_) async => {});
    when(() => mockLocalAlbumRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);
    when(() => mockLocalAlbumRepo.transaction<void>(any())).thenAnswer(
      (inv) => mockTransaction(
        inv.positionalArguments.first as Future<void> Function(),
      ),
    );

    when(() => mockHostService.shouldFullSync()).thenAnswer((_) async => true);
    when(() => mockHostService.getMediaChanges()).thenAnswer(
      (_) async => SyncDelta(hasChanges: false, updates: [], deletes: []),
    );
    when(() => mockHostService.getAssetIdsForAlbum(any()))
        .thenAnswer((_) async => []);
    when(() => mockHostService.checkpointSync()).thenAnswer((_) async => {});

    when(() => mockPlatformInstance.isAndroid).thenReturn(false);
  });

  group('sync', () {
    test(
      'performs full sync and checkpoints when shouldFullSync is true',
      () async {
        when(() => mockHostService.shouldFullSync())
            .thenAnswer((_) async => true);
        when(() => mockAlbumMediaRepo.getAll())
            .thenAnswer((_) async => [LocalAlbumStub.album1]);
        when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => []);

        await sut.sync();

        verify(() => mockHostService.shouldFullSync()).called(1);
        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verify(() => mockHostService.checkpointSync()).called(1);
        verifyNever(() => mockHostService.getMediaChanges());
      },
    );

    test(
      'skips sync and does not checkpoint when shouldFullSync is false and no media changes',
      () async {
        when(() => mockHostService.shouldFullSync())
            .thenAnswer((_) async => false);
        when(() => mockHostService.getMediaChanges()).thenAnswer(
          (_) async => SyncDelta(hasChanges: false, updates: [], deletes: []),
        );

        await sut.sync();

        verify(() => mockHostService.shouldFullSync()).called(1);
        verify(() => mockHostService.getMediaChanges()).called(1);
        verifyNever(() => mockAlbumMediaRepo.getAll());
        verifyNever(() => mockLocalAlbumRepo.updateAll(any()));
        verifyNever(() => mockLocalAlbumRepo.processDelta(any()));
        verifyNever(() => mockHostService.checkpointSync());
      },
    );

    test(
      'processes delta and checkpoints for non-Android when shouldFullSync is false and media changes exist',
      () async {
        final delta = SyncDelta(
          hasChanges: true,
          updates: [PlatformAssetStub.image1],
          deletes: ["deleted"],
        );
        final deviceAlbums = [LocalAlbumStub.album1];

        when(() => mockHostService.shouldFullSync())
            .thenAnswer((_) async => false);
        when(() => mockHostService.getMediaChanges())
            .thenAnswer((_) async => delta);
        when(() => mockAlbumMediaRepo.getAll())
            .thenAnswer((_) async => deviceAlbums);
        when(() => mockPlatformInstance.isAndroid).thenReturn(false);

        await sut.sync();

        verifyInOrder([
          () => mockHostService.shouldFullSync(),
          () => mockHostService.getMediaChanges(),
          () => mockAlbumMediaRepo.getAll(),
          () => mockLocalAlbumRepo.updateAll(deviceAlbums),
          () => mockLocalAlbumRepo.processDelta(delta),
          () => mockHostService.checkpointSync(),
        ]);
        verifyNever(() => mockHostService.getAssetIdsForAlbum(any()));
      },
    );

    test(
      'processes delta, Android logic, and checkpoints when shouldFullSync is false and media changes exist',
      () async {
        final delta = SyncDelta(
          hasChanges: true,
          updates: [PlatformAssetStub.image1],
          deletes: ["deleted"],
        );
        final deviceAlbums = [LocalAlbumStub.album1];
        final dbAlbums = [LocalAlbumStub.album2.copyWith(id: "dbAlbumId")];
        final assetIdsForDbAlbum = ["asset1", "asset2"];

        when(() => mockHostService.shouldFullSync())
            .thenAnswer((_) async => false);
        when(() => mockHostService.getMediaChanges())
            .thenAnswer((_) async => delta);
        when(() => mockAlbumMediaRepo.getAll())
            .thenAnswer((_) async => deviceAlbums);
        when(() => mockLocalAlbumRepo.getAll())
            .thenAnswer((_) async => dbAlbums);
        when(() => mockPlatformInstance.isAndroid).thenReturn(true);
        when(() => mockHostService.getAssetIdsForAlbum(dbAlbums.first.id))
            .thenAnswer((_) async => assetIdsForDbAlbum);

        await sut.sync();

        verifyInOrder([
          () => mockHostService.shouldFullSync(),
          () => mockHostService.getMediaChanges(),
          () => mockAlbumMediaRepo.getAll(),
          () => mockLocalAlbumRepo.updateAll(deviceAlbums),
          () => mockLocalAlbumRepo.processDelta(delta),
          () => mockPlatformInstance.isAndroid,
          () => mockLocalAlbumRepo.getAll(),
          () => mockHostService.getAssetIdsForAlbum(dbAlbums.first.id),
          () => mockLocalAlbumRepo.syncAlbumDeletes(
                dbAlbums.first.id,
                assetIdsForDbAlbum,
              ),
          () => mockHostService.checkpointSync(),
        ]);
      },
    );

    test('handles error from shouldFullSync and does not checkpoint', () async {
      when(() => mockHostService.shouldFullSync())
          .thenThrow(Exception("Host error"));

      await sut.sync();

      verify(() => mockHostService.shouldFullSync()).called(1);
      verifyNever(() => mockHostService.getMediaChanges());
      verifyNever(() => mockHostService.checkpointSync());
    });

    test(
      'handles error from getMediaChanges and does not checkpoint',
      () async {
        when(() => mockHostService.shouldFullSync())
            .thenAnswer((_) async => false);
        when(() => mockHostService.getMediaChanges())
            .thenThrow(Exception("Host error"));

        await sut.sync();

        verify(() => mockHostService.shouldFullSync()).called(1);
        verify(() => mockHostService.getMediaChanges()).called(1);
        verifyNever(() => mockLocalAlbumRepo.updateAll(any()));
        verifyNever(() => mockHostService.checkpointSync());
      },
    );
  });

  group('fullSync', () {
    test(
      'completes and checkpoints when no albums exist on device or DB',
      () async {
        when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
        when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => []);

        await sut.fullSync();

        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verifyNever(
          () => mockLocalAlbumRepo.upsert(
            any(),
            toUpsert: any(named: 'toUpsert'),
          ),
        );
        verifyNever(() => mockLocalAlbumRepo.delete(any()));
        verify(() => mockHostService.checkpointSync()).called(1);
      },
    );

    test('calls addAlbum for new device albums and checkpoints', () async {
      final deviceAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => []);

      final refreshedAlbum1 = deviceAlbums.first.copyWith(assetCount: 1);
      final refreshedAlbum2 = deviceAlbums[1].copyWith(assetCount: 0);
      when(() => mockAlbumMediaRepo.refresh(deviceAlbums.first.id))
          .thenAnswer((_) async => refreshedAlbum1);
      when(() => mockAlbumMediaRepo.refresh(deviceAlbums[1].id))
          .thenAnswer((_) async => refreshedAlbum2);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .thenAnswer((_) async => [LocalAssetStub.image1]);

      await sut.fullSync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(() => mockAlbumMediaRepo.refresh(deviceAlbums.first.id)).called(1);
      verify(() => mockAlbumMediaRepo.refresh(deviceAlbums[1].id)).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          refreshedAlbum1,
          toUpsert: [LocalAssetStub.image1],
          toDelete: [],
        ),
      ).called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          refreshedAlbum2,
          toUpsert: [],
          toDelete: [],
        ),
      ).called(1);
      verify(() => mockHostService.checkpointSync()).called(1);
    });

    test(
      'calls removeAlbum for DB albums not on device and checkpoints',
      () async {
        final dbAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
        when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
        when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => dbAlbums);

        await sut.fullSync();

        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.delete(dbAlbums.first.id)).called(1);
        verify(() => mockLocalAlbumRepo.delete(dbAlbums[1].id)).called(1);
        verify(() => mockHostService.checkpointSync()).called(1);
      },
    );

    test('calls updateAlbum for common albums and checkpoints', () async {
      final commonAlbum = LocalAlbumStub.album1;
      final deviceAlbums = [commonAlbum];
      final dbAlbums = [
        commonAlbum.copyWith(
          updatedAt: commonAlbum.updatedAt.subtract(const Duration(days: 10)),
        ),
      ];
      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => dbAlbums);

      final refreshedAlbum =
          commonAlbum.copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 2);
      when(() => mockAlbumMediaRepo.refresh(commonAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          commonAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [LocalAssetStub.image2]);

      await sut.fullSync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(() => mockAlbumMediaRepo.refresh(commonAlbum.id)).called(1);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          commonAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) => a.id == commonAlbum.id && a.assetCount == 2,
            ),
          ),
          toUpsert: [LocalAssetStub.image2],
        ),
      ).called(1);
      verify(() => mockHostService.checkpointSync()).called(1);
    });

    test(
      'handles repository errors gracefully and does not checkpoint',
      () async {
        when(() => mockAlbumMediaRepo.getAll())
            .thenThrow(Exception("Repo error"));

        await sut.fullSync();

        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verifyNever(
          () => mockLocalAlbumRepo.getAll(sortBy: any(named: 'sortBy')),
        );
        verifyNever(() => mockHostService.checkpointSync());
      },
    );
  });

  group('addAlbum', () {
    test('refreshes, gets assets, and updates for non-empty album', () async {
      final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
      final refreshedAlbum = newAlbum.copyWith(assetCount: 1);
      final assets = [LocalAssetStub.image1];

      when(() => mockAlbumMediaRepo.refresh(newAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id))
          .thenAnswer((_) async => assets);

      await sut.addAlbum(newAlbum);

      verify(() => mockAlbumMediaRepo.refresh(newAlbum.id)).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.upsert(refreshedAlbum, toUpsert: assets))
          .called(1);
    });

    test('refreshes, skips assets, and updates for empty album', () async {
      final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
      final refreshedAlbum = newAlbum.copyWith(assetCount: 0);

      when(() => mockAlbumMediaRepo.refresh(newAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);

      await sut.addAlbum(newAlbum);

      verify(() => mockAlbumMediaRepo.refresh(newAlbum.id)).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id));
      verify(() => mockLocalAlbumRepo.upsert(refreshedAlbum, toUpsert: []))
          .called(1);
    });
  });

  group('removeAlbum', () {
    test('calls localAlbumRepository.delete', () async {
      final albumToDelete = LocalAlbumStub.album1;
      await sut.removeAlbum(albumToDelete);
      verify(() => mockLocalAlbumRepo.delete(albumToDelete.id)).called(1);
    });
  });

  group('updateAlbum', () {
    final dbAlbum = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 1);

    test('returns early if refresh shows no changes', () async {
      final refreshedAlbum = dbAlbum;
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);

      final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album2);

      expect(result, false);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
    });

    test('calls checkAddition and returns true if it succeeds', () async {
      final refreshedAlbum =
          dbAlbum.copyWith(updatedAt: DateTime(2024, 1, 2), assetCount: 2);
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);

      final newAsset = LocalAssetStub.image2.copyWith(id: "new_asset");
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album2);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) => a.id == dbAlbum.id && a.assetCount == 2,
            ),
          ),
          toUpsert: [newAsset],
        ),
      ).called(1);
    });

    test(
      'calls fullDiff and returns true if checkAddition returns false',
      () async {
        final refreshedAlbum =
            dbAlbum.copyWith(updatedAt: DateTime(2024, 1, 2), assetCount: 0);
        when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
            .thenAnswer((_) async => refreshedAlbum);

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => []);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => [LocalAssetStub.image1]);

        final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album2);

        expect(result, isTrue);
        verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
        verifyNever(
          () => mockAlbumMediaRepo.getAssetsForAlbum(
            dbAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        );

        verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
        verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .called(1);
        verify(
          () => mockLocalAlbumRepo.upsert(
            any(
              that: predicate<LocalAlbum>(
                (a) => a.id == dbAlbum.id && a.assetCount == 0,
              ),
            ),
            toDelete: [LocalAssetStub.image1.id],
          ),
        ).called(1);
      },
    );
  });

  group('checkAddition', () {
    final dbAlbum = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1, 10, 0, 0), assetCount: 1);
    final refreshedAlbum = dbAlbum.copyWith(
      updatedAt: DateTime(2024, 1, 1, 11, 0, 0),
      assetCount: 2,
    );

    test('returns true and updates assets/metadata on success', () async {
      final newAsset = LocalAssetStub.image2
          .copyWith(id: "asset2", createdAt: DateTime(2024, 1, 1, 10, 30, 0));
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      final result = await sut.checkAddition(dbAlbum, refreshedAlbum);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == refreshedAlbum.updatedAt,
            ),
          ),
          toUpsert: [newAsset],
        ),
      ).called(1);
    });

    test('returns false if assetCount decreased', () async {
      final decreasedCountAlbum = refreshedAlbum.copyWith(assetCount: 0);
      final result = await sut.checkAddition(dbAlbum, decreasedCountAlbum);
      expect(result, isFalse);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
    });

    test('returns false if no new assets found by query', () async {
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => []);
      final result = await sut.checkAddition(dbAlbum, refreshedAlbum);
      expect(result, isFalse);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
    });

    test(
      'returns false if asset count mismatch after finding new assets (implies deletion)',
      () async {
        final newAsset = LocalAssetStub.image2.copyWith(id: "asset2");
        when(
          () => mockAlbumMediaRepo.getAssetsForAlbum(
            dbAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).thenAnswer((_) async => [newAsset]);
        // dbAlbum.assetCount = 1, newAssets.length = 1. Expected refreshedAlbum.assetCount = 2
        // But we set it to 3, indicating a mismatch.
        final mismatchedCountAlbum = refreshedAlbum.copyWith(assetCount: 3);
        final result = await sut.checkAddition(dbAlbum, mismatchedCountAlbum);
        expect(result, isFalse);
        verify(
          () => mockAlbumMediaRepo.getAssetsForAlbum(
            dbAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        ).called(1);
      },
    );
  });

  group('fullDiff', () {
    final dbAlbum = LocalAlbumStub.album1
        .copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 2);
    final refreshedAlbum = dbAlbum.copyWith(
      updatedAt: DateTime(2024, 1, 2),
      assetCount: 2,
    );

    final dbAsset1 = LocalAssetStub.image1.copyWith(id: "asset1");
    final dbAsset2 = LocalAssetStub.image2.copyWith(id: "asset2");
    final deviceAsset1Updated =
        LocalAssetStub.image1.copyWith(id: "asset1", updatedAt: DateTime(2025));
    final deviceAsset3New = LocalAssetStub.video1.copyWith(id: "asset3");

    test('handles empty device album -> deletes all DB assets', () async {
      final emptyRefreshedAlbum = refreshedAlbum.copyWith(assetCount: 0);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => [dbAsset1, dbAsset2]);

      final result = await sut.fullDiff(dbAlbum, emptyRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) => a.id == dbAlbum.id && a.assetCount == 0,
            ),
          ),
          toDelete: ["asset1", "asset2"],
        ),
      ).called(1);
    });

    test('handles empty DB album -> adds all device assets', () async {
      final emptyDbAlbum = dbAlbum.copyWith(assetCount: 0);
      final deviceAssets = [deviceAsset1Updated, deviceAsset3New];
      final refreshedWithAssets =
          refreshedAlbum.copyWith(assetCount: deviceAssets.length);

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .thenAnswer((_) async => deviceAssets);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .thenAnswer((_) async => []);

      final result = await sut.fullDiff(emptyDbAlbum, refreshedWithAssets);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == emptyDbAlbum.id &&
                  a.assetCount == deviceAssets.length,
            ),
          ),
          toUpsert:
              any(named: 'toUpsert', that: containsAllInOrder(deviceAssets)),
        ),
      ).called(1);
    });

    test('handles mix of additions, updates, and deletions', () async {
      final currentDeviceAssets = [deviceAsset1Updated, deviceAsset3New];
      final currentDbAssets = [dbAsset1, dbAsset2];

      final currentRefreshedAlbum =
          refreshedAlbum.copyWith(assetCount: currentDeviceAssets.length);

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => currentDeviceAssets);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => currentDbAssets);

      final result = await sut.fullDiff(dbAlbum, currentRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);

      verify(
        () => mockLocalAlbumRepo.upsert(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == currentDeviceAssets.length,
            ),
          ),
          toUpsert: any(
            named: 'toUpsert',
            that: containsAllInOrder([deviceAsset1Updated, deviceAsset3New]),
          ),
          toDelete: ["asset2"],
        ),
      ).called(1);
    });

    test(
      'handles identical assets (only metadata update if album changed)',
      () async {
        final dbAssets = [dbAsset1, dbAsset2];
        final deviceAssets = [dbAsset1, dbAsset2];

        final changedRefreshedAlbum = refreshedAlbum.copyWith(
          updatedAt: DateTime(2025),
          assetCount: deviceAssets.length,
        );

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => deviceAssets);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => dbAssets);

        final result = await sut.fullDiff(dbAlbum, changedRefreshedAlbum);

        expect(result, isTrue);
        verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .called(1);
        verify(
          () => mockLocalAlbumRepo.upsert(
            any(
              that: predicate<LocalAlbum>(
                (a) =>
                    a.id == dbAlbum.id &&
                    a.updatedAt == changedRefreshedAlbum.updatedAt,
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
