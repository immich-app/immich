import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

final downloadRepositoryProvider = Provider((ref) => DownloadRepository());

class DownloadRepository {
  static final _downloader = FileDownloader();
  static final _dummyTask = DownloadTask(
    taskId: 'dummy',
    url: '',
    filename: 'dummy',
    group: '',
    updates: Updates.statusAndProgress,
  );
  static final _dummyMetadata = {'part': LivePhotosPart.image, 'id': ''};

  void Function(TaskStatusUpdate)? onImageDownloadStatus;

  void Function(TaskStatusUpdate)? onVideoDownloadStatus;

  void Function(TaskStatusUpdate)? onLivePhotoDownloadStatus;

  void Function(TaskProgressUpdate)? onTaskProgress;

  DownloadRepository() {
    _downloader.registerCallbacks(
      group: kDownloadGroupImage,
      taskStatusCallback: (update) => onImageDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );

    _downloader.registerCallbacks(
      group: kDownloadGroupVideo,
      taskStatusCallback: (update) => onVideoDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );

    _downloader.registerCallbacks(
      group: kDownloadGroupLivePhoto,
      taskStatusCallback: (update) => onLivePhotoDownloadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  Future<List<bool>> downloadAll(List<DownloadTask> tasks) {
    return _downloader.enqueueAll(tasks);
  }

  Future<void> deleteAllTrackingRecords() {
    return _downloader.database.deleteAllRecords();
  }

  Future<bool> cancel(String id) {
    return _downloader.cancelTaskWithId(id);
  }

  Future<List<TaskRecord>> getLiveVideoTasks() {
    return _downloader.database.allRecordsWithStatus(
      TaskStatus.complete,
      group: kDownloadGroupLivePhoto,
    );
  }

  Future<void> deleteRecordsWithIds(List<String> ids) {
    return _downloader.database.deleteRecordsWithIds(ids);
  }

  Future<List<bool>> downloadAllAssets(List<RemoteAsset> assets) async {
    if (assets.isEmpty) {
      return Future.value(const []);
    }

    final length = Platform.isAndroid ? assets.length : assets.length * 2;
    final tasks = List.filled(length, _dummyTask);
    int taskIndex = 0;
    final headers = ApiService.getRequestHeaders();
    for (final asset in assets) {
      if (!asset.isRemoteOnly) {
        continue;
      }

      final id = asset.id;
      final livePhotoVideoId = asset.livePhotoVideoId;
      final isVideo = asset.isVideo;
      final url = getOriginalUrlForRemoteId(id);

      if (Platform.isAndroid || livePhotoVideoId == null || isVideo) {
        tasks[taskIndex++] = DownloadTask(
          taskId: id,
          url: url,
          headers: headers,
          filename: asset.name,
          updates: Updates.statusAndProgress,
          group: isVideo ? kDownloadGroupVideo : kDownloadGroupImage,
        );
        continue;
      }

      _dummyMetadata['part'] = LivePhotosPart.image;
      _dummyMetadata['id'] = id;
      tasks[taskIndex++] = DownloadTask(
        taskId: id,
        url: url,
        headers: headers,
        filename: asset.name,
        updates: Updates.statusAndProgress,
        group: kDownloadGroupLivePhoto,
        metaData: json.encode(_dummyMetadata),
      );

      _dummyMetadata['part'] = LivePhotosPart.video;
      tasks[taskIndex++] = DownloadTask(
        taskId: livePhotoVideoId,
        url: url,
        headers: headers,
        filename: asset.name.toUpperCase().replaceAll(RegExp(r"\.(JPG|HEIC)$"), '.MOV'),
        updates: Updates.statusAndProgress,
        group: kDownloadGroupLivePhoto,
        metaData: json.encode(_dummyMetadata),
      );
    }
    if (taskIndex == 0) {
      return Future.value(const []);
    }
    return _downloader.enqueueAll(tasks.slice(0, taskIndex));
  }
}
