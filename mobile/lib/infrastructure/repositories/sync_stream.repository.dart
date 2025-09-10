import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' as api show AssetVisibility, AlbumUserRole, UserMetadataKey;
import 'package:openapi/api.dart' hide AssetVisibility, AlbumUserRole, UserMetadataKey;

class SyncStreamRepository extends DriftDatabaseRepository {
  final Logger _logger = Logger('DriftSyncStreamRepository');
  final Drift _db;

  SyncStreamRepository(super.db) : _db = db;

  Future<void> reset() async {
    _logger.fine("SyncResetV1 received. Resetting remote entities");
    try {
      await _db.exclusively(() async {
        // foreign_keys PRAGMA is no-op within transactions
        // https://www.sqlite.org/pragma.html#pragma_foreign_keys
        await _db.customStatement('PRAGMA foreign_keys = OFF');
        await transaction(() async {
          await _db.assetFaceEntity.deleteAll();
          await _db.memoryAssetEntity.deleteAll();
          await _db.memoryEntity.deleteAll();
          await _db.partnerEntity.deleteAll();
          await _db.personEntity.deleteAll();
          await _db.remoteAlbumAssetEntity.deleteAll();
          await _db.remoteAlbumEntity.deleteAll();
          await _db.remoteAlbumUserEntity.deleteAll();
          await _db.remoteAssetEntity.deleteAll();
          await _db.remoteExifEntity.deleteAll();
          await _db.stackEntity.deleteAll();
          await _db.userEntity.deleteAll();
          await _db.userMetadataEntity.deleteAll();
        });
        await _db.customStatement('PRAGMA foreign_keys = ON');
      });
    } catch (error, stack) {
      _logger.severe('Error: SyncResetV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAuthUsersV1(Iterable<SyncAuthUserV1> data) async {
    try {
      await _db.batch((batch) {
        for (final user in data) {
          final companion = AuthUserEntityCompanion(
            name: Value(user.name),
            email: Value(user.email),
            hasProfileImage: Value(user.hasProfileImage),
            profileChangedAt: Value(user.profileChangedAt),
            avatarColor: Value(user.avatarColor?.toAvatarColor() ?? AvatarColor.primary),
            isAdmin: Value(user.isAdmin),
            pinCode: Value(user.pinCode),
            quotaSizeInBytes: Value(user.quotaSizeInBytes ?? 0),
            quotaUsageInBytes: Value(user.quotaUsageInBytes),
          );

          batch.insert(
            _db.authUserEntity,
            companion.copyWith(id: Value(user.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: SyncAuthUserV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteUsersV1(Iterable<SyncUserDeleteV1> data) async {
    try {
      await _db.userEntity.deleteWhere((row) => row.id.isIn(data.map((e) => e.userId)));
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
            hasProfileImage: Value(user.hasProfileImage),
            profileChangedAt: Value(user.profileChangedAt),
            avatarColor: Value(user.avatarColor?.toAvatarColor() ?? AvatarColor.primary),
          );

          batch.insert(_db.userEntity, companion.copyWith(id: Value(user.id)), onConflict: DoUpdate((_) => companion));
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
            PartnerEntityCompanion(sharedById: Value(partner.sharedById), sharedWithId: Value(partner.sharedWithId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: SyncPartnerDeleteV1', error, stack);
      rethrow;
    }
  }

  Future<void> updatePartnerV1(Iterable<SyncPartnerV1> data) async {
    try {
      await _db.batch((batch) {
        for (final partner in data) {
          final companion = PartnerEntityCompanion(inTimeline: Value(partner.inTimeline));

          batch.insert(
            _db.partnerEntity,
            companion.copyWith(sharedById: Value(partner.sharedById), sharedWithId: Value(partner.sharedWithId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: SyncPartnerV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAssetsV1(Iterable<SyncAssetDeleteV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.remoteAssetEntity.deleteWhere((row) => row.id.isIn(data.map((e) => e.assetId)));
    } catch (error, stack) {
      _logger.severe('Error: deleteAssetsV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> updateAssetsV1(Iterable<SyncAssetV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          final companion = RemoteAssetEntityCompanion(
            name: Value(asset.originalFileName),
            type: Value(asset.type.toAssetType()),
            createdAt: Value.absentIfNull(asset.fileCreatedAt),
            updatedAt: Value.absentIfNull(asset.fileModifiedAt),
            durationInSeconds: Value(asset.duration?.toDuration()?.inSeconds ?? 0),
            checksum: Value(asset.checksum),
            isFavorite: Value(asset.isFavorite),
            ownerId: Value(asset.ownerId),
            localDateTime: Value(asset.localDateTime),
            thumbHash: Value(asset.thumbhash),
            deletedAt: Value(asset.deletedAt),
            visibility: Value(asset.visibility.toAssetVisibility()),
            livePhotoVideoId: Value(asset.livePhotoVideoId),
            stackId: Value(asset.stackId),
            libraryId: Value(asset.libraryId),
          );

          batch.insert(
            _db.remoteAssetEntity,
            companion.copyWith(id: Value(asset.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetsV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> updateAssetsExifV1(Iterable<SyncAssetExifV1> data, {String debugLabel = 'user'}) async {
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
    } catch (error, stack) {
      _logger.severe('Error: updateAssetsExifV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAlbumsV1(Iterable<SyncAlbumDeleteV1> data) async {
    try {
      await _db.remoteAlbumEntity.deleteWhere((row) => row.id.isIn(data.map((e) => e.albumId)));
    } catch (error, stack) {
      _logger.severe('Error: deleteAlbumsV1', error, stack);
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
    } catch (error, stack) {
      _logger.severe('Error: updateAlbumsV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAlbumUsersV1(Iterable<SyncAlbumUserDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          batch.delete(
            _db.remoteAlbumUserEntity,
            RemoteAlbumUserEntityCompanion(albumId: Value(album.albumId), userId: Value(album.userId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteAlbumUsersV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAlbumUsersV1(Iterable<SyncAlbumUserV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumUserEntityCompanion(role: Value(album.role.toAlbumUserRole()));

          batch.insert(
            _db.remoteAlbumUserEntity,
            companion.copyWith(albumId: Value(album.albumId), userId: Value(album.userId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAlbumUsersV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAlbumToAssetsV1(Iterable<SyncAlbumToAssetDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          batch.delete(
            _db.remoteAlbumAssetEntity,
            RemoteAlbumAssetEntityCompanion(albumId: Value(album.albumId), assetId: Value(album.assetId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteAlbumToAssetsV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAlbumToAssetsV1(Iterable<SyncAlbumToAssetV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          final companion = RemoteAlbumAssetEntityCompanion(
            albumId: Value(album.albumId),
            assetId: Value(album.assetId),
          );

          batch.insert(_db.remoteAlbumAssetEntity, companion, onConflict: DoNothing());
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAlbumToAssetsV1 - $debugLabel', error, stack);
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
    } catch (error, stack) {
      _logger.severe('Error: updateMemoriesV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteMemoriesV1(Iterable<SyncMemoryDeleteV1> data) async {
    try {
      await _db.memoryEntity.deleteWhere((row) => row.id.isIn(data.map((e) => e.memoryId)));
    } catch (error, stack) {
      _logger.severe('Error: deleteMemoriesV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateMemoryAssetsV1(Iterable<SyncMemoryAssetV1> data) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          final companion = MemoryAssetEntityCompanion(memoryId: Value(asset.memoryId), assetId: Value(asset.assetId));

          batch.insert(_db.memoryAssetEntity, companion, onConflict: DoNothing());
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateMemoryAssetsV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteMemoryAssetsV1(Iterable<SyncMemoryAssetDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          batch.delete(
            _db.memoryAssetEntity,
            MemoryAssetEntityCompanion(memoryId: Value(asset.memoryId), assetId: Value(asset.assetId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteMemoryAssetsV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateStacksV1(Iterable<SyncStackV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final stack in data) {
          final companion = StackEntityCompanion(
            createdAt: Value(stack.createdAt),
            updatedAt: Value(stack.updatedAt),
            ownerId: Value(stack.ownerId),
            primaryAssetId: Value(stack.primaryAssetId),
          );

          batch.insert(
            _db.stackEntity,
            companion.copyWith(id: Value(stack.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateStacksV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteStacksV1(Iterable<SyncStackDeleteV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.stackEntity.deleteWhere((row) => row.id.isIn(data.map((e) => e.stackId)));
    } catch (error, stack) {
      _logger.severe('Error: deleteStacksV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> updateUserMetadatasV1(Iterable<SyncUserMetadataV1> data) async {
    try {
      await _db.batch((batch) {
        for (final userMetadata in data) {
          final companion = UserMetadataEntityCompanion(value: Value(userMetadata.value as Map<String, Object?>));

          batch.insert(
            _db.userMetadataEntity,
            companion.copyWith(userId: Value(userMetadata.userId), key: Value(userMetadata.key.toUserMetadataKey())),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteUserMetadatasV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteUserMetadatasV1(Iterable<SyncUserMetadataDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final userMetadata in data) {
          batch.delete(
            _db.userMetadataEntity,
            UserMetadataEntityCompanion(
              userId: Value(userMetadata.userId),
              key: Value(userMetadata.key.toUserMetadataKey()),
            ),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteUserMetadatasV1', error, stack);
      rethrow;
    }
  }

  Future<void> updatePeopleV1(Iterable<SyncPersonV1> data) async {
    try {
      await _db.batch((batch) {
        for (final person in data) {
          final companion = PersonEntityCompanion(
            createdAt: Value(person.createdAt),
            updatedAt: Value(person.updatedAt),
            ownerId: Value(person.ownerId),
            name: Value(person.name),
            faceAssetId: Value(person.faceAssetId),
            isFavorite: Value(person.isFavorite),
            isHidden: Value(person.isHidden),
            color: Value(person.color),
            birthDate: Value(person.birthDate),
          );

          batch.insert(
            _db.personEntity,
            companion.copyWith(id: Value(person.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updatePeopleV1', error, stack);
      rethrow;
    }
  }

  Future<void> deletePeopleV1(Iterable<SyncPersonDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final person in data) {
          batch.deleteWhere(_db.personEntity, (row) => row.id.equals(person.personId));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deletePeopleV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAssetFacesV1(Iterable<SyncAssetFaceV1> data) async {
    try {
      await _db.batch((batch) {
        for (final assetFace in data) {
          final companion = AssetFaceEntityCompanion(
            assetId: Value(assetFace.assetId),
            personId: Value(assetFace.personId),
            imageWidth: Value(assetFace.imageWidth),
            imageHeight: Value(assetFace.imageHeight),
            boundingBoxX1: Value(assetFace.boundingBoxX1),
            boundingBoxY1: Value(assetFace.boundingBoxY1),
            boundingBoxX2: Value(assetFace.boundingBoxX2),
            boundingBoxY2: Value(assetFace.boundingBoxY2),
            sourceType: Value(assetFace.sourceType),
          );

          batch.insert(
            _db.assetFaceEntity,
            companion.copyWith(id: Value(assetFace.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetFacesV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAssetFacesV1(Iterable<SyncAssetFaceDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final assetFace in data) {
          batch.deleteWhere(_db.assetFaceEntity, (row) => row.id.equals(assetFace.assetFaceId));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteAssetFacesV1', error, stack);
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

extension on api.UserMetadataKey {
  UserMetadataKey toUserMetadataKey() => switch (this) {
    api.UserMetadataKey.onboarding => UserMetadataKey.onboarding,
    api.UserMetadataKey.preferences => UserMetadataKey.preferences,
    api.UserMetadataKey.license => UserMetadataKey.license,
    _ => throw Exception('Unknown UserMetadataKey value: $this'),
  };
}

extension on String {
  Duration? toDuration() {
    try {
      final parts = split(':').map((e) => double.parse(e).toInt()).toList(growable: false);

      return Duration(hours: parts[0], minutes: parts[1], seconds: parts[2]);
    } catch (_) {
      return null;
    }
  }
}

extension on UserAvatarColor {
  AvatarColor? toAvatarColor() => AvatarColor.values.firstWhereOrNull((c) => c.name == value);
}
