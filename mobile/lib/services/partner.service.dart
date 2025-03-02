import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/partner.interface.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/repositories/partner.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:logging/logging.dart';

final partnerServiceProvider = Provider(
  (ref) => PartnerService(
    ref.watch(partnerApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(partnerRepositoryProvider),
  ),
);

class PartnerService {
  final IPartnerApiRepository _partnerApiRepository;
  final IPartnerRepository _partnerRepository;
  final IUserRepository _userRepository;
  final Logger _log = Logger("PartnerService");

  PartnerService(
    this._partnerApiRepository,
    this._userRepository,
    this._partnerRepository,
  );

  Future<List<User>> getSharedWith() async {
    return _partnerRepository.getSharedWith();
  }

  Future<List<User>> getSharedBy() async {
    return _partnerRepository.getSharedBy();
  }

  Stream<List<User>> watchSharedWith() {
    return _partnerRepository.watchSharedWith();
  }

  Stream<List<User>> watchSharedBy() {
    return _partnerRepository.watchSharedBy();
  }

  Future<bool> removePartner(User partner) async {
    try {
      await _partnerApiRepository.delete(partner.id);
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
      await _partnerApiRepository.create(partner.id);
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
      final dto = await _partnerApiRepository.update(
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
