import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/providers/album/pending_album_uploads.provider.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:logging/logging.dart';

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
    if (identical(this, other)) {
      return true;
    }
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
    AlbumSortMode sortMode, {
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
      final currentUser = ref.read(currentUserProvider);
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      final album = await _remoteAlbumService.createAlbum(
        title: title,
        owner: currentUser,
        description: description,
        assetIds: assetIds,
      );

      state = state.copyWith(albums: [...state.albums, album]);

      return album;
    } catch (error, stack) {
      _logger.severe('Failed to create album', error, stack);
      rethrow;
    }
  }

  /// Creates an album from a heterogeneous asset selection. Already-remote
  /// assets seed the album immediately; local-only assets are uploaded in the
  /// background and linked one-by-one as each upload completes.
  Future<RemoteAlbum?> createAlbumWithAssets({
    required String title,
    String? description,
    Iterable<BaseAsset> assets = const [],
  }) async {
    try {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      final candidates = RemoteAlbumService.categorizeCandidates(assets);
      final album = await _remoteAlbumService.createAlbum(
        title: title,
        owner: currentUser,
        description: description,
        assetIds: candidates.remoteAssetIds,
      );

      state = state.copyWith(albums: [...state.albums, album]);

      if (candidates.localAssetsToUpload.isNotEmpty) {
        unawaited(
          addAssetsToAlbum(
            album.id,
            candidates.localAssetsToUpload,
          ).then<void>((_) {}).catchError((Object _, StackTrace _) {}),
        );
      }

      return album;
    } catch (error, stack) {
      _logger.severe('Failed to create album with assets', error, stack);
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

  Future<({int added, int failed})> addAssets(String albumId, List<String> assetIds) async {
    final result = await _remoteAlbumService.addAssets(albumId: albumId, assetIds: assetIds);
    if (result.added > 0) {
      await _refreshAlbumInState(albumId);
    }
    return result;
  }

  /// Links a freshly-uploaded local asset to an album using its new remote ID,
  /// upserting a placeholder remote asset row so the local DB join survives
  /// until the next sync catches up.
  Future<int> linkUploadedAssetToAlbum(String albumId, LocalAsset source, String remoteId) async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      throw Exception('User not logged in');
    }

    final added = await _remoteAlbumService.linkUploadedAssetToAlbum(albumId, remoteId, currentUser, source);
    if (added > 0) {
      await _refreshAlbumInState(albumId);
    }
    return added;
  }

  /// Adds a heterogeneous asset selection to an album. Already-remote assets
  /// are linked immediately; local-only assets are queued in
  /// [pendingAlbumUploadsProvider] (so the album page can show them with
  /// progress indicators), uploaded, and linked one-by-one as each finishes.
  Future<int> addAssetsToAlbum(String albumId, Iterable<BaseAsset> assets) async {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      throw Exception('User not logged in');
    }

    final candidates = RemoteAlbumService.categorizeCandidates(assets);
    final pendingNotifier = ref.read(pendingAlbumUploadsProvider(albumId).notifier);
    pendingNotifier.enqueue(candidates.localAssetsToUpload);

    Completer<void>? cancelToken;
    if (candidates.localAssetsToUpload.isNotEmpty) {
      cancelToken = Completer<void>();
      ref.read(manualUploadCancelTokenProvider.notifier).state = cancelToken;
    }

    try {
      final added = await _remoteAlbumService.addAssetsToAlbum(
        albumId: albumId,
        uploader: currentUser,
        candidates: candidates,
        cancelToken: cancelToken,
        uploadCallbacks: UploadCallbacks(
          onProgress: (localAssetId, _, bytes, totalBytes) {
            final progress = totalBytes > 0 ? bytes / totalBytes : 0.0;
            pendingNotifier.updateProgress(localAssetId, progress);
          },
          onSuccess: (localAssetId, _) => pendingNotifier.remove(localAssetId),
          onError: (localAssetId, _) => pendingNotifier.markFailed(localAssetId),
        ),
      );
      if (added > 0) {
        await _refreshAlbumInState(albumId);
      }
      return added;
    } catch (error, stack) {
      if (candidates.localAssetsToUpload.isNotEmpty) {
        pendingNotifier.markAllFailed();
      }
      _logger.severe('Failed to add assets to album $albumId', error, stack);
      rethrow;
    } finally {
      if (cancelToken != null) {
        if (cancelToken.isCompleted) {
          pendingNotifier.clear();
        }
        if (ref.read(manualUploadCancelTokenProvider) == cancelToken) {
          ref.read(manualUploadCancelTokenProvider.notifier).state = null;
        }
      }
    }
  }

  /// Re-reads a single album from the local DB and replaces it in [state] so
  /// that views bound to the album list (counts, thumbnails) reflect the
  /// latest junction-table changes without a full `refresh()`.
  Future<void> _refreshAlbumInState(String albumId) async {
    final updated = await _remoteAlbumService.get(albumId);
    if (updated == null) {
      return;
    }

    state = state.copyWith(albums: state.albums.map((album) => album.id == albumId ? updated : album).toList());
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

final remoteAlbumDateRangeProvider = StreamProvider.autoDispose.family<(DateTime, DateTime), String>((ref, albumId) {
  final service = ref.watch(remoteAlbumServiceProvider);
  return service.watchDateRange(albumId);
});

final remoteAlbumSharedUsersProvider = FutureProvider.autoDispose.family<List<UserDto>, String>((ref, albumId) async {
  final link = ref.keepAlive();
  ref.onDispose(() => link.close());
  final service = ref.watch(remoteAlbumServiceProvider);
  return service.getSharedUsers(albumId);
});
