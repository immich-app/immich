import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/domain/services/device_sync.service.dart';
import 'package:immich_mobile/utils/nullable_value.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/local_album.stub.dart';
import '../../fixtures/local_asset.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  late IAlbumMediaRepository mockAlbumMediaRepo;
  late ILocalAlbumRepository mockLocalAlbumRepo;
  late ILocalAssetRepository mockLocalAssetRepo;
  late DeviceSyncService sut;

  Future<T> mockTransaction<T>(Future<T> Function() action) => action();

  setUp(() {
    mockAlbumMediaRepo = MockAlbumMediaRepository();
    mockLocalAlbumRepo = MockLocalAlbumRepository();
    mockLocalAssetRepo = MockLocalAssetRepository();

    sut = DeviceSyncService(
      albumMediaRepository: mockAlbumMediaRepo,
      localAlbumRepository: mockLocalAlbumRepo,
      localAssetRepository: mockLocalAssetRepo,
    );

    registerFallbackValue(LocalAlbumStub.album1);
    registerFallbackValue(LocalAssetStub.image1);
    registerFallbackValue(SortLocalAlbumsBy.id);
    registerFallbackValue(<LocalAsset>[]);
    registerFallbackValue(<String>[]);

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
    when(() => mockLocalAssetRepo.get(any()))
        .thenAnswer((_) async => LocalAssetStub.image1);
    when(() => mockAlbumMediaRepo.refresh(any())).thenAnswer(
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

  group('sync', () {
    test('should return when no albums exist', () async {
      await sut.sync();
      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
      verifyNever(() => mockLocalAlbumRepo.delete(any()));
      verifyNever(() => mockAlbumMediaRepo.refresh(any()));
    });

    test('should call addAlbum for new device albums', () async {
      final deviceAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => []);

      final refreshedAlbum1 =
          deviceAlbums.first.copyWith(updatedAt: DateTime(2024), assetCount: 1);
      final refreshedAlbum2 =
          deviceAlbums[1].copyWith(updatedAt: DateTime(2024), assetCount: 0);

      when(() => mockAlbumMediaRepo.refresh(deviceAlbums.first.id))
          .thenAnswer((_) async => refreshedAlbum1);
      when(() => mockAlbumMediaRepo.refresh(deviceAlbums[1].id))
          .thenAnswer((_) async => refreshedAlbum2);

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .thenAnswer((_) async => [LocalAssetStub.image1]);

      await sut.sync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);

      verify(() => mockAlbumMediaRepo.refresh(deviceAlbums.first.id)).called(1);
      verify(() => mockAlbumMediaRepo.refresh(deviceAlbums[1].id)).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums.first.id))
          .called(1);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbums[1].id),
      ); // Not called for empty album
      verify(() => mockLocalAlbumRepo.insert(any(), any())).called(2);
      verifyNever(() => mockLocalAlbumRepo.delete(any()));
    });

    test('should call removeAlbum for albums only in DB', () async {
      final dbAlbums = [LocalAlbumStub.album1, LocalAlbumStub.album2];
      when(() => mockAlbumMediaRepo.getAll()).thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => dbAlbums);

      await sut.sync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);
      verify(() => mockLocalAlbumRepo.delete(dbAlbums.first.id)).called(1);
      verify(() => mockLocalAlbumRepo.delete(dbAlbums[1].id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
      verifyNever(() => mockAlbumMediaRepo.refresh(any()));
    });

    test(
      'should call updateAlbum for albums in both DB and device',
      () async {
        final commonAlbum = LocalAlbumStub.album1;
        final deviceAlbums = [commonAlbum];
        final dbAlbums = [commonAlbum.copyWith(updatedAt: DateTime(2023))];
        when(() => mockAlbumMediaRepo.getAll())
            .thenAnswer((_) async => deviceAlbums);
        when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .thenAnswer((_) async => dbAlbums);

        final refreshedAlbum =
            commonAlbum.copyWith(updatedAt: DateTime(2024), assetCount: 1);
        when(() => mockAlbumMediaRepo.refresh(commonAlbum.id))
            .thenAnswer((_) async => refreshedAlbum);

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(commonAlbum.id))
            .thenAnswer((_) async => [LocalAssetStub.image1]);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(commonAlbum.id))
            .thenAnswer((_) async => []); // DB has no assets initially

        await sut.sync();

        verify(() => mockAlbumMediaRepo.getAll()).called(1);
        verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
            .called(1);

        verify(() => mockAlbumMediaRepo.refresh(commonAlbum.id)).called(1);

        // Verify fullSync path was likely taken
        verify(() => mockAlbumMediaRepo.getAssetsForAlbum(commonAlbum.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.getAssetsForAlbum(commonAlbum.id))
            .called(1);
        verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
        verifyNever(() => mockLocalAlbumRepo.insert(any(), any()));
        verifyNever(() => mockLocalAlbumRepo.delete(any()));
      },
    );

    test('should handle a mix of add, remove, and update', () async {
      final albumToRemove = LocalAlbumStub.album1.copyWith(id: "remove_me");
      final albumToUpdate = LocalAlbumStub.album2.copyWith(id: "update_me");
      final albumToAdd = LocalAlbumStub.album3.copyWith(id: "add_me");

      final dbAlbums = [
        albumToRemove,
        albumToUpdate.copyWith(updatedAt: DateTime(2023)),
      ];
      final deviceAlbums = [albumToUpdate, albumToAdd];

      when(() => mockAlbumMediaRepo.getAll())
          .thenAnswer((_) async => deviceAlbums);
      when(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .thenAnswer((_) async => dbAlbums);

      final refreshedUpdateAlbum =
          albumToUpdate.copyWith(updatedAt: DateTime(2024), assetCount: 0);
      when(() => mockAlbumMediaRepo.refresh(albumToUpdate.id))
          .thenAnswer((_) async => refreshedUpdateAlbum);

      final refreshedAddAlbum =
          albumToAdd.copyWith(updatedAt: DateTime(2024), assetCount: 1);
      when(() => mockAlbumMediaRepo.refresh(albumToAdd.id))
          .thenAnswer((_) async => refreshedAddAlbum);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(albumToAdd.id))
          .thenAnswer((_) async => [LocalAssetStub.image1]);

      await sut.sync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verify(() => mockLocalAlbumRepo.getAll(sortBy: SortLocalAlbumsBy.id))
          .called(1);

      verify(() => mockLocalAlbumRepo.delete(albumToRemove.id)).called(1);

      verify(() => mockAlbumMediaRepo.refresh(albumToAdd.id)).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(albumToAdd.id))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.insert(
          any(that: predicate<LocalAlbum>((a) => a.id == albumToAdd.id)),
          any(),
        ),
      ).called(1);

      verify(() => mockAlbumMediaRepo.refresh(albumToUpdate.id)).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(albumToUpdate.id));
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(albumToUpdate.id))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(that: predicate<LocalAlbum>((a) => a.id == albumToUpdate.id)),
        ),
      ).called(1);
    });

    test('should handle errors during repository calls', () async {
      when(() => mockAlbumMediaRepo.getAll())
          .thenThrow(Exception("Device error"));

      await sut.sync();

      verify(() => mockAlbumMediaRepo.getAll()).called(1);
      verifyNever(
        () => mockLocalAlbumRepo.getAll(sortBy: any(named: 'sortBy')),
      );
    });
  });

  group('addAlbum', () {
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

        when(() => mockAlbumMediaRepo.refresh(newAlbum.id))
            .thenAnswer((_) async => refreshedAlbum);
        when(() => mockAlbumMediaRepo.getAssetsForAlbum(newAlbum.id))
            .thenAnswer((_) async => assets);

        await sut.addAlbum(newAlbum);

        verify(() => mockAlbumMediaRepo.refresh(newAlbum.id)).called(1);
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

        when(() => mockAlbumMediaRepo.refresh(newAlbum.id))
            .thenAnswer((_) async => refreshedAlbum);

        await sut.addAlbum(newAlbum);

        verify(() => mockAlbumMediaRepo.refresh(newAlbum.id)).called(1);
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
  });

  group('removeAlbum', () {
    test('calls localAlbumRepository.delete', () async {
      final albumToDelete = LocalAlbumStub.album1;
      await sut.removeAlbum(albumToDelete);
      verify(() => mockLocalAlbumRepo.delete(albumToDelete.id)).called(1);
    });
  });

  group('updateAlbum', () {
    final dbAlbum = LocalAlbumStub.album1.copyWith(
      updatedAt: DateTime(2024, 1, 1),
      assetCount: 1,
    );

    test('returns early if refresh shows no changes', () async {
      final refreshedAlbum = dbAlbum;
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);

      final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album1);

      expect(result, false);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('calls checkAddition and returns true if it succeeds', () async {
      final refreshedAlbum = dbAlbum.copyWith(
        updatedAt: DateTime(2024, 1, 2),
        assetCount: 2,
      );
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);

      final newAsset = LocalAssetStub.image2.copyWith(localId: "new_asset");
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenAnswer((_) async => [newAsset]);
      final dbAlbumNoThumb = dbAlbum.copyWith(thumbnailId: null);

      final result =
          await sut.updateAlbum(dbAlbumNoThumb, LocalAlbumStub.album1);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);

      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verifyNever(() => mockLocalAssetRepo.get(any()));

      verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
      verify(() => mockLocalAlbumRepo.addAssets(dbAlbum.id, [newAsset]))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.thumbnailId == newAsset.localId,
            ),
          ),
        ),
      ).called(1);
      verify(() => mockLocalAlbumRepo.removeAssets(any(), any(that: isEmpty)))
          .called(1);

      verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id));
    });

    test(
      'calls fullSync and returns true if checkAddition returns false',
      () async {
        final refreshedAlbum = dbAlbum.copyWith(
          updatedAt: DateTime(2024, 1, 2),
          assetCount: 0,
        );
        when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
            .thenAnswer((_) async => refreshedAlbum);

        when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
            .thenAnswer((_) async => []);
        when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
          (_) async => [LocalAssetStub.image1],
        );

        final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album1);

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
        verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
        verify(() => mockLocalAlbumRepo.addAssets(any(), any(that: isEmpty)))
            .called(1);
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

    test('handles error during checkAddition', () async {
      final refreshedAlbum = dbAlbum.copyWith(
        updatedAt: DateTime(2024, 1, 2),
        assetCount: 2,
      );
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);
      when(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).thenThrow(Exception("checkAddition failed"));

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => []);

      final result = await sut.updateAlbum(dbAlbum, LocalAlbumStub.album1);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(2); // One for checkAddition, one for fullSync
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
    });

    test('handles error during fullSync', () async {
      final refreshedAlbum = dbAlbum.copyWith(
        updatedAt: DateTime(2024, 1, 2),
        assetCount: 1,
      );
      when(() => mockAlbumMediaRepo.refresh(dbAlbum.id))
          .thenAnswer((_) async => refreshedAlbum);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenThrow(Exception("fullSync failed"));

      final result = await sut.updateAlbum(
        dbAlbum,
        LocalAlbumStub.album1.copyWith(assetCount: 2),
      );

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.refresh(dbAlbum.id)).called(1);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id));
      verifyNever(() => mockLocalAlbumRepo.getAssetsForAlbum(any()));
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });
  });

  group('checkAddition', () {
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
      );

      final result = await sut.checkAddition(dbAlbum, refreshedAlbum);

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
                  a.thumbnailId == newAsset.localId,
            ),
          ),
        ),
      ).called(1);
      verify(() => mockLocalAlbumRepo.removeAssets(any(), any(that: isEmpty)))
          .called(1);
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
      );

      final result = await sut.checkAddition(dbAlbum, refreshedAlbum);

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
                  a.thumbnailId == "thumb1",
            ),
          ),
        ),
      ).called(1);
    });

    test('returns true and sets new thumbnail if db thumb is null', () async {
      final dbAlbumNoThumb = dbAlbum.copyWith(thumbnailId: null);
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

      final result = await sut.checkAddition(dbAlbumNoThumb, refreshedAlbum);

      expect(result, isTrue);
      verify(
        () => mockAlbumMediaRepo.getAssetsForAlbum(
          dbAlbum.id,
          updateTimeCond: any(named: 'updateTimeCond'),
        ),
      ).called(1);
      verifyNever(() => mockLocalAssetRepo.get(any()));
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
                  a.thumbnailId == newAsset.localId,
            ),
          ),
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
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
    });

    test('returns false if assetCount is same', () async {
      final sameCountAlbum =
          refreshedAlbum.copyWith(assetCount: dbAlbum.assetCount);
      final result = await sut.checkAddition(dbAlbum, sameCountAlbum);
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
      final result = await sut.checkAddition(dbAlbum, refreshedAlbum);
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
      final result = await sut.checkAddition(dbAlbum, mismatchCountAlbum);
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

    final dbAsset1 = LocalAssetStub.image1.copyWith(
      localId: "asset1",
      createdAt: DateTime(2024),
      updatedAt: DateTime(2024),
    );
    final dbAsset2 = LocalAssetStub.image2.copyWith(
      localId: "asset2",
      createdAt: DateTime(2024),
      updatedAt: DateTime(2024),
    ); // To be deleted
    final deviceAsset1 = LocalAssetStub.image1.copyWith(
      localId: "asset1",
      createdAt: DateTime(2024),
      updatedAt: DateTime(2025),
    ); // Updated
    final deviceAsset3 = LocalAssetStub.video1.copyWith(
      localId: "asset3",
      createdAt: DateTime(2024),
      updatedAt: DateTime(2024),
    ); // Added

    test('handles empty device album -> deletes all DB assets', () async {
      final emptyRefreshedAlbum = refreshedAlbum.copyWith(assetCount: 0);
      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => []);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => [dbAsset1, dbAsset2]);

      final result = await sut.fullSync(dbAlbum, emptyRefreshedAlbum);

      expect(result, isTrue);
      verifyNever(
        () => mockAlbumMediaRepo.getAssetsForAlbum(emptyRefreshedAlbum.id),
      );
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
      verify(() => mockLocalAlbumRepo.addAssets(any(), any(that: isEmpty)))
          .called(1);
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 0 &&
                  a.updatedAt == emptyRefreshedAlbum.updatedAt &&
                  a.thumbnailId == null,
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

      deviceAssets.sort((a, b) => a.createdAt.compareTo(b.createdAt));
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
      verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);
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
      verify(() => mockLocalAlbumRepo.removeAssets(any(), any(that: isEmpty)))
          .called(1);
    });

    test('handles mix of additions, updates, and deletions', () async {
      final currentRefreshedAlbum = refreshedAlbum.copyWith(assetCount: 2);
      final deviceAssets = [deviceAsset1, deviceAsset3];
      deviceAssets.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      final dbAssets = [dbAsset1, dbAsset2];
      dbAssets.sort((a, b) => a.localId.compareTo(b.localId));

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
        (_) async => deviceAssets,
      );
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).thenAnswer(
        (_) async => dbAssets,
      );

      final result = await sut.fullSync(dbAlbum, currentRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.transaction<void>(any())).called(1);

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

      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == currentRefreshedAlbum.updatedAt &&
                  a.thumbnailId == deviceAssets.first.localId,
            ),
          ),
        ),
      ).called(1);

      verify(() => mockLocalAlbumRepo.removeAssets(dbAlbum.id, ["asset2"]))
          .called(1);
    });

    test('handles identical assets, resulting in no DB changes', () async {
      final currentRefreshedAlbum = refreshedAlbum.copyWith(
        updatedAt: DateTime(2025),
        assetCount: 2,
      );
      final dbAssets = [dbAsset1, dbAsset2];
      final deviceAssets = [dbAsset1, dbAsset2];
      deviceAssets.sort((a, b) => a.createdAt.compareTo(b.createdAt));
      dbAssets.sort((a, b) => a.localId.compareTo(b.localId));

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => deviceAssets);
      when(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id))
          .thenAnswer((_) async => dbAssets);

      final result = await sut.fullSync(dbAlbum, currentRefreshedAlbum);

      expect(result, isTrue);
      verify(() => mockAlbumMediaRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verify(() => mockLocalAlbumRepo.getAssetsForAlbum(dbAlbum.id)).called(1);
      verifyNever(() => mockLocalAlbumRepo.transaction<void>(any()));
      verifyNever(() => mockLocalAlbumRepo.addAssets(any(), any()));
      verifyNever(() => mockLocalAlbumRepo.removeAssets(any(), any()));
      verify(
        () => mockLocalAlbumRepo.update(
          any(
            that: predicate<LocalAlbum>(
              (a) =>
                  a.id == dbAlbum.id &&
                  a.assetCount == 2 &&
                  a.updatedAt == currentRefreshedAlbum.updatedAt &&
                  a.thumbnailId == deviceAssets.first.localId,
            ),
          ),
        ),
      ).called(1);
    });
  });
}
