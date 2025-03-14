import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
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
  Future<bool> deleteUsersV1(SyncUserDeleteV1 data) async {
    try {
      await _db.managers.userEntity
          .filter((row) => row.id.equals(data.userId))
          .delete();
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncUserDeleteV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> updateUsersV1(SyncUserV1 data) async {
    final companion = UserEntityCompanion(
      name: Value(data.name),
      email: Value(data.email),
    );

    try {
      await _db.userEntity.insertOne(
        companion.copyWith(id: Value(data.id)),
        onConflict: DoUpdate((_) => companion),
      );
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncUserV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> deletePartnerV1(SyncPartnerDeleteV1 data) async {
    try {
      await _db.managers.partnerEntity
          .filter(
            (row) =>
                row.sharedById.id.equals(data.sharedById) &
                row.sharedWithId.id.equals(data.sharedWithId),
          )
          .delete();
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncPartnerDeleteV1', e, s);
      return false;
    }
  }

  @override
  Future<bool> updatePartnerV1(SyncPartnerV1 data) async {
    final companion =
        PartnerEntityCompanion(inTimeline: Value(data.inTimeline));

    try {
      await _db.partnerEntity.insertOne(
        companion.copyWith(
          sharedById: Value(data.sharedById),
          sharedWithId: Value(data.sharedWithId),
        ),
        onConflict: DoUpdate((_) => companion),
      );
      return true;
    } catch (e, s) {
      _logger.severe('Error while processing SyncUserV1', e, s);
      return false;
    }
  }
}
