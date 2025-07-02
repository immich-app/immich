import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' as api show AssetVisibility, AlbumUserRole;
import 'package:openapi/api.dart' hide AssetVisibility, AlbumUserRole;

class SyncStreamRepository extends DriftDatabaseRepository {
  final Logger _logger = Logger('DriftSyncStreamRepository');
  final Drift _db;

  SyncStreamRepository(super.db) : _db = db;

  Future<void> deleteUsersV1(Iterable<SyncUserDeleteV1> data) async {
    try {
      await _db.userEntity
          .deleteWhere((row) => row.id.isIn(data.map((e) => e.userId)));
    } catch (error, stack) {
      _logger.severe('Error: SyncUserDeleteV1', error, stack);
      rethrow;
    }
  }

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
      _logger.severe('Error: SyncUserV1', error, stack);
      rethrow;
    }
  }

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
    } catch (error, stackTrace) {
      _logger.severe('Error: SyncPartnerDeleteV1', error, stackTrace);
      rethrow;
    }
  }

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
    } catch (error, stackTrace) {
      _logger.severe('Error: SyncPartnerV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> deleteAssetsV1(
    Iterable<SyncAssetDeleteV1> data, {
    String debugLabel = 'user',
  }) async {
    try {
      await _db.remoteAssetEntity.deleteWhere(
        (row) => row.id.isIn(data.map((error) => error.assetId)),
      );
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteAssetsV1 - $debugLabel', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateAssetsV1(
    Iterable<SyncAssetV1> data, {
    String debugLabel = 'user',
  }) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          final companion = RemoteAssetEntityCompanion(
            name: Value(asset.originalFileName),
            type: Value(asset.type.toAssetType()),
            createdAt: Value.absentIfNull(asset.fileCreatedAt),
            updatedAt: Value.absentIfNull(asset.fileModifiedAt),
            durationInSeconds:
                Value(asset.duration?.toDuration()?.inSeconds ?? 0),
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
    } catch (error, stackTrace) {
      _logger.severe('Error: updateAssetsV1 - $debugLabel', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateAssetsExifV1(
    Iterable<SyncAssetExifV1> data, {
    String debugLabel = 'user',
  }) async {
    try {
      await _db.batch((batch) {
        for (final exif in data) {
          final companion = RemoteExifEntityCompanion(
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
            latitude: Value(exif.latitude?.toDouble()),
            longitude: Value(exif.longitude?.toDouble()),
            iso: Value(exif.iso),
            make: Value(exif.make),
            model: Value(exif.model),
            orientation: Value(exif.orientation),
            timeZone: Value(exif.timeZone),
            rating: Value(exif.rating),
            projectionType: Value(exif.projectionType),
            lens: Value(exif.lensModel),
          );

          batch.insert(
            _db.remoteExifEntity,
            companion.copyWith(assetId: Value(exif.assetId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe(
        'Error: updateAssetsExifV1 - $debugLabel',
        error,
        stackTrace,
      );
      rethrow;
    }
  }

  Future<void> deleteAlbumsV1(Iterable<SyncAlbumDeleteV1> data) async {
    try {
      await _db.remoteAlbumEntity.deleteWhere(
        (row) => row.id.isIn(data.map((e) => e.albumId)),
      );
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteAlbumsV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateAlbumsV1(Iterable<SyncAlbumV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumEntityCompanion(
            name: Value(album.name),
            description: Value(album.description),
            isActivityEnabled: Value(album.isActivityEnabled),
            order: Value(album.order.toAlbumAssetOrder()),
            thumbnailAssetId: Value(album.thumbnailAssetId),
            ownerId: Value(album.ownerId),
            createdAt: Value(album.createdAt),
            updatedAt: Value(album.updatedAt),
          );

          batch.insert(
            _db.remoteAlbumEntity,
            companion.copyWith(id: Value(album.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: updateAlbumsV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> deleteAlbumUsersV1(Iterable<SyncAlbumUserDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          batch.delete(
            _db.remoteAlbumUserEntity,
            RemoteAlbumUserEntityCompanion(
              albumId: Value(album.albumId),
              userId: Value(album.userId),
            ),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteAlbumUsersV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateAlbumUsersV1(
    Iterable<SyncAlbumUserV1> data, {
    String debugLabel = 'user',
  }) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumUserEntityCompanion(
            role: Value(album.role.toAlbumUserRole()),
          );

          batch.insert(
            _db.remoteAlbumUserEntity,
            companion.copyWith(
              albumId: Value(album.albumId),
              userId: Value(album.userId),
            ),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe(
        'Error: updateAlbumUsersV1 - $debugLabel',
        error,
        stackTrace,
      );
      rethrow;
    }
  }

  Future<void> deleteAlbumToAssetsV1(
    Iterable<SyncAlbumToAssetDeleteV1> data,
  ) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          batch.delete(
            _db.remoteAlbumAssetEntity,
            RemoteAlbumAssetEntityCompanion(
              albumId: Value(album.albumId),
              assetId: Value(album.assetId),
            ),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteAlbumToAssetsV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateAlbumToAssetsV1(
    Iterable<SyncAlbumToAssetV1> data, {
    String debugLabel = 'user',
  }) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumAssetEntityCompanion(
            albumId: Value(album.albumId),
            assetId: Value(album.assetId),
          );

          batch.insert(
            _db.remoteAlbumAssetEntity,
            companion,
            onConflict: DoNothing(),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe(
        'Error: updateAlbumToAssetsV1 - $debugLabel',
        error,
        stackTrace,
      );
      rethrow;
    }
  }

  Future<void> updateMemoriesV1(Iterable<SyncMemoryV1> data) async {
    try {
      await _db.batch((batch) {
        for (final memory in data) {
          final companion = MemoryEntityCompanion(
            createdAt: Value(memory.createdAt),
            deletedAt: Value(memory.deletedAt),
            ownerId: Value(memory.ownerId),
            type: Value(memory.type.toMemoryType()),
            data: Value(jsonEncode(memory.data)),
            isSaved: Value(memory.isSaved),
            memoryAt: Value(memory.memoryAt),
            seenAt: Value.absentIfNull(memory.seenAt),
            showAt: Value.absentIfNull(memory.showAt),
            hideAt: Value.absentIfNull(memory.hideAt),
          );

          batch.insert(
            _db.memoryEntity,
            companion.copyWith(id: Value(memory.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: updateMemoriesV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> deleteMemoriesV1(Iterable<SyncMemoryDeleteV1> data) async {
    try {
      await _db.memoryEntity.deleteWhere(
        (row) => row.id.isIn(data.map((e) => e.memoryId)),
      );
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteMemoriesV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> updateMemoryAssetsV1(Iterable<SyncMemoryAssetV1> data) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          final companion = MemoryAssetEntityCompanion(
            memoryId: Value(asset.memoryId),
            assetId: Value(asset.assetId),
          );

          batch.insert(
            _db.memoryAssetEntity,
            companion,
            onConflict: DoNothing(),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: updateMemoryAssetsV1', error, stackTrace);
      rethrow;
    }
  }

  Future<void> deleteMemoryAssetsV1(
    Iterable<SyncMemoryAssetDeleteV1> data,
  ) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          batch.delete(
            _db.memoryAssetEntity,
            MemoryAssetEntityCompanion(
              memoryId: Value(asset.memoryId),
              assetId: Value(asset.assetId),
            ),
          );
        }
      });
    } catch (error, stackTrace) {
      _logger.severe('Error: deleteMemoryAssetsV1', error, stackTrace);
      rethrow;
    }
  }
}

extension on AssetTypeEnum {
  AssetType toAssetType() => switch (this) {
        AssetTypeEnum.IMAGE => AssetType.image,
        AssetTypeEnum.VIDEO => AssetType.video,
        AssetTypeEnum.AUDIO => AssetType.audio,
        AssetTypeEnum.OTHER => AssetType.other,
        _ => throw Exception('Unknown AssetType value: $this'),
      };
}

extension on AssetOrder {
  AlbumAssetOrder toAlbumAssetOrder() => switch (this) {
        AssetOrder.asc => AlbumAssetOrder.asc,
        AssetOrder.desc => AlbumAssetOrder.desc,
        _ => throw Exception('Unknown AssetOrder value: $this'),
      };
}

extension on MemoryType {
  MemoryTypeEnum toMemoryType() => switch (this) {
        MemoryType.onThisDay => MemoryTypeEnum.onThisDay,
        _ => throw Exception('Unknown MemoryType value: $this'),
      };
}

extension on api.AlbumUserRole {
  AlbumUserRole toAlbumUserRole() => switch (this) {
        api.AlbumUserRole.editor => AlbumUserRole.editor,
        api.AlbumUserRole.viewer => AlbumUserRole.viewer,
        _ => throw Exception('Unknown AlbumUserRole value: $this'),
      };
}

extension on api.AssetVisibility {
  AssetVisibility toAssetVisibility() => switch (this) {
        api.AssetVisibility.timeline => AssetVisibility.timeline,
        api.AssetVisibility.hidden => AssetVisibility.hidden,
        api.AssetVisibility.archive => AssetVisibility.archive,
        api.AssetVisibility.locked => AssetVisibility.locked,
        _ => throw Exception('Unknown AssetVisibility value: $this'),
      };
}

extension on String {
  Duration? toDuration() {
    try {
      final parts = split(':')
          .map((error) => double.parse(error).toInt())
          .toList(growable: false);

      return Duration(hours: parts[0], minutes: parts[1], seconds: parts[2]);
    } catch (_) {
      return null;
    }
  }
}
