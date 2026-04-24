import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:openapi/api.dart';

SyncUserV1 _createUser({String id = 'user-1'}) {
  return SyncUserV1(
    id: id,
    name: 'Test User',
    email: 'test@test.com',
    deletedAt: null,
    avatarColor: null,
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
    localDateTime: DateTime(2024, 1, 1),
    visibility: AssetVisibility.timeline,
    width: width,
    height: height,
    deletedAt: null,
    duration: null,
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

  group('SyncStreamRepository - Shared spaces', () {
    SyncSharedSpaceV1 makeSpace({
      String id = 'space-1',
      String name = 'Test Space',
      String createdById = 'user-1',
      String? description,
      String? color,
      String? thumbnailAssetId,
    }) => SyncSharedSpaceV1(
      id: id,
      name: name,
      description: description,
      color: color,
      createdById: createdById,
      thumbnailAssetId: thumbnailAssetId,
      thumbnailCropY: null,
      faceRecognitionEnabled: true,
      petsEnabled: false,
      lastActivityAt: null,
      createdAt: DateTime(2026, 4, 6),
      updatedAt: DateTime(2026, 4, 6),
    );

    SyncSharedSpaceMemberV1 makeMember({
      String spaceId = 'space-1',
      String userId = 'user-1',
      String role = 'editor',
      bool showInTimeline = true,
    }) => SyncSharedSpaceMemberV1(
      spaceId: spaceId,
      userId: userId,
      role: role,
      joinedAt: DateTime(2026, 4, 6),
      showInTimeline: showInTimeline,
    );

    test('updateSharedSpacesV1 inserts a new shared space row', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace(name: 'First')]);

      final row = await (db.sharedSpaceEntity.select()..where((t) => t.id.equals('space-1'))).getSingle();
      expect(row.name, 'First');
      expect(row.faceRecognitionEnabled, true);
    });

    test('updateSharedSpacesV1 upserts on conflict (idempotent)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace(name: 'Original')]);
      await sut.updateSharedSpacesV1([makeSpace(name: 'Renamed', description: 'Updated')]);

      final row = await (db.sharedSpaceEntity.select()..where((t) => t.id.equals('space-1'))).getSingle();
      expect(row.name, 'Renamed');
      expect(row.description, 'Updated');
    });

    test('deleteSharedSpacesV1 removes the row and cascades to members and join rows', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace()]);
      await sut.updateSharedSpaceMembersV1([makeMember()]);
      await sut.updateAssetsV1([_createAsset(id: 'asset-1', checksum: 'c1', fileName: 'a.jpg')]);
      await sut.updateSharedSpaceToAssetsV1([SyncSharedSpaceToAssetV1(spaceId: 'space-1', assetId: 'asset-1')]);

      await sut.deleteSharedSpacesV1([SyncSharedSpaceDeleteV1(spaceId: 'space-1')]);

      final spaceCount = await db.sharedSpaceEntity.select().get();
      final memberCount = await db.sharedSpaceMemberEntity.select().get();
      final joinCount = await db.sharedSpaceAssetEntity.select().get();
      expect(spaceCount, isEmpty);
      expect(memberCount, isEmpty);
      expect(joinCount, isEmpty);
    });

    test('updateSharedSpaceMembersV1 inserts a new member row', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace()]);
      await sut.updateSharedSpaceMembersV1([makeMember()]);

      final row =
          await (db.sharedSpaceMemberEntity.select()
                ..where((t) => t.spaceId.equals('space-1') & t.userId.equals('user-1')))
              .getSingle();
      expect(row.role, 'editor');
      expect(row.showInTimeline, true);
    });

    test('updateSharedSpaceMembersV1 upserts on conflict (role change)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace()]);
      await sut.updateSharedSpaceMembersV1([makeMember(role: 'editor')]);
      await sut.updateSharedSpaceMembersV1([makeMember(role: 'owner', showInTimeline: false)]);

      final row =
          await (db.sharedSpaceMemberEntity.select()
                ..where((t) => t.spaceId.equals('space-1') & t.userId.equals('user-1')))
              .getSingle();
      expect(row.role, 'owner');
      expect(row.showInTimeline, false);
    });

    test('deleteSharedSpaceMembersV1 removes the (space, user) pair only', () async {
      await sut.updateUsersV1([_createUser(), _createUser(id: 'user-2')]);
      await sut.updateSharedSpacesV1([makeSpace()]);
      await sut.updateSharedSpaceMembersV1([makeMember(userId: 'user-1'), makeMember(userId: 'user-2')]);

      await sut.deleteSharedSpaceMembersV1([SyncSharedSpaceMemberDeleteV1(spaceId: 'space-1', userId: 'user-1')]);

      final remaining = await db.sharedSpaceMemberEntity.select().get();
      expect(remaining, hasLength(1));
      expect(remaining.first.userId, 'user-2');
    });

    test('updateSharedSpaceAssetsV1 delegates to updateAssetsV1 (writes remote_asset)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpaceAssetsV1([_createAsset(id: 'asset-1', checksum: 'cccc', fileName: 'shared.jpg')]);

      final row = await (db.remoteAssetEntity.select()..where((t) => t.id.equals('asset-1'))).getSingle();
      expect(row.name, 'shared.jpg');
    });

    test('updateSharedSpaceAssetExifsV1 delegates to updateAssetsExifV1 (writes remote_exif)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpaceAssetsV1([_createAsset(id: 'asset-1', checksum: 'cccc', fileName: 'shared.jpg')]);
      await sut.updateSharedSpaceAssetExifsV1([
        _createExif(assetId: 'asset-1', width: 100, height: 200, orientation: '1'),
      ]);

      final row = await (db.remoteExifEntity.select()..where((t) => t.assetId.equals('asset-1'))).getSingle();
      expect(row.width, 100);
      expect(row.height, 200);
    });

    test('updateSharedSpaceToAssetsV1 inserts join rows even when the asset row does not yet exist', () async {
      // The shared_space_asset entity intentionally has no FK on assetId — this
      // is the design decision that lets the mobile sync stream tolerate out-of-order
      // delivery between the SharedSpaceToAssetV1 stream and the SharedSpaceAssetCreateV1
      // stream.
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace()]);

      await sut.updateSharedSpaceToAssetsV1([
        SyncSharedSpaceToAssetV1(spaceId: 'space-1', assetId: 'asset-not-yet-synced'),
      ]);

      final rows = await db.sharedSpaceAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.assetId, 'asset-not-yet-synced');
    });

    test('deleteSharedSpaceToAssetsV1 removes the (space, asset) pair', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([makeSpace()]);
      await sut.updateSharedSpaceToAssetsV1([
        SyncSharedSpaceToAssetV1(spaceId: 'space-1', assetId: 'asset-1'),
        SyncSharedSpaceToAssetV1(spaceId: 'space-1', assetId: 'asset-2'),
      ]);

      await sut.deleteSharedSpaceToAssetsV1([SyncSharedSpaceToAssetDeleteV1(spaceId: 'space-1', assetId: 'asset-1')]);

      final remaining = await db.sharedSpaceAssetEntity.select().get();
      expect(remaining, hasLength(1));
      expect(remaining.first.assetId, 'asset-2');
    });
  });

  group('SyncStreamRepository - Libraries', () {
    SyncLibraryV1 makeLibrary({String id = 'library-1', String name = 'External Library', String ownerId = 'user-1'}) =>
        SyncLibraryV1(
          id: id,
          name: name,
          ownerId: ownerId,
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        );

    SyncAssetV1 makeLibraryAsset({
      required String id,
      required String checksum,
      required String ownerId,
      required String libraryId,
    }) => SyncAssetV1(
      id: id,
      checksum: checksum,
      originalFileName: '$id.jpg',
      type: AssetTypeEnum.IMAGE,
      ownerId: ownerId,
      isFavorite: false,
      fileCreatedAt: DateTime(2024, 1, 1),
      fileModifiedAt: DateTime(2024, 1, 1),
      localDateTime: DateTime(2024, 1, 1),
      visibility: AssetVisibility.timeline,
      width: 100,
      height: 100,
      deletedAt: null,
      duration: null,
      libraryId: libraryId,
      livePhotoVideoId: null,
      stackId: null,
      thumbhash: null,
      isEdited: false,
    );

    Future<void> insertPartner({required String sharedById, required String sharedWithId}) async {
      await db
          .into(db.partnerEntity)
          .insert(
            PartnerEntityCompanion.insert(
              sharedById: sharedById,
              sharedWithId: sharedWithId,
              inTimeline: const drift.Value(true),
            ),
          );
    }

    test('updateLibrariesV1 inserts a new library row', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary(name: 'First')]);

      final row = await (db.libraryEntity.select()..where((t) => t.id.equals('library-1'))).getSingle();
      expect(row.name, 'First');
      expect(row.ownerId, 'user-1');
    });

    test('updateLibrariesV1 upserts on conflict', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary(name: 'Original')]);
      await sut.updateLibrariesV1([makeLibrary(name: 'Renamed')]);

      final row = await (db.libraryEntity.select()..where((t) => t.id.equals('library-1'))).getSingle();
      expect(row.name, 'Renamed');
    });

    test('updateLibraryAssetsV1 delegates to updateAssetsV1 (writes remote_asset with libraryId)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'c1', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      final row = await (db.remoteAssetEntity.select()..where((t) => t.id.equals('asset-1'))).getSingle();
      expect(row.libraryId, 'library-1');
    });

    test('updateLibraryAssetExifsV1 delegates to updateAssetsExifV1', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'c1', ownerId: 'user-1', libraryId: 'library-1'),
      ]);
      await sut.updateLibraryAssetExifsV1([_createExif(assetId: 'asset-1', width: 640, height: 480, orientation: '1')]);

      final row = await (db.remoteExifEntity.select()..where((t) => t.assetId.equals('asset-1'))).getSingle();
      expect(row.width, 640);
      expect(row.height, 480);
    });

    test('deleteLibraryAssetsV1 removes individual asset rows', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'c1', ownerId: 'user-1', libraryId: 'library-1'),
        makeLibraryAsset(id: 'asset-2', checksum: 'c2', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      await sut.deleteLibraryAssetsV1([SyncLibraryAssetDeleteV1(assetId: 'asset-1')]);

      final remaining = await db.remoteAssetEntity.select().get();
      expect(remaining, hasLength(1));
      expect(remaining.first.id, 'asset-2');
    });

    test('deleteLibraryAssetsV1 is idempotent — calling twice with the same id is safe', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'cIdem', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      await sut.deleteLibraryAssetsV1([SyncLibraryAssetDeleteV1(assetId: 'asset-1')]);
      // Second call must not throw and must leave the table unchanged.
      await sut.deleteLibraryAssetsV1([SyncLibraryAssetDeleteV1(assetId: 'asset-1')]);

      expect(await db.remoteAssetEntity.select().get(), isEmpty);
    });

    test('deleteLibraryAssetsV1 handles a mixed batch (some present, some missing)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-present', checksum: 'cMix', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      await sut.deleteLibraryAssetsV1([
        SyncLibraryAssetDeleteV1(assetId: 'asset-present'),
        SyncLibraryAssetDeleteV1(assetId: 'asset-missing-1'),
        SyncLibraryAssetDeleteV1(assetId: 'asset-missing-2'),
      ]);

      // Present asset removed, missing asset deletes are silent no-ops.
      expect(await db.remoteAssetEntity.select().get(), isEmpty);
    });

    test('deleteLibraryAssetsV1 with empty input is a no-op (does not throw)', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'cEmpty', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      await sut.deleteLibraryAssetsV1(const <SyncLibraryAssetDeleteV1>[]);

      // Asset untouched.
      expect(await db.remoteAssetEntity.select().get(), hasLength(1));
    });

    test('updateSharedSpaceLibrariesV1 inserts a join row', () async {
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([
        SyncSharedSpaceV1(
          id: 'space-1',
          name: 'Space',
          description: null,
          color: null,
          createdById: 'user-1',
          thumbnailAssetId: null,
          thumbnailCropY: null,
          faceRecognitionEnabled: true,
          petsEnabled: false,
          lastActivityAt: null,
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);

      await sut.updateSharedSpaceLibrariesV1([
        SyncSharedSpaceLibraryV1(
          spaceId: 'space-1',
          libraryId: 'library-1',
          addedById: 'user-1',
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);

      final rows = await db.sharedSpaceLibraryEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.libraryId, 'library-1');
      expect(rows.first.addedById, 'user-1');
    });

    test('deleteSharedSpaceLibrariesV1 removes join row but does NOT touch assets', () async {
      await sut.updateUsersV1([_createUser(), _createUser(id: 'user-2')]);
      await sut.updateSharedSpacesV1([
        SyncSharedSpaceV1(
          id: 'space-1',
          name: 'Space',
          description: null,
          color: null,
          createdById: 'user-1',
          thumbnailAssetId: null,
          thumbnailCropY: null,
          faceRecognitionEnabled: true,
          petsEnabled: false,
          lastActivityAt: null,
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);
      await sut.updateLibrariesV1([makeLibrary()]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'asset-1', checksum: 'c1', ownerId: 'user-2', libraryId: 'library-1'),
      ]);
      await sut.updateSharedSpaceLibrariesV1([
        SyncSharedSpaceLibraryV1(
          spaceId: 'space-1',
          libraryId: 'library-1',
          addedById: 'user-1',
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);

      await sut.deleteSharedSpaceLibrariesV1([
        SyncSharedSpaceLibraryDeleteV1(spaceId: 'space-1', libraryId: 'library-1'),
      ]);

      final joinRows = await db.sharedSpaceLibraryEntity.select().get();
      expect(joinRows, isEmpty);
      // Asset row and library row must still exist — only the join was removed.
      final assetRows = await db.remoteAssetEntity.select().get();
      expect(assetRows, hasLength(1));
      final libraryRows = await db.libraryEntity.select().get();
      expect(libraryRows, hasLength(1));
    });

    group('deleteLibrariesV1 orphan sweep', () {
      setUp(() async {
        // Current user + a partner user + an unrelated foreign user.
        await sut.updateUsersV1([
          _createUser(id: 'user-1'),
          _createUser(id: 'user-partner'),
          _createUser(id: 'user-foreign'),
        ]);
        await sut.updateLibrariesV1([makeLibrary(id: 'library-1', ownerId: 'user-foreign')]);
      });

      test('preserves an asset owned by the current user', () async {
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'mine', checksum: 'c1', ownerId: 'user-1', libraryId: 'library-1'),
        ]);

        await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'library-1')], currentUserId: 'user-1');

        final rows = await db.remoteAssetEntity.select().get();
        expect(rows, hasLength(1));
        expect(rows.first.id, 'mine');
      });

      test('preserves an asset owned by an active partner', () async {
        await insertPartner(sharedById: 'user-partner', sharedWithId: 'user-1');
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'partner-asset', checksum: 'c2', ownerId: 'user-partner', libraryId: 'library-1'),
        ]);

        await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'library-1')], currentUserId: 'user-1');

        final rows = await db.remoteAssetEntity.select().get();
        expect(rows, hasLength(1));
        expect(rows.first.id, 'partner-asset');
      });

      test('preserves an asset also present in shared_space_asset', () async {
        await sut.updateSharedSpacesV1([
          SyncSharedSpaceV1(
            id: 'space-1',
            name: 'Space',
            description: null,
            color: null,
            createdById: 'user-1',
            thumbnailAssetId: null,
            thumbnailCropY: null,
            faceRecognitionEnabled: true,
            petsEnabled: false,
            lastActivityAt: null,
            createdAt: DateTime(2026, 4, 6),
            updatedAt: DateTime(2026, 4, 6),
          ),
        ]);
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'direct-add', checksum: 'c3', ownerId: 'user-foreign', libraryId: 'library-1'),
        ]);
        await sut.updateSharedSpaceToAssetsV1([SyncSharedSpaceToAssetV1(spaceId: 'space-1', assetId: 'direct-add')]);

        await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'library-1')], currentUserId: 'user-1');

        final rows = await db.remoteAssetEntity.select().get();
        expect(rows, hasLength(1));
        expect(rows.first.id, 'direct-add');
      });

      test('deletes a foreign asset reachable only via the now-deleted library', () async {
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'orphan', checksum: 'c4', ownerId: 'user-foreign', libraryId: 'library-1'),
        ]);

        await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'library-1')], currentUserId: 'user-1');

        final rows = await db.remoteAssetEntity.select().get();
        expect(rows, isEmpty);
        final libraryRows = await db.libraryEntity.select().get();
        expect(libraryRows, isEmpty);
      });

      test('happy path: library delete and orphan sweep both succeed in a single call', () async {
        // Pre-seed assets that should survive a successful sweep.
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'mine', checksum: 'c5', ownerId: 'user-1', libraryId: 'library-1'),
          makeLibraryAsset(id: 'orphan', checksum: 'c6', ownerId: 'user-foreign', libraryId: 'library-1'),
        ]);

        await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'library-1')], currentUserId: 'user-1');

        // Library removed, orphan removed, user-owned preserved.
        expect(await db.libraryEntity.select().get(), isEmpty);
        final remaining = await db.remoteAssetEntity.select().get();
        expect(remaining.map((r) => r.id), ['mine']);
      });

      test('atomicity: a failure inside the transaction rolls back the libraryEntity delete', () async {
        // Verifies that Drift's _db.transaction() rollback semantics hold for
        // the shape used by deleteLibrariesV1. We can't easily inject a failure
        // INTO the production handler (the customStatement is hard-coded), so
        // this test exercises the same transaction shape directly via the
        // db handle and confirms rollback behaviour. If Drift's transaction
        // primitive ever loses rollback semantics, this test catches it before
        // the production sweep silently splits into separate operations.
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'mine', checksum: 'cAtom', ownerId: 'user-1', libraryId: 'library-1'),
        ]);
        expect(await db.libraryEntity.select().get(), hasLength(1));
        expect(await db.remoteAssetEntity.select().get(), hasLength(1));

        Object? thrownError;
        try {
          await db.transaction(() async {
            // Delete the library row — same statement deleteLibrariesV1 runs.
            await db.libraryEntity.deleteWhere((row) => row.id.equals('library-1'));
            // Force a failure mid-transaction. Drift must roll back the prior
            // deleteWhere along with this customStatement.
            await db.customStatement('SELECT * FROM definitely_not_a_real_table');
          });
        } catch (e) {
          thrownError = e;
        }

        expect(thrownError, isNotNull, reason: 'transaction body should have thrown');
        // Both the library row and the asset must still exist — the
        // deleteWhere was rolled back along with the failing customStatement.
        expect(await db.libraryEntity.select().get(), hasLength(1));
        expect(await db.remoteAssetEntity.select().get(), hasLength(1));
      });

      test('large-batch: chunks the sweep across the SQLite parameter limit (>500 libraries)', () async {
        // SQLite's SQLITE_MAX_VARIABLE_NUMBER is typically 999. The sweep
        // customStatement binds libraryIds.length + 2 parameters per call.
        // The repository chunks at 500 so a 600-library batch hits the chunk
        // boundary and runs as multiple statements inside the same transaction.
        // This test verifies the chunking works AND that all 600 libraries +
        // their orphan assets are still removed atomically (a failure mid-loop
        // would roll back ALL preceding chunks).
        //
        // The setUp() block already inserted library-1; we delete that one
        // along with our 600 batch entries to land on a clean zero-row state.
        const int batchSize = 600;
        final libraryIds = List.generate(batchSize, (i) => 'lib-$i');

        await sut.updateLibrariesV1(libraryIds.map((id) => makeLibrary(id: id, ownerId: 'user-foreign')));
        // Insert 600 orphan assets, one per library.
        await sut.updateLibraryAssetsV1(
          List.generate(
            batchSize,
            (i) => makeLibraryAsset(
              id: 'orphan-$i',
              checksum: 'cBig$i',
              ownerId: 'user-foreign',
              libraryId: libraryIds[i],
            ),
          ),
        );
        // setUp inserted library-1 (601 total) but no asset for it.
        expect(await db.libraryEntity.select().get(), hasLength(batchSize + 1));
        expect(await db.remoteAssetEntity.select().get(), hasLength(batchSize));

        await sut.deleteLibrariesV1([
          SyncLibraryDeleteV1(libraryId: 'library-1'),
          ...libraryIds.map((id) => SyncLibraryDeleteV1(libraryId: id)),
        ], currentUserId: 'user-1');

        // All 601 library rows and all 600 orphan assets gone.
        expect(await db.libraryEntity.select().get(), isEmpty);
        expect(await db.remoteAssetEntity.select().get(), isEmpty);
      });

      test('multi-library: deletes all 3 library rows and sweeps their orphan assets in one call', () async {
        // Verifies the placeholder expansion in the customStatement works for
        // N > 1 libraryIds. Single-library is the common case but
        // syncLibrariesV1 may dispatch multiple deletes per batch.
        await sut.updateLibrariesV1([
          makeLibrary(id: 'library-1', ownerId: 'user-foreign'),
          makeLibrary(id: 'library-2', ownerId: 'user-foreign'),
          makeLibrary(id: 'library-3', ownerId: 'user-foreign'),
        ]);
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'mine', checksum: 'cM1', ownerId: 'user-1', libraryId: 'library-1'),
          makeLibraryAsset(id: 'orphan-1', checksum: 'cO1', ownerId: 'user-foreign', libraryId: 'library-1'),
          makeLibraryAsset(id: 'orphan-2', checksum: 'cO2', ownerId: 'user-foreign', libraryId: 'library-2'),
          makeLibraryAsset(id: 'orphan-3', checksum: 'cO3', ownerId: 'user-foreign', libraryId: 'library-3'),
        ]);

        await sut.deleteLibrariesV1([
          SyncLibraryDeleteV1(libraryId: 'library-1'),
          SyncLibraryDeleteV1(libraryId: 'library-2'),
          SyncLibraryDeleteV1(libraryId: 'library-3'),
        ], currentUserId: 'user-1');

        // All 3 library rows removed in the same transaction.
        expect(await db.libraryEntity.select().get(), isEmpty);
        // The 3 foreign-owned orphans are swept; user-owned 'mine' is preserved.
        final remaining = await db.remoteAssetEntity.select().get();
        expect(remaining.map((r) => r.id).toList(), ['mine']);
      });

      test('LibraryDeleteV1 for an unknown library is a no-op', () async {
        await sut.updateLibraryAssetsV1([
          makeLibraryAsset(id: 'mine', checksum: 'c7', ownerId: 'user-1', libraryId: 'library-1'),
        ]);

        await sut.deleteLibrariesV1([
          SyncLibraryDeleteV1(libraryId: 'library-does-not-exist'),
        ], currentUserId: 'user-1');

        // library-1 is untouched because the delete targeted a different id.
        expect(await db.libraryEntity.select().get(), hasLength(1));
        expect(await db.remoteAssetEntity.select().get(), hasLength(1));
      });
    });

    test('SharedSpaceLibraryV1 arriving before LibraryV1 still inserts the join row', () async {
      // The SharedSpaceLibrary entity intentionally has no FK on libraryId —
      // this mirrors SharedSpaceAssetEntity's lenient assetId, letting the
      // sync stream tolerate out-of-order delivery between the library and
      // shared-space-library streams.
      await sut.updateUsersV1([_createUser()]);
      await sut.updateSharedSpacesV1([
        SyncSharedSpaceV1(
          id: 'space-1',
          name: 'Space',
          description: null,
          color: null,
          createdById: 'user-1',
          thumbnailAssetId: null,
          thumbnailCropY: null,
          faceRecognitionEnabled: true,
          petsEnabled: false,
          lastActivityAt: null,
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);

      await sut.updateSharedSpaceLibrariesV1([
        SyncSharedSpaceLibraryV1(
          spaceId: 'space-1',
          libraryId: 'not-yet-synced-library',
          addedById: 'user-1',
          createdAt: DateTime(2026, 4, 6),
          updatedAt: DateTime(2026, 4, 6),
        ),
      ]);

      final rows = await db.sharedSpaceLibraryEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.libraryId, 'not-yet-synced-library');
    });

    test('SharedSpaceLibraryV1 arriving before SharedSpaceV1 is rejected by the hard FK on spaceId', () async {
      // Asymmetry lock-in: libraryId on sharedSpaceLibraryEntity is loose
      // (no FK — see the test above), but spaceId has a HARD cascade FK.
      // The sync ordering contract is: SharedSpaceV1 must land BEFORE any
      // join rows for that space. This test asserts the contract is
      // enforced — if you relax the FK, the top-level sync dispatcher must
      // be able to guarantee strict ordering, or this test will catch it.
      await sut.updateUsersV1([_createUser()]);

      await expectLater(
        sut.updateSharedSpaceLibrariesV1([
          SyncSharedSpaceLibraryV1(
            spaceId: 'not-yet-synced-space',
            libraryId: 'also-not-yet-synced',
            addedById: 'user-1',
            createdAt: DateTime(2026, 4, 6),
            updatedAt: DateTime(2026, 4, 6),
          ),
        ]),
        throwsA(anything),
      );
      expect(await db.sharedSpaceLibraryEntity.select().get(), isEmpty);
    });

    test('LibraryV1 with an unknown ownerId throws a foreign key violation', () async {
      // library_entity has a HARD FK on owner_id (no tolerance for missing
      // parent rows). This test locks in that design — if you ever relax
      // the FK, update this assertion. The contract is: the server is
      // expected to stream the owner user row BEFORE the library row.
      await sut.updateUsersV1([_createUser()]);

      await expectLater(sut.updateLibrariesV1([makeLibrary(ownerId: 'user-does-not-exist')]), throwsA(anything));
      // Library table untouched.
      expect(await db.libraryEntity.select().get(), isEmpty);
    });

    group('deleteLibrariesV1 chunk boundary tests', () {
      // _kSweepChunkSize = 500 in the production handler. Off-by-one bugs in
      // the slicing loop would slip past the single 600-library test above,
      // so we stress the exact boundaries (N-1, N, N+1) at both 500 and 1000.
      setUp(() async {
        // Both users must exist before any library/asset inserts.
        // user-1 = current user (preserved), user-foreign = orphan owner (swept).
        await sut.updateUsersV1([_createUser(id: 'user-1'), _createUser(id: 'user-foreign')]);
      });

      Future<void> seedAndDelete(int count) async {
        final libraryIds = List.generate(count, (i) => 'boundary-lib-$i');
        await sut.updateLibrariesV1(libraryIds.map((id) => makeLibrary(id: id, ownerId: 'user-foreign')));
        // Each library has exactly one foreign-owned orphan asset.
        await sut.updateLibraryAssetsV1(
          List.generate(
            count,
            (i) => makeLibraryAsset(
              id: 'orphan-$i',
              checksum: 'cBound$i',
              ownerId: 'user-foreign',
              libraryId: libraryIds[i],
            ),
          ),
        );

        await sut.deleteLibrariesV1(
          libraryIds.map((id) => SyncLibraryDeleteV1(libraryId: id)),
          currentUserId: 'user-1',
        );

        // Full cleanup: libraries gone, orphan assets swept.
        expect(await db.libraryEntity.select().get(), isEmpty);
        expect(await db.remoteAssetEntity.select().get(), isEmpty);
      }

      test('N=499 libraries (1 under chunk boundary) deletes all in single chunk', () async {
        await seedAndDelete(499);
      });

      test('N=500 libraries (exact chunk boundary) deletes all', () async {
        await seedAndDelete(500);
      });

      test('N=501 libraries (1 over chunk boundary, needs 2 chunks) deletes all', () async {
        await seedAndDelete(501);
      });

      test('N=999 libraries (1 under 2x boundary) deletes all', () async {
        await seedAndDelete(999);
      });

      test('N=1000 libraries (exact 2x boundary) deletes all', () async {
        await seedAndDelete(1000);
      });

      test('N=1001 libraries (1 over 2x boundary, needs 3 chunks) deletes all', () async {
        await seedAndDelete(1001);
      });
    });

    test('deleteLibrariesV1 with empty list is a no-op (does not open a transaction)', () async {
      // An empty LibraryDeleteV1 batch should not crash, not open a
      // transaction, and not touch any rows. The handler can receive empty
      // batches when the server has nothing to delete but still sends an
      // end-of-stream frame.
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary(id: 'library-1', ownerId: 'user-1')]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'keep-me', checksum: 'cEmpty', ownerId: 'user-1', libraryId: 'library-1'),
      ]);

      await sut.deleteLibrariesV1(const <SyncLibraryDeleteV1>[], currentUserId: 'user-1');

      expect(await db.libraryEntity.select().get(), hasLength(1));
      expect(await db.remoteAssetEntity.select().get(), hasLength(1));
    });

    test('deleteLibrariesV1 on a library with zero assets still removes the library row', () async {
      // Library has no asset rows at all. The delete must succeed (not
      // throw on the "no orphans to sweep" case) and the library_entity
      // row must be gone.
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([makeLibrary(id: 'empty-lib', ownerId: 'user-1')]);
      expect(await db.libraryEntity.select().get(), hasLength(1));

      await sut.deleteLibrariesV1([SyncLibraryDeleteV1(libraryId: 'empty-lib')], currentUserId: 'user-1');

      expect(await db.libraryEntity.select().get(), isEmpty);
      expect(await db.remoteAssetEntity.select().get(), isEmpty);
    });

    test('updateLibraryAssetsV1 with asset.libraryId change moves the asset between libraries', () async {
      // Asset lives in libA, then the server streams an UPSERT with the
      // same id but libraryId = libB. The remote_asset_entity row should
      // reflect libB — not duplicate, not revert.
      await sut.updateUsersV1([_createUser()]);
      await sut.updateLibrariesV1([
        makeLibrary(id: 'libA', ownerId: 'user-1'),
        makeLibrary(id: 'libB', ownerId: 'user-1'),
      ]);
      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'mover', checksum: 'cMove', ownerId: 'user-1', libraryId: 'libA'),
      ]);

      await sut.updateLibraryAssetsV1([
        makeLibraryAsset(id: 'mover', checksum: 'cMove', ownerId: 'user-1', libraryId: 'libB'),
      ]);

      final rows = await db.remoteAssetEntity.select().get();
      expect(rows, hasLength(1));
      expect(rows.first.libraryId, 'libB');
    });
  });

  test('stores rule memories from sync without requiring year data', () async {
    await sut.updateUsersV1([_createUser()]);

    await sut.updateMemoriesV1([
      SyncMemoryV1(
        createdAt: DateTime(2026, 4, 23),
        data: {
          'ruleId': 'birthday',
          'title': 'Happy birthday, Alice',
          'subtitle': 'Photos from different years',
        },
        deletedAt: null,
        hideAt: DateTime(2026, 4, 23, 23, 59),
        id: 'memory-rule-1',
        isSaved: false,
        memoryAt: DateTime(2026, 4, 23),
        ownerId: 'user-1',
        seenAt: null,
        showAt: DateTime(2026, 4, 23),
        type: MemoryType.rule,
        updatedAt: DateTime(2026, 4, 23),
      ),
    ]);

    final query = db.memoryEntity.select()..where((tbl) => tbl.id.equals('memory-rule-1'));
    final row = await query.getSingle();

    expect(row.type, MemoryTypeEnum.rule);
    expect(row.data, contains('"title":"Happy birthday, Alice"'));
  });
}
