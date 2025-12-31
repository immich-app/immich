// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/models/backup/adaptive_state.model.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/adaptive_throttle.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

class EnqueueStatus {
  final int enqueueCount;
  final int totalCount;

  const EnqueueStatus({required this.enqueueCount, required this.totalCount});

  EnqueueStatus copyWith({int? enqueueCount, int? totalCount}) {
    return EnqueueStatus(enqueueCount: enqueueCount ?? this.enqueueCount, totalCount: totalCount ?? this.totalCount);
  }

  @override
  String toString() => 'EnqueueStatus(enqueueCount: $enqueueCount, totalCount: $totalCount)';
}

class DriftUploadStatus {
  final String taskId;
  final String filename;
  final double progress;
  final int fileSize;
  final String networkSpeedAsString;
  final bool? isFailed;
  final String? error;

  const DriftUploadStatus({
    required this.taskId,
    required this.filename,
    required this.progress,
    required this.fileSize,
    required this.networkSpeedAsString,
    this.isFailed,
    this.error,
  });

  DriftUploadStatus copyWith({
    String? taskId,
    String? filename,
    double? progress,
    int? fileSize,
    String? networkSpeedAsString,
    bool? isFailed,
    String? error,
  }) {
    return DriftUploadStatus(
      taskId: taskId ?? this.taskId,
      filename: filename ?? this.filename,
      progress: progress ?? this.progress,
      fileSize: fileSize ?? this.fileSize,
      networkSpeedAsString: networkSpeedAsString ?? this.networkSpeedAsString,
      isFailed: isFailed ?? this.isFailed,
      error: error ?? this.error,
    );
  }

  @override
  String toString() {
    return 'DriftUploadStatus(taskId: $taskId, filename: $filename, progress: $progress, fileSize: $fileSize, networkSpeedAsString: $networkSpeedAsString, isFailed: $isFailed, error: $error)';
  }

  @override
  bool operator ==(covariant DriftUploadStatus other) {
    if (identical(this, other)) return true;

    return other.taskId == taskId &&
        other.filename == filename &&
        other.progress == progress &&
        other.fileSize == fileSize &&
        other.networkSpeedAsString == networkSpeedAsString &&
        other.isFailed == isFailed &&
        other.error == error;
  }

  @override
  int get hashCode {
    return taskId.hashCode ^
        filename.hashCode ^
        progress.hashCode ^
        fileSize.hashCode ^
        networkSpeedAsString.hashCode ^
        isFailed.hashCode ^
        error.hashCode;
  }
}

enum BackupError { none, syncFailed }

class DriftBackupState {
  final int totalCount;
  final int backupCount;
  final int remainderCount;
  final int processingCount;

  final int enqueueCount;
  final int enqueueTotalCount;

  final bool isSyncing;
  final bool isCanceling;
  final BackupError error;

  final Map<String, DriftUploadStatus> uploadItems;
  
  // Parallel pipeline state
  final bool isPipelineActive;
  final bool isHashing;
  final bool isUploading;
  final String pipelineStatus;
  final AdaptiveState? adaptiveState;
  
  // Speed tracking
  final double currentSpeedBytesPerSec;
  final int totalBytesUploaded;
  final int completedCount;
  final int failedCount;

