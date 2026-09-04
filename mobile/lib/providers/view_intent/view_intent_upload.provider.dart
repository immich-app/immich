import 'dart:async';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:logging/logging.dart';

final viewIntentUploadProvider = Provider(ViewIntentUpload.new);

class ViewIntentUpload {
  const ViewIntentUpload(this._ref);

  final Ref _ref;
  static final Logger _logger = Logger('ViewIntentUpload');

  Future<void> upload({
    required ViewIntentPayload activeViewIntent,
    required LocalAsset asset,
    required Completer<void> cancelToken,
    required UploadCallbacks callbacks,
  }) async {
    final viewIntentFilePath = _ref.read(viewIntentFilePathProvider);
    if (viewIntentFilePath == null) {
      String? uploadedRemoteAssetId;
      await _ref
          .read(foregroundUploadServiceProvider)
          .uploadManual(
            [asset],
            cancelToken: cancelToken,
            callbacks: UploadCallbacks(
              onProgress: callbacks.onProgress,
              onSuccess: (localId, remoteId) {
                uploadedRemoteAssetId = remoteId;
                callbacks.onSuccess?.call(localId, remoteId);
              },
              onError: callbacks.onError,
              onICloudProgress: callbacks.onICloudProgress,
            ),
          );

      final remoteAssetId = uploadedRemoteAssetId;
      if (remoteAssetId == null || cancelToken.isCompleted) {
        return;
      }

      final remoteAsset = await _waitForRemoteAsset(remoteAssetId);
      if (remoteAsset == null || !_isCurrentUpload(asset, activeViewIntent)) {
        return;
      }

      _ref.read(assetViewerProvider.notifier).setAsset(remoteAsset.copyWith(localId: asset.id));
      return;
    }

    _logger.fine('Using file-backed upload for view intent');
    await _uploadViewIntentFile(
      asset: asset,
      path: viewIntentFilePath,
      activeViewIntent: activeViewIntent,
      cancelToken: cancelToken,
      callbacks: callbacks,
    );
  }

  Future<void> _uploadViewIntentFile({
    required LocalAsset asset,
    required String path,
    required ViewIntentPayload activeViewIntent,
    required Completer<void> cancelToken,
    required UploadCallbacks callbacks,
  }) async {
    final viewIntentService = _ref.read(viewIntentServiceProvider);
    String? remoteAssetId;
    viewIntentService.markUploadActive(path);

    try {
      await _ref
          .read(foregroundUploadServiceProvider)
          .uploadShareIntent(
            [File(path)],
            cancelToken: cancelToken,
            onProgress: (_, bytes, total) => callbacks.onProgress?.call(asset.id, asset.name, bytes, total),
            onSuccess: (_, remoteId) {
              remoteAssetId = remoteId;
              callbacks.onSuccess?.call(asset.id, remoteId);
            },
            onError: (_, error) => callbacks.onError?.call(asset.id, error),
          );

      final uploadedRemoteAssetId = remoteAssetId;
      if (cancelToken.isCompleted || uploadedRemoteAssetId == null) {
        return;
      }

      final remoteAsset = await _waitForRemoteAsset(uploadedRemoteAssetId);
      if (remoteAsset == null || !_isCurrentUpload(asset, activeViewIntent, path: path)) {
        return;
      }

      _ref.read(assetViewerProvider.notifier).setAsset(remoteAsset);
      _ref.read(viewIntentFilePathProvider.notifier).clearIfMatch(path);
      await viewIntentService.cleanupManagedTempFileIfCurrent(path);
    } finally {
      await viewIntentService.markUploadInactive(path);
    }
  }

  Future<RemoteAsset?> _waitForRemoteAsset(String remoteAssetId) async {
    try {
      return await _ref
          .read(assetServiceProvider)
          .watchRemoteAsset(remoteAssetId)
          .where((asset) => asset != null)
          .cast<RemoteAsset>()
          .first
          .timeout(const Duration(seconds: 15));
    } on TimeoutException {
      final asset = await _ref.read(assetServiceProvider).getRemoteAsset(remoteAssetId);
      _logger.warning(
        'Timed out waiting for uploaded asset $remoteAssetId; direct lookup ${asset == null ? 'failed' : 'succeeded'}',
      );
      return asset;
    }
  }

  bool _isCurrentUpload(LocalAsset asset, ViewIntentPayload activeViewIntent, {String? path}) {
    if (!identical(_ref.read(activeViewIntentPayloadProvider), activeViewIntent)) {
      return false;
    }

    if (path != null && _ref.read(viewIntentFilePathProvider) != path) {
      return false;
    }

    final currentAsset = _ref.read(assetViewerProvider).currentAsset;
    return currentAsset != null && currentAsset.refersToSameAsset(asset);
  }
}
