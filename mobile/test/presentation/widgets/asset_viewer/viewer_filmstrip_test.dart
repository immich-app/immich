import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/viewer_filmstrip.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

const _assetCount = 50;
const _openedIndex = 20;
const _extent = 20.0;
const _expandedExtent = _extent * 1.5;
const _actionsKey = Key('actions');

final _assets = List<BaseAsset>.generate(_assetCount, (i) => LocalAssetStub.image1.copyWith(id: 'asset-$i'));

class _OpenedAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentIndex: _openedIndex, currentAsset: _assets[_openedIndex]);
  }
}

Future<void> _scrub(WidgetTester tester, double dx, {Offset? from}) async {
  final gesture = await tester.startGesture(from ?? tester.getCenter(find.byType(ViewerFilmstrip)));
  const steps = 20;
  for (var i = 0; i < steps; i++) {
    await gesture.moveBy(Offset(dx / steps, 0));
    await tester.pump(const Duration(milliseconds: 16));
  }
  await tester.pump(const Duration(milliseconds: 200));
  await gesture.up();
}

Finder _thumbnailOf(int index) => find.byWidgetPredicate(
  (widget) =>
      widget is Thumbnail &&
      widget.imageProvider is LocalThumbProvider &&
      (widget.imageProvider! as LocalThumbProvider).id == 'asset-$index',
);

