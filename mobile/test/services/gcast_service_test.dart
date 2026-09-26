import 'dart:async';

import 'package:cast/device.dart';
import 'package:cast/session.dart';
import 'package:drift/drift.dart' show DatabaseConnection;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/sessions/session_create_response.model.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/repositories/gcast.repository.dart';
import 'package:immich_mobile/repositories/sessions_api.repository.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:mocktail/mocktail.dart';

import '../unit/factories/remote_asset_factory.dart';

class _RecordingCastRepository extends GCastRepository {
  String? launchedAppId;
  final messages = <(String, Map<String, dynamic>)>[];

  @override
  Future<void> connect(CastDevice device, String customReceiverAppId) async {
    launchedAppId = customReceiverAppId;
  }

  @override
  void sendMessage(String namespace, Map<String, dynamic> message) {
    messages.add((namespace, message));
  }

  @override
  Future<void> disconnect() async {}
}

class _MockSessionsAPIRepository extends Mock implements SessionsAPIRepository {}

class _MockServerInfoService extends Mock implements ServerInfoService {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Drift db;
  late StoreService store;
  late _RecordingCastRepository repository;
  late _MockSessionsAPIRepository sessions;
  late GCastService service;

  const device = CastDevice(serviceName: 'test', name: 'TV', host: 'localhost', port: 8009, extras: {'fn': 'TV'});

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    store = await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
    await SettingsRepository.ensureInitialized(db);
    await Store.put(StoreKey.serverEndpoint, 'https://immich.example/api');
  });

  tearDownAll(() async {
    await SettingsRepository.reset();
    await store.dispose();
    await db.close();
  });

  Future<void> connect(String appId) async {
    repository = _RecordingCastRepository();
    sessions = _MockSessionsAPIRepository();
    service = GCastService(
      repository,
      sessions,
      () async => appId,
      mimeTypeResolver: (url, _) async => url.contains('/video/') ? 'video/mp4' : 'image/jpeg',
    );
    await service.connect(device);
    service.sessionKey = SessionCreateResponse(
      createdAt: DateTime.now().toIso8601String(),
      current: true,
      deviceOS: 'Google Cast',
      deviceType: 'Cast',
      expiresAt: DateTime.now().add(const Duration(minutes: 10)).toIso8601String(),
      id: 'session',
      token: 'test token',
      updatedAt: DateTime.now().toIso8601String(),
    );
  }

  Future<void> loadVideo(RemoteAsset video) async {
    await service.loadMedia(video, false);
  }

  tearDown(() async {
    await service.disconnect();
  });

  test('custom receiver gets signed photo messages and adjacent photos', () async {
    await connect('A2AE3577');
    final current = RemoteAssetFactory.create(id: 'current');
    final previous = RemoteAssetFactory.create(id: 'previous');
    final next = RemoteAssetFactory.create(id: 'next');

    await service.loadMedia(current, false);
    expect(repository.launchedAppId, 'A2AE3577');
    expect(repository.messages.single.$1, GCastService.photoNamespace);
    final first = repository.messages.single.$2;
    expect(first['type'], 'SHOW_PHOTO');
    expect((first['current'] as Map)['url'], contains('sessionKey=test+token'));
    expect((first['current'] as Map)['fallbackUrl'], contains('size=thumbnail'));

    service.setPhotoNeighbors(current, previous, next);
    final updated = repository.messages.last.$2;
    expect((updated['previous'] as Map)['url'], contains(previous.id));
    expect((updated['next'] as Map)['url'], contains(next.id));
    repository.onCastMessage?.call({'type': 'PHOTO_READY', 'requestId': updated['requestId']});
    expect(service.currentAssetId, current.id);

    await service.loadMedia(current, false);
    expect(repository.messages, hasLength(2));

    service.stop();
    expect(repository.messages.last.$1, GCastService.photoNamespace);
    expect(repository.messages.last.$2['type'], 'CLEAR_PHOTO');
  });

  test('custom receiver gets a repeating video queue with the native loop flag', () async {
    await connect('A2AE3577');
    final video = RemoteAssetFactory.create(id: 'video', type: AssetType.video);

    await loadVideo(video);
    final (namespace, message) = repository.messages.single;
    expect(namespace, CastSession.kNamespaceMedia);
    expect(message['type'], 'QUEUE_LOAD');
    expect(message['repeatMode'], 'REPEAT_SINGLE');
    final media = ((message['items'] as List).single as Map)['media'] as Map;
    expect(media['customData'], {'immichLoop': true});
    expect(media['contentId'], contains('sessionKey=test+token'));
  });

  test('stopping cancels a video still waiting for credentials', () async {
    await connect('A2AE3577');
    final session = service.sessionKey!;
    service.sessionKey = null;
    final pendingSession = Completer<SessionCreateResponse>();
    when(() => sessions.createSession('Cast', 'Google Cast', duration: 900)).thenAnswer((_) => pendingSession.future);

    final loading = service.loadMedia(RemoteAssetFactory.create(id: 'video', type: AssetType.video), false);
    service.stop();
    final count = repository.messages.length;
    pendingSession.complete(session);
    await loading;

    expect(repository.messages, hasLength(count));
    expect(service.currentAssetId, isNull);
  });

  test('returning to the displayed photo supersedes another pending photo', () async {
    await connect('A2AE3577');
    final first = RemoteAssetFactory.create(id: 'first');
    final second = RemoteAssetFactory.create(id: 'second');
    await service.loadMedia(first, false);
    repository.onCastMessage?.call({'type': 'PHOTO_READY', 'requestId': repository.messages.last.$2['requestId']});

    await service.loadMedia(second, false);
    final secondRequestId = repository.messages.last.$2['requestId'];
    await service.loadMedia(first, false);
    expect(repository.messages, hasLength(3));
    expect((repository.messages.last.$2['current'] as Map)['url'], contains('/first/'));

    repository.onCastMessage?.call({'type': 'PHOTO_READY', 'requestId': secondRequestId});
    expect(service.currentAssetId, first.id);
    repository.onCastMessage?.call({'type': 'PHOTO_READY', 'requestId': repository.messages.last.$2['requestId']});
    expect(service.currentAssetId, first.id);
  });

  test('a stopped video status cannot discard a pending photo acknowledgement', () async {
    await connect('A2AE3577');
    final photo = RemoteAssetFactory.create(id: 'photo');
    await service.loadMedia(photo, false);
    final requestId = repository.messages.last.$2['requestId'];
    repository.onCastMessage?.call({
      'type': 'MEDIA_STATUS',
      'status': [
        {'playerState': 'IDLE', 'idleReason': 'ERROR', 'mediaSessionId': 1},
      ],
    });
    repository.onCastMessage?.call({'type': 'PHOTO_READY', 'requestId': requestId});
    expect(service.currentAssetId, photo.id);
  });

  test('disconnecting immediately prevents further loads', () async {
    await connect('A2AE3577');
    final disconnected = service.disconnect();
    expect(service.isConnected, isFalse);
    await service.loadMedia(RemoteAssetFactory.create(id: 'photo'), false);
    await disconnected;
    expect(repository.messages, isEmpty);
  });

  test('phone volume keys change receiver volume while casting a video', () async {
    await connect('A2AE3577');
    repository.onCastMessage?.call({
      'type': 'RECEIVER_STATUS',
      'status': {
        'volume': {'level': 0.4, 'muted': false, 'stepInterval': 0.1},
      },
    });

    service.changeReceiverVolume(1);
    expect(repository.messages, isEmpty);

    await loadVideo(RemoteAssetFactory.create(id: 'video', type: AssetType.video));
    service.changeReceiverVolume(1);
    expect(repository.messages.last.$1, CastSession.kNamespaceReceiver);
    expect(repository.messages.last.$2['type'], 'SET_VOLUME');
    expect((repository.messages.last.$2['volume'] as Map)['level'], closeTo(0.5, 0.0001));

    repository.onCastMessage?.call({
      'type': 'RECEIVER_STATUS',
      'status': {
        'volume': {'level': 0.4, 'muted': false, 'stepInterval': 0.1},
      },
    });
    service.changeReceiverVolume(1);
    expect((repository.messages.last.$2['volume'] as Map)['level'], closeTo(0.6, 0.0001));

    service.changeReceiverVolume(-1);
    expect((repository.messages.last.$2['volume'] as Map)['level'], closeTo(0.5, 0.0001));

    service.stop();
    final count = repository.messages.length;
    service.changeReceiverVolume(1);
    expect(repository.messages, hasLength(count));
  });

  test('fixed receiver volume leaves phone volume keys alone', () async {
    await connect('A2AE3577');
    repository.onCastMessage?.call({
      'type': 'RECEIVER_STATUS',
      'status': {
        'volume': {'level': 0.4, 'controlType': 'FIXED'},
      },
    });

    await loadVideo(RemoteAssetFactory.create(id: 'video', type: AssetType.video));
    final count = repository.messages.length;
    service.changeReceiverVolume(1);
    expect(repository.messages, hasLength(count));
  });

  for (final appId in ['', '   ']) {
    test('refuses to connect without a custom receiver ID ($appId)', () async {
      await expectLater(connect(appId), throwsStateError);
      expect(repository.launchedAppId, isNull);
      expect(service.isConnected, isFalse);
      expect(repository.messages, isEmpty);
    });
  }

  test('trims the configured custom receiver ID', () async {
    await connect(' A2AE3577 ');
    expect(repository.launchedAppId, 'A2AE3577');
  });
  group('client configuration', () {
    Future<void> useConfig(AppConfig config) async {
      repository = _RecordingCastRepository();
      final serverInfo = _MockServerInfoService();
      when(serverInfo.getServerConfig).thenAnswer(
        (_) async => const ServerConfig(
          castReceiverAppId: 'SERVER01',
          trashDays: 30,
          oauthButtonText: '',
          externalDomain: '',
          mapDarkStyleUrl: '',
          mapLightStyleUrl: '',
        ),
      );
      final container = ProviderContainer(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          gCastRepositoryProvider.overrideWithValue(repository),
          sessionsAPIRepositoryProvider.overrideWithValue(_MockSessionsAPIRepository()),
          serverInfoServiceProvider.overrideWithValue(serverInfo),
        ],
      );
      addTearDown(container.dispose);
      service = container.read(gCastServiceProvider);
      await service.connect(device);
    }

    test('uses the server receiver by default', () async {
      await useConfig(const AppConfig(castEnabled: true));
      expect(repository.launchedAppId, 'SERVER01');
    });

    test('local override wins over the server receiver', () async {
      await useConfig(const AppConfig(castEnabled: true, castReceiverAppId: ' LOCAL001 '));
      expect(repository.launchedAppId, 'LOCAL001');
    });

    test('clearing the override restores the server receiver', () async {
      await useConfig(const AppConfig(castEnabled: true, castReceiverAppId: '   '));
      expect(repository.launchedAppId, 'SERVER01');
    });

    test('casting is disabled by default', () async {
      await expectLater(useConfig(const AppConfig()), throwsStateError);
      expect(repository.launchedAppId, isNull);
    });
  });
}
