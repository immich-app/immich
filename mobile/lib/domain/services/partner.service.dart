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

  Future<List<PartnerUserDto>> getSharedWith(String userId) {
    return _driftPartnerRepository.getSharedWith(userId);
  }

  Future<List<PartnerUserDto>> getSharedBy(String userId) {
    return _driftPartnerRepository.getSharedBy(userId);
  }

  Future<List<PartnerUserDto>> getAvailablePartners(
    String currentUserId,
  ) async {
    final otherUsers = await _driftPartnerRepository.getAvailablePartners(currentUserId);
    final currentPartners = await _driftPartnerRepository.getSharedBy(currentUserId);
    final available = otherUsers.where((user) {
      return !currentPartners.any((partner) => partner.id == user.id);
    }).toList();

    return available;
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

  Future<void> addPartner(String partnerId, String userId) async {
    await _partnerApiRepository.create(partnerId);
    await _driftPartnerRepository.create(partnerId, userId);
  }

  Future<void> removePartner(String partnerId, String userId) async {
    await _partnerApiRepository.delete(partnerId);
    await _driftPartnerRepository.delete(partnerId, userId);
  }
}
