import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:openapi/api.dart';

class SharedAlbumNotifier extends StateNotifier<List<AlbumResponseDto>> {
  SharedAlbumNotifier(this._sharedAlbumService) : super([]);

  final AlbumService _sharedAlbumService;

  Future<AlbumResponseDto?> createSharedAlbum(
    String albumName,
    Set<AssetResponseDto> assets,
    List<String> sharedUserIds,
  ) async {
    try {
      var newAlbum = await _sharedAlbumService.createAlbum(
        albumName,
        assets,
        sharedUserIds,
      );

      if (newAlbum != null) {
        state = [...state, newAlbum];
      }

      return newAlbum;
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");

      return null;
    }
  }

  getAllSharedAlbums() async {
    List<AlbumResponseDto>? sharedAlbums =
        await _sharedAlbumService.getAlbums(isShared: true);

    if (sharedAlbums != null) {
      state = sharedAlbums;
    }
  }

  deleteAlbum(String albumId) async {
    state = state.where((album) => album.id != albumId).toList();
  }

  Future<bool> leaveAlbum(String albumId) async {
    var res = await _sharedAlbumService.leaveAlbum(albumId);

    if (res) {
      state = state.where((album) => album.id != albumId).toList();
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    String albumId,
    List<String> assetIds,
  ) async {
    var res = await _sharedAlbumService.removeAssetFromAlbum(albumId, assetIds);

    if (res) {
      return true;
    } else {
      return false;
    }
  }
}

final sharedAlbumProvider =
    StateNotifierProvider<SharedAlbumNotifier, List<AlbumResponseDto>>((ref) {
  return SharedAlbumNotifier(ref.watch(albumServiceProvider));
});

final sharedAlbumDetailProvider = FutureProvider.autoDispose
    .family<AlbumResponseDto?, String>((ref, albumId) async {
  final AlbumService sharedAlbumService = ref.watch(albumServiceProvider);

  return await sharedAlbumService.getAlbumDetail(albumId);
});