  const DriftBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
    required this.processingCount,
    required this.enqueueCount,
    required this.enqueueTotalCount,
    required this.isCanceling,
    required this.isSyncing,
    required this.uploadItems,
    this.error = BackupError.none,
    this.isPipelineActive = false,
    this.isHashing = false,
    this.isUploading = false,
    this.pipelineStatus = 'Idle',
    this.adaptiveState,
    this.currentSpeedBytesPerSec = 0,
    this.totalBytesUploaded = 0,
    this.completedCount = 0,
    this.failedCount = 0,
  });

  DriftBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
    int? processingCount,
    int? enqueueCount,
    int? enqueueTotalCount,
    bool? isCanceling,
    bool? isSyncing,
    Map<String, DriftUploadStatus>? uploadItems,
    BackupError? error,
    bool? isPipelineActive,
    bool? isHashing,
    bool? isUploading,
    String? pipelineStatus,
    AdaptiveState? adaptiveState,
    double? currentSpeedBytesPerSec,
    int? totalBytesUploaded,
    int? completedCount,
    int? failedCount,
  }) {
    return DriftBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
      processingCount: processingCount ?? this.processingCount,
      enqueueCount: enqueueCount ?? this.enqueueCount,
      enqueueTotalCount: enqueueTotalCount ?? this.enqueueTotalCount,
      isCanceling: isCanceling ?? this.isCanceling,
      isSyncing: isSyncing ?? this.isSyncing,
      uploadItems: uploadItems ?? this.uploadItems,
      error: error ?? this.error,
      isPipelineActive: isPipelineActive ?? this.isPipelineActive,
      isHashing: isHashing ?? this.isHashing,
      isUploading: isUploading ?? this.isUploading,
      pipelineStatus: pipelineStatus ?? this.pipelineStatus,
      adaptiveState: adaptiveState ?? this.adaptiveState,
      currentSpeedBytesPerSec: currentSpeedBytesPerSec ?? this.currentSpeedBytesPerSec,
      totalBytesUploaded: totalBytesUploaded ?? this.totalBytesUploaded,
      completedCount: completedCount ?? this.completedCount,
      failedCount: failedCount ?? this.failedCount,
    );
  }
  
  /// Helper to format speed as human-readable string
  String get speedFormatted {
    if (currentSpeedBytesPerSec <= 0) return '';
    if (currentSpeedBytesPerSec >= 1024 * 1024) {
      return '${(currentSpeedBytesPerSec / (1024 * 1024)).toStringAsFixed(1)} MB/s';
    } else if (currentSpeedBytesPerSec >= 1024) {
      return '${(currentSpeedBytesPerSec / 1024).toStringAsFixed(1)} KB/s';
    }
    return '${currentSpeedBytesPerSec.toStringAsFixed(0)} B/s';
  }
  
  /// Count of actively uploading items
  int get activeUploadCount => uploadItems.values.where((u) => !u.isFailed! && u.progress < 1.0).length;
  
  /// Count of failed items
  int get currentFailedCount => uploadItems.values.where((u) => u.isFailed == true).length;

  @override
  String toString() {
    return 'DriftBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount, processingCount: $processingCount, enqueueCount: $enqueueCount, enqueueTotalCount: $enqueueTotalCount, isCanceling: $isCanceling, isSyncing: $isSyncing, uploadItems: $uploadItems, error: $error)';
  }

  @override
  bool operator ==(covariant DriftBackupState other) {
    if (identical(this, other)) return true;
    final mapEquals = const DeepCollectionEquality().equals;

    return other.totalCount == totalCount &&
        other.backupCount == backupCount &&
        other.remainderCount == remainderCount &&
        other.processingCount == processingCount &&
        other.enqueueCount == enqueueCount &&
        other.enqueueTotalCount == enqueueTotalCount &&
        other.isCanceling == isCanceling &&
        other.isSyncing == isSyncing &&
        mapEquals(other.uploadItems, uploadItems) &&
        other.error == error;
  }

  @override
  int get hashCode {
    return totalCount.hashCode ^
        backupCount.hashCode ^
        remainderCount.hashCode ^
        processingCount.hashCode ^
        enqueueCount.hashCode ^
        enqueueTotalCount.hashCode ^
        isCanceling.hashCode ^
        isSyncing.hashCode ^
        uploadItems.hashCode ^
        error.hashCode;
  }
}

final driftBackupProvider = StateNotifierProvider<DriftBackupNotifier, DriftBackupState>((ref) {
  return DriftBackupNotifier(
    ref.watch(uploadServiceProvider),
    ref.watch(appSettingsServiceProvider),
  );
});

class DriftBackupNotifier extends StateNotifier<DriftBackupState> {
  DriftBackupNotifier(this._uploadService, this._appSettingsService)
    : super(
        const DriftBackupState(
          totalCount: 0,
          backupCount: 0,
          remainderCount: 0,
          processingCount: 0,
          enqueueCount: 0,
          enqueueTotalCount: 0,
          isCanceling: false,
          isSyncing: false,
          uploadItems: {},
          error: BackupError.none,
        ),
      ) {
    {
      _statusSubscription = _uploadService.taskStatusStream.listen(_handleTaskStatusUpdate);
      _progressSubscription = _uploadService.taskProgressStream.listen(_handleTaskProgressUpdate);
    }
  }

  final UploadService _uploadService;
  final AppSettingsService _appSettingsService;
  StreamSubscription<TaskStatusUpdate>? _statusSubscription;
  StreamSubscription<TaskProgressUpdate>? _progressSubscription;
  final _logger = Logger("DriftBackupNotifier");
  
