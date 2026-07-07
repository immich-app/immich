import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/offline_file.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;

enum OfflineDownloadKind { original, thumbnail }

class OfflineDownloadMetadata {
  final String assetId;
  final OfflineDownloadKind kind;

  const OfflineDownloadMetadata({required this.assetId, required this.kind});

  static OfflineDownloadMetadata? tryParse(String metadata) {
    try {
      final json = jsonDecode(metadata) as Map<String, dynamic>;
      return OfflineDownloadMetadata(
        assetId: json['assetId'] as String,
        kind: OfflineDownloadKind.values[json['kind'] as int],
      );
    } catch (_) {
      return null;
    }
  }

  String encode() => jsonEncode({'assetId': assetId, 'kind': kind.index});
}

class OfflineAlbumService {
  final DriftOfflineAlbumRepository _repository;
  final FileDownloader _downloader;
  final Logger _log = Logger('OfflineAlbumService');

  OfflineAlbumService(this._repository, {FileDownloader? downloader}) : _downloader = downloader ?? FileDownloader() {
    _downloader.registerCallbacks(group: kDownloadGroupOfflineAsset, taskStatusCallback: _onDownloadStatus);
  }

  /// Marks the album as available offline and starts downloading its assets.
  /// Returns the number of enqueued downloads.
  Future<int> enable(String albumId) async {
    await _repository.addAlbum(albumId);
    return sync();
  }

  /// Removes the offline marker and deletes downloaded files that are not
  /// referenced by another offline album.
  Future<void> disable(String albumId) async {
    await _repository.removeAlbum(albumId);
    await sync();
  }

  Future<bool> isAlbumOffline(String albumId) => _repository.isAlbumOffline(albumId);

  /// Reconciles downloaded files with the current state of all offline
  /// albums: downloads missing assets and removes files for assets that are
  /// no longer part of any offline album. Returns the number of enqueued
  /// downloads.
  Future<int> sync() async {
    final assets = await _repository.getRequiredAssets();

    // Motion photos reference a hidden video asset that is required for
    // offline playback but is not part of the album asset list itself.
    final requiredIds = <String>{};
    final tasks = <DownloadTask>[];
    final headers = ApiService.getRequestHeaders();
    final registry = OfflineFileRegistry.instance;

    for (final asset in assets) {
      requiredIds.add(asset.id);

      if (!registry.hasOriginal(asset.id)) {
        tasks.add(_originalTask(asset.id, asset.name, headers));
      }

      if (!registry.hasThumbnail(asset.id)) {
        tasks.add(_thumbnailTask(asset.id, headers));
      }

      final livePhotoVideoId = asset.livePhotoVideoId;
      if (livePhotoVideoId != null) {
        requiredIds.add(livePhotoVideoId);
        if (!registry.hasOriginal(livePhotoVideoId)) {
          tasks.add(_originalTask(livePhotoVideoId, '$livePhotoVideoId.mov', headers));
        }
      }
    }

    await _cleanupOrphans(requiredIds);

    // Skip tasks that are already enqueued or running from a previous sync
    final activeTaskIds = (await _downloader.allTasks(
      group: kDownloadGroupOfflineAsset,
    )).map((task) => task.taskId).toSet();
    final newTasks = tasks.where((task) => !activeTaskIds.contains(task.taskId)).toList();

    if (newTasks.isNotEmpty) {
      final results = await _downloader.enqueueAll(newTasks);
      final enqueued = results.where((enqueued) => enqueued).length;
      _log.info('Enqueued $enqueued/${newTasks.length} offline album downloads');
    }

    return newTasks.length;
  }

  Future<void> _cleanupOrphans(Set<String> requiredIds) async {
    final downloadedIds = await _repository.getDownloadedAssetIds();
    final orphanIds = downloadedIds.difference(requiredIds);
    if (orphanIds.isEmpty) {
      return;
    }

    _log.info('Removing ${orphanIds.length} orphaned offline assets');
    for (final assetId in orphanIds) {
      await _downloader.cancelTaskWithId(_originalTaskId(assetId));
      await _downloader.cancelTaskWithId(_thumbnailTaskId(assetId));
    }
    await _repository.removeAssets(orphanIds);
  }

  static String _originalTaskId(String assetId) => 'offline_original_$assetId';

  static String _thumbnailTaskId(String assetId) => 'offline_thumb_$assetId';

  DownloadTask _originalTask(String assetId, String assetName, Map<String, String> headers) {
    final extension = p.extension(assetName);
    return DownloadTask(
      taskId: _originalTaskId(assetId),
      url: getOriginalUrlForRemoteId(assetId),
      headers: headers,
      filename: '$assetId$extension',
      directory: kOfflineAssetsDirectory,
      baseDirectory: BaseDirectory.applicationSupport,
      group: kDownloadGroupOfflineAsset,
      updates: Updates.statusAndProgress,
      requiresWiFi: false,
      allowPause: true,
      metaData: OfflineDownloadMetadata(assetId: assetId, kind: OfflineDownloadKind.original).encode(),
    );
  }

  DownloadTask _thumbnailTask(String assetId, Map<String, String> headers) {
    return DownloadTask(
      taskId: _thumbnailTaskId(assetId),
      url: getThumbnailUrlForRemoteId(assetId),
      headers: headers,
      filename: '$assetId.thumb.webp',
      directory: kOfflineAssetsDirectory,
      baseDirectory: BaseDirectory.applicationSupport,
      group: kDownloadGroupOfflineAsset,
      updates: Updates.status,
      requiresWiFi: false,
      metaData: OfflineDownloadMetadata(assetId: assetId, kind: OfflineDownloadKind.thumbnail).encode(),
    );
  }

  Future<void> _onDownloadStatus(TaskStatusUpdate update) async {
    if (update.status != TaskStatus.complete) {
      if (update.status == TaskStatus.failed || update.status == TaskStatus.notFound) {
        _log.warning('Offline download failed for task ${update.task.taskId}: ${update.exception}');
      }
      return;
    }

    final metadata = OfflineDownloadMetadata.tryParse(update.task.metaData);
    if (metadata == null) {
      _log.warning('Missing metadata for offline download task ${update.task.taskId}');
      return;
    }

    try {
      switch (metadata.kind) {
        case OfflineDownloadKind.original:
          final filePath = await update.task.filePath();
          final fileSize = await File(filePath).length();
          await _repository.setOriginalDownloaded(metadata.assetId, update.task.filename, fileSize);
        case OfflineDownloadKind.thumbnail:
          await _repository.setThumbnailDownloaded(metadata.assetId, update.task.filename);
      }
    } catch (error, stack) {
      _log.severe('Failed to record offline download for asset ${metadata.assetId}', error, stack);
    }
  }
}
