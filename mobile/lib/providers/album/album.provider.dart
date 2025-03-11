import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/services/album.service.dart';

final isRefreshingRemoteAlbumProvider = StateProvider<bool>((ref) => false);

class AlbumNotifier extends StateNotifier<List<Album>> {
  AlbumNotifier(this.albumService, this.ref) : super([]) {
    albumService.getAllRemoteAlbums().then((value) {
      if (mounted) {
        state = value;
      }
    });

    _streamSub =
        albumService.watchRemoteAlbums().listen((data) => state = data);
  }

  final AlbumService albumService;
  final Ref ref;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<void> refreshRemoteAlbums() async {
    ref.read(isRefreshingRemoteAlbumProvider.notifier).state = true;
    await albumService.refreshRemoteAlbums();
    ref.read(isRefreshingRemoteAlbumProvider.notifier).state = false;
  }

  Future<void> refreshDeviceAlbums() => albumService.refreshDeviceAlbums();

  Future<bool> deleteAlbum(Album album) => albumService.deleteAlbum(album);

  Future<Album?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) =>
      albumService.createAlbum(albumTitle, assets, []);

  Future<Album?> getAlbumByName(
    String albumName, {
    bool? remote,
    bool? shared,
    bool? owner,
  }) =>
      albumService.getAlbumByName(
        albumName,
        remote: remote,
        shared: shared,
        owner: owner,
      );

  /// Create an album on the server with the same name as the selected album for backup
  /// First this will check if the album already exists on the server with name
  /// If it does not exist, it will create the album on the server
  Future<void> createSyncAlbum(
    String albumName,
  ) async {
    final album = await getAlbumByName(albumName, remote: true, owner: true);
    if (album != null) {
      return;
    }

    await createAlbum(albumName, {});
  }

  Future<bool> leaveAlbum(Album album) async {
    var res = await albumService.leaveAlbum(album);

    if (res) {
      await deleteAlbum(album);
      return true;
    } else {
      return false;
    }
  }

  void searchAlbums(String searchTerm, QuickFilterMode filterMode) async {
    state = await albumService.search(searchTerm, filterMode);
  }

  Future<void> addUsers(Album album, List<String> userIds) async {
    await albumService.addUsers(album, userIds);
  }

  Future<bool> removeUser(Album album, UserDto user) async {
    final isRemoved = await albumService.removeUser(album, user);

    if (isRemoved && album.sharedUsers.isEmpty) {
      state = state.where((element) => element.id != album.id).toList();
    }

    return isRemoved;
  }

  Future<void> addAssets(Album album, Iterable<Asset> assets) async {
    await albumService.addAssets(album, assets);
  }

  Future<bool> removeAsset(Album album, Iterable<Asset> assets) async {
    return await albumService.removeAsset(album, assets);
  }

  Future<bool> setActivitystatus(
    Album album,
    bool enabled,
  ) {
    return albumService.setActivityStatus(album, enabled);
  }

  Future<Album?> toggleSortOrder(Album album) {
    final order =
        album.sortOrder == SortOrder.asc ? SortOrder.desc : SortOrder.asc;

    return albumService.updateSortOrder(album, order);
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
    ref,
  );
});

final albumWatcher =
    StreamProvider.autoDispose.family<Album, int>((ref, id) async* {
  final albumService = ref.watch(albumServiceProvider);

  final album = await albumService.getAlbumById(id);
  if (album != null) {
    yield album;
  }

  await for (final album in albumService.watchAlbum(id)) {
    if (album != null) {
      yield album;
    }
  }
});

class LocalAlbumsNotifier extends StateNotifier<List<Album>> {
  LocalAlbumsNotifier(this.albumService) : super([]) {
    albumService.getAllLocalAlbums().then((value) {
      if (mounted) {
        state = value;
      }
    });

    _streamSub = albumService.watchLocalAlbums().listen((data) => state = data);
  }

  final AlbumService albumService;
  late final StreamSubscription<List<Album>> _streamSub;

  @override
  void dispose() {
    _streamSub.cancel();
    super.dispose();
  }
}

final localAlbumsProvider =
    StateNotifierProvider.autoDispose<LocalAlbumsNotifier, List<Album>>((ref) {
  return LocalAlbumsNotifier(ref.watch(albumServiceProvider));
});
