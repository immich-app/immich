import 'dart:convert';

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

  Future<bool> isEnabled() async {
    final config = await checkNull(_configApi.getPublicConfig());
    return config.passkey.enabled;
  }

  Future<String> startRegistration() async => jsonEncode(await checkNull(_api.startRegistration()));

  Future<void> finishRegistration(String response) async {
    await _api.finishRegistration(PasskeyRegistrationFinishDto(response: jsonDecode(response)));
  }
}