  /// Consecutive error counter for graceful degradation
  int _consecutiveErrors = 0;
  static const int _maxConsecutiveErrors = 10;
  
  /// Check if backup is enabled (master switch)
  bool get _isBackupEnabled => _appSettingsService.getSetting(AppSettingsEnum.enableBackup);

  /// Remove upload item from state
  void _removeUploadItem(String taskId) {
    if (!mounted) {
      _logger.warning("Skip _removeUploadItem: notifier disposed");
      return;
    }
    if (state.uploadItems.containsKey(taskId)) {
      final updatedItems = Map<String, DriftUploadStatus>.from(state.uploadItems);
      updatedItems.remove(taskId);
      state = state.copyWith(uploadItems: updatedItems);
    }
  }

  void _handleTaskStatusUpdate(TaskStatusUpdate update) {
    if (!mounted) {
      _logger.warning("Skip _handleTaskStatusUpdate: notifier disposed");
      return;
    }
    final taskId = update.task.taskId;
    
    // VERBOSE LOGGING for all status updates
    _logger.info('>>> TASK STATUS: ${update.status.name} - ${update.task.displayName} '
        '(code: ${update.responseStatusCode ?? "N/A"})');

    switch (update.status) {
      case TaskStatus.complete:
        if (update.task.group == kBackupGroup) {
          final statusCode = update.responseStatusCode;
          _logger.info('>>> UPLOAD COMPLETE: ${update.task.displayName}, HTTP $statusCode');
          
          // 201 = Created (new upload) - increment counts
          // 200 = OK (duplicate) - DON'T increment counts (already counted in database!)
          final completedItem = state.uploadItems[taskId];
          final bytesUploaded = completedItem?.fileSize ?? 0;
          
          if (statusCode == 201) {
            // NEW upload - increment backup count and decrement remainder
            _logger.info('>>> NEW UPLOAD: ${completedItem?.filename} - $bytesUploaded bytes');
            state = state.copyWith(
              backupCount: state.backupCount + 1, 
              remainderCount: (state.remainderCount - 1).clamp(0, state.totalCount), // Never go negative!
              completedCount: state.completedCount + 1,
              totalBytesUploaded: state.totalBytesUploaded + bytesUploaded,
            );
          } else if (statusCode == 200) {
            // DUPLICATE - file already on server, don't change backup/remainder counts
            // (they're already correct in the database)
            _logger.info('>>> DUPLICATE: ${completedItem?.filename} already on server - not counting');
            state = state.copyWith(
              completedCount: state.completedCount + 1,
            );
          } else {
            _logger.warning('>>> UNEXPECTED STATUS: $statusCode for ${update.task.displayName}');
          }
        }

        // Remove the completed task from the upload items (with brief delay to show 100%)
        if (state.uploadItems.containsKey(taskId)) {
          Future.delayed(const Duration(milliseconds: 500), () {
            _removeUploadItem(taskId);
          });
        }

      case TaskStatus.failed:
        // Ignore retry errors to avoid confusing users
        if (update.exception?.description == 'Delayed or retried enqueue failed') {
          _removeUploadItem(taskId);
          return;
        }

        final currentItem = state.uploadItems[taskId];
        if (currentItem == null) {
          // Create an entry for the failed task so user can see it
          final filename = update.task.displayName;
          _logger.warning('Upload failed for $filename: ${update.exception}');
          state = state.copyWith(
            uploadItems: {
              ...state.uploadItems,
              taskId: DriftUploadStatus(
                taskId: taskId,
                filename: filename,
                progress: 0,
                fileSize: 0,
                networkSpeedAsString: '',
                isFailed: true,
                error: update.exception?.toString(),
              ),
            },
          );
          return;
        }

        String? error;
        final exception = update.exception;
        int? httpCode;
        
        if (exception != null && exception is TaskHttpException) {
          httpCode = exception.httpResponseCode;
          final message = tryJsonDecode(exception.description)?['message'] as String?;
          if (message != null) {
            error = "${exception.exceptionType}, response code $httpCode: $message";
          }
        }
        error ??= update.exception?.toString();
        
        // Check if this is actually a duplicate (409 Conflict or message contains "duplicate")
        final isDuplicate = httpCode == 409 || 
            (error?.toLowerCase().contains('duplicate') ?? false) ||
            (error?.toLowerCase().contains('already exist') ?? false);
        
        if (isDuplicate) {
          // Treat duplicate as success - the file is already on the server!
          _logger.info('Asset is duplicate (already on server): ${currentItem.filename}');
          state = state.copyWith(
            backupCount: state.backupCount + 1, 
            remainderCount: state.remainderCount - 1,
            completedCount: state.completedCount + 1,
          );
          // Remove from upload list after short delay
          Future.delayed(const Duration(milliseconds: 500), () {
            _removeUploadItem(taskId);
          });
          break;
        }
        
        // Log detailed error info for debugging
        _logger.warning('Upload failed: ${currentItem.filename}, '
            'size: ${currentItem.fileSize}, error: $error');

        state = state.copyWith(
          uploadItems: {
            ...state.uploadItems,
            taskId: currentItem.copyWith(isFailed: true, error: error),
          },
          failedCount: state.failedCount + 1,
        );
        _logger.fine("Upload failed for taskId: $taskId, exception: ${update.exception}");
        
        // Auto-remove failed items from UI after 10 seconds so they don't block the view
        // The background downloader will still retry them automatically
        Future.delayed(const Duration(seconds: 10), () {
          if (mounted && state.uploadItems.containsKey(taskId)) {
            final item = state.uploadItems[taskId];
            if (item?.isFailed == true) {
              _logger.info('Auto-removing failed upload from UI: ${item?.filename}');
              _removeUploadItem(taskId);
            }
          }
        });
        break;

      case TaskStatus.canceled:
        _logger.info('>>> UPLOAD CANCELED: ${update.task.displayName}');
        _removeUploadItem(update.task.taskId);
        break;
        
      case TaskStatus.waitingToRetry:
        // Update status to show retry is pending
        final retryItem = state.uploadItems[taskId];
        if (retryItem != null) {
          _logger.warning('>>> WAITING TO RETRY: ${retryItem.filename} - ${update.exception}');
          state = state.copyWith(
            uploadItems: {
              ...state.uploadItems,
              taskId: retryItem.copyWith(
                error: 'Retrying upload...',
                isFailed: false,
              ),
            },
          );
        }
        break;
      
      case TaskStatus.enqueued:
        _logger.info('>>> ENQUEUED: ${update.task.displayName}');
        break;
        
      case TaskStatus.running:
        _logger.info('>>> RUNNING: ${update.task.displayName}');
        break;
        
      case TaskStatus.paused:
        _logger.warning('>>> PAUSED: ${update.task.displayName}');
        break;

      default:
        _logger.info('>>> OTHER STATUS: ${update.status.name} - ${update.task.displayName}');
        break;
    }
  }

