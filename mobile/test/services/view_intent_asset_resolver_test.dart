import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockAssetService extends Mock implements AssetService {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

void main() {
  late MockDriftLocalAssetRepository mockLocalAssetRepository;
  late MockAssetService assetService;
  late MockNativeSyncApi nativeSyncApi;
  late MockTimelineFactory timelineFactory;
  late List<TimelineService> createdTimelineServices;
  late ProviderContainer container;

  setUpAll(() {
    registerFallbackValue(<String>[]);
    registerFallbackValue(<String, String>{});
  });

  setUp(() {
    mockLocalAssetRepository = MockDriftLocalAssetRepository();
    assetService = MockAssetService();
    nativeSyncApi = MockNativeSyncApi();
    timelineFactory = MockTimelineFactory();
    createdTimelineServices = [];

    when(() => assetService.getRemoteAssetByChecksum(any())).thenAnswer((_) async => null);
    when(() => nativeSyncApi.hashAssets(any())).thenAnswer((_) async => const []);
    when(() => mockLocalAssetRepository.updateHashes(any())).thenAnswer((_) async {});

    _mockTimelineFactoryOrigin(timelineFactory, createdTimelineServices, TimelineOrigin.deepLink);
    _mockTimelineFactoryOrigin(timelineFactory, createdTimelineServices, TimelineOrigin.deepLinkTrash);

    container = ProviderContainer(
      overrides: [
        localAssetRepository.overrideWith((ref) => mockLocalAssetRepository),
        assetServiceProvider.overrideWithValue(assetService),
        nativeSyncApiProvider.overrideWithValue(nativeSyncApi),
        timelineFactoryProvider.overrideWith((ref) => timelineFactory),
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
  });

  test('returns remote merged asset when local checksum matches remote asset', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => assetService.getRemoteAssetByChecksum('checksum-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull);
    verifyNever(() => nativeSyncApi.hashAssets(any()));
  });

  test('returns remote trashed asset in a 1-element deep-link trash timeline', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1', deletedAt: DateTime(2026, 4, 21));
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => assetService.getRemoteAssetByChecksum('checksum-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLinkTrash);
    expect(result.viewIntentFilePath, isNull);
  });

  test('hashes local asset without checksum and returns remote merged asset', () async {
    final localAsset = _localAsset(id: 'local-1');
    final remoteAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(
      () => nativeSyncApi.hashAssets(['local-1']),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(() => assetService.getRemoteAssetByChecksum('checksum-1')).thenAnswer((_) async => remoteAsset);

    final result = await _resolve(container, _payload(localAssetId: 'local-1'));

    expect(result.asset, isA<RemoteAsset>());
    expect((result.asset as RemoteAsset).localId, 'local-1');
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, isNull);
    verify(() => nativeSyncApi.hashAssets(['local-1'])).called(1);
  });

  test('returns transient asset with temp file path when localAssetId has no DB row', () async {
    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => null);

    final result = await _resolve(container, _payload(localAssetId: 'local-1', path: '/tmp/incoming.jpg'));

    expect(result.asset, isA<LocalAsset>());
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.viewIntentFilePath, '/tmp/incoming.jpg');
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

Future<ViewIntentResolvedAsset> _resolve(ProviderContainer container, ViewIntentPayload payload) {
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
