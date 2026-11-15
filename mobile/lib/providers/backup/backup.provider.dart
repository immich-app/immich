import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:logging/logging.dart';

part 'backup.provider.freezed.dart';

@freezed
abstract class UploadStatus with _$UploadStatus {
  const factory UploadStatus({
    required String taskId,
    required String filename,
    required double progress,
    required int fileSize,
    required String networkSpeedAsString,
    bool? isFailed,
    String? error,
  }) = _UploadStatus;
}

enum BackupError { none, syncFailed }

@freezed
abstract class BackupState with _$BackupState {
  const BackupState._();

  const factory BackupState({
    required int totalCount,
    required int backupCount,
    required int remainderCount,
    required int processingCount,
    required bool isSyncing,
    @Default(BackupError.none) BackupError error,
    required Map<String, UploadStatus> uploadItems,
    @Default({}) Map<String, double> iCloudDownloadProgress,
  }) = _BackupState;

  int get errorCount => uploadItems.values.where((item) => item.isFailed == true).length;
}

final backupProvider = StateNotifierProvider<BackupNotifier, BackupState>((ref) {
  return BackupNotifier(
    ref.watch(foregroundUploadServiceProvider),
    ref.watch(backgroundUploadServiceProvider),
    UploadSpeedManager(),
  );
});

