import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

class LocalAlbumState {
  final List<LocalAlbum> albums;
  final bool isLoading;
  final String? error;

  const LocalAlbumState({
    required this.albums,
    this.isLoading = false,
    this.error,
  });

  LocalAlbumState copyWith({
    List<LocalAlbum>? albums,
    bool? isLoading,
    String? error,
  }) {
    return LocalAlbumState(
      albums: albums ?? this.albums,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  @override
  String toString() =>
      'LocalAlbumState(albums: ${albums.length}, isLoading: $isLoading, error: $error)';

  @override
  bool operator ==(covariant LocalAlbumState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.albums, albums) &&
        other.isLoading == isLoading &&
        other.error == error;
  }

  @override
  int get hashCode => albums.hashCode ^ isLoading.hashCode ^ error.hashCode;
}

class LocalAlbumNotifier extends Notifier<LocalAlbumState> {
  late final LocalAlbumService _localAlbumService;

  @override
  LocalAlbumState build() {
    _localAlbumService = ref.read(localAlbumServiceProvider);
    return const LocalAlbumState(albums: []);
  }

  Future<List<LocalAlbum>> getAll() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final albums = await _localAlbumService.getAll();
      state = state.copyWith(
        albums: albums,
        isLoading: false,
      );
      return albums;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }
}
