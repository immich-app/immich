import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'album.provider.dart';

class RemoteAlbumState {
  final List<RemoteAlbum> albums;

  const RemoteAlbumState({required this.albums});

  RemoteAlbumState copyWith({List<RemoteAlbum>? albums}) {
    return RemoteAlbumState(albums: albums ?? this.albums);
  }

  @override
  String toString() => 'RemoteAlbumState(albums: ${albums.length})';

  @override
  bool operator ==(covariant RemoteAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.albums, albums);
  }

  @override
  int get hashCode => albums.hashCode;
}

class RemoteAlbumNotifier extends Notifier<RemoteAlbumState> {
  late RemoteAlbumService _remoteAlbumService;
  final _logger = Logger('RemoteAlbumNotifier');

  @override
  RemoteAlbumState build() {
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return const RemoteAlbumState(albums: []);
  }

  Future<List<RemoteAlbum>> _getAll() async {
    try {
      final albums = await _remoteAlbumService.getAll();
      state = state.copyWith(albums: albums);
      return albums;
    } catch (error, stack) {
      _logger.severe('Failed to fetch albums', error, stack);
      rethrow;
    }
  }

  Future<void> refresh() async {
    await _getAll();
  }

  List<RemoteAlbum> searchAlbums(
    List<RemoteAlbum> albums,
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    return _remoteAlbumService.searchAlbums(albums, query, userId, filterMode);
  }

  Future<List<RemoteAlbum>> sortAlbums(
    List<RemoteAlbum> albums,
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) async {
    return await _remoteAlbumService.sortAlbums(albums, sortMode, isReverse: isReverse);
  }

  Future<RemoteAlbum?> createAlbum({
    required String title,
    String? description,
    List<String> assetIds = const [],
  }) async {
    try {
      final album = await _remoteAlbumService.createAlbum(title: title, description: description, assetIds: assetIds);

      state = state.copyWith(albums: [...state.albums, album]);

      return album;
    } catch (error, stack) {
      _logger.severe('Failed to create album', error, stack);
      rethrow;
    }
  }

  Future<RemoteAlbum?> updateAlbum(
    String albumId, {
    String? name,
    String? description,
    String? thumbnailAssetId,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
  }) async {
    try {
      final updatedAlbum = await _remoteAlbumService.updateAlbum(
        albumId,
        name: name,
        description: description,
        thumbnailAssetId: thumbnailAssetId,
        isActivityEnabled: isActivityEnabled,
        order: order,
      );

      final updatedAlbums = state.albums.map((album) {
        return album.id == albumId ? updatedAlbum : album;
      }).toList();

      state = state.copyWith(albums: updatedAlbums);

      return updatedAlbum;
    } catch (error, stack) {
      _logger.severe('Failed to update album', error, stack);
      rethrow;
    }
  }

  Future<RemoteAlbum?> toggleAlbumOrder(String albumId) async {
    final currentAlbum = state.albums.firstWhere((album) => album.id == albumId);

    final newOrder = currentAlbum.order == AlbumAssetOrder.asc ? AlbumAssetOrder.desc : AlbumAssetOrder.asc;

    return updateAlbum(albumId, order: newOrder);
  }

  Future<void> deleteAlbum(String albumId) async {
    await _remoteAlbumService.deleteAlbum(albumId);

    final updatedAlbums = state.albums.where((album) => album.id != albumId).toList();
    state = state.copyWith(albums: updatedAlbums);
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    return _remoteAlbumService.getAssets(albumId);
  }

  Future<int> addAssets(String albumId, List<String> assetIds) {
    return _remoteAlbumService.addAssets(albumId: albumId, assetIds: assetIds);
  }

  Future<void> addUsers(String albumId, List<String> userIds) {
    return _remoteAlbumService.addUsers(albumId: albumId, userIds: userIds);
  }

  Future<void> removeUser(String albumId, String userId) {
    return _remoteAlbumService.removeUser(albumId, userId: userId);
  }

  Future<void> leaveAlbum(String albumId, {required String userId}) async {
    await _remoteAlbumService.removeUser(albumId, userId: userId);

    final updatedAlbums = state.albums.where((album) => album.id != albumId).toList();
    state = state.copyWith(albums: updatedAlbums);
  }

  Future<void> setActivityStatus(String albumId, bool enabled) {
    return _remoteAlbumService.setActivityStatus(albumId, enabled);
  }
}

final remoteAlbumDateRangeProvider = FutureProvider.family<(DateTime, DateTime), String>((ref, albumId) async {
  final service = ref.watch(remoteAlbumServiceProvider);
  return service.getDateRange(albumId);
});

final remoteAlbumSharedUsersProvider = FutureProvider.autoDispose.family<List<UserDto>, String>((ref, albumId) async {
  final link = ref.keepAlive();
  ref.onDispose(() => link.close());
  final service = ref.watch(remoteAlbumServiceProvider);
  return service.getSharedUsers(albumId);
});
