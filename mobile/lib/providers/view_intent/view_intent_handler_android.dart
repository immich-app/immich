import 'dart:async';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_trash_scope.provider.dart';
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

  @override
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

    _ref.read(viewIntentTrashScopeProvider.notifier).set(resolvedAsset.isTrashScoped);
    _logger.fine('resolved view intent asset: ${resolvedAsset.asset}');
    await _openAssetViewer(
      asset: resolvedAsset.asset,
      timelineService: resolvedAsset.timelineService,
      attachment: payload,
      viewIntentFilePath: resolvedAsset.viewIntentFilePath,
    );
  }

  @override
  Future<bool> reopenRemoteAsset(String remoteAssetId) async {
    final attachment = _ref.read(activeViewIntentPayloadProvider);
    if (attachment == null) {
      return false;
    }

    final asset = await _ref.read(assetServiceProvider).getRemoteAsset(remoteAssetId);
    if (asset == null || !identical(_ref.read(activeViewIntentPayloadProvider), attachment)) {
      return false;
    }

    final reopenedAttachment = ViewIntentPayload(
      path: attachment.path,
      mimeType: attachment.mimeType,
      localAssetId: attachment.localAssetId,
    );
    _activateViewIntent(reopenedAttachment);

    _ref.read(viewIntentTrashScopeProvider.notifier).set(asset.isTrashed);
    final timelineService = _ref.read(timelineFactoryProvider).fromAssets([asset], TimelineOrigin.deepLink);
    unawaited(
      _openAssetViewer(asset: asset, timelineService: timelineService, attachment: reopenedAttachment).catchError((
        Object error,
        StackTrace stackTrace,
      ) {
        _logger.severe('Failed to reopen remote view intent asset', error, stackTrace);
      }),
    );
    return true;
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
    _ref.read(viewIntentTrashScopeProvider.notifier).clear();
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