  void _handleTaskProgressUpdate(TaskProgressUpdate update) {
    if (!mounted) {
      _logger.warning("Skip _handleTaskProgressUpdate: notifier disposed");
      return;
    }
    final taskId = update.task.taskId;
    final filename = update.task.displayName;
    final progress = update.progress;
    final currentItem = state.uploadItems[taskId];
    if (currentItem != null) {
      if (progress == kUploadStatusCanceled) {
        _removeUploadItem(update.task.taskId);
        return;
      }

      // Update the item first
      final updatedItem = update.hasExpectedFileSize
              ? currentItem.copyWith(
                  progress: progress,
                  fileSize: update.expectedFileSize,
                  networkSpeedAsString: update.networkSpeedAsString,
                )
          : currentItem.copyWith(progress: progress);
      
      final newUploadItems = {
        ...state.uploadItems,
        taskId: updatedItem,
      };
      
      // Calculate aggregate speed by parsing all active upload speed strings
      // This is more reliable than networkSpeed which can be inconsistent
      double aggregateSpeed = 0;
      for (final item in newUploadItems.values) {
        if (item.progress < 1.0 && item.isFailed != true && item.networkSpeedAsString.isNotEmpty) {
          // Parse speed string like "3 MB/s" or "500 KB/s"
          final speedStr = item.networkSpeedAsString.toLowerCase();
          final numMatch = RegExp(r'([\d.]+)').firstMatch(speedStr);
          if (numMatch != null) {
            final num = double.tryParse(numMatch.group(1)!) ?? 0;
            if (speedStr.contains('mb')) {
              aggregateSpeed += num * 1024 * 1024;
            } else if (speedStr.contains('kb')) {
              aggregateSpeed += num * 1024;
            } else {
              aggregateSpeed += num;
            }
          }
        }
      }

      state = state.copyWith(
        uploadItems: newUploadItems,
        currentSpeedBytesPerSec: aggregateSpeed,
      );

      return;
    }

    state = state.copyWith(
      uploadItems: {
        ...state.uploadItems,
        taskId: DriftUploadStatus(
          taskId: taskId,
          filename: filename,
          progress: progress,
          fileSize: update.expectedFileSize,
          networkSpeedAsString: update.networkSpeedAsString,
        ),
      },
    );
  }

