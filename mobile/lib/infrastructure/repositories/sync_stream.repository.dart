import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album_user.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
// import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' hide AssetVisibility, AssetOrder, AlbumUserRole;

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

  @override
  Future<void> updateAlbumsV1(Iterable<SyncAlbumV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumEntityCompanion(
            name: Value(album.name),
            description: Value(album.description),
            ownerId: Value(album.ownerId),
            thumbnailAssetId: Value(album.thumbnailAssetId),
            createdAt: Value(album.createdAt),
            updatedAt: Value(album.updatedAt),
            isActivityEnabled: Value(album.isActivityEnabled),
            order: Value(album.order.toAssetOrder()),
          );

          batch.insert(
            _db.remoteAlbumEntity,
            companion.copyWith(id: Value(album.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing updateAlbumsV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> deleteAlbumsV1(Iterable<SyncAlbumDeleteV1> data) async {
    try {
      _db.batch((batch) {
        for (final album in data) {
          batch.delete(
            _db.remoteAlbumEntity,
            RemoteAlbumEntityCompanion(id: Value(album.albumId)),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing deleteAlbumsV1', e, s);
      rethrow;
    }
  }

  // @override
  // Future<void> updateAlbumAssetsV1(Iterable<SyncAlbumAssetV1> data) async {
  //   try {
  //     await _db.remoteAlbumAssetEntity.insertAll(
  //       data.map(
  //         (albumAsset) => RemoteAlbumAssetEntityCompanion.insert(
  //           albumId: albumAsset.albumId,
  //           assetId: albumAsset.assetId,
  //         ),
  //       ),
  //       mode: InsertMode.insertOrIgnore,
  //     );
  //   } catch (e, s) {
  //     _logger.severe('Error while processing updateAlbumAssetsV1', e, s);
  //     rethrow;
  //   }
  // }

  // @override
  // Future<void> deleteAlbumAssetsV1(Iterable<SyncAlbumAssetDeleteV1> data) async {
  //   try {
  //     await _db.batch((batch) {
  //       for (final albumAsset in data) {
  //         batch.delete(
  //           _db.remoteAlbumAssetEntity,
  //           RemoteAlbumAssetEntityCompanion(
  //             albumId: Value(albumAsset.albumId),
  //             assetId: Value(albumAsset.assetId),
  //           ),
  //         );
  //       }
  //     });
  //   } catch (e, s) {
  //     _logger.severe('Error while processing deleteAlbumAssetsV1', e, s);
  //     rethrow;
  //   }
  // }

  @override
  Future<void> updateAlbumUsersV1(Iterable<SyncAlbumUserV1> data) async {
    try {
      await _db.batch((batch) {
        for (final albumUser in data) {
          final companion =
              AlbumUserEntityCompanion(role: Value(albumUser.role.toAlbumUserRole()));

          batch.insert(
            _db.albumUserEntity,
            companion.copyWith(albumId: Value(albumUser.albumId), userId: Value(albumUser.userId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing updateAlbumUsersV1', e, s);
      rethrow;
    }
  }

  @override
  Future<void> deleteAlbumUsersV1(Iterable<SyncAlbumUserDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final albumUser in data) {
          batch.delete(
            _db.albumUserEntity,
            AlbumUserEntityCompanion(
              albumId: Value(albumUser.albumId),
              userId: Value(albumUser.userId),
            ),
          );
        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing deleteAlbumUsersV1', e, s);
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
            assetStorage: const Value(ExifAssetStorage.remote),
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

extension on SyncAlbumV1OrderEnum {
  AssetOrder toAssetOrder() => switch (this) {
        SyncAlbumV1OrderEnum.asc => AssetOrder.asc,
        SyncAlbumV1OrderEnum.desc => AssetOrder.desc,
        _ => throw Exception('Unknown SyncAlbumV1OrderEnum value: $this'),
      };
}

extension on SyncAlbumUserV1RoleEnum {
  AlbumUserRole toAlbumUserRole() => switch (this) {
        SyncAlbumUserV1RoleEnum.editor => AlbumUserRole.editor,
        SyncAlbumUserV1RoleEnum.viewer => AlbumUserRole.viewer,
        _ => throw Exception('Unknown SyncAlbumUserV1RoleEnum value: $this'),
      };
}