class BackupNotifier extends StateNotifier<BackupState> {
  BackupNotifier(this._foregroundUploadService, this._backgroundUploadService, this._uploadSpeedManager)
    : super(
        const BackupState(
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

  /// Bumped for every foreground run. Callbacks carry the value they were
  /// created with, so anything from a stopped run is discarded on arrival.
  int _backupGeneration = 0;

  // Which user the in-flight foreground backup belongs to, and a handle on that
  // run. Resume and splash can both ask for the same user at almost the same
  // time; without this the second cancels the first token and starts a duplicate
  // pass over the same assets.
  String? _activeBackupUserId;
  Future<void>? _activeBackupRun;

  final _logger = Logger("BackupNotifier");

  /// Remove upload item from state
  void _removeUploadItem(String taskId) {
    if (!mounted) {
      _logger.warning("Skip _removeUploadItem: notifier disposed");
      return;
    }
    if (state.uploadItems.containsKey(taskId)) {
      final updatedItems = Map<String, UploadStatus>.from(state.uploadItems);
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

  Future<void> startForegroundBackup(String userId, {bool restart = false}) async {
    // A resume and a splash resume can both land here within milliseconds. Letting
    // the second through would cancel the first run and start a duplicate pass.
    //
    // User-initiated starts pass restart: true, which cancels and restarts so that
    // "I took a new photo, back it up now" sees the new candidate list.
    final activeRun = _activeBackupRun;
    if (!restart && activeRun != null && _activeBackupUserId == userId) {
      _logger.info("Foreground backup for $userId already running, joining it");
      return activeRun;
    }

    // Cancel any existing backup before starting a new one
    if (_cancelToken != null) {
      stopForegroundBackup(reason: "restarting the backup");
    }

    state = state.copyWith(error: BackupError.none);

    // A pause during the recount below nulls _cancelToken, so the run keeps its own reference.
    final cancelToken = Completer<void>();
    _cancelToken = cancelToken;

    // Identity for this run. Callbacks from a stopped run can arrive minutes
    // later and would otherwise be counted into the next one.
    final generation = ++_backupGeneration;

    // Claim the slot before the first await so a call arriving during the
    // backup-status recount still joins this run instead of cancelling it.
    final runGuard = Completer<void>();
    _activeBackupUserId = userId;
    // Mark the error as observed up front: most runs have no joiner, and
    // completeError() on an unlistened Future would surface as an unhandled
    // async error.
    _activeBackupRun = runGuard.future;
    unawaited(runGuard.future.then<void>((_) {}, onError: (Object _, StackTrace _) {}));

    try {
      // TODO: Once the tmp cleanup is fixed, revert this and handle it differently.
      // Since we clean up tmp files whenever a foreground upload starts, we need to cancel ongoing background uploads.
      if (CurrentPlatform.isIOS) {
        await _backgroundUploadService.cancel();
      }

      // Re-baseline the counters against the same DB read that feeds this run's candidate list,
      // otherwise a resume counts duplicate successes against the old baseline (#26215).
      await getBackupStatus(userId);

      await _foregroundUploadService.uploadCandidates(
        userId,
        cancelToken,
        callbacks: UploadCallbacks(
          onProgress: (id, name, bytes, total) => _handleForegroundBackupProgress(generation, id, name, bytes, total),
          onSuccess: (id, remoteId) => _handleForegroundBackupSuccess(generation, id, remoteId),
          onError: (id, message) => _handleForegroundBackupError(generation, id, message),
          onICloudProgress: (id, progress) => _handleICloudProgress(generation, id, progress),
          // Generation-gated like the rest: stopping the previous run already
          // cleared uploadItems, so a late cancel from it must not delete the row
          // the *current* run is actively uploading for the same asset.
          onCancelled: (id) => _handleForegroundBackupCancelled(generation, id),
        ),
      );
    } catch (error, stackTrace) {
      // Propagate to joiners: they await runGuard.future, and completing it
      // normally would tell them the run succeeded when it actually threw.
      if (!runGuard.isCompleted) {
        runGuard.completeError(error, stackTrace);
      }
      rethrow;
    } finally {
      // Release the slot only if it is still ours: a pause may have stopped this
      // run and a newer one may already own it.
      if (identical(_activeBackupRun, runGuard.future)) {
        _activeBackupRun = null;
        _activeBackupUserId = null;
        // Drop the token too. Leaving a completed Completer here makes the next
        // startForegroundBackup() take the "restarting the backup" branch and
        // log a cancellation that never happened, which hides real ones.
        if (identical(_cancelToken, cancelToken)) {
          _cancelToken = null;
        }
        // Upstream relied on that "restarting" branch to clear the per-run UI
        // state, so clearing the token alone would carry the finished run's
        // failed rows and stale speed samples into the next one.
        _uploadSpeedManager.clear();
        state = state.copyWith(uploadItems: {}, iCloudDownloadProgress: {});
      }
      if (!runGuard.isCompleted) {
        runGuard.complete();
      }
    }
  }

  /// Cancel path for an upload that stopped inside the current run. Does not
  /// insert an item: the row is either gone already or owned by a newer run, and
  /// re-adding it would resurrect a row the user just dismissed.
  void _handleForegroundBackupCancelled(int generation, String localAssetId) {
    if (!mounted || generation != _backupGeneration) {
      return;
    }
    _uploadSpeedManager.removeTask(localAssetId);
    if (state.uploadItems.containsKey(localAssetId)) {
      final remaining = Map<String, UploadStatus>.from(state.uploadItems)..remove(localAssetId);
      state = state.copyWith(uploadItems: remaining);
    }
  }

  void stopForegroundBackup({required String reason}) {
    if (_cancelToken != null) {
      _logger.info("Foreground backup cancelled: $reason");
    }
    _cancelToken?.complete();
    _cancelToken = null;
    // Invalidate this run's callbacks. Cancelling only asks the uploader to stop;
    // an in-flight native transfer keeps reporting until Cronet reacts, and those
    // late callbacks must not land in state after everything was cleared.
    _backupGeneration++;
    // Drop the active-run slot too. The run is being cancelled, so a resume that
    // arrives before the old future unwinds must start a fresh run rather than
    // joining one that is already shutting down.
    _activeBackupRun = null;
    _activeBackupUserId = null;
    _uploadSpeedManager.clear();
    state = state.copyWith(uploadItems: {}, iCloudDownloadProgress: {});
  }

  void _handleICloudProgress(int generation, String localAssetId, double progress) {
    if (!mounted || generation != _backupGeneration) {
      // Disposed, or a leftover callback from a stopped run.
      return;
    }
    state = state.copyWith(iCloudDownloadProgress: {...state.iCloudDownloadProgress, localAssetId: progress});

    if (progress >= 1.0) {
      Future.delayed(const Duration(milliseconds: 250), () {
        if (!mounted || generation != _backupGeneration) {
          return;
        }
        final updatedProgress = Map<String, double>.from(state.iCloudDownloadProgress);
        updatedProgress.remove(localAssetId);
        state = state.copyWith(iCloudDownloadProgress: updatedProgress);
      });
    }
  }

  void _handleForegroundBackupProgress(
    int generation,
    String localAssetId,
    String filename,
    int bytes,
    int totalBytes,
  ) {
    if (!mounted || generation != _backupGeneration || _cancelToken == null) {
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
          localAssetId: UploadStatus(
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

  void _handleForegroundBackupSuccess(int generation, String localAssetId, String remoteAssetId) {
    if (!mounted || generation != _backupGeneration) {
      _logger.warning("Skip _handleForegroundBackupSuccess: stale run or notifier disposed");
      return;
    }
    state = state.copyWith(backupCount: state.backupCount + 1, remainderCount: state.remainderCount - 1);
    _uploadSpeedManager.removeTask(localAssetId);

    Future.delayed(const Duration(milliseconds: 1000), () {
      _removeUploadItem(localAssetId);
    });
  }

  void _handleForegroundBackupError(int generation, String localAssetId, String errorMessage) {
    if (!mounted || generation != _backupGeneration) {
      // Disposed, or a cancelled upload from a stopped run reporting its failure
      // late -- which must not be added to the current run's list.
      return;
    }
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
          localAssetId: UploadStatus(
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

  Future<void> startBackupWithURLSession(String userId, Future<bool> remoteSync) async {
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (pre-call): notifier disposed");
      return;
    }
    _logger.info("Start background backup sequence");
    state = state.copyWith(error: BackupError.none);
    final tasks = await _backgroundUploadService.getActiveTasks(kBackupGroup);
    if (!mounted) {
      _logger.warning("Skip handleBackupResume (post-call): notifier disposed");
      return;
    }
    _logger.info("Found ${tasks.length} pending tasks");

    if (tasks.isEmpty) {
      if (!await remoteSync) {
        _logger.warning("Remote sync did not complete successfully, skipping new upload");
        return;
      }
      _logger.info("No pending tasks, starting new upload");
      return _backgroundUploadService.uploadBackupCandidates(userId);
    }

    _logger.info("Resuming upload ${tasks.length} assets");
    return _backgroundUploadService.resume();
  }
}

final backupCandidateProvider = FutureProvider.autoDispose<List<LocalAsset>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    return [];
  }

  return ref.read(foregroundUploadServiceProvider).getBackupCandidates(user.id, onlyHashed: false);
});

final candidateBackupAlbumInfoProvider = FutureProvider.autoDispose.family<List<LocalAlbum>, String>((ref, assetId) {
  return ref
      .read(driftProvider)
      .localAssetRepository
      .getSourceAlbums(assetId, backupSelection: BackupSelection.selected);
});
