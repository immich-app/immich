import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';

class SharedAlbumNotifier extends StateNotifier<List<Album>> {
  SharedAlbumNotifier(this._albumService, this._sharedAlbumCacheService)
      : super([]);

  final AlbumService _albumService;
  final SharedAlbumCacheService _sharedAlbumCacheService;

  void _cacheState() {
    _sharedAlbumCacheService.put(state);
  }

  Future<Album?> createSharedAlbum(
    String albumName,
    Iterable<Asset> assets,
    Iterable<User> sharedUsers,
  ) async {
    try {
      var newAlbum = await _albumService.createAlbum(
        albumName,
        assets,
        sharedUsers,
      );

      if (newAlbum != null) {
        state = [...state, newAlbum];
        _cacheState();
      }

      return newAlbum;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");

      return null;
    }
  }

  Future<void> getAllSharedAlbums() async {
    if (await _sharedAlbumCacheService.isValid() && state.isEmpty) {
      final albums = await _sharedAlbumCacheService.get();
      if (albums != null) {
        state = albums;
      }
    }

    List<Album>? sharedAlbums = await _albumService.getAlbums(isShared: true);

    if (sharedAlbums != null) {
      state = sharedAlbums;
      _cacheState();
    }
  }

  void deleteAlbum(Album album) {
    state = state.where((a) => a.id != album.id).toList();
    _cacheState();
  }

  Future<bool> leaveAlbum(Album album) async {
    var res = await _albumService.leaveAlbum(album);

    if (res) {
      state = state.where((a) => a.id != album.id).toList();
      _cacheState();
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    Album album,
    Iterable<Asset> assets,
  ) async {
    var res = await _albumService.removeAssetFromAlbum(album, assets);

    if (res) {
      return true;
    } else {
      return false;
    }
  }
}

final sharedAlbumProvider =
    StateNotifierProvider<SharedAlbumNotifier, List<Album>>((ref) {
  return SharedAlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(sharedAlbumCacheServiceProvider),
  );
});

final sharedAlbumDetailProvider =
    FutureProvider.autoDispose.family<Album?, String>((ref, albumId) async {
  final AlbumService sharedAlbumService = ref.watch(albumServiceProvider);

  return await sharedAlbumService.getAlbumDetail(albumId);
});
