import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:logging/logging.dart';

final downloadServiceProvider = Provider(
  (ref) => DownloadService(ref.watch(fileMediaRepositoryProvider), ref.watch(downloadRepositoryProvider)),
);

class DownloadService {
  final DownloadRepository _downloadRepository;
  final FileMediaRepository _fileMediaRepository;
  final Logger _log = Logger("DownloadService");
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  /// Active Live Photo IDs undergoing saving
  final Set<String> _savingLivePhotoIds = {};

  DownloadService(this._fileMediaRepository, this._downloadRepository) {
    _downloadRepository.onImageDownloadStatus = _onImageDownloadCallback;
    _downloadRepository.onVideoDownloadStatus = _onVideoDownloadCallback;
    _downloadRepository.onTaskProgress = _onTaskProgressCallback;
    _downloadRepository.onLivePhotoRecordComplete = _onLivePhotoRecordComplete;

    unawaited(_savePreviouslyCompletedLivePhotos());
  }

  Future<void> _savePreviouslyCompletedLivePhotos() async {
    // Specifically fetch Live Photo video components only, as to not double fetch assets
    final records = await _downloadRepository.getLiveVideoTasks();
    final completedIds = records.map((record) => LivePhotosMetadata.fromJson(record.task.metaData).id).toSet();
    for (final id in completedIds) {
      await _saveLivePhotos(id);
    }
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  void _onImageDownloadCallback(TaskStatusUpdate update) {
    if (update.status == TaskStatus.complete) {
      unawaited(_saveImageWithPath(update.task));
    }

    onImageDownloadStatus?.call(update);
  }

  void _onVideoDownloadCallback(TaskStatusUpdate update) {
    if (update.status == TaskStatus.complete) {
      unawaited(_saveVideo(update.task));
    }

    onVideoDownloadStatus?.call(update);
  }

  void _onLivePhotoRecordComplete(TaskRecord record) async {
    final livePhotosId = LivePhotosMetadata.fromJson(record.task.metaData).id;
    await _saveLivePhotos(livePhotosId);
  }

  Future<bool> _saveImageWithPath(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    try {
      final resultAsset = await _fileMediaRepository.saveImageWithFile(
        filePath,
        title: title,
        relativePath: relativePath,
      );
      return resultAsset != null;
    } catch (error, stack) {
      _log.severe("Error saving image", error, stack);
      return false;
    } finally {
      if (await File(filePath).exists()) {
        await File(filePath).delete();
      }
    }
  }

  Future<bool> _saveVideo(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    final file = File(filePath);
    try {
      final resultAsset = await _fileMediaRepository.saveVideo(file, title: title, relativePath: relativePath);
      return resultAsset != null;
    } catch (error, stack) {
      _log.severe("Error saving video", error, stack);
      return false;
    } finally {
      if (await file.exists()) {
        await file.delete();
      }
    }
  }

  Future<bool> _saveLivePhotos(String livePhotosId) async {
    final records = await _downloadRepository.getLiveVideoTasks();
    final imageRecord = _findTaskRecord(records, livePhotosId, LivePhotosPart.image);
    final videoRecord = _findTaskRecord(records, livePhotosId, LivePhotosPart.video);

    if (imageRecord == null || videoRecord == null) {
      return false;
    }

    // Write semaphore for this `livePhotoId`
    if (!_savingLivePhotoIds.add(livePhotosId)) {
      return false;
    }

    final title = imageRecord.task.filename;
    final imageFilePath = await imageRecord.task.filePath();
    final videoFilePath = await videoRecord.task.filePath();

    try {
      final result = await _fileMediaRepository.saveLivePhoto(
        image: File(imageFilePath),
        video: File(videoFilePath),
        title: title,
      );

      return result != null;
    } on PlatformException catch (error, stack) {
      // Handle saving MotionPhotos on iOS
      if (error.code.startsWith('PHPhotosErrorDomain')) {
        final result = await _fileMediaRepository.saveImageWithFile(imageFilePath, title: title);
        return result != null;
      }
      _log.severe("Error saving live photo", error, stack);
      return false;
    } catch (error, stack) {
      _log.severe("Error saving live photo", error, stack);
      return false;
    } finally {
      final imageFile = File(imageFilePath);
      if (await imageFile.exists()) {
        await imageFile.delete();
      }

      final videoFile = File(videoFilePath);
      if (await videoFile.exists()) {
        await videoFile.delete();
      }

      await _downloadRepository.deleteRecordsWithIds([imageRecord.task.taskId, videoRecord.task.taskId]);
      _savingLivePhotoIds.remove(livePhotosId);
    }
  }

  Future<bool> cancelDownload(String id) async {
    return await FileDownloader().cancelTaskWithId(id);
  }
}

TaskRecord? _findTaskRecord(List<TaskRecord> records, String livePhotosId, LivePhotosPart part) {
  return records.firstWhereOrNull((record) {
    final metadata = LivePhotosMetadata.fromJson(record.task.metaData);
    return metadata.id == livePhotosId && metadata.part == part;
  });
}
