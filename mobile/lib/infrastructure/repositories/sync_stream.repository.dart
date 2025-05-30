import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' hide AssetVisibility;

class DriftSyncStreamRepository extends DriftDatabaseRepository
    implements ISyncStreamRepository {
  final Logger _logger = Logger('DriftSyncStreamRepository');
  final Drift _db;

  DriftSyncStreamRepository(super.db) : _db = db;

  @override
  Future<void> deleteUsersV1(Iterable<SyncUserDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final user in data) {
          batch.delete(
            _db.userEntity,
            UserEntityCompanion(id: Value(user.userId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error while processing SyncUserDeleteV1', error, stack);
      rethrow;
    }
  }

  @override
  Future<void> updateUsersV1(Iterable<SyncUserV1> data) async {
    try {
      await _db.batch((batch) {
        for (final user in data) {
          final companion = UserEntityCompanion(
            name: Value(user.name),
            email: Value(user.email),
          );

          batch.insert(
            _db.userEntity,
            companion.copyWith(id: Value(user.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error while processing SyncUserV1', error, stack);
      rethrow;
    }
  }

  @override
  Future<void> deletePartnerV1(Iterable<SyncPartnerDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final partner in data) {
          batch.delete(
            _db.partnerEntity,
            PartnerEntityCompanion(
              sharedById: Value(partner.sharedById),
              sharedWithId: Value(partner.sharedWithId),
            ),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing SyncPartnerDeleteV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> updatePartnerV1(Iterable<SyncPartnerV1> data) async {
    try {
      await _db.batch((batch) {
        for (final partner in data) {
          final companion =
              PartnerEntityCompanion(inTimeline: Value(partner.inTimeline));

          batch.insert(
            _db.partnerEntity,
            companion.copyWith(
              sharedById: Value(partner.sharedById),
              sharedWithId: Value(partner.sharedWithId),
            ),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing SyncPartnerV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> deleteAssetsV1(Iterable<SyncAssetDeleteV1> data) async {
    try {
      await _deleteAssetsV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing deleteAssetsV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> updateAssetsV1(Iterable<SyncAssetV1> data) async {
    try {
      await _updateAssetsV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing updateAssetsV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> deletePartnerAssetsV1(Iterable<SyncAssetDeleteV1> data) async {
    try {
      await _deleteAssetsV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing deletePartnerAssetsV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> updatePartnerAssetsV1(Iterable<SyncAssetV1> data) async {
    try {
      await _updateAssetsV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing updatePartnerAssetsV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> updateAssetsExifV1(Iterable<SyncAssetExifV1> data) async {
    try {
      await _updateAssetExifV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing updateAssetsExifV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> updatePartnerAssetsExifV1(Iterable<SyncAssetExifV1> data) async {
    try {
      await _updateAssetExifV1(data);
    } catch (e, s) {
      _logger.severe('Error while processing updatePartnerAssetsExifV1', e, s);
      rethrow;
    }
  }

  Future<void> _updateAssetsV1(Iterable<SyncAssetV1> data) =>
      _db.batch((batch) {
        for (final asset in data) {
          final companion = RemoteAssetEntityCompanion(
            name: Value(asset.originalFileName),
            type: Value(asset.type.toAssetType()),
            createdAt: Value.absentIfNull(asset.fileCreatedAt),
            updatedAt: Value.absentIfNull(asset.fileModifiedAt),
            durationInSeconds: const Value(0),
            checksum: Value(asset.checksum),
            isFavorite: Value(asset.isFavorite),
            ownerId: Value(asset.ownerId),
            localDateTime: Value(asset.localDateTime),
            thumbHash: Value(asset.thumbhash),
            deletedAt: Value(asset.deletedAt),
            visibility: Value(asset.visibility.toAssetVisibility()),
          );

          batch.insert(
            _db.remoteAssetEntity,
            companion.copyWith(id: Value(asset.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });

  Future<void> _deleteAssetsV1(Iterable<SyncAssetDeleteV1> assets) =>
      _db.batch((batch) {
        for (final asset in assets) {
          batch.delete(
            _db.remoteAssetEntity,
            RemoteAssetEntityCompanion(id: Value(asset.assetId)),
          );
          // We do not cascade delete exif data since it also has local exif data
          // so remove it manually when the asset is deleted
          batch.delete(
            _db.exifEntity,
            ExifEntityCompanion(assetId: Value(asset.assetId)),
          );
        }
      });

  Future<void> _updateAssetExifV1(Iterable<SyncAssetExifV1> data) =>
      _db.batch((batch) {
        for (final exif in data) {
          final companion = ExifEntityCompanion(
            city: Value(exif.city),
            state: Value(exif.state),
            country: Value(exif.country),
            dateTimeOriginal: Value(exif.dateTimeOriginal),
            description: Value(exif.description),
            height: Value(exif.exifImageHeight),
            width: Value(exif.exifImageWidth),
            exposureTime: Value(exif.exposureTime),
            fNumber: Value(exif.fNumber),
            fileSize: Value(exif.fileSizeInByte),
            focalLength: Value(exif.focalLength),
            latitude: Value(exif.latitude),
            longitude: Value(exif.longitude),
            iso: Value(exif.iso),
            make: Value(exif.make),
            model: Value(exif.model),
            orientation: Value(exif.orientation),
            timeZone: Value(exif.timeZone),
            rating: Value(exif.rating),
            projectionType: Value(exif.projectionType),
          );

          batch.insert(
            _db.exifEntity,
            companion.copyWith(assetId: Value(exif.assetId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
}

extension on SyncAssetV1TypeEnum {
  AssetType toAssetType() => switch (this) {
        SyncAssetV1TypeEnum.IMAGE => AssetType.image,
        SyncAssetV1TypeEnum.VIDEO => AssetType.video,
        SyncAssetV1TypeEnum.AUDIO => AssetType.audio,
        SyncAssetV1TypeEnum.OTHER => AssetType.other,
        _ => throw Exception('Unknown SyncAssetV1TypeEnum value: $this'),
      };
}

extension on SyncAssetV1VisibilityEnum {
  AssetVisibility toAssetVisibility() => switch (this) {
        SyncAssetV1VisibilityEnum.timeline => AssetVisibility.timeline,
        SyncAssetV1VisibilityEnum.hidden => AssetVisibility.hidden,
        SyncAssetV1VisibilityEnum.archive => AssetVisibility.archive,
        SyncAssetV1VisibilityEnum.locked => AssetVisibility.locked,
        _ => throw Exception('Unknown SyncAssetV1VisibilityEnum value: $this'),
      };
}
