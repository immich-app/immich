import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';
import 'package:immich_mobile/utils/debug_print.dart';

class UploadTaskWithFile {
  final File file;
  final UploadTask task;

  const UploadTaskWithFile({required this.file, required this.task});
}

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadRepository() {
    FileDownloader().registerCallbacks(
      group: kBackupGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kBackupLivePhotoGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kManualUploadGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  Future<void> enqueueBackground(UploadTask task) {
    return FileDownloader().enqueue(task);
  }

  Future<List<bool>> enqueueBackgroundAll(List<UploadTask> tasks) {
    return FileDownloader().enqueueAll(tasks);
  }

  Future<void> deleteDatabaseRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  Future<bool> cancelAll(String group) {
    return FileDownloader().cancelAll(group: group);
  }

  Future<int> reset(String group) {
    return FileDownloader().reset(group: group);
  }

  /// Get a list of tasks that are ENQUEUED or RUNNING
  Future<List<Task>> getActiveTasks(String group) {
    return FileDownloader().allTasks(group: group);
  }

  Future<void> start() {
    return FileDownloader().start();
  }

  Future<void> getUploadInfo() async {
    final [enqueuedTasks, runningTasks, canceledTasks, waitingTasks, pausedTasks] = await Future.wait([
      FileDownloader().database.allRecordsWithStatus(TaskStatus.enqueued, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.running, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.canceled, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.waitingToRetry, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.paused, group: kBackupGroup),
    ]);

    dPrint(
      () =>
          """
      Upload Info:
      Enqueued: ${enqueuedTasks.length}
      Running: ${runningTasks.length}
      Canceled: ${canceledTasks.length}
      Waiting: ${waitingTasks.length}
      Paused: ${pausedTasks.length}
    """,
    );
  }

  Future<void> backupWithDartClient(Iterable<UploadTaskWithFile> tasks, CancellationToken cancelToken) async {
    final httpClient = Client();
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);

    Logger logger = Logger('UploadRepository');
    for (final candidate in tasks) {
      if (cancelToken.isCancelled) {
        logger.warning("Backup was cancelled by the user");
        break;
      }

      try {
        final fileStream = candidate.file.openRead();
        final assetRawUploadData = MultipartFile(
          "assetData",
          fileStream,
          candidate.file.lengthSync(),
          filename: candidate.task.filename,
        );

        final baseRequest = MultipartRequest('POST', Uri.parse('$savedEndpoint/assets'));

        baseRequest.headers.addAll(candidate.task.headers);
        baseRequest.fields.addAll(candidate.task.fields);
        baseRequest.files.add(assetRawUploadData);

        final response = await httpClient.send(baseRequest, cancellationToken: cancelToken);

        final responseBody = jsonDecode(await response.stream.bytesToString());

        if (![200, 201].contains(response.statusCode)) {
          final error = responseBody;

          logger.warning(
            "Error(${error['statusCode']}) uploading ${candidate.task.filename} | Created on ${candidate.task.fields["fileCreatedAt"]} | ${error['error']}",
          );

          continue;
        }
      } on CancelledException {
        logger.warning("Backup was cancelled by the user");
        break;
      } catch (error, stackTrace) {
        logger.warning("Error backup asset: ${error.toString()}: $stackTrace");
        continue;
      }
    }
  }
}
