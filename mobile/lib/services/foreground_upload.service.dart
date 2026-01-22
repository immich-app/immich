import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:cancellation_token_http/http.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/asset_metadata.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/network_capability_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;
import 'package:photo_manager/photo_manager.dart' show PMProgressHandler;

/// Callbacks for upload progress and status updates
class UploadCallbacks {
  final void Function(String id, String filename, int bytes, int totalBytes)? onProgress;
  final void Function(String localId, String remoteId)? onSuccess;
  final void Function(String id, String errorMessage)? onError;
  final void Function(String id, double progress)? onICloudProgress;

  const UploadCallbacks({this.onProgress, this.onSuccess, this.onError, this.onICloudProgress});
}

final foregroundUploadServiceProvider = Provider((ref) {
  return ForegroundUploadService(
    ref.watch(uploadRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(backupRepositoryProvider),
    ref.watch(connectivityApiProvider),
    ref.watch(appSettingsServiceProvider),
    ref.watch(assetMediaRepositoryProvider),
  );
});

/// Service for handling foreground HTTP uploads
///
/// This service handles synchronous uploads using HTTP client with
/// concurrent worker pools. Used for manual backups, auto backups
/// (foreground mode), and share intent uploads.
class ForegroundUploadService {
  ForegroundUploadService(
    this._uploadRepository,
    this._storageRepository,
    this._backupRepository,
    this._connectivityApi,
    this._appSettingsService,
    this._assetMediaRepository,
  );

  final UploadRepository _uploadRepository;
  final StorageRepository _storageRepository;
  final DriftBackupRepository _backupRepository;
  final ConnectivityApi _connectivityApi;
  final AppSettingsService _appSettingsService;
  final AssetMediaRepository _assetMediaRepository;
  final Logger _logger = Logger('ForegroundUploadService');

  bool shouldAbortUpload = false;

  Future<({int total, int remainder, int processing})> getBackupCounts(String userId) {
    return _backupRepository.getAllCounts(userId);
  }

  Future<List<LocalAsset>> getBackupCandidates(String userId, {bool onlyHashed = true}) {
    return _backupRepository.getCandidates(userId, onlyHashed: onlyHashed);
  }

  /// Bulk upload of backup candidates from selected albums
  Future<void> uploadCandidates(
    String userId,
    CancellationToken cancelToken, {
    UploadCallbacks callbacks = const UploadCallbacks(),
    bool useSequentialUpload = false,
  }) async {
    final candidates = await _backupRepository.getCandidates(userId);
    if (candidates.isEmpty) {
      return;
    }

    final networkCapabilities = await _connectivityApi.getCapabilities();
    final hasWifi = networkCapabilities.isUnmetered;
    _logger.info('Network capabilities: $networkCapabilities, hasWifi/isUnmetered: $hasWifi');

    if (useSequentialUpload) {
      await _uploadSequentially(items: candidates, cancelToken: cancelToken, hasWifi: hasWifi, callbacks: callbacks);
    } else {
      await _executeWithWorkerPool<LocalAsset>(
        items: candidates,
        cancelToken: cancelToken,
        shouldSkip: (asset) {
          final requireWifi = _shouldRequireWiFi(asset);
          return requireWifi && !hasWifi;
        },
        processItem: (asset, httpClient) => _uploadSingleAsset(asset, httpClient, cancelToken, callbacks: callbacks),
      );
    }
  }

  /// Sequential upload - used for background isolate where concurrent HTTP clients may cause issues
  Future<void> _uploadSequentially({
    required List<LocalAsset> items,
    required CancellationToken cancelToken,
    required bool hasWifi,
    required UploadCallbacks callbacks,
  }) async {
    final httpClient = Client();
    await _storageRepository.clearCache();
    shouldAbortUpload = false;

    try {
      for (final asset in items) {
        if (shouldAbortUpload || cancelToken.isCancelled) {
          break;
        }

        final requireWifi = _shouldRequireWiFi(asset);
        if (requireWifi && !hasWifi) {
          _logger.warning('Skipping upload for ${asset.id} because it requires WiFi');
          continue;
        }

        await _uploadSingleAsset(asset, httpClient, cancelToken, callbacks: callbacks);
      }
    } finally {
      httpClient.close();
    }
  }

  /// Manually upload picked local assets
  Future<void> uploadManual(
    List<LocalAsset> localAssets,
    CancellationToken cancelToken, {
    UploadCallbacks callbacks = const UploadCallbacks(),
  }) async {
    if (localAssets.isEmpty) {
      return;
    }

    await _executeWithWorkerPool<LocalAsset>(
      items: localAssets,
      cancelToken: cancelToken,
      processItem: (asset, httpClient) => _uploadSingleAsset(asset, httpClient, cancelToken, callbacks: callbacks),
    );
  }

  /// Upload files from shared intent
  Future<void> uploadShareIntent(
    List<File> files, {
    CancellationToken? cancelToken,
    void Function(String fileId, int bytes, int totalBytes)? onProgress,
    void Function(String fileId)? onSuccess,
    void Function(String fileId, String errorMessage)? onError,
  }) async {
    if (files.isEmpty) {
      return;
    }

    final effectiveCancelToken = cancelToken ?? CancellationToken();

    await _executeWithWorkerPool<File>(
      items: files,
      cancelToken: effectiveCancelToken,
      processItem: (file, httpClient) async {
        final fileId = p.hash(file.path).toString();

        final result = await _uploadSingleFile(
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
      },
    );
  }

  void cancel() {
    shouldAbortUpload = true;
  }

  /// Generic worker pool for concurrent uploads
  ///
  /// [items] - List of items to process
  /// [cancelToken] - Token to cancel the operation
  /// [processItem] - Function to process each item with an HTTP client
  /// [shouldSkip] - Optional function to skip items (e.g., WiFi requirement check)
  /// [concurrentWorkers] - Number of concurrent workers (default: 3)
  Future<void> _executeWithWorkerPool<T>({
    required List<T> items,
    required CancellationToken cancelToken,
    required Future<void> Function(T item, Client httpClient) processItem,
    bool Function(T item)? shouldSkip,
    int concurrentWorkers = 3,
  }) async {
    final httpClients = List.generate(concurrentWorkers, (_) => Client());

    await _storageRepository.clearCache();
    shouldAbortUpload = false;

    try {
      int currentIndex = 0;

      Future<void> worker(Client httpClient) async {
        while (true) {
          if (shouldAbortUpload || cancelToken.isCancelled) {
            break;
          }

          final index = currentIndex;
          if (index >= items.length) {
            break;
          }
          currentIndex++;

          final item = items[index];

          if (shouldSkip?.call(item) ?? false) {
            continue;
          }

          await processItem(item, httpClient);
        }
      }

      final workerFutures = <Future<void>>[];
      for (int i = 0; i < concurrentWorkers; i++) {
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
    required UploadCallbacks callbacks,
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
          callbacks.onICloudProgress?.call(asset.localId!, event.progress);
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

      String fileName = await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name;

      /// Handle special file name from DJI or Fusion app
      /// If the file name has no extension, likely due to special renaming template by specific apps
      /// we append the original extension from the asset name
      final hasExtension = p.extension(fileName).isNotEmpty;
      if (!hasExtension) {
        fileName = p.setExtension(fileName, p.extension(asset.name));
      }

      final originalFileName = entity.isLivePhoto ? p.setExtension(fileName, p.extension(file.path)) : fileName;
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
          onProgress: (bytes, totalBytes) =>
              callbacks.onProgress?.call(asset.localId!, livePhotoTitle, bytes, totalBytes),
          logContext: 'livePhotoVideo[${asset.localId}]',
        );

        if (livePhotoResult.isSuccess && livePhotoResult.remoteAssetId != null) {
          livePhotoVideoId = livePhotoResult.remoteAssetId;
        }
      }

      if (livePhotoVideoId != null) {
        fields['livePhotoVideoId'] = livePhotoVideoId;
      }

      // Add cloudId metadata only to the still image, not the motion video, becasue when the sync id happens, the motion video can get associated with the wrong still image.
      if (CurrentPlatform.isIOS && asset.cloudId != null) {
        fields['metadata'] = jsonEncode([
          RemoteAssetMetadataItem(
            key: RemoteAssetMetadataKey.mobileApp,
            value: RemoteAssetMobileAppMetadata(
              cloudId: asset.cloudId,
              createdAt: asset.createdAt.toIso8601String(),
              adjustmentTime: asset.adjustmentTime?.toIso8601String(),
              latitude: asset.latitude?.toString(),
              longitude: asset.longitude?.toString(),
            ),
          ),
        ]);
      }

      final result = await _uploadRepository.uploadFile(
        file: file,
        originalFileName: originalFileName,
        headers: headers,
        fields: fields,
        httpClient: httpClient,
        cancelToken: cancelToken,
        onProgress: (bytes, totalBytes) =>
            callbacks.onProgress?.call(asset.localId!, originalFileName, bytes, totalBytes),
        logContext: 'asset[${asset.localId}]',
      );

      if (result.isSuccess && result.remoteAssetId != null) {
        callbacks.onSuccess?.call(asset.localId!, result.remoteAssetId!);
      } else if (result.isCancelled) {
        _logger.warning(() => "Backup was cancelled by the user");
        shouldAbortUpload = true;
      } else if (result.errorMessage != null) {
        _logger.severe(
          () =>
              "Error(${result.statusCode}) uploading ${asset.localId} | $originalFileName | Created on ${asset.createdAt} | ${result.errorMessage}",
        );

        callbacks.onError?.call(asset.localId!, result.errorMessage!);

        if (result.errorMessage == "Quota has been exceeded!") {
          shouldAbortUpload = true;
        }
      }
    } catch (error, stackTrace) {
      _logger.severe(() => "Error backup asset: ${error.toString()}", stackTrace);
      callbacks.onError?.call(asset.localId!, error.toString());
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

  Future<UploadResult> _uploadSingleFile(
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

  bool _shouldRequireWiFi(LocalAsset asset) {
    bool requiresWiFi = true;

    if (asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadVideos)) {
      requiresWiFi = false;
    } else if (!asset.isVideo && _appSettingsService.getSetting(AppSettingsEnum.useCellularForUploadPhotos)) {
      requiresWiFi = false;
    }

    return requiresWiFi;
  }
}
