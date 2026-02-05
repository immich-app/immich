import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_attachment.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent_service.dart';

final viewIntentHandlerProvider = Provider<ViewIntentHandler>(
  (ref) => ViewIntentHandler(
    ref,
    ref.read(viewIntentServiceProvider),
    ref.watch(appRouterProvider),
    ref.read(localAssetRepository),
    ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentHandler {
  final Ref _ref;
  final ViewIntentService _viewIntentService;
  final AppRouter _router;
  final DriftLocalAssetRepository _localAssetRepository;
  final TimelineFactory _timelineFactory;

  const ViewIntentHandler(
    this._ref,
    this._viewIntentService,
    this._router,
    this._localAssetRepository,
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
    if (_ref.read(currentUserProvider) == null) {
      _viewIntentService.defer(attachment);
      return;
    }

    final localAssetId = attachment.localAssetId;
    if (localAssetId != null) {
      final localAsset = await _localAssetRepository.getById(localAssetId);
      if (localAsset != null) {
        _openAssetViewer(localAsset);
        return;
      }
    }

    await _router.push(ExternalMediaViewerRoute(attachment: attachment));
  }

  void _openAssetViewer(LocalAsset asset) {
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

    _router.push(
      AssetViewerRoute(
        initialIndex: 0,
        timelineService: _timelineFactory.fromAssets([asset], TimelineOrigin.deepLink),
      ),
    );
  }
}
