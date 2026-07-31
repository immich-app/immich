import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:local_auth/local_auth.dart';

part 'biometric_status.model.freezed.dart';

@freezed
abstract class BiometricStatus with _$BiometricStatus {
  const factory BiometricStatus({required List<BiometricType> availableBiometrics, required bool canAuthenticate}) =
      _BiometricStatus;
}
