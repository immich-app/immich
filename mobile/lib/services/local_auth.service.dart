import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/auth/biometric_status.model.dart';
import 'package:immich_mobile/repositories/biometric.repository.dart';

final localAuthServiceProvider = Provider(
  (ref) => LocalAuthService(
    ref.watch(biometricRepositoryProvider),
  ),
);

class LocalAuthService {
  final BiometricRepository _biometricRepository;

  LocalAuthService(this._biometricRepository);

  Future<BiometricStatus> getStatus() {
    return _biometricRepository.getStatus();
  }

  Future<bool> authenticate([String? message]) async {
    return _biometricRepository.authenticate(message);
  }
}
