import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/config/slideshow_config.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/pages/drift_slideshow.page.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../../unit/factories/remote_asset_factory.dart';
import '../../widget_tester_extensions.dart';

class MockTimelineService extends Mock implements TimelineService {}

class FakeVideoPlayerNotifier extends VideoPlayerNotifier {
  final loopCalls = <bool>[];
  var restartCalls = 0;

  void emit(VideoPlayerState next) => state = next;

  @override
  Future<void> setLoop(bool loop) async => loopCalls.add(loop);

  @override
  Future<void> restart() async => restartCalls++;
}

void main() {
  const config = AppConfig(slideshow: SlideshowConfig(duration: 3, look: SlideshowLook.contain));
  const duration = Duration(seconds: 3);

  late MockTimelineService timeline;
  late MockAssetService assetService;
  late FakeVideoPlayerNotifier player;

  setUpAll(() async {
    registerFallbackValue(RemoteAssetFactory.create());
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'http://localhost:3000');
  });

  setUp(() {
    timeline = MockTimelineService();
    assetService = MockAssetService();
    player = FakeVideoPlayerNotifier();
    when(() => assetService.getAsset(any())).thenAnswer((_) async => null);

    // Pigeon success replies with a null payload: images and wakelock toggles resolve to nothing.
    Future<ByteData?> nullReply(ByteData? message) async => const StandardMessageCodec().encodeMessage(<Object?>[null]);
    final messenger = TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    messenger.setMockMessageHandler(
      'dev.flutter.pigeon.wakelock_plus_platform_interface.WakelockPlusApi.toggle',
      nullReply,
    );
    messenger.setMockMessageHandler('dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage', nullReply);
    messenger.setMockMessageHandler('dev.flutter.pigeon.immich_mobile.RemoteImageApi.cancelRequest', nullReply);
    messenger.setMockMethodCallHandler(
      SystemChannels.platform_views,
      (call) async => switch (call.method) {
        'create' => 1,
        'resize' => <String, Object?>{'width': 1080.0, 'height': 1920.0},
        _ => null,
      },
    );
  });

  void stubTimeline(List<BaseAsset> assets) {
    when(() => timeline.totalAssets).thenReturn(assets.length);
    when(() => timeline.hasRange(any(), any())).thenReturn(true);
    when(() => timeline.preloadAssets(any())).thenAnswer((_) async {});
    when(() => timeline.getAssetSafe(any())).thenAnswer((invocation) {
      final index = invocation.positionalArguments.first as int;
      return index >= 0 && index < assets.length ? assets[index] : null;
    });
  }

  // The page never settles while running (progress bar / spinner animations), so
  // mount it with a plain pump after the localized shell settled around a placeholder.
  Future<void> pumpSlideshow(WidgetTester tester, {required List<Override> overrides}) async {
    final show = ValueNotifier(false);
    await tester.pumpConsumerWidget(
      ValueListenableBuilder<bool>(
        valueListenable: show,
        builder: (context, value, _) => !value
            ? const SizedBox.shrink()
            : MediaQuery(
                data: MediaQuery.of(context).copyWith(disableAnimations: true),
                child: DriftSlideshowPage(timeline: timeline),
              ),
      ),
      overrides: overrides,
    );
    show.value = true;
    await tester.pump();
  }

  double currentPage(WidgetTester tester) => tester.widget<PageView>(find.byType(PageView)).controller!.page!;

  List<Override> overridesFor(RemoteAsset video) => [
    appConfigProvider.overrideWithValue(config),
    assetServiceProvider.overrideWithValue(assetService),
    gCastServiceProvider.overrideWithValue(MockGCastService()),
    videoPlayerProvider(video.id).overrideWith((ref) => player),
  ];

  testWidgets('video that never starts advances after one duration', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([RemoteAssetFactory.create(), video, RemoteAssetFactory.create()]);

    await pumpSlideshow(tester, overrides: overridesFor(video));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    player.emit(const VideoPlayerState(position: Duration.zero, duration: Duration.zero, status: .buffering));
    await tester.pump(duration);
    expect(currentPage(tester), 2);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('completed at position zero does not skip the video', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([RemoteAssetFactory.create(), video, RemoteAssetFactory.create()]);

    await pumpSlideshow(tester, overrides: overridesFor(video));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    player.emit(const VideoPlayerState(position: Duration.zero, duration: Duration(seconds: 60), status: .completed));
    await tester.pump();
    expect(currentPage(tester), 1);
    expect(player.restartCalls, 0);

    await tester.pump(duration);
    expect(currentPage(tester), 2);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('playing video is not cut short and advances when it ends', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([RemoteAssetFactory.create(), video, RemoteAssetFactory.create()]);

    await pumpSlideshow(tester, overrides: overridesFor(video));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    const length = Duration(seconds: 60);
    player.emit(const VideoPlayerState(position: Duration(milliseconds: 500), duration: length, status: .playing));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    player.emit(const VideoPlayerState(position: Duration(seconds: 2), duration: length, status: .playing));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    player.emit(const VideoPlayerState(position: length, duration: length, status: .completed));
    await tester.pump();
    expect(currentPage(tester), 2);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('disables video looping once playback starts', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([RemoteAssetFactory.create(), video]);

    await pumpSlideshow(tester, overrides: overridesFor(video));
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    player.emit(const VideoPlayerState(position: Duration.zero, duration: Duration(seconds: 60), status: .playing));
    await tester.pump();
    expect(player.loopCalls, [false]);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('disables looping for a video already playing at entry', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([RemoteAssetFactory.create(), video]);

    player.emit(const VideoPlayerState(position: Duration.zero, duration: Duration(seconds: 60), status: .playing));
    await pumpSlideshow(tester, overrides: overridesFor(video));
    await tester.pump(duration);
    expect(currentPage(tester), 1);
    expect(player.loopCalls, [false]);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('stops on the last slide when repeat is off', (tester) async {
    const noRepeat = AppConfig(slideshow: SlideshowConfig(duration: 3, look: SlideshowLook.contain, repeat: false));
    stubTimeline([RemoteAssetFactory.create(), RemoteAssetFactory.create()]);

    await pumpSlideshow(
      tester,
      overrides: [
        appConfigProvider.overrideWithValue(noRepeat),
        assetServiceProvider.overrideWithValue(assetService),
        gCastServiceProvider.overrideWithValue(MockGCastService()),
      ],
    );
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    await tester.pump(duration);
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('wraps to the first slide when repeat is on', (tester) async {
    stubTimeline([RemoteAssetFactory.create(), RemoteAssetFactory.create()]);

    await pumpSlideshow(
      tester,
      overrides: [
        appConfigProvider.overrideWithValue(config),
        assetServiceProvider.overrideWithValue(assetService),
        gCastServiceProvider.overrideWithValue(MockGCastService()),
      ],
    );
    await tester.pump(duration);
    expect(currentPage(tester), 1);

    await tester.pump(duration);
    expect(currentPage(tester), 0);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('single ended video on repeat restarts in place', (tester) async {
    final video = RemoteAssetFactory.create(type: .video);
    stubTimeline([video]);

    await pumpSlideshow(tester, overrides: overridesFor(video));

    const length = Duration(seconds: 60);
    player.emit(const VideoPlayerState(position: Duration(seconds: 1), duration: length, status: .playing));
    await tester.pump();
    player.emit(const VideoPlayerState(position: length, duration: length, status: .completed));
    await tester.pump();
    expect(player.restartCalls, 1);
    expect(currentPage(tester), 0);

    player.emit(const VideoPlayerState(position: Duration.zero, duration: length, status: .playing));
    await tester.pump();
    player.emit(const VideoPlayerState(position: length, duration: length, status: .completed));
    await tester.pump();
    expect(player.restartCalls, 2);
    expect(currentPage(tester), 0);

    await tester.pumpWidget(const SizedBox.shrink());
  });
}
