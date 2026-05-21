import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/entities/local_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart' as domain;
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
  AssetVisibility visibility = AssetVisibility.timeline,
  AssetTypeEnum type = AssetTypeEnum.IMAGE,
  String? livePhotoVideoId,
  String? stackId,
  bool isFavorite = false,
  DateTime? deletedAt,
}) {
  return SyncAssetV1(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: type,
    ownerId: ownerId,
    isFavorite: isFavorite,
    fileCreatedAt: DateTime(2024, 1, 1),
    fileModifiedAt: DateTime(2024, 1, 1),
    createdAt: DateTime(2024, 1, 1),
    localDateTime: DateTime(2024, 1, 1),
    visibility: visibility,
    width: width,
    height: height,
    deletedAt: deletedAt,
    duration: null,
    libraryId: null,
    livePhotoVideoId: livePhotoVideoId,
    stackId: stackId,
    thumbhash: null,
    isEdited: false,
  );
}

SyncAssetV2 _createAssetV2({
  required String id,
  required String checksum,
  required String fileName,
  String ownerId = 'user-1',
  AssetVisibility visibility = AssetVisibility.timeline,
  AssetTypeEnum type = AssetTypeEnum.IMAGE,
  String? livePhotoVideoId,
  String? stackId,
  bool isFavorite = false,
  DateTime? deletedAt,
}) {
  return SyncAssetV2(
    id: id,
    checksum: checksum,
    originalFileName: fileName,
    type: type,
    ownerId: ownerId,
    isFavorite: isFavorite,
    fileCreatedAt: DateTime(2024, 1, 1),
    fileModifiedAt: DateTime(2024, 1, 1),
    createdAt: DateTime(2024, 1, 1),
    localDateTime: DateTime(2024, 1, 1),
    visibility: visibility,
    width: null,
    height: null,
    deletedAt: deletedAt,
    duration: null,
    libraryId: null,
    livePhotoVideoId: livePhotoVideoId,
    stackId: stackId,
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

  group('SyncStreamRepository - websocket fast-path link state', () {
    Future<RemoteAssetEntityData> read(String id) =>
        (db.remoteAssetEntity.select()..where((t) => t.id.equals(id))).getSingle();

    test('fromWebsocket does not clobber visibility the checkpoint sync already hid', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'motion-video';

      // checkpoint sync stored the real server state: a hidden motion video
      await sut.updateAssetsV1([
        _createAsset(
          id: id,
          checksum: 'cs',
          fileName: 'IMG.mov',
          type: AssetTypeEnum.VIDEO,
          visibility: AssetVisibility.hidden,
        ),
      ]);

      // a stale upload-ready event arrives with the upload-time state (timeline)
      await sut.updateAssetsV1([
        _createAsset(
          id: id,
          checksum: 'cs',
          fileName: 'IMG.mov',
          type: AssetTypeEnum.VIDEO,
          visibility: AssetVisibility.timeline,
        ),
      ], fromWebsocket: true);

      expect((await read(id)).visibility, domain.AssetVisibility.hidden);
    });

    test('authoritative sync (default) still overwrites visibility', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'asset-1';

      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic', visibility: AssetVisibility.hidden),
      ]);
      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic', visibility: AssetVisibility.timeline),
      ]);

      expect((await read(id)).visibility, domain.AssetVisibility.timeline);
    });

    test('fromWebsocket still inserts a new asset with its payload visibility', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'new-asset';

      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic', visibility: AssetVisibility.timeline),
      ], fromWebsocket: true);

      expect((await read(id)).visibility, domain.AssetVisibility.timeline);
    });

    test('fromWebsocket conflict keeps checkpoint livePhotoVideoId and stackId but applies other fields', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'edited-still-1';
      const stackId = 'stack-001';

      await db.stackEntity.insertOne(StackEntityCompanion.insert(id: stackId, ownerId: 'user-1', primaryAssetId: id));

      // checkpoint linked the edited still to its base pair
      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic', livePhotoVideoId: 'live-vid-001', stackId: stackId),
      ]);

      // stale websocket snapshot from upload time: no links yet, but favorite since
      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG_RENAMED.heic', isFavorite: true),
      ], fromWebsocket: true);

      final row = await read(id);
      expect(row.livePhotoVideoId, 'live-vid-001');
      expect(row.stackId, stackId);
      expect(row.name, 'IMG_RENAMED.heic', reason: 'non-link fields from the websocket payload must still apply');
      expect(row.isFavorite, isTrue);
    });

    test('fromWebsocket conflict does not resurrect an asset the checkpoint trashed', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'trashed-asset';

      await sut.updateAssetsV1([
        _createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic', deletedAt: DateTime(2024, 2, 1)),
      ]);

      // debounced upload-ready snapshot always carries deletedAt null
      await sut.updateAssetsV1([_createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic')], fromWebsocket: true);

      expect((await read(id)).deletedAt, isNotNull);
    });

    test('authoritative sync (default) still overwrites livePhotoVideoId, stackId and deletedAt', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'unstacked-asset';
      const stackId = 'stack-002';

      await db.stackEntity.insertOne(StackEntityCompanion.insert(id: stackId, ownerId: 'user-1', primaryAssetId: id));

      await sut.updateAssetsV1([
        _createAsset(
          id: id,
          checksum: 'cs',
          fileName: 'IMG.heic',
          livePhotoVideoId: 'live-vid-002',
          stackId: stackId,
          deletedAt: DateTime(2024, 2, 1),
        ),
      ]);

      // server unstacked + restored the asset; checkpoint sync must win
      await sut.updateAssetsV1([_createAsset(id: id, checksum: 'cs', fileName: 'IMG.heic')]);

      final row = await read(id);
      expect(row.livePhotoVideoId, isNull);
      expect(row.stackId, isNull);
      expect(row.deletedAt, isNull);
    });

    test('fromWebsocket does not clobber visibility through updateAssetsV2', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'motion-video-v2';

      await sut.updateAssetsV2([
        _createAssetV2(
          id: id,
          checksum: 'cs',
          fileName: 'IMG.mov',
          type: AssetTypeEnum.VIDEO,
          visibility: AssetVisibility.hidden,
        ),
      ]);

      await sut.updateAssetsV2([
        _createAssetV2(
          id: id,
          checksum: 'cs',
          fileName: 'IMG.mov',
          type: AssetTypeEnum.VIDEO,
          visibility: AssetVisibility.timeline,
        ),
      ], fromWebsocket: true);

      expect((await read(id)).visibility, domain.AssetVisibility.hidden);
    });

    test('fromWebsocket still inserts a new asset through updateAssetsV2', () async {
      await sut.updateUsersV1([_createUser()]);
      const id = 'new-asset-v2';

      await sut.updateAssetsV2([
        _createAssetV2(id: id, checksum: 'cs', fileName: 'IMG.heic', visibility: AssetVisibility.timeline),
      ], fromWebsocket: true);

      expect((await read(id)).visibility, domain.AssetVisibility.timeline);
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

    test('nulls priorRemoteId and syncedChecksum on localAssetEntity but keeps the row', () async {
      const localId = 'local-edited';

      await db.localAssetEntity.insertOne(
        LocalAssetEntityCompanion.insert(
          id: localId,
          name: 'IMG.heic',
          type: domain.AssetType.image,
          checksum: const drift.Value('cs-local'),
          priorRemoteId: const drift.Value('prior-remote-1'),
          syncedChecksum: const drift.Value('cs-synced'),
        ),
      );

      await sut.reset();

      final after = await (db.localAssetEntity.select()..where((t) => t.id.equals(localId))).getSingle();
      expect(
        after.priorRemoteId,
        isNull,
        reason: 'the remote rows the stamps point at were wiped — a later backup must not stack onto dead ids',
      );
      expect(after.syncedChecksum, isNull);
      expect(after.name, equals('IMG.heic'), reason: 'local asset row itself must be preserved');
      expect(after.checksum, equals('cs-local'));
    });
  });
}
