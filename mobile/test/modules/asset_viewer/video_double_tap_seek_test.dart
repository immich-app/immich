import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_double_tap_seek.dart';

import '../../test_utils.dart';

void main() {
  TestUtils.init();

  group('resolveVideoDoubleTapSeekDirection', () {
    test('returns backward for taps on the left side', () {
      final direction = resolveVideoDoubleTapSeekDirection(tapX: 40, viewportWidth: 400);
      expect(direction, VideoDoubleTapSeekDirection.backward);
    });

    test('returns forward for taps on the right side', () {
      final direction = resolveVideoDoubleTapSeekDirection(tapX: 360, viewportWidth: 400);
      expect(direction, VideoDoubleTapSeekDirection.forward);
    });

    test('returns null for taps inside the center dead zone', () {
      final direction = resolveVideoDoubleTapSeekDirection(tapX: 200, viewportWidth: 400);
      expect(direction, isNull);
    });
  });

  group('videoDoubleTapSeekIndicatorProvider', () {
    const playerId = 'video-1';

    test('accumulates repeated taps in the same direction', () {
      final container = TestUtils.createContainer();
      final notifier = container.read(videoDoubleTapSeekIndicatorProvider(playerId).notifier);

      notifier.show(VideoDoubleTapSeekDirection.forward, const Duration(seconds: 10));
      notifier.show(VideoDoubleTapSeekDirection.forward, const Duration(seconds: 10));

      final state = container.read(videoDoubleTapSeekIndicatorProvider(playerId));
      expect(state?.direction, VideoDoubleTapSeekDirection.forward);
      expect(state?.total, const Duration(seconds: 20));
    });

    test('resets the total when direction changes', () {
      final container = TestUtils.createContainer();
      final notifier = container.read(videoDoubleTapSeekIndicatorProvider(playerId).notifier);

      notifier.show(VideoDoubleTapSeekDirection.forward, const Duration(seconds: 10));
      notifier.show(VideoDoubleTapSeekDirection.backward, const Duration(seconds: 10));

      final state = container.read(videoDoubleTapSeekIndicatorProvider(playerId));
      expect(state?.direction, VideoDoubleTapSeekDirection.backward);
      expect(state?.total, const Duration(seconds: 10));
    });

    test('clears the indicator after the overlay timeout', () async {
      final container = TestUtils.createContainer();
      final notifier = container.read(videoDoubleTapSeekIndicatorProvider(playerId).notifier);

      notifier.show(VideoDoubleTapSeekDirection.forward, const Duration(seconds: 10));
      expect(container.read(videoDoubleTapSeekIndicatorProvider(playerId)), isNotNull);

      await Future.delayed(const Duration(milliseconds: 950));

      expect(container.read(videoDoubleTapSeekIndicatorProvider(playerId)), isNull);
    });
  });
}
