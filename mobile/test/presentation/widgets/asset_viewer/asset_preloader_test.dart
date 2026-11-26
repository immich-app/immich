import 'dart:async';
import 'dart:ffi' hide Size;

import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/platform/local_image_api.g.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_preloader.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/utils/cache/custom_image_cache.dart';

import '../../../unit/factories/local_asset_factory.dart';
import '../../../unit/factories/remote_asset_factory.dart';
import '../../../unit/presentation/presentation_context.dart';

final class _AppImageCacheBinding extends AutomatedTestWidgetsFlutterBinding {
  @override
  ImageCache createImageCache() => CustomImageCache();
}

void main() {
  _AppImageCacheBinding();

  const localApi = 'dev.flutter.pigeon.immich_mobile.LocalImageApi';
  const remoteApi = 'dev.flutter.pigeon.immich_mobile.RemoteImageApi';
  const size = Size(400, 800);
  const stageWidths = {'thumbnail': 2, 'preview': 4, 'original': 8};
  final local = LocalAssetFactory.create().copyWith(width: 8742, height: 11656);
  final remote = RemoteAssetFactory.create().copyWith(width: 8742, height: 11656);
  late PresentationContext context;
  late List<(String, String)> requests;
  late Map<(String, String), Completer<void>> replyGates;

  Future<Object?> reply(String id, String stage) async {
    requests.add((id, stage));
    await replyGates[(id, stage)]?.future;
    final width = stageWidths[stage]!;
    return [
      {'pointer': malloc<Uint8>(width * width * 4).address, 'width': width, 'height': width, 'rowBytes': width * 4},
    ];
  }

  setUp(() async {
    context = await PresentationContext.create();
    await SettingsRepository.instance.write(SettingsKey.imageLoadOriginal, true);
    requests = [];
    replyGates = {};
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      ..setMockDecodedMessageHandler<Object?>(
        const BasicMessageChannel('$localApi.requestImage', LocalImageApi.pigeonChannelCodec),
        (message) async {
          final [id, _, width, height, ...] = message! as List<Object?>;
          final stage = width == 0 && height == 0
              ? 'original'
              : width == kThumbnailResolution.width
              ? 'thumbnail'
              : 'preview';
          return reply(id! as String, stage);
        },
      )
      ..setMockDecodedMessageHandler<Object?>(
        const BasicMessageChannel('$remoteApi.requestImage', RemoteImageApi.pigeonChannelCodec),
        (message) async {
          final url = Uri.parse((message! as List<Object?>).first! as String);
          final stage = url.pathSegments.last == 'original' ? 'original' : url.queryParameters['size']!;
          return reply(url.pathSegments[url.pathSegments.length - 2], stage);
        },
      )
      ..setMockDecodedMessageHandler<Object?>(
        const BasicMessageChannel('$localApi.cancelRequest', LocalImageApi.pigeonChannelCodec),
        (_) async => [null],
      )
      ..setMockDecodedMessageHandler<Object?>(
        const BasicMessageChannel('$remoteApi.cancelRequest', RemoteImageApi.pigeonChannelCodec),
        (_) async => [null],
      );
  });

  tearDown(() async {
    PaintingBinding.instance.imageCache
      ..clear()
      ..clearLiveImages();
    await context.dispose();
  });

  Future<void> settle(WidgetTester tester) async {
    for (var i = 0; i < 20; i++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 5)));
      await tester.pump();
    }
  }

  AssetPreloader preloaderFor(List<BaseAsset> assets) {
    final preloader = AssetPreloader(
      timelineService: TimelineService((
        assetSource: (index, count) async => assets.skip(index).take(count).toList(),
        bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
        origin: TimelineOrigin.main,
      )),
      mounted: () => true,
    );
    addTearDown(preloader.dispose);
    return preloader;
  }

  Future<void> runPreload(WidgetTester tester, AssetPreloader preloader, int index) async {
    preloader.preload(index, size);
    await tester.pump(Durations.medium4);
    await settle(tester);
  }

  VoidCallback show(BaseAsset asset, [List<int>? widths]) {
    final stream = getFullImageProvider(asset, size: size).resolve(ImageConfiguration.empty);
    final listener = ImageStreamListener((image, _) {
      widths?.add(image.image.width);
      image.dispose();
    });
    stream.addListener(listener);
    return () => stream.removeListener(listener);
  }

  int count(BaseAsset asset, String stage) => requests.where((request) => request == (asset.id, stage)).length;

  bool hasPreviewEntry(BaseAsset asset) => PaintingBinding.instance.imageCache
      .statusForKey(getFullImageProvider(asset, size: size, previewOnly: true))
      .tracked;

  Future<void> preloadNeighbors(WidgetTester tester, BaseAsset previous, BaseAsset next) async {
    final preloader = preloaderFor([previous, RemoteAssetFactory.create(), next]);
    await tester.pump();
    await runPreload(tester, preloader, 1);
  }

  testWidgets('small photos and videos load without a preview entry', (tester) async {
    final smallLocal = LocalAssetFactory.create().copyWith(width: 4000, height: 3000);
    final smallRemote = RemoteAssetFactory.create().copyWith(width: 4000, height: 3000);
    final video = LocalAssetFactory.create().copyWith(type: .video, playbackStyle: .video);
    await preloadNeighbors(tester, smallLocal, video);
    final hide = show(smallRemote);
    await settle(tester);
    hide();

    expect(count(smallLocal, 'original'), 1);
    expect(count(smallRemote, 'original'), 1);
    expect([smallLocal, smallRemote, video].where(hasPreviewEntry), isEmpty);
  });

  testWidgets('opening a preloaded neighbor only loads its original', (tester) async {
    await preloadNeighbors(tester, local, remote);
    requests.clear();

    for (final asset in [local, remote]) {
      final widths = <int>[];
      final hide = show(asset, widths);
      await settle(tester);
      hide();

      expect(widths, stageWidths.values);
      expect(requests.where((request) => request.$1 == asset.id), [(asset.id, 'original')]);
    }
  });

  testWidgets('with load original off opening a preloaded neighbor loads nothing new', (tester) async {
    await SettingsRepository.instance.write(SettingsKey.imageLoadOriginal, false);
    await preloadNeighbors(tester, local, remote);
    requests.clear();

    final hideLocal = show(local);
    final hideRemote = show(remote);
    await settle(tester);
    hideLocal();
    hideRemote();

    expect(requests, isEmpty);
    expect([local, remote].where(hasPreviewEntry), isEmpty);
  });

  testWidgets('opening a neighbor while its preview loads waits for that preview', (tester) async {
    for (final asset in [local, remote]) {
      replyGates[(asset.id, 'preview')] = Completer();
    }
    await preloadNeighbors(tester, local, remote);

    for (final asset in [local, remote]) {
      final widths = <int>[];
      final hide = show(asset, widths);
      await settle(tester);
      replyGates[(asset.id, 'preview')]!.complete();
      await settle(tester);
      hide();

      expect(widths, stageWidths.values);
      expect(count(asset, 'preview'), 1);
    }
  });

  testWidgets('swiping back loads nothing again for the photo you left', (tester) async {
    final assets = [LocalAssetFactory.create(), remote, RemoteAssetFactory.create(), LocalAssetFactory.create()];
    final grid = ImageStreamListener((image, _) => image.dispose());
    final thumbnails = [
      for (final asset in assets)
        getThumbnailImageProvider(asset)!.resolve(ImageConfiguration.empty)..addListener(grid),
    ];
    await settle(tester);
    final preloader = preloaderFor(assets);
    await tester.pump();

    VoidCallback? hidePage;
    for (final index in [1, 2, 1]) {
      final hide = show(assets[index]);
      hidePage?.call();
      hidePage = hide;
      await settle(tester);
      await runPreload(tester, preloader, index);
    }
    hidePage?.call();
    for (final thumbnail in thumbnails) {
      thumbnail.removeListener(grid);
    }

    expect(count(remote, 'original'), 1);
  });

  testWidgets('swiping on leaves no preloaded thumbnail live', (tester) async {
    final thumbnails = [
      for (final asset in [local, remote]) getThumbnailImageProvider(asset)!,
    ];
    final grid = ImageStreamListener((image, _) => image.dispose());
    final streams = [
      for (final thumbnail in thumbnails) thumbnail.resolve(ImageConfiguration.empty)..addListener(grid),
    ];
    await settle(tester);
    for (final stream in streams) {
      stream.removeListener(grid);
    }
    final preloader = preloaderFor([
      local,
      RemoteAssetFactory.create(),
      remote,
      for (var i = 0; i < 3; i++) RemoteAssetFactory.create(),
    ]);
    await tester.pump();
    await runPreload(tester, preloader, 1);
    await runPreload(tester, preloader, 4);

    expect(thumbnails.where((thumbnail) => PaintingBinding.instance.imageCache.statusForKey(thumbnail).live), isEmpty);
  });
}
