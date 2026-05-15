import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
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
  String ownerId = 'user-1',
  int? width,
  int? height,
  String? libraryId,
}) {
  return SyncAssetV1(
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

  group('SyncStreamRepository - updateAssetsV1 dedupe (#22522 #27186)', () {
    test('replaces stale row when new id arrives with same (ownerId, checksum) and library is null', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([_createAsset(id: 'old-id', checksum: 'AAA', fileName: 'photo.jpg')]);

      // Server re-issues a new id for the same content (replace-with-upload, immich-go, etc.)
      await sut.updateAssetsV1([_createAsset(id: 'new-id', checksum: 'AAA', fileName: 'photo.jpg')]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.single.id, equals('new-id'));
      expect(rows.single.checksum, equals('AAA'));
    });

    test('replaces stale row by (ownerId, libraryId, checksum) when library is not null', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([
        _createAsset(id: 'old-id', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1'),
      ]);

      await sut.updateAssetsV1([
        _createAsset(id: 'new-id', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.single.id, equals('new-id'));
      expect(rows.single.libraryId, equals('lib-1'));
    });

    test('library and non-library rows with same (ownerId, checksum) coexist', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([
        _createAsset(id: 'lib-row', checksum: 'AAA', fileName: 'photo.jpg', libraryId: 'lib-1'),
        _createAsset(id: 'main-row', checksum: 'AAA', fileName: 'photo.jpg'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(2), reason: 'library NULL and NOT NULL match different partial indexes');
      expect(rows.map((r) => r.id).toSet(), equals({'lib-row', 'main-row'}));
    });

    test('different owners with same checksum coexist', () async {
      await sut.updateUsersV1([_createUser(id: 'user-1')]);
      await sut.updateUsersV1([_createUser(id: 'user-2')]);
      await sut.updateAssetsV1([
        _createAsset(id: 'a-id', checksum: 'AAA', fileName: 'photo.jpg', ownerId: 'user-1'),
        _createAsset(id: 'b-id', checksum: 'AAA', fileName: 'photo.jpg', ownerId: 'user-2'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(2));
    });

    test('same id arriving again updates in place (no self-delete)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV1([_createAsset(id: 'same-id', checksum: 'AAA', fileName: 'photo.jpg')]);

      await sut.updateAssetsV1([_createAsset(id: 'same-id', checksum: 'AAA', fileName: 'renamed.jpg')]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.single.id, equals('same-id'));
      expect(rows.single.name, equals('renamed.jpg'), reason: 'ON CONFLICT(id) DO UPDATE path still works');
    });

    test('updateAssetsV2 dedupes the same way', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateAssetsV2([_createAssetV2(id: 'old-id', checksum: 'AAA', fileName: 'photo.jpg')]);

      await sut.updateAssetsV2([_createAssetV2(id: 'new-id', checksum: 'AAA', fileName: 'photo.jpg')]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.single.id, equals('new-id'));
    });
  });
}
