import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:logging/logging.dart';

final partnerServiceProvider = Provider((ref) => PartnerService(ref.watch(partnerApiRepositoryProvider)));

class PartnerService {
  final PartnerApiRepository _partnerApiRepository;
  final Logger _log = Logger("PartnerService");

  PartnerService(this._partnerApiRepository);

  Future<bool> removePartner(UserDto partner) async {
    try {
      await _partnerApiRepository.delete(partner.id);
    } catch (e) {
      _log.warning("Failed to remove partner ${partner.id}", e);
      return false;
    }
    return true;
  }

  Future<bool> addPartner(UserDto partner) async {
    try {
      await _partnerApiRepository.create(partner.id);
      return true;
    } catch (e) {
      _log.warning("Failed to add partner ${partner.id}", e);
    }
    return false;
  }

  Future<bool> updatePartner(UserDto partner, {required bool inTimeline}) async {
    try {
      await _partnerApiRepository.update(partner.id, inTimeline: inTimeline);
      return true;
    } catch (e) {
      _log.warning("Failed to update partner ${partner.id}", e);
    }
    return false;
  }
}
