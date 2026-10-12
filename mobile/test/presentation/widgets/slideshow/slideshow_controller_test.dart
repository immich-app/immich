import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/slideshow/slideshow_controller.dart';

const slideDuration = Duration(seconds: 5);
const tick = Duration(milliseconds: 1);

class FakeSlideshow implements SlideshowDelegate {
  FakeSlideshow({this.nextIndex = _nextInOrder}) {
    controller = SlideshowController(
      vsync: const TestVSync(),
      slideDuration: slideDuration,
      initialIndex: 0,
      delegate: this,
    );
  }

  static int? _nextInOrder(int index) => index + 1;

  int? Function(int index) nextIndex;

  /// Video slide index -> playback position. Image slides do not appear in this map at all
  final videos = <int, Duration>{};
  final completedVideos = <int>{};

  /// Test action log
  final events = <String>[];

  late final SlideshowController controller;

  @override
  int? nextIndexAfter(int index) => nextIndex(index);

  @override
  Duration? videoProgressOf(int index) => videos[index];

  @override
  bool isVideoCompleted(int index) => completedVideos.contains(index);

  @override
  void onPlaybackChanged(int index, bool playing) => events.add(playing ? 'play' : 'pause');

  @override
  void onShowSlide(int index, int prevIndex) {
    events.add('show $index');

    controller.didCompleteShowSlide(index);
  }
}

/// Runs [body] against a freshly started slideshow
void slideshowTest(
  String description,
  Future<void> Function(WidgetTester tester, FakeSlideshow show) body, {
  int? Function(int index)? nextIndex,
}) {
  testWidgets(description, (tester) async {
    final show = FakeSlideshow(nextIndex: nextIndex ?? FakeSlideshow._nextInOrder);

    // Go to first slide
    show.controller.goToNextSlide();

    // The slideshow's ticker takes its baseline on this frame, so a test can jump the clock straight away
    await tester.pump();

    try {
      await body(tester, show);
    } finally {
      // The slideshow ticks forever. All tests must stop it, otherwise it will leak into subsequent tests
      // This cannot appear in tearDown due to invariants being called outside of "render"
      show.controller.dispose();
    }
  });
}

void main() {
  slideshowTest('should advance once the slide duration passes', (tester, show) async {
    await tester.pump(slideDuration - tick);
    expect(show.events, ['show 0']);

    await tester.pump(tick * 2);
    expect(show.events, ['show 0', 'show 1']);
  });

  slideshowTest('should show the slide the delegate provides next', (tester, show) async {
    await tester.pump(slideDuration + tick);

    expect(show.events, ['show 0', 'show 7']);
  }, nextIndex: (_) => 7);

  slideshowTest('should pause when there is no next slide', (tester, show) async {
    await tester.pump(slideDuration + tick);

    expect(show.events, ['show 0']);
    expect(show.controller.paused, isTrue);
  }, nextIndex: (_) => null);

  slideshowTest('should stop the clock when paused', (tester, show) async {
    show.controller.pause();

    expect(show.events, ['show 0', 'pause']);

    await tester.pump(slideDuration * 2);

    expect(show.events, ['show 0', 'pause']);
  });

  slideshowTest('should continue the current slide when resumed', (tester, show) async {
    await tester.pump(slideDuration * 0.75);

    show.controller.pause();
    show.controller.resume();

    // Resuming restarts the ticker, so this frame is its new baseline and elapses nothing
    await tester.pump();

    // A quarter of the slide is left
    await tester.pump(slideDuration * 0.25 - tick);
    expect(show.events, ['show 0', 'pause', 'play']);

    await tester.pump(tick * 2);
    expect(show.events, ['show 0', 'pause', 'play', 'show 1']);
  });

  slideshowTest('should not watchdog modify a video that is successfully playing back', (tester, show) async {
    show.videos[0] = Duration.zero;

    for (var i = 1; i <= 3; i++) {
      // Simulate progress
      show.videos[0] = slideDuration * i;

      await tester.pump(slideDuration + tick);
    }

    expect(show.events, ['show 0']);
  });

  slideshowTest('should advance past a stalled video once the slide duration passes', (tester, show) async {
    show.videos[0] = Duration.zero;

    await tester.pump(slideDuration - tick);
    expect(show.events, ['show 0']);

    await tester.pump(tick * 2);
    expect(show.events, ['show 0', 'show 1']);
  });

  slideshowTest('should advance immediately when a video ends', (tester, show) async {
    show.videos[0] = Duration.zero;

    show.controller.didCompleteVideo();

    expect(show.events, ['show 0', 'show 1']);
  });

  slideshowTest('should not move when a video ends while paused', (tester, show) async {
    show.videos[0] = Duration.zero;
    show.controller.pause();

    show.controller.didCompleteVideo();

    expect(show.events, ['show 0', 'pause']);
  });

  slideshowTest('should move to next slide when a finished video is resumed', (tester, show) async {
    show.videos[0] = Duration.zero;
    show.controller.pause();
    show.completedVideos.add(0);

    expect(show.events, ['show 0', 'pause']);

    show.controller.resume();

    expect(show.events, ['show 0', 'pause', 'show 1']);
  });

  slideshowTest('should restart the timer on manual navigation to another slide', (tester, show) async {
    await tester.pump(slideDuration * 0.60);

    // Widget informs us of a slide change
    show.controller.didCompleteShowSlide(2);

    // A new slide restarts the ticker, so this frame is its new baseline and elapses nothing
    await tester.pump();

    // The new slide gets a full slide duration
    await tester.pump(slideDuration - tick);
    expect(show.events, ['show 0']);

    await tester.pump(tick * 2);
    expect(show.events, ['show 0', 'show 3']);
  });

  slideshowTest('should pick up a new next slide when recalculating', (tester, show) async {
    expect(show.controller.currentIndex, 0);
    expect(show.controller.nextIndex, 1);

    show.nextIndex = (_) => 7;
    show.controller.recalculateNextIndex();

    expect(show.controller.nextIndex, 7);
  });
}
