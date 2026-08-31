import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/slideshow_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/pages/slideshow.page.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_controller.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_slide.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';

import '../../unit/factories/remote_asset_factory.dart';
import '../../unit/presentation/presentation_context.dart';

/// A VideoPlayerNotifier that records play/pause events
class FakeVideoPlayer extends VideoPlayerNotifier {
  /// Every call made against this video, in order
  final calls = <String>[];

  void emit(VideoPlayerState next) => state = next;

  @override
  Future<void> play() async => calls.add('play');

  @override
  Future<void> pause() async => calls.add('pause');
}

const slideDuration = Duration(seconds: 3);

/// A small step to precisely test event timing
const tick = Duration(milliseconds: 1);

List<BaseAsset> images(int count) => List.generate(count, (_) => RemoteAssetFactory.create());

TimelineService timelineOf(List<BaseAsset> assets, {TimelineAssetSource? source}) => TimelineService((
  assetSource: source ?? (index, count) async => assets.sublist(index, math.min(index + count, assets.length)),
  bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
  origin: TimelineOrigin.main,
));

/// A timeline whose last asset is still loading
TimelineService partlyLoaded(List<BaseAsset> assets, {Completer<void>? stall}) {
  var loadCount = 0;

  return timelineOf(
    assets,
    source: (index, count) async {
      loadCount += 1;

      if (loadCount != 1) {
        await stall?.future;
      }

      return assets.sublist(index, math.min(index + count, loadCount == 1 ? assets.length - 1 : assets.length));
    },
  );
}

