import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';

final isRefreshingRemoteAlbumProvider = StateProvider<bool>((ref) => false);

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, this.db, this.ref) : super([]) {
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
  final Ref ref;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<void> refreshRemoteAlbums() async {
    ref.read(isRefreshingRemoteAlbumProvider.notifier).state = true;
    await _albumService.refreshRemoteAlbums();
    ref.read(isRefreshingRemoteAlbumProvider.notifier).state = false;
  }

  Future<void> refreshDeviceAlbums() => _albumService.refreshDeviceAlbums();

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

  Future<bool> leaveAlbum(Album album) async {
    var res = await _albumService.leaveAlbum(album);

    if (res) {
      await deleteAlbum(album);
      return true;
    } else {
      return false;
    }
  }

  void searchAlbums(String searchTerm, QuickFilterMode filterMode) async {
    state = await _albumService.search(searchTerm, filterMode);
  }

  Future<void> addUsers(Album album, List<String> userIds) async {
    await _albumService.addUsers(album, userIds);
  }

  Future<bool> removeUser(Album album, User user) async {
    final isRemoved = await _albumService.removeUser(album, user);

    if (isRemoved && album.sharedUsers.isEmpty) {
      state = state.where((element) => element.id != album.id).toList();
    }

    return isRemoved;
  }

  Future<void> addAssets(Album album, Iterable<Asset> assets) async {
    await _albumService.addAssets(album, assets);
  }

  Future<bool> removeAsset(Album album, Iterable<Asset> assets) async {
    return await _albumService.removeAsset(album, assets);
  }

  Future<bool> setActivitystatus(
    Album album,
    bool enabled,
  ) {
    return _albumService.setActivityStatus(album, enabled);
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
    ref,
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

class LocalAlbumsNotifier extends StateNotifier<List<Album>> {
  LocalAlbumsNotifier(this.db) : super([]) {
    final query = db.albums.where().remoteIdIsNull();

    query.findAll().then((value) {
      if (mounted) {
        state = value;
      }
    });

    _streamSub = query.watch().listen((data) => state = data);
  }

  final Isar db;
  late final StreamSubscription<List<Album>> _streamSub;

  @override
  void dispose() {
    _streamSub.cancel();
    super.dispose();
  }
}

final localAlbumsProvider =
    StateNotifierProvider.autoDispose<LocalAlbumsNotifier, List<Album>>((ref) {
  return LocalAlbumsNotifier(ref.watch(dbProvider));
});
