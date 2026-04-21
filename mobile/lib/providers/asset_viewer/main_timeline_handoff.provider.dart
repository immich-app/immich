import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent.service.dart';

typedef MainTimelineIndexLookup = Future<int?> Function(List<String> userIds, String value);
typedef MainTimelineHandoff = Future<void> Function(List<String> userIds, int index, String? viewIntentFilePath);
typedef UploadReadyWaiter = Future<void> Function(bool Function(dynamic data) predicate, Duration timeout);

final mainTimelineHandoffProvider = Provider.autoDispose<MainTimelineHandoffCoordinator>((ref) {
  final keepAliveLink = ref.keepAlive();

  final coordinator = MainTimelineHandoffCoordinator(
    getCurrentAsset: () => ref.read(assetViewerProvider).currentAsset,
    getViewIntentFilePath: () => ref.read(viewIntentFilePathProvider),
    resolveMainTimelineUsers: () {
      final timelineUsers = ref.read(timelineUsersProvider).valueOrNull;
      final currentUserId = ref.read(currentUserProvider)?.id;
      return timelineUsers ?? (currentUserId != null ? [currentUserId] : const <String>[]);
    },
    findMainTimelineIndexByLocalId: (userIds, localAssetId) {
      return ref.read(timelineRepositoryProvider).getMainTimelineIndexByLocalId(userIds, localAssetId);
    },
    findMainTimelineIndexByChecksum: (userIds, checksum) {
      return ref.read(timelineRepositoryProvider).getMainTimelineIndexByChecksum(userIds, checksum);
    },
    waitForUploadReadyEvent: (predicate, timeout) {
      return ref.read(websocketProvider.notifier).waitForEvent('AssetUploadReadyV1', predicate, timeout);
    },
    handoffToMainTimeline: (userIds, index, viewIntentFilePath) async {
      final timelineService = ref.read(timelineFactoryProvider).main(userIds);

      try {
        final asset = await MainTimelineHandoffCoordinator.resolveAssetFromMainTimelineService(timelineService, index);
        if (asset == null) {
          await timelineService.dispose();
          return;
        }

        ref.read(assetViewerProvider.notifier).setViewerTransitionInProgress(true);
        ref.read(assetViewerProvider.notifier).setAsset(asset);
        try {
          await ref
              .read(appRouterProvider)
              .popAndPush(AssetViewerRoute(initialIndex: index, timelineService: timelineService));
        } finally {
          ref.read(assetViewerProvider.notifier).setViewerTransitionInProgress(false);
        }

        if (viewIntentFilePath != null) {
          ref.read(viewIntentFilePathProvider.notifier).clearIfMatch(viewIntentFilePath);
          await ref.read(viewIntentServiceProvider).cleanupManagedTempFileIfCurrent(viewIntentFilePath);
        }
      } catch (_) {
        ref.read(assetViewerProvider.notifier).setViewerTransitionInProgress(false);
        await timelineService.dispose();
      }
    },
  );

  final lifetimeTimer = Timer(const Duration(seconds: 40), keepAliveLink.close);

  ref
    ..onDispose(lifetimeTimer.cancel)
    ..onDispose(keepAliveLink.close)
    ..onDispose(coordinator.dispose);
  return coordinator;
});

class MainTimelineHandoffCoordinator {
  static Future<BaseAsset?> resolveAssetFromMainTimelineService(
    TimelineService timelineService,
    int index, {
    Duration timeout = const Duration(seconds: 3),
    Duration retryInterval = const Duration(milliseconds: 100),
  }) async {
    final deadline = DateTime.now().add(timeout);

    if (timelineService.totalAssets == 0) {
      try {
        await timelineService.watchBuckets().first.timeout(timeout);
      } catch (_) {
        return null;
      }
    }

    while (DateTime.now().isBefore(deadline)) {
      final totalAssets = timelineService.totalAssets;

      if (index < totalAssets) {
        final asset = await timelineService.getAssetAsync(index);
        if (asset != null) {
          return asset;
        }
      }

      await Future<void>.delayed(retryInterval);
    }

    return null;
  }

  final BaseAsset? Function() _getCurrentAsset;
  final String? Function() _getViewIntentFilePath;
  final List<String> Function() _resolveMainTimelineUsers;
  final MainTimelineIndexLookup _findMainTimelineIndexByLocalId;
  final MainTimelineIndexLookup _findMainTimelineIndexByChecksum;
  final UploadReadyWaiter _waitForUploadReadyEvent;
  final MainTimelineHandoff _handoffToMainTimeline;
  final Duration _uploadReadyTimeout;
  final Duration _mainTimelineAvailabilityTimeout;
  final Duration _mainTimelineRetryInterval;

  bool _disposed = false;
  int _operationId = 0;

