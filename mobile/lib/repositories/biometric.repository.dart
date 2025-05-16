import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/biometric.interface.dart';
import 'package:immich_mobile/models/auth/biometric_status.model.dart';
import 'package:local_auth/local_auth.dart';

final biometricRepositoryProvider =
    Provider((ref) => BiometricRepository(LocalAuthentication()));

class BiometricRepository implements IBiometricRepository {
  final LocalAuthentication _localAuth;

  BiometricRepository(this._localAuth);

  @override
  Future<BiometricStatus> getStatus() async {
    final bool canAuthenticateWithBiometrics =
        await _localAuth.canCheckBiometrics;
    final bool canAuthenticate =
        canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();
    final availableBiometric = await _localAuth.getAvailableBiometrics();

    return BiometricStatus(
      canAuthenticate: canAuthenticate,
      availableBiometrics: availableBiometric,
    );
  }

  @override
  Future<bool> authenticate(String? message) async {
    return _localAuth.authenticate(
      localizedReason: message ?? 'Please authenticate to access',
    );
  }
}
