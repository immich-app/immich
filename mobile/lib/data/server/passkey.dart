import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
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
  Future<void> finishRegistration(Map<String, dynamic> credential) async {
    await _api.finishRegistration(PasskeyRegistrationFinishDto(response: credential));
  }
}
