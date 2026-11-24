import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final passkeyApiRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PasskeyApiRepository(apiService.passkeysApi, apiService.configPublicApi, apiService.authenticationApi);
});

class PasskeyApiRepository extends ApiRepository {
  final PasskeysApi _api;
  final ConfigPublicApi _configApi;
  final AuthenticationApi _authApi;

  const PasskeyApiRepository(this._api, this._configApi, this._authApi);

  PasskeysApi _webApi(String origin) {
    return PasskeysApi(
      ApiClient(basePath: _api.apiClient.basePath)
        ..client = _api.apiClient.client
        ..defaultHeaderMap.addAll(_api.apiClient.defaultHeaderMap)
        ..addDefaultHeader('Origin', origin),
    );
  }

  /// Whether the server has passkey login turned on, and the origin passkeys are made for
  Future<({bool enabled, String origin})> getConfig() async {
    final passkey = (await checkNull(_configApi.getPublicConfig())).passkey;
    return (enabled: passkey.enabled, origin: Uri.parse(passkey.domain ?? _api.apiClient.basePath).origin);
  }

  /// The WebAuthn options for creating a passkey for the current user
  Future<Map<String, Object?>> startRegistration(String origin) => checkNull(_webApi(origin).startRegistration());

  /// Save the WebAuthn [credential] created from the [startRegistration] options as a passkey of the current user
  Future<void> finishRegistration(String origin, Map<String, dynamic> credential) async {
    await _webApi(origin).finishRegistration(PasskeyRegistrationFinishDto(response: credential));
  }

  /// Log in with the one-time code from the passkey page and the verifier of its code challenge
  Future<LoginResponse> exchangeCode(String code, String codeVerifier) async {
    final dto = AuthCodeExchangeDto(code: code, codeVerifier: codeVerifier);
    return LoginResponse.fromDto(await checkNull(_authApi.exchangeAuthCode(dto)));
  }

  /// Every passkey of the current user
  Future<List<Passkey>> getAll() async {
    final response = await checkNull(_api.searchPasskeys());
    return response.map(_toPasskey).toList();
  }

  Future<void> update(String id, String? name) async {
    await _api.updatePasskey(id, PasskeyUpdateDto(name: name));
  }

  Future<void> delete(String id) async {
    await _api.deletePasskey(id);
  }

  static Passkey _toPasskey(PasskeyResponseDto dto) =>
      .new(id: dto.id, createdAt: dto.createdAt, name: dto.name, usedAt: dto.usedAt);
}
