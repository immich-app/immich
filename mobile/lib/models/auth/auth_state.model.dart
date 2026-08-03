import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_state.model.freezed.dart';

@freezed
abstract class AuthState with _$AuthState {
  const factory AuthState({
    required String deviceId,
    required String userId,
    required String userEmail,
    required bool isAuthenticated,
    required String name,
    required bool isAdmin,
    required String profileImagePath,
  }) = _AuthState;
}
