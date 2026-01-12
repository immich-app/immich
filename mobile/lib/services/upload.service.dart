import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;
import 'package:photo_manager/photo_manager.dart' show PMProgressHandler;

final uploadServiceProvider = Provider((ref) {
  final service = UploadService(
    ref.watch(uploadRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(appSettingsServiceProvider),
    ref.watch(assetMediaRepositoryProvider),
  );

  ref.onDispose(service.dispose);
  return service;
});

class UploadService {
  UploadService(
    this._uploadRepository,
    this._backupRepository,
    this._storageRepository,
    this._localAssetRepository,
    this._appSettingsService,
    this._assetMediaRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  final UploadRepository _uploadRepository;
  final DriftBackupRepository _backupRepository;
  final StorageRepository _storageRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final AppSettingsService _appSettingsService;
  final AssetMediaRepository _assetMediaRepository;
  final Logger _logger = Logger('UploadService');

  final StreamController<TaskStatusUpdate> _taskStatusController = StreamController<TaskStatusUpdate>.broadcast();
  final StreamController<TaskProgressUpdate> _taskProgressController = StreamController<TaskProgressUpdate>.broadcast();

  Stream<TaskStatusUpdate> get taskStatusStream => _taskStatusController.stream;
  Stream<TaskProgressUpdate> get taskProgressStream => _taskProgressController.stream;

  bool shouldAbortQueuingTasks = false;

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    if (!_taskProgressController.isClosed) {
      _taskProgressController.add(update);
    }
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    if (!_taskStatusController.isClosed) {
      _taskStatusController.add(update);
    }
    _handleTaskStatusUpdate(update);
  }

  void dispose() {
    _taskStatusController.close();
    _taskProgressController.close();
  }

  Future<List<bool>> enqueueTasks(List<UploadTask> tasks) {
    return _uploadRepository.enqueueBackgroundAll(tasks);
  }

  Future<List<Task>> getActiveTasks(String group) {
    return _uploadRepository.getActiveTasks(group);
  }

  Future<({int total, int remainder, int processing})> getBackupCounts(String userId) {
    return _backupRepository.getAllCounts(userId);
  }

  Future<void> manualBackup(
    List<LocalAsset> localAssets,
    CancellationToken cancelToken, {
    void Function(String localAssetId, String filename, int bytes, int totalBytes)? onProgress,
    void Function(String localAssetId, String remoteAssetId)? onSuccess,
    void Function(String localAssetId, String errorMessage)? onError,
    void Function(String localAssetId, double progress)? onICloudProgress,
  }) async {
    if (localAssets.isEmpty) {
      return;
    }

    const concurrentUploads = 3;
    final httpClients = List.generate(concurrentUploads, (_) => Client());

    await _storageRepository.clearCache();

    shouldAbortQueuingTasks = false;

    try {
      int currentIndex = 0;

      Future<void> worker(Client httpClient) async {
        while (true) {
          if (shouldAbortQueuingTasks || cancelToken.isCancelled) {
            break;
          }

          final index = currentIndex;
          if (index >= localAssets.length) {
            break;
          }
          currentIndex++;

          final asset = localAssets[index];

          await _uploadSingleAsset(
            asset,
            httpClient,
            cancelToken,
            onProgress: onProgress,
            onSuccess: onSuccess,
            onError: onError,
            onICloudProgress: onICloudProgress,
          );
        }
      }

      final workerFutures = <Future<void>>[];
      for (int i = 0; i < concurrentUploads; i++) {
        workerFutures.add(worker(httpClients[i]));
      }

      await Future.wait(workerFutures);
    } finally {
      for (final client in httpClients) {
        client.close();
      }
    }
  }

  /// Find backup candidates
  /// Build the upload tasks
  /// Enqueue the tasks
  Future<void> startUploadWithURLSession(String userId) async {
    await _storageRepository.clearCache();

    shouldAbortQueuingTasks = false;

    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      return;
    }

    const batchSize = 100;
    final batch = candidates.take(batchSize).toList();
    List<UploadTask> tasks = [];
    for (final asset in batch) {
      final task = await getUploadTask(asset);
      if (task != null) {
        tasks.add(task);
      }
    }

    if (tasks.isNotEmpty && !shouldAbortQueuingTasks) {
      await enqueueTasks(tasks);
    }
  }

  Future<void> startUploadWithHttp(
    String userId,
    bool hasWifi,
    CancellationToken cancelToken, {
    void Function(String localAssetId, String filename, int bytes, int totalBytes)? onProgress,
    void Function(String localAssetId, String remoteAssetId)? onSuccess,
    void Function(String localAssetId, String errorMessage)? onError,
    void Function(String localAssetId, double progress)? onICloudProgress,
  }) async {
    const concurrentUploads = 3;
    final httpClients = List.generate(concurrentUploads, (_) => Client());

    await _storageRepository.clearCache();

    shouldAbortQueuingTasks = false;

    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      return;
    }

    try {
      int currentIndex = 0;

      Future<void> worker(Client httpClient) async {
        while (true) {
          if (shouldAbortQueuingTasks || cancelToken.isCancelled) {
            break;
          }

          final index = currentIndex;
          if (index >= candidates.length) {
            break;
          }
          currentIndex++;

          final asset = candidates[index];

          final requireWifi = _shouldRequireWiFi(asset);
          if (requireWifi && !hasWifi) {
            continue;
          }

          await _uploadSingleAsset(
            asset,
            httpClient,
            cancelToken,
            onProgress: onProgress,
            onSuccess: onSuccess,
            onError: onError,
            onICloudProgress: onICloudProgress,
          );
        }
      }

      // Start all workers in parallel - each worker continuously pulls from the queue
      final workerFutures = <Future<void>>[];

      for (int i = 0; i < concurrentUploads; i++) {
        workerFutures.add(worker(httpClients[i]));
      }

      await Future.wait(workerFutures);
    } finally {
      for (final client in httpClients) {
        client.close();
      }
    }
  }

  Future<void> _uploadSingleAsset(
    LocalAsset asset,
    Client httpClient,
    CancellationToken cancelToken, {
    required void Function(String id, String filename, int bytes, int totalBytes)? onProgress,
    required void Function(String localAssetId, String remoteAssetId)? onSuccess,
    required void Function(String localAssetId, String errorMessage)? onError,
    required void Function(String localAssetId, double progress)? onICloudProgress,
  }) async {
    File? file;
    File? livePhotoFile;

    try {
      final entity = await _storageRepository.getAssetEntityForAsset(asset);
      if (entity == null) {
        return;
      }

      final isAvailableLocally = await _storageRepository.isAssetAvailableLocally(asset.id);

      if (!isAvailableLocally && CurrentPlatform.isIOS) {
        _logger.info("Loading iCloud asset ${asset.id} - ${asset.name}");

        // Create progress handler for iCloud download
        PMProgressHandler? progressHandler;
        StreamSubscription? progressSubscription;

        progressHandler = PMProgressHandler();
        progressSubscription = progressHandler.stream.listen((event) {
          onICloudProgress?.call(asset.localId!, event.progress);
        });

        try {
          file = await _storageRepository.loadFileFromCloud(asset.id, progressHandler: progressHandler);
          if (entity.isLivePhoto) {
            livePhotoFile = await _storageRepository.loadMotionFileFromCloud(
              asset.id,
              progressHandler: progressHandler,
            );
          }
        } finally {
          await progressSubscription.cancel();
        }
      } else {
        // Get files locally
        file = await _storageRepository.getFileForAsset(asset.id);
        if (file == null) {
          return;
        }

        // For live photos, get the motion video file
        if (entity.isLivePhoto) {
          livePhotoFile = await _storageRepository.getMotionFileForAsset(asset);
          if (livePhotoFile == null) {
            _logger.warning("Failed to obtain motion part of the livePhoto - ${asset.name}");
          }
        }
      }

      if (file == null) {
        _logger.warning("Failed to obtain file for asset ${asset.id} - ${asset.name}");
        return;
      }

      final originalFileName = entity.isLivePhoto ? p.setExtension(asset.name, p.extension(file.path)) : asset.name;
      final deviceId = Store.get(StoreKey.deviceId);

      final headers = ApiService.getRequestHeaders();
      final fields = {
        'deviceAssetId': asset.localId!,
        'deviceId': deviceId,
        'fileCreatedAt': asset.createdAt.toUtc().toIso8601String(),
        'fileModifiedAt': asset.updatedAt.toUtc().toIso8601String(),
        'isFavorite': asset.isFavorite.toString(),
        'duration': asset.duration.toString(),
      };

      // Upload live photo video first if available
      String? livePhotoVideoId;
      if (entity.isLivePhoto && livePhotoFile != null) {
        final livePhotoTitle = p.setExtension(originalFileName, p.extension(livePhotoFile.path));

        final livePhotoResult = await _uploadRepository.uploadFile(
          file: livePhotoFile,
          originalFileName: livePhotoTitle,
          headers: headers,
          fields: fields,
          httpClient: httpClient,
          cancelToken: cancelToken,
          onProgress: (bytes, totalBytes) => onProgress?.call(asset.localId!, livePhotoTitle, bytes, totalBytes),
          logContext: 'livePhotoVideo[${asset.localId}]',
        );

        if (livePhotoResult.isSuccess && livePhotoResult.remoteAssetId != null) {
          livePhotoVideoId = livePhotoResult.remoteAssetId;
        }
      }

      if (livePhotoVideoId != null) {
        fields['livePhotoVideoId'] = livePhotoVideoId;
      }

      final result = await _uploadRepository.uploadFile(
        file: file,
        originalFileName: originalFileName,
        headers: headers,
        fields: fields,
        httpClient: httpClient,
        cancelToken: cancelToken,
        onProgress: (bytes, totalBytes) => onProgress?.call(asset.localId!, originalFileName, bytes, totalBytes),
        logContext: 'asset[${asset.localId}]',
      );

      if (result.isSuccess && result.remoteAssetId != null) {
        onSuccess?.call(asset.localId!, result.remoteAssetId!);
      } else if (result.isCancelled) {
        _logger.warning(() => "Backup was cancelled by the user");
        shouldAbortQueuingTasks = true;
      } else if (result.errorMessage != null) {
        _logger.severe(
          () =>
              "Error(${result.statusCode}) uploading ${asset.localId} | $originalFileName | Created on ${asset.createdAt} | ${result.errorMessage}",
        );

        onError?.call(asset.localId!, result.errorMessage!);

        if (result.errorMessage == "Quota has been exceeded!") {
          shouldAbortQueuingTasks = true;
        }
      }
    } catch (error, stackTrace) {
      _logger.severe(() => "Error backup asset: ${error.toString()}", stackTrace);
      onError?.call(asset.localId!, error.toString());
    } finally {
      if (Platform.isIOS) {
        try {
          await file?.delete();
          await livePhotoFile?.delete();
        } catch (error, stackTrace) {
          _logger.severe(() => "ERROR deleting file: ${error.toString()}", stackTrace);
        }
      }
    }
  }

  /// Cancel all ongoing uploads and reset the upload queue
  ///
  /// Return the number of left over tasks in the queue
  Future<int> cancelBackup() async {
    shouldAbortQueuingTasks = true;

    await _storageRepository.clearCache();
    await _uploadRepository.reset(kBackupGroup);
    await _uploadRepository.deleteDatabaseRecords(kBackupGroup);

    final activeTasks = await _uploadRepository.getActiveTasks(kBackupGroup);
    return activeTasks.length;
  }

  Future<void> resumeBackup() {
    return _uploadRepository.start();
  }

  /// Upload multiple files using foreground HTTP with concurrent workers
  /// This is used for share intent uploads
  Future<void> uploadFilesWithHttp(
    List<File> files, {
    CancellationToken? cancelToken,
    void Function(String fileId, int bytes, int totalBytes)? onProgress,
    void Function(String fileId)? onSuccess,
    void Function(String fileId, String errorMessage)? onError,
  }) async {
    if (files.isEmpty) {
      return;
    }

    const concurrentUploads = 3;
    final httpClients = List.generate(concurrentUploads, (_) => Client());
    final effectiveCancelToken = cancelToken ?? CancellationToken();

    try {
      int currentIndex = 0;

      Future<void> worker(Client httpClient) async {
        while (true) {
          if (effectiveCancelToken.isCancelled) break;

          final index = currentIndex;
          if (index >= files.length) break;
          currentIndex++;

          final file = files[index];
          final fileId = p.hash(file.path).toString();

          final result = await _uploadSingleFileWithHttp(
            file,
            deviceAssetId: fileId,
            httpClient: httpClient,
            cancelToken: effectiveCancelToken,
            onProgress: (bytes, totalBytes) => onProgress?.call(fileId, bytes, totalBytes),
          );

          if (result.isSuccess) {
            onSuccess?.call(fileId);
          } else if (!result.isCancelled && result.errorMessage != null) {
            onError?.call(fileId, result.errorMessage!);
          }
        }
      }

      final workerFutures = <Future<void>>[];
      for (int i = 0; i < concurrentUploads; i++) {
        workerFutures.add(worker(httpClients[i]));
      }

      await Future.wait(workerFutures);
    } finally {
      for (final client in httpClients) {
        client.close();
      }
    }
  }

  /// Upload a single file using foreground HTTP upload
  Future<UploadResult> _uploadSingleFileWithHttp(
    File file, {
    required String deviceAssetId,
    required Client httpClient,
    required CancellationToken cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
  }) async {
    try {
      final stats = await file.stat();
      final fileCreatedAt = stats.changed;
      final fileModifiedAt = stats.modified;
      final filename = p.basename(file.path);

      final headers = ApiService.getRequestHeaders();
      final deviceId = Store.get(StoreKey.deviceId);

      final fields = {
        'deviceAssetId': deviceAssetId,
        'deviceId': deviceId,
        'fileCreatedAt': fileCreatedAt.toUtc().toIso8601String(),
        'fileModifiedAt': fileModifiedAt.toUtc().toIso8601String(),
        'isFavorite': 'false',
        'duration': '0',
      };

      return await _uploadRepository.uploadFile(
        file: file,
        originalFileName: filename,
        headers: headers,
        fields: fields,
        httpClient: httpClient,
        cancelToken: cancelToken,
        onProgress: onProgress ?? (_, __) {},
        logContext: 'shareIntent[$deviceAssetId]',
      );
    } catch (e) {
      return UploadResult.error(errorMessage: e.toString());
    }
  }

  void _handleTaskStatusUpdate(TaskStatusUpdate update) async {
    switch (update.status) {
      case TaskStatus.complete:
        unawaited(_handleLivePhoto(update));

        if (CurrentPlatform.isIOS) {
          try {
            final path = await update.task.filePath();
            await File(path).delete();
          } catch (e) {
            _logger.severe('Error deleting file path for iOS: $e');
          }
        }

        break;

      default:
        break;
    }
  }

  Future<void> _handleLivePhoto(TaskStatusUpdate update) async {
    try {
      if (update.task.metaData.isEmpty || update.task.metaData == '') {
        return;
      }

      final metadata = UploadTaskMetadata.fromJson(update.task.metaData);
      if (!metadata.isLivePhotos) {
        return;
      }

      if (update.responseBody == null || update.responseBody!.isEmpty) {
        return;
      }
      final response = jsonDecode(update.responseBody!);

      final localAsset = await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }

      final uploadTask = await getLivePhotoUploadTask(localAsset, response['id'] as String);

      if (uploadTask == null) {
        return;
      }

      await enqueueTasks([uploadTask]);
    } catch (error, stackTrace) {
      dPrint(() => "Error handling live photo upload task: $error $stackTrace");
    }
  }

  @visibleForTesting
  Future<UploadTask?> getUploadTask(LocalAsset asset, {String group = kBackupGroup, int? priority}) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    File? file;

    /// iOS LivePhoto has two files: a photo and a video.
    /// They are uploaded separately, with video file being upload first, then returned with the assetId
    /// The assetId is then used as a metadata for the photo file upload task.
    ///
    /// We implement two separate upload groups for this, the normal one for the video file
    /// and the higher priority group for the photo file because the video file is already uploaded.
    ///
    /// The cancel operation will only cancel the video group (normal group), the photo group will not
    /// be touched, as the video file is already uploaded.

    if (entity.isLivePhoto) {
      file = await _storageRepository.getMotionFileForAsset(asset);
    } else {
      file = await _storageRepository.getFileForAsset(asset.id);
    }

    if (file == null) {
      return null;
    }

    final fileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;
    final originalFileName = entity.isLivePhoto ? p.setExtension(fileName, p.extension(file.path)) : fileName;

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      livePhotoVideoId: '',
    ).toJson();

    final requiresWiFi = _shouldRequireWiFi(asset);

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      metadata: metadata,
      group: group,
      priority: priority,
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
    );
  }

  @visibleForTesting
  Future<UploadTask?> getLivePhotoUploadTask(LocalAsset asset, String livePhotoVideoId) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset.id);
    if (file == null) {
      return null;
    }

    final fields = {'livePhotoVideoId': livePhotoVideoId};

    final requiresWiFi = _shouldRequireWiFi(asset);
    final originalFileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;

    return buildUploadTask(
      file,
      createdAt: asset.createdAt,
      modifiedAt: asset.updatedAt,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      fields: fields,
      group: kBackupLivePhotoGroup,
      priority: 0, // Highest priority to get upload immediately
      isFavorite: asset.isFavorite,
      requiresWiFi: requiresWiFi,
    );
  }

  bool _shouldRequireWiFi(LocalAsset asset) {
    bool requiresWiFi = true;

    if (asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadVideos)) {
      requiresWiFi = false;
    } else if (!asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadPhotos)) {
      requiresWiFi = false;
    }

    return requiresWiFi;
  }

  Future<UploadTask> buildUploadTask(
    File file, {
    required String group,
    required DateTime createdAt,
    required DateTime modifiedAt,
    Map<String, String>? fields,
    String? originalFileName,
    String? deviceAssetId,
    String? metadata,
    int? priority,
    bool? isFavorite,
    bool requiresWiFi = true,
  }) async {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);
    final (baseDirectory, directory, filename) = await Task.split(filePath: file.path);
    final fieldsMap = {
      'filename': originalFileName ?? filename,
      'deviceAssetId': deviceAssetId ?? '',
      'deviceId': deviceId,
      'fileCreatedAt': createdAt.toUtc().toIso8601String(),
      'fileModifiedAt': modifiedAt.toUtc().toIso8601String(),
      'isFavorite': isFavorite?.toString() ?? 'false',
      'duration': '0',
      if (fields != null) ...fields,
    };

    return UploadTask(
      taskId: deviceAssetId,
      displayName: originalFileName ?? filename,
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      baseDirectory: baseDirectory,
      directory: directory,
      fileField: 'assetData',
      metaData: metadata ?? '',
      group: group,
      requiresWiFi: requiresWiFi,
      priority: priority ?? 5,
      updates: Updates.statusAndProgress,
      retries: 3,
    );
  }
}

