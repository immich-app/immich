// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_state.model.freezed.dart';

@freezed
class const AuthState({
  required final String deviceId,
  required final String userId,
  required final String userEmail,
  required final bool isAuthenticated,
  required final String name,
  required final bool isAdmin,
  required final String profileImagePath,
}) with _$AuthState;
