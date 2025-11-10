// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/platform/upload_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
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
    );
  }

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
  return DriftBackupNotifier(ref.watch(uploadServiceProvider));
});

class DriftBackupNotifier extends StateNotifier<DriftBackupState> {
  late final StreamSubscription<UploadApiTaskStatus> _taskStatusStream;
  late final StreamSubscription<UploadApiTaskProgress> _taskProgressStream;
  
  DriftBackupNotifier(this._uploadService)
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
    _taskStatusStream = _uploadService.taskStatusStream.listen(_handleTaskStatusUpdate);
    _taskProgressStream = _uploadService.taskProgressStream.listen(_handleTaskProgressUpdate);
  }

  final UploadService _uploadService;
  final _logger = Logger("DriftBackupNotifier");

  @override
  void dispose() {
    unawaited(_taskStatusStream.cancel());
    unawaited(_taskProgressStream.cancel());
    super.dispose();
  }

  /// Remove upload item from state
  void _removeUploadItem(String taskId) {
    if (state.uploadItems.containsKey(taskId)) {
      final updatedItems = Map<String, DriftUploadStatus>.from(state.uploadItems);
      updatedItems.remove(taskId);
      state = state.copyWith(uploadItems: updatedItems);
    }
  }

  void _handleTaskStatusUpdate(UploadApiTaskStatus update) {
    final taskId = update.id;

    switch (update.status) {
      case UploadApiStatus.uploadComplete:
        state = state.copyWith(backupCount: state.backupCount + 1, remainderCount: state.remainderCount - 1);

        // Remove the completed task from the upload items
        if (state.uploadItems.containsKey(taskId)) {
          Future.delayed(const Duration(milliseconds: 1000), () {
            _removeUploadItem(taskId);
          });
        }

      case UploadApiStatus.uploadFailed:
        final currentItem = state.uploadItems[taskId];
        if (currentItem == null) {
          return;
        }

        // String? error;
        // final exception = update.exception;
        // if (exception != null && exception is TaskHttpException) {
        //   final message = tryJsonDecode(exception.description)?['message'] as String?;
        //   if (message != null) {
        //     final responseCode = exception.httpResponseCode;
        //     error = "${exception.exceptionType}, response code $responseCode: $message";
        //   }
        // }
        // error ??= update.exception?.toString();

        // state = state.copyWith(
        //   uploadItems: {
        //     ...state.uploadItems,
        //     taskId: currentItem.copyWith(isFailed: true, error: error),
        //   },
        // );
        // _logger.fine("Upload failed for taskId: $taskId, exception: ${update.exception}");
        break;

      case UploadApiStatus.uploadPending:
        state = state.copyWith(
          uploadItems: {
            ...state.uploadItems,
            taskId: DriftUploadStatus(
              taskId: update.id.toString(),
              filename: update.filename,
              fileSize: 0,
              networkSpeedAsString: "",
              progress: 0.0,
            ),
          },
        );
        break;

      default:
        break;
    }
  }

  void _handleTaskProgressUpdate(UploadApiTaskProgress update) {
    final taskId = update.id;
    final progress = update.progress;
    final currentItem = state.uploadItems[taskId];
    if (currentItem == null) {
      return;
    }

    state = state.copyWith(
      uploadItems: {
        ...state.uploadItems,
        taskId: currentItem.copyWith(
          progress: progress,
          fileSize: update.totalBytes,
          networkSpeedAsString: update.speed?.toStringAsFixed(2) ?? "",
        ),
      },
    );
  }

  Future<void> getBackupStatus(String userId) async {
    final counts = await _uploadService.getBackupCounts(userId);

    state = state.copyWith(
      totalCount: counts.total,
      backupCount: counts.total - counts.remainder,
      remainderCount: counts.remainder,
      processingCount: counts.processing,
    );
  }

  void updateError(BackupError error) async {
    state = state.copyWith(error: error);
  }

  void updateSyncing(bool isSyncing) async {
    state = state.copyWith(isSyncing: isSyncing);
  }

  Future<void> startBackup() {
    state = state.copyWith(error: BackupError.none);
    return _uploadService.startBackup();
  }

  Future<void> cancel() async {
    dPrint(() => "Canceling backup tasks...");
    state = state.copyWith(enqueueCount: 0, enqueueTotalCount: 0, isCanceling: true, error: BackupError.none);

    await _uploadService.cancelBackup();
    dPrint(() => "All tasks canceled successfully.");
    state = state.copyWith(isCanceling: false, uploadItems: {});
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
