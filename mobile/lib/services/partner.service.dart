import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/repositories/partner.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
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
  final PartnerRepository _partnerRepository;
  final IsarUserRepository _isarUserRepository;
  final Logger _log = Logger("PartnerService");

  PartnerService(
    this._partnerApiRepository,
    this._isarUserRepository,
    this._partnerRepository,
  );

  Future<List<UserDto>> getSharedWith() async {
    return _partnerRepository.getSharedWith();
  }

  Future<List<UserDto>> getSharedBy() async {
    return _partnerRepository.getSharedBy();
  }

  Stream<List<UserDto>> watchSharedWith() {
    return _partnerRepository.watchSharedWith();
  }

  Stream<List<UserDto>> watchSharedBy() {
    return _partnerRepository.watchSharedBy();
  }

  Future<bool> removePartner(UserDto partner) async {
    try {
      await _partnerApiRepository.delete(partner.id);
      await _isarUserRepository
          .update(partner.copyWith(isPartnerSharedBy: false));
    } catch (e) {
      _log.warning("Failed to remove partner ${partner.id}", e);
      return false;
    }
    return true;
  }

  Future<bool> addPartner(UserDto partner) async {
    try {
      await _partnerApiRepository.create(partner.id);
      await _isarUserRepository
          .update(partner.copyWith(isPartnerSharedBy: true));
      return true;
    } catch (e) {
      _log.warning("Failed to add partner ${partner.id}", e);
    }
    return false;
  }

  Future<bool> updatePartner(
    UserDto partner, {
    required bool inTimeline,
  }) async {
    try {
      final dto = await _partnerApiRepository.update(
        partner.id,
        inTimeline: inTimeline,
      );
      await _isarUserRepository
          .update(partner.copyWith(inTimeline: dto.inTimeline));
      return true;
    } catch (e) {
      _log.warning("Failed to update partner ${partner.id}", e);
    }
    return false;
  }
}
