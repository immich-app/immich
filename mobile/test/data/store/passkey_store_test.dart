import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../riverpod_mocks.dart';
import '../../service.mocks.dart';

class _MockPasskeyApiRepository extends Mock implements PasskeyApiRepository {}

class _MockPasskeyHostApi extends Mock implements PasskeyHostApi {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late _MockPasskeyApiRepository api;
  late _MockPasskeyHostApi hostApi;
  late Future<String> Function() page;
  late List<String> opened;

  setUp(() {
    api = _MockPasskeyApiRepository();
    hostApi = _MockPasskeyHostApi();
    opened = [];
    when(() => api.getConfig()).thenAnswer((_) async => (enabled: true, origin: 'https://demo.immich.app'));
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('flutter_web_auth_2'),
      (call) async {
        opened.add((call.arguments as Map)['url']);
        return page();
      },
    );
  });

  ProviderContainer createContainer({bool supportsPasskeys = true}) {
    final version = ServerVersion(major: 2, minor: 0, patch: 0, supportsPasskeys: supportsPasskeys);
    final container = ProviderContainer(
      overrides: [
        passkeyApiRepositoryProvider.overrideWithValue(api),
        passkeyHostApiProvider.overrideWithValue(hostApi),
        serverInfoProvider.overrideWith((ref) => StubServerInfoNotifier(MockServerInfoService(), version: version)),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  group('enabled', () {
    test('is true when the OS supports passkeys and the server has them on', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);

      expect(await createContainer().read(Store.passkeys.enabled().future), isTrue);
    });

    test('is false when the OS has no passkeys', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => false);

      expect(await createContainer().read(Store.passkeys.enabled().future), isFalse);
      verifyNever(() => api.getConfig());
    });

    test('is false below the passkeys feature level, without asking the server', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);

      expect(await createContainer(supportsPasskeys: false).read(Store.passkeys.enabled().future), isFalse);
      verifyNever(() => api.getConfig());
    });

    test('is false for a server without https', () async {
      when(() => api.getConfig()).thenAnswer((_) async => (enabled: true, origin: 'http://192.168.1.2:2283'));
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);

      expect(await createContainer().read(Store.passkeys.enabled().future), isFalse);
    });

    test('is false when the passkey config request fails', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);
      when(() => api.getConfig()).thenThrow(ApiException(500, 'Internal Server Error'));

      expect(await createContainer().read(Store.passkeys.enabled().future), isFalse);
    });
  });

  group('create', () {
    setUp(() {
      when(() => api.startRegistration(any())).thenAnswer((_) async => {'challenge': 'abc'});
      when(() => api.finishRegistration(any(), any())).thenAnswer((_) async {});
    });

    test('opens the server options on the server page and sends the credential back to the server', () async {
      page = () async => 'app.immich:///passkey-callback?credential=%7B%22id%22%3A%22credential%22%7D';

      expect(await createContainer().read(Store.passkeys).create(), isTrue);
      expect(opened, ['https://demo.immich.app/auth/passkey#registration=%7B%22challenge%22%3A%22abc%22%7D']);
      verify(() => api.startRegistration('https://demo.immich.app'));
      expect(verify(() => api.finishRegistration('https://demo.immich.app', captureAny())).captured.single, {
        'id': 'credential',
      });
    });

    test('does not finish when the user cancels', () async {
      page = () async => 'app.immich:///passkey-callback';

      expect(await createContainer().read(Store.passkeys).create(), isFalse);
      verifyNever(() => api.finishRegistration(any(), any()));
    });
  });

  group('login', () {
    const login = LoginResponse(
      accessToken: 'token',
      isAdmin: false,
      name: 'user',
      profileImagePath: '',
      shouldChangePassword: false,
      userEmail: 'user@immich.app',
      userId: 'user-id',
    );

    setUp(() {
      when(() => api.exchangeCode(any(), any())).thenAnswer((_) async => login);
    });

    test("returns the server's login for the code and the verifier of the code challenge", () async {
      page = () async => 'app.immich:///passkey-callback?code=abc';

      expect(await createContainer().read(Store.passkeys).login(), login);
      final codeVerifier = verify(() => api.exchangeCode('abc', captureAny())).captured.single;
      final codeChallenge = base64Url.encode(sha256.convert(utf8.encode(codeVerifier)).bytes).replaceAll('=', '');
      expect(opened, ['https://demo.immich.app/auth/passkey#codeChallenge=$codeChallenge']);
    });

    test('does not finish when the user closes the browser', () async {
      page = () => throw PlatformException(code: 'CANCELED');

      expect(await createContainer().read(Store.passkeys).login(), isNull);
      verifyNever(() => api.exchangeCode(any(), any()));
    });

    test('throws the error the page hands back', () async {
      page = () async => 'app.immich:///passkey-callback?error=NotSupportedError';

      await expectLater(createContainer().read(Store.passkeys).login(), throwsA(isA<Exception>()));
      verifyNever(() => api.exchangeCode(any(), any()));
    });
  });
}
