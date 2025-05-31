import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/entities/exif.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_album.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/remote_asset.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart' hide AssetVisibility, AssetOrder;

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
            UserEntityCompanion(id: Value(user.userId.toUuidByte())),
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
            companion.copyWith(id: Value(user.id.toUuidByte())),
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
              sharedById: Value(partner.sharedById.toUuidByte()),
              sharedWithId: Value(partner.sharedWithId.toUuidByte()),
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
              sharedById: Value(partner.sharedById.toUuidByte()),
              sharedWithId: Value(partner.sharedWithId.toUuidByte()),
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

  // Assets
  @override
  Future<void> updateAssetsV1(Iterable<SyncAssetV1> data) async {
    debugPrint("updateAssetsV1 - ${data.length}");
  }

  @override
  Future<void> deleteAssetsV1(Iterable<SyncAssetDeleteV1> data) async {
    debugPrint("deleteAssetsV1 - ${data.length}");
  }

  // Partner Assets
  @override
  Future<void> updatePartnerAssetsV1(Iterable<SyncAssetV1> data) async {
    debugPrint("updatePartnerAssetsV1 - ${data.length}");
  }

  @override
  Future<void> deletePartnerAssetsV1(Iterable<SyncAssetDeleteV1> data) async {
    debugPrint("deletePartnerAssetsV1 - ${data.length}");
  }

  // EXIF
  @override
  Future<void> updateAssetsExifV1(Iterable<SyncAssetExifV1> data) async {
    debugPrint("updateAssetsExifV1 - ${data.length}");
  }

  @override
  Future<void> updatePartnerAssetsExifV1(Iterable<SyncAssetExifV1> data) async {
    debugPrint("updatePartnerAssetsExifV1 - ${data.length}");
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

  @override
  Future<void> updateAlbumUsersV1(Iterable<SyncAlbumUserV1> data) async {
    try {
      await _db.batch((batch) {
        for (final album in data) {

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

        }
      });
    } catch (e, s) {
      _logger.severe('Error while processing deleteAlbumUsersV1', e, s);
      rethrow;
    }
  }
}

extension on SyncAlbumV1OrderEnum {
  AssetOrder toAssetOrder() => switch (this) {
        SyncAlbumV1OrderEnum.asc => AssetOrder.asc,
        SyncAlbumV1OrderEnum.desc => AssetOrder.desc,
        _ => throw Exception('Unknown SyncAlbumV1OrderEnum value: $this'),
      };
}
