import 'dart:typed_data';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/interfaces/user_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final userApiRepositoryProvider = Provider(
  (ref) => UserApiRepository(
    ref.watch(apiServiceProvider).usersApi,
  ),
);

class UserApiRepository extends ApiRepository implements IUserApiRepository {
  final UsersApi _api;

  UserApiRepository(this._api);

  @override
  Future<List<User>> getAll() async {
    final dto = await checkNull(_api.searchUsers());
    return dto.map(UserConverter.fromSimpleUserDto).toList();
  }

  @override
  Future<({String profileImagePath})> createProfileImage({
    required String name,
    required Uint8List data,
  }) async {
    final response = await checkNull(
      _api.createProfileImage(
        MultipartFile.fromBytes('file', data, filename: name),
      ),
    );
    return (profileImagePath: response.profileImagePath);
  }
}
