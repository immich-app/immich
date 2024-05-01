import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final sharedLinkServiceProvider = Provider(
  (ref) => SharedLinkService(ref.watch(apiServiceProvider)),
);

class SharedLinkService {
  final ApiService _apiService;
  final Logger _log = Logger("SharedLinkService");

  SharedLinkService(this._apiService);

  Future<AsyncValue<List<SharedLink>>> getAllSharedLinks() async {
    try {
      final list = await _apiService.sharedLinkApi.getAllSharedLinks();
      return list != null
          ? AsyncData(list.map(SharedLink.fromDto).toList())
          : const AsyncData([]);
    } catch (e, stack) {
      _log.severe("Failed to fetch shared links", e, stack);
      return AsyncError(e, stack);
    }
  }

  Future<void> deleteSharedLink(String id) async {
    try {
      return await _apiService.sharedLinkApi.removeSharedLink(id);
    } catch (e) {
      _log.severe("Failed to delete shared link id - $id", e);
    }
  }

  Future<SharedLink?> createSharedLink({
    required bool showMeta,
    required bool allowDownload,
    required bool allowUpload,
    String? description,
    String? password,
    String? albumId,
    List<String>? assetIds,
    DateTime? expiresAt,
  }) async {
    try {
      final type =
          albumId != null ? SharedLinkType.ALBUM : SharedLinkType.INDIVIDUAL;
      SharedLinkCreateDto? dto;
      if (type == SharedLinkType.ALBUM) {
        dto = SharedLinkCreateDto(
          type: type,
          albumId: albumId,
          showMetadata: showMeta,
          allowDownload: allowDownload,
          allowUpload: allowUpload,
          expiresAt: expiresAt,
          description: description,
          password: password,
        );
      } else if (assetIds != null) {
        dto = SharedLinkCreateDto(
          type: type,
          showMetadata: showMeta,
          allowDownload: allowDownload,
          allowUpload: allowUpload,
          expiresAt: expiresAt,
          description: description,
          password: password,
          assetIds: assetIds,
        );
      }

      if (dto != null) {
        final responseDto =
            await _apiService.sharedLinkApi.createSharedLink(dto);
        if (responseDto != null) {
          return SharedLink.fromDto(responseDto);
        }
      }
    } catch (e) {
      _log.severe("Failed to create shared link", e);
    }
    return null;
  }

  Future<SharedLink?> updateSharedLink(
    String id, {
    required bool? showMeta,
    required bool? allowDownload,
    required bool? allowUpload,
    bool? changeExpiry = false,
    String? description,
    String? password,
    DateTime? expiresAt,
  }) async {
    try {
      final responseDto = await _apiService.sharedLinkApi.updateSharedLink(
        id,
        SharedLinkEditDto(
          showMetadata: showMeta,
          allowDownload: allowDownload,
          allowUpload: allowUpload,
          expiresAt: expiresAt,
          description: description,
          password: password,
          changeExpiryTime: changeExpiry,
        ),
      );
      if (responseDto != null) {
        return SharedLink.fromDto(responseDto);
      }
    } catch (e) {
      _log.severe("Failed to update shared link id - $id", e);
    }
    return null;
  }
}
