import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:openapi/api.dart';

class AlbumNotifier extends StateNotifier<List<AlbumResponseDto>> {
  AlbumNotifier(this._albumService, this._albumCacheService) : super([]);
  final AlbumService _albumService;
  final AlbumCacheService _albumCacheService;

  _cacheState() {
    _albumCacheService.put(state);
  }

  getAllAlbums() async {
    if (await _albumCacheService.isValid() && state.isEmpty) {
      state = await _albumCacheService.get();
    }

    List<AlbumResponseDto>? albums =
        await _albumService.getAlbums(isShared: false);

    if (albums != null) {
      state = albums;
      _cacheState();
    }
  }

  deleteAlbum(String albumId) {
    state = state.where((album) => album.id != albumId).toList();
    _cacheState();
  }

  Future<AlbumResponseDto?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) async {
    AlbumResponseDto? album =
        await _albumService.createAlbum(albumTitle, assets, []);

    if (album != null) {
      state = [...state, album];
      _cacheState();

      return album;
    }
    return null;
  }
}

final albumProvider =
    StateNotifierProvider<AlbumNotifier, List<AlbumResponseDto>>((ref) {
  return AlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(albumCacheServiceProvider),
  );
});
