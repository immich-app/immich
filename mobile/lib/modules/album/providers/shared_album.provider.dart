import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class SharedAlbumNotifier extends StateNotifier<List<Album>> {
  SharedAlbumNotifier(this._albumService, Isar db) : super([]) {
    final query = db.albums.filter().sharedEqualTo(true).sortByCreatedAtDesc();
    query.findAll().then((value) {
      if (mounted) {
        state = value;
      }
    });
    _streamSub = query.watch().listen((data) => state = data);
  }

  final AlbumService _albumService;
  late final StreamSubscription<List<Album>> _streamSub;

  Future<Album?> createSharedAlbum(
    String albumName,
    Iterable<Asset> assets,
    Iterable<User> sharedUsers,
  ) async {
    try {
      return await _albumService.createAlbum(
        albumName,
        assets,
        sharedUsers,
      );
    } catch (e) {
      debugPrint("Error createSharedAlbum  ${e.toString()}");
    }
    return null;
  }

  Future<void> getAllSharedAlbums() =>
      _albumService.refreshRemoteAlbums(isShared: true);

  Future<bool> deleteAlbum(Album album) => _albumService.deleteAlbum(album);

  Future<bool> leaveAlbum(Album album) async {
    var res = await _albumService.leaveAlbum(album);

    if (res) {
      await deleteAlbum(album);
      return true;
    } else {
      return false;
    }
  }

  Future<bool> removeAssetFromAlbum(Album album, Iterable<Asset> assets) {
    return _albumService.removeAssetFromAlbum(album, assets);
  }

  Future<bool> removeUserFromAlbum(Album album, User user) async {
    final result = await _albumService.removeUserFromAlbum(album, user);

    if (result && album.sharedUsers.isEmpty) {
      state = state.where((element) => element.id != album.id).toList();
    }

    return result;
  }

  Future<bool> setActivityEnabled(Album album, bool activityEnabled) {
    return _albumService.setActivityEnabled(album, activityEnabled);
  }

  @override
  void dispose() {
    _streamSub.cancel();
    super.dispose();
  }
}

final sharedAlbumProvider =
    StateNotifierProvider.autoDispose<SharedAlbumNotifier, List<Album>>((ref) {
  return SharedAlbumNotifier(
    ref.watch(albumServiceProvider),
    ref.watch(dbProvider),
  );
});
