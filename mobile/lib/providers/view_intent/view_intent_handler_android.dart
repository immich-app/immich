import 'dart:async';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:logging/logging.dart';

class AndroidViewIntentHandler {
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

  void init() {
    // Covers cold start from a view intent before the first lifecycle "resumed".
    unawaited(onAppResumed());
  }

  Future<void> onAppResumed() => _checkForViewIntent();

  Future<void> flushDeferredViewIntent() => _flushPending();

  Future<void> _checkForViewIntent() async {
    final ViewIntentPayload? attachment;
    try {
      attachment = await _viewIntentService.consumeViewIntent();
    } on PlatformException catch (error, stackTrace) {
      if (error.code != viewIntentUnavailableErrorCode) {
        rethrow;
      }

      _logger.warning('Incoming view intent is unavailable', error, stackTrace);
      _ref.read(toastServiceProvider).error(StaticTranslations.instance.asset_not_found_on_device_android);
      await _router.replaceAll([const TabShellRoute()]);
      return;
    }
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

  Future<void> handle(ViewIntentPayload payload) async {
    _logger.info(
      'handle attachment, mimeType:${payload.mimeType}, localAssetId=${payload.localAssetId}, path=${payload.path}, isAuthenticated:${_ref.read(authProvider).isAuthenticated}',
    );

    if (!_ref.read(authProvider).isAuthenticated) {
      _clearCurrentViewIntent();
      _ref.read(viewIntentPendingProvider.notifier).defer(payload);
      return;
    }

    _activateViewIntent(payload);

    final ViewIntentResolution resolvedAsset;
    try {
      resolvedAsset = await _viewIntentAssetResolver.resolve(payload);
    } catch (_) {
      _ref.read(activeViewIntentPayloadProvider.notifier).clearIfMatch(payload);
      rethrow;
    }
    if (!identical(_ref.read(activeViewIntentPayloadProvider), payload)) {
      await resolvedAsset.timelineService.dispose();
      return;
    }

    _logger.fine('resolved view intent asset: ${resolvedAsset.asset}');
    await _openAssetViewer(
      asset: resolvedAsset.asset,
      timelineService: resolvedAsset.timelineService,
      attachment: payload,
      viewIntentFilePath: resolvedAsset.viewIntentFilePath,
    );
  }

  void _activateViewIntent(ViewIntentPayload attachment) {
    _ref.read(activeViewIntentPayloadProvider.notifier).setPayload(attachment);
    _ref.read(viewIntentFilePathProvider.notifier).clear();
    unawaited(_viewIntentService.cleanupManagedTempFile());
    _router.popUntilRoot();
  }

  void _clearCurrentViewIntent() {
    _ref.read(activeViewIntentPayloadProvider.notifier).clear();
    _ref.read(viewIntentFilePathProvider.notifier).clear();
    unawaited(_viewIntentService.cleanupManagedTempFile());
  }

  Future<void> _openAssetViewer({
    required BaseAsset asset,
    required TimelineService timelineService,
    required ViewIntentPayload attachment,
    String? viewIntentFilePath,
  }) async {
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

    try {
      await _router.push(AssetViewerRoute(initialIndex: 0, timelineService: timelineService));
    } finally {
      _ref.read(activeViewIntentPayloadProvider.notifier).clearIfMatch(attachment);
      if (viewIntentFilePath != null) {
        _ref.read(viewIntentFilePathProvider.notifier).clearIfMatch(viewIntentFilePath);
        await _viewIntentService.cleanupManagedTempFileIfCurrent(viewIntentFilePath);
      }
    }
  }
}
