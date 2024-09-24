import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/response_extensions.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/file_media.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/download.dart';
import 'package:logging/logging.dart';

import 'package:path_provider/path_provider.dart';

final imageViewerServiceProvider = Provider(
  (ref) => ImageViewerService(
    ref.watch(apiServiceProvider),
    ref.watch(fileMediaRepositoryProvider),
  ),
);

class ImageViewerService {
  final ApiService _apiService;
  final IFileMediaRepository _fileMediaRepository;
  final Logger _log = Logger("ImageViewerService");
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  ImageViewerService(
    this._apiService,
    this._fileMediaRepository,
  ) {
    FileDownloader().registerCallbacks(
      group: downloadGroupImage,
      taskStatusCallback: _downloadImageCallback,
      taskProgressCallback: _taskProgressCallback,
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupVideo,
      taskStatusCallback: _downloadVideoCallback,
      taskProgressCallback: _taskProgressCallback,
    );

    FileDownloader().registerCallbacks(
      group: downloadGroupLivePhoto,
      taskStatusCallback: _downloadLivePhotoCallback,
      taskProgressCallback: _taskProgressCallback,
    );
  }

  void _downloadImageCallback(TaskStatusUpdate update) {
    onImageDownloadStatus?.call(update);
  }

  void _downloadVideoCallback(TaskStatusUpdate update) {
    onVideoDownloadStatus?.call(update);
  }

  void _downloadLivePhotoCallback(TaskStatusUpdate update) {
    onLivePhotoDownloadStatus?.call(update);
  }

  void _taskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  Future<bool> downloadAsset1(Asset asset) async {
    File? imageFile;
    File? videoFile;
    try {
      // Download LivePhotos image and motion part
      if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
        var imageResponse =
            await _apiService.assetsApi.downloadAssetWithHttpInfo(
          asset.remoteId!,
        );

        var motionResponse =
            await _apiService.assetsApi.downloadAssetWithHttpInfo(
          asset.livePhotoVideoId!,
        );

        if (imageResponse.statusCode != 200 ||
            motionResponse.statusCode != 200) {
          final failedResponse =
              imageResponse.statusCode != 200 ? imageResponse : motionResponse;
          _log.severe(
            "Motion asset download failed",
            failedResponse.toLoggerString(),
          );
          return false;
        }

        Asset? resultAsset;

        final tempDir = await getTemporaryDirectory();
        videoFile = await File('${tempDir.path}/livephoto.mov').create();
        imageFile = await File('${tempDir.path}/livephoto.heic').create();
        videoFile.writeAsBytesSync(motionResponse.bodyBytes);
        imageFile.writeAsBytesSync(imageResponse.bodyBytes);

        resultAsset = await _fileMediaRepository.saveLivePhoto(
          image: imageFile,
          video: videoFile,
          title: asset.fileName,
        );

        if (resultAsset == null) {
          _log.warning(
            "Asset cannot be saved as a live photo. This is most likely a motion photo. Saving only the image file",
          );
          resultAsset = await _fileMediaRepository
              .saveImage(imageResponse.bodyBytes, title: asset.fileName);
        }

        return resultAsset != null;
      } else {
        var res = await _apiService.assetsApi
            .downloadAssetWithHttpInfo(asset.remoteId!);

        if (res.statusCode != 200) {
          _log.severe("Asset download failed", res.toLoggerString());
          return false;
        }

        final Asset? resultAsset;
        final relativePath = Platform.isAndroid ? 'DCIM/Immich' : null;

        if (asset.isImage) {
          resultAsset = await _fileMediaRepository.saveImage(
            res.bodyBytes,
            title: asset.fileName,
            relativePath: relativePath,
          );
        } else {
          final tempDir = await getTemporaryDirectory();
          videoFile = await File('${tempDir.path}/${asset.fileName}').create();
          videoFile.writeAsBytesSync(res.bodyBytes);
          resultAsset = await _fileMediaRepository.saveVideo(
            videoFile,
            title: asset.fileName,
            relativePath: relativePath,
          );
        }
        return resultAsset != null;
      }
    } catch (error, stack) {
      _log.severe("Error saving downloaded asset", error, stack);
      return false;
    } finally {
      // Clear temp files
      imageFile?.delete();
      videoFile?.delete();
    }
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

  Future<bool> saveLivePhoto(
    Task task,
  ) async {
    final records = await FileDownloader().database.allRecordsWithStatus(
          TaskStatus.complete,
          group: downloadGroupLivePhoto,
        );

    if (records.length != 2) {
      return false;
    }

    final imageRecord = records.firstWhere(
      (element) => element.task.metaData == 'image_part',
    );
    final videoRecord = records.firstWhere(
      (element) => element.task.metaData == 'video_part',
    );

    final imageFilePath = await imageRecord.task.filePath();
    final videoFilePath = await videoRecord.task.filePath();

    final resultAsset = await _fileMediaRepository.saveLivePhoto(
      image: File(imageFilePath),
      video: File(videoFilePath),
      title: task.filename,
    );

    return resultAsset != null;
  }

  Future<bool> cancelDownload(String id) async {
    return await FileDownloader().cancelTaskWithId(id);
  }

  Future<void> downloadAsset(Asset asset) async {
    if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
      // Remove all track records for saveLivePhoto to track when to start the linking process
      await FileDownloader().database.deleteAllRecords();

      await FileDownloader().enqueue(
        _buildDownloadTask(
          asset.remoteId!,
          asset.fileName,
          group: downloadGroupLivePhoto,
          metadata: 'image_part',
        ),
      );

      await FileDownloader().enqueue(
        _buildDownloadTask(
          asset.livePhotoVideoId!,
          asset.fileName.toUpperCase().replaceAll(".HEIC", '.MOV'),
          group: downloadGroupLivePhoto,
          metadata: 'video_part',
        ),
      );
    } else {
      await FileDownloader().enqueue(
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
