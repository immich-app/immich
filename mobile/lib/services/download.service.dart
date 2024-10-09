import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/download.interface.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/download.dart';

final downloadServiceProvider = Provider(
  (ref) => DownloadService(
    ref.watch(fileMediaRepositoryProvider),
    ref.watch(downloadRepositoryProvider),
  ),
);

class DownloadService {
  final IDownloadRepository _downloadRepository;
  final IFileMediaRepository _fileMediaRepository;
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  DownloadService(
    this._fileMediaRepository,
    this._downloadRepository,
  ) {
    _downloadRepository.onImageDownloadStatus = _onImageDownloadCallback;
    _downloadRepository.onVideoDownloadStatus = _onVideoDownloadCallback;
    _downloadRepository.onLivePhotoDownloadStatus =
        _onLivePhotoDownloadCallback;
    _downloadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  void _onImageDownloadCallback(TaskStatusUpdate update) {
    onImageDownloadStatus?.call(update);
  }

  void _onVideoDownloadCallback(TaskStatusUpdate update) {
    onVideoDownloadStatus?.call(update);
  }

  void _onLivePhotoDownloadCallback(TaskStatusUpdate update) {
    onLivePhotoDownloadStatus?.call(update);
  }

  Future<bool> saveImage(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    final data = await File(filePath).readAsBytes();

    final Asset? resultAsset = await _fileMediaRepository.saveImage(
      data,
      title: title,
      relativePath: relativePath,
    );

    return resultAsset != null;
  }

  Future<bool> saveVideo(Task task) async {
    final filePath = await task.filePath();
    final title = task.filename;
    final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;
    final file = File(filePath);

    final Asset? resultAsset = await _fileMediaRepository.saveVideo(
      file,
      title: title,
      relativePath: relativePath,
    );

    return resultAsset != null;
  }

  Future<bool> saveLivePhotos(
    Task task,
    String livePhotosId,
  ) async {
    try {
      final records = await _downloadRepository.getLiveVideoTasks();
      if (records.length < 2) {
        return false;
      }

      final imageRecord = records.firstWhere(
        (record) {
          final metadata = LivePhotosMetadata.fromJson(record.task.metaData);
          return metadata.id == livePhotosId &&
              metadata.part == LivePhotosPart.image;
        },
      );

      final videoRecord = records.firstWhere((record) {
        final metadata = LivePhotosMetadata.fromJson(record.task.metaData);
        return metadata.id == livePhotosId &&
            metadata.part == LivePhotosPart.video;
      });

      final imageFilePath = await imageRecord.task.filePath();
      final videoFilePath = await videoRecord.task.filePath();

      final resultAsset = await _fileMediaRepository.saveLivePhoto(
        image: File(imageFilePath),
        video: File(videoFilePath),
        title: task.filename,
      );

      await _downloadRepository.deleteRecordsWithIds([
        imageRecord.task.taskId,
        videoRecord.task.taskId,
      ]);

      return resultAsset != null;
    } catch (error) {
      debugPrint("Error saving live photo: $error");
      return false;
    }
  }

  Future<bool> cancelDownload(String id) async {
    return await FileDownloader().cancelTaskWithId(id);
  }

  Future<void> download(Asset asset) async {
    if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
      await _downloadRepository.download(
        _buildDownloadTask(
          asset.remoteId!,
          asset.fileName,
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.image,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );

      await _downloadRepository.download(
        _buildDownloadTask(
          asset.livePhotoVideoId!,
          asset.fileName.toUpperCase().replaceAll(".HEIC", '.MOV'),
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.video,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );
    } else {
      await _downloadRepository.download(
        _buildDownloadTask(
          asset.remoteId!,
          asset.fileName,
          group: asset.isImage ? downloadGroupImage : downloadGroupVideo,
        ),
      );
    }
  }

  DownloadTask _buildDownloadTask(
    String id,
    String filename, {
    String? group,
    String? metadata,
  }) {
    final path = r'/assets/{id}/original'.replaceAll('{id}', id);
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final headers = ApiService.getRequestHeaders();

    return DownloadTask(
      taskId: id,
      url: serverEndpoint + path,
      headers: headers,
      filename: filename,
      updates: Updates.statusAndProgress,
      group: group ?? '',
      metaData: metadata ?? '',
    );
  }
}
