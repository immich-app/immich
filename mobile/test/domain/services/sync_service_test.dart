import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/album_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_album_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart'
    hide AssetType;
import 'package:immich_mobile/domain/models/local_album.model.dart';
import 'package:immich_mobile/domain/services/sync.service.dart';
import 'package:immich_mobile/infrastructure/repositories/album_media.repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:photo_manager/photo_manager.dart';

import '../../external.mock.dart';
import '../../fixtures/local_album.stub.dart';
import '../../fixtures/local_asset.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  group('SyncService', () {
    late SyncService sut;
    late IAlbumMediaRepository mockAlbumMediaRepo;
    late ILocalAlbumRepository mockLocalAlbumRepo;
    late ILocalAssetRepository mockLocalAssetRepo;
    late ILocalAlbumAssetRepository mockLocalAlbumAssetRepo;

    const albumId = 'test-album-id';
    final now = DateTime.now();
    final earlier = now.subtract(const Duration(days: 1));

    late LocalAlbum dbAlbum;
    late LocalAlbum deviceAlbum;
    late AssetPathEntity deviceAlbumEntity;
    late List<LocalAsset> deviceAssets;
    late List<LocalAsset> dbAssets;

    setUp(() async {
      mockAlbumMediaRepo = MockAlbumMediaRepository();
      mockLocalAlbumRepo = MockLocalAlbumRepository();
      mockLocalAssetRepo = MockLocalAssetRepository();
      mockLocalAlbumAssetRepo = MockLocalAlbumAssetRepository();

      sut = SyncService(
        albumMediaRepository: mockAlbumMediaRepo,
        localAlbumRepository: mockLocalAlbumRepo,
        localAssetRepository: mockLocalAssetRepo,
        localAlbumAssetRepository: mockLocalAlbumAssetRepo,
      );

      dbAlbum = LocalAlbum(
        id: albumId,
        name: 'Test Album',
        updatedAt: earlier,
        assetCount: 5,
        backupSelection: BackupSelection.none,
      );

      deviceAlbumEntity = MockAssetPathEntity();
      when(() => deviceAlbumEntity.id).thenReturn(albumId);
      when(() => deviceAlbumEntity.name).thenReturn('Test Album');
      when(() => deviceAlbumEntity.lastModified).thenReturn(now);
      when(() => deviceAlbumEntity.isAll).thenReturn(false);
      when(() => deviceAlbumEntity.assetCountAsync).thenAnswer((_) async => 5);
      deviceAlbum = await deviceAlbumEntity.toDto();

      deviceAssets = await Future.wait(
        List.generate(5, (i) {
          final asset = MockAssetEntity();
          when(() => asset.id).thenReturn('asset-$i');
          when(() => asset.title).thenReturn('Asset $i');
          when(() => asset.createDateTime).thenReturn(now);
          when(() => asset.modifiedDateTime).thenReturn(now);
          when(() => asset.width).thenReturn(1920);
          when(() => asset.height).thenReturn(1080);
          when(() => asset.type).thenReturn(AssetType.image);
          when(() => asset.duration).thenReturn(0);
          return asset.toDto();
        }),
      );

      dbAssets = await Future.wait(
        List.generate(5, (i) {
          final asset = MockAssetEntity();
          when(() => asset.id).thenReturn('asset-$i');
          when(() => asset.title).thenReturn('Asset $i');
          when(() => asset.createDateTime).thenReturn(earlier);
          when(() => asset.modifiedDateTime).thenReturn(earlier);
          when(() => asset.width).thenReturn(1920);
          when(() => asset.height).thenReturn(1080);
          when(() => asset.type).thenReturn(AssetType.image);
          when(() => asset.duration).thenReturn(0);
          return asset.toDto();
        }),
      );

      registerFallbackValue(FakeAssetEntity());
      registerFallbackValue(FakeAssetPathEntity());
      registerFallbackValue(LocalAssetStub.image1);
      registerFallbackValue(LocalAlbumStub.album1);

      when(() => mockAlbumMediaRepo.refresh(albumId))
          .thenAnswer((_) async => deviceAlbumEntity);

      when(
        () => mockAlbumMediaRepo.refresh(
          albumId,
          filter: any(named: 'filter'),
        ),
      ).thenAnswer((_) async => deviceAlbumEntity);

      when(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbumEntity))
          .thenAnswer((_) async => deviceAssets);

      when(() => mockLocalAlbumAssetRepo.getAssetsForAlbum(albumId))
          .thenAnswer((_) async => dbAssets);

      when(() => mockLocalAssetRepo.upsertAll(any()))
          .thenAnswer((_) async => {});

      when(() => mockLocalAlbumAssetRepo.linkAssetsToAlbum(any(), any()))
          .thenAnswer((_) async => {});

      when(() => mockLocalAlbumAssetRepo.unlinkAssetsFromAlbum(any(), any()))
          .thenAnswer((_) async => {});

      when(() => mockLocalAlbumRepo.upsert(any())).thenAnswer((_) async => {});

      when(() => mockLocalAlbumRepo.delete(any())).thenAnswer((_) async => {});

      when(() => mockLocalAssetRepo.deleteIds(any()))
          .thenAnswer((_) async => {});

      when(() => mockLocalAlbumRepo.transaction<Null>(any()))
          .thenAnswer((_) async {
        final capturedCallback = verify(
          () => mockLocalAlbumRepo.transaction<Null>(captureAny()),
        ).captured;
        // Invoke the transaction callback
        await (capturedCallback.firstOrNull as Future<Null> Function()?)
            ?.call();
      });
    });

    test(
      'album filter should be properly configured with expected settings',
      () {
        final albumFilter = sut.albumFilter;

        final imageOption = albumFilter.getOption(AssetType.image);
        expect(imageOption.needTitle, isTrue);
        expect(imageOption.sizeConstraint.ignoreSize, isTrue);
        final videoOption = albumFilter.getOption(AssetType.video);
        expect(videoOption.needTitle, isTrue);
        expect(videoOption.sizeConstraint.ignoreSize, isTrue);
        expect(videoOption.durationConstraint.allowNullable, isTrue);
        expect(albumFilter.containsPathModified, isTrue);
        expect(albumFilter.createTimeCond.ignore, isTrue);
        expect(albumFilter.updateTimeCond.ignore, isTrue);
        expect(albumFilter.orders.length, 1);
        expect(
          albumFilter.orders.firstOrNull?.type,
          OrderOptionType.createDate,
        );
        expect(albumFilter.orders.firstOrNull?.asc, isFalse);
      },
    );

    group('handleOnlyAssetsAdded: ', () {
      // All the below tests expects the device album to have more assets
      // than the DB album. This is to simulate the scenario where
      // new assets are added to the device album.
      setUp(() {
        deviceAlbum = deviceAlbum.copyWith(assetCount: 10);
      });

      test(
        'early return when device album timestamp is not after DB album',
        () async {
          final result = await sut.handleOnlyAssetsAdded(
            dbAlbum,
            deviceAlbum.copyWith(updatedAt: earlier),
          );

          expect(result, isFalse);
          verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
          verifyNever(() => mockLocalAssetRepo.upsertAll(any()));
          verifyNever(
            () => mockLocalAlbumAssetRepo.linkAssetsToAlbum(any(), any()),
          );
          verifyNever(() => mockLocalAlbumRepo.upsert(any()));
        },
      );

      test(
        'early return when device album has fewer assets than DB album',
        () async {
          final result = await sut.handleOnlyAssetsAdded(
            dbAlbum,
            deviceAlbum.copyWith(assetCount: dbAlbum.assetCount - 1),
          );

          expect(result, isFalse);
          verifyNever(() => mockAlbumMediaRepo.getAssetsForAlbum(any()));
          verifyNever(() => mockLocalAssetRepo.upsertAll(any()));
          verifyNever(
            () => mockLocalAlbumAssetRepo.linkAssetsToAlbum(any(), any()),
          );
          verifyNever(() => mockLocalAlbumRepo.upsert(any()));
        },
      );

      test(
        'correctly processes assets when new assets are added',
        () async {
          final result = await sut.handleOnlyAssetsAdded(dbAlbum, deviceAlbum);

          verify(
            () => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbumEntity),
          ).called(1);

          verify(() => mockLocalAssetRepo.upsertAll(any())).called(1);
          verify(
            () => mockLocalAlbumAssetRepo.linkAssetsToAlbum(
              albumId,
              deviceAssets.map((a) => a.localId),
            ),
          ).called(1);

          verify(() => mockLocalAlbumRepo.upsert(any())).called(1);

          expect(result, isTrue);
        },
      );

      test(
        'correct handling when filtering yields no new assets',
        () async {
          when(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbumEntity))
              .thenAnswer((_) async => deviceAssets.sublist(0, 2));

          final result = await sut.handleOnlyAssetsAdded(dbAlbum, deviceAlbum);

          verify(() => mockAlbumMediaRepo.getAssetsForAlbum(deviceAlbumEntity))
              .called(1);

          verifyNever(() => mockLocalAssetRepo.upsertAll(any()));
          verifyNever(
            () => mockLocalAlbumAssetRepo.linkAssetsToAlbum(any(), any()),
          );
          verifyNever(() => mockLocalAlbumRepo.upsert(any()));

          expect(result, isFalse);
        },
      );

      test(
        'thumbnail is updated when new asset is newer than existing thumbnail',
        () async {
          final oldThumbnailId = 'asset-100';
          when(() => mockLocalAssetRepo.get(oldThumbnailId)).thenAnswer(
            (_) async =>
                LocalAssetStub.image1.copyWith(createdAt: DateTime(100)),
          );

          final result = await sut.handleOnlyAssetsAdded(
            dbAlbum.copyWith(thumbnailId: oldThumbnailId),
            deviceAlbum,
          );

          final capturedAlbum =
              verify(() => mockLocalAlbumRepo.upsert(captureAny()))
                  .captured
                  .singleOrNull as LocalAlbum?;
          expect(capturedAlbum?.thumbnailId, isNot(equals(oldThumbnailId)));
          expect(
            capturedAlbum?.thumbnailId,
            equals(deviceAssets.firstOrNull?.localId),
          );
          expect(result, isTrue);
        },
      );

      test(
        'thumbnail preservation when new asset is older than existing thumbnail',
        () async {
          final oldThumbnailId = 'asset-100';
          when(() => mockLocalAssetRepo.get(oldThumbnailId)).thenAnswer(
            (_) async => LocalAssetStub.image1
                .copyWith(createdAt: now.add(const Duration(days: 1))),
          );

          final result = await sut.handleOnlyAssetsAdded(
            dbAlbum.copyWith(thumbnailId: oldThumbnailId),
            deviceAlbum,
          );

          final capturedAlbum =
              verify(() => mockLocalAlbumRepo.upsert(captureAny()))
                  .captured
                  .singleOrNull as LocalAlbum?;
          expect(capturedAlbum?.thumbnailId, equals(oldThumbnailId));
          expect(result, isTrue);
        },
      );
    });

    group('addLocalAlbum: ', () {
      test('adding an album with no assets works correctly', () async {
        when(() => deviceAlbumEntity.assetCountAsync)
            .thenAnswer((_) async => 0);

        await sut.addLocalAlbum(deviceAlbum.copyWith(assetCount: 0));

        final albumUpsertCall =
            verify(() => mockLocalAlbumRepo.upsert(captureAny()));
        albumUpsertCall.called(1);

        // Always refreshed
        verify(
          () => mockAlbumMediaRepo.refresh(albumId, filter: sut.albumFilter),
        ).called(1);
        verifyNever(() => mockLocalAssetRepo.upsertAll(any()));
        verifyNever(
          () => mockLocalAlbumAssetRepo.linkAssetsToAlbum(any(), any()),
        );

        final capturedAlbum =
            albumUpsertCall.captured.singleOrNull as LocalAlbum?;
        expect(capturedAlbum?.id, equals(albumId));
        expect(capturedAlbum?.name, equals('Test Album'));
        expect(capturedAlbum?.assetCount, equals(0));
        expect(capturedAlbum?.thumbnailId, isNull);
      });

      test(
        'adding an album with multiple assets works correctly',
        () async {
          await sut.addLocalAlbum(deviceAlbum);

          final albumUpsertCall =
              verify(() => mockLocalAlbumRepo.upsert(captureAny()));
          albumUpsertCall.called(1);
          verify(() => mockLocalAssetRepo.upsertAll(any())).called(1);
          verify(() =>
                  mockLocalAlbumAssetRepo.linkAssetsToAlbum(albumId, any()))
              .called(1);

          final capturedAlbum =
              albumUpsertCall.captured.singleOrNull as LocalAlbum?;
          expect(capturedAlbum?.assetCount, deviceAssets.length);

          expect(capturedAlbum?.thumbnailId, deviceAssets.firstOrNull?.localId);
        },
      );
    });

    group('removeLocalAlbum: ', () {
      test(
        'removing album with no assets correctly calls delete',
        () async {
          when(() => mockLocalAlbumAssetRepo.getAssetsForAlbum(albumId))
              .thenAnswer((_) async => []);
          when(() => mockLocalAlbumRepo.getAssetIdsOnlyInAlbum(albumId))
              .thenAnswer((_) async => []);

          await sut.removeLocalAlbum(deviceAlbum);

          verify(() => mockLocalAssetRepo.deleteIds([])).called(1);
          verify(() => mockLocalAlbumRepo.delete(albumId)).called(1);
          verify(
            () => mockLocalAlbumAssetRepo.unlinkAssetsFromAlbum(albumId, {}),
          ).called(1);
        },
      );

      test(
        'removing album with assets unique to that album deletes those assets',
        () async {
          final uniqueAssetIds = deviceAssets.map((a) => a.localId).toList();
          when(() => mockLocalAlbumRepo.getAssetIdsOnlyInAlbum(albumId))
              .thenAnswer((_) async => uniqueAssetIds);

          await sut.removeLocalAlbum(deviceAlbum);

          verify(() => mockLocalAssetRepo.deleteIds(uniqueAssetIds)).called(1);
          verify(() => mockLocalAlbumRepo.delete(albumId)).called(1);
          verify(() => mockLocalAlbumAssetRepo.unlinkAssetsFromAlbum(any(), {}))
              .called(1);
        },
      );

      test(
        'removing album with shared assets unlinks those assets',
        () async {
          final assetIds = deviceAssets.map((a) => a.localId).toList();
          when(() => mockLocalAlbumRepo.getAssetIdsOnlyInAlbum(albumId))
              .thenAnswer((_) async => []);

          await sut.removeLocalAlbum(deviceAlbum);

          verify(() => mockLocalAssetRepo.deleteIds([])).called(1);
          verify(
            () => mockLocalAlbumAssetRepo.unlinkAssetsFromAlbum(
              albumId,
              assetIds,
            ),
          ).called(1);
          verify(() => mockLocalAlbumRepo.delete(albumId)).called(1);
        },
      );

      test(
        'removing album with mixed assets (some unique, some shared)',
        () async {
          final uniqueAssetIds = ['asset-1', 'asset-2'];
          final sharedAssetIds = ['asset-0', 'asset-3', 'asset-4'];

          when(() => mockLocalAlbumRepo.getAssetIdsOnlyInAlbum(albumId))
              .thenAnswer((_) async => uniqueAssetIds);

          await sut.removeLocalAlbum(deviceAlbum);

          verify(() => mockLocalAssetRepo.deleteIds(uniqueAssetIds)).called(1);
          verify(
            () => mockLocalAlbumAssetRepo.unlinkAssetsFromAlbum(
              albumId,
              sharedAssetIds,
            ),
          ).called(1);
          verify(() => mockLocalAlbumRepo.delete(albumId)).called(1);
        },
      );
    });
  });
}
