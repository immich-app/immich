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
