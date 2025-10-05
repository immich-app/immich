import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

enum Direction { sharedWithMe, sharedByMe }

final partnerApiRepositoryProvider = Provider((ref) => PartnerApiRepository(ref.watch(apiServiceProvider).partnersApi));

class PartnerApiRepository extends ApiRepository {
  final PartnersApi _api;

  PartnerApiRepository(this._api);

  Future<List<UserDto>> getAll(Direction direction) async {
    final response = await checkNull(
      _api.getPartners(direction == Direction.sharedByMe ? PartnerDirection.by : PartnerDirection.with_),
    );
    return response.map(UserConverter.fromPartnerDto).toList();
  }

  Future<UserDto> create(String id) async {
    final dto = await checkNull(_api.createPartnerDeprecated(id));
    return UserConverter.fromPartnerDto(dto);
  }

  Future<void> delete(String id) => _api.removePartner(id);

  Future<UserDto> update(String id, {required bool inTimeline}) async {
    final dto = await checkNull(_api.updatePartner(id, PartnerUpdateDto(inTimeline: inTimeline)));
    return UserConverter.fromPartnerDto(dto);
  }
}
