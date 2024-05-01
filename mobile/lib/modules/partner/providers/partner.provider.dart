import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/suggested_shared_users.provider.dart';
import 'package:immich_mobile/modules/partner/services/partner.service.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class PartnerSharedWithNotifier extends StateNotifier<List<User>> {
  PartnerSharedWithNotifier(Isar db, this._ps) : super([]) {
    final query = db.users.filter().isPartnerSharedWithEqualTo(true);
    query.findAll().then((partners) => state = partners);
    query.watch().listen((partners) => state = partners);
  }

  Future<bool> updatePartner(User partner, {required bool inTimeline}) {
    return _ps.updatePartner(partner, inTimeline: inTimeline);
  }

  final PartnerService _ps;
}

final partnerSharedWithProvider =
    StateNotifierProvider<PartnerSharedWithNotifier, List<User>>((ref) {
  return PartnerSharedWithNotifier(
    ref.watch(dbProvider),
    ref.watch(partnerServiceProvider),
  );
});

class PartnerSharedByNotifier extends StateNotifier<List<User>> {
  PartnerSharedByNotifier(Isar db) : super([]) {
    final query = db.users.filter().isPartnerSharedByEqualTo(true);
    query.findAll().then((partners) => state = partners);
    streamSub = query.watch().listen((partners) => state = partners);
  }

  late final StreamSubscription<List<User>> streamSub;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final partnerSharedByProvider =
    StateNotifierProvider<PartnerSharedByNotifier, List<User>>((ref) {
  return PartnerSharedByNotifier(ref.watch(dbProvider));
});

final partnerAvailableProvider =
    FutureProvider.autoDispose<List<User>>((ref) async {
  final otherUsers = await ref.watch(otherUsersProvider.future);
  final currentPartners = ref.watch(partnerSharedByProvider);
  final available = Set<User>.of(otherUsers);
  available.removeAll(currentPartners);
  return available.toList();
});
