import 'dart:typed_data';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/user_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/base_api.repository.dart';
import 'package:openapi/api.dart';

final userApiRepositoryProvider = Provider(
  (ref) => UserApiRepository(
    ref.watch(apiServiceProvider).usersApi,
    ref.watch(apiServiceProvider).partnersApi,
  ),
);

class UserApiRepository extends BaseApiRepository
    implements IUserApiRepository {
  final UsersApi _api;
  final PartnersApi _partnerApi;

  UserApiRepository(this._api, this._partnerApi);

  @override
  Future<List<User>> getAll() async {
    final dto = await checkNull(_api.searchUsers());
    return dto.map(User.fromSimpleUserDto).toList();
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

  @override
  Future<List<User>> getPartners(Direction direction) async {
    final response = await checkNull(
      _partnerApi.getPartners(
        direction == Direction.sharedByMe
            ? PartnerDirection.by
            : PartnerDirection.with_,
      ),
    );
    return response.map(User.fromPartnerDto).toList();
  }

  @override
  Future<User> addPartner(String id) async {
    final dto = await checkNull(_partnerApi.createPartner(id));
    return User.fromPartnerDto(dto);
  }

  @override
  Future<void> removePartner(String id) =>
      checkNull(_partnerApi.removePartner(id));

  @override
  Future<User> updatePartner(String id, {required bool inTimeline}) async {
    final dto = await checkNull(
      _partnerApi.updatePartner(
        id,
        UpdatePartnerDto(inTimeline: inTimeline),
      ),
    );
    return User.fromPartnerDto(dto);
  }
}