class UploadTaskMetadata {
  final String localAssetId;
  final bool isLivePhotos;
  final String livePhotoVideoId;

  const UploadTaskMetadata({required this.localAssetId, required this.isLivePhotos, required this.livePhotoVideoId});

  UploadTaskMetadata copyWith({String? localAssetId, bool? isLivePhotos, String? livePhotoVideoId}) {
    return UploadTaskMetadata(
      localAssetId: localAssetId ?? this.localAssetId,
      isLivePhotos: isLivePhotos ?? this.isLivePhotos,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'localAssetId': localAssetId,
      'isLivePhotos': isLivePhotos,
      'livePhotoVideoId': livePhotoVideoId,
    };
  }

  factory UploadTaskMetadata.fromMap(Map<String, dynamic> map) {
    return UploadTaskMetadata(
      localAssetId: map['localAssetId'] as String,
      isLivePhotos: map['isLivePhotos'] as bool,
      livePhotoVideoId: map['livePhotoVideoId'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory UploadTaskMetadata.fromJson(String source) =>
      UploadTaskMetadata.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'UploadTaskMetadata(localAssetId: $localAssetId, isLivePhotos: $isLivePhotos, livePhotoVideoId: $livePhotoVideoId)';

  @override
  bool operator ==(covariant UploadTaskMetadata other) {
    if (identical(this, other)) return true;

    return other.localAssetId == localAssetId &&
        other.isLivePhotos == isLivePhotos &&
        other.livePhotoVideoId == livePhotoVideoId;
  }

  @override
  int get hashCode => localAssetId.hashCode ^ isLivePhotos.hashCode ^ livePhotoVideoId.hashCode;
}
