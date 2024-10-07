import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/pages/albums/albums.page.dart';
import 'package:immich_mobile/services/album.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';
import 'package:isar/isar.dart';

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this._albumService, this.db) : super([]) {
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

  Future<void> getAllAlbums() async {
    await _albumService.refreshRemoteAlbums();
  }

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

  void searchAlbums(String searchTerm, QuickFilterMode filterMode) async {
    state = await _albumService.search(searchTerm, filterMode);
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

class RemoteAlbumsNotifier extends StateNotifier<List<Album>> {
  RemoteAlbumsNotifier(this.db) : super([]) {
    final query = db.albums.filter().remoteIdIsNotNull();

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

class LocalAlbumsNotifier extends StateNotifier<List<Album>> {
  LocalAlbumsNotifier(this.db) : super([]) {
    final query = db.albums.filter().not().remoteIdIsNotNull();

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

final remoteAlbumsProvider =
    StateNotifierProvider.autoDispose<RemoteAlbumsNotifier, List<Album>>((ref) {
  return RemoteAlbumsNotifier(ref.watch(dbProvider));
});
