import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/utils/remote_album.utils.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'album.provider.dart';

class RemoteAlbumState {
  final List<Album> albums;
  final List<Album> filteredAlbums;
  final bool isLoading;
  final String? error;

  const RemoteAlbumState({
    required this.albums,
    List<Album>? filteredAlbums,
    this.isLoading = false,
    this.error,
  }) : filteredAlbums = filteredAlbums ?? albums;

  RemoteAlbumState copyWith({
    List<Album>? albums,
    List<Album>? filteredAlbums,
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
  late final RemoteAlbumService _remoteAlbumService;

  @override
  RemoteAlbumState build() {
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return const RemoteAlbumState(albums: [], filteredAlbums: []);
  }

  Future<List<Album>> getAll() async {
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
}
