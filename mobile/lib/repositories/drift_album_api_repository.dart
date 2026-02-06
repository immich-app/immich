import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'dart:convert';
// ignore: import_rule_openapi
import 'package:http/http.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart';

final driftAlbumApiRepositoryProvider = Provider(
  (ref) => DriftAlbumApiRepository(ref.watch(apiServiceProvider).albumsApi),
);

class DriftAlbumApiRepository extends ApiRepository {
  final AlbumsApi _api;

  DriftAlbumApiRepository(this._api);

  Future<RemoteAlbum> createDriftAlbum(String name, {required Iterable<String> assetIds, String? description}) async {
    final responseDto = await checkNull(
      _api.createAlbum(CreateAlbumDto(albumName: name, description: description, assetIds: assetIds.toList())),
    );

    return responseDto.toRemoteAlbum();
  }

  Future<({List<String> removed, List<String> failed})> removeAssets(String albumId, Iterable<String> assetIds) async {
    print("DEBUG: Requesting removal of assets from album $albumId: $assetIds");
    final response = await checkNull(_api.removeAssetFromAlbum(albumId, BulkIdsDto(ids: assetIds.toList())));
    final List<String> removed = [], failed = [];
    for (final dto in response) {
      if (dto.success) {
        removed.add(dto.id);
      } else {
        print("DEBUG: Failed to remove asset ${dto.id}. Success: ${dto.success}");
        failed.add(dto.id);
      }
    }
    print("DEBUG: Removal Result - Removed: ${removed.length}, Failed: ${failed.length}");
    return (removed: removed, failed: failed);
  }

  Future<({List<String> added, List<String> failed})> addAssets(String albumId, Iterable<String> assetIds) async {
    final response = await checkNull(_api.addAssetsToAlbum(albumId, BulkIdsDto(ids: assetIds.toList())));
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
      apiOrder = order == AlbumAssetOrder.asc ? AssetOrder.asc : AssetOrder.desc;
    }

    final postBody = UpdateAlbumDto(
      albumName: name,
      description: description,
      albumThumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: apiOrder,
    );

    final response = await _api.apiClient.invokeAPI(
      r'/albums/{id}'.replaceAll('{id}', albumId),
      'PATCH',
      [],
      postBody,
      {},
      {},
      'application/json',
    );

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }

    final responseDto =
        await _api.apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumResponseDto') as AlbumResponseDto;

    return responseDto.toRemoteAlbum();
  }

  Future<List<RemoteAlbum>> getAlbumsContainingAsset(String assetId) async {
    final response = await checkNull(_api.getAllAlbums(assetId: assetId));
    return response.map((dto) => dto.toRemoteAlbum()).toList();
  }

  Future<String> _decodeBodyBytes(Response response) async {
    return utf8.decode(response.bodyBytes);
  }

  Future<void> deleteAlbum(String albumId) {
    return _api.deleteAlbum(albumId);
  }

  Future<RemoteAlbum> addUsers(String albumId, Iterable<String> userIds) async {
    final albumUsers = userIds.map((userId) => AlbumUserAddDto(userId: userId)).toList();
    final response = await checkNull(_api.addUsersToAlbum(albumId, AddUsersDto(albumUsers: albumUsers)));
    return response.toRemoteAlbum();
  }

  Future<void> removeUser(String albumId, {required String userId}) async {
    await _api.removeUserFromAlbum(albumId, userId);
  }

  Future<bool> setActivityStatus(String albumId, bool isEnabled) async {
    final response = await checkNull(_api.updateAlbumInfo(albumId, UpdateAlbumDto(isActivityEnabled: isEnabled)));
    return response.isActivityEnabled;
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
      order: order == AssetOrder.asc ? AlbumAssetOrder.asc : AlbumAssetOrder.desc,
      assetCount: assetCount,
      ownerName: owner.name,
      isShared: albumUsers.length > 2,
    );
  }
}
