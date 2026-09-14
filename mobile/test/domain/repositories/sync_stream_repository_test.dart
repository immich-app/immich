import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/local/album.drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/album.drift.dart';
import 'package:immich_mobile/data/db/main/table/remote/exif.drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:openapi/api.dart';

SyncUserV1 _createUser({String id = 'user-1'}) {
  return SyncUserV1(
    id: id,
    name: 'Test User',
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
  int? width,
  int? height,
  String? libraryId,
  bool isFavorite = false,
}) {
  return SyncAssetV1(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: AssetTypeEnum.IMAGE,
    ownerId: 'user-1',
    isFavorite: isFavorite,
    fileCreatedAt: DateTime(2024, 1, 1),
    fileModifiedAt: DateTime(2024, 1, 1),
    createdAt: DateTime(2024, 1, 1),
    localDateTime: DateTime(2024, 1, 1),
    visibility: AssetVisibility.timeline,
    width: width,
    height: height,
    deletedAt: null,
    duration: null,
    libraryId: libraryId,
    livePhotoVideoId: null,
    stackId: null,
    thumbhash: null,
    isEdited: false,
  );
}

SyncAssetV2 _createAssetV2({required String id, required String checksum, required String fileName}) {
  return SyncAssetV2(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: AssetTypeEnum.IMAGE,
    ownerId: 'user-1',
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
    libraryId: null,
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
    Future<void> seedExif(String assetId) =>
        db.remoteExifEntity.insertOne(RemoteExifEntityCompanion.insert(assetId: assetId));

    Future<bool> exifExists(String assetId) async {
      final rows = await (db.remoteExifEntity.select()..where((t) => t.assetId.equals(assetId))).get();
      return rows.isNotEmpty;
    }

    test('same-id update keeps the child row and updates fields', () async {
      await sut.updateUsersV1([_createUser()]);
      final asset = _createAsset(id: 'a', checksum: 'AAA', fileName: 'photo.jpg');
      await sut.updateAssetsV1([asset]);
      await seedExif(asset.id);

      final renamed = _createAsset(id: asset.id, checksum: asset.checksum, fileName: 'renamed.jpg', isFavorite: true);
      await sut.updateAssetsV1([renamed]);

      expect(await exifExists(asset.id), isTrue, reason: 'DO UPDATE keeps the row, the child survives');
      final row = await (db.remoteAssetEntity.select()..where((t) => t.id.equals(asset.id))).getSingle();
      expect(row.name, renamed.originalFileName);
      expect(row.isFavorite, isTrue);
    });

    test('reupload with a new id replaces the stale row and cascades its child', () async {
      await sut.updateUsersV1([_createUser()]);
      final stale = _createAsset(id: 'stale', checksum: 'AAA', fileName: 'photo.jpg');
      await sut.updateAssetsV1([stale]);
      await seedExif(stale.id);

      final fresh = _createAsset(id: 'fresh', checksum: stale.checksum, fileName: stale.originalFileName);
      await sut.updateAssetsV1([fresh]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1), reason: 'no 2067, stale row replaced away');
      expect(rows.single.id, fresh.id);
      expect(await exifExists(stale.id), isFalse, reason: 'the stale child cascades with the replaced row');

      // same scenario through V2
      final staleV2 = _createAssetV2(id: 'stale2', checksum: 'BBB', fileName: 'photo2.jpg');
      await sut.updateAssetsV2([staleV2]);
      await seedExif(staleV2.id);
      final freshV2 = _createAssetV2(id: 'fresh2', checksum: staleV2.checksum, fileName: staleV2.originalFileName);
      await sut.updateAssetsV2([freshV2]);

      final rows2 = await db.remoteAssetEntity.select().get();
      expect(rows2.map((r) => r.id), containsAll([fresh.id, freshV2.id]));
      expect(await exifExists(staleV2.id), isFalse);
    });

    test('library variant replaces only the matching library row', () async {
      await sut.updateUsersV1([_createUser()]);
      final staleLib = _createAsset(id: 'stale-lib', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1');
      final keepNull = _createAsset(id: 'keep-null', checksum: staleLib.checksum, fileName: staleLib.originalFileName);
      await sut.updateAssetsV1([staleLib, keepNull]);

      final freshLib = _createAsset(
        id: 'fresh-lib',
        checksum: staleLib.checksum,
        fileName: staleLib.originalFileName,
        libraryId: staleLib.libraryId,
      );
      await sut.updateAssetsV1([freshLib]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows.map((r) => r.id).toSet(), {
        freshLib.id,
        keepNull.id,
      }, reason: 'library NULL and NOT NULL match different partial indexes');
    });

    test('batch-internal duplicates keep the last payload asset', () async {
      await sut.updateUsersV1([_createUser()]);
      final first = _createAsset(id: 'first-id', checksum: 'AAA', fileName: 'photo.jpg');
      final last = _createAsset(id: 'last-id', checksum: first.checksum, fileName: first.originalFileName);
      final firstLib = _createAsset(
        id: 'first-lib',
        checksum: 'BBB',
        fileName: first.originalFileName,
        libraryId: 'lib-1',
      );
      final lastLib = _createAsset(
        id: 'last-lib',
        checksum: firstLib.checksum,
        fileName: firstLib.originalFileName,
        libraryId: firstLib.libraryId,
      );

      await sut.updateAssetsV1([first, last, firstLib, lastLib]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(2), reason: 'REPLACE makes batch-internal duplicates last-wins, no crash');
      expect(rows.map((r) => r.id).toSet(), {last.id, lastLib.id});
    });
  });
}
