import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:logging/logging.dart';

import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/background_upload.service.dart';

/// Max foreground-backup passes per run. iOS burst stacking needs a pass for the
/// representative, then another for its now-eligible members; a few more cover
/// multi-burst captures. Bounded so a stuck candidate can't loop forever — the
/// no-progress break usually stops sooner.
const _kMaxBackupPasses = 6;

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
    if (identical(this, other)) {
      return true;
    }

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

  final bool isSyncing;
  final BackupError error;

  final Map<String, DriftUploadStatus> uploadItems;

  final Map<String, double> iCloudDownloadProgress;

  const DriftBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
    required this.processingCount,
    required this.isSyncing,
    this.error = BackupError.none,
    required this.uploadItems,
    this.iCloudDownloadProgress = const {},
  });

  DriftBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
    int? processingCount,
    bool? isSyncing,
    BackupError? error,
    Map<String, DriftUploadStatus>? uploadItems,
    Map<String, double>? iCloudDownloadProgress,
  }) {
    return DriftBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
      processingCount: processingCount ?? this.processingCount,
      isSyncing: isSyncing ?? this.isSyncing,
      error: error ?? this.error,
      uploadItems: uploadItems ?? this.uploadItems,
      iCloudDownloadProgress: iCloudDownloadProgress ?? this.iCloudDownloadProgress,
    );
  }

  int get errorCount => uploadItems.values.where((item) => item.isFailed == true).length;

  @override
  String toString() {
    return 'DriftBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount, processingCount: $processingCount, isSyncing: $isSyncing, error: $error, uploadItems: $uploadItems, iCloudDownloadProgress: $iCloudDownloadProgress)';
  }

  @override
  bool operator ==(covariant DriftBackupState other) {
    if (identical(this, other)) {
      return true;
    }
    final mapEquals = const DeepCollectionEquality().equals;

    return other.totalCount == totalCount &&
        other.backupCount == backupCount &&
        other.remainderCount == remainderCount &&
        other.processingCount == processingCount &&
        other.isSyncing == isSyncing &&
        other.error == error &&
        mapEquals(other.iCloudDownloadProgress, iCloudDownloadProgress) &&
        mapEquals(other.uploadItems, uploadItems);
  }

  @override
  int get hashCode {
    return totalCount.hashCode ^
        backupCount.hashCode ^
        remainderCount.hashCode ^
        processingCount.hashCode ^
        isSyncing.hashCode ^
        error.hashCode ^
        uploadItems.hashCode ^
        iCloudDownloadProgress.hashCode;
  }
}

final driftBackupProvider = StateNotifierProvider<DriftBackupNotifier, DriftBackupState>((ref) {
  return DriftBackupNotifier(
    ref.watch(foregroundUploadServiceProvider),
    ref.watch(backgroundUploadServiceProvider),
    UploadSpeedManager(),
  );
});

class DriftBackupNotifier extends StateNotifier<DriftBackupState> {
  DriftBackupNotifier(this._foregroundUploadService, this._backgroundUploadService, this._uploadSpeedManager)
    : super(
        const DriftBackupState(
          totalCount: 0,
          backupCount: 0,
          remainderCount: 0,
          processingCount: 0,
          isSyncing: false,
          uploadItems: {},
          error: BackupError.none,
        ),
      );

  final ForegroundUploadService _foregroundUploadService;
  final BackgroundUploadService _backgroundUploadService;
  final UploadSpeedManager _uploadSpeedManager;
  Completer<void>? _cancelToken;
  // Ids uploaded in the current foreground-backup session, so the multi-pass
  // loop doesn't re-grab an asset whose remote row hasn't synced back locally yet.
  final Set<String> _sessionUploadedIds = {};

  final _logger = Logger("DriftBackupNotifier");

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

  Future<void> getBackupStatus(String userId) async {
    if (!mounted) {
      _logger.warning("Skip getBackupStatus (pre-call): notifier disposed");
      return;
    }
    final counts = await _foregroundUploadService.getBackupCounts(userId);
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
    state = state.copyWith(isSyncing: isSyncing);
  }

  Future<void> startForegroundBackup(String userId) async {
    // Cancel any existing backup before starting a new one
    if (_cancelToken != null) {
      stopForegroundBackup();
    }

    state = state.copyWith(error: BackupError.none);

    _cancelToken = Completer<void>();

    // Ids uploaded this session: a just-uploaded asset stays a backup candidate
    // until its remote row syncs back locally, so the next pass would re-grab it
    // (the server dedups, but it wastes the transfer). Skipping known-uploaded
    // ids makes the multi-pass loop idempotent. Populated in the success handler.
    _sessionUploadedIds.clear();
    final callbacks = UploadCallbacks(
      onProgress: _handleForegroundBackupProgress,
      onSuccess: _handleForegroundBackupSuccess,
      onError: _handleForegroundBackupError,
      onICloudProgress: _handleICloudProgress,
    );

    // iOS burst stacking needs more than one pass: a burst's representative
    // uploads first, then its members become eligible (they stack under it). So
    // loop only while a pass still has burst frames to work through - a non-burst
    // library (and all of Android) finishes in a single pass with no extra
    // candidate query. Capped so a stuck candidate can't spin forever. `myToken`
    // is captured once: if another backup supersedes this one (restart installs
    // a fresh token), `identical` fails and this loop exits instead of running
    // concurrently against the shared session state. `skipIds` keeps a just-
    // uploaded asset (remote row not synced back yet) from being re-grabbed.
    final myToken = _cancelToken;
    for (var pass = 0; pass < _kMaxBackupPasses; pass++) {
      if (!mounted || myToken == null || myToken.isCompleted || !identical(_cancelToken, myToken)) {
        break;
      }
      final result = await _foregroundUploadService.uploadCandidates(
        userId,
        myToken,
        callbacks: callbacks,
        skipIds: _sessionUploadedIds,
      );
      // Nothing attempted (all remaining candidates already uploaded this
      // session), or nothing burst-related to unblock a later pass → done.
      if (result.attempted == 0 || !result.hadBurst) {
        break;
      }
    }
  }

