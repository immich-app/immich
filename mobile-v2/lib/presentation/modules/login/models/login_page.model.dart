import 'package:flutter/material.dart';

@immutable
class LoginPageState {
  final bool isServerValidated;
  final bool isValidationInProgress;
  final bool isLoginSuccessful;

  const LoginPageState({
    required this.isServerValidated,
    required this.isValidationInProgress,
    required this.isLoginSuccessful,
  });

  factory LoginPageState.reset() {
    return const LoginPageState(
      isServerValidated: false,
      isValidationInProgress: false,
      isLoginSuccessful: false,
    );
  }

  LoginPageState copyWith({
    bool? isServerValidated,
    bool? isValidationInProgress,
    bool? isLoginSuccessful,
  }) {
    return LoginPageState(
      isServerValidated: isServerValidated ?? this.isServerValidated,
      isValidationInProgress:
          isValidationInProgress ?? this.isValidationInProgress,
      isLoginSuccessful: isLoginSuccessful ?? this.isLoginSuccessful,
    );
  }

  @override
  String toString() =>
      'LoginPageState(isServerValidated: $isServerValidated, isValidationInProgress: $isValidationInProgress, isLoginSuccessful: $isLoginSuccessful)';

  @override
  bool operator ==(covariant LoginPageState other) {
    if (identical(this, other)) return true;

    return other.isServerValidated == isServerValidated &&
        other.isValidationInProgress == isValidationInProgress &&
        other.isLoginSuccessful == isLoginSuccessful;
  }

  @override
  int get hashCode =>
      isServerValidated.hashCode ^
      isValidationInProgress.hashCode ^
      isLoginSuccessful.hashCode;
}
