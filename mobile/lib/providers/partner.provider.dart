import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/album/suggested_shared_users.provider.dart';
import 'package:immich_mobile/services/partner.service.dart';

class PartnerSharedWithNotifier extends StateNotifier<List<User>> {
  final PartnerService _partnerService;
  late final StreamSubscription<List<User>> streamSub;

  PartnerSharedWithNotifier(this._partnerService) : super([]) {
    Function eq = const ListEquality<User>().equals;
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

  Future<bool> updatePartner(User partner, {required bool inTimeline}) {
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
    StateNotifierProvider<PartnerSharedWithNotifier, List<User>>((ref) {
  return PartnerSharedWithNotifier(
    ref.watch(partnerServiceProvider),
  );
});

class PartnerSharedByNotifier extends StateNotifier<List<User>> {
  final PartnerService _partnerService;
  late final StreamSubscription<List<User>> streamSub;

  PartnerSharedByNotifier(this._partnerService) : super([]) {
    Function eq = const ListEquality<User>().equals;
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
    StateNotifierProvider<PartnerSharedByNotifier, List<User>>((ref) {
  return PartnerSharedByNotifier(ref.watch(partnerServiceProvider));
});

final partnerAvailableProvider =
    FutureProvider.autoDispose<List<User>>((ref) async {
  final otherUsers = await ref.watch(otherUsersProvider.future);
  final currentPartners = ref.watch(partnerSharedByProvider);
  final available = Set<User>.of(otherUsers);
  available.removeAll(currentPartners);
  return available.toList();
});
