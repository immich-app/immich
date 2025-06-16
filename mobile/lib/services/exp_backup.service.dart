// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;
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
    _uploadService.taskStatusStream.listen(_handleTaskStatusUpdate);
  }

  final IBackupRepository _backupRepository;
  final IStorageRepository _storageRepository;
  final ILocalAssetRepository _localAssetRepository;
  final UploadService _uploadService;
  final _log = Logger("ExpBackupService");

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

  void _handleTaskStatusUpdate(TaskStatusUpdate update) {
    switch (update.status) {
      case TaskStatus.complete:
        _handleLivePhoto(update);
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
      if (!metadata.isLivePhotos) {
        return;
      }

      if (update.responseBody == null || update.responseBody!.isEmpty) {
        return;
      }
      final response = jsonDecode(update.responseBody!);

      final localAsset =
          await _localAssetRepository.getById(metadata.localAssetId);
      if (localAsset == null) {
        return;
      }

      final uploadTask = await _getLivePhotoUploadTask(
        localAsset,
        response['id'] as String,
      );

      if (uploadTask == null) {
        return;
      }

      _uploadService.enqueueTasks([uploadTask]);
    } catch (error, stackTrace) {
      _log.severe("Error handling live photo upload task", error, stackTrace);
      debugPrint("Error handling live photo upload task: $error $stackTrace");
    }
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

    final originalFileName = entity.isLivePhoto
        ? p.setExtension(
            asset.name,
            p.extension(file.path),
          )
        : asset.name;

    String metadata = UploadTaskMetadata(
      localAssetId: asset.id,
      isLivePhotos: entity.isLivePhoto,
      livePhotoVideoId: '',
    ).toJson();

    return _uploadService.buildUploadTask(
      file,
      originalFileName: originalFileName,
      deviceAssetId: asset.id,
      metadata: metadata,
      group: kBackupGroup,
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
      group: kBackupLivePhotoGroup,
    );
  }

  Future<void> cancel() async {
    shouldCancel = true;
    await _uploadService.cancelAllForGroup(kBackupGroup);
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
