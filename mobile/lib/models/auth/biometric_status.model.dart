import 'package:collection/collection.dart';
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

  BiometricStatus copyWith({
    List<BiometricType>? availableBiometrics,
    bool? canAuthenticate,
  }) {
    return BiometricStatus(
      availableBiometrics: availableBiometrics ?? this.availableBiometrics,
      canAuthenticate: canAuthenticate ?? this.canAuthenticate,
    );
  }

  @override
  bool operator ==(covariant BiometricStatus other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.availableBiometrics, availableBiometrics) &&
        other.canAuthenticate == canAuthenticate;
  }

  @override
  int get hashCode => availableBiometrics.hashCode ^ canAuthenticate.hashCode;
}
