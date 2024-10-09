import 'dart:typed_data';

import 'package:immich_mobile/entities/user.entity.dart';

abstract interface class IUserApiRepository {
  Future<List<User>> getAll();
  Future<({String profileImagePath})> createProfileImage({
    required String name,
    required Uint8List data,
  });
}
