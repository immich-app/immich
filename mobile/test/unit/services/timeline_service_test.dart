import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';

import '../factories/remote_asset_factory.dart';

void main() {
  // total must exceed the sliding buffer so it cannot hold the whole library at once
  const total = 2000;
  late List<BaseAsset> all;
  late TimelineService sut;

  TimelineService buildService() {
    all = List.generate(total, (i) => RemoteAssetFactory.create(id: 'a${i.toString().padLeft(5, '0')}'));
    return TimelineService((
      assetSource: (index, count) async {
        final end = (index + count) > total ? total : index + count;
        return all.sublist(index, end);
      },
      bucketSource: () => Stream.value([const Bucket(assetCount: total)]),
      origin: TimelineOrigin.main,
    ));
  }

  Future<void> settle() => Future.delayed(const Duration(milliseconds: 10));

  setUp(() async {
    sut = buildService();
    await settle(); // let the bucket subscription load the first batch and set totalAssets
  });

  tearDown(() async {
    await sut.dispose();
  });

  test('buffer holds the first batch but not the whole library', () {
    expect(sut.totalAssets, total);
    expect(sut.hasRange(0, kTimelineAssetLoadBatchSize), isTrue);
    expect(sut.hasRange(0, total), isFalse);
  });

  // #27118 / #20855 mechanism: drag-selecting from a low anchor while the grid
  // auto-scrolls down slides the buffer forward to follow the finger. once the
  // buffer offset passes the anchor, hasRange(anchor, ...) is false and
  // _handleDragAssetEnter silently stops extending the selection.
  test('anchor drops out of the buffer after the grid scrolls down', () async {
    const anchor = 5;
    expect(sut.hasRange(anchor, 100), isTrue);

    // the grid loads a far-down range as it auto-scrolls during the drag
    await sut.loadAssets(1500, 1);

    const current = 1500;
    const count = current - anchor + 1;
    expect(sut.hasRange(anchor, 1), isFalse, reason: 'anchor is now below the buffer offset');
    expect(sut.hasRange(anchor, count), isFalse, reason: 'the full drag range is no longer resident');
    expect(() => sut.getAssets(anchor, count), throwsRangeError);
  });

  // the fix: getAssetsRange returns the whole drag range regardless of the
  // buffer position, so the selection keeps extending while scrolling.
  group('getAssetsRange', () {
    test('returns a buffered range', () async {
      final assets = await sut.getAssetsRange(0, 50);
      expect(assets.length, 50);
      expect(assets.first, all[0]);
      expect(assets.last, all[49]);
    });

    test('returns a range wider than the buffer', () async {
      final assets = await sut.getAssetsRange(0, total);
      expect(assets.length, total);
      expect(assets.first, all[0]);
      expect(assets.last, all[total - 1]);
    });

    test('returns the anchor range after the buffer scrolled past the anchor', () async {
      const anchor = 5;
      await sut.loadAssets(1500, 1); // buffer slides forward, dropping the anchor
      expect(sut.hasRange(anchor, 1), isFalse);

      const current = 1500;
      const count = current - anchor + 1;
      final assets = await sut.getAssetsRange(anchor, count);
      expect(assets.length, count);
      expect(assets.first, all[anchor]);
      expect(assets.last, all[current]);
    });

    test('clamps a range that runs past the end and ignores invalid input', () async {
      final tail = await sut.getAssetsRange(total - 10, 100);
      expect(tail.length, 10);
      expect(await sut.getAssetsRange(-1, 10), isEmpty);
      expect(await sut.getAssetsRange(0, 0), isEmpty);
      expect(await sut.getAssetsRange(total, 10), isEmpty);
    });
  });
}
