import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class PartnerNotifier extends Notifier<List<PartnerUserDto>> {
  late DriftPartnerService _driftPartnerService;

  @override
  List<PartnerUserDto> build() {
    _driftPartnerService = ref.read(driftPartnerServiceProvider);
    return [];
  }

  Future<void> _loadPartners() async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    state = await _driftPartnerService.getSharedWith(currentUser.id);
  }

  Future<List<PartnerUserDto>> getPartners(String userId) async {
    final partners = await _driftPartnerService.getSharedWith(userId);
    state = partners;
    return partners;
  }

  Future<void> toggleShowInTimeline(String partnerId, String userId) async {
    await _driftPartnerService.toggleShowInTimeline(partnerId, userId);
    await _loadPartners();
  }

  Future<void> addPartner(PartnerUserDto partner) async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    await _driftPartnerService.addPartner(partner.id, currentUser.id);
    await _loadPartners();
    ref.invalidate(driftAvailablePartnerProvider);
    ref.invalidate(driftSharedByPartnerProvider);
  }

  Future<void> removePartner(PartnerUserDto partner) async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    await _driftPartnerService.removePartner(partner.id, currentUser.id);
    await _loadPartners();
    ref.invalidate(driftAvailablePartnerProvider);
    ref.invalidate(driftSharedByPartnerProvider);
  }
}

final driftAvailablePartnerProvider = FutureProvider.autoDispose<List<PartnerUserDto>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) {
    return [];
  }

  return ref.watch(driftPartnerServiceProvider).getAvailablePartners(currentUser.id);
});

final driftSharedByPartnerProvider = FutureProvider.autoDispose<List<PartnerUserDto>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) {
    return [];
  }

  return ref.watch(driftPartnerServiceProvider).getSharedBy(currentUser.id);
});

final driftSharedWithPartnerProvider = FutureProvider.autoDispose<List<PartnerUserDto>>((ref) {
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) {
    return [];
  }

  return ref.watch(driftPartnerServiceProvider).getSharedWith(currentUser.id);
});
