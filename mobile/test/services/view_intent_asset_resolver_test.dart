import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:mocktail/mocktail.dart';

import '../fixtures/user.stub.dart';
import '../infrastructure/repository.mock.dart';

class MockTimelineRepository extends Mock implements DriftTimelineRepository {}

class MockTimelineFactory extends Mock implements TimelineFactory {}

class MockNativeSyncApi extends Mock implements NativeSyncApi {}

class MockUserService extends Mock implements UserService {}

class _StaticCurrentUserProvider extends CurrentUserProvider {
  _StaticCurrentUserProvider(UserService userService) : super(userService) {
    state = userService.tryGetMyUser();
  }
}

void main() {
  late MockDriftLocalAssetRepository mockLocalAssetRepository;
  late MockNativeSyncApi nativeSyncApi;
  late MockTimelineRepository timelineRepository;
  late MockTimelineFactory timelineFactory;
  late MockUserService userService;
  late TimelineService mainTimelineService;
  late List<TimelineService> createdTimelineServices;
  late ProviderContainer container;

  setUp(() async {
    mockLocalAssetRepository = MockDriftLocalAssetRepository();
    nativeSyncApi = MockNativeSyncApi();
    timelineRepository = MockTimelineRepository();
    timelineFactory = MockTimelineFactory();
    userService = MockUserService();
    createdTimelineServices = [];
    mainTimelineService = await _setMainTimelineService(const [], createdTimelineServices);

    when(() => userService.tryGetMyUser()).thenReturn(UserStub.admin);
    when(() => userService.watchMyUser()).thenAnswer((_) => Stream.value(UserStub.admin));

    when(() => timelineFactory.fromAssets(any(), TimelineOrigin.deepLink)).thenAnswer((invocation) {
      final assets = List<BaseAsset>.from(invocation.positionalArguments[0] as List<BaseAsset>);
      final timelineService = _timelineServiceFromAssets(assets, TimelineOrigin.deepLink);
      createdTimelineServices.add(timelineService);
      return timelineService;
    });

    container = ProviderContainer(
      overrides: [
        localAssetRepository.overrideWith((ref) => mockLocalAssetRepository),
        nativeSyncApiProvider.overrideWith((ref) => nativeSyncApi),
        timelineRepositoryProvider.overrideWith((ref) => timelineRepository),
        timelineFactoryProvider.overrideWith((ref) => timelineFactory),
        timelineServiceProvider.overrideWith((ref) => mainTimelineService),
        timelineUsersProvider.overrideWith((ref) => Stream.value(['user-1'])),
        currentUserProvider.overrideWith((ref) => _StaticCurrentUserProvider(userService)),
      ],
    );
    await container.read(timelineUsersProvider.future);

    addTearDown(() async {
      for (final timelineService in createdTimelineServices) {
        await timelineService.dispose();
      }
      container.dispose();
    });
  });

  test('resolves main timeline asset by local id without hashing', () async {
    final localAsset = _localAsset(id: 'local-1');
    final mainAsset = _remoteAsset(id: 'remote-1', localId: 'local-1', checksum: 'checksum-1');
    mainTimelineService = await _setMainTimelineService([mainAsset], createdTimelineServices);

    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => timelineRepository.getMainTimelineIndexByLocalId(['user-1'], 'local-1')).thenAnswer((_) async => 0);

    final result = await container.read(viewIntentAssetResolverProvider).resolve(_payload(localAssetId: 'local-1'));

    expect(result.asset, same(mainAsset));
    expect(result.timelineService, same(mainTimelineService));
    expect(result.initialIndex, 0);
    expect(result.viewIntentFilePath, isNull);
    verifyNever(() => nativeSyncApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
    verifyNever(() => timelineRepository.getMainTimelineIndexByChecksum(any(), any()));
  });

  test('falls back to checksum from local db when local id is not in main timeline', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: 'checksum-1');
    final mainAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    mainTimelineService = await _setMainTimelineService([mainAsset], createdTimelineServices);

    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => timelineRepository.getMainTimelineIndexByLocalId(['user-1'], 'local-1')).thenAnswer((_) async => null);
    when(() => timelineRepository.getMainTimelineIndexByChecksum(['user-1'], 'checksum-1')).thenAnswer((_) async => 0);

    final result = await container.read(viewIntentAssetResolverProvider).resolve(_payload(localAssetId: 'local-1'));

    expect(result.asset, same(mainAsset));
    expect(result.timelineService, same(mainTimelineService));
    verifyNever(() => nativeSyncApi.hashAssets(any(), allowNetworkAccess: any(named: 'allowNetworkAccess')));
  });

  test('computes checksum for local asset when db checksum is missing', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: null);
    final mainAsset = _remoteAsset(id: 'remote-1', checksum: 'checksum-1');
    mainTimelineService = await _setMainTimelineService([mainAsset], createdTimelineServices);

    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => timelineRepository.getMainTimelineIndexByLocalId(['user-1'], 'local-1')).thenAnswer((_) async => null);
    when(
      () => nativeSyncApi.hashAssets(['local-1'], allowNetworkAccess: false),
    ).thenAnswer((_) async => [HashResult(assetId: 'local-1', hash: 'checksum-1')]);
    when(() => timelineRepository.getMainTimelineIndexByChecksum(['user-1'], 'checksum-1')).thenAnswer((_) async => 0);

    final result = await container.read(viewIntentAssetResolverProvider).resolve(_payload(localAssetId: 'local-1'));

    expect(result.asset, same(mainAsset));
    expect(result.timelineService, same(mainTimelineService));
    verify(() => nativeSyncApi.hashAssets(['local-1'], allowNetworkAccess: false)).called(1);
  });

  test('returns deep-link local asset when no main timeline match is found', () async {
    final localAsset = _localAsset(id: 'local-1', checksum: null);

    when(() => mockLocalAssetRepository.getById('local-1')).thenAnswer((_) async => localAsset);
    when(() => timelineRepository.getMainTimelineIndexByLocalId(['user-1'], 'local-1')).thenAnswer((_) async => null);
    when(() => nativeSyncApi.hashAssets(['local-1'], allowNetworkAccess: false)).thenThrow(Exception('hash failed'));

    final result = await container.read(viewIntentAssetResolverProvider).resolve(_payload(localAssetId: 'local-1'));

    expect(result.asset, equals(localAsset));
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.initialIndex, 0);
    expect(result.viewIntentFilePath, isNull);
  });

  test('matches path-only attachment to main timeline by checksum', () async {
    final mainAsset = _remoteAsset(id: 'remote-2', checksum: 'checksum-2');
    mainTimelineService = await _setMainTimelineService([mainAsset], createdTimelineServices);

    when(
      () => nativeSyncApi.hashFiles(['/tmp/incoming.jpg']),
    ).thenAnswer((_) async => [HashResult(assetId: '/tmp/incoming.jpg', hash: 'checksum-2')]);
    when(() => timelineRepository.getMainTimelineIndexByChecksum(['user-1'], 'checksum-2')).thenAnswer((_) async => 0);

    final result = await container
        .read(viewIntentAssetResolverProvider)
        .resolve(_payload(path: '/tmp/incoming.jpg', localAssetId: null));

    expect(result.asset, same(mainAsset));
    expect(result.timelineService, same(mainTimelineService));
    expect(result.viewIntentFilePath, isNull);
  });

  test('returns transient deep-link asset for unmatched path-only attachment', () async {
    when(() => nativeSyncApi.hashFiles(['/tmp/incoming.webp'])).thenAnswer((_) async => const []);

    final result = await container
        .read(viewIntentAssetResolverProvider)
        .resolve(_payload(path: '/tmp/incoming.webp', localAssetId: null, mimeType: 'image/webp'));

    expect(result.asset, isA<LocalAsset>());
    expect(result.timelineService.origin, TimelineOrigin.deepLink);
    expect(result.initialIndex, 0);
    expect(result.viewIntentFilePath, '/tmp/incoming.webp');

    final asset = result.asset as LocalAsset;
    expect(asset.localId, startsWith('-'));
    expect(asset.name, 'incoming.webp');
    expect(asset.checksum, isNull);
    expect(asset.playbackStyle, AssetPlaybackStyle.imageAnimated);
  });
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

RemoteAsset _remoteAsset({required String id, String? localId, String? checksum}) {
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
  );
}

TimelineService _timelineServiceFromAssets(List<BaseAsset> assets, TimelineOrigin origin) {
  return TimelineService((
    assetSource: (index, count) async => assets.skip(index).take(count).toList(),
    bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
    origin: origin,
  ));
}

Future<TimelineService> _createReadyTimelineService(List<BaseAsset> assets, TimelineOrigin origin) async {
  final timelineService = _timelineServiceFromAssets(assets, origin);

  for (var i = 0; i < 20 && !timelineService.isReady; i++) {
    await Future<void>.delayed(Duration.zero);
  }

  return timelineService;
}

Future<TimelineService> _setMainTimelineService(
  List<BaseAsset> assets,
  List<TimelineService> createdTimelineServices,
) async {
  final timelineService = await _createReadyTimelineService(assets, TimelineOrigin.main);
  createdTimelineServices.add(timelineService);
  return timelineService;
}
