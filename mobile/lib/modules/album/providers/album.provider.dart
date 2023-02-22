import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/album.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, this._albumCacheService) : super([]);
  final AlbumService _albumService;
  final AlbumCacheService _albumCacheService;

  void _cacheState() {
    _albumCacheService.put(state);
  }

  Future<void> getAllAlbums() async {
    if (await _albumCacheService.isValid() && state.isEmpty) {
      final albums = await _albumCacheService.get();
      if (albums != null) {
        state = albums;
      }
    }

    final albums = await _albumService.getAlbums(isShared: false);

    if (albums != null) {
      state = albums;
      _cacheState();
    }
  }

  void deleteAlbum(Album album) {
    state = state.where((a) => a.id != album.id).toList();
    _cacheState();
  }

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) async {
    Album? album = await _albumService.createAlbum(albumTitle, assets, []);

    if (album != null) {
      state = [...state, album];
      _cacheState();

      return album;
    }
    return null;
  }
}

final albumProvider = StateNotifierProvider<AlbumNotifier, List<Album>>((ref) {
  return AlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(albumCacheServiceProvider),
  );
});
