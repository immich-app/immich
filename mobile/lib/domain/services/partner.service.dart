import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';

class DriftPartnerService {
  final DriftPartnerRepository _driftPartnerRepository;
  final PartnerApiRepository _partnerApiRepository;

  const DriftPartnerService(
    this._driftPartnerRepository,
    this._partnerApiRepository,
  );

  Future<List<PartnerUserDto>> getPartners(String userId) {
    return _driftPartnerRepository.getPartners(userId);
  }

  Future<void> toggleShowInTimeline(String partnerId, String userId) async {
    final partner = await _driftPartnerRepository.getPartner(partnerId, userId);
    if (partner == null) {
      debugPrint("Partner not found: $partnerId for user: $userId");
      return;
    }

    await _partnerApiRepository.update(
      partnerId,
      inTimeline: !partner.inTimeline,
    );

    await _driftPartnerRepository.toggleShowInTimeline(partner, userId);
  }
}
