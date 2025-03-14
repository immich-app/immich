import 'package:immich_mobile/domain/models/user.model.dart';

abstract class IPartnerRepository {
  Future<List<UserDto>> getSharedWith();
  Future<List<UserDto>> getSharedBy();
  Stream<List<UserDto>> watchSharedWith();
  Stream<List<UserDto>> watchSharedBy();
}
