import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, Isar db) : super([]) {
    final query = db.albums
        .filter()
        .owner((q) => q.isarIdEqualTo(Store.get(StoreKey.currentUser).isarId));
    query.findAll().then((value) {
      if (mounted) {
        state = value;
      }
    });
    _streamSub = query.watch().listen((data) => state = data);
  }

  final AlbumService _albumService;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<void> getAllAlbums() => Future.wait([
        _albumService.refreshDeviceAlbums(),
        _albumService.refreshRemoteAlbums(isShared: false),
      ]);

  Future<void> getDeviceAlbums() => _albumService.refreshDeviceAlbums();

  Future<bool> deleteAlbum(Album album) => _albumService.deleteAlbum(album);

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) =>
      _albumService.createAlbum(albumTitle, assets, []);

  Future<Album?> getAlbumByName(String albumName, {bool remoteOnly = false}) =>
      _albumService.getAlbumByName(albumName, remoteOnly);

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

final albumWatcher =
    StreamProvider.autoDispose.family<Album, int>((ref, albumId) async* {
  final db = ref.watch(dbProvider);
  final a = await db.albums.get(albumId);
  if (a != null) yield a;
  await for (final a in db.albums.watchObject(albumId, fireImmediately: true)) {
    if (a != null) yield a;
  }
});

final albumRenderlistProvider =
    StreamProvider.autoDispose.family<RenderList, int>((ref, albumId) {
  final album = ref.watch(albumWatcher(albumId)).value;
  if (album != null) {
    final query =
        album.assets.filter().isTrashedEqualTo(false).sortByFileCreatedAtDesc();
    return renderListGeneratorWithGroupBy(query, GroupAssetsBy.none);
  }
  return const Stream.empty();
});
