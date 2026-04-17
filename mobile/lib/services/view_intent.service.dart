import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:path/path.dart' as p;

final viewIntentServiceProvider = Provider((ref) => ViewIntentService(ViewIntentHostApi()));

class ViewIntentService {
  final ViewIntentHostApi _viewIntentHostApi;
  String? _managedTempFilePath;

  ViewIntentService(this._viewIntentHostApi);

  Future<ViewIntentPayload?> consumeViewIntent() async {
    try {
      return await _viewIntentHostApi.consumeViewIntent();
    } catch (_) {
      // Ignore errors - view intent might not be present
      return null;
    }
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
}
