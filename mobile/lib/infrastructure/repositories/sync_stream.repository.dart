import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class DriftSyncStreamRepository extends DriftDatabaseRepository
    implements ISyncStreamRepository {
  final Logger _logger = Logger('DriftSyncStreamRepository');
  final Drift _db;

  DriftSyncStreamRepository(super.db) : _db = db;

  @override
  Future<bool> deleteUsersV1(Iterable<SyncUserDeleteV1> data) async {
    try {
      await _db.batch((batch) {
        for (final user in data) {
          batch.delete(
            _db.userEntity,
            UserEntityCompanion(id: Value(user.userId.toUuidByte())),
          );
        }
      });
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncUserDeleteV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> updateUsersV1(Iterable<SyncUserV1> data) async {
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
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncUserV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> deletePartnerV1(Iterable<SyncPartnerDeleteV1> data) async {
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
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncPartnerDeleteV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> updatePartnerV1(Iterable<SyncPartnerV1> data) async {
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
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncPartnerV1', e, s);
      return false;
    }
  }
}
