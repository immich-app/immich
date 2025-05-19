import 'package:collection/collection.dart';
import 'package:local_auth/local_auth.dart';

class LocalAuthState {
  final bool canUseBiometrics;
  final List<BiometricType> availableBiometrics;

  const LocalAuthState({
    required this.canUseBiometrics,
    this.availableBiometrics = const [],
  });

  LocalAuthState copyWith({
    bool? canUseBiometrics,
    List<BiometricType>? availableBiometrics,
  }) {
    return LocalAuthState(
      canUseBiometrics: canUseBiometrics ?? this.canUseBiometrics,
      availableBiometrics: availableBiometrics ?? this.availableBiometrics,
    );
  }

  @override
  String toString() =>
      'LocalAuthState(canUseBiometrics: $canUseBiometrics, availableBiometrics: $availableBiometrics)';

  @override
  bool operator ==(covariant LocalAuthState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other.canUseBiometrics == canUseBiometrics &&
        listEquals(other.availableBiometrics, availableBiometrics);
  }

  @override
  int get hashCode => canUseBiometrics.hashCode ^ availableBiometrics.hashCode;
}
