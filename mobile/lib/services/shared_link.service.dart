import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final sharedLinkServiceProvider = Provider((ref) => SharedLinkService(ref.watch(apiServiceProvider)));

class SharedLinkService {
  final ApiService _apiService;
  final Logger _log = Logger("SharedLinkService");

  SharedLinkService(this._apiService);

  Future<AsyncValue<List<SharedLink>>> getAllSharedLinks() async {
    try {
      final list = await _apiService.sharedLinksApi.getAllSharedLinks();
      return list != null ? AsyncData(list.map(SharedLink.fromDto).toList()) : const AsyncData([]);
    } catch (e, stack) {
      _log.severe("Failed to fetch shared links", e, stack);
      return AsyncError(e, stack);
    }
  }

  Future<void> deleteSharedLink(String id) async {
    try {
      return await _apiService.sharedLinksApi.removeSharedLink(id);
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
    String? slug,
    String? albumId,
    List<String>? assetIds,
    DateTime? expiresAt,
  }) async {
    try {
      final type = albumId != null ? SharedLinkType.ALBUM : SharedLinkType.INDIVIDUAL;
      SharedLinkCreateDto? dto;
      if (type == SharedLinkType.ALBUM) {
        dto = SharedLinkCreateDto(
          type: type,
          albumId: albumId == null ? const Optional.absent() : Optional.present(albumId),
          showMetadata: Optional.present(showMeta),
          allowDownload: Optional.present(allowDownload),
          allowUpload: Optional.present(allowUpload),
          expiresAt: expiresAt == null ? const Optional.absent() : Optional.present(expiresAt),
          description: description == null ? const Optional.absent() : Optional.present(description),
          password: password == null ? const Optional.absent() : Optional.present(password),
          slug: slug == null ? const Optional.absent() : Optional.present(slug),
        );
      } else if (assetIds != null) {
        dto = SharedLinkCreateDto(
          type: type,
          showMetadata: Optional.present(showMeta),
          allowDownload: Optional.present(allowDownload),
          allowUpload: Optional.present(allowUpload),
          expiresAt: expiresAt == null ? const Optional.absent() : Optional.present(expiresAt),
          description: description == null ? const Optional.absent() : Optional.present(description),
          password: password == null ? const Optional.absent() : Optional.present(password),
          slug: slug == null ? const Optional.absent() : Optional.present(slug),
          assetIds: Optional.present(assetIds),
        );
      }

      if (dto != null) {
        final responseDto = await _apiService.sharedLinksApi.createSharedLink(dto);
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
    Option<String?> password = const Option.none(),
    Option<String?> description = const Option.none(),
    String? slug,
    Option<DateTime?> expiresAt = const Option.none(),
  }) async {
    try {
      final responseDto = await _apiService.sharedLinksApi.updateSharedLink(
        id,
        SharedLinkEditDto(
          showMetadata: showMeta == null ? const Optional.absent() : Optional.present(showMeta),
          allowDownload: allowDownload == null ? const Optional.absent() : Optional.present(allowDownload),
          allowUpload: allowUpload == null ? const Optional.absent() : Optional.present(allowUpload),
          password: password.toOptional(),
          description: description.toOptional(),
          expiresAt: expiresAt.toOptional(),
          slug: slug == null ? const Optional.absent() : Optional.present(slug),
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
