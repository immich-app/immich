// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:local_auth/local_auth.dart';

part 'biometric_status.model.freezed.dart';

@freezed
class const BiometricStatus({
  required final List<BiometricType> availableBiometrics,
  required final bool canAuthenticate,
}) with _$BiometricStatus;
