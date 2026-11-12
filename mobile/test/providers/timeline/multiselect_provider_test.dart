import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../unit/factories/remote_asset_factory.dart';

void main() {
  List<BaseAsset> assetsOf(int count) => List.generate(count, (i) => RemoteAssetFactory.create(id: 'asset-$i'));

  Future<ProviderContainer> containerOf(List<BaseAsset> assets) async {
    final service = TimelineService((
      assetSource: (index, count) async => assets.sublist(index, math.min(index + count, assets.length)),
      bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
      origin: TimelineOrigin.remoteAlbum,
    ));
    for (var i = 0; i < 20 && service.totalAssets != assets.length; i++) {
      await Future<void>.delayed(Duration.zero);
    }

    final container = ProviderContainer(overrides: [timelineServiceProvider.overrideWithValue(service)]);
    addTearDown(container.dispose);
    addTearDown(service.dispose);

    return container;
  }

  test('selectAll selects every asset of the timeline', () async {
    final assets = assetsOf(10);
    final container = await containerOf(assets);

    await container.read(multiSelectProvider.notifier).selectAll();

    expect(container.read(multiSelectProvider).selectedAssets, assets.toSet());
  });

  test('selectAll reaches assets beyond a single load batch', () async {
    final assets = assetsOf(2500);
    final container = await containerOf(assets);

    await container.read(multiSelectProvider.notifier).selectAll();

    expect(container.read(multiSelectProvider).selectedAssets.length, 2500);
  });

  test('selectAll keeps an already selected asset selected exactly once', () async {
    final assets = assetsOf(5);
    final container = await containerOf(assets);
    container.read(multiSelectProvider.notifier).selectAsset(assets[2]);

    await container.read(multiSelectProvider.notifier).selectAll();

    expect(container.read(multiSelectProvider).selectedAssets.length, 5);
  });

  test('selectAll does nothing on an empty timeline', () async {
    final container = await containerOf([]);

    await container.read(multiSelectProvider.notifier).selectAll();

    expect(container.read(multiSelectProvider).selectedAssets, isEmpty);
  });
}
