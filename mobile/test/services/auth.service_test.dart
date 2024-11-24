import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/auth.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';
import '../test_utils.dart';

void main() {
  late AuthService sut;
  late MockAuthApiRepository authApiRepository;
  late MockAuthRepository authRepository;
  late MockApiService apiService;

  setUp(() async {
    authApiRepository = MockAuthApiRepository();
    authRepository = MockAuthRepository();
    apiService = MockApiService();
    sut = AuthService(authApiRepository, authRepository, apiService);
  });

  group('validateServerUrl', () {
    setUpAll(() async {
      WidgetsFlutterBinding.ensureInitialized();
      final db = await TestUtils.initIsar();
      db.writeTxnSync(() => db.clearSync());
      Store.init(db);
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
      when(() => authApiRepository.logout()).thenAnswer(
        (_) async => LogoutResponseDto(
          redirectUri: '',
          successful: true,
        ),
      );
      when(() => authRepository.clearLocalData())
          .thenAnswer((_) => Future.value(null));

      await sut.logout();

      verify(() => authApiRepository.logout()).called(1);
      verify(() => authRepository.clearLocalData()).called(1);
    });

    test('Should clear local data even on server error', () async {
      when(() => authApiRepository.logout())
          .thenThrow(Exception('Server error'));
      when(() => authRepository.clearLocalData())
          .thenAnswer((_) => Future.value(null));

      await sut.logout();

      verify(() => authApiRepository.logout()).called(1);
      verify(() => authRepository.clearLocalData()).called(1);
    });
  });
}
