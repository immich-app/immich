import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final remoteAlbumProvider =
    NotifierProvider<RemoteAlbumNotifier, RemoteAlbumState>(
  RemoteAlbumNotifier.new,
  dependencies: [remoteAlbumServiceProvider],
);

class RemoteAlbumState {
  final List<Album> albums;
  final List<Album> filteredAlbums;
  final bool isLoading;
  final String? error;
  final String searchQuery;

  const RemoteAlbumState({
    required this.albums,
    List<Album>? filteredAlbums,
    this.isLoading = false,
    this.error,
    this.searchQuery = '',
  }) : filteredAlbums = filteredAlbums ?? albums;

  RemoteAlbumState copyWith({
    List<Album>? albums,
    List<Album>? filteredAlbums,
    bool? isLoading,
    String? error,
    String? searchQuery,
  }) {
    return RemoteAlbumState(
      albums: albums ?? this.albums,
      filteredAlbums: filteredAlbums ?? this.filteredAlbums,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
      searchQuery: searchQuery ?? this.searchQuery,
    );
  }

  @override
  String toString() =>
      'RemoteAlbumState(albums: ${albums.length}, filteredAlbums: ${filteredAlbums.length}, isLoading: $isLoading, error: $error, searchQuery: $searchQuery)';

  @override
  bool operator ==(covariant RemoteAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.albums, albums) &&
        listEquals(other.filteredAlbums, filteredAlbums) &&
        other.isLoading == isLoading &&
        other.error == error &&
        other.searchQuery == searchQuery;
  }

  @override
  int get hashCode =>
      albums.hashCode ^
      filteredAlbums.hashCode ^
      isLoading.hashCode ^
      error.hashCode ^
      searchQuery.hashCode;
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

  void sortAlbums(RemoteAlbumSortMode sortMode, {bool isReverse = false}) {
    final sortedAlbums = _remoteAlbumService.sortAlbums(
      state.albums,
      sortMode,
      isReverse: isReverse,
    );
    final sortedFilteredAlbums = _remoteAlbumService
        .sortAlbums(state.filteredAlbums, sortMode, isReverse: isReverse);
    state = state.copyWith(
      albums: sortedAlbums,
      filteredAlbums: sortedFilteredAlbums,
    );
  }

  void sortByName({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.title, isReverse: isReverse);
  }

  void sortByAssetCount({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.assetCount, isReverse: isReverse);
  }

  void sortByLastModified({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.lastModified, isReverse: isReverse);
  }

  void sortByCreatedDate({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.created, isReverse: isReverse);
  }

  void sortByMostRecent({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.mostRecent, isReverse: isReverse);
  }

  void sortByOldest({bool isReverse = false}) {
    sortAlbums(RemoteAlbumSortMode.mostOldest, isReverse: isReverse);
  }

  void clear() {
    state = state.copyWith(albums: [], filteredAlbums: []);
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
      searchQuery: query,
    );
  }

  void clearSearch() {
    state = state.copyWith(
      filteredAlbums: state.albums,
      searchQuery: '',
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
