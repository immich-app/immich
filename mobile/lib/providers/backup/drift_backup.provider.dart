import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/services/drift_backup.service.dart';
import 'package:immich_mobile/services/upload.service.dart';

class DriftUploadStatus {
  final String taskId;
  final String filename;
  final double progress;

  const DriftUploadStatus({
    required this.taskId,
    required this.filename,
    required this.progress,
  });

  DriftUploadStatus copyWith({
    String? taskId,
    String? filename,
    double? progress,
  }) {
    return DriftUploadStatus(
      taskId: taskId ?? this.taskId,
      filename: filename ?? this.filename,
      progress: progress ?? this.progress,
    );
  }

  @override
  String toString() =>
      'ExpUploadStatus(taskId: $taskId, filename: $filename, progress: $progress)';

  @override
  bool operator ==(covariant DriftUploadStatus other) {
    if (identical(this, other)) return true;

    return other.taskId == taskId &&
        other.filename == filename &&
        other.progress == progress;
  }

  @override
  int get hashCode => taskId.hashCode ^ filename.hashCode ^ progress.hashCode;
}

class DriftBackupState {
  final int totalCount;
  final int backupCount;
  final int remainderCount;
  final Map<String, DriftUploadStatus> uploadItems;

  const DriftBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
    required this.uploadItems,
  });

  DriftBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
    Map<String, DriftUploadStatus>? uploadItems,
  }) {
    return DriftBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
      uploadItems: uploadItems ?? this.uploadItems,
    );
  }

  @override
  String toString() {
    return 'ExpBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount, uploadItems: $uploadItems)';
  }

  @override
  bool operator ==(covariant DriftBackupState other) {
    if (identical(this, other)) return true;
    final mapEquals = const DeepCollectionEquality().equals;

    return other.totalCount == totalCount &&
        other.backupCount == backupCount &&
        other.remainderCount == remainderCount &&
        mapEquals(other.uploadItems, uploadItems);
  }

  @override
  int get hashCode {
    return totalCount.hashCode ^
        backupCount.hashCode ^
        remainderCount.hashCode ^
        uploadItems.hashCode;
  }
}

final driftBackupProvider =
    StateNotifierProvider<ExpBackupNotifier, DriftBackupState>((ref) {
  return ExpBackupNotifier(
    ref.watch(driftBackupServiceProvider),
    ref.watch(uploadServiceProvider),
  );
});

class ExpBackupNotifier extends StateNotifier<DriftBackupState> {
  ExpBackupNotifier(
    this._backupService,
    this._uploadService,
  ) : super(
          const DriftBackupState(
            totalCount: 0,
            backupCount: 0,
            remainderCount: 0,
            uploadItems: {},
          ),
        ) {
    {
      _uploadService.taskStatusStream.listen(_handleTaskStatusUpdate);
      _uploadService.taskProgressStream.listen(_handleTaskProgressUpdate);
    }
  }

  final DriftBackupService _backupService;
  final UploadService _uploadService;
  StreamSubscription<TaskStatusUpdate>? _statusSubscription;
  StreamSubscription<TaskProgressUpdate>? _progressSubscription;

  void _handleTaskStatusUpdate(TaskStatusUpdate update) {
    switch (update.status) {
      case TaskStatus.complete:
        state = state.copyWith(
          backupCount: state.backupCount + 1,
          remainderCount: state.remainderCount - 1,
        );
        break;

      default:
        break;
    }
  }

  void _handleTaskProgressUpdate(TaskProgressUpdate update) {}

  Future<void> getBackupStatus() async {
    final [totalCount, backupCount, remainderCount] = await Future.wait([
      _backupService.getTotalCount(),
      _backupService.getBackupCount(),
      _backupService.getRemainderCount(),
    ]);

    state = state.copyWith(
      totalCount: totalCount,
      backupCount: backupCount,
      remainderCount: remainderCount,
    );
  }

  Future<void> backup() {
    return _backupService.backup();
  }

  Future<void> cancel() async {
    await _backupService.cancel();
    await getDataInfo();
  }

  Future<void> getDataInfo() async {
    final a = await FileDownloader().database.allRecordsWithStatus(
          TaskStatus.enqueued,
          group: kBackupGroup,
        );

    final b = await FileDownloader().allTasks(
      group: kBackupGroup,
    );

    debugPrint(
      "Enqueued tasks: ${a.length}, All tasks: ${b.length}",
    );
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    _progressSubscription?.cancel();
    super.dispose();
  }
}
