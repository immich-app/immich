import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:logging/logging.dart';

final viewIntentAssetActionCoordinatorProvider = Provider((ref) {
  return ViewIntentAssetActionCoordinator(
    ref,
    viewIntent: ref.watch(activeViewIntentPayloadProvider),
    isFileBacked: ref.watch(viewIntentFilePathProvider) != null,
  );
}, dependencies: [assetViewerProvider, timelineServiceProvider, activeViewIntentPayloadProvider, viewIntentFilePathProvider]);

class ViewIntentAssetActionCoordinator {
  const ViewIntentAssetActionCoordinator(this._ref, {required this._viewIntent, required this._isFileBacked});

  final Ref _ref;
  final ViewIntentPayload? _viewIntent;
  final bool _isFileBacked;
  static final Logger _logger = Logger('ViewIntentAssetActionCoordinator');

  bool canDelete(ActionSource source) => source != ActionSource.viewer || !_isFileBacked;

  Future<void> afterDelete({
    required ActionSource source,
    required List<String> remoteAssetIds,
    required bool movedToTrash,
  }) => _runBestEffort('post-delete view intent transition', () async {
    if (!_isActiveViewIntent(source, requireTrash: false)) {
      return;
    }

    if (remoteAssetIds.isNotEmpty) {
      if (movedToTrash) {
        await _reopen(remoteAssetIds.single);
      } else {
        await _ref.read(appRouterProvider).maybePop();
      }
      return;
    }

    final asset = _ref.read(assetViewerProvider).currentAsset;
    if (asset != null && !asset.hasRemote) {
      await _ref.read(appRouterProvider).maybePop();
    }
  });

  Future<void> afterRestore({required ActionSource source, required List<String> remoteAssetIds}) =>
      _runBestEffort('post-restore view intent transition', () async {
        if (!_isActiveViewIntent(source, requireTrash: true)) {
          return;
        }

        await _reopen(remoteAssetIds.single);
      });

  bool _isActiveViewIntent(ActionSource source, {required bool requireTrash}) {
    if (source != ActionSource.viewer || _viewIntent == null) {
      return false;
    }

    if (!identical(_ref.read(activeViewIntentPayloadProvider), _viewIntent)) {
      return false;
    }

    final origin = _ref.read(timelineServiceProvider).origin;
    return requireTrash ? origin == TimelineOrigin.deepLinkTrash : origin.isDeepLink;
  }

  Future<void> _reopen(String remoteAssetId) async {
    final reopened = await _ref.read(viewIntentHandlerProvider).reopenRemoteAsset(remoteAssetId);
    if (!reopened) {
      _logger.warning('Unable to reopen remote view intent asset $remoteAssetId');
    }
  }

  Future<void> _runBestEffort(String operation, Future<void> Function() transition) async {
    try {
      await transition();
    } catch (error, stackTrace) {
      _logger.warning('Failed to complete $operation', error, stackTrace);
    }
  }
}
