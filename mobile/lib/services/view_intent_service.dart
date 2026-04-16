import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:path/path.dart' as p;

final viewIntentServiceProvider = Provider((ref) => ViewIntentService(ViewIntentHostApi()));

class ViewIntentService {
  final ViewIntentHostApi _viewIntentHostApi;
  Future<void> Function(List<ViewIntentPayload> attachments)? onViewMedia;
  ViewIntentPayload? _pendingAttachment;
  String? _managedTempFilePath;

  ViewIntentService(this._viewIntentHostApi);

  Future<void> checkViewIntent() async {
    try {
      final attachment = await _viewIntentHostApi.consumeViewIntent();
      if (attachment != null) {
        final handler = onViewMedia;
        if (handler == null) {
          _pendingAttachment = attachment;
          return;
        }
        await handler([attachment]);
      }
    } catch (_) {
      // Ignore errors - view intent might not be present
    }
  }

  void defer(ViewIntentPayload attachment) {
    _pendingAttachment = attachment;
  }

  Future<void> setManagedTempFilePath(String path) async {
    final previous = _managedTempFilePath;
    if (previous == path) {
      return;
    }
    _managedTempFilePath = path;
    if (previous != null) {
      await cleanupTempFile(previous);
    }
  }

  Future<void> cleanupManagedTempFile() async {
    final path = _managedTempFilePath;
    _managedTempFilePath = null;
    if (path != null) {
      await cleanupTempFile(path);
    }
  }

  Future<void> cleanupTempFile(String path) async {
    if (!_isManagedTempFile(path)) {
      return;
    }

    try {
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {
      // Best-effort cleanup only.
    }
  }

  bool _isManagedTempFile(String path) {
    return p.basename(path).startsWith('view_intent_') && p.basename(p.dirname(path)) == 'cache';
  }

  Future<void> flushPending() async {
    final pendingAttachment = _pendingAttachment;
    final handler = onViewMedia;
    if (pendingAttachment == null || handler == null) {
      return;
    }
    _pendingAttachment = null;
    await handler([pendingAttachment]);
  }
}
