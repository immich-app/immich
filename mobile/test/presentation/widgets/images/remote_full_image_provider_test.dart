import 'dart:async';
import 'dart:ffi';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:ffi/ffi.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/platform/remote_image_api.g.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.RemoteImageApi.requestImage',
    RemoteImageApi.pigeonChannelCodec,
  );
  const cancel = BasicMessageChannel<Object?>(
    'dev.flutter.pigeon.immich_mobile.RemoteImageApi.cancelRequest',
    RemoteImageApi.pigeonChannelCodec,
  );
  late Drift db;
  late List<Uri> requested;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, 'http://fixture.invalid/api');
    await SettingsRepository.ensureInitialized(db);
  });

  setUp(() async {
    await SettingsRepository.instance.write(SettingsKey.imageLoadOriginal, true);
    await SettingsRepository.instance.write(SettingsKey.imagePreferRemote, false);
    requested = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      ..setMockDecodedMessageHandler<Object?>(channel, (message) async {
        requested.add(Uri.parse((message! as List<Object?>).first! as String));
        // The native decoder owns these pixels until ImageRequest releases them.
        final pixels = malloc<Uint8>(4)..asTypedList(4).fillRange(0, 4, 255);
        return [
          <String, int>{'pointer': pixels.address, 'width': 1, 'height': 1, 'rowBytes': 4},
        ];
      })
      ..setMockDecodedMessageHandler<Object?>(cancel, (_) async => [null]);
  });

  tearDown(() {
    PaintingBinding.instance.imageCache
      ..clear()
      ..clearLiveImages();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      ..setMockDecodedMessageHandler<Object?>(channel, null)
      ..setMockDecodedMessageHandler<Object?>(cancel, null);
  });

  tearDownAll(() async {
    await SettingsRepository.reset();
    await db.close();
  });

  RemoteAsset asset({bool isDeveloped = false}) => RemoteAsset(
    id: 'photo',
    name: 'photo.heic',
    ownerId: 'owner',
    checksum: 'source',
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    isEdited: false,
    isDeveloped: isDeveloped,
    mediaRevision: 'render-revision',
  );

  LocalAsset localAsset({bool isDeveloped = false}) => LocalAsset(
    id: 'device-photo',
    remoteId: 'photo',
    name: 'photo.nef',
    checksum: 'source',
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    isEdited: false,
    playbackStyle: AssetPlaybackStyle.image,
    isDeveloped: isDeveloped,
    mediaRevision: 'device-render-revision',
    thumbHash: 'server-thumbhash',
  );

  Future<void> load(BaseAsset asset, {bool edited = true, required bool Function(Uri) isFinal}) async {
    final provider = getFullImageProvider(asset, edited: edited);
    final stream = provider.resolve(ImageConfiguration.empty);
    final done = Completer<void>();
    final listener = ImageStreamListener(
      (image, _) {
        image.dispose();
        if (requested.any(isFinal) && !done.isCompleted) {
          done.complete();
        }
      },
      onError: (Object error, StackTrace? stack) {
        if (!done.isCompleted) {
          done.completeError(error, stack);
        }
      },
    );
    stream.addListener(listener);
    try {
      await done.future.timeout(const Duration(seconds: 10));
    } finally {
      stream.removeListener(listener);
    }
  }

  test('ordinary HEIC loads its original after the preview when original loading is enabled', () async {
    await load(asset(), isFinal: (uri) => uri.path.endsWith('/original'));

    expect(requested.map((uri) => uri.queryParameters['size']), ['thumbnail', 'preview', null]);
    expect(requested.last.path, '/api/assets/photo/original');
    expect(requested.last.queryParameters['edited'], 'true');
  });

  for (final edited in [true, false]) {
    test('developed photos load the cached fullsize with edited=$edited and the current revision', () async {
      await load(asset(isDeveloped: true), edited: edited, isFinal: (uri) => uri.queryParameters['size'] == 'fullsize');

      expect(requested.map((uri) => uri.queryParameters['size']), ['thumbnail', 'preview', 'fullsize']);
      expect(requested.every((uri) => uri.queryParameters['edited'] == '$edited'), isTrue);
      expect(requested.every((uri) => uri.queryParameters['c'] == 'render-revision'), isTrue);
      expect(requested.any((uri) => uri.path.endsWith('/original')), isFalse);
    });
  }

  test('stops at the developed preview when original loading is disabled', () async {
    await SettingsRepository.instance.write(SettingsKey.imageLoadOriginal, false);
    await load(asset(isDeveloped: true), isFinal: (uri) => uri.queryParameters['size'] == 'preview');

    expect(requested.map((uri) => uri.queryParameters['size']), ['thumbnail', 'preview']);
  });

  test('provider identity changes when the same asset gains developed routing', () {
    final ordinary = getFullImageProvider(asset()) as RemoteFullImageProvider;
    final developed = getFullImageProvider(asset(isDeveloped: true)) as RemoteFullImageProvider;

    expect(ordinary.isDeveloped, isFalse);
    expect(developed.isDeveloped, isTrue);
    expect(developed, isNot(ordinary));
  });

  test('developed device album photos load server thumbnails and fullsize using their revision', () async {
    final local = localAsset(isDeveloped: true);
    final thumbnail = getThumbnailImageProvider(local)! as RemoteImageProvider;

    expect(thumbnail.url, contains('/assets/photo/thumbnail'));
    expect(thumbnail.url, contains('c=device-render-revision'));
    await load(local, isFinal: (uri) => uri.queryParameters['size'] == 'fullsize');

    expect(requested.map((uri) => uri.queryParameters['size']), ['thumbnail', 'preview', 'fullsize']);
    expect(requested.every((uri) => uri.queryParameters['c'] == 'device-render-revision'), isTrue);
    expect(local.id, 'device-photo');
    expect(local.copyWith(name: 'renamed.nef').mediaRevision, local.mediaRevision);
    expect(local.copyWith(mediaRevision: 'new-render'), isNot(local));
  });

  test('ordinary backed up device photos retain local image providers', () {
    final local = localAsset();

    expect(getFullImageProvider(local), isA<LocalFullImageProvider>());
    expect(getThumbnailImageProvider(local), isA<LocalThumbProvider>());
  });
}
