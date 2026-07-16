import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
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
  Completer<ViewIntentPayload?>? consumeCompleter;
  Object? consumeError;
  int consumeViewIntentCalls = 0;
  int cleanupStaleTempFilesCalls = 0;
  int cleanupManagedTempFileCalls = 0;
  final List<String> managedTempPaths = [];

  TestViewIntentService() : super(MockViewIntentHostApi());

  @override
  Future<ViewIntentPayload?> consumeViewIntent() async {
    consumeViewIntentCalls++;
    final error = consumeError;
    if (error != null) {
      throw error;
    }
    final completer = consumeCompleter;
    if (completer != null) {
      return completer.future;
    }
    return consumedAttachment;
  }

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
    registerFallbackValue(
      ViewIntentPayload(path: '/tmp/fallback.jpg', mimeType: 'image/jpeg', localAssetId: 'fallback'),
    );
  });

  setUp(() async {
    viewIntentService = TestViewIntentService();
    resolver = MockViewIntentAssetResolver();
    router = MockAppRouter();
    payload = ViewIntentPayload(path: '/tmp/incoming.jpg', mimeType: 'image/jpeg', localAssetId: 'local-1');
    deepLinkAsset = _localAsset(id: 'local-1');
    deepLinkTimelineService = await _createReadyTimelineService([deepLinkAsset], TimelineOrigin.deepLink);

    when(() => router.replaceAll(any())).thenAnswer((_) async {});

    container = ProviderContainer(
      overrides: [
        viewIntentServiceProvider.overrideWithValue(viewIntentService),
        viewIntentAssetResolverProvider.overrideWithValue(resolver),
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

  test('flushDeferredViewIntent consumes the pending attachment and routes the viewer', () async {
    authNotifier.setAuthenticated(false);
    container.read(viewIntentPendingProvider.notifier).defer(payload);
    authNotifier.setAuthenticated(true);

    when(() => resolver.resolve(payload)).thenAnswer((_) async {
      return ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService);
    });

    final opened = await handler.flushDeferredViewIntent();

    expect(opened, isTrue);
    expect(container.read(viewIntentPendingProvider), isNull);
    verify(() => resolver.resolve(payload)).called(1);
  });

  test('flushDeferredViewIntent does nothing when there is no pending attachment', () async {
    final opened = await handler.flushDeferredViewIntent();

    expect(opened, isFalse);
    verifyNever(() => resolver.resolve(any()));
  });

  test('flushDeferredViewIntent keeps the pending attachment while unauthenticated', () async {
    authNotifier.setAuthenticated(false);
    container.read(viewIntentPendingProvider.notifier).defer(payload);

    final opened = await handler.flushDeferredViewIntent();

    expect(opened, isFalse);
    expect(container.read(viewIntentPendingProvider), payload);
    verifyNever(() => resolver.resolve(any()));
  });

  test('flushDeferredViewIntent propagates resolution failures', () async {
    container.read(viewIntentPendingProvider.notifier).defer(payload);
    when(() => resolver.resolve(payload)).thenThrow(StateError('resolution failed'));

    await expectLater(handler.flushDeferredViewIntent(), throwsStateError);

    expect(container.read(viewIntentPendingProvider), isNull);
  });

  test('init returns false when there is no initial view intent', () async {
    final consumed = await handler.init();

    expect(consumed, isFalse);
    expect(viewIntentService.consumeViewIntentCalls, 1);
    expect(viewIntentService.cleanupStaleTempFilesCalls, 1);
  });

  test('init treats native lookup errors as no usable intent', () async {
    viewIntentService.consumeError = StateError('native lookup failed');

    final consumed = await handler.init();

    expect(consumed, isFalse);
    expect(viewIntentService.consumeViewIntentCalls, 1);
  });

  test('init and initial resume share one native consumption operation', () async {
    authNotifier.setAuthenticated(false);
    final completer = Completer<ViewIntentPayload?>();
    viewIntentService.consumeCompleter = completer;

    final firstInit = handler.init();
    final secondInit = handler.init();
    final resume = handler.onAppResumed();

    await Future<void>.delayed(Duration.zero);
    expect(viewIntentService.consumeViewIntentCalls, 1);
    completer.complete(payload);

    expect(await firstInit, isTrue);
    expect(await secondInit, isTrue);
    await resume;
    expect(viewIntentService.consumeViewIntentCalls, 1);
    expect(container.read(viewIntentPendingProvider), payload);
  });

  test('resume checks after initialization remain independent and serialized', () async {
    await handler.init();
    final firstResumeCompleter = Completer<ViewIntentPayload?>();
    viewIntentService.consumeCompleter = firstResumeCompleter;

    final firstResume = handler.onAppResumed();
    final secondResume = handler.onAppResumed();

    await Future<void>.delayed(Duration.zero);
    expect(viewIntentService.consumeViewIntentCalls, 2);
    viewIntentService.consumeCompleter = null;
    firstResumeCompleter.complete(null);

    await firstResume;
    await secondResume;
    expect(viewIntentService.consumeViewIntentCalls, 3);
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

  test('onAppResumed handles attachment immediately when authenticated', () async {
    viewIntentService.consumedAttachment = payload;
    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));

    await handler.onAppResumed();

    verify(() => resolver.resolve(payload)).called(1);
    // Routes the user to [TabShell, AssetViewer] so back-press lands on the
    // main timeline — mirrors the home-screen widget navigation pattern.
    final captured = verify(() => router.replaceAll(captureAny())).captured;
    expect(captured, hasLength(1));
    final routes = captured.single as List<PageRouteInfo<dynamic>>;
    expect(routes, hasLength(2));
    expect(routes[0].routeName, TabShellRoute.name);
    expect(routes[1].routeName, AssetViewerRoute.name);
    final viewerRoute = routes[1] as AssetViewerRoute;
    final viewerArgs = viewerRoute.args as AssetViewerRouteArgs;
    expect(viewerArgs.instantTransition, isTrue);
    expect(viewerArgs.key, isA<UniqueKey>());
  });

  test('repeated warm intents use fresh asset viewer keys', () async {
    final secondPayload = ViewIntentPayload(
      path: '/tmp/second.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'local-2',
    );
    final secondAsset = _localAsset(id: 'local-2');
    final secondTimelineService = await _createReadyTimelineService([secondAsset], TimelineOrigin.deepLink);
    addTearDown(secondTimelineService.dispose);

    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolvedAsset(asset: secondAsset, timelineService: secondTimelineService));

    viewIntentService.consumedAttachment = payload;
    await handler.onAppResumed();
    viewIntentService.consumedAttachment = secondPayload;
    await handler.onAppResumed();

    final captured = verify(() => router.replaceAll(captureAny())).captured;
    expect(captured, hasLength(2));
    final firstRoutes = captured[0] as List<PageRouteInfo<dynamic>>;
    final secondRoutes = captured[1] as List<PageRouteInfo<dynamic>>;
    final firstArgs = firstRoutes[1].args as AssetViewerRouteArgs;
    final secondArgs = secondRoutes[1].args as AssetViewerRouteArgs;
    expect(firstArgs.key, isNot(secondArgs.key));
  });

  test('ordinary asset viewer routes retain the default transition', () {
    final route = AssetViewerRoute(initialIndex: 0, timelineService: deepLinkTimelineService);

    expect((route.args as AssetViewerRouteArgs).instantTransition, isFalse);
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

LocalAsset _localAsset({required String id}) {
  return LocalAsset(
    id: id,
    name: '$id.jpg',
    checksum: 'checksum-1',
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    playbackStyle: AssetPlaybackStyle.image,
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
