import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:stream_transform/stream_transform.dart';

class PartnerService {
  final UserRepository _userRepository;
  final PartnerRepository _partnerRepository;
  final PartnerApiRepository _partnerApiRepository;

  const PartnerService(this._userRepository, this._partnerRepository, this._partnerApiRepository);

  Stream<Iterable<User>> getCandidates(String userId) {
    final userStream = _userRepository.getAll();
    final partnerStream = _partnerRepository.search(userId, .sharedBy);

    return userStream.combineLatest(partnerStream, (users, partners) {
      final partnersSet = partners.map((partner) => partner.id).toSet();
      return users.where((user) => user.id != userId && !partnersSet.contains(user.id));
    });
  }

  Stream<Iterable<Partner>> search(String userId, PartnerDirection direction) =>
      _partnerRepository.search(userId, direction);

  Future<void> update(String partnerId, String userId, {required bool inTimeline}) async {
    await _partnerApiRepository.update(partnerId, inTimeline: inTimeline);
    await _partnerRepository.update(partnerId, userId, inTimeline: inTimeline);
  }

  Future<void> create(String partnerId, String userId) async {
    await _partnerApiRepository.create(partnerId);
    await _partnerRepository.create(partnerId, userId);
  }

  Future<void> delete(String partnerId, String userId) async {
    await _partnerApiRepository.delete(partnerId);
    await _partnerRepository.delete(partnerId, userId);
  }
}
