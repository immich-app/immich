// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/services/drift_backup.service.dart';
import 'package:immich_mobile/services/upload.service.dart';

class EnqueueStatus {
  final int enqueueCount;
  final int totalCount;

  const EnqueueStatus({
    required this.enqueueCount,
    required this.totalCount,
  });

  EnqueueStatus copyWith({
    int? enqueueCount,
    int? totalCount,
  }) {
    return EnqueueStatus(
      enqueueCount: enqueueCount ?? this.enqueueCount,
      totalCount: totalCount ?? this.totalCount,
    );
  }

  @override
  String toString() =>
      'EnqueueStatus(enqueueCount: $enqueueCount, totalCount: $totalCount)';
}

class DriftUploadStatus {
  final String taskId;
  final String filename;
  final double progress;
  final int fileSize;
  final String networkSpeedAsString;

  const DriftUploadStatus({
    required this.taskId,
    required this.filename,
    required this.progress,
    required this.fileSize,
    required this.networkSpeedAsString,
  });

  DriftUploadStatus copyWith({
    String? taskId,
    String? filename,
    double? progress,
    int? fileSize,
    String? networkSpeedAsString,
  }) {
    return DriftUploadStatus(
      taskId: taskId ?? this.taskId,
      filename: filename ?? this.filename,
      progress: progress ?? this.progress,
      fileSize: fileSize ?? this.fileSize,
      networkSpeedAsString: networkSpeedAsString ?? this.networkSpeedAsString,
    );
  }

  @override
  String toString() {
    return 'DriftUploadStatus(taskId: $taskId, filename: $filename, progress: $progress, fileSize: $fileSize, networkSpeedAsString: $networkSpeedAsString)';
  }

  @override
  bool operator ==(covariant DriftUploadStatus other) {
    if (identical(this, other)) return true;

    return other.taskId == taskId &&
        other.filename == filename &&
        other.progress == progress &&
        other.fileSize == fileSize &&
        other.networkSpeedAsString == networkSpeedAsString;
  }

