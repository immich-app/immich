import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/models/albums/album_search.model.dart';
import 'package:immich_mobile/providers/album/album_sort_by_options.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:logging/logging.dart';

/// Categorizes a heterogeneous asset selection into the candidates that can
/// be added to an album immediately (already on the server) and the local-only
/// candidates that must be uploaded first.
class AlbumAssetCandidates {
  final List<String> remoteAssetIds;
  final List<LocalAsset> localAssetsToUpload;

  const AlbumAssetCandidates({required this.remoteAssetIds, required this.localAssetsToUpload});
}

class RemoteAlbumService {
  static final _logger = Logger('RemoteAlbumService');

  final DriftRemoteAlbumRepository _repository;
  final DriftAlbumApiRepository _albumApiRepository;
  final ForegroundUploadService _uploadService;

  const RemoteAlbumService(this._repository, this._albumApiRepository, this._uploadService);

  /// Categorizes a heterogeneous asset selection into already-on-server IDs
  /// and local assets that still need to be uploaded.
  static AlbumAssetCandidates categorizeCandidates(Iterable<BaseAsset> assets) {
    final remoteIds = <String>[];
    final localToUpload = <LocalAsset>[];
    for (final asset in assets) {
      if (asset is RemoteAsset) {
        remoteIds.add(asset.id);
      } else if (asset is LocalAsset) {
        final remoteId = asset.remoteId;
        if (remoteId != null) {
          remoteIds.add(remoteId);
        } else {
          localToUpload.add(asset);
        }
      }
    }
    return AlbumAssetCandidates(remoteAssetIds: remoteIds, localAssetsToUpload: localToUpload);
  }

  Stream<RemoteAlbum?> watchAlbum(String albumId) {
    return _repository.watchAlbum(albumId);
  }

  Future<List<RemoteAlbum>> getAll() {
    return _repository.getAll();
  }

  Future<RemoteAlbum?> get(String albumId) {
    return _repository.get(albumId);
  }

  Future<List<RemoteAlbum>> sortAlbums(
    List<RemoteAlbum> albums,
    AlbumSortMode sortMode, {
    bool isReverse = false,
  }) async {
    // list of albums sorted ascendingly according to the selected sort mode
    final List<RemoteAlbum> sorted = switch (sortMode) {
      AlbumSortMode.created => albums.sortedBy((album) => album.createdAt),
      AlbumSortMode.title => albums.sortedBy((album) => album.name),
      AlbumSortMode.lastModified => albums.sortedBy((album) => album.updatedAt),
      AlbumSortMode.assetCount => albums.sortedBy((album) => album.assetCount),
      AlbumSortMode.mostRecent => await _sortByAssetDate(albums, aggregation: AssetDateAggregation.end),
      AlbumSortMode.mostOldest => await _sortByAssetDate(albums, aggregation: AssetDateAggregation.start),
    };
    final effectiveOrder = isReverse ? sortMode.defaultOrder.reverse() : sortMode.defaultOrder;

    return (effectiveOrder == SortOrder.asc ? sorted : sorted.reversed).toList();
  }