void main() {
  late PresentationContext context;
  late List<String> haptics;

  setUp(() async {
    context = await PresentationContext.create();
    haptics = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'HapticFeedback.vibrate') {
          haptics.add(call.arguments as String);
        }
        return null;
      },
    );
  });

  tearDown(() async {
    await context.dispose();
  });

  Future<ProviderContainer> pumpFilmstrip(WidgetTester tester, {TimelineService? timeline, Widget? actions}) async {
    timeline ??= TimelineService((
      assetSource: (offset, count) async => _assets.skip(offset).take(count).toList(),
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();

    await tester.pumpTestWidget(
      context,
      Align(
        alignment: Alignment.bottomCenter,
        child: ViewerFilmstrip(actions: actions),
      ),
      overrides: [
        timelineServiceProvider.overrideWithValue(timeline),
        assetViewerProvider.overrideWith(_OpenedAssetViewerNotifier.new),
      ],
      expectSettle: false,
    );
    return ProviderScope.containerOf(tester.element(find.byType(ViewerFilmstrip)));
  }

  group('opening the viewer', () {
    testWidgets('first frame already centers the opened asset', (tester) async {
      await pumpFilmstrip(tester);

      expect(_thumbnailOf(_openedIndex), findsOneWidget);
      expect(tester.getCenter(_thumbnailOf(_openedIndex)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });

    testWidgets('thumbnails default to 20 wide and 30 tall like Apple Photos', (tester) async {
      await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)), const Size(20, 30));
    });
  });

  group('scrubbing', () {
    testWidgets('selects each asset passing the center with a selection click', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      haptics.clear();

      await _scrub(tester, -23 * 3 - kDragSlopDefault);
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex + 3);
      expect(haptics, List.filled(3, 'HapticFeedbackType.selectionClick'));
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 3)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });

    testWidgets('a release between two thumbnails settles on the nearest one', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      await _scrub(tester, -23 * 2 - 8 - kDragSlopDefault);
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex + 2);
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 2)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });
  });

  group('flicking repeatedly', () {
    testWidgets('a touch that stops the glide lands where it stopped, not on the touched thumbnail', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      await tester.flingFrom(tester.getCenter(find.byType(ViewerFilmstrip)), const Offset(-60, 0), 800);
      await tester.pump(const Duration(milliseconds: 40));
      final gesture = await tester.startGesture(tester.getCenter(find.byType(ViewerFilmstrip)) + const Offset(120, 0));
      await tester.pump(const Duration(milliseconds: 16));
      final stoppedAt = container.read(assetViewerProvider).currentIndex;
      await tester.pump(const Duration(milliseconds: 200));
      await gesture.up();
      await tester.pumpAndSettle();

      expect(stoppedAt, greaterThan(_openedIndex));
      expect(container.read(assetViewerProvider).currentIndex, stoppedAt);
      expect(tester.getCenter(_thumbnailOf(stoppedAt)).dx, moreOrLessEquals(400, epsilon: 1));
    });

    testWidgets('a drag that interrupts the glide keeps selecting the assets it passes', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      await tester.flingFrom(tester.getCenter(find.byType(ViewerFilmstrip)), const Offset(-60, 0), 800);
      await tester.pump(const Duration(milliseconds: 40));

      final gesture = await tester.startGesture(tester.getCenter(find.byType(ViewerFilmstrip)));
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      final touchedAt = container.read(assetViewerProvider).currentIndex;
      for (var i = 0; i < 12; i++) {
        await gesture.moveBy(const Offset(-8, 0));
        await tester.pump(const Duration(milliseconds: 16));
      }
      final draggedTo = container.read(assetViewerProvider).currentIndex;
      await tester.pump(const Duration(milliseconds: 300));
      await gesture.up();
      await tester.pumpAndSettle();

      expect(draggedTo, greaterThanOrEqualTo(touchedAt + 3));
      expect(container.read(assetViewerProvider).currentIndex, draggedTo);
      expect(tester.getCenter(_thumbnailOf(draggedTo)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });
  });

  group('swiping the main photo', () {
    testWidgets('the current and target thumbnails shrink and grow with the swipe distance', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      final swipe = container.read(viewerSwipePageProvider);

      swipe.value = _openedIndex + 0.25;
      await tester.pump(Durations.short4);
      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, moreOrLessEquals(27.5));
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, moreOrLessEquals(22.5));

      swipe.value = _openedIndex + 0.5;
      await tester.pump(Durations.short4);
      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, moreOrLessEquals(25));
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, moreOrLessEquals(25));

      swipe.value = _openedIndex + 0.75;
      await tester.pump(Durations.short4);
      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, moreOrLessEquals(22.5));
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, moreOrLessEquals(27.5));
    });

    testWidgets('halfway through a swipe the two thumbnails sit evenly around the center, 13 apart', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      container.read(viewerSwipePageProvider).value = _openedIndex + 0.5;
      await tester.pump(Durations.short4);

      final current = tester.getRect(_thumbnailOf(_openedIndex));
      final target = tester.getRect(_thumbnailOf(_openedIndex + 1));
      expect((current.center.dx + target.center.dx) / 2, moreOrLessEquals(400, epsilon: 1));
      expect(target.left - current.right, moreOrLessEquals(13));
    });

    testWidgets('the strip settles on the swiped photo without shrinking or jumping', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      haptics.clear();
      final swipe = container.read(viewerSwipePageProvider);

      for (final progress in [0.25, 0.5, 0.75]) {
        swipe.value = _openedIndex + progress;
        await tester.pump(Durations.short4);
      }
      swipe.value = _openedIndex + 1.0;
      container.read(assetViewerProvider.notifier).setCurrentIndex(_openedIndex + 1);
      swipe.value = null;
      await tester.pump();
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _expandedExtent);
      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, _extent);
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 1)).dx, moreOrLessEquals(400, epsilon: 1));

      await tester.pump(Durations.short1);
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _expandedExtent);

      await tester.pumpAndSettle();
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _expandedExtent);
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 1)).dx, moreOrLessEquals(400, epsilon: 1));
      expect(haptics, isEmpty);
    });

    testWidgets('a swipe that starts while the previous one is still settling keeps growing the target', (
      tester,
    ) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      final swipe = container.read(viewerSwipePageProvider);

      swipe.value = _openedIndex + 0.6;
      await tester.pump(Durations.short4);
      container.read(assetViewerProvider.notifier).setCurrentIndex(_openedIndex + 1);
      swipe.value = null;
      await tester.pump();
      await tester.pump(Durations.short1);

      swipe.value = _openedIndex + 1.25;
      await tester.pump();
      await tester.pump(Durations.medium2);
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, moreOrLessEquals(27.5));
      expect(tester.getSize(_thumbnailOf(_openedIndex + 2)).width, moreOrLessEquals(22.5));
    });
  });

  group('expanding the centered thumbnail', () {
    testWidgets('it shrinks while scrolling and the newly centered one expands once settled', (tester) async {
      await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, _expandedExtent);
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _extent);

      final gesture = await tester.startGesture(tester.getCenter(find.byType(ViewerFilmstrip)));
      await gesture.moveBy(const Offset(-kDragSlopDefault - 10, 0));
      await tester.pump();
      await gesture.moveBy(const Offset(-23, 0));
      await tester.pump(Durations.medium2);

      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, _extent);
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _extent);

      await tester.pump(Durations.medium2);
      await gesture.up();
      await tester.pumpAndSettle();

      expect(tester.getSize(_thumbnailOf(_openedIndex)).width, _extent);
      expect(tester.getSize(_thumbnailOf(_openedIndex + 1)).width, _expandedExtent);
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 1)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });

    testWidgets('the expanded thumbnail has no border and wider spacing from its neighbours', (tester) async {
      await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      final bordered = find.byWidgetPredicate(
        (widget) =>
            widget is DecoratedBox &&
            widget.decoration is BoxDecoration &&
            (widget.decoration as BoxDecoration).border != null,
      );
      expect(bordered, findsNothing);

      final expanded = tester.getRect(_thumbnailOf(_openedIndex));
      final next = tester.getRect(_thumbnailOf(_openedIndex + 1));
      final previous = tester.getRect(_thumbnailOf(_openedIndex - 1));
      final following = tester.getRect(_thumbnailOf(_openedIndex + 2));
      expect(next.left - expanded.right, moreOrLessEquals(13));
      expect(expanded.left - previous.right, moreOrLessEquals(13));
      expect(following.left - next.right, moreOrLessEquals(3));
    });
  });

  group('actions below the strip', () {
    Widget actions(List<String> taps) => SizedBox(
      key: _actionsKey,
      height: 40,
      child: Center(
        child: TextButton(onPressed: () => taps.add('edit'), child: const Text('edit')),
      ),
    );

    Offset besideTheButtons(WidgetTester tester) => tester.getTopLeft(find.byKey(_actionsKey)) + const Offset(60, 20);

    double actionsOpacity(WidgetTester tester) => tester
        .widgetList<FadeTransition>(find.ancestor(of: find.byKey(_actionsKey), matching: find.byType(FadeTransition)))
        .fold(1.0, (opacity, widget) => opacity * widget.opacity.value);

    testWidgets('they fade out and ignore taps while scrubbing, keeping their space', (tester) async {
      final taps = <String>[];
      await pumpFilmstrip(tester, actions: actions(taps));
      await tester.pumpAndSettle();
      final settled = tester.getRect(find.byKey(_actionsKey));

      final gesture = await tester.startGesture(tester.getCenter(_thumbnailOf(_openedIndex)));
      await gesture.moveBy(const Offset(-kDragSlopDefault - 10, 0));
      await tester.pump();
      await gesture.moveBy(const Offset(-23, 0));
      await tester.pump(Durations.medium2);

      expect(actionsOpacity(tester), 0);
      expect(tester.getRect(find.byKey(_actionsKey)), settled);
      await tester.tapAt(settled.center);
      await tester.pump();
      expect(taps, isEmpty);

      await gesture.up();
      await tester.pumpAndSettle();

      expect(actionsOpacity(tester), 1);
      await tester.tap(find.text('edit'));
      expect(taps, ['edit']);
    });

    testWidgets('while hidden, a drag where they sit keeps scrolling the strip', (tester) async {
      final taps = <String>[];
      final container = await pumpFilmstrip(tester, actions: actions(taps));
      await tester.pumpAndSettle();

      await tester.flingFrom(tester.getCenter(_thumbnailOf(_openedIndex)), const Offset(-60, 0), 800);
      await tester.pump(const Duration(milliseconds: 40));
      final gesture = await tester.startGesture(tester.getCenter(find.text('edit')));
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      final touchedAt = container.read(assetViewerProvider).currentIndex;
      for (var i = 0; i < 12; i++) {
        await gesture.moveBy(const Offset(8, 0));
        await tester.pump(const Duration(milliseconds: 16));
      }
      final draggedTo = container.read(assetViewerProvider).currentIndex;
      await tester.pump(const Duration(milliseconds: 300));
      await gesture.up();
      await tester.pumpAndSettle();

      expect(draggedTo, lessThanOrEqualTo(touchedAt - 3));
      expect(container.read(assetViewerProvider).currentIndex, draggedTo);
      expect(taps, isEmpty);
    });

    testWidgets('while shown, a drag where they sit leaves the strip alone', (tester) async {
      final container = await pumpFilmstrip(tester, actions: actions([]));
      await tester.pumpAndSettle();

      final gesture = await tester.startGesture(besideTheButtons(tester));
      for (var i = 0; i < 12; i++) {
        await gesture.moveBy(const Offset(-8, 0));
        await tester.pump(const Duration(milliseconds: 16));
      }
      await gesture.up();
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex);
    });

    testWidgets('a tap while they fade back in reaches them, not the strip', (tester) async {
      final taps = <String>[];
      final container = await pumpFilmstrip(tester, actions: actions(taps));
      await tester.pumpAndSettle();
      await _scrub(tester, -23 * 2 - kDragSlopDefault, from: tester.getCenter(_thumbnailOf(_openedIndex)));
      final scrubbedTo = container.read(assetViewerProvider).currentIndex;
      expect(actionsOpacity(tester), 0);

      while (actionsOpacity(tester) == 0) {
        await tester.pump(const Duration(milliseconds: 16));
      }
      expect(actionsOpacity(tester), lessThan(1));
      await tester.tapAt(tester.getCenter(find.text('edit')));
      await tester.pumpAndSettle();

      expect(taps, ['edit']);
      expect(container.read(assetViewerProvider).currentIndex, scrubbedTo);
    });

    testWidgets('they stay visible and tappable while swiping the main photo', (tester) async {
      final taps = <String>[];
      final container = await pumpFilmstrip(tester, actions: actions(taps));
      await tester.pumpAndSettle();

      container.read(viewerSwipePageProvider).value = _openedIndex + 0.5;
      await tester.pump(Durations.short4);

      expect(actionsOpacity(tester), 1);
      await tester.tap(find.text('edit'));
      expect(taps, ['edit']);
    });
  });

  group('tapping a thumbnail', () {
    testWidgets('selects it with a selection click and centers it', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      haptics.clear();

      await tester.tapAt(tester.getCenter(_thumbnailOf(_openedIndex + 2)));
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex + 2);
      expect(haptics, ['HapticFeedbackType.selectionClick']);
      expect(tester.getCenter(_thumbnailOf(_openedIndex + 2)).dx, moreOrLessEquals(400 - 1, epsilon: 1));
    });

    testWidgets('a neighbour of the expanded thumbnail selects where it is drawn', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();

      final next = tester.getRect(_thumbnailOf(_openedIndex + 1));
      await tester.tapAt(next.centerRight - const Offset(2, 0));
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex + 1);
    });

    testWidgets('the selected thumbnail does nothing', (tester) async {
      final container = await pumpFilmstrip(tester);
      await tester.pumpAndSettle();
      haptics.clear();

      await tester.tapAt(tester.getCenter(_thumbnailOf(_openedIndex)));
      await tester.pumpAndSettle();

      expect(container.read(assetViewerProvider).currentIndex, _openedIndex);
      expect(haptics, isEmpty);
    });
  });

  group('library changes and loading', () {
    testWidgets('assets added while the strip is open appear without reopening it', (tester) async {
      var library = _assets.take(30).toList();
      final buckets = StreamController<List<Bucket>>();
      addTearDown(buckets.close);
      final timeline = TimelineService((
        assetSource: (offset, count) async => library.skip(offset).take(count).toList(),
        bucketSource: () => buckets.stream,
        origin: TimelineOrigin.main,
      ));
      buckets.add([Bucket(assetCount: library.length)]);
      await pumpFilmstrip(tester, timeline: timeline);
      await tester.pumpAndSettle();
      expect(_thumbnailOf(35), findsNothing);

      library = _assets;
      buckets.add([Bucket(assetCount: library.length)]);
      await tester.pumpAndSettle();

      expect(_thumbnailOf(35), findsOneWidget);
    });

    testWidgets('assets deleted while the strip is open leave no thumbnails past the new end', (tester) async {
      var library = _assets;
      final buckets = StreamController<List<Bucket>>();
      addTearDown(buckets.close);
      final timeline = TimelineService((
        assetSource: (offset, count) async => library.skip(offset).take(count).toList(),
        bucketSource: () => buckets.stream,
        origin: TimelineOrigin.main,
      ));
      buckets.add([Bucket(assetCount: library.length)]);
      await pumpFilmstrip(tester, timeline: timeline);
      await tester.pumpAndSettle();

      library = _assets.take(10).toList();
      buckets.add([Bucket(assetCount: library.length)]);
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(_thumbnailOf(9), findsOneWidget);
      expect(_thumbnailOf(_openedIndex), findsNothing);
    });

    testWidgets('a far jump shows placeholders until its slow load arrives, then the thumbnails', (tester) async {
      final library = List<BaseAsset>.generate(2000, (i) => LocalAssetStub.image1.copyWith(id: 'asset-$i'));
      final farLoad = Completer<void>();
      final timeline = TimelineService((
        assetSource: (offset, count) async {
          if (offset > 0) {
            await farLoad.future;
          }
          return library.skip(offset).take(count).toList();
        },
        bucketSource: () => Stream.value([Bucket(assetCount: library.length)]),
        origin: TimelineOrigin.main,
      ));
      final container = await pumpFilmstrip(tester, timeline: timeline);
      await tester.pumpAndSettle();

      container.read(assetViewerProvider.notifier).setCurrentIndex(1500);
      await tester.pumpAndSettle();
      expect(_thumbnailOf(1500), findsNothing);

      farLoad.complete();
      await tester.pumpAndSettle();

      expect(_thumbnailOf(1500), findsOneWidget);
    });

    testWidgets('a failed load leaves placeholders and the next move loads again', (tester) async {
      final library = List<BaseAsset>.generate(2000, (i) => LocalAssetStub.image1.copyWith(id: 'asset-$i'));
      var failFarLoad = true;
      final timeline = TimelineService((
        assetSource: (offset, count) async {
          if (offset > 0 && failFarLoad) {
            failFarLoad = false;
            throw StateError('database closed');
          }
          return library.skip(offset).take(count).toList();
        },
        bucketSource: () => Stream.value([Bucket(assetCount: library.length)]),
        origin: TimelineOrigin.main,
      ));
      final container = await pumpFilmstrip(tester, timeline: timeline);
      await tester.pumpAndSettle();

      container.read(assetViewerProvider.notifier).setCurrentIndex(1500);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(_thumbnailOf(1500), findsNothing);

      container.read(assetViewerProvider.notifier).setCurrentIndex(1501);
      await tester.pumpAndSettle();

      expect(_thumbnailOf(1501), findsOneWidget);
    }, skip: true);
  });
}
