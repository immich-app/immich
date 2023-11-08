class AuthenticationState {
  final String deviceId;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final String fullName;
  final bool isAdmin;
  final bool shouldChangePassword;
  final String profileImagePath;
  AuthenticationState({
    required this.deviceId,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.fullName,
    required this.isAdmin,
    required this.shouldChangePassword,
    required this.profileImagePath,
  });

  AuthenticationState copyWith({
    String? deviceId,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    String? fullName,
    bool? isAdmin,
    bool? shouldChangePassword,
    String? profileImagePath,
  }) {
    return AuthenticationState(
      deviceId: deviceId ?? this.deviceId,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      fullName: fullName ?? this.fullName,
      isAdmin: isAdmin ?? this.isAdmin,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, fullName: $fullName, isAdmin: $isAdmin, shouldChangePassword: $shouldChangePassword, profileImagePath: $profileImagePath)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AuthenticationState &&
        other.deviceId == deviceId &&
        other.userId == userId &&
        other.userEmail == userEmail &&
        other.isAuthenticated == isAuthenticated &&
        other.fullName == fullName &&
        other.isAdmin == isAdmin &&
        other.shouldChangePassword == shouldChangePassword &&
        other.profileImagePath == profileImagePath;
  }

  @override
  int get hashCode {
    return deviceId.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        isAuthenticated.hashCode ^
        fullName.hashCode ^
        isAdmin.hashCode ^
        shouldChangePassword.hashCode ^
        profileImagePath.hashCode;
  }
}
