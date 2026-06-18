import 'dart:async';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/edit_revert.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/network_capability_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/platform/connectivity_api.g.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/stack.provider.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/cloud_metadata.dart';
import 'package:immich_mobile/services/edit_pair.dart';
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
    ref.watch(assetMediaRepositoryProvider),
    ref.watch(nativeSyncApiProvider),
    ref.watch(localAssetRepository),
    ref.watch(editRevertServiceProvider),
    ref.watch(driftStackProvider),
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
    this._assetMediaRepository,
    this._nativeSyncApi,
    this._localAssetRepository,
    this._editRevertService,
    this._stackRepository,
  );

  final UploadRepository _uploadRepository;
  final StorageRepository _storageRepository;
  final DriftBackupRepository _backupRepository;
  final ConnectivityApi _connectivityApi;
  final AssetMediaRepository _assetMediaRepository;
  final NativeSyncApi _nativeSyncApi;
  final DriftLocalAssetRepository _localAssetRepository;
  final EditRevertService _editRevertService;
  final DriftStackRepository _stackRepository;
  final Logger _logger = Logger('ForegroundUploadService');

  bool shouldAbortUpload = false;

  Future<({int total, int remainder, int processing})> getBackupCounts(String userId) {
    return _backupRepository.getAllCounts(userId);
  }

  Future<List<LocalAsset>> getBackupCandidates(String userId, {bool onlyHashed = true}) {
    return _backupRepository.getCandidates(userId, onlyHashed: onlyHashed);
  }

  /// Bulk upload of backup candidates from selected albums
  /// Returns the number of candidates this pass attempted (after [skipIds]
  /// filtering), so the multi-pass driver can stop as soon as a pass has nothing
  /// left to do instead of walking the candidate set one extra time.
  Future<({int attempted, bool hadBurst})> uploadCandidates(
    String userId,
    Completer<void> cancelToken, {
    UploadCallbacks callbacks = const UploadCallbacks(),
    bool useSequentialUpload = false,
    Set<String>? skipIds,
  }) async {
    var candidates = await _backupRepository.getCandidates(userId);
    if (skipIds != null && skipIds.isNotEmpty) {
      // Multi-pass driver passes the ids it already uploaded this session: a
      // freshly uploaded asset stays a candidate until its remote row syncs back
      // locally, so skipping it here stops the next pass re-uploading it (the
      // server would just dedup it, wasting the transfer).
      candidates = candidates.where((a) => !skipIds.contains(a.id)).toList();
    }
    if (candidates.isEmpty) {
      return (attempted: 0, hadBurst: false);
    }
    // Burst frames may unblock more candidates next pass (a member only becomes
    // eligible once its representative has uploaded), so the driver keeps going.
    // Without burst frames this pass is final - no wasted follow-up query.
    final hadBurst = candidates.any((a) => a.burstId != null);

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
        processItem: (asset) => _uploadSingleAsset(asset, cancelToken, callbacks: callbacks),
      );
    }
    return (attempted: candidates.length, hadBurst: hadBurst);
  }

  /// Sequential upload - used for background isolate where concurrent HTTP clients may cause issues
  Future<void> _uploadSequentially({
    required List<LocalAsset> items,
    required Completer<void> cancelToken,
    required bool hasWifi,
    required UploadCallbacks callbacks,
  }) async {
    await _storageRepository.clearCache();
    shouldAbortUpload = false;

    for (final asset in items) {
      if (shouldAbortUpload || cancelToken.isCompleted) {
        break;
      }

      final requireWifi = _shouldRequireWiFi(asset);
      if (requireWifi && !hasWifi) {
        _logger.warning('Skipping upload for ${asset.id} because it requires WiFi');
        continue;
      }

      await _uploadSingleAsset(asset, cancelToken, callbacks: callbacks);
    }
  }

  /// Manually upload picked local assets
  Future<void> uploadManual(
    List<LocalAsset> localAssets, {
    Completer<void>? cancelToken,
    UploadCallbacks callbacks = const UploadCallbacks(),
  }) async {
    if (localAssets.isEmpty) {
      return;
    }

    await _executeWithWorkerPool<LocalAsset>(
      items: localAssets,
      cancelToken: cancelToken,
      processItem: (asset) => _uploadSingleAsset(asset, cancelToken, callbacks: callbacks, surfaceDefers: true),
    );
  }

  /// Upload files from shared intent
  Future<void> uploadShareIntent(
    List<File> files, {
    Completer<void>? cancelToken,
    void Function(String fileId, int bytes, int totalBytes)? onProgress,
    void Function(String fileId, String remoteAssetId)? onSuccess,
    void Function(String fileId, String errorMessage)? onError,
  }) async {
    if (files.isEmpty) {
      return;
    }
    await _executeWithWorkerPool<File>(
      items: files,
      cancelToken: cancelToken,
      processItem: (file) async {
        final fileId = p.hash(file.path).toString();

        final result = await _uploadSingleFile(
          file,
          deviceAssetId: fileId,
          cancelToken: cancelToken,
          onProgress: (bytes, totalBytes) => onProgress?.call(fileId, bytes, totalBytes),
        );

        if (result.isSuccess) {
          onSuccess?.call(fileId, result.remoteAssetId!);
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
    required Completer<void>? cancelToken,
    required Future<void> Function(T item) processItem,
    bool Function(T item)? shouldSkip,
    int concurrentWorkers = 3,
  }) async {
    await _storageRepository.clearCache();
    shouldAbortUpload = false;

    int currentIndex = 0;

    Future<void> worker() async {
      while (true) {
        if (shouldAbortUpload || (cancelToken != null && cancelToken.isCompleted)) {
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

        await processItem(item);
      }
    }

    final workerFutures = <Future<void>>[];
    for (int i = 0; i < concurrentWorkers; i++) {
      workerFutures.add(worker());
    }

    await Future.wait(workerFutures);
  }

  // Multipart fields common to every asset upload. deviceAssetId/deviceId are
  // required by server v2.7.5 and below (drop in v4.0 per #27818). Returns a
  // fresh mutable map so callers can add stackParentId/metadata/etc.
  Map<String, String> _baseUploadFields(LocalAsset asset) => {
    'deviceAssetId': asset.localId!,
    'deviceId': Store.get(StoreKey.deviceId),
    'fileCreatedAt': asset.createdAt.toUtc().toIso8601String(),
    'fileModifiedAt': asset.updatedAt.toUtc().toIso8601String(),
    'isFavorite': asset.isFavorite.toString(),
    'duration': (asset.durationMs ?? 0).toString(),
  };

  Future<void> _uploadSingleAsset(
    LocalAsset asset,
    Completer<void>? cancelToken, {
    required UploadCallbacks callbacks,
    bool surfaceDefers = false,
  }) async {
    // iOS burst non-representative: photo_manager can't resolve it (the entity
    // lookup below returns null), so fetch its bytes natively and upload it
    // stacked under the burst anchor. Burst frames are never edited or live, so
    // they skip the edit-pair + live-photo handling entirely.
    if (CurrentPlatform.isIOS && asset.burstId != null && !asset.isBurstRepresentative) {
      await _uploadBurstMember(asset, cancelToken, callbacks: callbacks);
      return;
    }

    File? file;
    File? livePhotoFile;

    try {
      final entity = await _storageRepository.getAssetEntityForAsset(asset);
      if (entity == null) {
        callbacks.onError?.call(
          asset.localId!,
          CurrentPlatform.isAndroid ? "asset_not_found_on_device_android".t() : "asset_not_found_on_device_ios".t(),
        );
        return;
      }

      // A reverted iOS edit flips the stack back to the original and skips the upload.
      // Works for live photos too — getEditState reads the adjustment plist, which is
      // media-agnostic. Report the flipped-to base, not the pre-flip prior (the edit
      // being reverted away) — album-add consumers link whatever id this reports.
      if (CurrentPlatform.isIOS && asset.priorRemoteId != null) {
        final revertedTo = await _editRevertService.tryHandleRevert(asset);
        if (revertedTo != null) {
          callbacks.onSuccess?.call(asset.localId!, revertedTo);
          return;
        }
      }

      final fields = _baseUploadFields(asset);

      // Edit pair: upload the unedited original first and stack the edit onto it. For a
      // live photo that's the original still+video pair; this upload stays the edit and
      // its own edited motion uploads after, below. Resolved before anything is
      // materialized so a deferred or failed pair doesn't burn an iCloud download or a
      // motion upload every retry cycle, and before the edit's metadata is added so the
      // base isn't stamped with the edit's adjustmentTime.
      final base = await _resolveStackParent(asset, Map.of(fields), cancelToken, isLivePhoto: entity.isLivePhoto);
      if (base.deferred) {
        // Undecidable right now (prior in server trash, or the original couldn't be
        // read). The asset stays a candidate; auto backup retries silently, a manual
        // upload tells the user why nothing happened.
        _logger.fine(() => "Deferring upload for ${asset.localId}: edit pair undecidable this cycle");
        if (surfaceDefers) {
          callbacks.onError?.call(asset.localId!, "upload_deferred_edit_pair".t());
        }
        return;
      }
      if (base.baseFailed) {
        // The original couldn't be uploaded. Don't upload the edit on its own and mark
        // it synced — that would permanently drop the original from backup. Leave the
        // whole pair as a candidate to retry next cycle.
        _logger.warning(() => "Base upload failed for ${asset.localId}, retrying the pair later");
        if (base.isCancelled) {
          shouldAbortUpload = true;
          return;
        }
        if (base.errorMessage != null) {
          callbacks.onError?.call(asset.localId!, base.errorMessage!);
          if (base.errorMessage == _kQuotaError) {
            shouldAbortUpload = true;
          }
        }
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
          _logger.warning("Failed to get file ${asset.id} - ${asset.name}");
          callbacks.onError?.call(
            asset.localId!,
            CurrentPlatform.isAndroid ? "asset_not_found_on_device_android".t() : "asset_not_found_on_device_ios".t(),
          );
          return;
        }

        // For live photos, get the motion video file
        if (entity.isLivePhoto) {
          livePhotoFile = await _storageRepository.getMotionFileForAsset(asset);
          if (livePhotoFile == null) {
            _logger.warning("Failed to obtain motion part of the livePhoto - ${asset.name}");
            callbacks.onError?.call(
              asset.localId!,
              CurrentPlatform.isAndroid ? "asset_not_found_on_device_android".t() : "asset_not_found_on_device_ios".t(),
            );
          }
        }
      }

      if (file == null) {
        _logger.warning("Failed to obtain file from iCloud for asset ${asset.id} - ${asset.name}");
        callbacks.onError?.call(asset.localId!, "asset_not_found_on_icloud".t());
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

      if (base.stackParentId != null) {
        fields['stackParentId'] = base.stackParentId!;
      }

      // The edit's own motion video, uploaded hidden so it never flashes onto the
      // timeline before the still below links it.
      String? livePhotoVideoId;
      if (entity.isLivePhoto && livePhotoFile != null) {
        final livePhotoTitle = p.setExtension(originalFileName, p.extension(livePhotoFile.path));

        final onProgress = callbacks.onProgress;
        final livePhotoResult = await _uploadRepository.uploadFile(
          file: livePhotoFile,
          originalFileName: livePhotoTitle,
          fields: {...fields, 'visibility': kHiddenVisibility}..remove('stackParentId'),
          cancelToken: cancelToken,
          onProgress: onProgress != null
              ? (bytes, totalBytes) => onProgress(asset.localId!, livePhotoTitle, bytes, totalBytes)
              : null,
          logContext: 'livePhotoVideo[${asset.localId}]',
        );

        if (livePhotoResult.isSuccess && livePhotoResult.remoteAssetId != null) {
          livePhotoVideoId = livePhotoResult.remoteAssetId;
        } else if (livePhotoResult.isCancelled) {
          shouldAbortUpload = true;
          return;
        } else if (livePhotoResult.errorMessage == _kQuotaError) {
          callbacks.onError?.call(asset.localId!, livePhotoResult.errorMessage!);
          shouldAbortUpload = true;
          return;
        }
      }

      if (livePhotoVideoId != null) {
        fields['livePhotoVideoId'] = livePhotoVideoId;
      }

      // Add cloudId metadata only to the still image, not the motion video, becasue when the sync id happens, the motion video can get associated with the wrong still image.
      final metadata = _cloudMetadata(asset, includeAdjustment: true);
      if (metadata != null) {
        fields['metadata'] = metadata;
      }

      final onProgress = callbacks.onProgress;
      final result = await _uploadRepository.uploadFile(
        file: file,
        originalFileName: originalFileName,
        fields: fields,
        cancelToken: cancelToken,
        onProgress: onProgress != null
            ? (bytes, totalBytes) => onProgress(asset.localId!, originalFileName, bytes, totalBytes)
            : null,
        logContext: 'asset[${asset.localId}]',
      );

      if (result.isSuccess && result.remoteAssetId != null) {
        // Edit stacking is iOS-only; leave the columns untouched on Android so the
        // candidate guard and merged-timeline hide clause never engage there.
        if (CurrentPlatform.isIOS) {
          unawaited(
            _localAssetRepository
                .markSynced(asset.localId!, priorRemoteId: result.remoteAssetId!, syncedChecksum: asset.checksum)
                .catchError(
                  (Object error, StackTrace stack) =>
                      _logger.warning(() => "Failed to mark ${asset.localId} synced", error, stack),
                ),
          );
        }
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

        if (result.errorMessage == _kQuotaError) {
          shouldAbortUpload = true;
        }
        if (result.errorMessage!.contains(kDeadStackParentError)) {
          // The stamped prior no longer exists server-side; drop the stamps so
          // the next cycle re-resolves fresh instead of looping on the dead id.
          unawaited(
            _localAssetRepository
                .clearSyncStamps(asset.localId!)
                .catchError(
                  (Object error, StackTrace stack) =>
                      _logger.warning(() => "Failed to clear stamps for ${asset.localId}", error, stack),
                ),
          );
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

  /// Foreground upload of an iOS burst non-representative member. Streams the
  /// same rendition the hash measured ([NativeSyncApi.getCurrentResource]) — the
  /// member is invisible to photo_manager and matching the hashed bytes keeps it
  /// merging with its local — and stacks it under the burst anchor with
  /// `keepPrimary` so the representative stays the primary. Gated until the
  /// representative has uploaded; returns silently to be retried by the backup
  /// loop once the anchor resolves.
  Future<void> _uploadBurstMember(
    LocalAsset asset,
    Completer<void>? cancelToken, {
    required UploadCallbacks callbacks,
  }) async {
    final ownerId = Store.tryGet(StoreKey.currentUser)?.id;
    final parentRemoteId = await _localAssetRepository.getBurstParentRemoteId(asset.burstId!, ownerId: ownerId);
    if (parentRemoteId == null) {
      // No anchor. A rep-less group (Keep Everything / re-pick) can never anchor,
      // so upload the frame standalone instead of gating forever; if a rep still
      // exists the member is just waiting for it to upload.
      if (await _localAssetRepository.burstHasRepresentative(asset.burstId!)) {
        return;
      }
    }

    BaseResource? resource;
    try {
      resource = await _nativeSyncApi.getCurrentResource(asset.id, allowNetworkAccess: true);
    } catch (error, stack) {
      _logger.warning(() => "burst getCurrentResource failed for ${asset.id}: $error", error, stack);
    }
    if (resource == null) {
      callbacks.onError?.call(asset.localId!, "asset_not_found_on_device_ios".t());
      return;
    }

    final file = File(resource.path);
    try {
      // Rep-less group → standalone (no stack); otherwise stack under the anchor.
      final fields = _baseUploadFields(asset)..addAll(burstStackFields(parentRemoteId));
      final metadata = _cloudMetadata(asset, includeAdjustment: true);
      if (metadata != null) {
        fields['metadata'] = metadata;
      }
      final originalFileName = p.setExtension(
        await _assetMediaRepository.getOriginalFilename(asset.id) ?? asset.name,
        p.extension(resource.path),
      );

      final onProgress = callbacks.onProgress;
      final result = await _uploadRepository.uploadFile(
        file: file,
        originalFileName: originalFileName,
        fields: fields,
        cancelToken: cancelToken,
        onProgress: onProgress != null
            ? (bytes, totalBytes) => onProgress(asset.localId!, originalFileName, bytes, totalBytes)
            : null,
        logContext: 'burstMember[${asset.localId}]',
      );

      if (result.isSuccess && result.remoteAssetId != null) {
        unawaited(
          _localAssetRepository
              .markSynced(asset.localId!, priorRemoteId: result.remoteAssetId!, syncedChecksum: asset.checksum)
              .catchError(
                (Object error, StackTrace stack) =>
                    _logger.warning(() => "Failed to mark burst member ${asset.localId} synced", error, stack),
              ),
        );
        callbacks.onSuccess?.call(asset.localId!, result.remoteAssetId!);
      } else if (result.isCancelled) {
        shouldAbortUpload = true;
      } else if (result.errorMessage != null) {
        callbacks.onError?.call(asset.localId!, result.errorMessage!);
        if (result.errorMessage == _kQuotaError) {
          shouldAbortUpload = true;
        }
      }
    } catch (error, stackTrace) {
      _logger.severe(() => "Error uploading burst member ${asset.localId}: $error", stackTrace);
      callbacks.onError?.call(asset.localId!, error.toString());
    } finally {
      if (Platform.isIOS) {
        try {
          await file.delete();
        } catch (_) {}
      }
    }
  }

  /// iOS still-image cloudId metadata as a JSON field, or null when there's
  /// nothing to attach. The base resource omits adjustmentTime (it's the
  /// unedited original); the edit includes it.
  String? _cloudMetadata(LocalAsset asset, {required bool includeAdjustment}) {
    return cloudMetadataJson(
      cloudId: asset.cloudId,
      createdAt: asset.createdAt,
      adjustmentTime: includeAdjustment ? asset.adjustmentTime?.toIso8601String() : null,
      latitude: asset.latitude?.toString(),
      longitude: asset.longitude?.toString(),
    );
  }

  /// Persists the uploaded base as the asset's prior so an interrupted run resumes
  /// by stacking onto it (AbsorbIntoPrior) instead of re-reading and re-uploading
  /// the original. syncedChecksum stays null: the edit itself is still pending.
  Future<void> _stampBaseUpload(LocalAsset asset, String baseRemoteId) async {
    try {
      await _localAssetRepository.markSynced(asset.localId!, priorRemoteId: baseRemoteId, syncedChecksum: null);
    } catch (error, stack) {
      _logger.warning(() => "Failed to stamp base upload for ${asset.localId}", error, stack);
    }
  }

  /// For an edited iOS photo, uploads the original camera bytes so the edit can
  /// stack onto it. See [_StackParent] for the outcome.
  Future<_StackParent> _resolveStackParent(
    LocalAsset asset,
    Map<String, String> baseFields,
    Completer<void>? cancelToken, {
    bool isLivePhoto = false,
  }) async {
    if (!CurrentPlatform.isIOS) {
      return const _StackParent.none();
    }

    final plan = await resolveEditPair(
      _nativeSyncApi,
      asset,
      stackRepository: _stackRepository,
      ownerId: Store.tryGet(StoreKey.currentUser)?.id,
      log: _logger,
      isLivePhoto: isLivePhoto,
    );
    switch (plan) {
      case NoEditPair():
        return const _StackParent.none();
      case DeferEditPair():
        return const _StackParent.deferred();
      case AbsorbIntoPrior(:final parentId):
        return _StackParent.parent(parentId);
      case UploadBaseLivePhotoFirst(:final still, :final video):
        return _uploadBaseLivePair(asset, baseFields, still, video, cancelToken);
      case UploadBaseFirst(:final base):
        final baseFile = File(base.path);
        try {
          final fields = Map.of(baseFields);
          final metadata = _cloudMetadata(asset, includeAdjustment: false);
          if (metadata != null) {
            fields['metadata'] = metadata;
          }
          final result = await _uploadRepository.uploadFile(
            file: baseFile,
            originalFileName: p.setExtension(asset.name, p.extension(base.path)),
            fields: fields,
            cancelToken: cancelToken,
            logContext: 'baseResource[${asset.localId}]',
          );
          if (result.isSuccess && result.remoteAssetId != null) {
            await _stampBaseUpload(asset, result.remoteAssetId!);
            return _StackParent.parent(result.remoteAssetId!);
          }
          return _StackParent.failed(errorMessage: result.errorMessage, isCancelled: result.isCancelled);
        } finally {
          try {
            await baseFile.delete();
          } catch (_) {}
        }
    }
  }

  /// Uploads the original live pair (paired video then still) so the edited live photo
  /// can stack onto the original still. Returns the still's remote id as the parent, or
  /// [_StackParent.failed] if either hop fails so the edit isn't left unstacked.
  Future<_StackParent> _uploadBaseLivePair(
    LocalAsset asset,
    Map<String, String> baseFields,
    BaseResource still,
    BaseResource? video,
    Completer<void>? cancelToken,
  ) async {
    final stillFile = File(still.path);
    final videoFile = video != null ? File(video.path) : null;
    try {
      final fields = Map.of(baseFields);

      String? baseVideoId;
      if (videoFile != null) {
        final videoResult = await _uploadRepository.uploadFile(
          file: videoFile,
          originalFileName: p.setExtension(asset.name, p.extension(videoFile.path)),
          // hidden so the original motion never flashes onto the timeline (copy: the
          // base still upload below reuses `fields`).
          fields: {...fields, 'visibility': kHiddenVisibility},
          cancelToken: cancelToken,
          logContext: 'baseLiveVideo[${asset.localId}]',
        );
        if (!(videoResult.isSuccess && videoResult.remoteAssetId != null)) {
          return _StackParent.failed(errorMessage: videoResult.errorMessage, isCancelled: videoResult.isCancelled);
        }
        baseVideoId = videoResult.remoteAssetId;
      }

      if (baseVideoId != null) {
        fields['livePhotoVideoId'] = baseVideoId;
      }
      final metadata = _cloudMetadata(asset, includeAdjustment: false);
      if (metadata != null) {
        fields['metadata'] = metadata;
      }

      final stillResult = await _uploadRepository.uploadFile(
        file: stillFile,
        originalFileName: p.setExtension(asset.name, p.extension(still.path)),
        fields: fields,
        cancelToken: cancelToken,
        logContext: 'baseLiveStill[${asset.localId}]',
      );
      if (stillResult.isSuccess && stillResult.remoteAssetId != null) {
        await _stampBaseUpload(asset, stillResult.remoteAssetId!);
        return _StackParent.parent(stillResult.remoteAssetId!);
      }
      return _StackParent.failed(errorMessage: stillResult.errorMessage, isCancelled: stillResult.isCancelled);
    } finally {
      try {
        await stillFile.delete();
      } catch (_) {}
      try {
        await videoFile?.delete();
      } catch (_) {}
    }
  }

  Future<UploadResult> _uploadSingleFile(
    File file, {
    required String deviceAssetId,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
  }) async {
    try {
      final stats = await file.stat();
      final fileCreatedAt = stats.changed;
      final fileModifiedAt = stats.modified;
      final filename = p.basename(file.path);

      final fields = {
        // deviceAssetId/deviceId required by server v2.7.5 and below (drop in v4.0 per #27818).
        'deviceAssetId': deviceAssetId,
        'deviceId': Store.get(StoreKey.deviceId),
        'fileCreatedAt': fileCreatedAt.toUtc().toIso8601String(),
        'fileModifiedAt': fileModifiedAt.toUtc().toIso8601String(),
        'isFavorite': 'false',
        'duration': '0',
      };

      return await _uploadRepository.uploadFile(
        file: file,
        originalFileName: filename,
        fields: fields,
        cancelToken: cancelToken,
        onProgress: onProgress,
        logContext: 'shareIntent[$deviceAssetId]',
      );
    } catch (e) {
      return UploadResult.error(errorMessage: e.toString());
    }
  }

  bool _shouldRequireWiFi(LocalAsset asset) {
    final backup = SettingsRepository.instance.appConfig.backup;
    if (asset.isVideo && backup.useCellularForVideos) {
      return false;
    }
    if (!asset.isVideo && backup.useCellularForPhotos) {
      return false;
    }
    return true;
  }
}

// Server's quota-rejection message (asset-media.service.ts requireQuota).
const String _kQuotaError = "Quota has been exceeded!";

/// Outcome of resolving an edit's stack parent. [stackParentId] is the remote id
/// to stack onto (null when the asset isn't an edit). [baseFailed] is true only
/// when the original was found but its upload failed, so the edit must not be
/// uploaded on its own; [deferred] means skip the asset this cycle (it stays a
/// candidate); [errorMessage]/[isCancelled] carry why a failure happened so the
/// caller can surface it and react to quota/cancel like the main upload does.
class _StackParent {
  final String? stackParentId;
  final bool baseFailed;
  final bool deferred;
  final String? errorMessage;
  final bool isCancelled;

  const _StackParent.none()
    : stackParentId = null,
      baseFailed = false,
      deferred = false,
      errorMessage = null,
      isCancelled = false;
  const _StackParent.parent(String this.stackParentId)
    : baseFailed = false,
      deferred = false,
      errorMessage = null,
      isCancelled = false;
  const _StackParent.failed({this.errorMessage, this.isCancelled = false})
    : stackParentId = null,
      baseFailed = true,
      deferred = false;
  const _StackParent.deferred()
    : stackParentId = null,
      baseFailed = false,
      deferred = true,
      errorMessage = null,
      isCancelled = false;
}
