import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/album/services/album_cache.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:openapi/api.dart';

class SharedAlbumNotifier extends StateNotifier<List<AlbumResponseDto>> {
  SharedAlbumNotifier(this._albumService, this._sharedAlbumCacheService)
      : super([]);

  final AlbumService _albumService;
  final SharedAlbumCacheService _sharedAlbumCacheService;

  _cacheState() {
    _sharedAlbumCacheService.put(state);
  }

  Future<AlbumResponseDto?> createSharedAlbum(
    String albumName,
    Set<Asset> assets,
    List<String> sharedUserIds,
  ) async {
    try {
      var newAlbum = await _albumService.createAlbum(
        albumName,
        assets,
        sharedUserIds,
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

  getAllSharedAlbums() async {
    if (await _sharedAlbumCacheService.isValid() && state.isEmpty) {
      state = await _sharedAlbumCacheService.get();
    }

    List<AlbumResponseDto>? sharedAlbums =
        await _albumService.getAlbums(isShared: true);

    if (sharedAlbums != null) {
      state = sharedAlbums;
      _cacheState();
    }
  }

  deleteAlbum(String albumId) async {
    state = state.where((album) => album.id != albumId).toList();
    _cacheState();
  }

  Future<bool> leaveAlbum(String albumId) async {
    var res = await _albumService.leaveAlbum(albumId);

    if (res) {
      state = state.where((album) => album.id != albumId).toList();
      _cacheState();
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    String albumId,
    List<String> assetIds,
  ) async {
    var res = await _albumService.removeAssetFromAlbum(albumId, assetIds);

    if (res) {
      return true;
    } else {
      return false;
    }
  }
}

final sharedAlbumProvider =
    StateNotifierProvider<SharedAlbumNotifier, List<AlbumResponseDto>>((ref) {
  return SharedAlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(sharedAlbumCacheServiceProvider),
  );
});

final sharedAlbumDetailProvider = FutureProvider.autoDispose
    .family<AlbumResponseDto?, String>((ref, albumId) async {
  final AlbumService sharedAlbumService = ref.watch(albumServiceProvider);

  return await sharedAlbumService.getAlbumDetail(albumId);
});
