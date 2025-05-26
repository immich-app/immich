import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:isar/isar.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../domain/service.mock.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';
import '../test_utils.dart';

void main() {
  late AuthService sut;
  late MockAuthApiRepository authApiRepository;
  late MockAuthRepository authRepository;
  late MockApiService apiService;
  late MockNetworkService networkService;
  late MockBackgroundSyncManager backgroundSyncManager;
  late Isar db;

  setUp(() async {
    authApiRepository = MockAuthApiRepository();
    authRepository = MockAuthRepository();
    apiService = MockApiService();
    networkService = MockNetworkService();
    backgroundSyncManager = MockBackgroundSyncManager();

    sut = AuthService(
      authApiRepository,
      authRepository,
      apiService,
      networkService,
      backgroundSyncManager,
    );

    registerFallbackValue(Uri());
  });

  setUpAll(() async {
    db = await TestUtils.initIsar();
    db.writeTxnSync(() => db.clearSync());
    await StoreService.init(storeRepository: IsarStoreRepository(db));
  });

  group('validateServerUrl', () {
    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      final db = await TestUtils.initIsar();
      db.writeTxnSync(() => db.clearSync());
      await StoreService.init(storeRepository: IsarStoreRepository(db));
    });

    test('Should resolve HTTP endpoint', () async {
      const testUrl = 'http://ip:2283';
      const resolvedUrl = 'http://ip:2283/api';

      when(() => apiService.resolveAndSetEndpoint(testUrl))
          .thenAnswer((_) async => resolvedUrl);
      when(() => apiService.setDeviceInfoHeader()).thenAnswer((_) async => {});

      final result = await sut.validateServerUrl(testUrl);

      expect(result, resolvedUrl);

      verify(() => apiService.resolveAndSetEndpoint(testUrl)).called(1);
      verify(() => apiService.setDeviceInfoHeader()).called(1);
    });

    test('Should resolve HTTPS endpoint', () async {
      const testUrl = 'https://immich.domain.com';
      const resolvedUrl = 'https://immich.domain.com/api';

      when(() => apiService.resolveAndSetEndpoint(testUrl))
          .thenAnswer((_) async => resolvedUrl);
      when(() => apiService.setDeviceInfoHeader()).thenAnswer((_) async => {});

      final result = await sut.validateServerUrl(testUrl);

      expect(result, resolvedUrl);

      verify(() => apiService.resolveAndSetEndpoint(testUrl)).called(1);
      verify(() => apiService.setDeviceInfoHeader()).called(1);
    });

    test('Should throw error on invalid URL', () async {
      const testUrl = 'invalid-url';

      when(() => apiService.resolveAndSetEndpoint(testUrl))
          .thenThrow(Exception('Invalid URL'));

      expect(
        () async => await sut.validateServerUrl(testUrl),
        throwsA(isA<Exception>()),
      );

      verify(() => apiService.resolveAndSetEndpoint(testUrl)).called(1);
      verifyNever(() => apiService.setDeviceInfoHeader());
    });

    test('Should throw error on unreachable server', () async {
      const testUrl = 'https://unreachable.server';

      when(() => apiService.resolveAndSetEndpoint(testUrl))
          .thenThrow(Exception('Server is not reachable'));

      expect(
        () async => await sut.validateServerUrl(testUrl),
        throwsA(isA<Exception>()),
      );

      verify(() => apiService.resolveAndSetEndpoint(testUrl)).called(1);
      verifyNever(() => apiService.setDeviceInfoHeader());
    });
  });

  group('logout', () {
    test('Should logout user', () async {
      when(() => authApiRepository.logout()).thenAnswer((_) async => {});
      when(() => backgroundSyncManager.cancel()).thenAnswer((_) async => {});
      when(() => authRepository.clearLocalData())
          .thenAnswer((_) => Future.value(null));

      await sut.logout();

      verify(() => authApiRepository.logout()).called(1);
      verify(() => backgroundSyncManager.cancel()).called(1);
      verify(() => authRepository.clearLocalData()).called(1);
    });

    test('Should clear local data even on server error', () async {
      when(() => authApiRepository.logout())
          .thenThrow(Exception('Server error'));
      when(() => backgroundSyncManager.cancel()).thenAnswer((_) async => {});
      when(() => authRepository.clearLocalData())
          .thenAnswer((_) => Future.value(null));

      await sut.logout();

      verify(() => authApiRepository.logout()).called(1);
      verify(() => backgroundSyncManager.cancel()).called(1);
      verify(() => authRepository.clearLocalData()).called(1);
    });
  });

  group('setOpenApiServiceEndpoint', () {
    setUp(() {
      when(() => networkService.getWifiName())
          .thenAnswer((_) async => 'TestWifi');
    });

    test('Should return null if auto endpoint switching is disabled', () async {
      when(() => authRepository.getEndpointSwitchingFeature())
          .thenReturn((false));

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, isNull);
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verifyNever(() => networkService.getWifiName());
    });

    test('Should set local connection if wifi name matches', () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName()).thenReturn('TestWifi');
      when(() => authRepository.getLocalEndpoint())
          .thenReturn('http://local.endpoint');
      when(() => apiService.resolveAndSetEndpoint('http://local.endpoint'))
          .thenAnswer((_) async => 'http://local.endpoint');

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, 'http://local.endpoint');
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getLocalEndpoint()).called(1);
      verify(() => apiService.resolveAndSetEndpoint('http://local.endpoint'))
          .called(1);
    });

    test('Should set external endpoint if wifi name not matching', () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName())
          .thenReturn('DifferentWifi');
      when(() => authRepository.getExternalEndpointList()).thenReturn([
        AuxilaryEndpoint(
          url: 'https://external.endpoint',
          status: AuxCheckStatus.valid,
        ),
      ]);
      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).thenAnswer((_) async => 'https://external.endpoint/api');

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, 'https://external.endpoint/api');
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getExternalEndpointList()).called(1);
      verify(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).called(1);
    });

    test('Should set second external endpoint if the first throw any error',
        () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName())
          .thenReturn('DifferentWifi');
      when(() => authRepository.getExternalEndpointList()).thenReturn([
        AuxilaryEndpoint(
          url: 'https://external.endpoint',
          status: AuxCheckStatus.valid,
        ),
        AuxilaryEndpoint(
          url: 'https://external.endpoint2',
          status: AuxCheckStatus.valid,
        ),
      ]);

      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).thenThrow(Exception('Invalid endpoint'));
      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint2'),
      ).thenAnswer((_) async => 'https://external.endpoint2/api');

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, 'https://external.endpoint2/api');
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getExternalEndpointList()).called(1);
      verify(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint2'),
      ).called(1);
    });

    test('Should set second external endpoint if the first throw ApiException',
        () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName())
          .thenReturn('DifferentWifi');
      when(() => authRepository.getExternalEndpointList()).thenReturn([
        AuxilaryEndpoint(
          url: 'https://external.endpoint',
          status: AuxCheckStatus.valid,
        ),
        AuxilaryEndpoint(
          url: 'https://external.endpoint2',
          status: AuxCheckStatus.valid,
        ),
      ]);

      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).thenThrow(ApiException(503, 'Invalid endpoint'));
      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint2'),
      ).thenAnswer((_) async => 'https://external.endpoint2/api');

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, 'https://external.endpoint2/api');
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getExternalEndpointList()).called(1);
      verify(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint2'),
      ).called(1);
    });

    test('Should handle error when setting local connection', () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName()).thenReturn('TestWifi');
      when(() => authRepository.getLocalEndpoint())
          .thenReturn('http://local.endpoint');
      when(() => apiService.resolveAndSetEndpoint('http://local.endpoint'))
          .thenThrow(Exception('Local endpoint error'));

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, isNull);
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getLocalEndpoint()).called(1);
      verify(() => apiService.resolveAndSetEndpoint('http://local.endpoint'))
          .called(1);
    });

    test('Should handle error when setting external connection', () async {
      when(() => authRepository.getEndpointSwitchingFeature()).thenReturn(true);
      when(() => authRepository.getPreferredWifiName())
          .thenReturn('DifferentWifi');
      when(() => authRepository.getExternalEndpointList()).thenReturn([
        AuxilaryEndpoint(
          url: 'https://external.endpoint',
          status: AuxCheckStatus.valid,
        ),
      ]);
      when(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).thenThrow(Exception('External endpoint error'));

      final result = await sut.setOpenApiServiceEndpoint();

      expect(result, isNull);
      verify(() => authRepository.getEndpointSwitchingFeature()).called(1);
      verify(() => networkService.getWifiName()).called(1);
      verify(() => authRepository.getPreferredWifiName()).called(1);
      verify(() => authRepository.getExternalEndpointList()).called(1);
      verify(
        () => apiService.resolveAndSetEndpoint('https://external.endpoint'),
      ).called(1);
    });
  });
}
