import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/platform/upload_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

final uploadServiceProvider = Provider((ref) {
  final service = UploadService(ref.watch(backupRepositoryProvider));
  return service;
});

class UploadService {
  final Stream<UploadApiTaskStatus> taskStatusStream;
  final Stream<UploadApiTaskProgress> taskProgressStream;
  UploadService(this._backupRepository) : taskStatusStream = streamStatus(), taskProgressStream = streamProgress();

  final DriftBackupRepository _backupRepository;
  bool shouldAbortQueuingTasks = false;

  Future<({int total, int remainder, int processing})> getBackupCounts(String userId) {
    return _backupRepository.getAllCounts(userId);
  }

  Future<void> manualBackup(List<LocalAsset> localAssets) {
    return uploadApi.enqueueAssets(localAssets.map((e) => e.id).toList(growable: false));
  }

  /// Find backup candidates
  /// Build the upload tasks
  /// Enqueue the tasks
  Future<void> startBackup() async {
    return uploadApi.refresh();
  }

  /// Cancel all ongoing uploads and reset the upload queue
  ///
  /// Return the number of left over tasks in the queue
  Future<void> cancelBackup() {
    return uploadApi.cancelAll();
  }
}
