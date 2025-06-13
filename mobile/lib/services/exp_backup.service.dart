// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/utils/upload.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:immich_mobile/domain/interfaces/backup.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/providers/infrastructure/storage.provider.dart';
import 'package:immich_mobile/services/upload.service.dart';

final expBackupServiceProvider = Provider<ExpBackupService>(
  (ref) => ExpBackupService(
    ref.watch(backupRepositoryProvider),
    ref.watch(storageRepositoryProvider),
    ref.watch(uploadServiceProvider),
    ref.watch(localAssetRepository),
  ),
);

class ExpBackupService {
  ExpBackupService(
    this._backupRepository,
    this._storageRepository,
    this._uploadService,
    this._localAssetRepository,
  ) {
    _statusSubscription =
        _uploadService.taskStatusStream.listen(_handleTaskStatusUpdate);
  }

  final IBackupRepository _backupRepository;
  final IStorageRepository _storageRepository;
  final ILocalAssetRepository _localAssetRepository;
  final UploadService _uploadService;

  StreamSubscription<TaskStatusUpdate>? _statusSubscription;
  StreamSubscription<TaskProgressUpdate>? _progressSubscription;

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
    final sw = Stopwatch()..start();
    shouldCancel = false;

    final candidates = await _backupRepository.getCandidates();
    if (candidates.isEmpty) {
      return;
    }

    print(
      "Stopwatch: getCandidates (${candidates.length}) took ${sw.elapsedMilliseconds} ms",
    );

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

  Future<void> _handleTaskStatusUpdate(TaskStatusUpdate update) async {
    switch (update.status) {
      case TaskStatus.complete:
        await _handleLivePhoto(update);
        break;

      default:
        break;
    }
  }

  Future<void> _handleLivePhoto(TaskStatusUpdate update) async {
    try {
      if (update.task.metaData.isEmpty || update.task.metaData == '') {
        return;
      }

      final metadata = UploadTaskMetadata.fromJson(update.task.metaData);
      if (!metadata.isLivePhotos && metadata.livePhotoVideoId.isEmpty) {
        return;
      }
      print("gotmetadata");

      final localAsset =
          await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }
      print("localAsset");

      final uploadTask = await _getLivePhotoUploadTask(
        localAsset,
        metadata.livePhotoVideoId,
      );

      if (uploadTask == null) {
        return;
      }
      print("enqueueTasks _getLivePhotoUploadTask $uploadTask");
      _uploadService.enqueueTasks([uploadTask]);
    } catch (_) {}
  }

  Future<UploadTask?> _getUploadTask(LocalAsset asset) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    File? file;
    if (entity.isLivePhoto) {
      file = await _storageRepository.getMotionFileForAsset(asset);
    } else {
      file = await _storageRepository.getFileForAsset(asset);
    }

    if (file == null) {
      return null;
    }

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      livePhotoVideoId: '',
    ).toJson();

    return _uploadService.buildUploadTask(
      file,
      originalFileName: asset.name,
      deviceAssetId: asset.id,
      metadata: metadata,
    );
  }

  Future<UploadTask?> _getLivePhotoUploadTask(
    LocalAsset asset,
    String livePhotoVideoId,
  ) async {
    final entity = await _storageRepository.getAssetEntityForAsset(asset);
    if (entity == null) {
      return null;
    }

    final file = await _storageRepository.getFileForAsset(asset);
    if (file == null) {
      return null;
    }

    final fields = {
      'livePhotoVideoId': livePhotoVideoId,
    };

    return _uploadService.buildUploadTask(
      file,
      originalFileName: asset.name,
      deviceAssetId: asset.id,
      fields: fields,
      group: kUploadLivePhotoGroup,
    );
  }

  Future<void> cancel() async {
    shouldCancel = true;
    await _uploadService.cancel();
  }
}

class UploadTaskMetadata {
  final String localAssetId;
  final bool isLivePhotos;
  final String livePhotoVideoId;

  UploadTaskMetadata({
    required this.localAssetId,
    required this.isLivePhotos,
    required this.livePhotoVideoId,
  });

  UploadTaskMetadata copyWith({
    String? localAssetId,
    bool? isLivePhotos,
    String? livePhotoVideoId,
  }) {
    return UploadTaskMetadata(
      localAssetId: localAssetId ?? this.localAssetId,
      isLivePhotos: isLivePhotos ?? this.isLivePhotos,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'localAssetId': localAssetId,
      'isLivePhotos': isLivePhotos,
      'livePhotoVideoId': livePhotoVideoId,
    };
  }

  factory UploadTaskMetadata.fromMap(Map<String, dynamic> map) {
    return UploadTaskMetadata(
      localAssetId: map['localAssetId'] as String,
      isLivePhotos: map['isLivePhotos'] as bool,
      livePhotoVideoId: map['livePhotoVideoId'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory UploadTaskMetadata.fromJson(String source) =>
      UploadTaskMetadata.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'UploadTaskMetadata(localAssetId: $localAssetId, isLivePhotos: $isLivePhotos, livePhotoVideoId: $livePhotoVideoId)';

  @override
  bool operator ==(covariant UploadTaskMetadata other) {
    if (identical(this, other)) return true;

    return other.localAssetId == localAssetId &&
        other.isLivePhotos == isLivePhotos &&
        other.livePhotoVideoId == livePhotoVideoId;
  }

  @override
  int get hashCode =>
      localAssetId.hashCode ^ isLivePhotos.hashCode ^ livePhotoVideoId.hashCode;
}
