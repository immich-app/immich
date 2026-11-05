import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/data/store.dart';
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
  late _MockPasskeyApiRepository api;
  late _MockPasskeyHostApi hostApi;

  setUp(() {
    api = _MockPasskeyApiRepository();
    hostApi = _MockPasskeyHostApi();
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
      when(() => api.isEnabled()).thenAnswer((_) async => true);

      expect(await createContainer().read(Store.passkeys.enabled().future), isTrue);
    });

    test('is false when the OS has no passkeys', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => false);

      expect(await createContainer().read(Store.passkeys.enabled().future), isFalse);
      verifyNever(() => api.isEnabled());
    });

    test('is false below the passkeys feature level, without asking the server', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);
      when(() => api.isEnabled()).thenAnswer((_) async => true);

      expect(await createContainer(supportsPasskeys: false).read(Store.passkeys.enabled().future), isFalse);
      verifyNever(() => api.isEnabled());
    });

    test('is false when the passkey config request fails', () async {
      when(() => hostApi.isSupported()).thenAnswer((_) async => true);
      when(() => api.isEnabled()).thenThrow(ApiException(500, 'Internal Server Error'));

      expect(await createContainer().read(Store.passkeys.enabled().future), isFalse);
    });
  });

  group('create', () {
    setUp(() {
      when(() => api.startRegistration()).thenAnswer((_) async => {'challenge': 'abc'});
      when(() => api.finishRegistration(any())).thenAnswer((_) async {});
    });

    test('sends the server options to the platform and the credential back to the server', () async {
      when(() => hostApi.register('{"challenge":"abc"}')).thenAnswer((_) async => '{"id":"credential"}');

      expect(await createContainer().read(Store.passkeys).create(), isTrue);
      expect(verify(() => api.finishRegistration(captureAny())).captured.single, {'id': 'credential'});
    });

    test('does not finish when the user cancels', () async {
      when(() => hostApi.register(any())).thenAnswer((_) async => null);

      expect(await createContainer().read(Store.passkeys).create(), isFalse);
      verifyNever(() => api.finishRegistration(any()));
    });
  });
}
