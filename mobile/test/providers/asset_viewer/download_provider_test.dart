import 'package:background_downloader/background_downloader.dart';
import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/download/livephotos_medatada.model.dart';
import 'package:immich_mobile/providers/asset_viewer/download.provider.dart';
import 'package:immich_mobile/services/download.service.dart';
import 'package:mocktail/mocktail.dart';

class MockDownloadService extends Mock implements DownloadService {}

DownloadTask _task(String id, {String filename = 'photo.jpg', String metaData = ''}) =>
    DownloadTask(taskId: id, url: 'https://example.com/$filename', filename: filename, metaData: metaData);

void main() {
  late MockDownloadService service;
  late DownloadStateNotifier notifier;
  late void Function(TaskProgressUpdate) onProgress;
  late void Function(TaskStatusUpdate) onImage;
  late void Function(TaskStatusUpdate) onLivePhoto;

  setUpAll(() {
    registerFallbackValue(_task('fallback'));
  });

  setUp(() {
    service = MockDownloadService();
    when(() => service.saveImageWithPath(any())).thenAnswer((_) async => true);
    when(() => service.saveVideo(any())).thenAnswer((_) async => true);
    when(() => service.saveLivePhotos(any(), any())).thenAnswer((_) async => true);

    notifier = DownloadStateNotifier(service);
    addTearDown(notifier.dispose);

    // The notifier wires its private handlers onto the service in its constructor.
    onProgress = verify(() => service.onTaskProgress = captureAny()).captured.last as void Function(TaskProgressUpdate);
    onImage =
        verify(() => service.onImageDownloadStatus = captureAny()).captured.last as void Function(TaskStatusUpdate);
    onLivePhoto =
        verify(() => service.onLivePhotoDownloadStatus = captureAny()).captured.last as void Function(TaskStatusUpdate);
  });

  test('fills the progress to 100% when a download completes', () {
    fakeAsync((async) {
      final task = _task('task-1');
      onImage(TaskStatusUpdate(task, TaskStatus.running));
      onProgress(TaskProgressUpdate(task, 0.5));
      onImage(TaskStatusUpdate(task, TaskStatus.complete));

      expect(notifier.state.taskProgress['task-1']?.progress, 1.0);
      expect(notifier.state.taskProgress['task-1']?.status, TaskStatus.complete);

      async.elapse(const Duration(seconds: 2));
    });
  });

  test('shows the progress bar when progress arrives before any status update', () {
    fakeAsync((async) {
      final task = _task('task-1');
      // a brand new task whose first signal is a progress update must still show
      onProgress(TaskProgressUpdate(task, 0.3));

      expect(notifier.state.showProgress, isTrue);
      expect(notifier.state.taskProgress.containsKey('task-1'), isTrue);

      onImage(TaskStatusUpdate(task, TaskStatus.complete));
      async.elapse(const Duration(seconds: 2));
    });
  });

  test('clears the bar when progress hits 100% even without a terminal status', () {
    fakeAsync((async) {
      final task = _task('task-1');
      onProgress(TaskProgressUpdate(task, 0.5));
      // download finishes by progress alone, no complete status callback follows
      onProgress(TaskProgressUpdate(task, 1.0));
      async.elapse(const Duration(seconds: 2));

      expect(notifier.state.taskProgress, isEmpty);
      expect(notifier.state.showProgress, isFalse);
    });
  });

  test('clears the progress bar after a completed download is removed', () {
    fakeAsync((async) {
      final task = _task('task-1');
      onImage(TaskStatusUpdate(task, TaskStatus.running));
      onProgress(TaskProgressUpdate(task, 0.5));
      onImage(TaskStatusUpdate(task, TaskStatus.complete));
      async.elapse(const Duration(seconds: 2));

      expect(notifier.state.taskProgress, isEmpty);
      expect(notifier.state.showProgress, isFalse);
    });
  });

  test('ignores a late progress update so the bar does not get stuck', () {
    fakeAsync((async) {
      final task = _task('task-1');
      onImage(TaskStatusUpdate(task, TaskStatus.running));
      onProgress(TaskProgressUpdate(task, 0.5));
      onImage(TaskStatusUpdate(task, TaskStatus.complete));
      async.elapse(const Duration(seconds: 2));

      // a stray progress packet arrives after the task was already removed
      onProgress(TaskProgressUpdate(task, 0.99));

      expect(notifier.state.taskProgress, isEmpty);
      expect(notifier.state.showProgress, isFalse);
    });
  });

  test('clears both parts of a live photo download', () {
    fakeAsync((async) {
      final image = _task(
        'live-image',
        metaData: LivePhotosMetadata(part: LivePhotosPart.image, id: 'live-1').toJson(),
      );
      final video = _task(
        'live-video',
        metaData: LivePhotosMetadata(part: LivePhotosPart.video, id: 'live-1').toJson(),
      );

      onLivePhoto(TaskStatusUpdate(image, TaskStatus.running));
      onLivePhoto(TaskStatusUpdate(video, TaskStatus.running));
      onProgress(TaskProgressUpdate(image, 0.8));
      onProgress(TaskProgressUpdate(video, 0.8));
      onLivePhoto(TaskStatusUpdate(image, TaskStatus.complete));
      onLivePhoto(TaskStatusUpdate(video, TaskStatus.complete));
      async.elapse(const Duration(seconds: 2));

      // late stragglers for either part must not bring the bar back
      onProgress(TaskProgressUpdate(image, 0.95));
      onProgress(TaskProgressUpdate(video, 0.95));

      expect(notifier.state.taskProgress, isEmpty);
      expect(notifier.state.showProgress, isFalse);
    });
  });
}
