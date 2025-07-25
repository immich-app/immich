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

  // Get users who we can share our library with
  Future<List<PartnerUserDto>> getAvailablePartners(String currentUserId) {
    final query = _db.select(_db.userEntity)..where((row) => row.id.equals(currentUserId).not());

    return query.map((user) {
      return PartnerUserDto(
        id: user.id,
        email: user.email,
        name: user.name,
        inTimeline: false,
      );
    }).get();
  }

  // Get users who are sharing their photos WITH the current user
  Future<List<PartnerUserDto>> getSharedWith(String partnerId) {
    final query = _db.select(_db.partnerEntity).join([
      innerJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById),
      ),
    ])
      ..where(
        _db.partnerEntity.sharedWithId.equals(partnerId),
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

  // Get users who the current user is sharing their photos TO
  Future<List<PartnerUserDto>> getSharedBy(String userId) {
    final query = _db.select(_db.partnerEntity).join([
      innerJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.partnerEntity.sharedWithId),
      ),
    ])
      ..where(
        _db.partnerEntity.sharedById.equals(userId),
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

  Future<List<String>> getAllPartnerIds(String userId) async {
    // Get users who are sharing with me (sharedWithId = userId)
    final sharingWithMeQuery = _db.select(_db.partnerEntity)..where((tbl) => tbl.sharedWithId.equals(userId));
    final sharingWithMe = await sharingWithMeQuery.map((row) => row.sharedById).get();

    // Get users who I am sharing with (sharedById = userId)
    final sharingWithThemQuery = _db.select(_db.partnerEntity)..where((tbl) => tbl.sharedById.equals(userId));
    final sharingWithThem = await sharingWithThemQuery.map((row) => row.sharedWithId).get();

    // Combine both lists and remove duplicates
    final allPartnerIds = <String>{...sharingWithMe, ...sharingWithThem}.toList();
    return allPartnerIds;
  }

  Future<PartnerUserDto?> getPartner(String partnerId, String userId) {
    final query = _db.select(_db.partnerEntity).join([
      innerJoin(
        _db.userEntity,
        _db.userEntity.id.equalsExp(_db.partnerEntity.sharedById),
      ),
    ])
      ..where(
        _db.partnerEntity.sharedById.equals(partnerId) & _db.partnerEntity.sharedWithId.equals(userId),
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

  Future<int> create(String partnerId, String userId) {
    final entity = PartnerEntityCompanion(
      sharedById: Value(userId),
      sharedWithId: Value(partnerId),
      inTimeline: const Value(false),
    );

    return _db.partnerEntity.insertOne(entity);
  }

  Future<void> delete(String partnerId, String userId) {
    return _db.partnerEntity.deleteWhere(
      (t) => t.sharedById.equals(userId) & t.sharedWithId.equals(partnerId),
    );
  }
}
