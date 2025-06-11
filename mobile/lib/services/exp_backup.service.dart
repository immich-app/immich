import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/interfaces/backup.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/services/upload.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final expBackupServiceProvider = Provider<ExpBackupService>(
  (ref) => ExpBackupService(
    ref.watch(backupRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(uploadServiceProvider),
  ),
);

class ExpBackupService {
  ExpBackupService(
    this._backupRepository,
    this._storageRepository,
    this._uploadService,
  );

  final IBackupRepository _backupRepository;
  final IStorageRepository _storageRepository;
  final UploadService _uploadService;
  bool shouldCancel = false;

  Future<int> getTotalCount() {
    return _backupRepository.getTotalCount();
  }

  Future<int> getRemainderCount() {
    return _backupRepository.getRemainderCount();
  }

  Future<int> getBackupCount() {
    return _backupRepository.getBackupCount();
  }

  Future<void> backup() async {
    shouldCancel = false;

    final candidates = await _backupRepository.getCandidates();
    if (candidates.isEmpty) {
      return;
    }

    const batchSize = 5;
    for (int i = 0; i < candidates.length; i += batchSize) {
      if (shouldCancel) {
        break;
      }

      final batch = candidates.skip(i).take(batchSize).toList();

      List<UploadTask> tasks = [];
      for (final asset in batch) {
        final task = await _getUploadTask(asset);
        if (task != null) {
          tasks.add(task);
        }
      }

      if (tasks.isNotEmpty && !shouldCancel) {
        _uploadService.enqueueTasks(tasks);
      }
    }
  }

  Future<UploadTask?> _getUploadTask(LocalAsset asset) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset);
    if (file == null) {
      return null;
    }

    return _uploadService.buildUploadTask(
      file,
      originalFileName: asset.name,
      deviceAssetId: asset.id,
    );
  }

  Future<void> cancel() async {
    shouldCancel = true;
    await _uploadService.cancel();
  }
}
