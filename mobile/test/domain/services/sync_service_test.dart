// ignore_for_file: avoid-unsafe-collection-methods

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/domain/services/sync.service.dart';
import 'package:immich_mobile/utils/nullable_value.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/local_album.stub.dart';
import '../../fixtures/local_asset.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  late IAlbumMediaRepository mockAlbumMediaRepo;
  late ILocalAlbumRepository mockLocalAlbumRepo;
  late ILocalAssetRepository mockLocalAssetRepo;
  late SyncService sut;

  Future<T> mockTransaction<T>(Future<T> Function() action) async {
    return await action();
  }

  setUp(() {
    mockAlbumMediaRepo = MockAlbumMediaRepository();
    mockLocalAlbumRepo = MockLocalAlbumRepository();
    mockLocalAssetRepo = MockLocalAssetRepository();

    sut = SyncService(
      albumMediaRepository: mockAlbumMediaRepo,
      localAlbumRepository: mockLocalAlbumRepo,
      localAssetRepository: mockLocalAssetRepo,
    );

    registerFallbackValue(LocalAlbumStub.album1);
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(SortLocalAlbumsBy.id);
    registerFallbackValue(<LocalAsset>[]);

    when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
    when(() => mockLocalAlbumRepo.getAll(sortBy: any(named: 'sortBy')))
        .thenAnswer((_) async => []);
    when(() => mockLocalAlbumRepo.insert(any(), any()))
        .thenAnswer((_) async => []);
    when(() => mockLocalAlbumRepo.delete(any())).thenAnswer((_) async => true);
    when(() => mockLocalAlbumRepo.update(any())).thenAnswer((_) async => true);
    when(() => mockLocalAlbumRepo.addAssets(any(), any()))
        .thenAnswer((_) async => true);
    when(() => mockLocalAlbumRepo.removeAssets(any(), any()))
        .thenAnswer((_) async => true);
    when(() => mockLocalAlbumRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);
    when(() => mockLocalAssetRepo.get(any())).thenAnswer(
      (_) async => LocalAssetStub.image1,
    );
    when(
      () => mockAlbumMediaRepo.refresh(
        any(),
        withModifiedTime: any(named: 'withModifiedTime'),
        withAssetCount: any(named: 'withAssetCount'),
      ),
    ).thenAnswer(
      (inv) async =>
          LocalAlbumStub.album1.copyWith(id: inv.positionalArguments.first),
    );
    when(
      () => mockAlbumMediaRepo.getAssetsForAlbum(
        any(),
        updateTimeCond: any(named: 'updateTimeCond'),
      ),
    ).thenAnswer((_) async => []);
    when(() => mockAlbumMediaRepo.getAssetsForAlbum(any()))
        .thenAnswer((_) async => []);

    when(() => mockLocalAlbumRepo.transaction<void>(any())).thenAnswer(
      (inv) => mockTransaction(
        inv.positionalArguments.first as Future<void> Function(),
      ),
    );
  });

  group('syncLocalAlbums', () {
    test('should return false when no albums exist', () async {
      final result = await sut.syncLocalAlbums();
      expect(result, isFalse);
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
      verifyNever(() => mockLocalAlbumRepo.delete(any()));
      verifyNever(
        () => mockAlbumMediaRepo.refresh(
          any(),
          withModifiedTime: any(named: 'withModifiedTime'),
          withAssetCount: any(named: 'withAssetCount'),
        ),
      );
    });

    test('should call addLocalAlbum for new device albums', () async {
      final deviceAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => []);

      when(
        () => mockAlbumMediaRepo.refresh(
          deviceAlbums.first.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).thenAnswer(
        (_) async => deviceAlbums.first
            .copyWith(updatedAt: DateTime(2024), assetCount: 1),
      );
      when(
        () => mockAlbumMediaRepo.refresh(
          deviceAlbums[1].id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).thenAnswer(
        (_) async =>
            deviceAlbums[1].copyWith(updatedAt: DateTime(2024), assetCount: 0),
      );

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .thenAnswer((_) async => [LocalAssetStub.image1]);

      final result = await sut.syncLocalAlbums();

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      // Verify addLocalAlbum logic was triggered twice
      verify(
        () => mockAlbumMediaRepo.refresh(
          deviceAlbums.first.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verify(
        () => mockAlbumMediaRepo.refresh(
          deviceAlbums[1].id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .called(1);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums[1].id),
      ); // Not called for empty album
      verify(() => mockLocalAlbumRepo.insert(any(), any())).called(2);
      verifyNever(() => mockLocalAlbumRepo.delete(any()));
    });

    test('should call removeLocalAlbum for albums only in DB', () async {
      final dbAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => dbAlbums);

      final result = await sut.syncLocalAlbums();

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(() => mockLocalAlbumRepo.delete(dbAlbums.first.id)).called(1);
      verify(() => mockLocalAlbumRepo.delete(dbAlbums[1].id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
      verifyNever(
        () => mockAlbumMediaRepo.refresh(
          any(),
          withModifiedTime: any(named: 'withModifiedTime'),
          withAssetCount: any(named: 'withAssetCount'),
        ),
      );
    });

    test(
      'should call syncLocalAlbum for albums in both DB and device',
      () async {
        final commonAlbum = LocalAlbumStub.album1;
        final deviceAlbums = [commonAlbum];
        final dbAlbums = [
          commonAlbum.copyWith(updatedAt: DateTime(2023)),
        ]; // Different updatedAt to trigger sync
        when(() => mockAlbumMediaRepo.getAll())
            .thenAnswer((_) async => deviceAlbums);
        when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => dbAlbums);

        final refreshedAlbum =
            commonAlbum.copyWith(updatedAt: DateTime(2024), assetCount: 1);
        when(
          () => mockAlbumMediaRepo.refresh(
            commonAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).thenAnswer((_) async => refreshedAlbum);

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(commonAlbum.id))
            .thenAnswer((_) async => [LocalAssetStub.image1]);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(commonAlbum.id))
            .thenAnswer((_) async => []);

        final result = await sut.syncLocalAlbums();

        expect(result, isTrue);
        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);

        verify(
          () => mockAlbumMediaRepo.refresh(
            commonAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).called(1);

        verify(() => mockAlbumMediaRepo.getAssetsForAlbum(commonAlbum.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.getAssetsForAlbum(commonAlbum.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
        verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
        verifyNever(() => mockLocalAlbumRepo.delete(any()));
      },
    );

    test('should handle errors during repository calls', () async {
      when(() => mockAlbumMediaRepo.getAll())
          .thenThrow(Exception("Device error"));

      final result = await sut.syncLocalAlbums();

      expect(result, isFalse);
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verifyNever(
        () => mockLocalAlbumRepo.getAll(sortBy: any(named: 'sortBy')),
      );
    });

    test('should handle errors during diff callbacks', () async {
      final deviceAlbums = [LocalAlbumStub.album1];
      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => []);
      when(
        () => mockAlbumMediaRepo.refresh(
          any(),
          withModifiedTime: any(named: 'withModifiedTime'),
          withAssetCount: any(named: 'withAssetCount'),
        ),
      ).thenThrow(Exception("Refresh error"));

      final result = await sut.syncLocalAlbums();

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(
        () => mockAlbumMediaRepo.refresh(
          deviceAlbums.first.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
    });
  });

  group('addLocalAlbum', () {
    test(
      'refreshes, gets assets, sets thumbnail, and inserts for non-empty album',
      () async {
        final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
        final refreshedAlbum =
            newAlbum.copyWith(updatedAt: DateTime(2024), assetCount: 2);
        final assets = [
          LocalAssetStub.image1
              .copyWith(localId: "asset1", createdAt: DateTime(2024, 1, 1)),
          LocalAssetStub.image2.copyWith(
            localId: "asset2",
            createdAt: DateTime(2024, 1, 2),
          ),
        ];

        when(
          () => mockAlbumMediaRepo.refresh(
            newAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).thenAnswer((_) async => refreshedAlbum);
        when(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id))
            .thenAnswer((_) async => assets);

        await sut.addLocalAlbum(newAlbum);

        verify(
          () => mockAlbumMediaRepo.refresh(
            newAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).called(1);
        verify(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id))
            .called(1);

        final captured =
            verify(() => mockLocalAlbumRepo.insert(captureAny(), captureAny()))
                .captured;
        final capturedAlbum = captured.first as LocalAlbum;
        final capturedAssets = captured[1] as List<Object?>;

        expect(capturedAlbum.id, newAlbum.id);
        expect(capturedAlbum.assetCount, refreshedAlbum.assetCount);
        expect(capturedAlbum.updatedAt, refreshedAlbum.updatedAt);
        expect(capturedAlbum.thumbnailId, assets.first.localId);
        expect(listEquals(capturedAssets, assets), isTrue);
      },
    );

    test(
      'refreshes, skips assets, sets null thumbnail, and inserts for empty album',
      () async {
        final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
        final refreshedAlbum =
            newAlbum.copyWith(updatedAt: DateTime(2024), assetCount: 0);

        when(
          () => mockAlbumMediaRepo.refresh(
            newAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).thenAnswer((_) async => refreshedAlbum);

        await sut.addLocalAlbum(newAlbum);

        verify(
          () => mockAlbumMediaRepo.refresh(
            newAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).called(1);
        verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id));

        final captured =
            verify(() => mockLocalAlbumRepo.insert(captureAny(), captureAny()))
                .captured;
        final capturedAlbum = captured.first as LocalAlbum;
        final capturedAssets = captured[1] as List<Object?>;

        expect(capturedAlbum.id, newAlbum.id);
        expect(capturedAlbum.assetCount, 0);
        expect(capturedAlbum.thumbnailId, isNull);
        expect(capturedAssets, isEmpty);
      },
    );

    test('handles error during refresh', () async {
      final newAlbum = LocalAlbumStub.album1;
      when(
        () => mockAlbumMediaRepo.refresh(
          any(),
          withModifiedTime: any(named: 'withModifiedTime'),
          withAssetCount: any(named: 'withAssetCount'),
        ),
      ).thenThrow(Exception("Refresh failed"));

      await sut.addLocalAlbum(newAlbum);

      verify(
        () => mockAlbumMediaRepo.refresh(
          newAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
    });

    test('handles error during getAssetsForAlbum', () async {
      final newAlbum = LocalAlbumStub.album1.copyWith(assetCount: 0);
      final refreshedAlbum =
          newAlbum.copyWith(updatedAt: DateTime(2024), assetCount: 2);

      when(
        () => mockAlbumMediaRepo.refresh(
          newAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).thenAnswer((_) async => refreshedAlbum);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id))
          .thenThrow(Exception("Get assets failed"));

      await sut.addLocalAlbum(newAlbum);

      verify(
        () => mockAlbumMediaRepo.refresh(
          newAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
    });
  });

  group('removeLocalAlbum', () {
    test('calls localAlbumRepository.delete', () async {
      final albumToDelete = LocalAlbumStub.album1;
      await sut.removeLocalAlbum(albumToDelete);
      verify(() => mockLocalAlbumRepo.delete(albumToDelete.id)).called(1);
    });

    test('handles error during delete', () async {
      final albumToDelete = LocalAlbumStub.album1;
      when(() => mockLocalAlbumRepo.delete(any()))
          .thenThrow(Exception("Delete failed"));

      await expectLater(sut.removeLocalAlbum(albumToDelete), completes);
      verify(() => mockLocalAlbumRepo.delete(albumToDelete.id)).called(1);
    });
  });

  group('syncLocalAlbum', () {
    final dbAlbum = LocalAlbumStub.album1.copyWith(
      updatedAt: DateTime(2024, 1, 1),
      assetCount: 1,
      backupSelection: BackupSelection.selected,
    );

    test('returns false if refresh shows no changes', () async {
      final refreshedAlbum = dbAlbum; // Same updatedAt and assetCount
      when(
        () => mockAlbumMediaRepo.refresh(
          dbAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).thenAnswer((_) async => refreshedAlbum);

      final result = await sut.syncLocalAlbum(dbAlbum, LocalAlbumStub.album1);

      expect(result, isFalse);
      verify(
        () => mockAlbumMediaRepo.refresh(
          dbAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test(
      'updates metadata and returns true for empty albums with no changes needed',
      () async {
        final emptyDbAlbum =
            dbAlbum.copyWith(updatedAt: DateTime(2024, 1, 1), assetCount: 0);
        final refreshedEmptyAlbum = emptyDbAlbum.copyWith(
          updatedAt: DateTime(2024, 1, 2),
        );

        when(
          () => mockAlbumMediaRepo.refresh(
            emptyDbAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).thenAnswer((_) async => refreshedEmptyAlbum);

        final result =
            await sut.syncLocalAlbum(emptyDbAlbum, LocalAlbumStub.album1);

        expect(result, isTrue);
        verify(
          () => mockAlbumMediaRepo.refresh(
            emptyDbAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).called(1);
        verify(
          () => mockLocalAlbumRepo.update(
            refreshedEmptyAlbum.copyWith(
              backupSelection: emptyDbAlbum.backupSelection,
            ),
          ),
        ).called(1);
        verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
        verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(any()));
        verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
      },
    );

    test('calls tryFastSync and returns true if it succeeds', () async {
      final refreshedAlbum = dbAlbum.copyWith(
        updatedAt: DateTime(2024, 1, 2),
        assetCount: 2,
      ); // Time and count increased
      when(
        () => mockAlbumMediaRepo.refresh(
          dbAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).thenAnswer((_) async => refreshedAlbum);

      final newAsset = LocalAssetStub.image2.copyWith(localId: "new_asset");
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      final result = await sut.syncLocalAlbum(dbAlbum, LocalAlbumStub.album1);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.refresh(
          dbAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);

      verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
      verify(() => mockLocalAlbumRepo.addAssets(dbAlbum.id, [newAsset]))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) => a.id == dbAlbum.id && a.assetCount == 2,
            ),
          ),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.removeAssets(any(), any()));

      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id));
    });

    test(
      'calls fullSync and returns true if tryFastSync returns false',
      () async {
        final refreshedAlbum = dbAlbum.copyWith(
          updatedAt: DateTime(2024, 1, 2),
          assetCount: 0,
        ); // Count decreased -> fast sync fails
        when(
          () => mockAlbumMediaRepo.refresh(
            dbAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).thenAnswer((_) async => refreshedAlbum);

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => []);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
          (_) async => [LocalAssetStub.image1],
        );

        final result = await sut.syncLocalAlbum(dbAlbum, LocalAlbumStub.album1);

        expect(result, isTrue);
        verify(
          () => mockAlbumMediaRepo.refresh(
            dbAlbum.id,
            withModifiedTime: true,
            withAssetCount: true,
          ),
        ).called(1);
        // Verify tryFastSync path was attempted but failed (no getAssetsForAlbum with timeCond)
        verifyNever(
          () => mockAlbumMediaRepo.getAssetsForAlbum(
            dbAlbum.id,
            updateTimeCond: any(named: 'updateTimeCond'),
          ),
        );
        // Verify fullSync path was taken
        verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
        verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
            .called(1);
        // Verify _handleUpdate was called via fullSync
        verifyNever(() => mockLocalAlbumRepo.addAssets(any(), any()));
        verify(
          () => mockLocalAlbumRepo.update(
            any(
              that: predicate<LocalAlbum>(
                (a) =>
                    a.id == dbAlbum.id &&
                    a.assetCount == 0 &&
                    a.thumbnailId == null,
              ),
            ),
          ),
        ).called(1);
        verify(
          () => mockLocalAlbumRepo
              .removeAssets(dbAlbum.id, [LocalAssetStub.image1.localId]),
        ).called(1);
      },
    );

    test('handles error during refresh', () async {
      when(
        () => mockAlbumMediaRepo.refresh(
          any(),
          withModifiedTime: any(named: 'withModifiedTime'),
          withAssetCount: any(named: 'withAssetCount'),
        ),
      ).thenThrow(Exception("Refresh failed"));

      final result = await sut.syncLocalAlbum(dbAlbum, LocalAlbumStub.album1);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.refresh(
          dbAlbum.id,
          withModifiedTime: true,
          withAssetCount: true,
        ),
      ).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });
  });

  group('tryFastSync', () {
    final dbAlbum = LocalAlbumStub.album1.copyWith(
      updatedAt: DateTime(2024, 1, 1, 10, 0, 0),
      assetCount: 1,
      thumbnailId: const NullableValue.value("thumb1"),
    );
    final refreshedAlbum = dbAlbum.copyWith(
      updatedAt: DateTime(2024, 1, 1, 11, 0, 0),
      assetCount: 2,
    );

    test('returns true and updates assets/metadata on success', () async {
      final newAsset = LocalAssetStub.image2.copyWith(
        localId: "asset2",
        createdAt: DateTime(2024, 1, 1, 10, 30, 0),
      );
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      when(() => mockLocalAssetRepo.get("thumb1")).thenAnswer(
        (_) async => LocalAssetStub.image1.copyWith(
          localId: "thumb1",
          createdAt: DateTime(2024, 1, 1, 9, 0, 0),
        ),
      ); // Old thumb is older

      final result = await sut.tryFastSync(dbAlbum, refreshedAlbum);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(() => mockLocalAssetRepo.get("thumb1")).called(1);
      verify(() => mockLocalAlbumRepo.addAssets(dbAlbum.id, [newAsset]))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == refreshedAlbum.updatedAt &&
                  a.thumbnailId == newAsset.localId, // Thumbnail updated
            ),
          ),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.removeAssets(any(), any()));
    });

    test('returns true and keeps old thumbnail if newer', () async {
      final newAsset = LocalAssetStub.image2.copyWith(
        localId: "asset2",
        createdAt: DateTime(2024, 1, 1, 8, 0, 0),
      );
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);

      when(() => mockLocalAssetRepo.get("thumb1")).thenAnswer(
        (_) async => LocalAssetStub.image1.copyWith(
          localId: "thumb1",
          createdAt: DateTime(2024, 1, 1, 9, 0, 0),
        ),
      ); // Old thumb is newer

      final result = await sut.tryFastSync(dbAlbum, refreshedAlbum);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verify(() => mockLocalAssetRepo.get("thumb1")).called(1);
      verify(() => mockLocalAlbumRepo.addAssets(dbAlbum.id, [newAsset]))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == refreshedAlbum.updatedAt &&
                  a.thumbnailId == "thumb1", // Thumbnail NOT updated
            ),
          ),
        ),
      ).called(1);
    });

    test('returns false if updatedAt is not after', () async {
      final notUpdatedAlbum =
          refreshedAlbum.copyWith(updatedAt: dbAlbum.updatedAt); // Same time
      final result = await sut.tryFastSync(dbAlbum, notUpdatedAlbum);
      expect(result, isFalse);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('returns false if assetCount decreased', () async {
      final decreasedCountAlbum = refreshedAlbum.copyWith(assetCount: 0);
      final result = await sut.tryFastSync(dbAlbum, decreasedCountAlbum);
      expect(result, isFalse);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('returns false if assetCount is same', () async {
      final sameCountAlbum =
          refreshedAlbum.copyWith(assetCount: dbAlbum.assetCount);
      final result = await sut.tryFastSync(dbAlbum, sameCountAlbum);
      expect(result, isFalse);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          any(),
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      );
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('returns false if no new assets found', () async {
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => []);
      final result = await sut.tryFastSync(dbAlbum, refreshedAlbum);
      expect(result, isFalse);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('returns false if deletions occurred (count mismatch)', () async {
      final newAssets = [LocalAssetStub.image2];
      final mismatchCountAlbum = refreshedAlbum.copyWith(
        assetCount: 3,
      ); // Expected 1 + 1 = 2, but got 3
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => newAssets);
      final result = await sut.tryFastSync(dbAlbum, mismatchCountAlbum);
      expect(result, isFalse);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('handles error during getAssetsForAlbum', () async {
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenThrow(Exception("Get assets failed"));

      final result = await sut.tryFastSync(dbAlbum, refreshedAlbum);

      expect(result, isFalse);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });
  });

  group('fullSync', () {
    final dbAlbum = LocalAlbumStub.album1.copyWith(
      updatedAt: DateTime(2024, 1, 1),
      assetCount: 2,
      thumbnailId: const NullableValue.value("asset1"),
    );
    final refreshedAlbum = dbAlbum.copyWith(
      updatedAt: DateTime(2024, 1, 2),
      assetCount: 2,
    );

    final dbAsset1 = LocalAssetStub.image1
        .copyWith(localId: "asset1", updatedAt: DateTime(2024));
    final dbAsset2 = LocalAssetStub.image2.copyWith(
      localId: "asset2",
      updatedAt: DateTime(2024),
    ); // To be deleted
    final deviceAsset1 = LocalAssetStub.image1
        .copyWith(localId: "asset1", updatedAt: DateTime(2025)); // Updated
    final deviceAsset3 = LocalAssetStub.video1
        .copyWith(localId: "asset3", updatedAt: DateTime(2024)); // Added

    test('handles empty device album -> deletes all DB assets', () async {
      final emptyRefreshedAlbum = refreshedAlbum.copyWith(assetCount: 0);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => [dbAsset1, dbAsset2]);

      final result = await sut.fullSync(dbAlbum, emptyRefreshedAlbum);

      expect(result, isTrue);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.addAssets(any(), any()));
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 0 &&
                  a.updatedAt == emptyRefreshedAlbum.updatedAt &&
                  a.thumbnailId == null, // Thumbnail cleared
            ),
          ),
        ),
      ).called(1);
      verify(
        () => mockLocalAlbumRepo.removeAssets(dbAlbum.id, ["asset1", "asset2"]),
      ).called(1);
    });

    test('handles empty DB album -> adds all device assets', () async {
      final emptyDbAlbum = dbAlbum.copyWith(
        assetCount: 0,
        thumbnailId: const NullableValue.empty(),
      );
      final deviceAssets = [deviceAsset1, deviceAsset3];
      final refreshedWithAssets =
          refreshedAlbum.copyWith(assetCount: deviceAssets.length);

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .thenAnswer((_) async => deviceAssets);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .thenAnswer((_) async => []);

      final result = await sut.fullSync(emptyDbAlbum, refreshedWithAssets);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(emptyDbAlbum.id))
          .called(1);
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(emptyDbAlbum.id));
      verify(() => mockLocalAlbumRepo.addAssets(emptyDbAlbum.id, deviceAssets))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == emptyDbAlbum.id &&
                  a.assetCount == deviceAssets.length &&
                  a.updatedAt == refreshedWithAssets.updatedAt &&
                  a.thumbnailId == deviceAssets.first.localId,
            ),
          ),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.removeAssets(any(), any()));
    });

    test('handles mix of additions, updates, and deletions', () async {
      final currentRefreshedAlbum = refreshedAlbum.copyWith(
        assetCount: 2,
      ); // asset1 updated, asset3 added, asset2 deleted
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
        (_) async => [deviceAsset1, deviceAsset3],
      ); // Device has asset1 (updated), asset3 (new)
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
        (_) async => [dbAsset1, dbAsset2],
      ); // DB has asset1 (old), asset2 (to delete)

      final result = await sut.fullSync(dbAlbum, currentRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);

      // Verify assets to upsert (updated asset1, new asset3)
      verify(
        () => mockLocalAlbumRepo.addAssets(
          dbAlbum.id,
          any(
            that: predicate<List<LocalAsset>>((list) {
              return list.length == 2 &&
                  list.any(
                    (a) =>
                        a.localId == "asset1" &&
                        a.updatedAt == deviceAsset1.updatedAt,
                  ) &&
                  list.any((a) => a.localId == "asset3");
            }),
          ),
        ),
      ).called(1);

      // Verify metadata update (thumbnail should be asset1 as it's first in sorted device list)
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == currentRefreshedAlbum.updatedAt &&
                  a.thumbnailId == "asset1",
            ),
          ),
        ),
      ).called(1);

      // Verify assets to delete (asset2)
      verify(() => mockLocalAlbumRepo.removeAssets(dbAlbum.id, ["asset2"]))
          .called(1);
    });

    test('handles no asset changes, only metadata update', () async {
      final currentRefreshedAlbum = refreshedAlbum.copyWith(
        updatedAt: DateTime(2025),
        assetCount: 1,
      ); // Only updatedAt changed
      final dbAssets = [dbAsset1];
      final deviceAssets = [
        dbAsset1,
      ]; // Assets are identical based on _assetsEqual

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => deviceAssets);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => dbAssets);

      final result = await sut.fullSync(dbAlbum, currentRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      // Transaction is NOT called because _handleUpdate isn't called if lists are empty
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
      // Only metadata update is called directly
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 1 &&
                  a.updatedAt == currentRefreshedAlbum.updatedAt &&
                  a.thumbnailId == "asset1", // Thumbnail remains
            ),
          ),
        ),
      ).called(1);
      verifyNever(() => mockLocalAlbumRepo.addAssets(any(), any()));
      verifyNever(() => mockLocalAlbumRepo.removeAssets(any(), any()));
    });

    test('handles error during getAssetsForAlbum (device)', () async {
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenThrow(Exception("Get device assets failed"));

      final result = await sut.fullSync(dbAlbum, refreshedAlbum);

      expect(result, isFalse);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('handles error during getAssetsForAlbum (db)', () async {
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => [deviceAsset1]);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenThrow(Exception("Get db assets failed"));

      final result = await sut.fullSync(dbAlbum, refreshedAlbum);

      expect(result, isFalse);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });
  });
}
