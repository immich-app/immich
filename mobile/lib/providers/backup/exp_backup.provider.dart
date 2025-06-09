// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/cupertino.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';

import 'package:immich_mobile/services/exp_backup.service.dart';
import 'package:immich_mobile/services/upload.service.dart';

class ExpBackupState {
  final int totalCount;
  final int backupCount;
  final int remainderCount;

  ExpBackupState({
    required this.totalCount,
    required this.backupCount,
    required this.remainderCount,
  });

  ExpBackupState copyWith({
    int? totalCount,
    int? backupCount,
    int? remainderCount,
  }) {
    return ExpBackupState(
      totalCount: totalCount ?? this.totalCount,
      backupCount: backupCount ?? this.backupCount,
      remainderCount: remainderCount ?? this.remainderCount,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'totalCount': totalCount,
      'backupCount': backupCount,
      'remainderCount': remainderCount,
    };
  }

  factory ExpBackupState.fromMap(Map<String, dynamic> map) {
    return ExpBackupState(
      totalCount: map['totalCount'] as int,
      backupCount: map['backupCount'] as int,
      remainderCount: map['remainderCount'] as int,
    );
  }

  String toJson() => json.encode(toMap());

  factory ExpBackupState.fromJson(String source) =>
      ExpBackupState.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'ExpBackupState(totalCount: $totalCount, backupCount: $backupCount, remainderCount: $remainderCount)';

  @override
  bool operator ==(covariant ExpBackupState other) {
    if (identical(this, other)) return true;

    return other.totalCount == totalCount &&
        other.backupCount == backupCount &&
        other.remainderCount == remainderCount;
  }

  @override
  int get hashCode =>
      totalCount.hashCode ^ backupCount.hashCode ^ remainderCount.hashCode;
}

final expBackupProvider =
    StateNotifierProvider<ExpBackupNotifier, ExpBackupState>((ref) {
  return ExpBackupNotifier(
    ref.watch(expBackupServiceProvider),
    ref.watch(uploadServiceProvider),
    ref.watch(backgroundSyncProvider),
  );
});

class ExpBackupNotifier extends StateNotifier<ExpBackupState> {
  ExpBackupNotifier(
    this._backupService,
    this._uploadService,
    this._backgroundSyncManager,
  ) : super(
          ExpBackupState(
            totalCount: 0,
            backupCount: 0,
            remainderCount: 0,
          ),
        ) {
    {
      _uploadService.onUploadStatus = _uploadStatusCallback;
      _uploadService.onTaskProgress = _taskProgressCallback;
    }
  }

  final ExpBackupService _backupService;
  final UploadService _uploadService;
  final BackgroundSyncManager _backgroundSyncManager;

  void _updateUploadStatus(TaskStatusUpdate task, TaskStatus status) async {
    if (status == TaskStatus.canceled) {
      return;
    }
  }

  void _uploadStatusCallback(TaskStatusUpdate update) {
    _updateUploadStatus(update, update.status);

    switch (update.status) {
      case TaskStatus.complete:
        state = state.copyWith(
          backupCount: state.backupCount + 1,
          remainderCount: state.remainderCount - 1,
        );

        // TODO: find a better place to call this.
        _backgroundSyncManager.syncRemote();
        break;

      default:
        break;
    }
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    debugPrint("[_taskProgressCallback] $update");
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

  Future<void> backup() async {
    await _backupService.backup();
  }

  Future<void> cancel() async {
    await _uploadService.cancel();
    debugPrint("Cancel uploads");
  }
}
