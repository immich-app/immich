import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/asset_viewer/main_timeline_handoff.provider.dart';

void main() {
  late BaseAsset? currentAsset;
  late String? viewIntentFilePath;
  late int? remoteIdIndex;
  late List<(List<String>, int, String?)> handoffs;
  late Completer<void> uploadReadyCompleter;
  late bool Function(dynamic)? uploadReadyPredicate;
  late MainTimelineHandoffCoordinator coordinator;

  Future<void> flush() => Future<void>.delayed(Duration.zero);

  setUp(() {
    currentAsset = _asset(checksum: 'checksum-1');
    viewIntentFilePath = null;
    remoteIdIndex = null;
    handoffs = [];
    uploadReadyCompleter = Completer<void>();
    uploadReadyPredicate = null;

    coordinator = MainTimelineHandoffCoordinator(
      getCurrentAsset: () => currentAsset,
      getViewIntentFilePath: () => viewIntentFilePath,
      resolveMainTimelineUsers: () => ['user-1'],
      findMainTimelineIndexByRemoteId: (_, __) async => remoteIdIndex,
      waitForUploadReadyEvent: (predicate, _) {
        uploadReadyPredicate = predicate;
        return uploadReadyCompleter.future;
      },
      handoffToMainTimeline: (userIds, index, viewIntentFilePath) async {
        handoffs.add((userIds, index, viewIntentFilePath));
      },
      uploadReadyTimeout: const Duration(seconds: 1),
      mainTimelineAvailabilityTimeout: const Duration(seconds: 1),
      mainTimelineRetryInterval: const Duration(milliseconds: 10),
    );

    addTearDown(coordinator.dispose);
  });

  test('does not start outside deepLink origin', () async {
    remoteIdIndex = 5;

    await coordinator.startIfNeeded(TimelineOrigin.main, remoteAssetId: 'remote-1');
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNull);
  });

  test('hands off immediately when asset is already found in main timeline', () async {
    remoteIdIndex = 5;

    await coordinator.startIfNeeded(TimelineOrigin.deepLink, remoteAssetId: 'remote-1');
    await flush();

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$1, ['user-1']);
    expect(handoffs.single.$2, 5);
    expect(handoffs.single.$3, isNull);
    expect(uploadReadyPredicate, isNull);
  });

  test('waits for AssetUploadReadyV1 and then hands off when asset appears in main timeline', () async {
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink, remoteAssetId: 'remote-1');
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNotNull);
    expect(
      uploadReadyPredicate!({
        'asset': {'id': 'remote-1'},
      }),
      isTrue,
    );

    remoteIdIndex = 7;
    uploadReadyCompleter.complete();
    await start;

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$1, ['user-1']);
    expect(handoffs.single.$2, 7);
    expect(handoffs.single.$3, isNull);
  });

  test('does not start when remote asset id is missing', () async {
    currentAsset = _asset(localId: 'local-42', checksum: null);

    await coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNull);
  });

  test('waits for AssetUploadReadyV1 when remote asset id is provided', () async {
    currentAsset = _remoteAsset(localId: null, checksum: null);

    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink, remoteAssetId: 'remote-9');
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNotNull);

    await coordinator.dispose();
    uploadReadyCompleter.complete();
    await start;
  });

  test('captures view intent file path at handoff start', () async {
    viewIntentFilePath = '/tmp/view_intent_old.jpg';
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink, remoteAssetId: 'remote-1');
    await flush();

    viewIntentFilePath = '/tmp/view_intent_new.jpg';
    remoteIdIndex = 4;
    uploadReadyCompleter.complete();
    await start;

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$3, '/tmp/view_intent_old.jpg');
  });

  test('dispose prevents handoff after AssetUploadReadyV1 arrives later', () async {
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink, remoteAssetId: 'remote-1');
    await flush();

    await coordinator.dispose();
    remoteIdIndex = 9;
    uploadReadyCompleter.complete();
    await start;

    expect(handoffs, isEmpty);
  });
}

LocalAsset _asset({String localId = 'local-1', String? checksum}) {
  return LocalAsset(
    id: localId,
    name: 'asset.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}

RemoteAsset _remoteAsset({String? localId, String? checksum}) {
  return RemoteAsset(
    id: 'remote-1',
    localId: localId,
    ownerId: 'user-1',
    name: 'asset.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    isEdited: false,
  );
}
