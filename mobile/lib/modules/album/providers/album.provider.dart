import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, this._db) : super([]);
  final AlbumService _albumService;
  final Isar _db;

  Future<void> getAllAlbums() async {
    final User me = Store.get(StoreKey.currentUser);
    List<Album> albums = await _db.albums
        .filter()
        .owner((q) => q.isarIdEqualTo(me.isarId))
        .findAll();
    if (!const ListEquality().equals(albums, state)) {
      state = albums;
    }
    await Future.wait([
      _albumService.refreshDeviceAlbums(),
      _albumService.refreshRemoteAlbums(isShared: false),
    ]);
    albums = await _db.albums
        .filter()
        .owner((q) => q.isarIdEqualTo(me.isarId))
        .findAll();
    if (!const ListEquality().equals(albums, state)) {
      state = albums;
    }
  }

  Future<bool> deleteAlbum(Album album) async {
    state = state.where((a) => a.id != album.id).toList();
    return _albumService.deleteAlbum(album);
  }

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) async {
    Album? album = await _albumService.createAlbum(albumTitle, assets, []);
    if (album != null) {
      state = [...state, album];
    }
    return album;
  }
}

final albumProvider = StateNotifierProvider<AlbumNotifier, List<Album>>((ref) {
  return AlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});
