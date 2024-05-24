import 'package:flutter/material.dart';

@immutable
class LoginPageState {
  final bool isServerValidated;
  final bool isValidationInProgress;

  const LoginPageState({
    required this.isServerValidated,
    required this.isValidationInProgress,
  });

  factory LoginPageState.reset() {
    return const LoginPageState(
      isServerValidated: false,
      isValidationInProgress: false,
    );
  }

  LoginPageState copyWith({
    bool? isServerValidated,
    bool? isValidationInProgress,
  }) {
    return LoginPageState(
      isServerValidated: isServerValidated ?? this.isServerValidated,
      isValidationInProgress:
          isValidationInProgress ?? this.isValidationInProgress,
    );
  }

  @override
  String toString() =>
      'LoginPageState(isServerValidated: $isServerValidated, isValidationInProgress: $isValidationInProgress)';

  @override
  bool operator ==(covariant LoginPageState other) {
    if (identical(this, other)) return true;

    return other.isServerValidated == isServerValidated &&
        other.isValidationInProgress == isValidationInProgress;
  }

  @override
  int get hashCode =>
      isServerValidated.hashCode ^ isValidationInProgress.hashCode;
}
