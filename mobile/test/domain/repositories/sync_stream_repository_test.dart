import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as domain;
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:openapi/api.dart';

SyncUserV1 _createUser({String id = 'user-1', String name = 'Test User'}) {
  return SyncUserV1(
    id: id,
    name: name,
    email: 'test@test.com',
    deletedAt: null,
    avatarColor: const Optional.absent(),
    hasProfileImage: false,
    profileChangedAt: DateTime(2024, 1, 1),
  );
}

SyncAssetV1 _createAsset({
  required String id,
  required String checksum,
  required String fileName,
  String ownerId = 'user-1',
  int? width,
  int? height,
  String? libraryId,
  bool isFavorite = false,
  AssetVisibility visibility = AssetVisibility.timeline,
  String? stackId,
  String? livePhotoVideoId,
  String? thumbhash,
  DateTime? deletedAt,
  DateTime? fileCreatedAt,
  DateTime? fileModifiedAt,
}) {
  return SyncAssetV1(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: AssetTypeEnum.IMAGE,
    ownerId: ownerId,
    isFavorite: isFavorite,
    fileCreatedAt: fileCreatedAt ?? DateTime(2024, 1, 1),
    fileModifiedAt: fileModifiedAt ?? DateTime(2024, 1, 1),
    createdAt: DateTime(2024, 1, 1),
    localDateTime: DateTime(2024, 1, 1),
    visibility: visibility,
    width: width,
    height: height,
    deletedAt: deletedAt,
    duration: null,
    libraryId: libraryId,
    livePhotoVideoId: livePhotoVideoId,
    stackId: stackId,
    thumbhash: thumbhash,
    isEdited: false,
  );
}

SyncAssetV2 _createAssetV2({
  required String id,
  required String checksum,
  required String fileName,
  String ownerId = 'user-1',
  String? libraryId,
}) {
  return SyncAssetV2(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: AssetTypeEnum.IMAGE,
    ownerId: ownerId,
    isFavorite: false,
    fileCreatedAt: DateTime(2024, 1, 1),
    fileModifiedAt: DateTime(2024, 1, 1),
    createdAt: DateTime(2024, 1, 1),
    localDateTime: DateTime(2024, 1, 1),
    visibility: AssetVisibility.timeline,
    width: null,
    height: null,
    deletedAt: null,
    duration: 0,
    libraryId: libraryId,
    livePhotoVideoId: null,
    stackId: null,
    thumbhash: null,
    isEdited: false,
  );
}

SyncAssetExifV1 _createExif({
  required String assetId,
  required int width,
  required int height,
  required String orientation,
}) {
  return SyncAssetExifV1(
    assetId: assetId,
    exifImageWidth: width,
    exifImageHeight: height,
    orientation: orientation,
    city: null,
    country: null,
    dateTimeOriginal: null,
    description: null,
    exposureTime: null,
    fNumber: null,
    fileSizeInByte: null,
    focalLength: null,
    fps: null,
    iso: null,
    latitude: null,
    lensModel: null,
    longitude: null,
    make: null,
    model: null,
    modifyDate: null,
    profileDescription: null,
    projectionType: null,
    rating: null,
    state: null,
    timeZone: null,
  );
}

