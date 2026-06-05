import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

final viewIntentServiceProvider = Provider((ref) => ViewIntentService(ViewIntentHostApi()));

class ViewIntentService {
  final ViewIntentHostApi _viewIntentHostApi;
  final Future<Directory> Function() _temporaryDirectory;
  String? _managedTempFilePath;
  final Set<String> _activeUploadPaths = {};

  ViewIntentService(this._viewIntentHostApi, {Future<Directory> Function()? temporaryDirectory})
    : _temporaryDirectory = temporaryDirectory ?? getTemporaryDirectory;

  Future<ViewIntentPayload?> consumeViewIntent() async {
    try {
      return await _viewIntentHostApi.consumeViewIntent();
    } catch (_) {
      // Ignore errors - view intent might not be present
      return null;
    }
  }

  Future<void> setManagedTempFilePath(String path) async {
    final normalizedPath = p.normalize(path);
    final previous = _managedTempFilePath;
    if (previous == normalizedPath) {
      return;
    }
    _managedTempFilePath = normalizedPath;
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

  Future<void> cleanupManagedTempFileIfCurrent(String path) async {
    final normalizedPath = p.normalize(path);
    if (_managedTempFilePath == normalizedPath) {
      _managedTempFilePath = null;
    }
    await cleanupTempFile(normalizedPath);
  }

  Future<void> cleanupTempFile(String path) async {
    final normalizedPath = p.normalize(path);
    if (!_isManagedTempFile(normalizedPath)) {
      return;
    }
    if (_activeUploadPaths.contains(normalizedPath)) {
      return;
    }

    try {
      final file = File(normalizedPath);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {
      // Best-effort cleanup only.
    }
  }

  Future<void> cleanupStaleTempFiles() async {
    try {
      final tempDirectory = await _temporaryDirectory();
      await for (final entity in tempDirectory.list()) {
        if (entity is! File) {
          continue;
        }

        final path = p.normalize(entity.path);
        if (!_isManagedTempFile(path) || path == _managedTempFilePath || _activeUploadPaths.contains(path)) {
          continue;
        }

        await entity.delete();
      }
    } catch (_) {
      // Best-effort cleanup only.
    }
  }

  void markUploadActive(String path) {
    _activeUploadPaths.add(p.normalize(path));
  }

  Future<void> markUploadInactive(String path) async {
    final normalizedPath = p.normalize(path);
    if (!_activeUploadPaths.remove(normalizedPath)) {
      return;
    }
    if (_managedTempFilePath != normalizedPath) {
      await cleanupTempFile(normalizedPath);
    }
  }

  bool _isManagedTempFile(String path) {
    return p.basename(path).startsWith('view_intent_') && p.basename(p.dirname(path)) == 'cache';
  }
}
