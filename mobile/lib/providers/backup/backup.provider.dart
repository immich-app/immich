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

  /// 每轮都加一，停掉那轮的回调就丢掉。
  int _backupGeneration = 0;

  // resume 和启动页可能同时要同一个用户。
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
    // 放第二个进来会取消第一轮、再跑一遍。
    // 用户主动点的那种传 restart: true。
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

    // 重算期间来一次 pause 会把 _cancelToken 置空，所以这轮留着自己的。
    final cancelToken = Completer<void>();
    _cancelToken = cancelToken;

    // 停掉那轮的回调可能几分钟后才到。
    final generation = ++_backupGeneration;

    // 在第一个 await 之前就占位，重算期间来的调用会并进这一轮。
    final runGuard = Completer<void>();
    _activeBackupUserId = userId;
    // 多数轮次没人等；没人监听的 Future 上 completeError 会变成未处理异常。
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
          // 按 generation 过滤：迟到的取消不能删掉这轮正在传的那行。
          onCancelled: (id) => _handleForegroundBackupCancelled(generation, id),
        ),
      );
    } catch (error, stackTrace) {
      // 正常完成会告诉等它的人「成功了」。
      if (!runGuard.isCompleted) {
        runGuard.completeError(error, stackTrace);
      }
      rethrow;
    } finally {
      // 只有还是我们的才释放，pause 可能已经交给新一轮。
      if (identical(_activeBackupRun, runGuard.future)) {
        _activeBackupRun = null;
        _activeBackupUserId = null;
        // 留着已完成的 Completer，下一轮会打一条并不存在的取消日志。
        if (identical(_cancelToken, cancelToken)) {
          _cancelToken = null;
        }
        // 那条分支还负责清每轮的 UI 状态。
        _uploadSpeedManager.clear();
        state = state.copyWith(uploadItems: {}, iCloudDownloadProgress: {});
      }
      if (!runGuard.isCompleted) {
        runGuard.complete();
      }
    }
  }

  /// 不插入条目：加回去会让用户刚删掉的行复活。
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
    // 在途的原生传输在 Cronet 反应之前还会继续报。
    _backupGeneration++;
    // 旧 future 还没收尾时来的 resume 要开新的一轮。
    _activeBackupRun = null;
    _activeBackupUserId = null;
    _uploadSpeedManager.clear();
    state = state.copyWith(uploadItems: {}, iCloudDownloadProgress: {});
  }

  void _handleICloudProgress(int generation, String localAssetId, double progress) {
    if (!mounted || generation != _backupGeneration) {
      // 已 dispose，或者停掉那轮漏过来的回调。
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
      // 停掉那轮的上传被取消，迟到才报。
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
