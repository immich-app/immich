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

  /// Whether the server has passkey login turned on
  Future<bool> isEnabled() async {
    final config = await checkNull(_configApi.getPublicConfig());
    return config.passkey.enabled;
  }

  /// The WebAuthn options for creating a passkey for the current user
  Future<Map<String, Object>> startRegistration() => checkNull(_api.startRegistration());

  /// Save the WebAuthn [credential] created from the [startRegistration] options as a passkey of the current user
  Future<Passkey> finishRegistration(Map<String, dynamic> credential) async {
    final dto = PasskeyRegistrationFinishDto(response: credential);
    return _toPasskey(await checkNull(_api.finishRegistration(dto)));
  }

  /// The WebAuthn options for logging in with a passkey
  Future<Map<String, Object>> startAuthentication() => checkNull(_api.startAuthentication());

  /// Log in with the WebAuthn [credential] signed with the [startAuthentication] options
  Future<LoginResponse> finishAuthentication(Map<String, dynamic> credential) async {
    final dto = PasskeyAuthenticationFinishDto(response: credential);
    return LoginResponse.fromDto(await checkNull(_api.finishAuthentication(dto)));
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
