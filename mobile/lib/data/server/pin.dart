import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/api_repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:openapi/api.dart';

final pinApiRepositoryProvider = Provider((ref) {
  return PinApiRepository(ref.watch(apiServiceProvider).authenticationApi);
});

class PinApiRepository extends ApiRepository {
  const PinApiRepository(this._api);

  final AuthenticationApi _api;

  Future<({bool isConfigured, DateTime? expiresAt})> getPinStatus() async {
    final status = await checkNull(_api.getAuthStatus());
    return (
      isConfigured: status.pinCode,
      expiresAt: status.isElevated ? DateTime.tryParse(status.pinExpiresAt.orElse(null) ?? '') : null,
    );
  }

  Future<bool> unlockPinCode(String pinCode) async {
    try {
      await _api.unlockAuthSession(SessionUnlockDto(pinCode: Optional.present(pinCode)));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> lockPinCode() => _api.lockAuthSession();
}
