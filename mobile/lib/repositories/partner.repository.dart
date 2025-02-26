import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/partner.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:isar/isar.dart';

final partnerRepositoryProvider = Provider(
  (ref) => PartnerRepository(ref.watch(dbProvider)),
);

class PartnerRepository extends DatabaseRepository
    implements IPartnerRepository {
  PartnerRepository(super.db);

  @override
  Future<List<User>> getSharedBy() {
    return db.users
        .filter()
        .isPartnerSharedByEqualTo(true)
        .sortById()
        .findAll();
  }

  @override
  Future<List<User>> getSharedWith() {
    return db.users
        .filter()
        .isPartnerSharedWithEqualTo(true)
        .sortById()
        .findAll();
  }

  @override
  Stream<List<User>> watchSharedBy() {
    return db.users.filter().isPartnerSharedByEqualTo(true).sortById().watch();
  }

  @override
  Stream<List<User>> watchSharedWith() {
    return db.users
        .filter()
        .isPartnerSharedWithEqualTo(true)
        .sortById()
        .watch();
  }
}
