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

  ImageViewerService(
    this._apiService,
    this._fileMediaRepository,
  );

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
    String imageFilePath,
    String videoFilePath,
    String title,
  ) async {
    final imageFile = File(imageFilePath);
    final videoFile = File(videoFilePath);

    final Asset? resultAsset = await _fileMediaRepository.saveLivePhoto(
      image: imageFile,
      video: videoFile,
      title: title,
    );

    return resultAsset != null;
  }

  Future<void> downloadAsset(Asset asset) async {
    if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
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
          asset.fileName,
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
