import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/user/partner.drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/mapper.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.drift.dart';

@DriftAccessor()
class PartnerRepository extends DatabaseAccessor<Drift> with $PartnerRepositoryMixin {
  PartnerRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<Partner> get({required String sharedById, required String sharedWithId}) =>
      (_db.select(_db.partnerEntity).join([
            innerJoin(_db.userEntity, _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById)),
          ])..where(
            _db.partnerEntity.sharedById.equals(sharedById) & _db.partnerEntity.sharedWithId.equals(sharedWithId),
          ))
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

  Future<void> create({required String sharedById, required String sharedWithId, bool inTimeline = false}) =>
      _db.partnerEntity.insertOnConflictUpdate(
        PartnerEntityCompanion(
          sharedById: Value(sharedById),
          sharedWithId: Value(sharedWithId),
          inTimeline: Value(inTimeline),
        ),
      );

  Future<void> updatePartner({required String sharedById, required String sharedWithId, required bool inTimeline}) =>
      (_db.partnerEntity.update()..where((t) => t.sharedById.equals(sharedById) & t.sharedWithId.equals(sharedWithId)))
          .write(PartnerEntityCompanion(inTimeline: Value(inTimeline)));

  Future<void> deletePartner({required String sharedById, required String sharedWithId}) =>
      (_db.partnerEntity.delete()..where((t) => t.sharedById.equals(sharedById) & t.sharedWithId.equals(sharedWithId)))
          .go();

  Partner _resultToPartner(TypedResult result) {
    final user = result.readTable(_db.userEntity);
    final partner = result.readTable(_db.partnerEntity);
    return mapToPartner(user, partner);
  }
}