  Future<void> getBackupStatus(String userId) async {
    if (!mounted) {
      _logger.warning("Skip getBackupStatus (pre-call): notifier disposed");
      return;
    }
    final counts = await _uploadService.getBackupCounts(userId);
    if (!mounted) {
      _logger.warning("Skip getBackupStatus (post-call): notifier disposed");
      return;
    }

    state = state.copyWith(
      totalCount: counts.total,
      backupCount: counts.total - counts.remainder,
      remainderCount: counts.remainder,
      processingCount: counts.processing,
    );
  }

  void updateError(BackupError error) {
    if (!mounted) {
      _logger.warning("Skip updateError: notifier disposed");
      return;
    }
    state = state.copyWith(error: error);
  }

  void updateSyncing(bool isSyncing) {
    if (!mounted) return;
    state = state.copyWith(isSyncing: isSyncing);
  }
  
  /// Update pipeline status message for UI feedback
  void updatePipelineStatus(String status) {
    if (!mounted) return;
    state = state.copyWith(pipelineStatus: status);
  }

  /// Legacy method - now redirects to the new parallel pipeline
  /// This ensures all code paths use the same throttled upload mechanism
  Future<void> startBackup(String userId) async {
    if (!mounted) return;
    _logger.info('startBackup called - redirecting to parallel pipeline');
    
    // Use the new parallel pipeline instead of the old flood-the-queue method
    final throttleController = AdaptiveThrottleController();
    throttleController.initialize(state.remainderCount);
    
    await startParallelBackup(
      userId,
      throttleController: throttleController,
      onStatusUpdate: (message) {
        _logger.info('Backup: $message');
      },
    );
  }

  // _updateEnqueueCount removed - no longer needed since startBackup now uses parallel pipeline

  /// Parallel pipeline backup that uploads batches as they become hashed.
  /// 
  /// This method starts uploading immediately when hashed assets are available,
  /// rather than waiting for all hashing to complete.
  /// 
  /// [onHashingStart] - Called when hashing begins
  /// [onHashingComplete] - Called when all hashing is done
  /// [onStatusUpdate] - Called with status messages
  Timer? _pipelineTimer;
  
  Future<void> startParallelBackup(
    String userId, {
    required AdaptiveThrottleController throttleController,
    void Function()? onHashingStart,
    void Function()? onHashingComplete,
    void Function(String message)? onStatusUpdate,
  }) async {
    if (!mounted) {
      _logger.warning("Skip startParallelBackup: notifier disposed");
      return;
    }
    
    // CRITICAL: Check backup toggle - don't start if disabled
    if (!_isBackupEnabled) {
      _logger.info('Backup toggle disabled - not starting pipeline');
      return;
    }
    
    // Reset for a fresh start
    _uploadService.shouldAbortQueuingTasks = false;
    _consecutiveErrors = 0;  // Reset error counter
    
    state = state.copyWith(
      error: BackupError.none,
      isPipelineActive: true,
      pipelineStatus: 'Starting parallel pipeline...',
      // Reset queue counters to prevent stale data
      enqueueCount: 0,
      enqueueTotalCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalBytesUploaded: 0,
    );
    onStatusUpdate?.call('Starting parallel pipeline...');

    // Get initial counts
    final counts = await _uploadService.getBackupCounts(userId);
    if (!mounted) return;
    
    final totalToBackup = counts.remainder;
    if (totalToBackup == 0) {
      _logger.info('No assets to backup');
      state = state.copyWith(
        isPipelineActive: false,
        pipelineStatus: 'No assets to backup',
      );
      onStatusUpdate?.call('No assets to backup');
      return;
    }
    
    _logger.info('Starting parallel pipeline: $totalToBackup assets to backup, '
        '${counts.processing} still need hashing');
    
    // Initialize throttle controller
    throttleController.initialize(totalToBackup);
    
    state = state.copyWith(
      isHashing: counts.processing > 0,
      pipelineStatus: 'Pipeline active - Hashing: ${counts.processing}, Ready: ${totalToBackup - counts.processing}',
      adaptiveState: AdaptiveState(
        status: AdaptiveStatus.monitoring,
        currentBatchSize: throttleController.currentBatchSize,
        currentDelayMs: throttleController.delayMs,
        statusMessage: 'Pipeline starting...',
      ),
    );
    
    // Start polling for hashed assets - 500ms is a good balance
    _pipelineTimer = Timer.periodic(
      const Duration(milliseconds: 500),
      (timer) async {
        if (!mounted || state.isCanceling || _uploadService.shouldAbortQueuingTasks) {
          timer.cancel();
          _pipelineTimer = null;
          if (mounted) {
            state = state.copyWith(
              isPipelineActive: false,
              pipelineStatus: 'Stopped',
            );
          }
          return;
        }
        
        await _pipelineTick(userId, throttleController, onStatusUpdate);
      },
    );
    
    // Wait for pipeline to complete
    while (_pipelineTimer?.isActive ?? false) {
      await Future.delayed(const Duration(milliseconds: 100));
    }
    
    if (!mounted) return;
    state = state.copyWith(
      isPipelineActive: false,
      isHashing: false,
      isUploading: false,
      pipelineStatus: 'Pipeline complete',
    );
    onStatusUpdate?.call('Pipeline complete');
  }
  
