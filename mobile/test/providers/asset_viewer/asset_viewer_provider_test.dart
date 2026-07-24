import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../../unit/factories/remote_asset_factory.dart';

void main() {
  late ProviderContainer container;
  late MockAssetService assetService;

  setUpAll(() => registerFallbackValue(RemoteAssetFactory.create()));

  setUp(() {
    assetService = MockAssetService();
    when(() => assetService.watchAsset(any())).thenAnswer((_) => const Stream.empty());

    container = ProviderContainer(overrides: [assetServiceProvider.overrideWithValue(assetService)]);
    addTearDown(container.dispose);
  });

  group('AssetViewerStateNotifier asset watching', () {
    test('propagates stream updates for the current asset into state', () async {
      final controller = StreamController<BaseAsset?>();
      addTearDown(controller.close);
      final asset = RemoteAssetFactory.create();
      when(() => assetService.watchAsset(asset)).thenAnswer((_) => controller.stream);

      final notifier = container.read(assetViewerProvider.notifier);
      notifier.setAsset(asset);

      final updated = asset.copyWith(isFavorite: true);
      controller.add(updated);
      await pumpEventQueue();

      expect(container.read(assetViewerProvider).currentAsset, updated);
    });

    test('ignores null stream emissions', () async {
      final controller = StreamController<BaseAsset?>();
      addTearDown(controller.close);
      final asset = RemoteAssetFactory.create();
      when(() => assetService.watchAsset(asset)).thenAnswer((_) => controller.stream);

      container.read(assetViewerProvider.notifier).setAsset(asset);

      controller.add(null);
      await pumpEventQueue();

      expect(container.read(assetViewerProvider).currentAsset, asset);
    });

    test('reset cancels the subscription so later emissions are dropped', () async {
      final controller = StreamController<BaseAsset?>();
      addTearDown(controller.close);
      final asset = RemoteAssetFactory.create();
      when(() => assetService.watchAsset(asset)).thenAnswer((_) => controller.stream);

      final notifier = container.read(assetViewerProvider.notifier);
      notifier.setAsset(asset);
      notifier.reset();

      controller.add(RemoteAssetFactory.create(isFavorite: true));
      await pumpEventQueue();

      expect(container.read(assetViewerProvider).currentAsset, isNull);
    });

    test('setAsset switches the current asset, cancels the previous watch and listens to the new one', () async {
      final first = StreamController<BaseAsset?>();
      final second = StreamController<BaseAsset?>();
      addTearDown(first.close);
      addTearDown(second.close);

      final assetOne = RemoteAssetFactory.create();
      final assetTwo = RemoteAssetFactory.create();
      when(() => assetService.watchAsset(assetOne)).thenAnswer((_) => first.stream);
      when(() => assetService.watchAsset(assetTwo)).thenAnswer((_) => second.stream);

      final notifier = container.read(assetViewerProvider.notifier);
      notifier.setAsset(assetOne);
      expect(container.read(assetViewerProvider).currentAsset, assetOne);

      // Updates to the first asset propagate into state.
      final updatedOne = assetOne.copyWith(visibility: .archive);
      first.add(updatedOne);
      await pumpEventQueue();
      expect(container.read(assetViewerProvider).currentAsset, updatedOne);

      // Switch to new asset
      notifier.setAsset(assetTwo);
      expect(container.read(assetViewerProvider).currentAsset, assetTwo);

      // The previous watch is cancelled: stale emissions from the first stream are dropped.
      first.add(assetOne.copyWith(isFavorite: true));
      await pumpEventQueue();
      expect(container.read(assetViewerProvider).currentAsset, assetTwo);

      // The new asset is watched instead: its emissions propagate into state.
      final updatedTwo = assetTwo.copyWith(isFavorite: true);
      second.add(updatedTwo);
      await pumpEventQueue();
      expect(container.read(assetViewerProvider).currentAsset, updatedTwo);
    });
  });
}
