import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../unit/factories/local_asset_factory.dart';
import '../../unit/factories/remote_asset_factory.dart';

void main() {
  late StreamController<List<Bucket>> buckets;
  late List<BaseAsset> assets;
  late ProviderContainer container;

  setUp(() {
    buckets = StreamController();
    final timeline = TimelineService((
      assetSource: (_, _) async => assets,
      bucketSource: () => buckets.stream,
      origin: TimelineOrigin.main,
    ));
    container = ProviderContainer(overrides: [timelineServiceProvider.overrideWithValue(timeline)]);
    addTearDown(buckets.close);
    addTearDown(timeline.dispose);
    addTearDown(container.dispose);
  });

  Future<void> loadTimeline(List<BaseAsset> next) async {
    assets = next;
    final reloaded = EventStream.shared.where<TimelineReloadEvent>().first;
    buckets.add([Bucket(assetCount: next.length)]);
    await reloaded;
  }

  group('MultiSelectNotifier timeline reloads', () {
    test('keeps an asset selected when the timeline reloads it as uploaded', () async {
      final local = LocalAssetFactory.create();
      await loadTimeline([local]);
      container.read(multiSelectProvider.notifier).selectAsset(local);

      final uploaded = RemoteAssetFactory.create(localId: local.id);
      await loadTimeline([uploaded]);

      expect(container.read(multiSelectProvider).selectedAssets, {uploaded});
    });

    test('keeps an asset selected when a local album reloads it as uploaded', () async {
      final local = LocalAssetFactory.create();
      await loadTimeline([local]);
      container.read(multiSelectProvider.notifier).selectAsset(local);

      final uploaded = local.copyWith(remoteId: 'remote-id');
      await loadTimeline([uploaded]);

      final selected = container.read(multiSelectProvider).selectedAssets;
      expect(selected.contains(uploaded), isTrue);
      expect(selected.single.remoteId, 'remote-id');
    });

    test('keeps selected assets the reload did not load', () async {
      final local = LocalAssetFactory.create();
      await loadTimeline([local]);
      container.read(multiSelectProvider.notifier).selectAsset(local);

      await loadTimeline([LocalAssetFactory.create()]);

      expect(container.read(multiSelectProvider).selectedAssets, {local});
    });

    test('keeps an asset selected when the server updates it', () async {
      final remote = RemoteAssetFactory.create();
      await loadTimeline([remote]);
      container.read(multiSelectProvider.notifier).selectAsset(remote);

      final updated = remote.copyWith(thumbHash: 'thumbhash');
      await loadTimeline([updated]);

      expect(container.read(multiSelectProvider).selectedAssets, {updated});
    });

    test('keeps the same state when a reload changes no selected asset', () async {
      final remote = RemoteAssetFactory.create();
      await loadTimeline([remote]);
      container.read(multiSelectProvider.notifier).selectAsset(remote);
      final before = container.read(multiSelectProvider);

      await loadTimeline([remote.copyWith(), RemoteAssetFactory.create()]);

      expect(container.read(multiSelectProvider), same(before));
    });
  });
}