  @override
  int get hashCode {
    return taskId.hashCode ^
        filename.hashCode ^
        progress.hashCode ^
        fileSize.hashCode ^
        networkSpeedAsString.hashCode;
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'taskId': taskId,
      'filename': filename,
      'progress': progress,
      'fileSize': fileSize,
      'networkSpeedAsString': networkSpeedAsString,
    };
  }

  factory DriftUploadStatus.fromMap(Map<String, dynamic> map) {
    return DriftUploadStatus(
      taskId: map['taskId'] as String,
      filename: map['filename'] as String,
      progress: map['progress'] as double,
      fileSize: map['fileSize'] as int,
      networkSpeedAsString: map['networkSpeedAsString'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory DriftUploadStatus.fromJson(String source) =>
      DriftUploadStatus.fromMap(json.decode(source) as Map<String, dynamic>);
}

class DriftBackupState {
  final int totalCount;
  final int backupCount;
  final int remainderCount;

  final int enqueueCount;
  final int enqueueTotalCount;

  final bool isCanceling;

  final Map<String, DriftUploadStatus> uploadItems;

  const DriftBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
    required this.enqueueCount,
    required this.enqueueTotalCount,
    required this.isCanceling,
    required this.uploadItems,
  });

  DriftBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
    int? enqueueCount,
    int? enqueueTotalCount,
    bool? isCanceling,
    Map<String, DriftUploadStatus>? uploadItems,
  }) {
    return DriftBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
      enqueueCount: enqueueCount ?? this.enqueueCount,
      enqueueTotalCount: enqueueTotalCount ?? this.enqueueTotalCount,
      isCanceling: isCanceling ?? this.isCanceling,
      uploadItems: uploadItems ?? this.uploadItems,
    );
  }

  @override
  String toString() {
    return 'DriftBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount, enqueueCount: $enqueueCount, enqueueTotalCount: $enqueueTotalCount, isCanceling: $isCanceling, uploadItems: $uploadItems)';
  }

  @override
  bool operator ==(covariant DriftBackupState other) {
    if (identical(this, other)) return true;
    final mapEquals = const DeepCollectionEquality().equals;

    return other.totalCount == totalCount &&
        other.backupCount == backupCount &&
        other.remainderCount == remainderCount &&
        other.enqueueCount == enqueueCount &&
        other.enqueueTotalCount == enqueueTotalCount &&
        other.isCanceling == isCanceling &&
        mapEquals(other.uploadItems, uploadItems);
  }

  @override
  int get hashCode {
    return totalCount.hashCode ^
        backupCount.hashCode ^
        remainderCount.hashCode ^
        enqueueCount.hashCode ^
        enqueueTotalCount.hashCode ^
        isCanceling.hashCode ^
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
            enqueueCount: 0,
            enqueueTotalCount: 0,
            isCanceling: false,
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

  /// Remove upload item from state
  void _removeUploadItem(String taskId) {
    if (state.uploadItems.containsKey(taskId)) {
      final updatedItems =
          Map<String, DriftUploadStatus>.from(state.uploadItems);
      updatedItems.remove(taskId);
      state = state.copyWith(uploadItems: updatedItems);
    }
  }

  void _handleTaskStatusUpdate(TaskStatusUpdate update) {
    switch (update.status) {
      case TaskStatus.complete:
        if (update.task.group == kBackupGroup) {
          state = state.copyWith(
            backupCount: state.backupCount + 1,
            remainderCount: state.remainderCount - 1,
          );
        }

        // Remove the completed task from the upload items
        final taskId = update.task.taskId;
        if (state.uploadItems.containsKey(taskId)) {
          Future.delayed(const Duration(milliseconds: 500), () {
            _removeUploadItem(taskId);
          });
        }

      case TaskStatus.failed:
        break;

      case TaskStatus.canceled:
        _removeUploadItem(update.task.taskId);
        break;

      default:
        break;
    }
  }

  void _handleTaskProgressUpdate(TaskProgressUpdate update) {
    final taskId = update.task.taskId;
    final filename = update.task.displayName;
    final progress = update.progress;
    final currentItem = state.uploadItems[taskId];
    if (currentItem != null) {
      if (progress == kUploadStatusCanceled) {
        _removeUploadItem(update.task.taskId);
        return;
      }

      state = state.copyWith(
        uploadItems: {
          ...state.uploadItems,
          taskId: update.hasExpectedFileSize
              ? currentItem.copyWith(
                  progress: progress,
                  fileSize: update.expectedFileSize,
                  networkSpeedAsString: update.networkSpeedAsString,
                )
              : currentItem.copyWith(
                  progress: progress,
                ),
        },
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
    return _backupService.backup(_updateEnqueueCount);
  }

  void _updateEnqueueCount(EnqueueStatus status) {
    state = state.copyWith(
      enqueueCount: status.enqueueCount,
      enqueueTotalCount: status.totalCount,
    );
  }

  Future<void> cancel() async {
    state = state.copyWith(
      enqueueCount: 0,
      enqueueTotalCount: 0,
      isCanceling: true,
    );

    await _backupService.cancel();

    // Check if there are any tasks left in the queue
    final tasks = await FileDownloader().allTasks(group: kBackupGroup);

    debugPrint("Tasks left to cancel: ${tasks.length}");

    if (tasks.isNotEmpty) {
      await cancel();
    } else {
      // Clear all upload items when cancellation is complete
      state = state.copyWith(
        isCanceling: false,
        uploadItems: {},
      );
    }
  }

  Future<void> handleBackupResume() async {
    final tasks = await FileDownloader().allTasks(group: kBackupGroup);
    if (tasks.isEmpty) {
      // Start a new backup queue
      await backup();
    }

    debugPrint("Tasks to resume: ${tasks.length}");
    await FileDownloader().start();
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    _progressSubscription?.cancel();
    super.dispose();
  }
}
