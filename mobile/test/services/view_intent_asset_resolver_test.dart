import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:mocktail/mocktail.dart';

import '../infrastructure/repository.mock.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

void main() {
  late MockDriftLocalAssetRepository mockLocalAssetRepository;
  late MockTimelineFactory timelineFactory;
  late List<TimelineService> createdTimelineServices;
  late ProviderContainer container;

  setUp(() {
    mockLocalAssetRepository = MockDriftLocalAssetRepository();
    timelineFactory = MockTimelineFactory();
    createdTimelineServices = [];

    when(() => timelineFactory.fromAssets(any(), TimelineOrigin.deepLink)).thenAnswer((invocation) {
      final assets = List<BaseAsset>.from(invocation.positionalArguments[0] as List<BaseAsset>);
      final timelineService = _timelineServiceFromAssets(assets, TimelineOrigin.deepLink);
      createdTimelineServices.add(timelineService);
      return timelineService;
    });

    container = ProviderContainer(
      overrides: [
        localAssetRepository.overrideWith((ref) => mockLocalAssetRepository),
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
    await expectLater(
      _resolve(container, _payload(localAssetId: null, path: null)),
      throwsA(isA<StateError>()),
    );
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

TimelineService _timelineServiceFromAssets(List<BaseAsset> assets, TimelineOrigin origin) {
  return TimelineService((
    assetSource: (index, count) async => assets.skip(index).take(count).toList(),
    bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
    origin: origin,
  ));
}
