import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

class PartnerNotifier extends Notifier<List<PartnerUserDto>> {
  late DriftPartnerService _driftUserService;

  @override
  List<PartnerUserDto> build() {
    _driftUserService = ref.read(driftUserService);
    return [];
  }

  Future<List<PartnerUserDto>> getPartners(String userId) async {
    final partners = await _driftUserService.getPartners(userId);
    state = partners;
    return partners;
  }

  Future<void> toggleShowInTimeline(String partnerId, String userId) {
    return _driftUserService.toggleShowInTimeline(partnerId, userId);
  }
}
