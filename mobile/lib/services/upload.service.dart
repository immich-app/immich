import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/upload.interface.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/download.dart';
import 'package:logging/logging.dart';

final uploadServiceProvider = Provider(
  (ref) => UploadService(
    ref.watch(uploadRepositoryProvider),
  ),
);

class UploadService {
  final IUploadRepository _uploadRepository;
  final Logger _log = Logger("UploadService");
  void Function(TaskStatusUpdate)? onImageDownloadStatus;
  void Function(TaskStatusUpdate)? onVideoDownloadStatus;
  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadService(
    this._uploadRepository,
  ) {
    _uploadRepository.onUploadStatus = _onUploadCallback;
    _uploadRepository.onTaskProgress = _onTaskProgressCallback;
  }

  void _onTaskProgressCallback(TaskProgressUpdate update) {
    onTaskProgress?.call(update);
  }

  void _onUploadCallback(TaskStatusUpdate update) {
    onImageDownloadStatus?.call(update);
  }

  Future<bool> cancelDownload(String id) async {
    return await FileDownloader().cancelTaskWithId(id);
  }

  Future<void> upload(Asset asset) async {
    if (asset.isImage && asset.livePhotoVideoId != null && Platform.isIOS) {
      await _uploadRepository.upload(
        _buildUploadTask(
          asset.remoteId!,
          asset.fileName,
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.image,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );

      await _uploadRepository.upload(
        _buildUploadTask(
          asset.livePhotoVideoId!,
          asset.fileName
              .toUpperCase()
              .replaceAll(RegExp(r"\.(JPG|HEIC)$"), '.MOV'),
          group: downloadGroupLivePhoto,
          metadata: LivePhotosMetadata(
            part: LivePhotosPart.video,
            id: asset.remoteId!,
          ).toJson(),
        ),
      );
    } else {
      await _uploadRepository.upload(
        _buildUploadTask(
          asset.remoteId!,
          asset.fileName,
          group: asset.isImage ? downloadGroupImage : downloadGroupVideo,
        ),
      );
    }
  }

  UploadTask _buildUploadTask(
    String id,
    String filename, {
    Map<String, String>? fields,
    String? group,
    String? metadata,
  }) {
    final serverEndpoint = Store.get(StoreKey.serverEndpoint);
    final url = Uri.parse('$serverEndpoint/assets').toString();
    final headers = ApiService.getRequestHeaders();
    final deviceId = Store.get(StoreKey.deviceId);

    final fieldsMap = {
      'deviceId': deviceId,
      'assetId': id,
      'filename': filename,
      if (fields != null) ...fields,
    };

    return UploadTask(
      taskId: id,
      httpRequestMethod: 'POST',
      url: url,
      headers: headers,
      filename: filename,
      fields: fieldsMap,
      fileField: 'assetData',
      updates: Updates.statusAndProgress,
      group: group ?? '',
      metaData: metadata ?? '',
    );
  }
}