  MainTimelineHandoffCoordinator({
    required BaseAsset? Function() getCurrentAsset,
    required String? Function() getViewIntentFilePath,
    required List<String> Function() resolveMainTimelineUsers,
    required MainTimelineIndexLookup findMainTimelineIndexByLocalId,
    required MainTimelineIndexLookup findMainTimelineIndexByChecksum,
    required UploadReadyWaiter waitForUploadReadyEvent,
    required MainTimelineHandoff handoffToMainTimeline,
    Duration uploadReadyTimeout = const Duration(seconds: 15),
    Duration mainTimelineAvailabilityTimeout = const Duration(seconds: 15),
    Duration mainTimelineRetryInterval = const Duration(milliseconds: 250),
  }) : _getCurrentAsset = getCurrentAsset,
       _getViewIntentFilePath = getViewIntentFilePath,
       _resolveMainTimelineUsers = resolveMainTimelineUsers,
       _findMainTimelineIndexByLocalId = findMainTimelineIndexByLocalId,
       _findMainTimelineIndexByChecksum = findMainTimelineIndexByChecksum,
       _waitForUploadReadyEvent = waitForUploadReadyEvent,
       _handoffToMainTimeline = handoffToMainTimeline,
       _uploadReadyTimeout = uploadReadyTimeout,
       _mainTimelineAvailabilityTimeout = mainTimelineAvailabilityTimeout,
       _mainTimelineRetryInterval = mainTimelineRetryInterval;

  Future<void> startIfNeeded(TimelineOrigin origin) async {
    if (_disposed || origin != TimelineOrigin.deepLink) {
      return;
    }

    final currentAsset = _getCurrentAsset();
    final viewIntentFilePath = _getViewIntentFilePath();
    if (currentAsset == null) {
      return;
    }

    final userIds = _resolveMainTimelineUsers();
    if (userIds.isEmpty) {
      return;
    }

    final operationId = ++_operationId;

    final match = _buildMatchCandidate(currentAsset);
    if (match == null || !_isOperationActive(operationId)) {
      return;
    }

    final handoffContext = _MainTimelineHandoffContext(
      match: match,
      viewIntentFilePath: viewIntentFilePath,
      operationId: operationId,
    );

    final didHandoffImmediately = await _tryHandoff(userIds, handoffContext);
    if (didHandoffImmediately || !_isOperationActive(handoffContext.operationId)) {
      return;
    }

    final checksum = handoffContext.match.checksum;
    if (checksum == null) {
      return;
    }

    try {
      await _waitForUploadReadyEvent((data) => _matchesUploadReadyEvent(data, checksum), _uploadReadyTimeout);
    } on TimeoutException {
      return;
    } catch (_) {
      return;
    }

    if (!_isOperationActive(handoffContext.operationId)) {
      return;
    }

    await _waitForMainTimelineAvailability(userIds, handoffContext);
  }

  Future<void> dispose() async {
    _disposed = true;
    _operationId++;
  }

  _MainTimelineMatchCandidate? _buildMatchCandidate(BaseAsset asset) {
    final localAssetId = asset.localId;
    final checksum = asset.checksum;

    if (localAssetId == null && checksum == null) {
      return null;
    }

    return _MainTimelineMatchCandidate(localAssetId: localAssetId, checksum: checksum);
  }

  Future<bool> _waitForMainTimelineAvailability(
    List<String> userIds,
    _MainTimelineHandoffContext handoffContext,
  ) async {
    final deadline = DateTime.now().add(_mainTimelineAvailabilityTimeout);

    while (_isOperationActive(handoffContext.operationId) && DateTime.now().isBefore(deadline)) {
      final didHandoff = await _tryHandoff(userIds, handoffContext);
      if (didHandoff) {
        return true;
      }
      await Future<void>.delayed(_mainTimelineRetryInterval);
    }

    return false;
  }

  Future<bool> _tryHandoff(List<String> userIds, _MainTimelineHandoffContext handoffContext) async {
    if (!_isOperationActive(handoffContext.operationId)) {
      return false;
    }

    final index = await _findIndex(userIds, handoffContext.match);
    if (index == null || !_isOperationActive(handoffContext.operationId)) {
      return false;
    }

    await _handoffToMainTimeline(userIds, index, handoffContext.viewIntentFilePath);
    return true;
  }

  Future<int?> _findIndex(List<String> userIds, _MainTimelineMatchCandidate match) async {
    final localAssetId = match.localAssetId;
    if (localAssetId != null) {
      final localIdIndex = await _findMainTimelineIndexByLocalId(userIds, localAssetId);
      if (localIdIndex != null) {
        return localIdIndex;
      }
    }

    final checksum = match.checksum;
    if (checksum != null) {
      return _findMainTimelineIndexByChecksum(userIds, checksum);
    }

    return null;
  }

  bool _matchesUploadReadyEvent(dynamic data, String checksum) {
    final eventChecksum = switch (data) {
      {'asset': {'checksum': final String eventChecksum}} => eventChecksum,
      _ => null,
    };

    return eventChecksum == checksum;
  }

  bool _isOperationActive(int operationId) => !_disposed && _operationId == operationId;
}

class _MainTimelineMatchCandidate {
  final String? localAssetId;
  final String? checksum;

  const _MainTimelineMatchCandidate({required this.localAssetId, required this.checksum});
}

class _MainTimelineHandoffContext {
  final _MainTimelineMatchCandidate match;
  final String? viewIntentFilePath;
  final int operationId;

  const _MainTimelineHandoffContext({
    required this.match,
    required this.viewIntentFilePath,
    required this.operationId,
  });
}
