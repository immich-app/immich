import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'album.provider.dart';

class RemoteAlbumState {
  final List<RemoteAlbum> albums;
  final List<RemoteAlbum> filteredAlbums;
  final bool isLoading;
  final String? error;

  const RemoteAlbumState({
    required this.albums,
    List<RemoteAlbum>? filteredAlbums,
    this.isLoading = false,
    this.error,
  }) : filteredAlbums = filteredAlbums ?? albums;

  RemoteAlbumState copyWith({
    List<RemoteAlbum>? albums,
    List<RemoteAlbum>? filteredAlbums,
    bool? isLoading,
    String? error,
  }) {
    return RemoteAlbumState(
      albums: albums ?? this.albums,
      filteredAlbums: filteredAlbums ?? this.filteredAlbums,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  @override
  String toString() =>
      'RemoteAlbumState(albums: ${albums.length}, filteredAlbums: ${filteredAlbums.length}, isLoading: $isLoading, error: $error)';

  @override
  bool operator ==(covariant RemoteAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.albums, albums) &&
        listEquals(other.filteredAlbums, filteredAlbums) &&
        other.isLoading == isLoading &&
        other.error == error;
  }

  @override
  int get hashCode =>
      albums.hashCode ^
      filteredAlbums.hashCode ^
      isLoading.hashCode ^
      error.hashCode;
}

class RemoteAlbumNotifier extends Notifier<RemoteAlbumState> {
  late RemoteAlbumService _remoteAlbumService;

  @override
  RemoteAlbumState build() {
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return const RemoteAlbumState(albums: [], filteredAlbums: []);
  }

  Future<List<RemoteAlbum>> getAll() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final albums = await _remoteAlbumService.getAll();
      state = state.copyWith(
        albums: albums,
        filteredAlbums: albums,
        isLoading: false,
      );
      return albums;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> refresh() async {
    await getAll();
  }

  void searchAlbums(
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    final filtered = _remoteAlbumService.searchAlbums(
      state.albums,
      query,
      userId,
      filterMode,
    );

    state = state.copyWith(
      filteredAlbums: filtered,
    );
  }

  void clearSearch() {
    state = state.copyWith(
      filteredAlbums: state.albums,
    );
  }

  void sortFilteredAlbums(
    RemoteAlbumSortMode sortMode, {
    bool isReverse = false,
  }) {
    final sortedAlbums = _remoteAlbumService
        .sortAlbums(state.filteredAlbums, sortMode, isReverse: isReverse);
    state = state.copyWith(filteredAlbums: sortedAlbums);
  }

  Future<RemoteAlbum?> createAlbum({
    required String title,
    String? description,
    List<String> assetIds = const [],
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final album = await _remoteAlbumService.createAlbum(
        title: title,
        description: description,
        assetIds: assetIds,
      );

      state = state.copyWith(
        albums: [...state.albums, album],
        filteredAlbums: [...state.filteredAlbums, album],
      );

      state = state.copyWith(isLoading: false);
      return album;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
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
    state = state.copyWith(isLoading: true, error: null);

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

      state = state.copyWith(
        albums: updatedAlbums,
        filteredAlbums: updatedFilteredAlbums,
        isLoading: false,
      );

      return updatedAlbum;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<RemoteAlbum?> toggleAlbumOrder(String albumId) async {
    final currentAlbum =
        state.albums.firstWhere((album) => album.id == albumId);

    final newOrder = currentAlbum.order == AlbumAssetOrder.asc
        ? AlbumAssetOrder.desc
        : AlbumAssetOrder.asc;

    return updateAlbum(albumId, order: newOrder);
  }

  Future<void> deleteAlbum(String albumId) async {
    await _remoteAlbumService.deleteAlbum(albumId);

    final updatedAlbums =
        state.albums.where((album) => album.id != albumId).toList();
    final updatedFilteredAlbums =
        state.filteredAlbums.where((album) => album.id != albumId).toList();

    state = state.copyWith(
      albums: updatedAlbums,
      filteredAlbums: updatedFilteredAlbums,
    );
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    return _remoteAlbumService.getAssets(albumId);
  }

  Future<int> addAssets(String albumId, List<String> assetIds) {
    return _remoteAlbumService.addAssets(
      albumId: albumId,
      assetIds: assetIds,
    );
  }

  Future<void> addUsers(String albumId, List<String> userIds) {
    return _remoteAlbumService.addUsers(
      albumId: albumId,
      userIds: userIds,
    );
  }
}

final remoteAlbumDateRangeProvider =
    FutureProvider.family<(DateTime, DateTime), String>(
  (ref, albumId) async {
    final service = ref.watch(remoteAlbumServiceProvider);
    return service.getDateRange(albumId);
  },
);

final remoteAlbumSharedUsersProvider =
    FutureProvider.autoDispose.family<List<UserDto>, String>(
  (ref, albumId) async {
    final link = ref.keepAlive();
    ref.onDispose(() => link.close());
    final service = ref.watch(remoteAlbumServiceProvider);
    return service.getSharedUsers(albumId);
  },
);
