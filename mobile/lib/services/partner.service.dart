import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/interfaces/user_api.interface.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/repositories/user_api.repository.dart';
import 'package:logging/logging.dart';

final partnerServiceProvider = Provider(
  (ref) => PartnerService(
    ref.watch(userApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
  ),
);

class PartnerService {
  final IUserApiRepository _userApiRepository;
  final IUserRepository _userRepository;
  final Logger _log = Logger("PartnerService");

  PartnerService(
    this._userApiRepository,
    this._userRepository,
  );

  Future<bool> removePartner(User partner) async {
    try {
      await _userApiRepository.removePartner(partner.id);
      partner.isPartnerSharedBy = false;
      await _userRepository.update(partner);
    } catch (e) {
      _log.warning("Failed to remove partner ${partner.id}", e);
      return false;
    }
    return true;
  }

  Future<bool> addPartner(User partner) async {
    try {
      await _userApiRepository.addPartner(partner.id);
      partner.isPartnerSharedBy = true;
      await _userRepository.update(partner);
      return true;
    } catch (e) {
      _log.warning("Failed to add partner ${partner.id}", e);
    }
    return false;
  }

  Future<bool> updatePartner(User partner, {required bool inTimeline}) async {
    try {
      final dto = await _userApiRepository.updatePartner(
        partner.id,
        inTimeline: inTimeline,
      );
      partner.inTimeline = dto.inTimeline;
      await _userRepository.update(partner);
      return true;
    } catch (e) {
      _log.warning("Failed to update partner ${partner.id}", e);
    }
    return false;
  }
}
