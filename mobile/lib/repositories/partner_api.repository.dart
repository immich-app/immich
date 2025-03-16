import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/user.converter.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final partnerApiRepositoryProvider = Provider(
  (ref) => PartnerApiRepository(
    ref.watch(apiServiceProvider).partnersApi,
  ),
);

class PartnerApiRepository extends ApiRepository
    implements IPartnerApiRepository {
  final PartnersApi _api;

  PartnerApiRepository(this._api);

  @override
  Future<List<UserDto>> getAll(Direction direction) async {
    final response = await checkNull(
      _api.getPartners(
        direction == Direction.sharedByMe
            ? PartnerDirection.by
            : PartnerDirection.with_,
      ),
    );
    return response.map(UserConverter.fromPartnerDto).toList();
  }

  @override
  Future<UserDto> create(String id) async {
    final dto = await checkNull(_api.createPartner(id));
    return UserConverter.fromPartnerDto(dto);
  }

  @override
  Future<void> delete(String id) => _api.removePartner(id);

  @override
  Future<UserDto> update(String id, {required bool inTimeline}) async {
    final dto = await checkNull(
      _api.updatePartner(
        id,
        UpdatePartnerDto(inTimeline: inTimeline),
      ),
    );
    return UserConverter.fromPartnerDto(dto);
  }
}
