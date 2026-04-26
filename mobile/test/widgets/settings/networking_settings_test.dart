import 'package:drift/drift.dart' as drift;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/repositories/network.repository.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';
import 'package:immich_mobile/services/network.service.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/networking_settings.dart';
import 'package:mocktail/mocktail.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../test_utils.dart';
import '../../widget_tester_extensions.dart';

class MockNetworkRepository extends Mock implements NetworkRepository {}

class MockPermissionRepository extends Mock implements IPermissionRepository {}

class MockAuthNotifier extends StateNotifier<AuthState> with Mock implements AuthNotifier {
  MockAuthNotifier()
    : super(
        const AuthState(
          deviceId: '',
          userId: '',
          userEmail: '',
          name: '',
          profileImagePath: '',
          isAdmin: false,
          isAuthenticated: false,
        ),
      );
}

void main() {
  late Drift db;
  late MockAuthNotifier authNotifier;
  late MockNetworkRepository networkRepository;
  late MockPermissionRepository permissionRepository;
  late NetworkService networkService;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    TestUtils.init();
    db = Drift(drift.DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: DriftStoreRepository(db));
  });

  setUp(() async {
    await Store.clear();
    await Store.put(StoreKey.autoEndpointSwitching, true);

    authNotifier = MockAuthNotifier();
    networkRepository = MockNetworkRepository();
    permissionRepository = MockPermissionRepository();
    networkService = NetworkService(networkRepository, permissionRepository);

    when(() => authNotifier.getSavedWifiName()).thenReturn(null);
    when(() => authNotifier.getSavedLocalEndpoint()).thenReturn(null);
  });

  tearDownAll(() async {
    await Store.clear();
    await db.close();
  });

  testWidgets('foreground location disclosure can be declined before requesting permission', (tester) async {
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => false);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => false);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [
        authProvider.overrideWith((ref) => authNotifier),
        networkServiceProvider.overrideWithValue(networkService),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsOneWidget);
    expect(find.text('cancel'), findsOneWidget);
    expect(find.text('grant_permission'), findsOneWidget);

    await tester.tap(find.text('cancel'));
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsNothing);
    verifyNever(() => permissionRepository.requestLocationWhenInUsePermission());
    verifyNever(() => permissionRepository.requestLocationAlwaysPermission());
    verifyNever(() => permissionRepository.openSettings());
    expect(find.text('background_location_permission'), findsNothing);
  });

  testWidgets('background location disclosure can be declined without opening settings', (tester) async {
    await Store.put(StoreKey.autoEndpointLocationDisclosureAccepted, true);
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => true);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => false);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [
        authProvider.overrideWith((ref) => authNotifier),
        networkServiceProvider.overrideWithValue(networkService),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('background_location_permission'), findsOneWidget);
    expect(find.text('cancel'), findsOneWidget);
    expect(find.text('grant_permission'), findsOneWidget);

    await tester.tap(find.text('cancel'));
    await tester.pumpAndSettle();

    expect(find.text('background_location_permission'), findsNothing);
    verifyNever(() => permissionRepository.requestLocationAlwaysPermission());
    verifyNever(() => permissionRepository.openSettings());
  });

  testWidgets('background location denial opens settings after disclosure grant action', (tester) async {
    await Store.put(StoreKey.autoEndpointLocationDisclosureAccepted, true);
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => true);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => false);
    when(() => permissionRepository.requestLocationAlwaysPermission()).thenAnswer((_) async => false);
    when(() => permissionRepository.openSettings()).thenAnswer((_) async => true);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [
        authProvider.overrideWith((ref) => authNotifier),
        networkServiceProvider.overrideWithValue(networkService),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('background_location_permission'), findsOneWidget);

    await tester.tap(find.text('grant_permission'));
    await tester.pumpAndSettle();

    verify(() => permissionRepository.requestLocationAlwaysPermission()).called(1);
    verify(() => permissionRepository.openSettings()).called(1);
  });

  testWidgets('automatic endpoint disclosure is required even when location permissions already exist', (tester) async {
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => true);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => true);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [
        authProvider.overrideWith((ref) => authNotifier),
        networkServiceProvider.overrideWithValue(networkService),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsOneWidget);

    await tester.tap(find.text('grant_permission'));
    await tester.pumpAndSettle();

    expect(find.text('background_location_permission'), findsOneWidget);

    await tester.tap(find.text('grant_permission'));
    await tester.pumpAndSettle();

    expect(Store.get(StoreKey.autoEndpointLocationDisclosureAccepted), isTrue);
    verifyNever(() => permissionRepository.requestLocationWhenInUsePermission());
    verifyNever(() => permissionRepository.requestLocationAlwaysPermission());
    verifyNever(() => permissionRepository.openSettings());
  });

  testWidgets('use current connection does not read Wi-Fi after endpoint disclosure decline', (tester) async {
    when(() => permissionRepository.hasLocationWhenInUsePermission()).thenAnswer((_) async => true);
    when(() => permissionRepository.hasLocationAlwaysPermission()).thenAnswer((_) async => true);

    await tester.pumpConsumerWidget(
      const NetworkingSettings(),
      overrides: [
        authProvider.overrideWith((ref) => authNotifier),
        networkServiceProvider.overrideWithValue(networkService),
      ],
    );
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsOneWidget);

    await tester.tap(find.text('cancel'));
    await tester.pumpAndSettle();

    expect(find.text('location_permission'), findsNothing);

    await tester.tap(find.text('use_current_connection'));
    await tester.pumpAndSettle();

    verifyNever(() => networkRepository.getWifiName());
    verifyNever(() => authNotifier.saveWifiName(any()));
    expect(Store.get(StoreKey.autoEndpointLocationDisclosureAccepted, false), isFalse);
  });
}
