import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/shared_link/services/shared_link.service.dart';
import 'package:openapi/api.dart';

class SharedLinksNotifier
    extends StateNotifier<AsyncValue<List<SharedLinkResponseDto>>> {
  final SharedLinkService _sharedLinkService;

  SharedLinksNotifier(this._sharedLinkService) : super(const AsyncLoading()) {
    fetchLinks();
  }

  fetchLinks() async {
    state = await _sharedLinkService.getAllSharedLinks();
  }

  deleteLink(String id) async {
    await _sharedLinkService.deleteSharedLink(id);
    state = const AsyncLoading();
    fetchLinks();
  }
}

final sharedLinksStateProvider = StateNotifierProvider<SharedLinksNotifier,
    AsyncValue<List<SharedLinkResponseDto>>>((ref) {
  return SharedLinksNotifier(
    ref.watch(sharedLinkServiceProvider),
  );
});
