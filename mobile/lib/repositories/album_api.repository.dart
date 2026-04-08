import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart' show AlbumAssetOrder, RemoteAlbum;
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final albumApiRepositoryProvider = Provider((ref) => AlbumApiRepository(ref.watch(apiServiceProvider).albumsApi));

class AlbumApiRepository extends ApiRepository {
  final AlbumsApi _api;

  AlbumApiRepository(this._api);

  // TODO: Change name after removing old method
  Future<RemoteAlbum> createDriftAlbum(String name, {required Iterable<String> assetIds, String? description}) async {
    final responseDto = await checkNull(
      _api.createAlbum(CreateAlbumDto(albumName: name, description: description, assetIds: assetIds.toList())),
    );

    return _toRemoteAlbum(responseDto);
  }

  Future<void> delete(String albumId) {
    return _api.deleteAlbum(albumId);
  }

  Future<({List<String> added, List<String> duplicates})> addAssets(String albumId, Iterable<String> assetIds) async {
    final response = await checkNull(_api.addAssetsToAlbum(albumId, BulkIdsDto(ids: assetIds.toList())));

    final List<String> added = [];
    final List<String> duplicates = [];

    for (final result in response) {
      if (result.success) {
        added.add(result.id);
      } else if (result.error == BulkIdErrorReason.duplicate) {
        duplicates.add(result.id);
      }
    }
    return (added: added, duplicates: duplicates);
  }

  Future<({List<String> removed, List<String> failed})> removeAssets(String albumId, Iterable<String> assetIds) async {
    final response = await checkNull(_api.removeAssetFromAlbum(albumId, BulkIdsDto(ids: assetIds.toList())));
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

  Future<void> removeUser(String albumId, {required String userId}) {
    return _api.removeUserFromAlbum(albumId, userId);
  }

  static RemoteAlbum _toRemoteAlbum(AlbumResponseDto dto) {
    return RemoteAlbum(
      id: dto.id,
      name: dto.albumName,
      ownerId: dto.owner.id,
      description: dto.description,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      thumbnailAssetId: dto.albumThumbnailAssetId,
      isActivityEnabled: dto.isActivityEnabled,
      order: dto.order == AssetOrder.asc ? AlbumAssetOrder.asc : AlbumAssetOrder.desc,
      assetCount: dto.assetCount,
      ownerName: dto.owner.name,
      isShared: dto.albumUsers.length > 2,
    );
  }
}
