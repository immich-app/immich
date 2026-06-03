import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class PartnerRepository {
  final Drift _db;
  const PartnerRepository(this._db);

  Partner _resultToPartner(TypedResult result) {
    final user = result.readTable(_db.userEntity);
    final partner = result.readTable(_db.partnerEntity);
    return PartnerEntity.rowToPartner(user, partner);
  }

  Future<Partner> get(String partnerId, String userId) =>
      (_db.select(_db.partnerEntity).join([
            innerJoin(_db.userEntity, _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById)),
          ])..where(_db.partnerEntity.sharedById.equals(partnerId) & _db.partnerEntity.sharedWithId.equals(userId)))
          .map(_resultToPartner)
          .getSingle();

  Stream<Iterable<Partner>> search(String userId, PartnerDirection direction) =>
      (_db.select(_db.partnerEntity).join([
            innerJoin(
              _db.userEntity,
              _db.userEntity.id.equalsExp(switch (direction) {
                .sharedBy => _db.partnerEntity.sharedWithId,
                .sharedWith => _db.partnerEntity.sharedById,
              }),
            ),
          ])..where(
            switch (direction) {
                  .sharedBy => _db.partnerEntity.sharedById,
                  .sharedWith => _db.partnerEntity.sharedWithId,
                }.equals(userId) &
                _db.userEntity.id.equals(userId).not(),
          ))
          .map(_resultToPartner)
          .watch();

  Future<void> create(String partnerId, String userId) => _db.partnerEntity.insertOnConflictUpdate(
    PartnerEntityCompanion(sharedById: Value(userId), sharedWithId: Value(partnerId), inTimeline: const Value(false)),
  );

  Future<void> update(String partnerId, String userId, {required bool inTimeline}) =>
      (_db.partnerEntity.update()..where((t) => t.sharedById.equals(partnerId) & t.sharedWithId.equals(userId))).write(
        PartnerEntityCompanion(inTimeline: Value(inTimeline)),
      );

  Future<void> delete(String partnerId, String userId) =>
      (_db.partnerEntity.delete()..where((t) => t.sharedById.equals(userId) & t.sharedWithId.equals(partnerId))).go();
}
