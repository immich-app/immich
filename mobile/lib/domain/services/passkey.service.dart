import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class PasskeyService {
  final Logger _log = Logger("PasskeyService");
  final PasskeyApiRepository _apiRepository;
  final PasskeyHostApi _hostApi;

  PasskeyService(this._apiRepository, this._hostApi);

  Future<bool> isEnabled() async {
    try {
      return await _hostApi.isSupported() && await _apiRepository.isEnabled();
    } catch (error, stackTrace) {
      // servers before v3.2.0 have no public config
      _log.warning("Failed to get the passkey config", error, stackTrace);
      return false;
    }
  }

  Future<bool> register() async {
    final response = await _hostApi.register(await _apiRepository.startRegistration());
    if (response == null) {
      return false;
    }

    await _apiRepository.finishRegistration(response);
    return true;
  }

  Future<LoginResponseDto?> login() async {
    final response = await _hostApi.authenticate(await _apiRepository.startAuthentication());
    if (response == null) {
      return null;
    }

    return _apiRepository.finishAuthentication(response);
  }
}
