import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

final remoteAlbumProvider =
    NotifierProvider<RemoteAlbumNotifier, RemoteAlbumState>(
  RemoteAlbumNotifier.new,
  dependencies: [remoteAlbumRepository],
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
  late final DriftRemoteAlbumRepository _remoteAlbumRepository;

  @override
  RemoteAlbumState build() {
    _remoteAlbumRepository = ref.read(remoteAlbumRepository);
    return const RemoteAlbumState(albums: [], filteredAlbums: []);
  }

  Future<List<Album>> getAll() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final albums = await _remoteAlbumRepository.getAll();
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
    final sortedAlbums = sortMode.sortFn(state.albums, isReverse);
    final sortedFilteredAlbums =
        sortMode.sortFn(state.filteredAlbums, isReverse);
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
    final lowerQuery = query.toLowerCase();
    List<Album> filtered = state.albums;

    // Apply text search filter
    if (query.isNotEmpty) {
      filtered = filtered
          .where(
            (album) =>
                album.name.toLowerCase().contains(lowerQuery) ||
                album.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    if (userId != null) {
      switch (filterMode) {
        case QuickFilterMode.myAlbums:
          filtered =
              filtered.where((album) => album.ownerId == userId).toList();
          break;
        case QuickFilterMode.sharedWithMe:
          filtered =
              filtered.where((album) => album.ownerId != userId).toList();
          break;
        case QuickFilterMode.all:
          break;
      }
    }

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
    final sortedAlbums = sortMode.sortFn(state.filteredAlbums, isReverse);
    state = state.copyWith(filteredAlbums: sortedAlbums);
  }
}

/// SORTING

typedef AlbumSortFn = List<Album> Function(List<Album> albums, bool isReverse);

class _RemoteAlbumSortHandlers {
  const _RemoteAlbumSortHandlers._();

  static const AlbumSortFn created = _sortByCreated;
  static List<Album> _sortByCreated(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.createdAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn title = _sortByTitle;
  static List<Album> _sortByTitle(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.name);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn lastModified = _sortByLastModified;
  static List<Album> _sortByLastModified(List<Album> albums, bool isReverse) {
    final sorted = albums.sortedBy((album) => album.updatedAt);
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn assetCount = _sortByAssetCount;
  static List<Album> _sortByAssetCount(List<Album> albums, bool isReverse) {
    final sorted =
        albums.sorted((a, b) => a.assetCount.compareTo(b.assetCount));
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostRecent = _sortByMostRecent;
  static List<Album> _sortByMostRecent(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      // For most recent, we sort by updatedAt in descending order
      return b.updatedAt.compareTo(a.updatedAt);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }

  static const AlbumSortFn mostOldest = _sortByMostOldest;
  static List<Album> _sortByMostOldest(List<Album> albums, bool isReverse) {
    final sorted = albums.sorted((a, b) {
      // For oldest, we sort by createdAt in ascending order
      return a.createdAt.compareTo(b.createdAt);
    });
    return (isReverse ? sorted.reversed : sorted).toList();
  }
}

enum RemoteAlbumSortMode {
  title("Title", _RemoteAlbumSortHandlers.title),
  assetCount("Asset Count", _RemoteAlbumSortHandlers.assetCount),
  lastModified("Last Modified", _RemoteAlbumSortHandlers.lastModified),
  created("Created Date", _RemoteAlbumSortHandlers.created),
  mostRecent("Most Recent", _RemoteAlbumSortHandlers.mostRecent),
  mostOldest("Oldest", _RemoteAlbumSortHandlers.mostOldest);

  final String label;
  final AlbumSortFn sortFn;

  const RemoteAlbumSortMode(this.label, this.sortFn);
}
