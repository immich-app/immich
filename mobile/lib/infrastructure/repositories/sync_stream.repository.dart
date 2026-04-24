import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/infrastructure/entities/asset_edit.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/asset_face.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/auth_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/library.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/memory_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/person.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album_user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset_cloud_id.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_library.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space_member.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/stack.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user_metadata.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/utils/exif.converter.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' as api show AssetVisibility, AlbumUserRole, UserMetadataKey, AssetEditAction;
import 'package:openapi/api.dart' hide AlbumUserRole, UserMetadataKey, AssetEditAction, AssetVisibility;

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
          await _db.authUserEntity.deleteAll();
          await _db.userEntity.deleteAll();
          await _db.userMetadataEntity.deleteAll();
          await _db.remoteAssetCloudIdEntity.deleteAll();
          await _db.assetEditEntity.deleteAll();
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
      await _db.batch((batch) {
        for (final user in data) {
          batch.deleteWhere(_db.userEntity, (row) => row.id.equals(user.userId));
        }
      });
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
      await _db.batch((batch) {
        for (final asset in data) {
          batch.deleteWhere(_db.remoteAssetEntity, (row) => row.id.equals(asset.assetId));
        }
      });
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
            width: Value(asset.width),
            height: Value(asset.height),
            isEdited: Value(asset.isEdited),
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
            width: Value(exif.exifImageWidth),
            height: Value(exif.exifImageHeight),
          );

          batch.insert(
            _db.remoteExifEntity,
            companion.copyWith(assetId: Value(exif.assetId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });

      await _db.batch((batch) {
        for (final exif in data) {
          int? width;
          int? height;

          if (ExifDtoConverter.isOrientationFlipped(exif.orientation)) {
            width = exif.exifImageHeight;
            height = exif.exifImageWidth;
          } else {
            width = exif.exifImageWidth;
            height = exif.exifImageHeight;
          }

          batch.update(
            _db.remoteAssetEntity,
            RemoteAssetEntityCompanion(width: Value(width), height: Value(height)),
            where: (row) => row.id.equals(exif.assetId) & row.width.isNull() & row.height.isNull(),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetsExifV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAssetsMetadataV1(Iterable<SyncAssetMetadataDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final metadata in data) {
          if (metadata.key == kMobileMetadataKey) {
            batch.deleteWhere(_db.remoteAssetCloudIdEntity, (row) => row.assetId.equals(metadata.assetId));
          }
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteAssetsMetadataV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAssetsMetadataV1(Iterable<SyncAssetMetadataV1> data) async {
    try {
      await _db.batch((batch) {
        for (final metadata in data) {
          if (metadata.key == kMobileMetadataKey) {
            final map = metadata.value as Map<String, Object?>;
            final companion = RemoteAssetCloudIdEntityCompanion(
              cloudId: Value(map['iCloudId']?.toString()),
              createdAt: Value(map['createdAt'] != null ? DateTime.parse(map['createdAt'] as String) : null),
              adjustmentTime: Value(
                map['adjustmentTime'] != null ? DateTime.parse(map['adjustmentTime'] as String) : null,
              ),
              latitude: Value(map['latitude'] != null ? (double.tryParse(map['latitude'] as String)) : null),
              longitude: Value(map['longitude'] != null ? (double.tryParse(map['longitude'] as String)) : null),
            );
            batch.insert(
              _db.remoteAssetCloudIdEntity,
              companion.copyWith(assetId: Value(metadata.assetId)),
              onConflict: DoUpdate((_) => companion),
            );
          }
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetsMetadataV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateAssetEditsV1(Iterable<SyncAssetEditV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final edit in data) {
          final companion = AssetEditEntityCompanion(
            id: Value(edit.id),
            assetId: Value(edit.assetId),
            action: Value(edit.action.toAssetEditAction()),
            parameters: Value(edit.parameters as Map<String, Object?>),
            sequence: Value(edit.sequence),
          );

          batch.insert(_db.assetEditEntity, companion, onConflict: DoUpdate((_) => companion));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetEditsV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> replaceAssetEditsV1(String assetId, Iterable<SyncAssetEditV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        batch.deleteWhere(_db.assetEditEntity, (row) => row.assetId.equals(assetId));

        for (final edit in data) {
          final companion = AssetEditEntityCompanion(
            id: Value(edit.id),
            assetId: Value(edit.assetId),
            action: Value(edit.action.toAssetEditAction()),
            parameters: Value(edit.parameters as Map<String, Object?>),
            sequence: Value(edit.sequence),
          );

          batch.insert(_db.assetEditEntity, companion);
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: replaceAssetEditsV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAssetEditsV1(Iterable<SyncAssetEditDeleteV1> data, {String debugLabel = 'user'}) async {
    try {
      await _db.batch((batch) {
        for (final edit in data) {
          batch.deleteWhere(_db.assetEditEntity, (row) => row.id.equals(edit.editId));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteAssetEditsV1 - $debugLabel', error, stack);
      rethrow;
    }
  }

  Future<void> deleteAlbumsV1(Iterable<SyncAlbumDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {
          batch.deleteWhere(_db.remoteAlbumEntity, (row) => row.id.equals(album.albumId));
        }
      });
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

  // --- gallery-fork: shared-space sync handlers ---

  Future<void> updateSharedSpacesV1(Iterable<SyncSharedSpaceV1> data) async {
    try {
      await _db.batch((batch) {
        for (final space in data) {
          final companion = SharedSpaceEntityCompanion(
            name: Value(space.name),
            description: Value(space.description),
            color: Value(space.color),
            createdById: Value(space.createdById),
            thumbnailAssetId: Value(space.thumbnailAssetId),
            thumbnailCropY: Value(space.thumbnailCropY?.toInt()),
            faceRecognitionEnabled: Value(space.faceRecognitionEnabled),
            petsEnabled: Value(space.petsEnabled),
            lastActivityAt: Value(space.lastActivityAt),
            createdAt: Value(space.createdAt),
            updatedAt: Value(space.updatedAt),
          );

          batch.insert(
            _db.sharedSpaceEntity,
            companion.copyWith(id: Value(space.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateSharedSpacesV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteSharedSpacesV1(Iterable<SyncSharedSpaceDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final space in data) {
          batch.deleteWhere(_db.sharedSpaceEntity, (row) => row.id.equals(space.spaceId));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteSharedSpacesV1', error, stack);
      rethrow;
    }
  }

  Future<void> updateSharedSpaceMembersV1(Iterable<SyncSharedSpaceMemberV1> data) async {
    try {
      await _db.batch((batch) {
        for (final member in data) {
          final companion = SharedSpaceMemberEntityCompanion(
            role: Value(member.role),
            joinedAt: Value(member.joinedAt),
            showInTimeline: Value(member.showInTimeline),
          );

          batch.insert(
            _db.sharedSpaceMemberEntity,
            companion.copyWith(spaceId: Value(member.spaceId), userId: Value(member.userId)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateSharedSpaceMembersV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteSharedSpaceMembersV1(Iterable<SyncSharedSpaceMemberDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final member in data) {
          batch.delete(
            _db.sharedSpaceMemberEntity,
            SharedSpaceMemberEntityCompanion(spaceId: Value(member.spaceId), userId: Value(member.userId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteSharedSpaceMembersV1', error, stack);
      rethrow;
    }
  }

  // SharedSpaceAssetCreate/Update/Backfill use the same SyncAssetV1 payload as
  // the regular asset stream. We delegate to updateAssetsV1 to upsert into
  // remote_asset, which is the source of truth for asset metadata.
  Future<void> updateSharedSpaceAssetsV1(Iterable<SyncAssetV1> data) =>
      updateAssetsV1(data, debugLabel: 'shared-space');

  // Same delegation for exif rows.
  Future<void> updateSharedSpaceAssetExifsV1(Iterable<SyncAssetExifV1> data) =>
      updateAssetsExifV1(data, debugLabel: 'shared-space');

  Future<void> updateSharedSpaceToAssetsV1(Iterable<SyncSharedSpaceToAssetV1> data) async {
    try {
      await _db.batch((batch) {
        for (final join in data) {
          final companion = SharedSpaceAssetEntityCompanion(spaceId: Value(join.spaceId), assetId: Value(join.assetId));

          batch.insert(_db.sharedSpaceAssetEntity, companion, onConflict: DoNothing());
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateSharedSpaceToAssetsV1', error, stack);
      rethrow;
    }
  }

  Future<void> deleteSharedSpaceToAssetsV1(Iterable<SyncSharedSpaceToAssetDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final join in data) {
          batch.delete(
            _db.sharedSpaceAssetEntity,
            SharedSpaceAssetEntityCompanion(spaceId: Value(join.spaceId), assetId: Value(join.assetId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteSharedSpaceToAssetsV1', error, stack);
      rethrow;
    }
  }

  // --- gallery-fork: library sync handlers ---

  Future<void> updateLibrariesV1(Iterable<SyncLibraryV1> data) async {
    try {
      await _db.batch((batch) {
        for (final library in data) {
          final companion = LibraryEntityCompanion(
            name: Value(library.name),
            ownerId: Value(library.ownerId),
            createdAt: Value(library.createdAt),
            updatedAt: Value(library.updatedAt),
          );

          batch.insert(
            _db.libraryEntity,
            companion.copyWith(id: Value(library.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateLibrariesV1', error, stack);
      rethrow;
    }
  }

  // The currentUserId parameter is passed in from the dispatch site rather
  // than read from Store inside the repository. This keeps SyncStreamRepository
  // decoupled from the global Store singleton (matches the rest of the file,
  // which stays free of auth-context dependencies) and makes the handler
  // trivially testable with an in-memory Drift database.
  // SQLite's default SQLITE_MAX_VARIABLE_NUMBER is 999. The sweep customStatement
  // uses libraryIds.length + 2 parameters (currentUserId is bound twice). At
  // 500 we leave generous headroom: 500 + 2 = 502 parameters per chunk, well
  // under the limit even on builds with a lower compile-time cap.
  static const int _kSweepChunkSize = 500;

  Future<void> deleteLibrariesV1(Iterable<SyncLibraryDeleteV1> data, {required String currentUserId}) async {
    final libraryIds = data.map((d) => d.libraryId).toList();
    if (libraryIds.isEmpty) return;

    try {
      await _db.transaction(() async {
        for (final libraryId in libraryIds) {
          await _db.libraryEntity.deleteWhere((row) => row.id.equals(libraryId));
        }

        // Sweep orphan library assets in chunks to stay under the SQLite
        // parameter limit. Preserves user-owned, partner-shared, and direct-add
        // (shared_space_asset) paths. Uses snake_case because Drift generates
        // snake_case table/column names from camelCase Dart identifiers — see
        // remote_asset.entity.dart for the `libraryId` column declaration that
        // becomes `library_id`. The chunks all run inside the same transaction
        // so the entire sweep is still atomic with the libraryEntity deletes.
        for (var offset = 0; offset < libraryIds.length; offset += _kSweepChunkSize) {
          final chunk = libraryIds.sublist(offset, (offset + _kSweepChunkSize).clamp(0, libraryIds.length));
          final placeholders = chunk.map((_) => '?').join(',');
          await _db.customStatement(
            '''
            DELETE FROM remote_asset_entity
            WHERE library_id IS NOT NULL
              AND library_id IN ($placeholders)
              AND owner_id != ?
              AND owner_id NOT IN (
                SELECT shared_by_id FROM partner_entity WHERE shared_with_id = ?
              )
              AND id NOT IN (SELECT asset_id FROM shared_space_asset_entity)
            ''',
            [...chunk, currentUserId, currentUserId],
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteLibrariesV1', error, stack);
      rethrow;
    }
  }

  // LibraryAssetCreate/Backfill use the same SyncAssetV1 payload as the regular
  // asset stream. We delegate to updateAssetsV1 to upsert into remote_asset,
  // which is the source of truth for asset metadata.
  Future<void> updateLibraryAssetsV1(Iterable<SyncAssetV1> data) => updateAssetsV1(data, debugLabel: 'library');

  // Per-asset deletes from the library asset stream. The server has already
  // scoped these to accessibleLibraries (see commit a6141764a) so we can
  // authoritatively remove the row without running the whole-library sweep.
  Future<void> deleteLibraryAssetsV1(Iterable<SyncLibraryAssetDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final asset in data) {
          batch.deleteWhere(_db.remoteAssetEntity, (row) => row.id.equals(asset.assetId));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteLibraryAssetsV1', error, stack);
      rethrow;
    }
  }

  // Same delegation pattern as updateSharedSpaceAssetExifsV1.
  Future<void> updateLibraryAssetExifsV1(Iterable<SyncAssetExifV1> data) =>
      updateAssetsExifV1(data, debugLabel: 'library');

  Future<void> updateSharedSpaceLibrariesV1(Iterable<SyncSharedSpaceLibraryV1> data) async {
    try {
      await _db.batch((batch) {
        for (final join in data) {
          final companion = SharedSpaceLibraryEntityCompanion(
            spaceId: Value(join.spaceId),
            libraryId: Value(join.libraryId),
            addedById: Value(join.addedById),
            createdAt: Value(join.createdAt),
          );

          batch.insert(_db.sharedSpaceLibraryEntity, companion, onConflict: DoUpdate((_) => companion));
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateSharedSpaceLibrariesV1', error, stack);
      rethrow;
    }
  }

  // Does NOT sweep assets — that's the job of deleteLibrariesV1's whole-library
  // cascade when the underlying library itself is deleted. Removing a join row
  // just means the timeline UNION query in timeline.repository.dart stops
  // including library-linked assets for this space.
  Future<void> deleteSharedSpaceLibrariesV1(Iterable<SyncSharedSpaceLibraryDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final join in data) {
          batch.delete(
            _db.sharedSpaceLibraryEntity,
            SharedSpaceLibraryEntityCompanion(spaceId: Value(join.spaceId), libraryId: Value(join.libraryId)),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: deleteSharedSpaceLibrariesV1', error, stack);
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
      await _db.batch((batch) {
        for (final memory in data) {
          batch.deleteWhere(_db.memoryEntity, (row) => row.id.equals(memory.memoryId));
        }
      });
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
      await _db.batch((batch) {
        for (final stack in data) {
          batch.deleteWhere(_db.stackEntity, (row) => row.id.equals(stack.stackId));
        }
      });
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

  Future<void> updateAssetFacesV2(Iterable<SyncAssetFaceV2> data) async {
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
            deletedAt: Value(assetFace.deletedAt),
            isVisible: Value(assetFace.isVisible),
          );

          batch.insert(
            _db.assetFaceEntity,
            companion.copyWith(id: Value(assetFace.id)),
            onConflict: DoUpdate((_) => companion),
          );
        }
      });
    } catch (error, stack) {
      _logger.severe('Error: updateAssetFacesV2', error, stack);
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

  Future<void> pruneAssets() async {
    try {
      await _db.transaction(() async {
        final authQuery = _db.authUserEntity.selectOnly()
          ..addColumns([_db.authUserEntity.id])
          ..limit(1);
        final currentUserId = await authQuery.map((row) => row.read(_db.authUserEntity.id)).getSingleOrNull();
        if (currentUserId == null) {
          _logger.warning('No authenticated user found during pruneAssets. Skipping asset pruning.');
          return;
        }

        final partnerQuery = _db.partnerEntity.selectOnly()
          ..addColumns([_db.partnerEntity.sharedById])
          ..where(_db.partnerEntity.sharedWithId.equals(currentUserId));
        final partnerIds = await partnerQuery.map((row) => row.read(_db.partnerEntity.sharedById)).get();

        final validUsers = {currentUserId, ...partnerIds.nonNulls};

        // Asset is not owned by the current user or any of their partners and is not part of any (shared) album
        // Likely a stale asset that was previously shared but has been removed
        await _db.remoteAssetEntity.deleteWhere((asset) {
          return asset.ownerId.isNotIn(validUsers) &
              asset.id.isNotInQuery(
                _db.remoteAlbumAssetEntity.selectOnly()..addColumns([_db.remoteAlbumAssetEntity.assetId]),
              );
        });
      });
    } catch (error, stack) {
      _logger.severe('Error: pruneAssets', error, stack);
      // We do not rethrow here as this is a client-only cleanup and should not affect the sync process
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
    MemoryType.rule => MemoryTypeEnum.rule,
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

extension on api.AssetEditAction {
  AssetEditAction toAssetEditAction() => switch (this) {
    api.AssetEditAction.crop => AssetEditAction.crop,
    api.AssetEditAction.rotate => AssetEditAction.rotate,
    api.AssetEditAction.mirror => AssetEditAction.mirror,
    _ => AssetEditAction.other,
  };
}
