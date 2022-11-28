import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/user.service.dart';
import 'package:isar/isar.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, this._userService, this._db) : super([]);
  final AlbumService _albumService;
  final UserService _userService;
  final Isar _db;

  Future<void> getAllAlbums() async {
    if (state.isEmpty && 0 < await _db.albums.count()) {
      state = await _db.albums.where().findAll();
    }
    await Future.wait([
      _albumService.refreshDeviceAlbums(),
      _albumService.refreshRemoteAlbums(isShared: false),
    ]);
    final User? me = await _userService.getLoggedInUser();
    final albums = await _db.albums
        .filter()
        .owner((q) => q.isarIdEqualTo(me!.isarId))
        .findAll();
    if (!const ListEquality().equals(albums, state)) {
      state = albums;
    }
  }

  Future<void> deleteAlbum(Album album) async {
    _albumService.deleteAlbum(album);
    state = state.where((album) => album.id != album.id).toList();
  }

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) async {
    Album? album = await _albumService.createAlbum(albumTitle, assets, []);

    if (album != null) {
      state = [...state, album];
      return album;
    }
    return null;
  }
}

final albumProvider = StateNotifierProvider<AlbumNotifier, List<Album>>((ref) {
  return AlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(userServiceProvider),
    ref.watch(dbProvider),
  );
});
