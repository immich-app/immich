import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
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
  Future<void> onUserAuthenticated() => _flushPending();

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
    _logger.info('flushPending, pendingAttachment:$pendingAttachment}');
    if (pendingAttachment != null) {
      await _prepareDeferredViewIntentResolution(pendingAttachment);
      await handle(pendingAttachment);
    }
  }

  Future<void> _prepareDeferredViewIntentResolution(ViewIntentPayload attachment) async {
    // Deferred intents that arrived before login should resolve only after the
    // remote timeline data is available for merged timeline lookup.
    await _ref.read(backgroundSyncProvider).syncRemote();
    await _ref.read(timelineUsersProvider.future);
    _logger.fine(
      'prepare deferred view intent resolution complete, timelineUsers=${_ref.read(timelineUsersProvider).valueOrNull}',
    );
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
      resolvedAsset.initialIndex,
      viewIntentFilePath: resolvedAsset.viewIntentFilePath,
    );
  }

  Future<void> _openAssetViewer(
    BaseAsset asset,
    TimelineService timelineService,
    int initialIndex, {
    String? viewIntentFilePath,
  }) async {
    final notifier = _ref.read(assetViewerProvider.notifier);
    notifier.setViewerTransitionInProgress(true);
    try {
      _router.removeWhere((route) => route.name == AssetViewerRoute.name);

      await _waitForNextFrame();

      notifier.reset();
      notifier.setAsset(asset);
      if (viewIntentFilePath != null) {
        _ref.read(viewIntentFilePathProvider.notifier).setPath(viewIntentFilePath);
        unawaited(_viewIntentService.setManagedTempFilePath(viewIntentFilePath));
      } else {
        _ref.read(viewIntentFilePathProvider.notifier).clear();
        unawaited(_viewIntentService.cleanupManagedTempFile());
      }

      if (asset.isVideo) {
        notifier.setControls(true);
      }

      unawaited(_router.push(AssetViewerRoute(initialIndex: initialIndex, timelineService: timelineService)));
      await _waitForNextFrame();
    } finally {
      notifier.setViewerTransitionInProgress(false);
    }
  }

  Future<void> _waitForNextFrame() {
    final completer = Completer<void>();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!completer.isCompleted) {
        completer.complete();
      }
    });
    return completer.future;
  }
}
