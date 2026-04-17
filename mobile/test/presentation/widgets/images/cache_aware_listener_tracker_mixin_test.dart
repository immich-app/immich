import 'dart:ui' as ui;

import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/images/cache_aware_listener_tracker.mixin.dart';

class TestImageCompleter extends ImageStreamCompleter with CacheAwareListenerTrackerMixin {
  bool wasCancelled = false;

  TestImageCompleter({required bool hadInitialImage}) {
    setupListenerTracking(
      hadInitialImage: hadInitialImage,
      onLastListenerRemoved: () {
        wasCancelled = true;
      },
    );
  }

  @override
  void setImage(ImageInfo image) {
    super.setImage(image);
  }
}

void main() {
  late ImageCache cache;
  late ImageStreamListener uiListener;

  setUp(() {
    // Create a fresh, real Flutter ImageCache for every test
    cache = ImageCache();
    uiListener = ImageStreamListener((_, __) {});
  });

  group('CacheAwareListenerTrackerMixin with Real ImageCache', () {

    testWidgets('cancels fetch when UI detaches before completion', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      // 1. Request image from the real cache (simulating the provider)
      final stream = cache.putIfAbsent(key, () => completer)!;

      // 2. UI attaches
      stream.addListener(uiListener);
      expect(completer.wasCancelled, isFalse);

      // 3. Simulate asynchronous network delay...
      await tester.pump(const Duration(milliseconds: 150));

      // 4. User scrolls away before network finishes. UI detaches.
      stream.removeListener(uiListener);

      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('survives cache eviction while UI listener is still attached', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      // 1. Request image and attach UI
      final stream = cache.putIfAbsent(key, () => completer)!;
      stream.addListener(uiListener);

      // 2. Simulate app going to background -> OS Memory Warning -> Cache clears
      cache.clear();

      // Even though the real cache just aggressively detached its listener,
      // the stream MUST survive because the UI widget is still on screen!
      expect(completer.wasCancelled, isFalse);

      // 3. UI widget finally detaches
      stream.removeListener(uiListener);
      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('survives synchronous cache detach during putIfAbsent with initialImage', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: true);
      final key = Object();

      // Run image creation outside FakeAsync zone to avoid hang
      late ui.Image dummyImage;
      await tester.runAsync(() async {
        dummyImage = await createTestImage(width: 1, height: 1);
      });

      final initialImageInfo = ImageInfo(image: dummyImage);

      final stream = cache.putIfAbsent(key, () {
        completer.setImage(initialImageInfo);
        return completer;
      })!;

      expect(completer.wasCancelled, isFalse);

      stream.addListener(uiListener);
      expect(completer.wasCancelled, isFalse);

      stream.removeListener(uiListener);
      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('fires cleanup on full abandonment even after successful fetch', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      final stream = cache.putIfAbsent(key, () => completer)!;
      stream.addListener(uiListener);

      await tester.pump(const Duration(milliseconds: 100));

      // Run image creation outside FakeAsync zone to avoid hang
      late ui.Image dummyImage;
      await tester.runAsync(() async {
        dummyImage = await createTestImage(width: 1, height: 1);
      });

      completer.setImage(ImageInfo(image: dummyImage));

      stream.removeListener(uiListener);

      // The stream is completely abandoned (0 listeners), so it fires the cleanup hook.
      // Since the image is already downloaded, canceling the network token is a safe no-op.
      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('Multiple UI listeners — only all detached, should cancel', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      final stream = cache.putIfAbsent(key, () => completer)!;

      final uiListener2 = ImageStreamListener((_, __) {});
      stream.addListener(uiListener);
      stream.addListener(uiListener2);

      // First UI detach leaves cache + one UI → no cancel
      stream.removeListener(uiListener);
      expect(completer.wasCancelled, isFalse);

      // Second UI detach leaves only cache → cancel
      stream.removeListener(uiListener2);
      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('Listener misidentification: new listener after cache eviction is not treated as cache', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      final stream = cache.putIfAbsent(key, () => completer)!;

      // UI attaches
      stream.addListener(uiListener);

      // Cache eviction removes the cache listener
      cache.clear();
      expect(completer.wasCancelled, isFalse);

      // A second UI listener attaches — must NOT be treated as cache
      final uiListener2 = ImageStreamListener((_, __) {});
      stream.addListener(uiListener2);

      // Remove first UI listener; second UI still active → no cancel
      stream.removeListener(uiListener);
      expect(completer.wasCancelled, isFalse);

      // Remove second UI listener; completely abandoned → cancel
      stream.removeListener(uiListener2);
      expect(completer.wasCancelled, isTrue);
    });

    testWidgets('No UI listener ever attaches (cache-only) — cache detaches should cancel', (WidgetTester tester) async {
      final completer = TestImageCompleter(hadInitialImage: false);
      final key = Object();

      cache.putIfAbsent(key, () => completer);

      // Cache eviction removes the only listener
      cache.clear();
      expect(completer.wasCancelled, isTrue);
    });
  });
}
