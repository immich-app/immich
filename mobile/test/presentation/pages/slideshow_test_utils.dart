import 'dart:async';
import 'dart:math' as math;

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/presentation/pages/drift_slideshow.page.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/services/gcast.service.dart';

class StubAssetService implements AssetService {
  const StubAssetService();

  @override
  Future<BaseAsset?> getAsset(BaseAsset asset) async => asset;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class StubGCastService implements GCastService {
  @override
  void Function(bool)? onConnectionState;

  @override
  void Function(Duration)? onCurrentTime;

  @override
  void Function(Duration)? onDuration;

  @override
  void Function(String)? onReceiverName;

  @override
  void Function(CastState)? onCastState;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeVideoPlayerNotifier extends VideoPlayerNotifier {
  FakeVideoPlayerNotifier(VideoPlayerState initial) {
    state = initial;
    latest = this;
  }

  // the provider is autoDispose: page churn disposes and recreates it, so the
  // override hands out a fresh notifier each time and this tracks the live one
  static FakeVideoPlayerNotifier? latest;

  // a restart can land on an instance that later churn disposes; count globally
  static int restartCalls = 0;

  static void reset() {
    latest = null;
    restartCalls = 0;
  }

  // the real restart() no-ops without a controller (seekTo early-returns); this
  // mirrors what it does with one attached: a synchronous reset then playing
  @override
  Future<void> restart() async {
    restartCalls++;
    state = state.copyWith(position: Duration.zero, status: VideoPlaybackStatus.playing);
  }

  void emit(VideoPlayerState next) => state = next;
}

class SeededAssetViewerNotifier extends AssetViewerStateNotifier {
  SeededAssetViewerNotifier(this._asset);

  final BaseAsset _asset;

  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: _asset);
  }
}

// reports everything from index 2 on as not loaded and parks its preload behind
// the gate, so a test can hold an advance mid-preload without a giant timeline
class GatedTimelineService extends TimelineService {
  GatedTimelineService(super.query);

  final Completer<void> gate = Completer<void>();

  @override
  bool hasRange(int index, int count) => index < 2 && super.hasRange(index, count);

  @override
  Future<void> preloadAssets(int index) => index < 2 ? super.preloadAssets(index) : gate.future;
}

