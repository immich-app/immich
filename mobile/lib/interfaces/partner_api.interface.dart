import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IPartnerApiRepository {
  Future<List<User>> getAll(Direction direction);
  Future<User> create(String id);
  Future<User> update(String id, {required bool inTimeline});
  Future<void> delete(String id);
}

enum Direction {
  sharedWithMe,
  sharedByMe,
}
