import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/album/suggested_shared_users.provider.dart';
import 'package:immich_mobile/services/partner.service.dart';

class PartnerSharedWithNotifier extends StateNotifier<List<UserDto>> {
  final PartnerService _partnerService;
  late final StreamSubscription<List<UserDto>> streamSub;

  PartnerSharedWithNotifier(this._partnerService) : super([]) {
    Function eq = const ListEquality<UserDto>().equals;
    _partnerService.getSharedWith().then((partners) {
      if (!eq(state, partners)) {
        state = partners;
      }
    }).then((_) {
      streamSub = _partnerService.watchSharedWith().listen((partners) {
        if (!eq(state, partners)) {
          state = partners;
        }
      });
    });
  }

  Future<bool> updatePartner(UserDto partner, {required bool inTimeline}) {
    return _partnerService.updatePartner(partner, inTimeline: inTimeline);
  }

  @override
  void dispose() {
    if (mounted) {
      streamSub.cancel();
    }
    super.dispose();
  }
}

final partnerSharedWithProvider =
    StateNotifierProvider<PartnerSharedWithNotifier, List<UserDto>>((ref) {
  return PartnerSharedWithNotifier(
    ref.watch(partnerServiceProvider),
  );
});

class PartnerSharedByNotifier extends StateNotifier<List<UserDto>> {
  final PartnerService _partnerService;
  late final StreamSubscription<List<UserDto>> streamSub;

  PartnerSharedByNotifier(this._partnerService) : super([]) {
    Function eq = const ListEquality<UserDto>().equals;
    _partnerService.getSharedBy().then((partners) {
      if (!eq(state, partners)) {
        state = partners;
      }
    }).then((_) {
      streamSub = _partnerService.watchSharedBy().listen((partners) {
        if (!eq(state, partners)) {
          state = partners;
        }
      });
    });
  }

  @override
  void dispose() {
    if (mounted) {
      streamSub.cancel();
    }
    super.dispose();
  }
}

final partnerSharedByProvider =
    StateNotifierProvider<PartnerSharedByNotifier, List<UserDto>>((ref) {
  return PartnerSharedByNotifier(ref.watch(partnerServiceProvider));
});

final partnerAvailableProvider =
    FutureProvider.autoDispose<List<UserDto>>((ref) async {
  final otherUsers = await ref.watch(otherUsersProvider.future);
  final currentPartners = ref.watch(partnerSharedByProvider);
  final available = Set<UserDto>.of(otherUsers);
  available.removeAll(currentPartners);
  return available.toList();
});
