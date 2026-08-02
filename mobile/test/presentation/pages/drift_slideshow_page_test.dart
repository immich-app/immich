import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/pages/drift_slideshow.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';

import 'slideshow_test_utils.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  setUp(() {
    mockSlideshowChannels(messenger);
    swallowedErrors.clear();
    FakeVideoPlayerNotifier.reset();
  });

  testWidgets('a never-ready video advances, and resume after backgrounding gets a fresh bound', (tester) async {
    addTearDown(() => tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed));

    // no player override: the source cannot be created in this environment, so
    // the video stays at the default (never ready) state forever
    await pumpSlideshow(tester, assets: [kVideo, kImage1]);
    expect(currentPage(tester), 0.0);

    await elapse(tester, const Duration(seconds: 1));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);

    await elapse(tester, const Duration(seconds: 8));
    expect(currentPage(tester), 0.0, reason: 'no advance while the app is backgrounded');

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await elapse(tester, const Duration(seconds: 2));
    expect(currentPage(tester), 0.0, reason: 'resume starts a fresh full bound');

    await elapse(tester, const Duration(seconds: 4));
    expect(currentPage(tester), 1.0, reason: 'the fresh bound fires one full duration after resume');
  });

  testWidgets('a progressing video is not skipped, and a later stall advances', (tester) async {
    await pumpSlideshow(tester, assets: [kImage1, kVideo, kImage2], initialPlayerState: kBuffering);
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
    await pumpSlideshow(tester, assets: [kImage1, kVideo, kImage2], initialPlayerState: kPlaying);
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

  testWidgets('a video that ended restarts when it becomes current again', (tester) async {
    await pumpSlideshow(tester, assets: [kVideo, kImage1], initialPlayerState: kPlaying);
    expect(currentPage(tester), 0.0);

    tester.widget<NativeVideoViewer>(find.byType(NativeVideoViewer)).onPlaybackEnded!(kVideo.heroTag);
    await tester.pump();
    expect(currentPage(tester), 1.0, reason: 'the ended video advances');

    tester.widget<PageView>(find.byType(PageView)).controller!.jumpToPage(0);
    await tester.pump();
    await tester.pump();
    expect(FakeVideoPlayerNotifier.restartCalls, 1, reason: 'swiping back to the ended video replays it');
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

  testWidgets('a gated preload cannot overwrite a manual swipe', (tester) async {
    final assets = [imageAsset('img0'), imageAsset('img1'), imageAsset('img2'), imageAsset('img3')];
    final timeline = GatedTimelineService((
      assetSource: (index, count) async => assets.sublist(index, math.min(index + count, assets.length)),
      bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
      origin: TimelineOrigin.main,
    ));

    await pumpSlideshow(tester, assets: assets, timeline: timeline, startAsset: assets[1]);
    expect(currentPage(tester), 1.0);

    // the image bound fires; advancing onto the "unloaded" slide 2 parks on the gate
    await elapse(tester, const Duration(seconds: 6));
    expect(currentPage(tester), 1.0, reason: 'the advance parks behind the gated preload');

    // a swipe settles the show on the first slide while the preload is pending
    tester.widget<PageView>(find.byType(PageView)).controller!.jumpToPage(0);
    await tester.pump();
    expect(currentPage(tester), 0.0);

    timeline.gate.complete();
    await tester.pump();
    await tester.pump();
    expect(currentPage(tester), 0.0, reason: 'the stale advance must not clobber the slide the swipe settled on');

    await elapse(tester, const Duration(seconds: 6));
    expect(currentPage(tester), 1.0, reason: 'the show keeps running from the settled slide');
  });
}
