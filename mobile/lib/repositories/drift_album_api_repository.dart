import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart';

final driftAlbumApiRepositoryProvider = Provider(
  (ref) => DriftAlbumApiRepository(ref.watch(apiServiceProvider).albumsApi),
);

class DriftAlbumApiRepository extends ApiRepository {
  final AlbumsApi _api;

  DriftAlbumApiRepository(this._api);

  Future<RemoteAlbum> createDriftAlbum(
    String name, {
    required Iterable<String> assetIds,
    String? description,
  }) async {
    final responseDto = await checkNull(
      _api.createAlbum(
        CreateAlbumDto(
          albumName: name,
          description: description,
          assetIds: assetIds.toList(),
        ),
      ),
    );

    return responseDto.toRemoteAlbum();
  }

  Future<({List<String> removed, List<String> failed})> removeAssets(
    String albumId,
    Iterable<String> assetIds,
  ) async {
    final response = await checkNull(
      _api.removeAssetFromAlbum(
        albumId,
        BulkIdsDto(ids: assetIds.toList()),
      ),
    );
    final List<String> removed = [], failed = [];
    for (final dto in response) {
      if (dto.success) {
        removed.add(dto.id);
      } else {
        failed.add(dto.id);
      }
    }
    return (removed: removed, failed: failed);
  }

  Future<({List<String> added, List<String> failed})> addAssets(
    String albumId,
    Iterable<String> assetIds,
  ) async {
    final response = await checkNull(
      _api.addAssetsToAlbum(
        albumId,
        BulkIdsDto(ids: assetIds.toList()),
      ),
    );
    final List<String> added = [], failed = [];
    for (final dto in response) {
      if (dto.success) {
        added.add(dto.id);
      } else {
        failed.add(dto.id);
      }
    }

    return (added: added, failed: failed);
  }

  Future<RemoteAlbum> updateAlbum(
    String albumId, {
    String? name,
    String? description,
    String? thumbnailAssetId,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
  }) async {
    AssetOrder? apiOrder;
    if (order != null) {
      apiOrder =
          order == AlbumAssetOrder.asc ? AssetOrder.asc : AssetOrder.desc;
    }

    final responseDto = await checkNull(
      _api.updateAlbumInfo(
        albumId,
        UpdateAlbumDto(
          albumName: name,
          description: description,
          albumThumbnailAssetId: thumbnailAssetId,
          isActivityEnabled: isActivityEnabled,
          order: apiOrder,
        ),
      ),
    );

    return responseDto.toRemoteAlbum();
  }

  Future<void> deleteAlbum(String albumId) {
    return _api.deleteAlbum(albumId);
  }

  Future<RemoteAlbum> addUsers(
    String albumId,
    Iterable<String> userIds,
  ) async {
    final albumUsers =
        userIds.map((userId) => AlbumUserAddDto(userId: userId)).toList();
    final response = await checkNull(
      _api.addUsersToAlbum(
        albumId,
        AddUsersDto(albumUsers: albumUsers),
      ),
    );
    return response.toRemoteAlbum();
  }
}

extension on AlbumResponseDto {
  RemoteAlbum toRemoteAlbum() {
    return RemoteAlbum(
      id: id,
      name: albumName,
      ownerId: owner.id,
      description: description,
      createdAt: createdAt,
      updatedAt: updatedAt,
      thumbnailAssetId: albumThumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order:
          order == AssetOrder.asc ? AlbumAssetOrder.asc : AlbumAssetOrder.desc,
      assetCount: assetCount,
      ownerName: owner.name,
    );
  }
}
