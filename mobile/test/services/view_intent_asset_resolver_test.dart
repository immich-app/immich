import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

void main() {
  late MockLocalAssetRepository mockLocalAssetRepository;
  late MockNativeSyncApi nativeSyncApi;
  late MockTimelineFactory timelineFactory;
  late MockRemoteAssetRepository remoteAssetRepository;
  late List<TimelineService> createdTimelineServices;
  late ProviderContainer container;

  setUpAll(() {
    registerFallbackValue(<String>[]);
    registerFallbackValue(<String, String>{});
  });

  setUp(() {
    mockLocalAssetRepository = MockLocalAssetRepository();
    nativeSyncApi = MockNativeSyncApi();
    timelineFactory = MockTimelineFactory();
    remoteAssetRepository = MockRemoteAssetRepository();
    createdTimelineServices = [];

    when(() => mockLocalAssetRepository.getById(any())).thenAnswer((_) async => null);
    when(() => nativeSyncApi.hashAssets(any())).thenAnswer((_) async => const []);
    when(() => mockLocalAssetRepository.updateHashes(any())).thenAnswer((_) async {});

    _mockDeepLinkTimelineFactory(timelineFactory, createdTimelineServices);

    final drift = MockDrift();
    when(() => drift.localAssetRepository).thenReturn(mockLocalAssetRepository);
    when(() => drift.remoteAssetRepository).thenReturn(remoteAssetRepository);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(any(), any()),
    ).thenAnswer((_) async => (own: null, timelineVisible: null));

    container = ProviderContainer(
      overrides: [
        driftProvider.overrideWithValue(drift),
        nativeSyncApiProvider.overrideWithValue(nativeSyncApi),
        timelineFactoryProvider.overrideWith((ref) => timelineFactory),
        timelineUsersProvider.overrideWith((ref) => Stream.value(['user-1'])),
      ],
    );

    addTearDown(() async {
      for (final timelineService in createdTimelineServices) {
        await timelineService.dispose();
      }
      container.dispose();
    });
  });

  test('returns DB-backed local asset wrapped in a 1-element deep-link timeline', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, equals(localAsset));
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull, reason: 'DB-backed assets carry their own source — no temp file needed');
    verify(() => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1')).called(1);
  });

  test('returns an own archived counterpart matching a DB-local checksum', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1', visibility: AssetVisibility.archive);
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: remoteAsset, timelineVisible: null));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).id, 'remote-1');
    expect((result.asset as RemoteAsset).localId, 'local-1');
    verifyNever(() => nativeSyncApi.hashAssets(any()));
  });

  test('hashes local asset without checksum and returns remote merged asset', () async {
    final localAsset = _localAsset(id: 'local-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: remoteAsset, timelineVisible: remoteAsset));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    verify(() => nativeSyncApi.hashAssets(['local-1'])).called(1);
    verify(() => mockLocalAssetRepository.updateHashes({'local-1': 'checksum-1'})).called(1);
  });

  test('returns a transient asset when the checksum cannot be calculated', () async {
    final result = await _resolve(container, _payload(localAssetId: 'local-1', path: '/tmp/incoming.jpg'));

    expect(result.asset, isA<LocalAsset>());
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, '/tmp/incoming.jpg');
    verifyNever(() => remoteAssetRepository.getCandidatesByChecksum(any(), any()));
  });

  test('uses a partner timeline candidate when the local Drift row is absent', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1', ownerId: 'partner-1');
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: null, timelineVisible: remoteAsset));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).id, 'remote-1');
    expect((result.asset as RemoteAsset).localId, 'local-1');
    verifyNever(() => mockLocalAssetRepository.updateHashes(any()));
  });

  test('returns an own archived asset when the local Drift row is absent', () async {
    final ownArchived = _remoteAsset(id: 'own-archived', checksum: 'checksum-1', visibility: AssetVisibility.archive);
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: ownArchived, timelineVisible: null));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).id, ownArchived.id);
    expect((result.asset as RemoteAsset).localId, 'local-1');
  });

  test('returns transient asset for path-only attachment', () async {
    final result = await _resolve(
      container,
      _payload(localAssetId: null, path: '/tmp/incoming.webp', mimeType: 'image/webp'),
    );

    expect(result.asset, isA<LocalAsset>());
    expect(result.viewIntentFilePath, '/tmp/incoming.webp');

    final asset = result.asset as LocalAsset;
    expect(asset.localId, startsWith('-'));
    expect(asset.name, 'incoming.webp');
    expect(asset.playbackStyle, AssetPlaybackStyle.imageAnimated);
  });

  test('keeps a DB-backed local asset when its own remote candidate is trashed', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    final ownTrashed = _remoteAsset(id: 'own-trashed', checksum: 'checksum-1', isTrashed: true);
    final partnerTimeline = _remoteAsset(id: 'partner-timeline', checksum: 'checksum-1', ownerId: 'partner-1');
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: ownTrashed, timelineVisible: partnerTimeline));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, equals(localAsset));
  });

  test('uses a partner timeline candidate when own remote is trashed and the local DB row is absent', () async {
    final ownTrashed = _remoteAsset(id: 'own-trashed', checksum: 'checksum-1', isTrashed: true);
    final partnerTimeline = _remoteAsset(id: 'partner-timeline', checksum: 'checksum-1', ownerId: 'partner-1');
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: ownTrashed, timelineVisible: partnerTimeline));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect((result.asset as RemoteAsset).id, partnerTimeline.id);
    expect((result.asset as RemoteAsset).localId, 'local-1');
  });

  test('ignores an own locked candidate when the local DB row is absent', () async {
    final ownLocked = _remoteAsset(id: 'own-locked', checksum: 'checksum-1', visibility: AssetVisibility.locked);
    final partnerTimeline = _remoteAsset(id: 'partner-timeline', checksum: 'checksum-1', ownerId: 'partner-1');
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(
      () => remoteAssetRepository.getCandidatesByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => (own: ownLocked, timelineVisible: partnerTimeline));

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect((result.asset as RemoteAsset).id, partnerTimeline.id);
  });

  test('throws when neither localAssetId nor path is provided', () async {
    await expectLater(_resolve(container, _payload(localAssetId: null, path: null)), throwsA(isA<StateError>()));
  });
}

