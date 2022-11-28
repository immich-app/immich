import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class SharedAlbumNotifier extends StateNotifier<List<Album>> {
  SharedAlbumNotifier(
    this._albumService,
    this._db,
  ) : super([]);

  final AlbumService _albumService;
  final Isar _db;

  Future<Album?> createSharedAlbum(
    String albumName,
    Set<Asset> assets,
    Iterable<User> sharedUsers,
  ) async {
    try {
      Album? newAlbum = await _albumService.createAlbum(
        albumName,
        assets,
        sharedUsers,
      );

      if (newAlbum != null) {
        state = [...state, newAlbum];
        return newAlbum;
      }
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
    }
    return null;
  }

  Future<void> getAllSharedAlbums() async {
    if (0 < await _db.albums.filter().sharedEqualTo(true).count() &&
        state.isEmpty) {
      state = await _db.albums.filter().sharedEqualTo(true).findAll();
    }
    await _albumService.refreshRemoteAlbums(isShared: true);

    final albums = await _db.albums.filter().sharedEqualTo(true).findAll();
    if (!const ListEquality().equals(albums, state)) {
      state = albums;
    }
  }

  Future<bool> deleteAlbum(Album albumId) {
    state = state.where((album) => album.id != albumId.id).toList();
    return _albumService.deleteAlbum(albumId);
  }

  Future<bool> leaveAlbum(Album album) async {
    var res = await _albumService.leaveAlbum(album);

    if (res) {
      await deleteAlbum(album);
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(
    Album album,
    Set<Asset> assets,
  ) async {
    return _albumService.removeAssetFromAlbum(album, assets);
  }
}

final sharedAlbumProvider =
    StateNotifierProvider<SharedAlbumNotifier, List<Album>>((ref) {
  return SharedAlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});

final sharedAlbumDetailProvider =
    FutureProvider.autoDispose.family<Album?, int>((ref, albumId) async {
  final AlbumService sharedAlbumService = ref.watch(albumServiceProvider);

  return await sharedAlbumService.getAlbumDetail(albumId);
});
