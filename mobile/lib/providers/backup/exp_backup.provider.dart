// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/services/exp_backup.service.dart';
import 'package:immich_mobile/services/upload.service.dart';

class ExpUploadStatus {
  final String taskId;
  final String filename;
  final double progress;
  ExpUploadStatus({
    required this.taskId,
    required this.filename,
    required this.progress,
  });

  ExpUploadStatus copyWith({
    String? taskId,
    String? filename,
    double? progress,
  }) {
    return ExpUploadStatus(
      taskId: taskId ?? this.taskId,
      filename: filename ?? this.filename,
      progress: progress ?? this.progress,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'taskId': taskId,
      'filename': filename,
      'progress': progress,
    };
  }

  factory ExpUploadStatus.fromMap(Map<String, dynamic> map) {
    return ExpUploadStatus(
      taskId: map['taskId'] as String,
      filename: map['filename'] as String,
      progress: map['progress'] as double,
    );
  }

  String toJson() => json.encode(toMap());

  factory ExpUploadStatus.fromJson(String source) =>
      ExpUploadStatus.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'ExpUploadStatus(taskId: $taskId, filename: $filename, progress: $progress)';

  @override
  bool operator ==(covariant ExpUploadStatus other) {
    if (identical(this, other)) return true;

    return other.taskId == taskId &&
        other.filename == filename &&
        other.progress == progress;
  }

  @override
  int get hashCode => taskId.hashCode ^ filename.hashCode ^ progress.hashCode;
}

class ExpBackupState {
  final int totalCount;
  final int backupCount;
  final int remainderCount;
  final Map<String, ExpUploadStatus> uploadItems;

  ExpBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
    required this.uploadItems,
  });

  ExpBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
    Map<String, ExpUploadStatus>? uploadItems,
  }) {
    return ExpBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
      uploadItems: uploadItems ?? this.uploadItems,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'totalCount': totalCount,
      'backupCount': backupCount,
      'remainderCount': remainderCount,
      'uploadItems': uploadItems,
    };
  }

  factory ExpBackupState.fromMap(Map<String, dynamic> map) {
    return ExpBackupState(
      totalCount: map['totalCount'] as int,
      backupCount: map['backupCount'] as int,
      remainderCount: map['remainderCount'] as int,
      uploadItems: Map<String, ExpUploadStatus>.from(
        (map['uploadItems'] as Map<String, dynamic>).map(
          (key, value) => MapEntry(
            key,
            ExpUploadStatus.fromMap(value as Map<String, dynamic>),
          ),
        ),
      ),
    );
  }

  String toJson() => json.encode(toMap());

  factory ExpBackupState.fromJson(String source) =>
      ExpBackupState.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'ExpBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount, uploadItems: $uploadItems)';
  }

  @override
  bool operator ==(covariant ExpBackupState other) {
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

final expBackupProvider =
    StateNotifierProvider<ExpBackupNotifier, ExpBackupState>((ref) {
  return ExpBackupNotifier(
    ref.watch(expBackupServiceProvider),
    ref.watch(uploadServiceProvider),
  );
});

class ExpBackupNotifier extends StateNotifier<ExpBackupState> {
  ExpBackupNotifier(
    this._backupService,
    this._uploadService,
  ) : super(
          ExpBackupState(
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

  final ExpBackupService _backupService;
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
    // await _backgroundSyncManager.syncRemote();

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

  Future<void> cancel() {
    return _backupService.cancel();
  }

  @override
  void dispose() {
    _statusSubscription?.cancel();
    _progressSubscription?.cancel();
    super.dispose();
  }
}
