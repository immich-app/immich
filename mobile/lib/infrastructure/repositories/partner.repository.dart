import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/partner.entity.drift.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';

class DriftPartnerRepository extends DriftDatabaseRepository {
  final Drift _db;
  const DriftPartnerRepository(this._db) : super(_db);

  Future<List<PartnerUserDto>> getPartners(String userId) {
    final query = _db.select(_db.partnerEntity).join([
      innerJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById),
      ),
    ])
      ..where(
        _db.partnerEntity.sharedWithId.equals(userId),
      );

    return query.map((row) {
      final user = row.readTable(_db.userEntity);
      final partner = row.readTable(_db.partnerEntity);
      return PartnerUserDto(
        id: user.id,
        email: user.email,
        name: user.name,
        inTimeline: partner.inTimeline,
      );
    }).get();
  }

  Future<PartnerUserDto?> getPartner(String partnerId, String userId) {
    final query = _db.select(_db.partnerEntity).join([
      innerJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById),
      ),
    ])
      ..where(
        _db.partnerEntity.sharedById.equals(partnerId) &
            _db.partnerEntity.sharedWithId.equals(userId),
      );

    return query.map((row) {
      final user = row.readTable(_db.userEntity);
      final partner = row.readTable(_db.partnerEntity);
      return PartnerUserDto(
        id: user.id,
        email: user.email,
        name: user.name,
        inTimeline: partner.inTimeline,
      );
    }).getSingleOrNull();
  }

  Future<bool> toggleShowInTimeline(PartnerUserDto partner, String userId) {
    return _db.partnerEntity.update().replace(
          PartnerEntityCompanion(
            sharedById: Value(partner.id),
            sharedWithId: Value(userId),
            inTimeline: Value(!partner.inTimeline),
          ),
        );
  }
}
