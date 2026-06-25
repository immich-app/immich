import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_current.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_android.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:immich_mobile/services/widget.service.dart';
import 'package:mocktail/mocktail.dart';

class MockViewIntentHostApi extends Mock implements ViewIntentHostApi {}

class MockViewIntentAssetResolver extends Mock implements ViewIntentAssetResolver {}

class MockAssetService extends Mock implements AssetService {}

class MockAppRouter extends Mock implements AppRouter {}

class MockAuthService extends Mock implements AuthService {}

class MockApiService extends Mock implements ApiService {}

class MockUserService extends Mock implements UserService {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockWidgetService extends Mock implements WidgetService {}

class FakePageRouteInfo extends Fake implements PageRouteInfo<dynamic> {}

class FakeTimelineService extends Fake implements TimelineService {}

class FakeAssetService extends Fake implements AssetService {
  @override
  Stream<BaseAsset?> watchAsset(BaseAsset asset) => const Stream.empty();
}

class TestViewIntentService extends ViewIntentService {
  ViewIntentPayload? consumedAttachment;
  int cleanupStaleTempFilesCalls = 0;
  int cleanupManagedTempFileCalls = 0;
  final List<String> managedTempPaths = [];

  TestViewIntentService() : super(MockViewIntentHostApi());

  @override
  Future<ViewIntentPayload?> consumeViewIntent() async => consumedAttachment;

  @override
  Future<void> cleanupStaleTempFiles() async {
    cleanupStaleTempFilesCalls++;
  }

  @override
  Future<void> cleanupManagedTempFile() async {
    cleanupManagedTempFileCalls++;
  }

  @override
  Future<void> setManagedTempFilePath(String path) async {
    managedTempPaths.add(path);
  }
}

class TestAuthNotifier extends AuthNotifier {
  TestAuthNotifier(Ref ref, AuthState initial)
    : super(
        MockAuthService(),
        MockApiService(),
        MockUserService(),
        MockSecureStorageService(),
        MockWidgetService(),
        ref,
      ) {
    state = initial;
  }

  void setAuthenticated(bool isAuthenticated) {
    state = state.copyWith(isAuthenticated: isAuthenticated);
  }
}

final _handlerProvider = Provider<AndroidViewIntentHandler>((ref) => AndroidViewIntentHandler(ref));

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TestViewIntentService viewIntentService;
  late MockViewIntentAssetResolver resolver;
  late MockAssetService assetService;
  late MockAppRouter router;
  late TestAuthNotifier authNotifier;
  late ProviderContainer container;
  late AndroidViewIntentHandler handler;
  late ViewIntentPayload payload;
  late LocalAsset deepLinkAsset;
  late TimelineService deepLinkTimelineService;

  setUpAll(() {
    registerFallbackValue(FakePageRouteInfo());
    registerFallbackValue(<PageRouteInfo<dynamic>>[]);
    registerFallbackValue(FakeTimelineService());
    registerFallbackValue(_remoteAsset(id: 'fallback-remote', localId: 'fallback-local'));
    registerFallbackValue(
      ViewIntentPayload(path: '/tmp/fallback.jpg', mimeType: 'image/jpeg', localAssetId: 'fallback'),
    );
  });

  setUp(() async {
    viewIntentService = TestViewIntentService();
    resolver = MockViewIntentAssetResolver();
    assetService = MockAssetService();
    router = MockAppRouter();
    payload = ViewIntentPayload(path: '/tmp/incoming.jpg', mimeType: 'image/jpeg', localAssetId: 'local-1');
    deepLinkAsset = _localAsset(id: 'local-1');
    deepLinkTimelineService = await _createReadyTimelineService([deepLinkAsset], TimelineOrigin.deepLink);

    when(() => router.replaceAll(any())).thenAnswer((_) async {});
    when(() => router.replace(any())).thenAnswer((_) async => null);
    when(() => router.push<Object?>(any())).thenAnswer((_) async => null);

    container = ProviderContainer(
      overrides: [
        viewIntentServiceProvider.overrideWithValue(viewIntentService),
        viewIntentAssetResolverProvider.overrideWithValue(resolver),
        assetServiceProvider.overrideWithValue(assetService),
        appRouterProvider.overrideWithValue(router),
        authProvider.overrideWith((ref) {
          authNotifier = TestAuthNotifier(ref, _authState(isAuthenticated: true));
          return authNotifier;
        }),
        assetServiceProvider.overrideWithValue(FakeAssetService()),
      ],
    );

    authNotifier = container.read(authProvider.notifier) as TestAuthNotifier;
    handler = container.read(_handlerProvider);

    addTearDown(() async {
      await deepLinkTimelineService.dispose();
      container.dispose();
    });
  });

  test('handle defers unauthenticated attachment', () async {
    authNotifier.setAuthenticated(false);

    await handler.handle(payload);

    expect(container.read(viewIntentPendingProvider), payload);
    verifyNever(() => resolver.resolve(any()));
  });

