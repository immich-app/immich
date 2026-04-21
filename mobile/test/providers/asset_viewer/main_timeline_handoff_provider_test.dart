import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/asset_viewer/main_timeline_handoff.provider.dart';

void main() {
  late BaseAsset? currentAsset;
  late String? viewIntentFilePath;
  late int? localIdIndex;
  late int? checksumIndex;
  late List<(List<String>, int, String?)> handoffs;
  late Completer<void> uploadReadyCompleter;
  late bool Function(dynamic)? uploadReadyPredicate;
  late MainTimelineHandoffCoordinator coordinator;

  Future<void> flush() => Future<void>.delayed(Duration.zero);

  setUp(() {
    currentAsset = _asset(checksum: 'checksum-1');
    viewIntentFilePath = null;
    localIdIndex = null;
    checksumIndex = null;
    handoffs = [];
    uploadReadyCompleter = Completer<void>();
    uploadReadyPredicate = null;

    coordinator = MainTimelineHandoffCoordinator(
      getCurrentAsset: () => currentAsset,
      getViewIntentFilePath: () => viewIntentFilePath,
      resolveMainTimelineUsers: () => ['user-1'],
      findMainTimelineIndexByLocalId: (_, __) async => localIdIndex,
      findMainTimelineIndexByChecksum: (_, __) async => checksumIndex,
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
    checksumIndex = 5;

    await coordinator.startIfNeeded(TimelineOrigin.main);
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNull);
  });

  test('hands off immediately when asset is already found in main timeline', () async {
    checksumIndex = 5;

    await coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$1, ['user-1']);
    expect(handoffs.single.$2, 5);
    expect(handoffs.single.$3, isNull);
    expect(uploadReadyPredicate, isNull);
  });

  test('waits for AssetUploadReadyV1 and then hands off when asset appears in main timeline', () async {
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNotNull);
    expect(
      uploadReadyPredicate!({
        'asset': {'checksum': 'checksum-1'},
      }),
      isTrue,
    );

    checksumIndex = 7;
    uploadReadyCompleter.complete();
    await start;

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$1, ['user-1']);
    expect(handoffs.single.$2, 7);
    expect(handoffs.single.$3, isNull);
  });

  test('uses local asset id without waiting for checksum when asset is already resolvable', () async {
    currentAsset = _asset(localId: 'local-42', checksum: null);
    localIdIndex = 3;

    await coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$1, ['user-1']);
    expect(handoffs.single.$2, 3);
    expect(handoffs.single.$3, isNull);
    expect(uploadReadyPredicate, isNull);
  });

  test('does not wait for AssetUploadReadyV1 when both local asset id and checksum are missing', () async {
    currentAsset = _remoteAsset(localId: null, checksum: null);

    await coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    expect(handoffs, isEmpty);
    expect(uploadReadyPredicate, isNull);
  });

  test('captures view intent file path at handoff start', () async {
    viewIntentFilePath = '/tmp/view_intent_old.jpg';
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    viewIntentFilePath = '/tmp/view_intent_new.jpg';
    checksumIndex = 4;
    uploadReadyCompleter.complete();
    await start;

    expect(handoffs, hasLength(1));
    expect(handoffs.single.$3, '/tmp/view_intent_old.jpg');
  });

  test('dispose prevents handoff after AssetUploadReadyV1 arrives later', () async {
    final start = coordinator.startIfNeeded(TimelineOrigin.deepLink);
    await flush();

    await coordinator.dispose();
    checksumIndex = 9;
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
