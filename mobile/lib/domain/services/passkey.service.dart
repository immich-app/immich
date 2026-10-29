import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:immich_mobile/platform/passkey_api.g.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class PasskeyService {
  final Logger _log = Logger("PasskeyService");
  final PasskeyApiRepository _apiRepository;
  final PasskeyHostApi _hostApi;

  PasskeyService(this._apiRepository, this._hostApi);

  Future<bool> isEnabled(int featureLevel) async {
    if (featureLevel < ServerFeatureLevel.Passkeys.toJson()) {
      return false;
    }

    try {
      return await _hostApi.isSupported() && await _apiRepository.isEnabled();
    } catch (error, stackTrace) {
      _log.warning("Failed to get the passkey config", error, stackTrace);
      return false;
    }
  }

  Future<Passkey?> register() async {
    final response = await _hostApi.register(await _apiRepository.startRegistration());
    if (response == null) {
      return null;
    }

    return _apiRepository.finishRegistration(response);
  }

  Future<LoginResponseDto?> login() async {
    final response = await _hostApi.authenticate(await _apiRepository.startAuthentication());
    if (response == null) {
      return null;
    }

    return _apiRepository.finishAuthentication(response);
  }
}