  Future<void> _pipelineTick(
    String userId,
    AdaptiveThrottleController throttleController,
    void Function(String message)? onStatusUpdate,
  ) async {
    if (!mounted) return;
    
    // CRITICAL: Check backup toggle - stop pipeline if disabled
    if (!_isBackupEnabled) {
      _logger.info('Backup toggle disabled - stopping pipeline');
      _pipelineTimer?.cancel();
      _pipelineTimer = null;
      if (mounted) {
        state = state.copyWith(
          isPipelineActive: false,
          isHashing: false,
          isUploading: false,
          pipelineStatus: 'Backup disabled',
        );
      }
      return;
    }
    
    try {
      // Check current counts from database (source of truth)
      final counts = await _uploadService.getBackupCounts(userId);
      if (!mounted) return;
      
      // Successfully got counts - reset error counter
      _consecutiveErrors = 0;
      
      final processingCount = counts.processing;
      // Safety: ensure remainder never exceeds total and backup is never negative
      final safeRemainder = counts.remainder.clamp(0, counts.total);
      final newBackupCount = (counts.total - safeRemainder).clamp(0, counts.total);
      final newIsHashing = processingCount > 0;
      
      // Only update state if values actually changed (reduces UI rebuilds)
      if (state.processingCount != processingCount ||
          state.remainderCount != safeRemainder ||
          state.backupCount != newBackupCount ||
          state.isHashing != newIsHashing) {
        state = state.copyWith(
          processingCount: processingCount,
          remainderCount: safeRemainder,
          backupCount: newBackupCount,
          isHashing: newIsHashing,
        );
      }
      
      // Check if we're done
      if (counts.remainder == 0) {
        _logger.info('All assets backed up!');
        _pipelineTimer?.cancel();
        _pipelineTimer = null;
        onStatusUpdate?.call('Backup complete!');
        return;
      }
      
      // Check if we need to queue more assets
      final batchSize = throttleController.currentBatchSize;
      final delayMs = throttleController.delayMs;
      
      // Categorize uploads:
      // - "active" = small files OR large files with good progress (>10%)
      // - "stuck" = large files (>50MB) with low progress (<10%) - likely retrying
      // - "failed" = explicitly marked as failed
      const largeFileThreshold = 50 * 1024 * 1024; // 50MB
      const stuckProgressThreshold = 0.10; // 10%
      
      final activeUploads = state.uploadItems.values.where((item) {
        if (item.isFailed == true) return false;
        if (item.progress >= 1.0) return false; // completed
        // Large files with low progress are considered "stuck"
        if (item.fileSize > largeFileThreshold && item.progress < stuckProgressThreshold) {
          return false; // Don't count as active
        }
        return true;
      }).length;
      
      final stuckUploads = state.uploadItems.values.where((item) {
        if (item.isFailed == true) return false;
        return item.fileSize > largeFileThreshold && item.progress < stuckProgressThreshold;
      }).length;
      
      final failedUploads = state.uploadItems.values
          .where((item) => item.isFailed == true)
          .length;
      final totalInUI = state.uploadItems.length;
      
      // Only ACTIVE uploads count against our limit
      // Stuck and failed items should NOT block new uploads!
      final maxConcurrent = batchSize;
      
      final problemCount = stuckUploads + failedUploads;
      // VERBOSE LOGGING - help debug stalls
      _logger.info('=== PIPELINE TICK ===');
      _logger.info('  Database: remainder=${counts.remainder}, processing=${counts.processing}, total=${counts.total}');
      _logger.info('  UI State: active=$activeUploads, stuck=$stuckUploads, failed=$failedUploads, totalInUI=$totalInUI');
      _logger.info('  Throttle: batchSize=$batchSize, maxConcurrent=$maxConcurrent');
      
      // Update state with REAL counts - clamp displayed queue to batch size
      // Only update if values changed to reduce UI rebuilds
      final newEnqueueCount = activeUploads.clamp(0, maxConcurrent);
      if (state.enqueueCount != newEnqueueCount || state.enqueueTotalCount != counts.remainder) {
        state = state.copyWith(
          enqueueCount: newEnqueueCount,
          enqueueTotalCount: counts.remainder,
        );
      }
      
      if (counts.remainder == 0) {
        return; // Done!
      }
      
      // Only throttle based on ACTIVE uploads
      // Stuck/failed items should NOT block new uploads!
      if (activeUploads >= maxConcurrent) {
        final problemMsg = problemCount > 0 ? ' ($problemCount stuck/failed)' : '';
        state = state.copyWith(
          pipelineStatus: 'Uploading: $activeUploads active$problemMsg',
          adaptiveState: AdaptiveState(
            status: AdaptiveStatus.monitoring,
            currentBatchSize: batchSize,
            currentDelayMs: delayMs,
            statusMessage: '$activeUploads active$problemMsg',
          ),
        );
        return;
      }
      
      // We have room - queue more! Stuck/failed items don't count against limit
      final toQueue = (maxConcurrent - activeUploads).clamp(1, batchSize);
      
      // Get candidates ready for upload
      final candidates = await _uploadService.getCandidateBatch(userId, limit: toQueue);
      
      if (candidates.isNotEmpty && mounted && !_uploadService.shouldAbortQueuingTasks) {
        _logger.info('Queuing ${candidates.length} of ${counts.remainder} remaining '
            '(active: $activeUploads, stuck: $stuckUploads, failed: $failedUploads)');
        
        state = state.copyWith(
          isUploading: true,
          pipelineStatus: 'Queuing: ${candidates.length} (active: $activeUploads)',
          adaptiveState: AdaptiveState(
            status: AdaptiveStatus.monitoring,
            currentBatchSize: batchSize,
            currentDelayMs: delayMs,
            statusMessage: 'Queuing ${candidates.length}',
            lastAdjustmentReason: 'Batch queued at ${DateTime.now().toIso8601String()}',
          ),
        );
        onStatusUpdate?.call('Queuing: ${candidates.length} assets');
        
        // Upload the batch - this adds to the background downloader queue
        final queued = await _uploadService.uploadBatch(candidates);
        
        if (!mounted) return;
        _logger.info('Queued $queued files, ${counts.remainder} total remaining');
        
        // Apply throttle delay between batches
        if (delayMs > 0 && mounted && !_uploadService.shouldAbortQueuingTasks) {
          await Future.delayed(Duration(milliseconds: delayMs));
        }
      } else if (candidates.isEmpty && counts.remainder > 0) {
        // No candidates available but still have assets to backup
        // This can happen because:
        // 1. Hashing is still in progress (processing > 0)
        // 2. Files are already queued in background downloader
        // 3. All remaining files are in the current upload batch
        
        // If we have stuck uploads, cancel them so they stop blocking
        if (stuckUploads > 0 || failedUploads > 0) {
          _logger.info('Cancelling stuck/retrying uploads to unblock queue');
          final cancelledCount = await _uploadService.cancelStuckUploads();
          if (cancelledCount > 0) {
            _logger.info('Cancelled $cancelledCount stuck uploads - queue should now progress');
          }
        }
        
        // Build informative status
        final problemMsg = problemCount > 0 ? ' ($problemCount stuck)' : '';
        String statusMsg;
        String detailMsg;
        
        if (processingCount > 0) {
          // Files need hashing - show that
          statusMsg = 'Hashing $processingCount files...';
          detailMsg = '$processingCount need hashing';
        } else if (activeUploads > 0) {
          statusMsg = 'Uploading: $activeUploads active$problemMsg';
          detailMsg = '$activeUploads uploading$problemMsg';
        } else {
          // No processing count but files remain - likely cloud-backed files
          // The native hashing code downloads cloud files before hashing,
          // and the processing count only updates after each batch completes
          statusMsg = '${counts.remainder} remaining - downloading from cloud...';
          detailMsg = 'Cloud files are slow - downloading before hash';
          _logger.info('Waiting for cloud file downloads: ${counts.remainder} remain. '
              'Processing count: $processingCount (updates after batch)');
        }
        
        state = state.copyWith(
          pipelineStatus: statusMsg,
          adaptiveState: AdaptiveState(
            status: activeUploads > 0 || processingCount > 0 
                ? AdaptiveStatus.monitoring 
                : AdaptiveStatus.idle,
            currentBatchSize: batchSize,
            currentDelayMs: delayMs,
            statusMessage: detailMsg,
          ),
        );
      }
    } catch (e, s) {
      _consecutiveErrors++;
      _logger.severe('Pipeline tick error ($_consecutiveErrors/$_maxConsecutiveErrors)', e, s);
      
      // Graceful failure - show error but don't crash
      if (mounted) {
        if (_consecutiveErrors >= _maxConsecutiveErrors) {
          // Too many errors - stop gracefully
          _logger.severe('Too many consecutive errors, stopping pipeline gracefully');
          _pipelineTimer?.cancel();
          _pipelineTimer = null;
          
          state = state.copyWith(
            isPipelineActive: false,
            isHashing: false,
            isUploading: false,
            pipelineStatus: 'Stopped: too many errors',
            adaptiveState: AdaptiveState(
              status: AdaptiveStatus.paused,
              currentBatchSize: throttleController.currentBatchSize,
              currentDelayMs: throttleController.delayMs,
              statusMessage: 'Paused due to errors. Tap to retry.',
              lastAdjustmentReason: 'Error: ${e.toString().split('\n').first}',
            ),
          );
        } else {
          // Show error but continue trying
          state = state.copyWith(
            pipelineStatus: 'Retrying... (${_maxConsecutiveErrors - _consecutiveErrors} attempts left)',
            adaptiveState: AdaptiveState(
              status: AdaptiveStatus.recovering,
              currentBatchSize: throttleController.currentBatchSize,
              currentDelayMs: throttleController.delayMs,
              statusMessage: 'Recovering from error...',
            ),
          );
        }
      }
    }
  }
  
