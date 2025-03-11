import 'dart:typed_data';

import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserApiRepository {
  Future<List<UserDto>> getAll();
  Future<({String profileImagePath})> createProfileImage({
    required String name,
    required Uint8List data,
  });
}
