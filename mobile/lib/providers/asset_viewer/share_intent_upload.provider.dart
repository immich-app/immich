import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/platform/upload_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/share_intent_service.dart';
import 'package:immich_mobile/services/upload.service.dart';

final shareIntentUploadProvider = StateNotifierProvider<ShareIntentUploadStateNotifier, List<ShareIntentAttachment>>(
  ((ref) => ShareIntentUploadStateNotifier(
    ref.watch(appRouterProvider),
    ref.watch(uploadServiceProvider),
    ref.watch(shareIntentServiceProvider),
  )),
);

class ShareIntentUploadStateNotifier extends StateNotifier<List<ShareIntentAttachment>> {
  final AppRouter router;
  final UploadService _uploadService;
  final ShareIntentService _shareIntentService;
  late final StreamSubscription<UploadApiTaskStatus> _taskStatusStream;
  late final StreamSubscription<UploadApiTaskProgress> _taskProgressStream;

  ShareIntentUploadStateNotifier(this.router, this._uploadService, this._shareIntentService) : super([]) {
    _taskStatusStream = _uploadService.taskStatusStream.listen(_updateUploadStatus);
    _taskProgressStream = _uploadService.taskProgressStream.listen(_taskProgressCallback);
  }

  void init() {
    _shareIntentService.onSharedMedia = onSharedMedia;
    _shareIntentService.init();
  }

  @override
  void dispose() {
    unawaited(_taskStatusStream.cancel());
    unawaited(_taskProgressStream.cancel());
    super.dispose();
  }

  void onSharedMedia(List<ShareIntentAttachment> attachments) {
    router.removeWhere((route) => route.name == "ShareIntentRoute");
    clearAttachments();
    addAttachments(attachments);
    router.push(ShareIntentRoute(attachments: attachments));
  }

  void addAttachments(List<ShareIntentAttachment> attachments) {
    if (attachments.isEmpty) {
      return;
    }
    state = [...state, ...attachments];
  }

  void removeAttachment(ShareIntentAttachment attachment) {
    final updatedState = state.where((element) => element != attachment).toList();
    if (updatedState.length != state.length) {
      state = updatedState;
    }
  }

  void clearAttachments() {
    if (state.isEmpty) {
      return;
    }

    state = [];
  }

  void _updateUploadStatus(UploadApiTaskStatus task) {
    final uploadStatus = switch (task.status) {
      UploadApiStatus.uploadComplete => UploadStatus.complete,
      UploadApiStatus.uploadFailed || UploadApiStatus.downloadFailed => UploadStatus.failed,
      UploadApiStatus.uploadQueued => UploadStatus.enqueued,
      _ => UploadStatus.preparing,
    };

    final taskId = task.id.toInt();
    state = [
      for (final attachment in state)
        if (attachment.id == taskId) attachment.copyWith(status: uploadStatus) else attachment,
    ];
  }

  void _taskProgressCallback(UploadApiTaskProgress update) {
    // Ignore if the task is canceled or completed
    if (update.progress == downloadFailed || update.progress == downloadCompleted) {
      return;
    }

    final taskId = update.id.toInt();
    state = [
      for (final attachment in state)
        if (attachment.id == taskId) attachment.copyWith(uploadProgress: update.progress) else attachment,
    ];
  }

  Future<void> upload(List<ShareIntentAttachment> files) {
    return uploadApi.enqueueFiles(files.map((e) => e.path).toList(growable: false));
  }
}
