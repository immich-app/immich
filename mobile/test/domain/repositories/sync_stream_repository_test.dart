import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
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
}
