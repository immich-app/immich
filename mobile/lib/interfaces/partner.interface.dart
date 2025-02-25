import 'package:immich_mobile/entities/user.entity.dart';

abstract class IPartnerRepository {
  Future<List<User>> getSharedWith();
  Future<List<User>> getSharedBy();
  Stream<List<User>> watchSharedWith();
  Stream<List<User>> watchSharedBy();
}
