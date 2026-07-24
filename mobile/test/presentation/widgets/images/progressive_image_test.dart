// End-to-end tests for progressive image loading (thumbnail -> preview)
// through the real provider/completer pipeline with a mocked platform
// image API.
//
// The "animations are disabled" cases are regression tests for
// https://github.com/immich-app/immich/issues/29727: since Flutter 3.44,
// a paused Image widget stops listening to its stream after the first
// frame, freezing progressive images at the low-res thumbnail.

import 'dart:async';
import 'dart:ffi' hide Size;
import 'dart:ui' as ui;

import 'package:drift/drift.dart' hide isNull;
import 'package:drift/native.dart';
import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/full_image.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/utils/cache/custom_image_cache.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';

import '../../../test_utils.dart';

class _CustomCacheBinding extends AutomatedTestWidgetsFlutterBinding {
  @override
  ImageCache createImageCache() => CustomImageCache();
}

const kThumbSize = 16;
const kPreviewSize = 64;
const kOriginalSize = 128;

late Uint8List thumbPng;
late Uint8List previewPng;
late Uint8List originalPng;

final requestedUrls = <String>[];

Future<Uint8List> _pngBytes(int size) async {
  final image = await createTestImage(width: size, height: size);
  final data = await image.toByteData(format: ui.ImageByteFormat.png);
  return data!.buffer.asUint8List();
}

void _installRemoteImageApiMock() {
  const channel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage',
    RemoteImageApi.pigeonChannelCodec,
  );
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler<Object?>(channel, (
    message,
  ) async {
    final args = message as List<Object?>;
    final url = args[0] as String;
    requestedUrls.add(url);

    final Uint8List bytes;
    if (url.contains('size=thumbnail')) {
      bytes = thumbPng;
    } else if (url.contains('size=preview')) {
      bytes = previewPng;
    } else {
      bytes = originalPng;
    }

    final pointer = malloc<Uint8>(bytes.length);
    pointer.asTypedList(bytes.length).setAll(0, bytes);
    return <Object?>[
      {'pointer': pointer.address, 'length': bytes.length},
    ];
  });

  const cancelChannel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.RemoteImageApi.cancelRequest',
    RemoteImageApi.pigeonChannelCodec,
  );
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockDecodedMessageHandler<Object?>(
    cancelChannel,
    (message) async => <Object?>[null],
  );
}

Future<void> _precacheThumbnail(WidgetTester tester, dynamic asset) async {
  await tester.runAsync(() async {
    final provider = getThumbnailImageProvider(asset)!;
    final completer = Completer<void>();
    final stream = provider.resolve(ImageConfiguration.empty);
    final listener = ImageStreamListener((info, _) {
      info.dispose();
      if (!completer.isCompleted) {
        completer.complete();
      }
    }, onError: (e, s) => completer.completeError(e, s));
    stream.addListener(listener);
    await completer.future;
    stream.removeListener(listener);
  });
}

Future<void> _settle(WidgetTester tester) async {
  for (int i = 0; i < 10; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    await tester.pump();
  }
}

int? _renderedImageWidth(WidgetTester tester) {
  final rawImages = tester.widgetList<RawImage>(find.byType(RawImage)).toList();
  return rawImages.isEmpty ? null : rawImages.first.image?.width;
}

void main() {
  _CustomCacheBinding();
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    TestUtils.init();
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'http://localhost:3000');
    await SettingsRepository.ensureInitialized(db);
  });

  setUp(() {
    requestedUrls.clear();
    _installRemoteImageApiMock();
    imageCache.clear();
    imageCache.clearLiveImages();
  });

  int assetCounter = 0;

  Future<dynamic> setUpAsset(WidgetTester tester) async {
    await tester.runAsync(() async {
      thumbPng = await _pngBytes(kThumbSize);
      previewPng = await _pngBytes(kPreviewSize);
      originalPng = await _pngBytes(kOriginalSize);
    });
    return TestUtils.createRemoteAsset(id: 'asset-${++assetCounter}', width: 3000, height: 4000);
  }

  testWidgets('FullImage shows preview (thumbnail pre-cached by timeline)', (tester) async {
    final asset = await setUpAsset(tester);
    await _precacheThumbnail(tester, asset);

    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(width: 400, height: 800, child: FullImage(asset, size: const Size(400, 800))),
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('FullImage shows preview (thumbnail not cached)', (tester) async {
    final asset = await setUpAsset(tester);

    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(width: 400, height: 800, child: FullImage(asset, size: const Size(400, 800))),
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('PhotoView shows preview (thumbnail pre-cached by timeline)', (tester) async {
    final asset = await setUpAsset(tester);
    await _precacheThumbnail(tester, asset);

    final provider = getFullImageProvider(asset, size: const Size(400, 800));
    await tester.pumpWidget(
      MaterialApp(
        home: PhotoView(
          imageProvider: provider,
          index: 0,
          gaplessPlayback: true,
          filterQuality: FilterQuality.high,
          tightMode: true,
          enablePanAlways: true,
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('PhotoView shows preview (thumbnail not cached)', (tester) async {
    final asset = await setUpAsset(tester);

    final provider = getFullImageProvider(asset, size: const Size(400, 800));
    await tester.pumpWidget(
      MaterialApp(
        home: PhotoView(
          imageProvider: provider,
          index: 0,
          gaplessPlayback: true,
          filterQuality: FilterQuality.high,
          tightMode: true,
          enablePanAlways: true,
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('FullImage shows preview when animations are disabled (issue #29727)', (tester) async {
    final asset = await setUpAsset(tester);
    await _precacheThumbnail(tester, asset);

    // Android "remove animations" / animator duration scale 0 sets
    // MediaQuery.disableAnimations, which pauses Image stream listening
    // after the first frame on Flutter 3.44+.
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: Center(
            child: SizedBox(width: 400, height: 800, child: FullImage(asset, size: const Size(400, 800))),
          ),
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('PhotoView shows preview when animations are disabled (issue #29727)', (tester) async {
    final asset = await setUpAsset(tester);
    await _precacheThumbnail(tester, asset);

    final provider = getFullImageProvider(asset, size: const Size(400, 800));
    await tester.pumpWidget(
      MaterialApp(
        home: MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: PhotoView(
            imageProvider: provider,
            index: 0,
            gaplessPlayback: true,
            filterQuality: FilterQuality.high,
            tightMode: true,
            enablePanAlways: true,
          ),
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });

  testWidgets('memory page pattern: precacheImage then FullImage', (tester) async {
    final asset = await setUpAsset(tester);
    await _precacheThumbnail(tester, asset);

    // The memory page precaches the full image provider before showing the card.
    await tester.pumpWidget(MaterialApp(home: Builder(builder: (context) => const SizedBox())));
    final context = tester.element(find.byType(SizedBox));
    final precacheFuture = precacheImage(getFullImageProvider(asset, size: const Size(400, 800)), context);
    await tester.pump();
    await tester.runAsync(() => precacheFuture);
    // Post-frame callback removes the precache listener.
    await tester.pump();

    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(width: 400, height: 800, child: FullImage(asset, size: const Size(400, 800))),
        ),
      ),
    );

    await _settle(tester);
    expect(_renderedImageWidth(tester), kPreviewSize, reason: 'stuck on thumbnail. URLs: $requestedUrls');
  });
}
