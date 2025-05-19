import 'package:local_auth/local_auth.dart';

class BiometricStatus {
  final List<BiometricType> availableBiometrics;
  final bool canAuthenticate;

  const BiometricStatus({
    required this.availableBiometrics,
    required this.canAuthenticate,
  });

  @override
  String toString() =>
      'BiometricStatus(availableBiometrics: $availableBiometrics, canAuthenticate: $canAuthenticate)';
}
