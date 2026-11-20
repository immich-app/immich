import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/models/auth/login_response.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final passkeyApiRepositoryProvider = Provider((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return PasskeyApiRepository(apiService.passkeysApi, apiService.configPublicApi);
});

class PasskeyApiRepository extends ApiRepository {
  final PasskeysApi _api;
  final ConfigPublicApi _configApi;

  const PasskeyApiRepository(this._api, this._configApi);

  // The server makes passkeys for the domain in the Origin header, like for its web client
  PasskeysApi _webApi(String origin) {
    final apiClient = _api.apiClient;
    return PasskeysApi(
      ApiClient(basePath: apiClient.basePath)
        ..client = apiClient.client
        ..defaultHeaderMap.addAll(apiClient.defaultHeaderMap)
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

  /// The WebAuthn options for logging in with a passkey
  Future<Map<String, Object?>> startAuthentication(String origin, String codeChallenge) =>
      checkNull(_webApi(origin).startAuthentication(codeChallenge: codeChallenge));

  /// Log in with the WebAuthn [credential] signed with the [startAuthentication] options
  Future<LoginResponse> finishAuthentication(
    String origin,
    Map<String, dynamic> credential,
    String codeVerifier,
  ) async {
    final dto = PasskeyAuthenticationFinishDto(response: credential, codeVerifier: Optional.present(codeVerifier));
    return LoginResponse.fromDto(await checkNull(_webApi(origin).finishAuthentication(dto)));
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
