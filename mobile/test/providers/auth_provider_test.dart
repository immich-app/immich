import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:immich_mobile/services/widget.service.dart';
import 'package:mocktail/mocktail.dart';

class MockApiService extends Mock implements ApiService {}

class MockAuthService extends Mock implements AuthService {}

class MockRef extends Mock implements Ref {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockUserService extends Mock implements UserService {}

class MockWidgetService extends Mock implements WidgetService {}

void main() {
  late AuthNotifier sut;
  late MockAuthService authService;
  late MockApiService apiService;
  late MockUserService userService;
  late MockSecureStorageService secureStorageService;
  late MockWidgetService widgetService;
  late MockRef ref;
  late Drift db;
  late UserDto demoUser;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  setUp(() async {
    await Store.clear();
    await Store.put(StoreKey.serverEndpoint, 'https://demo.opennoodle.de/api');
    await Store.put(StoreKey.deviceId, 'device-id');

    authService = MockAuthService();
    apiService = MockApiService();
    userService = MockUserService();
    secureStorageService = MockSecureStorageService();
    widgetService = MockWidgetService();
    ref = MockRef();
    demoUser = UserDto(
      id: 'demo-user-id',
      email: 'demo@gallery.app',
      name: 'Demo User',
      profileChangedAt: DateTime.utc(2026),
    );

    when(() => apiService.updateHeaders()).thenAnswer((_) async {});
    when(() => userService.tryGetMyUser()).thenReturn(null);
    when(() => userService.refreshMyUser()).thenAnswer((_) async => demoUser);
    when(
      () => widgetService.writeCredentials('https://demo.opennoodle.de/api', 'demo-token', null),
    ).thenAnswer((_) async {});

    sut = AuthNotifier(authService, apiService, userService, secureStorageService, widgetService, ref);
  });

  tearDownAll(() async {
    await db.close();
  });

  test('demoLogin saves demo token and authenticates state', () async {
    const response = LoginResponse(
      accessToken: 'demo-token',
      userId: 'demo-user-id',
      userEmail: 'demo@gallery.app',
      name: 'Demo User',
      profileImagePath: '',
      isAdmin: false,
      shouldChangePassword: false,
    );
    when(() => authService.demoLogin()).thenAnswer((_) async => response);

    final result = await sut.demoLogin();

    expect(result, response);
    expect(Store.get(StoreKey.accessToken), 'demo-token');
    expect(Store.get(StoreKey.deviceIdHash), isA<int>());
    expect(sut.state.isAuthenticated, isTrue);
    expect(sut.state.userId, 'demo-user-id');
    expect(sut.state.userEmail, 'demo@gallery.app');
    expect(sut.state.name, 'Demo User');

    verify(() => authService.demoLogin()).called(1);
    verify(() => apiService.updateHeaders()).called(1);
    verify(() => userService.refreshMyUser()).called(1);
    verify(() => widgetService.writeCredentials('https://demo.opennoodle.de/api', 'demo-token', null)).called(1);
  });
}
