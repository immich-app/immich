import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart' as pigeon;
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/view_intent/active_view_intent_payload_provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler_android.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:immich_mobile/services/toast.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:immich_mobile/services/view_intent_asset_resolver.service.dart';
import 'package:immich_mobile/services/widget.service.dart';
import 'package:mocktail/mocktail.dart';

class MockViewIntentHostApi extends Mock implements ViewIntentHostApi {}

class MockViewIntentAssetResolver extends Mock implements ViewIntentAssetResolver {}

class MockAssetService extends Mock implements AssetService {}

class MockTimelineFactory extends Mock implements TimelineFactory {}

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
  PlatformException? consumeError;
  int cleanupStaleTempFilesCalls = 0;
  int cleanupManagedTempFileCalls = 0;
  final List<String> managedTempPaths = [];
  final List<String> cleanedManagedTempPaths = [];

  TestViewIntentService() : super(MockViewIntentHostApi());

  @override
  Future<ViewIntentPayload?> consumeViewIntent() async {
    if (consumeError case final PlatformException error) {
      throw error;
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

  @override
  Future<void> cleanupManagedTempFileIfCurrent(String path) async {
    cleanedManagedTempPaths.add(path);
  }
}

class TestToastService extends ToastService {
  final List<String> errorMessages = [];

  @override
  void error(String message, {ToastOption? toast}) {
    errorMessages.add(message);
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
  late MockTimelineFactory timelineFactory;
  late MockAppRouter router;
  late TestAuthNotifier authNotifier;
  late TestToastService toastService;
  late ProviderContainer container;
  late AndroidViewIntentHandler handler;
  late ViewIntentPayload payload;
  late LocalAsset deepLinkAsset;
  late TimelineService deepLinkTimelineService;

  setUpAll(() {
    registerFallbackValue(FakePageRouteInfo());
    registerFallbackValue(<PageRouteInfo<dynamic>>[]);
    registerFallbackValue(FakeTimelineService());
    registerFallbackValue(<BaseAsset>[]);
    registerFallbackValue(_remoteAsset(id: 'fallback-remote', localId: 'fallback-local'));
    registerFallbackValue(
      ViewIntentPayload(path: '/tmp/fallback.jpg', mimeType: 'image/jpeg', localAssetId: 'fallback'),
    );
  });

  setUp(() async {
    viewIntentService = TestViewIntentService();
    toastService = TestToastService();
    resolver = MockViewIntentAssetResolver();
    assetService = MockAssetService();
    timelineFactory = MockTimelineFactory();
    router = MockAppRouter();
    payload = ViewIntentPayload(path: '/tmp/incoming.jpg', mimeType: 'image/jpeg', localAssetId: 'local-1');
    deepLinkAsset = _localAsset(id: 'local-1');
    deepLinkTimelineService = await _createReadyTimelineService([deepLinkAsset], TimelineOrigin.deepLink);

    when(() => router.replaceAll(any())).thenAnswer((_) async {});
    when(() => router.replace(any())).thenAnswer((_) async => null);
    when(() => router.push<Object?>(any())).thenAnswer((_) async => null);
    when(() => assetService.watchAsset(any())).thenAnswer((_) => const Stream.empty());

    container = ProviderContainer(
      overrides: [
        viewIntentServiceProvider.overrideWithValue(viewIntentService),
        viewIntentAssetResolverProvider.overrideWithValue(resolver),
        assetServiceProvider.overrideWithValue(assetService),
        timelineFactoryProvider.overrideWithValue(timelineFactory),
        toastServiceProvider.overrideWithValue(toastService),
        appRouterProvider.overrideWithValue(router),
        authProvider.overrideWith((ref) {
          authNotifier = TestAuthNotifier(ref, _authState(isAuthenticated: true));
          return authNotifier;
        }),
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
      return ViewIntentResolution(asset: deepLinkAsset, timelineService: deepLinkTimelineService);
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

  test('onAppResumed returns to the main screen when the incoming view intent is unavailable', () async {
    viewIntentService.consumeError = PlatformException(code: pigeon.viewIntentUnavailableErrorCode);

    await handler.onAppResumed();

    expect(toastService.errorMessages, [StaticTranslations.instance.asset_not_found_on_device_android]);
    verify(() => router.replaceAll([const TabShellRoute()])).called(1);
    verifyNever(() => resolver.resolve(any()));
  });

  testWidgets('onAppResumed handles attachment immediately when authenticated', (tester) async {
    viewIntentService.consumedAttachment = payload;
    when(
      () => resolver.resolve(payload),
    ).thenAnswer((_) async => ViewIntentResolution(asset: deepLinkAsset, timelineService: deepLinkTimelineService));

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
    ).thenAnswer((_) async => ViewIntentResolution(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolution(asset: secondAsset, timelineService: secondTimelineService));

    await handler.handle(payload);
    expect(container.read(assetViewerProvider).currentAsset, deepLinkAsset);
    expect(container.read(activeViewIntentPayloadProvider), isNull);

    await handler.handle(secondPayload);

    expect(container.read(assetViewerProvider).currentAsset, secondAsset);
    expect(container.read(activeViewIntentPayloadProvider), isNull);
    verify(() => resolver.resolve(payload)).called(1);
    verify(() => resolver.resolve(secondPayload)).called(1);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(2);
    verifyNever(() => router.replace(any()));
    verifyNever(() => router.replaceAll(any()));
  });

  test('a slower view intent cannot replace a newer one', () async {
    final firstResolution = Completer<ViewIntentResolution>();
    final secondPayload = ViewIntentPayload(
      path: '/tmp/incoming-b.jpg',
      mimeType: 'image/jpeg',
      localAssetId: 'local-2',
    );
    final secondAsset = _localAsset(id: 'local-2');
    final secondTimelineService = await _createReadyTimelineService([secondAsset], TimelineOrigin.deepLink);
    addTearDown(secondTimelineService.dispose);

    when(() => resolver.resolve(payload)).thenAnswer((_) => firstResolution.future);
    when(
      () => resolver.resolve(secondPayload),
    ).thenAnswer((_) async => ViewIntentResolution(asset: secondAsset, timelineService: secondTimelineService));

    final firstHandle = handler.handle(payload);
    await pumpEventQueue();
    await handler.handle(secondPayload);

    firstResolution.complete(ViewIntentResolution(asset: deepLinkAsset, timelineService: deepLinkTimelineService));
    await firstHandle;

    expect(container.read(assetViewerProvider).currentAsset, secondAsset);
    expect(container.read(activeViewIntentPayloadProvider), isNull);
    verify(() => router.popUntilRoot()).called(2);
    verify(() => router.push<Object?>(any())).called(1);
  });

  test('closing a file-backed view intent clears only its session state', () async {
    const path = '/tmp/view_intent_1.jpg';
    final routeClosed = Completer<Object?>();
    when(() => router.push<Object?>(any())).thenAnswer((_) => routeClosed.future);
    when(() => resolver.resolve(payload)).thenAnswer(
      (_) async => ViewIntentResolution(
        asset: deepLinkAsset,
        timelineService: deepLinkTimelineService,
        viewIntentFilePath: path,
      ),
    );

    final handling = handler.handle(payload);
    await pumpEventQueue();

    expect(container.read(activeViewIntentPayloadProvider), same(payload));
    expect(container.read(viewIntentFilePathProvider), path);

    routeClosed.complete(null);
    await handling;

    expect(container.read(activeViewIntentPayloadProvider), isNull);
    expect(container.read(viewIntentFilePathProvider), isNull);
    expect(viewIntentService.cleanedManagedTempPaths, [path]);
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

RemoteAsset _remoteAsset({required String id, required String? localId, DateTime? deletedAt}) {
  return RemoteAsset(
    id: id,
    localId: localId,
    ownerId: 'user-1',
    name: '$id.jpg',
    checksum: 'checksum-1',
    type: AssetType.image,
    createdAt: DateTime(2026, 4, 20),
    updatedAt: DateTime(2026, 4, 20),
    deletedAt: deletedAt,
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