  testWidgets('flushDeferredViewIntent consumes the pending attachment and routes the viewer', (tester) async {
    authNotifier.setAuthenticated(false);
    container.read(viewIntentPendingProvider.notifier).defer(payload);
    authNotifier.setAuthenticated(true);

    when(() => resolver.resolve(payload)).thenAnswer((_) async {
      return ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService);
    });

    unawaited(handler.flushDeferredViewIntent());
    await tester.pump();
    await tester.pump();
    await tester.idle();

    expect(container.read(viewIntentPendingProvider), isNull);
    verify(() => resolver.resolve(payload)).called(1);
  });

  test('flushDeferredViewIntent does nothing when there is no pending attachment', () async {
    await handler.flushDeferredViewIntent();

    verifyNever(() => resolver.resolve(any()));
  });

  test('onAppResumed cleans stale temp files when no attachment is present', () async {
    viewIntentService.consumedAttachment = null;

    await handler.onAppResumed();

    expect(viewIntentService.cleanupStaleTempFilesCalls, 1);
    verifyNever(() => resolver.resolve(any()));
  });

  test('onAppResumed does not clean stale temp files while pending attachment exists', () async {
    viewIntentService.consumedAttachment = null;
    container.read(viewIntentPendingProvider.notifier).defer(payload);

    await handler.onAppResumed();

    expect(viewIntentService.cleanupStaleTempFilesCalls, 0);
    verifyNever(() => resolver.resolve(any()));
  });

  testWidgets('onAppResumed handles attachment immediately when authenticated', (tester) async {
    viewIntentService.consumedAttachment = payload;
    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));

    unawaited(handler.onAppResumed());
    await tester.pump();
    await tester.pump();
    await tester.pump();
    await tester.idle();

    verify(() => resolver.resolve(payload)).called(1);
    verify(() => router.popUntilRoot()).called(1);
    final captured = verify(() => router.push<Object?>(captureAny())).captured;
    expect(captured, hasLength(1));
    final route = captured.single as PageRouteInfo<dynamic>;
    expect(route.routeName, AssetViewerRoute.name);
  });

  test('handle updates current viewer asset when a new view intent arrives', () async {
    final secondPayload = ViewIntentPayload(
      path: '/tmp/incoming-b.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'local-2',
    );
    final secondAsset = _localAsset(id: 'local-2');
    final secondTimelineService = await _createReadyTimelineService([secondAsset], TimelineOrigin.deepLink);
    addTearDown(() async => secondTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: secondAsset, timelineService: secondTimelineService));

    await handler.handle(payload);
    expect(container.read(assetViewerProvider).currentAsset, deepLinkAsset);
    expect(container.read(viewIntentCurrentProvider), payload);

    await handler.handle(secondPayload);

    expect(container.read(assetViewerProvider).currentAsset, secondAsset);
    expect(container.read(viewIntentCurrentProvider), secondPayload);
    verify(() => resolver.resolve(payload)).called(1);
    verify(() => resolver.resolve(secondPayload)).called(1);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(2);
    verifyNever(() => router.replace(any()));
    verifyNever(() => router.replaceAll(any()));
  });

  test('refreshCurrentAfterUpload waits until the current asset becomes remote-backed', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', localId: 'local-1');
    final remoteTimelineService = await _createReadyTimelineService([remoteAsset], TimelineOrigin.deepLink);
    addTearDown(() async => remoteTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => Stream.value(remoteAsset));
    when(() => resolver.timelineFor(any())).thenReturn(remoteTimelineService);

    await handler.handle(payload);
    await handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload);

    expect(container.read(assetViewerProvider).currentAsset, remoteAsset);
    verify(() => resolver.resolve(payload)).called(1);
    verify(() => assetService.watchRemoteAsset('remote-1')).called(1);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(2);
    verifyNever(() => router.replace(any()));
    verifyNever(() => router.replaceAll(any()));
  });

  test('refreshCurrentAfterUpload uses attachment localAssetId when watched remote asset is remote-only', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', localId: null);
    final viewerAsset = _remoteAsset(id: 'remote-1', localId: 'local-1');
    final remoteTimelineService = _timelineServiceFromAssets([viewerAsset], TimelineOrigin.deepLink);
    addTearDown(() async => remoteTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    final remoteAssetController = StreamController<RemoteAsset?>();
    addTearDown(remoteAssetController.close);

    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => remoteAssetController.stream);
    when(() => resolver.timelineFor(any())).thenReturn(remoteTimelineService);

    await handler.handle(payload);
    final refresh = handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload);
    remoteAssetController.add(null);
    await Future<void>.delayed(Duration.zero);
    remoteAssetController.add(remoteAsset);
    await refresh;

    expect(container.read(assetViewerProvider).currentAsset, viewerAsset);
    verify(() => assetService.watchRemoteAsset('remote-1')).called(1);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(2);
    verifyNever(() => router.replace(any()));
    verifyNever(() => router.replaceAll(any()));
  });

  test('refreshCurrentAfterUpload falls back to direct get when watch times out', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', localId: 'local-1');
    final remoteTimelineService = _timelineServiceFromAssets([remoteAsset], TimelineOrigin.deepLink);
    addTearDown(() async => remoteTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    final remoteAssetController = StreamController<RemoteAsset?>();
    addTearDown(remoteAssetController.close);

    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => remoteAssetController.stream);
    when(() => assetService.getRemoteAsset('remote-1')).thenAnswer((_) async => remoteAsset);
    when(() => resolver.timelineFor(any())).thenReturn(remoteTimelineService);

    await handler.handle(payload);
    await handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload, timeout: Duration.zero);

    expect(container.read(assetViewerProvider).currentAsset, remoteAsset);
    verify(() => assetService.watchRemoteAsset('remote-1')).called(1);
    verify(() => assetService.getRemoteAsset('remote-1')).called(1);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(2);
    verifyNever(() => router.replace(any()));
    verifyNever(() => router.replaceAll(any()));
  });

  test('refreshCurrentAfterUpload watches only the uploaded remote asset stream', () async {
    final remoteAsset = _remoteAsset(id: 'remote-1', localId: 'local-1');
    final remoteTimelineService = _timelineServiceFromAssets([remoteAsset], TimelineOrigin.deepLink);
    addTearDown(() async => remoteTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => Stream.value(remoteAsset));
    when(() => resolver.timelineFor(any())).thenReturn(remoteTimelineService);

    await handler.handle(payload);
    await handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload);

    expect(container.read(assetViewerProvider).currentAsset, remoteAsset);
    verify(() => assetService.watchRemoteAsset('remote-1')).called(1);
    verifyNever(() => assetService.watchRemoteAsset('remote-2'));
  });

  test('refreshCurrentAfterUpload skips when another view intent became current', () async {
    final secondPayload = ViewIntentPayload(
      path: '/tmp/incoming-b.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'local-2',
    );
    final secondAsset = _localAsset(id: 'local-2');
    final secondTimelineService = await _createReadyTimelineService([secondAsset], TimelineOrigin.deepLink);
    addTearDown(() async => secondTimelineService.dispose());

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: secondAsset, timelineService: secondTimelineService));
    when(
      () => assetService.watchRemoteAsset('remote-1'),
    ).thenAnswer((_) => Stream.value(_remoteAsset(id: 'remote-1', localId: 'local-1')));

    await handler.handle(payload);
    await handler.handle(secondPayload);
    await handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload);

    expect(container.read(assetViewerProvider).currentAsset, secondAsset);
    verifyNever(() => assetService.watchRemoteAsset('remote-1'));
  });

  test('refreshCurrentAfterUpload skips when view intent changes while waiting for upload', () async {
    final secondPayload = ViewIntentPayload(
      path: '/tmp/incoming-b.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'local-2',
    );
    final secondAsset = _localAsset(id: 'local-2');
    final secondTimelineService = await _createReadyTimelineService([secondAsset], TimelineOrigin.deepLink);
    addTearDown(() async => secondTimelineService.dispose());
    final remoteAssetController = StreamController<RemoteAsset?>();
    addTearDown(remoteAssetController.close);

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: secondAsset, timelineService: secondTimelineService));
    when(() => assetService.watchRemoteAsset('remote-1')).thenAnswer((_) => remoteAssetController.stream);

    await handler.handle(payload);
    final refresh = handler.refreshCurrentAfterUpload(remoteAssetId: 'remote-1', attachment: payload);
    remoteAssetController.add(null);
    await Future<void>.delayed(Duration.zero);

    await handler.handle(secondPayload);
    remoteAssetController.add(_remoteAsset(id: 'remote-1', localId: 'local-1'));
    await refresh;

    expect(container.read(assetViewerProvider).currentAsset, secondAsset);
    verify(() => assetService.watchRemoteAsset('remote-1')).called(1);
  });
}