  List<RemoteAlbum> searchAlbums(
    List<RemoteAlbum> albums,
    String query,
    String? userId, [
    QuickFilterMode filterMode = QuickFilterMode.all,
  ]) {
    final lowerQuery = query.toLowerCase();
    List<RemoteAlbum> filtered = albums;

    // Apply text search filter
    if (query.isNotEmpty) {
      filtered = filtered
          .where(
            (album) =>
                album.name.toLowerCase().contains(lowerQuery) || album.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    if (userId != null) {
      switch (filterMode) {
        case QuickFilterMode.myAlbums:
          filtered = filtered.where((album) => album.ownerId == userId).toList();
          break;
        case QuickFilterMode.sharedWithMe:
          filtered = filtered.where((album) => album.ownerId != userId).toList();
          break;
        case QuickFilterMode.all:
          break;
      }
    }

    return filtered;
  }

  Future<RemoteAlbum> createAlbum({
    required String title,
    required UserDto owner,
    required List<String> assetIds,
    String? description,
  }) async {
    final album = await _albumApiRepository.createDriftAlbum(
      title,
      owner,
      description: description,
      assetIds: assetIds,
    );
    await _repository.create(album, assetIds);

    return album;
  }

  Future<RemoteAlbum> updateAlbum(
    String albumId, {
    String? name,
    String? description,
    String? thumbnailAssetId,
    bool? isActivityEnabled,
    AlbumAssetOrder? order,
  }) async {
    final owner = await _repository.getOwner(albumId);
    final updatedAlbum = await _albumApiRepository.updateAlbum(
      albumId,
      owner,
      name: name,
      description: description,
      thumbnailAssetId: thumbnailAssetId,
      isActivityEnabled: isActivityEnabled,
      order: order,
    );

    // Update the local database
    await _repository.update(updatedAlbum);

    return updatedAlbum;
  }

  Stream<(DateTime, DateTime)> watchDateRange(String albumId) {
    return _repository.watchDateRange(albumId);
  }

  Future<List<UserDto>> getSharedUsers(String albumId) {
    return _repository.getSharedUsers(albumId);
  }

  Future<AlbumUserRole?> getUserRole(String albumId, String userId) {
    return _repository.getUserRole(albumId, userId);
  }

  Future<List<RemoteAsset>> getAssets(String albumId) {
    return _repository.getAssets(albumId);
  }

  Future<({int added, int failed})> addAssets({required String albumId, required List<String> assetIds}) async {
    final album = await _albumApiRepository.addAssets(albumId, assetIds);

    await _repository.addAssets(albumId, album.added);

    return (added: album.added.length, failed: album.failed.length);
  }

  /// !TODO The name here is not clear as we have addAssets method above,
  /// which is only add remote assets to album, for the next PR, we will allow
  /// adding local assets from album from the timeline as well with this flow.
  /// So saving that for the next refactor
  Future<int> addAssetsToAlbum({
    required String albumId,
    required UserDto uploader,
    required AlbumAssetCandidates candidates,
    UploadCallbacks uploadCallbacks = const UploadCallbacks(),
    Completer<void>? cancelToken,
  }) async {
    int addedCount = 0;
    if (candidates.remoteAssetIds.isNotEmpty) {
      addedCount += (await addAssets(albumId: albumId, assetIds: candidates.remoteAssetIds)).added;
    }
    if (candidates.localAssetsToUpload.isNotEmpty) {
      addedCount += await _uploadAndAddLocals(
        albumId,
        uploader,
        candidates.localAssetsToUpload,
        uploadCallbacks,
        cancelToken,
      );
    }
    return addedCount;
  }

  Future<int> _uploadAndAddLocals(
    String albumId,
    UserDto uploader,
    List<LocalAsset> localAssets,
    UploadCallbacks userCallbacks,
    Completer<void>? cancelToken,
  ) async {
    int addedCount = 0;
    final pendingAdds = <Future<void>>[];
    final localById = {for (final a in localAssets) a.id: a};

    final wrappedCallbacks = UploadCallbacks(
      onProgress: (localId, filename, bytes, totalBytes) => _runUploadCallback(
        'Upload progress callback failed for $localId',
        () => userCallbacks.onProgress?.call(localId, filename, bytes, totalBytes),
      ),
      onICloudProgress: (localId, progress) => _runUploadCallback(
        'iCloud progress callback failed for $localId',
        () => userCallbacks.onICloudProgress?.call(localId, progress),
      ),
      onError: (localId, errorMessage) => _runUploadCallback(
        'Upload error callback failed for $localId',
        () => userCallbacks.onError?.call(localId, errorMessage),
      ),
      onSuccess: (localId, remoteId) {
        _runUploadCallback(
          'Upload success callback failed for $localId',
          () => userCallbacks.onSuccess?.call(localId, remoteId),
        );
        final source = localById[localId];
        if (source == null) {
          _logger.warning('Upload success for $localId but source LocalAsset missing; skipping album link');
          return;
        }
        pendingAdds.add(
          linkUploadedAssetToAlbum(albumId, remoteId, uploader, source)
              .then<void>((added) {
                addedCount += added;
              })
              .catchError((Object error, StackTrace stack) {
                _logger.warning('Failed to add uploaded asset $remoteId to album $albumId', error, stack);
              }),
        );
      },
    );

    await _uploadService.uploadManual(localAssets, callbacks: wrappedCallbacks, cancelToken: cancelToken);
    await Future.wait(pendingAdds);
    return addedCount;
  }

  void _runUploadCallback(String message, void Function() callback) {
    try {
      callback();
    } catch (error, stack) {
      _logger.warning(message, error, stack);
    }
  }

  /// Links a freshly-uploaded asset to an album, ensuring the local DB
  /// reflects the change without waiting for the next sync. We call the API
  /// (server is the source of truth), then upsert a placeholder
  /// `remote_asset_entity` row from the local source so the FK-protected
  /// junction insert succeeds. Sync overwrites the placeholder later with
  /// the authoritative server data.
  Future<int> linkUploadedAssetToAlbum(String albumId, String remoteId, UserDto uploader, LocalAsset source) async {
    final result = await _albumApiRepository.addAssets(albumId, [remoteId]);
    if (result.added.isEmpty) {
      return 0;
    }

    await _repository.upsertRemoteAssetStub(remoteId: remoteId, ownerId: uploader.id, source: source);
    await _repository.addAssets(albumId, result.added);
    return result.added.length;
  }

  Future<void> deleteAlbum(String albumId) async {
    await _albumApiRepository.deleteAlbum(albumId);

    await _repository.deleteAlbum(albumId);
  }

  Future<void> addUsers({required String albumId, required List<String> userIds}) async {
    await _albumApiRepository.addUsers(albumId, userIds);

    return _repository.addUsers(albumId, userIds);
  }

  Future<void> removeUser(String albumId, {required String userId}) async {
    await _albumApiRepository.removeUser(albumId, userId: userId);

    return _repository.removeUser(albumId, userId: userId);
  }

  Future<void> setActivityStatus(String albumId, bool enabled) async {
    await _albumApiRepository.setActivityStatus(albumId, enabled);

    return _repository.setActivityStatus(albumId, enabled);
  }

  Future<int> getCount() {
    return _repository.getCount();
  }

  Future<List<RemoteAlbum>> getAlbumsContainingAsset(String assetId) {
    return _repository.getAlbumsContainingAsset(assetId);
  }

  Future<List<RemoteAlbum>> _sortByAssetDate(
    List<RemoteAlbum> albums, {
    required AssetDateAggregation aggregation,
  }) async {
    if (albums.isEmpty) {
      return [];
    }

    final albumIds = albums.map((e) => e.id).toList();
    final sortedIds = await _repository.getSortedAlbumIds(albumIds, aggregation: aggregation);

    final albumMap = Map<String, RemoteAlbum>.fromEntries(albums.map((a) => MapEntry(a.id, a)));

    final sortedAlbums = sortedIds.map((id) => albumMap[id]).whereType<RemoteAlbum>().toList();

    if (sortedAlbums.length < albums.length) {
      final returnedIdSet = sortedIds.toSet();
      final emptyAlbums = albums.where((a) => !returnedIdSet.contains(a.id));
      sortedAlbums.addAll(emptyAlbums);
    }

    return sortedAlbums;
  }
}
