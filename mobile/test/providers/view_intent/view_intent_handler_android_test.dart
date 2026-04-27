import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_android.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_main_timeline_ready.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
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

bool _pageRoutePredicate(PageRouteInfo<dynamic> route) => false;

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
    registerFallbackValue(_pageRoutePredicate);
    registerFallbackValue(_localAsset(id: 'fallback'));
    registerFallbackValue(<String>[]);
    registerFallbackValue(FakeTimelineService());
  });

  setUp(() async {
    viewIntentService = TestViewIntentService();
    resolver = MockViewIntentAssetResolver();
    router = MockAppRouter();
    payload = ViewIntentPayload(path: '/tmp/incoming.jpg', mimeType: 'image/jpeg', localAssetId: 'local-1');
    deepLinkAsset = _localAsset(id: 'local-1');
    deepLinkTimelineService = await _createReadyTimelineService([deepLinkAsset], TimelineOrigin.deepLink);

    when(() => router.removeWhere(any())).thenReturn(false);
    when(() => router.push(any())).thenAnswer((_) async => null);

    container = ProviderContainer(
      overrides: [
        viewIntentServiceProvider.overrideWithValue(viewIntentService),
        viewIntentAssetResolverProvider.overrideWithValue(resolver),
        appRouterProvider.overrideWithValue(router),
        timelineServiceProvider.overrideWithValue(deepLinkTimelineService),
        timelineUsersProvider.overrideWith((ref) => Stream.value(['user-1'])),
        authProvider.overrideWith((ref) {
          authNotifier = TestAuthNotifier(ref, _authState(isAuthenticated: true));
          return authNotifier;
        }),
      ],
    );

    authNotifier = container.read(authProvider.notifier) as TestAuthNotifier;
    await container.read(timelineUsersProvider.future);
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
    verifyNever(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    );
  });

  testWidgets('flushDeferredViewIntent waits for main timeline readiness before flushing pending attachment', (
    tester,
  ) async {
    authNotifier.setAuthenticated(false);
    container.read(viewIntentPendingProvider.notifier).defer(payload);
    authNotifier.setAuthenticated(true);

    when(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    ).thenAnswer((_) async {
      return ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService, initialIndex: 0);
    });

    unawaited(handler.flushDeferredViewIntent());
    await tester.pump();

    expect(container.read(viewIntentPendingProvider), payload);
    verifyNever(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    );

    container.read(viewIntentMainTimelineReadyProvider.notifier).markMountedOnce();
    await tester.pump();
    await tester.pump();
    await tester.idle();

    expect(container.read(viewIntentPendingProvider), isNull);
    verify(
      () => resolver.resolve(payload, timelineUsers: ['user-1'], mainTimelineService: deepLinkTimelineService),
    ).called(1);
  });

  test('flushDeferredViewIntent does nothing when there is no pending attachment', () async {
    await handler.flushDeferredViewIntent();

    verifyNever(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    );
  });

  test('onAppResumed cleans stale temp files when no attachment is present', () async {
    viewIntentService.consumedAttachment = null;

    await handler.onAppResumed();

    expect(viewIntentService.cleanupStaleTempFilesCalls, 1);
    verifyNever(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    );
  });

  test('onAppResumed does not clean stale temp files while pending attachment exists', () async {
    viewIntentService.consumedAttachment = null;
    container.read(viewIntentPendingProvider.notifier).defer(payload);

    await handler.onAppResumed();

    expect(viewIntentService.cleanupStaleTempFilesCalls, 0);
    verifyNever(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    );
  });

  testWidgets('onAppResumed handles attachment immediately when authenticated', (tester) async {
    viewIntentService.consumedAttachment = payload;
    when(
      () => resolver.resolve(
        payload,
        timelineUsers: any(named: 'timelineUsers'),
        mainTimelineService: any(named: 'mainTimelineService'),
      ),
    ).thenAnswer(
      (_) async =>
          ViewIntentResolvedAsset(asset: deepLinkAsset, timelineService: deepLinkTimelineService, initialIndex: 0),
    );

    unawaited(handler.onAppResumed());
    await tester.pump();
    await tester.pump();
    await tester.pump();
    await tester.idle();

    verify(
      () => resolver.resolve(payload, timelineUsers: ['user-1'], mainTimelineService: deepLinkTimelineService),
    ).called(1);
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

  if (!timelineService.isReady) {
    await timelineService.watchStatus().firstWhere((status) => status == TimelineStatus.ready);
  }

  return timelineService;
}
