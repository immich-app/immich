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
  final List<RemoteAlbum> filteredAlbums;

  const RemoteAlbumState({required this.albums, List<RemoteAlbum>? filteredAlbums})
    : filteredAlbums = filteredAlbums ?? albums;

  RemoteAlbumState copyWith({List<RemoteAlbum>? albums, List<RemoteAlbum>? filteredAlbums}) {
    return RemoteAlbumState(albums: albums ?? this.albums, filteredAlbums: filteredAlbums ?? this.filteredAlbums);
  }

  @override
  String toString() => 'RemoteAlbumState(albums: ${albums.length}, filteredAlbums: ${filteredAlbums.length})';

  @override
  bool operator ==(covariant RemoteAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.albums, albums) && listEquals(other.filteredAlbums, filteredAlbums);
  }

  @override
  int get hashCode => albums.hashCode ^ filteredAlbums.hashCode;
}

class RemoteAlbumNotifier extends Notifier<RemoteAlbumState> {
  late RemoteAlbumService _remoteAlbumService;
  final _logger = Logger('RemoteAlbumNotifier');
  @override
  RemoteAlbumState build() {
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return const RemoteAlbumState(albums: [], filteredAlbums: []);
  }

  Future<List<RemoteAlbum>> _getAll() async {
    try {
      final albums = await _remoteAlbumService.getAll();
      state = state.copyWith(albums: albums, filteredAlbums: albums);
      return albums;
    } catch (error, stack) {
      _logger.severe('Failed to fetch albums', error, stack);
      rethrow;
    }
  }

  Future<void> refresh() async {
    await _getAll();
  }

  void searchAlbums(String query, String? userId, [QuickFilterMode filterMode = QuickFilterMode.all]) {
    final filtered = _remoteAlbumService.searchAlbums(state.albums, query, userId, filterMode);

    state = state.copyWith(filteredAlbums: filtered);
  }

  void clearSearch() {
    state = state.copyWith(filteredAlbums: state.albums);
  }

  Future<void> sortFilteredAlbums(RemoteAlbumSortMode sortMode, {bool isReverse = false}) async {
    final sortedAlbums = await _remoteAlbumService.sortAlbums(state.filteredAlbums, sortMode, isReverse: isReverse);
    state = state.copyWith(filteredAlbums: sortedAlbums);
  }

  Future<RemoteAlbum?> createAlbum({
    required String title,
    String? description,
    List<String> assetIds = const [],
  }) async {
    try {
      final album = await _remoteAlbumService.createAlbum(title: title, description: description, assetIds: assetIds);

      state = state.copyWith(albums: [...state.albums, album], filteredAlbums: [...state.filteredAlbums, album]);

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

      final updatedFilteredAlbums = state.filteredAlbums.map((album) {
        return album.id == albumId ? updatedAlbum : album;
      }).toList();

      state = state.copyWith(albums: updatedAlbums, filteredAlbums: updatedFilteredAlbums);

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
    final updatedFilteredAlbums = state.filteredAlbums.where((album) => album.id != albumId).toList();

    state = state.copyWith(albums: updatedAlbums, filteredAlbums: updatedFilteredAlbums);
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
    final updatedFilteredAlbums = state.filteredAlbums.where((album) => album.id != albumId).toList();

    state = state.copyWith(albums: updatedAlbums, filteredAlbums: updatedFilteredAlbums);
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
