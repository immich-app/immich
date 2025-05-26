import 'package:immich_mobile/models/auth/biometric_status.model.dart';

abstract interface class IBiometricRepository {
  Future<BiometricStatus> getStatus();
  Future<bool> authenticate(String? message);
}
