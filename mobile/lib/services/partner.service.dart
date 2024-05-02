import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final partnerServiceProvider = Provider(
  (ref) => PartnerService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
  ),
);

enum PartnerDirection {
  sharedWith("shared-with"),
  sharedBy("shared-by");

  const PartnerDirection(
    this._value,
  );

  final String _value;
}

class PartnerService {
  final ApiService _apiService;
  final Isar _db;
  final Logger _log = Logger("PartnerService");

  PartnerService(this._apiService, this._db);

  Future<List<User>?> getPartners(PartnerDirection direction) async {
    try {
      final userDtos =
          await _apiService.partnerApi.getPartners(direction._value);
      if (userDtos != null) {
        return userDtos.map((u) => User.fromPartnerDto(u)).toList();
      }
    } catch (e) {
      _log.warning("Failed to get partners for direction $direction", e);
    }
    return null;
  }

  Future<bool> removePartner(User partner) async {
    try {
      await _apiService.partnerApi.removePartner(partner.id);
      partner.isPartnerSharedBy = false;
      await _db.writeTxn(() => _db.users.put(partner));
    } catch (e) {
      _log.warning("Failed to remove partner ${partner.id}", e);
      return false;
    }
    return true;
  }

  Future<bool> addPartner(User partner) async {
    try {
      final dto = await _apiService.partnerApi.createPartner(partner.id);
      if (dto != null) {
        partner.isPartnerSharedBy = true;
        await _db.writeTxn(() => _db.users.put(partner));
        return true;
      }
    } catch (e) {
      _log.warning("Failed to add partner ${partner.id}", e);
    }
    return false;
  }

  Future<bool> updatePartner(User partner, {required bool inTimeline}) async {
    try {
      final dto = await _apiService.partnerApi
          .updatePartner(partner.id, UpdatePartnerDto(inTimeline: inTimeline));
      if (dto != null) {
        partner.inTimeline = dto.inTimeline ?? partner.inTimeline;
        await _db.writeTxn(() => _db.users.put(partner));
        return true;
      }
    } catch (e) {
      _log.warning("Failed to update partner ${partner.id}", e);
    }
    return false;
  }
}
