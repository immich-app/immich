import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/suggested_shared_users.provider.dart';
import 'package:immich_mobile/modules/partner/services/partner.service.dart';
import 'package:immich_mobile/shared/models/user.dart';

final partnerSharedWithProvider =
    FutureProvider.autoDispose<List<User>>((ref) async {
  return await ref
      .watch(partnerServiceProvider)
      .getPartners(PartnerDirection.sharedWith);
});

final partnerSharedByProvider =
    FutureProvider.autoDispose<List<User>>((ref) async {
  return await ref
      .watch(partnerServiceProvider)
      .getPartners(PartnerDirection.sharedBy);
});

final partnerAvailableProvider =
    FutureProvider.autoDispose<List<User>>((ref) async {
  final otherUsers = await ref.watch(otherUsersProvider.future);
  final currentPartners = await ref.watch(partnerSharedByProvider.future);
  final available = Set<User>.of(otherUsers);
  available.removeAll(currentPartners);
  return available.toList();
});
