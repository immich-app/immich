import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/services/passkey.service.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

class _MockPasskeyApiRepository extends Mock implements PasskeyApiRepository {}

class _MockPasskeyHostApi extends Mock implements PasskeyHostApi {}

void main() {
  late _MockPasskeyApiRepository apiRepository;
  late _MockPasskeyHostApi hostApi;
  late PasskeyService sut;

  setUp(() {
    apiRepository = _MockPasskeyApiRepository();
    hostApi = _MockPasskeyHostApi();
    sut = PasskeyService(apiRepository, hostApi);
  });

  group('isEnabled', () {
    test('is true when the OS supports passkeys and the server has them on', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);
      when(() => apiRepository.isEnabled()).thenAnswer((_) async => true);

      expect(await sut.isEnabled(), isTrue);
    });

    test('is false when the OS has no passkeys', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => false);

      expect(await sut.isEnabled(), isFalse);
      verifyNever(() => apiRepository.isEnabled());
    });

    test('is false when the server has no public config', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);
      when(() => apiRepository.isEnabled()).thenThrow(ApiException(404, 'Not Found'));

      expect(await sut.isEnabled(), isFalse);
    });
  });

  group('register', () {
    setUp(() {
      when(() => apiRepository.startRegistration()).thenAnswer((_) async => '{"challenge":"abc"}');
      when(() => apiRepository.finishRegistration(any())).thenAnswer((_) async {});
    });

    test('sends the server options to the platform and the credential back to the server', () async {
      when(() => hostApi.register('{"challenge":"abc"}')).thenAnswer((_) async => '{"id":"credential"}');

      expect(await sut.register(), isTrue);
      verify(() => apiRepository.finishRegistration('{"id":"credential"}')).called(1);
    });

    test('does not finish when the user cancels', () async {
      when(() => hostApi.register(any())).thenAnswer((_) async => null);

      expect(await sut.register(), isFalse);
      verifyNever(() => apiRepository.finishRegistration(any()));
    });
  });

  group('login', () {
    final login = LoginResponseDto(
      accessToken: 'token',
      isAdmin: false,
      isOnboarded: true,
      name: 'user',
      profileImagePath: '',
      shouldChangePassword: false,
      userEmail: 'user@immich.app',
      userId: 'user-id',
    );

    setUp(() {
      when(() => apiRepository.startAuthentication()).thenAnswer((_) async => '{"challenge":"abc"}');
      when(() => apiRepository.finishAuthentication(any())).thenAnswer((_) async => login);
    });

    test("returns the server's login for the credential", () async {
      when(() => hostApi.authenticate('{"challenge":"abc"}')).thenAnswer((_) async => '{"id":"credential"}');

      expect(await sut.login(), login);
      verify(() => apiRepository.finishAuthentication('{"id":"credential"}')).called(1);
    });

    test('does not finish when the user cancels', () async {
      when(() => hostApi.authenticate(any())).thenAnswer((_) async => null);

      expect(await sut.login(), isNull);
      verifyNever(() => apiRepository.finishAuthentication(any()));
    });
  });
}