  void stopForegroundBackup() {
    _cancelToken?.complete();
    _cancelToken = null;
    _uploadSpeedManager.clear();
    state = state.copyWith(uploadItems: {}, iCloudDownloadProgress: {});
  }

  void _handleICloudProgress(String localAssetId, double progress) {
    state = state.copyWith(iCloudDownloadProgress: {...state.iCloudDownloadProgress, localAssetId: progress});

    if (progress >= 1.0) {
      Future.delayed(const Duration(milliseconds: 250), () {
        final updatedProgress = Map<String, double>.from(state.iCloudDownloadProgress);
        updatedProgress.remove(localAssetId);
        state = state.copyWith(iCloudDownloadProgress: updatedProgress);
      });
    }
  }

  void _handleForegroundBackupProgress(String localAssetId, String filename, int bytes, int totalBytes) {
    if (_cancelToken == null) {
      return;
    }

    final progress = totalBytes > 0 ? bytes / totalBytes : 0.0;
    final networkSpeedAsString = _uploadSpeedManager.updateProgress(localAssetId, bytes, totalBytes);
    final currentItem = state.uploadItems[localAssetId];
    if (currentItem != null) {
      state = state.copyWith(
        uploadItems: {
          ...state.uploadItems,
          localAssetId: currentItem.copyWith(
            filename: filename,
            progress: progress,
            fileSize: totalBytes,
            networkSpeedAsString: networkSpeedAsString,
          ),
        },
      );
    } else {
      state = state.copyWith(
        uploadItems: {
          ...state.uploadItems,
          localAssetId: DriftUploadStatus(
            taskId: localAssetId,
            filename: filename,
            progress: progress,
            fileSize: totalBytes,
            networkSpeedAsString: networkSpeedAsString,
          ),
        },
      );
    }
  }

  void _handleForegroundBackupSuccess(String localAssetId, String remoteAssetId) {
    _sessionUploadedIds.add(localAssetId);
    if (!mounted) {
      // Upload finished after the notifier was disposed (e.g. navigated away
      // mid-backup). Keep the session-id bookkeeping above but don't touch state.
      return;
    }
    state = state.copyWith(backupCount: state.backupCount + 1, remainderCount: state.remainderCount - 1);
    _uploadSpeedManager.removeTask(localAssetId);

    Future.delayed(const Duration(milliseconds: 1000), () {
      _removeUploadItem(localAssetId);
    });
  }

  void _handleForegroundBackupError(String localAssetId, String errorMessage) {
    _logger.severe("Upload failed for $localAssetId: $errorMessage");

    final currentItem = state.uploadItems[localAssetId];
    if (currentItem != null) {
      state = state.copyWith(
        uploadItems: {
          ...state.uploadItems,
          localAssetId: currentItem.copyWith(isFailed: true, error: errorMessage),
        },
      );
    } else {
      state = state.copyWith(
        uploadItems: {
          ...state.uploadItems,
          localAssetId: DriftUploadStatus(
            taskId: localAssetId,
            filename: 'Unknown',
            progress: 0,
            fileSize: 0,
            networkSpeedAsString: '',
            isFailed: true,
            error: errorMessage,
          ),
        },
      );
    }

    _uploadSpeedManager.removeTask(localAssetId);
  }

  Future<void> startBackupWithURLSession(String userId) async {
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (pre-call): notifier disposed");
      return;
    }
    _logger.info("Start background backup sequence");
    state = state.copyWith(error: BackupError.none);
    final pending = await _backgroundUploadService.getActiveBackupTaskCount();
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (post-call): notifier disposed");
      return;
    }
    _logger.info("Found $pending pending tasks");

    if (pending == 0) {
      _logger.info("No pending tasks, starting new upload");
      return _backgroundUploadService.uploadBackupCandidates(userId);
    }

    _logger.info("Resuming upload $pending assets");
    return _backgroundUploadService.resume();
  }
}

final driftBackupCandidateProvider = FutureProvider.autoDispose<List<LocalAsset>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    return [];
  }

  return ref.read(foregroundUploadServiceProvider).getBackupCandidates(user.id, onlyHashed: false);
});

final driftCandidateBackupAlbumInfoProvider = FutureProvider.autoDispose.family<List<LocalAlbum>, String>((
  ref,
  assetId,
) {
  return ref.read(localAssetRepository).getSourceAlbums(assetId, backupSelection: BackupSelection.selected);
});
