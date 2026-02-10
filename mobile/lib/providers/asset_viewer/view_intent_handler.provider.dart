import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent_service.dart';

final viewIntentHandlerProvider = Provider<ViewIntentHandler>(
  (ref) => ViewIntentHandler(
    ref,
    ref.read(viewIntentServiceProvider),
    ref.watch(appRouterProvider),
    ref.read(localAssetRepository),
    ref.read(nativeSyncApiProvider),
    ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentHandler {
  final Ref _ref;
  final ViewIntentService _viewIntentService;
  final AppRouter _router;
  final DriftLocalAssetRepository _localAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final TimelineFactory _timelineFactory;

  const ViewIntentHandler(
    this._ref,
    this._viewIntentService,
    this._router,
    this._localAssetRepository,
    this._nativeSyncApi,
    this._timelineFactory,
  );

  void init() {
    _viewIntentService.onViewMedia = onViewMedia;
    unawaited(_viewIntentService.checkViewIntent());
    unawaited(_viewIntentService.flushPending());
  }

  Future<void> onViewMedia(List<ViewIntentAttachment> attachments) async {
    if (attachments.isEmpty) {
      return;
    }
    await handle(attachments.first);
  }

  Future<void> handle(ViewIntentAttachment attachment) async {
    if (!_ref.read(authProvider).isAuthenticated) {
      _viewIntentService.defer(attachment);
      return;
    }

    final localAssetId = attachment.localAssetId;
    if (localAssetId != null) {
      final localAsset = await _localAssetRepository.getById(localAssetId);
      if (localAsset != null) {
        var checksum = localAsset.checksum;
        if (checksum == null) {
          checksum = await _computeChecksum(localAssetId);
          if (checksum != null) {
            await _localAssetRepository.updateHashes({localAssetId: checksum});
          }
        }
        final timelineMatch = await _openFromMainTimeline(localAssetId, checksum: checksum);
        if (timelineMatch) {
          return;
        }
        _openAssetViewer(localAsset, _timelineFactory.fromAssets([localAsset], TimelineOrigin.deepLink), 0);
        return;
      }
    }

    final fallbackAsset = _toViewIntentAsset(attachment);
    _openAssetViewer(fallbackAsset, _timelineFactory.fromAssets([fallbackAsset], TimelineOrigin.deepLink), 0);
  }

  Future<bool> _openFromMainTimeline(String localAssetId, {String? checksum}) async {
    final timelineService = _ref.read(timelineServiceProvider);
    if (timelineService.totalAssets == 0) {
      try {
        await timelineService.watchBuckets().first.timeout(const Duration(seconds: 2));
      } catch (_) {
        // Ignore and fallback.
      }
    }

    final totalAssets = timelineService.totalAssets;
    if (totalAssets == 0) {
      return false;
    }

    final batchSize = kTimelineAssetLoadBatchSize;
    for (var offset = 0; offset < totalAssets; offset += batchSize) {
      final count = (offset + batchSize > totalAssets) ? totalAssets - offset : batchSize;
      final assets = await timelineService.loadAssets(offset, count);
      final indexInBatch = assets.indexWhere((asset) {
        if (asset.localId == localAssetId) {
          return true;
        }
        if (checksum != null && asset.checksum == checksum) {
          return true;
        }
        return false;
      });
      if (indexInBatch >= 0) {
        final asset = assets[indexInBatch];
        _openAssetViewer(asset, timelineService, offset + indexInBatch);
        return true;
      }
    }
    return false;
  }

  void _openAssetViewer(BaseAsset asset, TimelineService timelineService, int initialIndex) {
    _ref.read(assetViewerProvider.notifier).reset();
    _ref.read(assetViewerProvider.notifier).setAsset(asset);
    _ref.read(currentAssetNotifier.notifier).setAsset(asset);
    if (asset.isVideo || asset.isMotionPhoto) {
      _ref.read(videoPlaybackValueProvider.notifier).reset();
      _ref.read(videoPlayerControlsProvider.notifier).pause();
    }
    if (asset.isVideo) {
      _ref.read(assetViewerProvider.notifier).setControls(false);
    }

    _router.push(AssetViewerRoute(initialIndex: initialIndex, timelineService: timelineService));
  }

  Future<String?> _computeChecksum(String localAssetId) async {
    try {
      final hashResults = await _nativeSyncApi.hashAssets([localAssetId]);
      if (hashResults.isEmpty) {
        return null;
      }
      return hashResults.first.hash;
    } catch (_) {
      return null;
    }
  }

  LocalAsset _toViewIntentAsset(ViewIntentAttachment attachment) {
    final now = DateTime.now();

    return LocalAsset(
      id: attachment.path,
      name: attachment.fileName,
      checksum: null,
      type: attachment.isVideo ? AssetType.video : AssetType.image,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
    );
  }
}
