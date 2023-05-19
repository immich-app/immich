import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:openapi/api.dart';

final partnerServiceProvider = Provider(
  (ref) => PartnerService(
    ref.watch(apiServiceProvider).partnerApi,
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
  final PartnerApi _api;

  PartnerService(this._api);

  Future<List<User>> getPartners(PartnerDirection direction) async {
    try {
      final userDtos = await _api.getPartners(direction._value);
      if (userDtos != null) {
        return userDtos.map((u) => User.fromDto(u)).toList();
      }
    } catch (e) {
      debugPrint("");
    }
    return [];
  }

  Future<bool> removePartner(User partner) async {
    try {
      await _api.removePartner(partner.id);
    } catch (e) {
      return false;
    }
    return true;
  }

  Future<bool> addPartner(User partner) async {
    try {
      return null != await _api.createPartner(partner.id);
    } catch (e) {
      return false;
    }
  }
}
