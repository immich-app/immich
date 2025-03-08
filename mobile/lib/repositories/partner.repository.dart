import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart'
    as entity;
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
  Future<List<User>> getSharedBy() async {
    return (await db.users
            .filter()
            .isPartnerSharedByEqualTo(true)
            .sortById()
            .findAll())
        .map((u) => u.toDto())
        .toList();
  }

  @override
  Future<List<User>> getSharedWith() async {
    return (await db.users
            .filter()
            .isPartnerSharedWithEqualTo(true)
            .sortById()
            .findAll())
        .map((u) => u.toDto())
        .toList();
  }

  @override
  Stream<List<User>> watchSharedBy() {
    return (db.users.filter().isPartnerSharedByEqualTo(true).sortById().watch())
        .map((users) => users.map((u) => u.toDto()).toList());
  }

  @override
  Stream<List<User>> watchSharedWith() {
    return (db.users
            .filter()
            .isPartnerSharedWithEqualTo(true)
            .sortById()
            .watch())
        .map((users) => users.map((u) => u.toDto()).toList());
  }
}