AuthState _authState({required bool isAuthenticated}) {
  return AuthState(
    deviceId: 'device-1',
    userId: 'user-1',
    userEmail: 'user@example.com',
    isAuthenticated: isAuthenticated,
    name: 'User',
    isAdmin: false,
    profileImagePath: '',
  );
}

LocalAsset _localAsset({required String id, String? checksum = 'checksum-1', String? remoteId}) {
  return LocalAsset(
    id: id,
    remoteId: remoteId,
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );
}

RemoteAsset _remoteAsset({required String id, required String? localId}) {
  return RemoteAsset(
    id: id,
    localId: localId,
    ownerId: 'user-1',
    name: '$id.jpg',
    checksum: 'checksum-1',
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    isEdited: false,
  );
}

TimelineService _timelineServiceFromAssets(List<BaseAsset> assets, TimelineOrigin origin) {
  return TimelineService((
    assetSource: (index, count) async => assets.skip(index).take(count).toList(),
    bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
    origin: origin,
  ));
}

Future<TimelineService> _createReadyTimelineService(List<BaseAsset> assets, TimelineOrigin origin) async {
  final timelineService = _timelineServiceFromAssets(assets, origin);
  // Spin a few async ticks so the internal bucket subscription has populated
  // the buffer before tests start asserting against totalAssets.
  for (var i = 0; i < 20 && timelineService.totalAssets != assets.length; i++) {
    await Future<void>.delayed(Duration.zero);
  }
  return timelineService;
}