Future<ViewIntentResolution> _resolve(ProviderContainer container, ViewIntentPayload payload) {
  return container.read(viewIntentAssetResolverProvider).resolve(payload);
}

ViewIntentPayload _payload({String? localAssetId = 'local-1', String? path, String mimeType = 'image/jpeg'}) {
  return ViewIntentPayload(path: path, mimeType: mimeType, localAssetId: localAssetId);
}

LocalAsset _localAsset({required String id, String? checksum}) {
  return LocalAsset(
    id: id,
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}

RemoteAsset _remoteAsset({
  required String id,
  required String checksum,
  String ownerId = 'user-1',
  AssetVisibility visibility = AssetVisibility.timeline,
  bool isTrashed = false,
}) {
  return RemoteAsset(
    id: id,
    ownerId: ownerId,
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    isEdited: false,
    visibility: visibility,
    deletedAt: isTrashed ? DateTime(2026, 8, 21) : null,
  );
}

void _mockDeepLinkTimelineFactory(MockTimelineFactory timelineFactory, List<TimelineService> createdTimelineServices) {
  when(() => timelineFactory.fromAssets(any(), TimelineOrigin.deepLink)).thenAnswer((invocation) {
    final assets = List<BaseAsset>.from(invocation.positionalArguments[0] as List<BaseAsset>);
    final timelineService = _timelineServiceFromAssets(assets, TimelineOrigin.deepLink);
    createdTimelineServices.add(timelineService);
    return timelineService;
  });
}

TimelineService _timelineServiceFromAssets(List<BaseAsset> assets, TimelineOrigin origin) {
  return TimelineService((
    assetSource: (index, count) async => assets.skip(index).take(count).toList(),
    bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
    origin: origin,
  ));
}
