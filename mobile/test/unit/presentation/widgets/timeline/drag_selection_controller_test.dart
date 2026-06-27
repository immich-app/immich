import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/drag_selection_controller.dart';

import '../../../factories/remote_asset_factory.dart';

void main() {
  const total = 50;
  late List<BaseAsset> all;
  late Set<int> inBuffer; // indices getAssetSafe resolves synchronously
  late List<Completer<List<BaseAsset>>> reads; // pending async reads, completed manually
  late List<({int from, int count})> readArgs;
  late Set<BaseAsset> selected;
  late DragSelectionController sut;

  Set<BaseAsset> range(int lo, int hi) => {for (var i = lo; i <= hi; i++) all[i]};

  void completeRead(int i) {
    final a = readArgs[i];
    reads[i].complete([for (var k = a.from; k < a.from + a.count && k < total; k++) all[k]]);
  }

  Future<void> settle() => Future(() {});

  setUp(() {
    all = List.generate(total, (i) => RemoteAssetFactory.create(id: 'a${i.toString().padLeft(3, '0')}'));
    inBuffer = {for (var i = 0; i < total; i++) i}; // default: everything buffered (sync)
    reads = [];
    readArgs = [];
    selected = {};
    sut = DragSelectionController(
      getAssetSafe: (i) => inBuffer.contains(i) ? all[i] : null,
      getAssetsRange: (from, count) {
        final c = Completer<List<BaseAsset>>();
        reads.add(c);
        readArgs.add((from: from, count: count));
        return c.future;
      },
      onChange: (select, deselect) {
        selected
          ..addAll(select)
          ..removeAll(deselect);
      },
    );
  });

  group('live selection (all in buffer, synchronous)', () {
    test('dragging down selects the whole range as it grows', () {
      sut.start(2);
      sut.enter(6);
      sut.enter(12);
      expect(selected, range(2, 12));
      expect(reads, isEmpty, reason: 'everything buffered -> no async read');
    });

    test('dragging back up toward the anchor deselects the shrunk tail', () {
      sut.start(2);
      sut.enter(12);
      expect(selected, range(2, 12));
      sut.enter(6); // reverse
      expect(selected, range(2, 6));
      sut.enter(3); // reverse more
      expect(selected, range(2, 3));
    });

    test('dragging past the anchor flips the range', () {
      sut.start(10);
      sut.enter(14);
      expect(selected, range(10, 14));
      sut.enter(7); // crosses the anchor
      expect(selected, range(7, 10));
    });
  });

  group('beyond-buffer (async)', () {
    setUp(() => inBuffer = {}); // nothing buffered -> every tile needs an async read

    test('drag-end fills the full range even if every live read is still in flight', () async {
      sut.start(0);
      sut.enter(20);
      // simulate the real-rate race: none of the in-drag reads have completed
      expect(selected, isEmpty);

      final ending = sut.end();
      // end() issues its own read for the missing range; complete it
      completeRead(reads.length - 1);
      await ending;

      expect(selected, range(0, 20), reason: 'final range must always apply on drag-end');
    });

    test('out-of-order live read completions never corrupt the selection', () async {
      sut.start(0); // issues read for [0,1]
      sut.enter(10); // issues read for [0,11]
      sut.enter(20); // issues read for [0,21]
      expect(reads.length, 3);

      // complete newest first, then older ones (out of order)
      completeRead(2);
      await settle();
      completeRead(1);
      await settle();
      completeRead(0);
      await settle();

      expect(selected, range(0, 20));

      final ending = sut.end();
      await ending; // nothing missing -> no extra read
      expect(selected, range(0, 20));
    });

    test('a disposed controller never emits when its in-flight read resolves', () async {
      sut.start(0); // read [0,1] (pending, in flight)
      sut.enter(20); // read [0,21] (pending, in flight)
      expect(selected, isEmpty);

      // a new drag starts -> the old controller is disposed
      final ending = sut.end(); // issues end()'s fill read
      sut.dispose();

      // every in-flight read for the old controller now resolves
      for (var i = 0; i < reads.length; i++) {
        if (!reads[i].isCompleted) {
          completeRead(i);
        }
      }
      await ending;
      await settle();

      expect(selected, isEmpty, reason: 'a disposed controller must not leak into the new selection');
    });

    test('a late read for tiles dragged back out of range is ignored', () async {
      sut.start(0); // read [0,1]
      sut.enter(20); // read [0,21]
      sut.enter(5); // shrink back; read [0,6]
      // complete the stale wide read AFTER the shrink
      completeRead(1); // [0,21]
      await settle();
      // indices 6..20 left the range -> must not be selected
      expect(selected.intersection(range(6, 20)), isEmpty);

      final ending = sut.end();
      // complete any read end() issued for the (now smaller) missing range
      for (var i = 0; i < reads.length; i++) {
        if (!reads[i].isCompleted) {
          completeRead(i);
        }
      }
      await ending;
      expect(selected, range(0, 5));
    });
  });
}
