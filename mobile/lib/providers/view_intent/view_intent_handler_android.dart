import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:logging/logging.dart';

class AndroidViewIntentHandler implements ViewIntentHandler {
  final Ref _ref;
  final ViewIntentService _viewIntentService;
  final ViewIntentAssetResolver _viewIntentAssetResolver;
  final AppRouter _router;
  static final Logger _logger = Logger('ViewIntentHandler');

  AndroidViewIntentHandler(Ref ref)
    : _ref = ref,
      _viewIntentService = ref.read(viewIntentServiceProvider),
      _viewIntentAssetResolver = ref.read(viewIntentAssetResolverProvider),
      _router = ref.watch(appRouterProvider);

  @override
  void init() {
    // Covers cold start from a view intent before the first lifecycle "resumed".
    unawaited(onAppResumed());
  }

  @override
  Future<void> onAppResumed() => _checkForViewIntent();

  @override
  Future<void> flushDeferredViewIntent() => _flushPending();

  Future<void> _checkForViewIntent() async {
    final attachment = await _viewIntentService.consumeViewIntent();
    if (attachment != null) {
      await handle(attachment);
      return;
    }

    if (_ref.read(viewIntentPendingProvider) == null) {
      await _viewIntentService.cleanupStaleTempFiles();
    }
  }

  Future<void> _flushPending() async {
    final pendingAttachment = _ref.read(viewIntentPendingProvider.notifier).takeIfFresh();
    _logger.info('flushPending, pendingAttachment:$pendingAttachment');
    if (pendingAttachment != null) {
      await handle(pendingAttachment);
    }
  }

  @override
  Future<void> handle(ViewIntentPayload attachment) async {
    _logger.info(
      'handle attachment, mimeType:${attachment.mimeType}, localAssetId=${attachment.localAssetId}, path=${attachment.path}, isAuthenticated:${_ref.read(authProvider).isAuthenticated}',
    );

    if (!_ref.read(authProvider).isAuthenticated) {
      _ref.read(viewIntentPendingProvider.notifier).defer(attachment);
      return;
    }

    final resolvedAsset = await _viewIntentAssetResolver.resolve(attachment);
    _logger.fine('resolved view intent asset: ${resolvedAsset.asset}');
    await _openAssetViewer(
      resolvedAsset.asset,
      resolvedAsset.timelineService,
      viewIntentFilePath: resolvedAsset.viewIntentFilePath,
    );
  }

  Future<void> _openAssetViewer(BaseAsset asset, TimelineService timelineService, {String? viewIntentFilePath}) async {
    final notifier = _ref.read(assetViewerProvider.notifier);
    notifier.reset();
    if (asset.isVideo) {
      notifier.setControls(false);
    }
    notifier.setAsset(asset);

    if (viewIntentFilePath != null) {
      _ref.read(viewIntentFilePathProvider.notifier).setPath(viewIntentFilePath);
      unawaited(_viewIntentService.setManagedTempFilePath(viewIntentFilePath));
    } else {
      _ref.read(viewIntentFilePathProvider.notifier).clear();
      unawaited(_viewIntentService.cleanupManagedTempFile());
    }

    await _router.replaceAll([
      const TabShellRoute(),
      AssetViewerRoute(key: UniqueKey(), initialIndex: 0, timelineService: timelineService),
    ]);
  }
}
