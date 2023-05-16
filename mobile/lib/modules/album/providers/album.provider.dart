import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, Isar db) : super([]) {
    final query = db.albums
        .filter()
        .owner((q) => q.isarIdEqualTo(Store.get(StoreKey.currentUser).isarId));
    query.findAll().then((value) => state = value);
    _streamSub = query.watch().listen((data) => state = data);
  }
  final AlbumService _albumService;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<void> getAllAlbums() => Future.wait([
        _albumService.refreshDeviceAlbums(),
        _albumService.refreshRemoteAlbums(isShared: false),
      ]);

  Future<bool> deleteAlbum(Album album) => _albumService.deleteAlbum(album);

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) =>
      _albumService.createAlbum(albumTitle, assets, []);

  @override
  void dispose() {
    _streamSub.cancel();
    super.dispose();
  }
}

final albumProvider =
    StateNotifierProvider.autoDispose<AlbumNotifier, List<Album>>((ref) {
  return AlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});
