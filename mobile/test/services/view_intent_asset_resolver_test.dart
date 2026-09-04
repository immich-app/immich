import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockTimelineRepository extends Mock implements TimelineRepository {}

class MockAssetService extends Mock implements AssetService {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

void main() {
  late MockLocalAssetRepository mockLocalAssetRepository;
  late MockAssetService assetService;
  late MockNativeSyncApi nativeSyncApi;
  late MockTimelineFactory timelineFactory;
  late MockTimelineRepository timelineRepository;
  late List<TimelineService> createdTimelineServices;
  late ProviderContainer container;

  setUpAll(() {
    registerFallbackValue(<String>[]);
    registerFallbackValue(<String, String>{});
  });

  setUp(() {
    mockLocalAssetRepository = MockLocalAssetRepository();
    assetService = MockAssetService();
    nativeSyncApi = MockNativeSyncApi();
    timelineFactory = MockTimelineFactory();
    timelineRepository = MockTimelineRepository();
    createdTimelineServices = [];

    when(() => mockLocalAssetRepository.get(any())).thenAnswer((_) async => null);
    when(() => assetService.getRemoteAsset(any())).thenAnswer((_) async => null);
    when(() => assetService.getAllRemoteAssetDebugByChecksum(any())).thenAnswer((_) async => const []);
    when(() => nativeSyncApi.hashAssets(any())).thenAnswer((_) async => const []);
    when(() => mockLocalAssetRepository.updateHashes(any())).thenAnswer((_) async {});

    _mockTimelineFactoryOrigin(timelineFactory, createdTimelineServices, TimelineOrigin.deepLink);

    final drift = MockDrift();
    when(() => drift.localAssetRepository).thenReturn(mockLocalAssetRepository);
    when(() => drift.timelineRepository).thenReturn(timelineRepository);
    when(
      () => timelineRepository.getViewableRemoteAssetsByChecksum(any(), any()),
    ).thenAnswer((_) async => const []);

    container = ProviderContainer(
      overrides: [
        driftProvider.overrideWithValue(drift),
        assetServiceProvider.overrideWithValue(assetService),
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
    when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => localAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, equals(localAsset));
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull, reason: 'DB-backed assets carry their own source — no temp file needed');
  });

  test('returns remote merged asset when local checksum matches remote asset', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => localAsset);
    when(() => assetService.getRemoteAsset('remote-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull);
    verifyNever(() => nativeSyncApi.hashAssets(any()));
  });

  test('falls back to the local asset when its linked remote asset is trashed', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1', deletedAt: DateTime(2026, 4, 21));
    when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => localAsset);
    when(() => assetService.getRemoteAsset('remote-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, equals(localAsset));
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull);
  });

  test('hashes local asset without checksum and returns remote merged asset', () async {
    final localAsset = _localAsset(id: 'local-1');
    final mergedLocalAsset = _localAsset(id: 'local-1', checksum: 'checksum-1', remoteId: 'remote-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    var getCallCount = 0;
    when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async {
      getCallCount++;
      return getCallCount == 1 ? localAsset : mergedLocalAsset;
    });
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(() => assetService.getRemoteAsset('remote-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull);
    verify(() => nativeSyncApi.hashAssets(['local-1'])).called(1);
    verify(() => mockLocalAssetRepository.updateHashes({'local-1': 'checksum-1'})).called(1);
    verify(() => mockLocalAssetRepository.get('local-1')).called(2);
  });

  test('returns transient asset with temp file path when localAssetId has no DB row', () async {
    when(() => mockLocalAssetRepository.get('local-1')).thenAnswer((_) async => null);

    final result = await _resolve(container, _payload(localAssetId: 'local-1', path: '/tmp/incoming.jpg'));

    expect(result.asset, isA<LocalAsset>());
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, '/tmp/incoming.jpg');
  });

  test('returns cached remote asset when local Drift row is absent but checksum matches', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(() => assetService.getAllRemoteAssetDebugByChecksum('checksum-1')).thenAnswer((_) async => [remoteAsset]);
    when(
      () => timelineRepository.getViewableRemoteAssetsByChecksum(['user-1'], 'checksum-1'),
    ).thenAnswer((_) async => [remoteAsset]);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).id, 'remote-1');
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    verify(() => timelineRepository.getViewableRemoteAssetsByChecksum(['user-1'], 'checksum-1')).called(1);
    verifyNever(() => assetService.getAllRemoteAssetDebugByChecksum(any()));
  });

  test('returns transient asset for path-only attachment', () async {
    final result = await _resolve(
      container,
      _payload(localAssetId: null, path: '/tmp/incoming.webp', mimeType: 'image/webp'),
    );

    expect(result.asset, isA<LocalAsset>());
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, '/tmp/incoming.webp');

    final asset = result.asset as LocalAsset;
    expect(asset.localId, startsWith('-'));
    expect(asset.name, 'incoming.webp');
    expect(asset.playbackStyle, AssetPlaybackStyle.imageAnimated);
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

LocalAsset _localAsset({required String id, String? checksum, String? remoteId}) {
  return LocalAsset(
    id: id,
    remoteId: remoteId,
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}

RemoteAsset _remoteAsset({required String id, String? localId, required String checksum, DateTime? deletedAt}) {
  return RemoteAsset(
    id: id,
    localId: localId,
    ownerId: 'user-1',
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    isEdited: false,
    deletedAt: deletedAt,
  );
}

void _mockTimelineFactoryOrigin(
  MockTimelineFactory timelineFactory,
  List<TimelineService> createdTimelineServices,
  TimelineOrigin origin,
) {
  when(() => timelineFactory.fromAssets(any(), origin)).thenAnswer((invocation) {
    final assets = List<BaseAsset>.from(invocation.positionalArguments[0] as List<BaseAsset>);
    final timelineService = _timelineServiceFromAssets(assets, origin);
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
