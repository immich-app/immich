import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:logging/logging.dart';

final viewIntentHandlerProvider = Provider<ViewIntentHandler>(
  (ref) => ViewIntentHandler(
    ref,
    ref.read(viewIntentServiceProvider),
    ref.read(viewIntentAssetResolverProvider),
    ref.watch(appRouterProvider),
  ),
);

class ViewIntentHandler {
  final Ref _ref;
  final ViewIntentService _viewIntentService;
  final ViewIntentAssetResolver _viewIntentAssetResolver;
  final AppRouter _router;
  static final Logger _logger = Logger('ViewIntentHandler');

  const ViewIntentHandler(this._ref, this._viewIntentService, this._viewIntentAssetResolver, this._router);

  void init() {
    unawaited(checkForViewIntent());
    unawaited(flushPending());
  }

  Future<void> checkForViewIntent() async {
    final attachment = await _viewIntentService.consumeViewIntent();
    if (attachment != null) {
      await handle(attachment);
    }
  }

  Future<void> flushPending() async {
    final pendingAttachment = _ref.read(viewIntentPendingProvider.notifier).takeIfFresh();
    if (pendingAttachment != null) {
      await handle(pendingAttachment);
    }
  }

  Future<void> handle(ViewIntentPayload attachment) async {
    _logger.info('handle attachment: $attachment');
    if (!_ref.read(authProvider).isAuthenticated) {
      _ref.read(viewIntentPendingProvider.notifier).defer(attachment);
      return;
    }

    final resolvedAsset = await _viewIntentAssetResolver.resolve(attachment);
    _logger.fine('resolved view intent asset: ${resolvedAsset.asset}');
    _openAssetViewer(
      resolvedAsset.asset,
      resolvedAsset.timelineService,
      resolvedAsset.initialIndex,
      viewIntentFilePath: resolvedAsset.viewIntentFilePath,
    );
  }

  void _openAssetViewer(
    BaseAsset asset,
    TimelineService timelineService,
    int initialIndex, {
    String? viewIntentFilePath,
  }) {
    _ref.read(assetViewerProvider.notifier).reset();
    _ref.read(assetViewerProvider.notifier).setAsset(asset);
    if (viewIntentFilePath != null) {
      _ref.read(viewIntentFilePathProvider.notifier).setPath(viewIntentFilePath);
      unawaited(_viewIntentService.setManagedTempFilePath(viewIntentFilePath));
    } else {
      _ref.read(viewIntentFilePathProvider.notifier).clear();
      unawaited(_viewIntentService.cleanupManagedTempFile());
    }

    if (asset.isVideo) {
      _ref.read(assetViewerProvider.notifier).setControls(true);
    }

    _router.push(AssetViewerRoute(initialIndex: initialIndex, timelineService: timelineService));
  }
}