void main() {
  late Drift db;
  late SyncStreamRepository sut;

  setUp(() async {
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    sut = SyncStreamRepository(db);
  });

  tearDown(() async {
    await db.close();
  });

  group('SyncStreamRepository - Dimension swapping based on orientation', () {
    test('swaps dimensions for asset with rotated orientation', () async {
      final flippedOrientations = ['5', '6', '7', '8', '90', '-90'];

      for (final orientation in flippedOrientations) {
        final assetId = 'asset-$orientation-degrees';

        await sut.updateUsersV1([_createUser()]);

        final asset = _createAsset(
          id: assetId,
          checksum: 'checksum-$orientation',
          fileName: 'rotated_$orientation.jpg',
        );
        await sut.updateAssetsV1([asset]);

        final exif = _createExif(
          assetId: assetId,
          width: 1920,
          height: 1080,
          orientation: orientation, // EXIF orientation value for 90 degrees CW
        );
        await sut.updateAssetsExifV1([exif]);

        final query = db.remoteAssetEntity.select()..where((tbl) => tbl.id.equals(assetId));
        final result = await query.getSingle();

        expect(result.width, equals(1080));
        expect(result.height, equals(1920));
      }
    });

    test('does not swap dimensions for asset with normal orientation', () async {
      final nonFlippedOrientations = ['1', '2', '3', '4'];
      for (final orientation in nonFlippedOrientations) {
        final assetId = 'asset-$orientation-degrees';

        await sut.updateUsersV1([_createUser()]);

        final asset = _createAsset(id: assetId, checksum: 'checksum-$orientation', fileName: 'normal_$orientation.jpg');
        await sut.updateAssetsV1([asset]);

        final exif = _createExif(
          assetId: assetId,
          width: 1920,
          height: 1080,
          orientation: orientation, // EXIF orientation value for normal
        );
        await sut.updateAssetsExifV1([exif]);

        final query = db.remoteAssetEntity.select()..where((tbl) => tbl.id.equals(assetId));
        final result = await query.getSingle();

        expect(result.width, equals(1920));
        expect(result.height, equals(1080));
      }
    });

    test('does not update dimensions if asset already has width and height', () async {
      const assetId = 'asset-with-dimensions';
      const existingWidth = 1920;
      const existingHeight = 1080;
      const exifWidth = 3840;
      const exifHeight = 2160;

      await sut.updateUsersV1([_createUser()]);

      final asset = _createAsset(
        id: assetId,
        checksum: 'checksum-with-dims',
        fileName: 'with_dimensions.jpg',
        width: existingWidth,
        height: existingHeight,
      );
      await sut.updateAssetsV1([asset]);

      final exif = _createExif(assetId: assetId, width: exifWidth, height: exifHeight, orientation: '6');
      await sut.updateAssetsExifV1([exif]);

      // Verify the asset still has original dimensions (not updated from EXIF)
      final query = db.remoteAssetEntity.select()..where((tbl) => tbl.id.equals(assetId));
      final result = await query.getSingle();

      expect(result.width, equals(existingWidth), reason: 'Width should remain as originally set');
      expect(result.height, equals(existingHeight), reason: 'Height should remain as originally set');
    });
  });

  group('SyncStreamRepository - reset()', () {
    test('nulls linkedRemoteAlbumId on localAlbumEntity so FK refs do not dangle', () async {
      const localAlbumId = 'local-1';
      const remoteAlbumId = 'remote-1';

      await db.remoteAlbumEntity.insertOne(
        RemoteAlbumEntityCompanion.insert(id: remoteAlbumId, name: 'Movies', order: AlbumAssetOrder.desc),
      );
      await db.localAlbumEntity.insertOne(
        LocalAlbumEntityCompanion.insert(
          id: localAlbumId,
          name: 'Movies',
          backupSelection: BackupSelection.selected,
          linkedRemoteAlbumId: const drift.Value(remoteAlbumId),
        ),
      );

      // sanity: link is set before reset
      final before = await (db.localAlbumEntity.select()..where((t) => t.id.equals(localAlbumId))).getSingle();
      expect(before.linkedRemoteAlbumId, equals(remoteAlbumId));

      await sut.reset();

      final after = await (db.localAlbumEntity.select()..where((t) => t.id.equals(localAlbumId))).getSingle();
      expect(
        after.linkedRemoteAlbumId,
        isNull,
        reason:
            'reset() runs with PRAGMA foreign_keys = OFF so the ON DELETE SET NULL cascade does not fire — the link must be nulled manually',
      );
      expect(after.name, equals('Movies'), reason: 'local album row itself must be preserved');
      expect(after.backupSelection, equals(BackupSelection.selected));

      final remoteRows = await db.remoteAlbumEntity.select().get();
      expect(remoteRows, isEmpty, reason: 'reset() still wipes remoteAlbumEntity');
    });

    test('preserves localAlbumEntity rows that have no linkedRemoteAlbumId', () async {
      const localAlbumId = 'local-unlinked';
      await db.localAlbumEntity.insertOne(
        LocalAlbumEntityCompanion.insert(id: localAlbumId, name: 'Camera', backupSelection: BackupSelection.none),
      );

      await sut.reset();

      final after = await (db.localAlbumEntity.select()..where((t) => t.id.equals(localAlbumId))).getSingle();
      expect(after.linkedRemoteAlbumId, isNull);
      expect(after.name, equals('Camera'));
      expect(after.backupSelection, equals(BackupSelection.none));
    });
  });

  group('SyncStreamRepository - updateAssets upsert dedupe (#22522 #27186)', () {
    Future<void> pragmaOn(String testName) async {
      await db.customStatement('PRAGMA foreign_keys = ON');
      final row = await db.customSelect('PRAGMA foreign_keys').getSingle();
      // ignore: avoid_print
      print('RECEIPT test=$testName pragma foreign_keys=${row.read<int>('foreign_keys')}');
    }

    Future<void> seedChildren(String assetId, String tag) async {
      await db.remoteExifEntity.insertOne(RemoteExifEntityCompanion.insert(assetId: assetId));
      await db.remoteAlbumEntity.insertOne(
        RemoteAlbumEntityCompanion.insert(id: 'album-$tag', name: 'Album', order: AlbumAssetOrder.desc),
      );
      await db.remoteAlbumAssetEntity.insertOne(
        RemoteAlbumAssetEntityCompanion.insert(assetId: assetId, albumId: 'album-$tag'),
      );
      await db.memoryEntity.insertOne(
        MemoryEntityCompanion.insert(
          id: 'memory-$tag',
          ownerId: 'user-1',
          type: MemoryTypeEnum.onThisDay,
          data: '{"year":2024}',
          memoryAt: DateTime(2024, 1, 1),
        ),
      );
      await db.memoryAssetEntity.insertOne(
        MemoryAssetEntityCompanion.insert(assetId: assetId, memoryId: 'memory-$tag'),
      );
      await db.assetFaceEntity.insertOne(
        AssetFaceEntityCompanion.insert(
          id: 'face-$tag',
          assetId: assetId,
          imageWidth: 100,
          imageHeight: 100,
          boundingBoxX1: 0,
          boundingBoxY1: 0,
          boundingBoxX2: 10,
          boundingBoxY2: 10,
          sourceType: 'ml',
        ),
      );
    }

    Future<int> countChildren(String assetId) async {
      final exif = await (db.remoteExifEntity.select()..where((t) => t.assetId.equals(assetId))).get();
      final albumAsset = await (db.remoteAlbumAssetEntity.select()..where((t) => t.assetId.equals(assetId))).get();
      final memoryAsset = await (db.memoryAssetEntity.select()..where((t) => t.assetId.equals(assetId))).get();
      final faces = await (db.assetFaceEntity.select()..where((t) => t.assetId.equals(assetId))).get();
      return exif.length + albumAsset.length + memoryAsset.length + faces.length;
    }

    test('same-id update keeps children and updates fields', () async {
      await pragmaOn('same-id');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([_createAsset(id: 'a', checksum: 'AAA', fileName: 'photo.jpg')]);
      await seedChildren('a', 't1');

      await sut.updateAssetsV1([_createAsset(id: 'a', checksum: 'AAA', fileName: 'renamed.jpg', isFavorite: true)]);

      expect(await countChildren('a'), 4, reason: 'DO UPDATE keeps the row, children survive');
      final row = await (db.remoteAssetEntity.select()..where((t) => t.id.equals('a'))).getSingle();
      expect(row.name, 'renamed.jpg');
      expect(row.isFavorite, isTrue);
    });

    test('reupload with a new id replaces the stale row and cascades its children', () async {
      await pragmaOn('reupload');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([_createAsset(id: 'stale', checksum: 'AAA', fileName: 'photo.jpg')]);
      await seedChildren('stale', 't2');

      await sut.updateAssetsV1([_createAsset(id: 'fresh', checksum: 'AAA', fileName: 'photo.jpg')]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows.map((r) => r.id), ['fresh'], reason: 'no 2067, stale row replaced away');
      expect(await countChildren('stale'), 0, reason: 'stale children cascade with the replaced row');

      // same scenario through V2
      await sut.updateAssetsV2([_createAssetV2(id: 'stale2', checksum: 'BBB', fileName: 'photo2.jpg')]);
      await seedChildren('stale2', 't2b');
      await sut.updateAssetsV2([_createAssetV2(id: 'fresh2', checksum: 'BBB', fileName: 'photo2.jpg')]);

      final rows2 = await db.remoteAssetEntity.select().get();
      expect(rows2.map((r) => r.id), containsAllInOrder(['fresh', 'fresh2']));
      expect(await countChildren('stale2'), 0);
    });

    test('library variant replaces only the matching library row', () async {
      await pragmaOn('library');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([
        _createAsset(id: 'stale-lib', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1'),
        _createAsset(id: 'keep-null', checksum: 'AAA', fileName: 'photo.jpg'),
      ]);

      await sut.updateAssetsV1([
        _createAsset(id: 'fresh-lib', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows.map((r) => r.id).toSet(), {
        'fresh-lib',
        'keep-null',
      }, reason: 'library NULL and NOT NULL match different partial indexes');
    });

    test('batch-internal duplicates keep the last payload asset', () async {
      await pragmaOn('batch-dupes');
      await sut.updateUsersV1([_createUser()]);

      await sut.updateAssetsV1([
        _createAsset(id: 'first-id', checksum: 'AAA', fileName: 'photo.jpg'),
        _createAsset(id: 'last-id', checksum: 'AAA', fileName: 'photo.jpg'),
        _createAsset(id: 'first-lib', checksum: 'BBB', fileName: 'photo.jpg', libraryId: 'lib-1'),
        _createAsset(id: 'last-lib', checksum: 'BBB', fileName: 'photo.jpg', libraryId: 'lib-1'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(2), reason: 'REPLACE makes batch-internal duplicates last-wins, no crash');
      expect(rows.map((r) => r.id).toSet(), {'last-id', 'last-lib'});
    });

    test('mixed batch of new, updated, and colliding assets all land', () async {
      await pragmaOn('mixed');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([
        _createAsset(id: 'up', checksum: 'UUU', fileName: 'up.jpg'),
        _createAsset(id: 'stale', checksum: 'CCC', fileName: 'collide.jpg'),
      ]);
      await seedChildren('up', 't5a');
      await seedChildren('stale', 't5b');

      await sut.updateAssetsV1([
        _createAsset(id: 'up', checksum: 'UUU', fileName: 'up-renamed.jpg'),
        _createAsset(id: 'new', checksum: 'NNN', fileName: 'new.jpg'),
        _createAsset(id: 'fresh', checksum: 'CCC', fileName: 'collide.jpg'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows.map((r) => r.id).toSet(), {'up', 'new', 'fresh'});
      expect(rows.singleWhere((r) => r.id == 'up').name, 'up-renamed.jpg');
      expect(await countChildren('up'), 4, reason: 'in-place update keeps children');
      expect(await countChildren('stale'), 0, reason: 'collided row replaced and cascaded');
    });

    test('a trashed stale row is replaced cleanly', () async {
      await pragmaOn('trashed');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([
        _createAsset(id: 'stale', checksum: 'AAA', fileName: 'photo.jpg', deletedAt: DateTime(2024, 2, 1)),
      ]);

      await sut.updateAssetsV1([_createAsset(id: 'fresh', checksum: 'AAA', fileName: 'photo.jpg')]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows.map((r) => r.id), ['fresh']);
      expect(rows.single.deletedAt, isNull, reason: 'payload deletedAt wins through REPLACE');
    });

    test('fields survive a cross-id replace exactly as sent', () async {
      await pragmaOn('fields');
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([_createAsset(id: 'stale', checksum: 'AAA', fileName: 'photo.jpg')]);

      await sut.updateAssetsV1([
        _createAsset(
          id: 'fresh',
          checksum: 'AAA',
          fileName: 'rich.jpg',
          isFavorite: true,
          visibility: AssetVisibility.archive,
          stackId: 'stack-1',
          livePhotoVideoId: 'vid-1',
          thumbhash: 'th-1',
          width: 100,
          height: 200,
          fileCreatedAt: DateTime(2024, 5, 5),
          fileModifiedAt: DateTime(2024, 6, 6),
        ),
      ]);

      final row = await (db.remoteAssetEntity.select()..where((t) => t.id.equals('fresh'))).getSingle();
      expect(row.name, 'rich.jpg');
      expect(row.isFavorite, isTrue);
      expect(row.visibility, domain.AssetVisibility.archive);
      expect(row.stackId, 'stack-1');
      expect(row.livePhotoVideoId, 'vid-1');
      expect(row.thumbHash, 'th-1');
      expect(row.width, 100);
      expect(row.height, 200);
      expect(row.createdAt, DateTime(2024, 5, 5));
      expect(row.updatedAt, DateTime(2024, 6, 6));
    });

    test('emits a single INSERT OR REPLACE statement with an id DO UPDATE arm', () async {
      final captured = <String>[];
      final originalDebugPrint = drift.driftRuntimeOptions.debugPrint;
      drift.driftRuntimeOptions.debugPrint = captured.add;
      addTearDown(() => drift.driftRuntimeOptions.debugPrint = originalDebugPrint);
      final logDb = Drift(
        drift.DatabaseConnection(NativeDatabase.memory(logStatements: true), closeStreamsSynchronously: true),
      );
      addTearDown(logDb.close);
      final logSut = SyncStreamRepository(logDb);

      await logSut.updateUsersV1([_createUser()]);
      await logSut.updateAssetsV1([_createAsset(id: 'a', checksum: 'AAA', fileName: 'photo.jpg')]);

      final lines = captured.where((l) => l.contains('remote_asset_entity')).toList();
      // ignore: avoid_print
      print('RECEIPT emitted=$lines');
      expect(lines, isNotEmpty);
      expect(lines.join('\n'), contains('INSERT OR REPLACE INTO "remote_asset_entity"'));
      expect(lines.join('\n'), contains('ON CONFLICT("id") DO UPDATE'));
    });

    test('updateUsersV1 still upserts users', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateUsersV1([_createUser(name: 'Renamed User')]);

      final rows = await db.userEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.single.name, 'Renamed User');
    });
  });
}
