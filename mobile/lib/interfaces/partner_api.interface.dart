import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IPartnerApiRepository {
  Future<List<UserDto>> getAll(Direction direction);
  Future<UserDto> create(String id);
  Future<UserDto> update(String id, {required bool inTimeline});
  Future<void> delete(String id);
}

enum Direction {
  sharedWithMe,
  sharedByMe,
}
