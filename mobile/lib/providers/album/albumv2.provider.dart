import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/pages/collections/albums/albums_collection.page.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

class AlbumNotifierV2 extends StateNotifier<List<Album>> {
  AlbumNotifierV2(this._albumService, this.db) : super([]) {
    final query = db.albums.filter().remoteIdIsNotNull();

    query.findAll().then((value) {
      if (mounted) {
        state = value;
      }
    });
    _streamSub = query.watch().listen((data) => state = data);
  }

  final AlbumService _albumService;
  final Isar db;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<void> getAllAlbums() {
    return Future.wait([
      _albumService.refreshDeviceAlbums(),
      _albumService.refreshRemoteAlbums(isShared: true),
    ]);
  }

  Future<void> getDeviceAlbums() {
    return _albumService.refreshDeviceAlbums();
  }

  Future<bool> deleteAlbum(Album album) {
    return _albumService.deleteAlbum(album);
  }

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) {
    return _albumService.createAlbum(albumTitle, assets, []);
  }

  Future<Album?> getAlbumByName(String albumName, {bool remoteOnly = false}) {
    return _albumService.getAlbumByName(albumName, remoteOnly);
  }

  /// Create an album on the server with the same name as the selected album for backup
  /// First this will check if the album already exists on the server with name
  /// If it does not exist, it will create the album on the server
  Future<void> createSyncAlbum(
    String albumName,
  ) async {
    final album = await getAlbumByName(albumName, remoteOnly: true);
    if (album != null) {
      return;
    }

    await createAlbum(albumName, {});
  }

  void searchAlbums(String value) async {
    final query = db.albums
        .filter()
        .remoteIdIsNotNull()
        .nameContains(value, caseSensitive: false);

    final albums = await query.findAll();
    state = albums;
  }

  void filterAlbums(QuickFilterMode mode) async {
    switch (mode) {
      case QuickFilterMode.all:
        state = await db.albums.filter().remoteIdIsNotNull().findAll();
        return;
      case QuickFilterMode.sharedWithMe:
        state = await db.albums
            .filter()
            .remoteIdIsNotNull()
            .owner(
              (q) =>
                  q.not().isarIdEqualTo(Store.get(StoreKey.currentUser).isarId),
            )
            .findAll();
        return;
      case QuickFilterMode.myAlbums:
        state = await db.albums
            .filter()
            .remoteIdIsNotNull()
            .owner(
              (q) => q.isarIdEqualTo(Store.get(StoreKey.currentUser).isarId),
            )
            .findAll();
        return;
    }
  }

  @override
  void dispose() {
    _streamSub.cancel();
    super.dispose();
  }
}

final albumProviderV2 =
    StateNotifierProvider.autoDispose<AlbumNotifierV2, List<Album>>((ref) {
  return AlbumNotifierV2(
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});