void main() {
  late PresentationContext ctx;

  setUp(() async => ctx = await PresentationContext.create());

  tearDown(() async => ctx.dispose());

  void slideshowTest(
    String description,
    Future<void> Function(WidgetTester tester) body, {
    TimelineService Function()? timeline,
    SlideshowDirection direction = SlideshowDirection.forward,
    bool repeat = true,
    bool disableAnimations = false,
    List<Override> overrides = const [],
  }) {
    testWidgets(description, (tester) async {
      if (disableAnimations) {
        tester.binding.platformDispatcher.accessibilityFeaturesTestValue = const FakeAccessibilityFeatures(
          disableAnimations: true,
        );
      }

      await tester.pumpTestWidget(
        ctx,
        SlideshowPage(timeline: (timeline ?? () => timelineOf(images(3)))()),
        expectSettle: false,
        overrides: [
          appConfigProvider.overrideWithValue(
            AppConfig(
              slideshow: SlideshowConfig(duration: 3, look: .contain, direction: direction, repeat: repeat),
            ),
          ),
          ...overrides,
        ],
      );

      await tester.pump();

      await body(tester);
    });
  }

  /// The delegate for this page
  SlideshowDelegate delegateOf(WidgetTester tester) =>
      tester.state<ConsumerState<SlideshowPage>>(find.byType(SlideshowPage)) as SlideshowDelegate;

  /// The currently visible slide index
  int visibleIndex(WidgetTester tester) =>
      tester.widgetList<SlideshowSlide>(find.byType(SlideshowSlide)).firstWhere((slide) => slide.isCurrent).index;

  /// The current value of the Ken Burns zoom for a particular slide
  double currentZoomOf(WidgetTester tester, int index) => tester
      .widget<SlideshowSlide>(find.byWidgetPredicate((w) => w is SlideshowSlide && w.index == index && !w.frozen))
      .zoom
      .value;

  double? progressIndicatorProgress(WidgetTester tester) =>
      tester.widget<LinearProgressIndicator>(find.byType(LinearProgressIndicator)).value;

  final fadingSlide = find.byWidgetPredicate((w) => w is SlideshowSlide && w.frozen);

  Future<void> tapScreen(WidgetTester tester) async {
    await tester.tap(find.byType(PageView));

    // The app bar does stuff in post frame, so we need to run twice
    await tester.pump();
    await tester.pump();
  }

  group('basic rendering', () {
    slideshowTest('should show the first slide only', (tester) async {
      expect(visibleIndex(tester), 0);
      expect(fadingSlide, findsNothing);
    });

    slideshowTest('should zoom the slide for its duration', (tester) async {
      expect(currentZoomOf(tester, 0), 0.0);

      await tester.pump(slideDuration * 0.5);
      // 50% through duration we should see 50% of the zoom completed
      expect(currentZoomOf(tester, 0), closeTo(0.5, 0.01));
    });

    slideshowTest('should reverse the zoom direction when moving to the next slide', (tester) async {
      await tester.pump(slideDuration + tick);
      await tester.pump();

      // The previous slide zoomed in, so this one starts zoomed in and will zoom out
      expect(currentZoomOf(tester, 1), closeTo(1.0, 0.01));

      await tester.pump(slideDuration * 0.3);
      expect(currentZoomOf(tester, 1), closeTo(0.7, 0.01));
    });

    slideshowTest('should show the next slide once the duration passes', (tester) async {
      await tester.pump(slideDuration - tick);
      expect(visibleIndex(tester), 0);

      await tester.pump(tick * 2);
      expect(visibleIndex(tester), 1);
    });

    slideshowTest('should fade the outgoing slide over the incoming one', (tester) async {
      await tester.pump(slideDuration + tick);
      await tester.pump();

      // The old slide covers the new one, then is removed
      expect(tester.widget<SlideshowSlide>(fadingSlide).index, 0);
      expect(visibleIndex(tester), 1);

      final fade = find.ancestor(of: fadingSlide, matching: find.byType(FadeTransition)).first;
      expect(tester.widget<FadeTransition>(fade).opacity.value, 1.0);

      await tester.pump(Durations.extralong2 * 0.5);
      expect(tester.widget<FadeTransition>(fade).opacity.value, lessThan(1.0));

      await tester.pump(Durations.extralong2);
      expect(fadingSlide, findsNothing);
    });

    slideshowTest('should not fade when animations are disabled', (tester) async {
      await tester.pump(slideDuration + tick);
      await tester.pump();

      expect(visibleIndex(tester), 1);
      expect(fadingSlide, findsNothing);

      expect(currentZoomOf(tester, 1), 0.0);

      await tester.pump(slideDuration * 0.5);
      expect(currentZoomOf(tester, 1), 0.0);
    }, disableAnimations: true);

    slideshowTest('should show a loading indicator for a slide that isnt ready', (tester) async {
      await tester.drag(find.byType(PageView), const Offset(-800, 0));
      await tester.pump();

      expect(find.byType(ImmichLoadingIndicator), findsOneWidget);
    }, timeline: () => partlyLoaded(images(2), stall: Completer<void>()));
  });

  group('interactions', () {
    slideshowTest('should advance the progress bar', (tester) async {
      expect(progressIndicatorProgress(tester), 0.0);

      await tester.pump(slideDuration * 0.45);
      expect(progressIndicatorProgress(tester), closeTo(0.45, 0.01));
    });

    slideshowTest('should show/hide the AppBar', (tester) async {
      final appBar = find.byType(AnimatedOpacity).first;

      expect(tester.widget<AnimatedOpacity>(appBar).opacity, 0.0);

      await tapScreen(tester);
      expect(tester.widget<AnimatedOpacity>(appBar).opacity, 1.0);

      await tapScreen(tester);
      expect(tester.widget<AnimatedOpacity>(appBar).opacity, 0.0);
    });

    slideshowTest('should stop slide movement and progress bar when paused', (tester) async {
      await tester.pump(slideDuration * 0.5);

      // Show AppBar and pause the app
      await tapScreen(tester);
      await tester.tap(find.byIcon(Icons.pause));
      await tester.pump();

      expect(find.byIcon(Icons.play_arrow), findsOneWidget);

      final held = progressIndicatorProgress(tester);
      await tester.pump(slideDuration);
      expect(progressIndicatorProgress(tester), held);
      expect(visibleIndex(tester), 0);
    });

    slideshowTest('should resume slide from its paused position', (tester) async {
      await tester.pump(slideDuration * 0.64);

      await tapScreen(tester);
      await tester.tap(find.byIcon(Icons.pause));
      await tester.pump();
      await tester.tap(find.byIcon(Icons.play_arrow));

      // Resuming restarts the ticker, so this frame is its new baseline and elapses nothing
      await tester.pump();

      // We should have precisely 36% left before transition
      await tester.pump(slideDuration * 0.36 - tick);
      expect(visibleIndex(tester), 0);

      await tester.pump(tick * 2);
      expect(visibleIndex(tester), 1);
    });

    late Completer<void> arrived;

    slideshowTest('should properly handle an async load the user navigated away from', (tester) async {
      await tester.pump(slideDuration + tick);
      expect(visibleIndex(tester), 1);

      // This slide will get stuck
      await tester.pump(slideDuration + tick);

      // Since the slide is stuck, the user swipes back to the first asset
      await tester.drag(find.byType(PageView), const Offset(800, 0));
      await tester.pump();
      expect(visibleIndex(tester), 0);

      // The stuck slide loads, but it doesn't matter
      arrived.complete();
      await tester.pump();
      await tester.pump();
      expect(visibleIndex(tester), 0);
    }, timeline: () => partlyLoaded(images(3), stall: arrived = Completer<void>()));

    slideshowTest('should start the slide timer when navigating to a new slide', (tester) async {
      await tester.pump(slideDuration * 0.75);

      await tester.drag(find.byType(PageView), const Offset(-800, 0));
      await tester.pump();

      expect(visibleIndex(tester), 1);
      expect(progressIndicatorProgress(tester), 0.0);

      await tester.pump(slideDuration * 0.35);
      expect(progressIndicatorProgress(tester), closeTo(0.35, 0.01));
    });
  });

  group('delegate API', () {
    final video = RemoteAssetFactory.create(type: .video);

    late FakeVideoPlayer player;

    final playing = [videoPlayerProvider(video.id).overrideWith((ref) => player)];

    TimelineService withVideo() => timelineOf([video, ...images(1)]);

    setUp(() => player = FakeVideoPlayer());

    slideshowTest('should wrap past end', (tester) async {
      expect(delegateOf(tester).nextIndexAfter(0), 1);
      expect(delegateOf(tester).nextIndexAfter(2), 0);
    });

    slideshowTest('should wrap past start', (tester) async {
      expect(delegateOf(tester).nextIndexAfter(2), 1);
      expect(delegateOf(tester).nextIndexAfter(0), 2);
    }, direction: .backward);

    slideshowTest('should end the slideshow at the last slide when repeat is disabled', (tester) async {
      expect(delegateOf(tester).nextIndexAfter(1), 2);
      expect(delegateOf(tester).nextIndexAfter(2), null);
    }, repeat: false);

    slideshowTest(
      'should end the slideshow at the first slide when running backwards',
      (tester) async {
        expect(delegateOf(tester).nextIndexAfter(1), 0);
        expect(delegateOf(tester).nextIndexAfter(0), null);
      },
      repeat: false,
      direction: .backward,
    );

    slideshowTest('should end the slideshow when there is nothing to show', (tester) async {
      expect(delegateOf(tester).nextIndexAfter(0), null);
    }, timeline: () => timelineOf(const []));

    slideshowTest(
      'should provide video playback position, but not image positions',
      (tester) async {
        player.emit(const VideoPlayerState(position: Duration(seconds: 2), duration: .zero, status: .playing));

        expect(delegateOf(tester).videoProgressOf(0), const Duration(seconds: 2));
        expect(delegateOf(tester).videoProgressOf(1), null);
      },
      timeline: withVideo,
      overrides: playing,
    );

    slideshowTest(
      'should report when videos complete',
      (tester) async {
        expect(delegateOf(tester).isVideoCompleted(0), false);

        player.emit(const VideoPlayerState(position: Duration(seconds: 2), duration: .zero, status: .completed));
        expect(delegateOf(tester).isVideoCompleted(0), true);
        expect(delegateOf(tester).isVideoCompleted(1), false);
      },
      timeline: withVideo,
      overrides: playing,
    );

    slideshowTest(
      'should pause and play the video along with the slideshow',
      (tester) async {
        delegateOf(tester).onPlaybackChanged(0, false);
        delegateOf(tester).onPlaybackChanged(0, true);
        expect(player.calls, ['pause', 'play']);

        // An image does nothing here
        delegateOf(tester).onPlaybackChanged(1, true);
        expect(player.calls, ['pause', 'play']);
      },
      timeline: withVideo,
      overrides: playing,
    );
  });
}
