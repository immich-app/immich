import 'package:auto_route/auto_route.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/sync_status_and_actions.dart';
import 'package:mocktail/mocktail.dart';

import '../../../infrastructure/repository.mock.dart';
import '../../../service.mocks.dart';
import '../../../unit/presentation/presentation_context.dart';

class MockAppRouter extends Mock implements AppRouter {}

class TestAuthNotifier extends AuthNotifier {
  TestAuthNotifier(Ref ref, [this._error])
    : super(
        MockAuthService(),
        MockApiService(),
        MockUserService(),
        MockSecureStorageService(),
        MockWidgetService(),
        ref,
      );

  final Exception? _error;
  bool loggedOut = false;

  @override
  Future<void> logout() async {
    loggedOut = true;
    if (_error != null) {
      throw _error;
    }
  }
}

void main() {
  late PresentationContext context;

  setUpAll(() => registerFallbackValue(<PageRouteInfo>[]));
  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  testWidgets('keeps the reset button reachable when the counts fail', (tester) async {
    final drift = MockDrift();
    when(() => drift.localAlbumRepository).thenReturn(MockLocalAlbumRepository());
    when(() => drift.memoryRepository).thenReturn(MockMemoryRepository());
    when(() => context.service.asset.service.getAssetCounts()).thenThrow(Exception('corrupt db'));

    await tester.pumpTestWidget(
      context,
      const SyncStatusAndActions(),
      overrides: [driftProvider.overrideWithValue(drift)],
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Something went wrong, reset the local database with the button below'), findsOneWidget);
    expect(find.text('Reset SQLite Database'), findsOneWidget);
  });

  group('reset', () {
    late MockDrift drift;
    late MockAppRouter router;
    TestAuthNotifier? auth;

    Future<void> confirmReset(WidgetTester tester, [Exception? logoutError]) async {
      drift = MockDrift();
      router = MockAppRouter();
      when(() => drift.localAlbumRepository).thenReturn(MockLocalAlbumRepository());
      when(() => drift.memoryRepository).thenReturn(MockMemoryRepository());
      when(drift.reset).thenAnswer((_) async {});
      when(() => router.replaceAll(any())).thenAnswer((_) async {});
      when(() => context.service.asset.service.getAssetCounts()).thenThrow(Exception('corrupt db'));
      await tester.runAsync(() => StoreService.I.put(StoreKey.serverEndpoint, PresentationContext.serverEndpoint));

      await tester.pumpTestWidget(
        context,
        const SyncStatusAndActions(),
        overrides: [
          driftProvider.overrideWithValue(drift),
          appRouterProvider.overrideWithValue(router),
          authProvider.overrideWith((ref) => auth = TestAuthNotifier(ref, logoutError)),
        ],
      );
      await tester.tap(find.text('Reset SQLite Database'));
      await tester.pumpAndSettle();
      await tester.runAsync(() async {
        await tester.tap(find.text('Confirm'));
        await untilCalled(() => router.replaceAll(any()));
      });
      await tester.pump();
    }

    void expectWipedOnLoginPage() {
      verify(drift.reset).called(1);
      expect(StoreService.I.tryGet(StoreKey.serverEndpoint), isNull);
      final routes = verify(() => router.replaceAll(captureAny())).captured.single as List<PageRouteInfo>;
      expect(routes.single.routeName, LoginRoute.name);
    }

    testWidgets('logs out, empties the store and opens the login page', (tester) async {
      await confirmReset(tester);

      expect(auth?.loggedOut, isTrue);
      expectWipedOnLoginPage();
    });

    testWidgets('still empties the store and opens the login page when logout fails', (tester) async {
      await confirmReset(tester, Exception('settings write failed'));

      expect(auth?.loggedOut, isTrue);
      expectWipedOnLoginPage();
    });
  });
}