final kImage1 = LocalAsset(
  id: 'image1',
  name: 'image1.jpg',
  type: AssetType.image,
  createdAt: DateTime(2025),
  updatedAt: DateTime(2025, 2),
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

final kImage2 = LocalAsset(
  id: 'image2',
  name: 'image2.jpg',
  type: AssetType.image,
  createdAt: DateTime(2025, 5),
  updatedAt: DateTime(2025, 6),
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

final kVideo = LocalAsset(
  id: 'video1',
  name: 'video1.mp4',
  type: AssetType.video,
  createdAt: DateTime(2025, 3),
  updatedAt: DateTime(2025, 4),
  playbackStyle: AssetPlaybackStyle.video,
  durationMs: 30000,
  width: 1920,
  height: 1080,
  isEdited: false,
);

LocalAsset imageAsset(String id) => LocalAsset(
  id: id,
  name: '$id.jpg',
  type: AssetType.image,
  createdAt: DateTime(2025),
  updatedAt: DateTime(2025, 2),
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

const kVideoDuration = Duration(seconds: 30);
const kPlaying = VideoPlayerState(
  position: Duration.zero,
  duration: kVideoDuration,
  status: VideoPlaybackStatus.playing,
);
const kBuffering = VideoPlayerState(
  position: Duration.zero,
  duration: kVideoDuration,
  status: VideoPlaybackStatus.buffering,
);

TimelineService stubTimeline(List<BaseAsset> assets) => TimelineService((
  assetSource: (index, count) async => assets.sublist(index, math.min(index + count, assets.length)),
  bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
  origin: TimelineOrigin.main,
));

void mockSlideshowChannels(TestDefaultBinaryMessenger messenger) {
  const codec = StandardMessageCodec();
  messenger.setMockMessageHandler(
    'dev.flutter.pigeon.wakelock_plus_platform_interface.WakelockPlusApi.toggle',
    (message) async => codec.encodeMessage([null]),
  );
  // the binding never answers SystemChrome.setEnabledSystemUIMode, without
  // this the slideshow's app bar toggle hangs and its buttons stay untappable
  messenger.setMockMethodCallHandler(SystemChannels.platform, (call) async => null);
}

double? currentPage(WidgetTester tester) => tester.widget<PageView>(find.byType(PageView)).controller?.page;

final swallowedErrors = <Object>[];

bool _isExpectedImageError(Object error) =>
    error.toString().contains('Null check operator used on a null value') ||
    (error is PlatformException && error.toString().contains('ImageApi'));

// Image providers cannot resolve in the test environment (no platform channels,
// no HTTP). Only their known failures may be drained; anything else fails loudly.
void drainImageErrors(WidgetTester tester) {
  for (var i = 0; i < 200; i++) {
    final error = tester.takeException();
    if (error == null) {
      return;
    }
    if (!_isExpectedImageError(error)) {
      fail('unexpected framework exception: $error');
    }
    swallowedErrors.add(error);
  }
}

Future<void> elapse(WidgetTester tester, Duration duration) async {
  await tester.pump(duration);
  await tester.pump();
  drainImageErrors(tester);
}

Future<ProviderContainer> pumpSlideshow(
  WidgetTester tester, {
  required List<BaseAsset> assets,
  VideoPlayerState? initialPlayerState,
  AppConfig config = const AppConfig(),
  TimelineService? timeline,
  BaseAsset? startAsset,
}) async {
  final effectiveTimeline = timeline ?? stubTimeline(assets);

  // the bucket stream delivers on the fake-async timer queue, so pump until the
  // initial asset batch has loaded before the page reads totalAssets
  var attempts = 0;
  while (effectiveTimeline.totalAssets != assets.length && attempts < 20) {
    attempts++;
    await tester.pump();
  }
  if (effectiveTimeline.totalAssets != assets.length) {
    fail('timeline did not load: totalAssets=${effectiveTimeline.totalAssets}');
  }

  final container = ProviderContainer(
    overrides: [
      appConfigProvider.overrideWithValue(config),
      assetServiceProvider.overrideWithValue(const StubAssetService()),
      gCastServiceProvider.overrideWithValue(StubGCastService()),
      if (startAsset != null) assetViewerProvider.overrideWith(() => SeededAssetViewerNotifier(startAsset)),
      if (initialPlayerState != null)
        videoPlayerProvider.overrideWith((_, _) => FakeVideoPlayerNotifier(initialPlayerState)),
    ],
  );
  addTearDown(container.dispose);
  addTearDown(() => tester.pumpWidget(const SizedBox.shrink()));

  await tester.pumpWidget(
    EasyLocalization(
      supportedLocales: locales.values.toList(),
      path: translationsPath,
      startLocale: locales.values.first,
      fallbackLocale: locales.values.first,
      saveLocale: false,
      useFallbackTranslations: true,
      assetLoader: const CodegenLoader(),
      child: UncontrolledProviderScope(
        container: container,
        child: Builder(
          builder: (context) => MaterialApp(
            debugShowCheckedModeBanner: false,
            localizationsDelegates: context.localizationDelegates,
            supportedLocales: context.supportedLocales,
            locale: context.locale,
            home: DriftSlideshowPage(timeline: effectiveTimeline),
          ),
        ),
      ),
    ),
  );
  await tester.pump();
  drainImageErrors(tester);
  return container;
}

Future<void> advanceToVideoSlide(WidgetTester tester) async {
  // first slide is an image shown for the configured 5 seconds
  await elapse(tester, const Duration(seconds: 6));
  expect(currentPage(tester), 1.0, reason: 'the slideshow should have advanced onto the video slide');
}
