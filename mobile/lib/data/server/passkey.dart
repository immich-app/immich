import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
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

  Future<Passkey> finishRegistration(String response) async {
    final dto = PasskeyRegistrationFinishDto(response: jsonDecode(response));
    return _toPasskey(await checkNull(_api.finishRegistration(dto)));
  }

  Future<String> startAuthentication() async => jsonEncode(await checkNull(_api.startAuthentication()));

  Future<LoginResponseDto> finishAuthentication(String response) async {
    final dto = PasskeyAuthenticationFinishDto(response: jsonDecode(response));
    return checkNull(_api.finishAuthentication(dto));
  }

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
