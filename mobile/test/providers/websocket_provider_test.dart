import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:immich_mobile/services/secure_storage.service.dart';
import 'package:immich_mobile/services/widget.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:socket_io_client/socket_io_client.dart';

class MockAuthService extends Mock implements AuthService {}

class MockApiService extends Mock implements ApiService {}

class MockUserService extends Mock implements UserService {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockWidgetService extends Mock implements WidgetService {}

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
}

class _FakeSocket extends Fake implements Socket {
  int disposeCount = 0;
  final Map<String, dynamic Function(dynamic)> handlers = {};

  @override
  Function() on(String event, dynamic Function(dynamic) handler) {
    handlers[event] = handler;
    return () {};
  }

  @override
  void dispose() => disposeCount++;
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late Drift db;

  setUpAll(() async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async => 'test',
    );
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
    await Store.put(StoreKey.serverEndpoint, 'http://test-server.com');
  });

  tearDownAll(() async {
    await db.close();
  });

  ProviderContainer buildContainer(List<_FakeSocket> created, {required bool isAuthenticated}) {
    return ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => TestAuthNotifier(ref, _authState(isAuthenticated: isAuthenticated))),
        websocketProvider.overrideWith(
          (ref) => WebsocketNotifier(
            ref,
            createSocket: (_, _) {
              final socket = _FakeSocket();
              created.add(socket);
              return socket;
            },
          ),
        ),
      ],
    );
  }

  test('connect creates a socket and holds it in state before it connects', () {
    final created = <_FakeSocket>[];
    final container = buildContainer(created, isAuthenticated: true);
    addTearDown(container.dispose);

    container.read(websocketProvider.notifier).connect();

    expect(created, hasLength(1));
    expect(container.read(websocketProvider).socket, isNotNull);
    expect(container.read(websocketProvider).isConnected, isFalse);
  });

  test('connect does not create a second socket while one already exists', () {
    final created = <_FakeSocket>[];
    final container = buildContainer(created, isAuthenticated: true);
    addTearDown(container.dispose);

    final notifier = container.read(websocketProvider.notifier);
    notifier.connect();
    notifier.connect();

    expect(created, hasLength(1));
  });

  test('disconnect disposes a socket that never connected (unreachable server)', () {
    final created = <_FakeSocket>[];
    final container = buildContainer(created, isAuthenticated: true);
    addTearDown(container.dispose);

    final notifier = container.read(websocketProvider.notifier);
    notifier.connect();
    notifier.disconnect();

    expect(created.single.disposeCount, 1);
    expect(container.read(websocketProvider).socket, isNull);
  });

  test('socket stays disposable after an error so disconnect can stop it', () {
    final created = <_FakeSocket>[];
    final container = buildContainer(created, isAuthenticated: true);
    addTearDown(container.dispose);

    final notifier = container.read(websocketProvider.notifier);
    notifier.connect();

    // Simulate the cert-error the reporter hits off-network.
    created.single.handlers['error']?.call('CERTIFICATE_VERIFY_FAILED');
    expect(container.read(websocketProvider).socket, isNotNull);

    notifier.disconnect();
    expect(created.single.disposeCount, 1);
    expect(container.read(websocketProvider).socket, isNull);
  });

  test('connect is a no-op when not authenticated', () {
    final created = <_FakeSocket>[];
    final container = buildContainer(created, isAuthenticated: false);
    addTearDown(container.dispose);

    container.read(websocketProvider.notifier).connect();

    expect(created, isEmpty);
    expect(container.read(websocketProvider).socket, isNull);
  });
}
