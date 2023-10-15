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

  createLink({
    required bool showMeta,
    required bool allowDownload,
    required bool allowUpload,
    String? description,
    String? albumId,
    List<String>? assetIds,
    DateTime? expiresAt,
  }) async {
    final type =
        albumId != null ? SharedLinkType.ALBUM : SharedLinkType.INDIVIDUAL;
    if (type == SharedLinkType.ALBUM) {
      await _sharedLinkService.createSharedLink(
        SharedLinkCreateDto(
          type: type,
          albumId: albumId,
          showMetadata: showMeta,
          allowDownload: allowDownload,
          allowUpload: allowUpload,
          expiresAt: expiresAt,
          description: description,
        ),
      );
    } else if (assetIds != null) {
      await _sharedLinkService.createSharedLink(
        SharedLinkCreateDto(
          type: type,
          showMetadata: showMeta,
          allowDownload: allowDownload,
          allowUpload: allowUpload,
          expiresAt: expiresAt,
          description: description,
          assetIds: assetIds,
        ),
      );
    }
  }

  updateLink({
    required String id,
    required bool? showMeta,
    required bool? allowDownload,
    required bool? allowUpload,
    String? description,
    DateTime? expiresAt,
  }) async {
    await _sharedLinkService.updateSharedLink(
      id,
      SharedLinkEditDto(
        showMetadata: showMeta,
        allowDownload: allowDownload,
        allowUpload: allowUpload,
        expiresAt: expiresAt,
        description: description,
      ),
    );
  }
}

final sharedLinksStateProvider = StateNotifierProvider<SharedLinksNotifier,
    AsyncValue<List<SharedLinkResponseDto>>>((ref) {
  return SharedLinksNotifier(
    ref.watch(sharedLinkServiceProvider),
  );
});
