import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

typedef AlbumSharingOptions = ({bool hasPrivateAssets, bool includePrivateAssets});

final albumSharingApiRepositoryProvider = Provider((ref) {
  return AlbumSharingApiRepository(ref.watch(apiServiceProvider).albumsApi);
});

final albumSharingOptionsProvider = FutureProvider.autoDispose.family<AlbumSharingOptions, String>((ref, id) {
  return ref.watch(albumSharingApiRepositoryProvider).getOptions(id);
});

class AlbumSharingApiRepository extends ApiRepository {
  const AlbumSharingApiRepository(this._api);

  final AlbumsApi _api;

  Future<AlbumSharingOptions> getOptions(String id) async {
    final album = await checkNull(_api.getAlbumInfo(id));
    return (
      hasPrivateAssets: album.hasPrivateAssets.orElse(false) ?? false,
      includePrivateAssets: album.includePrivateAssets.orElse(false) ?? false,
    );
  }

  Future<void> update(String id, bool includePrivateAssets) async {
    await checkNull(
      _api.updateAlbumInfo(id, UpdateAlbumDto(includePrivateAssets: Optional.present(includePrivateAssets))),
    );
  }
}