  void cancelPipeline() {
    _pipelineTimer?.cancel();
    _pipelineTimer = null;
    _uploadService.shouldAbortQueuingTasks = true;
    if (mounted) {
      state = state.copyWith(
        isPipelineActive: false,
        isHashing: false,
        isUploading: false,
        pipelineStatus: 'Cancelled',
      );
    }
  }

  Future<void> cancel() async {
    if (!mounted) return;
    dPrint(() => "Canceling backup tasks...");
    
    // Cancel pipeline immediately
    cancelPipeline();
    
    // Set canceling state and clear queue counts
    state = state.copyWith(
      enqueueCount: 0, 
      enqueueTotalCount: 0, 
      isCanceling: true, 
      error: BackupError.none,
      uploadItems: {}, // Clear upload items immediately for fast UI response
    );

    // Cancel background tasks (don't wait recursively - just fire and forget)
    await _uploadService.cancelBackup();

    if (!mounted) return;
    
    // Done - clear canceling flag
    dPrint(() => "Cancel complete");
    state = state.copyWith(isCanceling: false);
  }

  Future<void> handleBackupResume(String userId) async {
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (pre-call): notifier disposed");
      return;
    }
    _logger.info("Resuming backup tasks...");
    state = state.copyWith(error: BackupError.none);
    final tasks = await _uploadService.getActiveTasks(kBackupGroup);
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (post-call): notifier disposed");
      return;
    }
    _logger.info("Found ${tasks.length} tasks");

    if (tasks.isEmpty) {
      // Start a new backup queue
      _logger.info("Start a new backup queue");
      return startBackup(userId);
    }

    _logger.info("Tasks to resume: ${tasks.length}");
    return _uploadService.resumeBackup();
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    _progressSubscription?.cancel();
    super.dispose();
  }
}

final driftBackupCandidateProvider = FutureProvider.autoDispose<List<LocalAsset>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    return [];
  }

  return ref.read(backupRepositoryProvider).getCandidates(user.id, onlyHashed: false);
});

final driftCandidateBackupAlbumInfoProvider = FutureProvider.autoDispose.family<List<LocalAlbum>, String>((
  ref,
  assetId,
) {
  return ref.read(localAssetRepository).getSourceAlbums(assetId, backupSelection: BackupSelection.selected);
});
