import 'dart:typed_data';

import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IUserApiRepository {
  Future<List<User>> getAll();
  Future<({String profileImagePath})> createProfileImage({
    required String name,
    required Uint8List data,
  });
  Future<List<User>> getPartners(Direction direction);
  Future<void> removePartner(String id);
  Future<User> addPartner(String id);
  Future<User> updatePartner(String id, {required bool inTimeline});
}

enum Direction {
  sharedWithMe,
  sharedByMe,
}
