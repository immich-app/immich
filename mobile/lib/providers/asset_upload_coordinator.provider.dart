import 'dart:async';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:logging/logging.dart';

final assetUploadCoordinatorProvider = Provider(AssetUploadCoordinator.new);

class AssetUploadCoordinator {
  AssetUploadCoordinator(this._ref);

  final Ref _ref;
  static final Logger _logger = Logger('AssetUploadCoordinator');

  Future<void> upload({
    required ActionSource source,
    required List<LocalAsset> assets,
    required Completer<void> cancelToken,
    required UploadCallbacks callbacks,
  }) async {
    final viewIntentFilePath = source == ActionSource.viewer ? _ref.read(viewIntentFilePathProvider) : null;
    if (viewIntentFilePath == null) {
      await _ref
          .read(foregroundUploadServiceProvider)
          .uploadManual(assets, cancelToken: cancelToken, callbacks: callbacks);
      return;
    }

    if (assets.length != 1) {
      throw StateError('A file-backed viewer upload requires exactly one asset.');
    }

    _logger.fine('Using file-backed upload for view intent');
    await _uploadViewIntentFile(
      asset: assets.single,
      path: viewIntentFilePath,
      cancelToken: cancelToken,
      callbacks: callbacks,
    );
  }

  Future<void> _uploadViewIntentFile({
    required LocalAsset asset,
    required String path,
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
      if (remoteAsset == null || !_isCurrentUpload(asset, path)) {
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

  bool _isCurrentUpload(LocalAsset asset, String path) {
    if (_ref.read(viewIntentFilePathProvider) != path) {
      return false;
    }

    final currentAsset = _ref.read(assetViewerProvider).currentAsset;
    return currentAsset != null && currentAsset.refersToSameAsset(asset);
  }
}
