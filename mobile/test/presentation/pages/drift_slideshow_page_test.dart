import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/pages/drift_slideshow.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/asset.stub.dart';
import 'slideshow_test_utils.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  setUp(() {
    const codec = StandardMessageCodec();
    messenger.setMockMessageHandler(
      'dev.flutter.pigeon.wakelock_plus_platform_interface.WakelockPlusApi.toggle',
      (message) async => codec.encodeMessage([null]),
    );
    // the binding never answers SystemChrome.setEnabledSystemUIMode, without
    // this the slideshow's app bar toggle hangs and its buttons stay untappable
    messenger.setMockMethodCallHandler(SystemChannels.platform, (call) async => null);
    registerFallbackValue(LocalAssetStub.image1);
    FakeVideoPlayerNotifier.reset();
  });

  testWidgets('a never-ready video advances after one slide duration', (tester) async {
    // no player override: the source cannot be created in this environment, so
    // the video stays at the default (never ready) state forever
    await pumpSlideshow(tester, assets: [kVideo, LocalAssetStub.image1]);
    expect(currentPage(tester), 0.0);

    await elapse(tester, const Duration(seconds: 4));
    expect(currentPage(tester), 0.0, reason: 'the bound has not run out yet');

    await elapse(tester, const Duration(seconds: 2));
    expect(currentPage(tester), 1.0, reason: 'one full duration with no playback progress advances');
  });

  testWidgets('a progressing video is not skipped, and a later stall advances', (tester) async {
    await pumpSlideshow(
      tester,
      assets: [LocalAssetStub.image1, kVideo, LocalAssetStub.image2],
      initialPlayerState: kBuffering,
    );
    await advanceToVideoSlide(tester);

    for (var seconds = 1; seconds <= 8; seconds++) {
      FakeVideoPlayerNotifier.latest!.emit(
        VideoPlayerState(
          position: Duration(seconds: seconds),
          duration: kVideoDuration,
          status: VideoPlaybackStatus.playing,
        ),
      );
      await elapse(tester, const Duration(seconds: 2));
      expect(currentPage(tester), 1.0, reason: 'a video still making progress at ${seconds}s must not be skipped');
    }

    // the position freezes for good: one full bound after the last re-arm the show moves on
    await elapse(tester, const Duration(seconds: 9));
    expect(currentPage(tester), 2.0, reason: 'a full bound of no progress must advance');
  });

  testWidgets('the ended callback advances once and a late repeat is ignored', (tester) async {
    await pumpSlideshow(
      tester,
      assets: [LocalAssetStub.image1, kVideo, LocalAssetStub.image2],
      initialPlayerState: kPlaying,
    );
    await advanceToVideoSlide(tester);

    final viewer = tester.widget<NativeVideoViewer>(find.byType(NativeVideoViewer));
    viewer.onPlaybackEnded!(kVideo.heroTag);
    await tester.pump();
    expect(currentPage(tester), 2.0, reason: 'a real playback end advances to the next slide');

    // a late duplicate from the same player no longer matches the current slide
    viewer.onPlaybackEnded!(kVideo.heroTag);
    await elapse(tester, const Duration(seconds: 1));
    expect(currentPage(tester), 2.0, reason: 'the stale ended event must not advance again');
  });

  testWidgets('a single ended video restarts and stays armed on repeat', (tester) async {
    await pumpSlideshow(tester, assets: [kVideo], initialPlayerState: kPlaying);
    expect(currentPage(tester), 0.0);

    tester.widget<NativeVideoViewer>(find.byType(NativeVideoViewer)).onPlaybackEnded!(kVideo.heroTag);
    await tester.pump();
    expect(FakeVideoPlayerNotifier.restartCalls, 1, reason: 'repeat replays the ended video in place');
    expect(currentPage(tester), 0.0);

    // the re-armed watchdog settles the frozen frame without a second restart
    await elapse(tester, const Duration(seconds: 6));
    expect(FakeVideoPlayerNotifier.restartCalls, 1);
    expect(currentPage(tester), 0.0);

    await tester.tap(find.byType(DriftSlideshowPage));
    await tester.pump();
    await tester.pump();
    expect(find.byIcon(Icons.pause), findsOneWidget, reason: 'the show keeps running after the in-place restart');
  });
}
