class AuthenticationState {
  final String deviceId;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final String name;
  final bool isAdmin;
  final bool shouldChangePassword;
  final String profileImagePath;
  final bool isHavingUserPreferences;

  AuthenticationState({
    required this.deviceId,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.name,
    required this.isAdmin,
    required this.shouldChangePassword,
    required this.profileImagePath,
    required this.isHavingUserPreferences,
  });

  AuthenticationState copyWith({
    String? deviceId,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    String? name,
    bool? isAdmin,
    bool? shouldChangePassword,
    String? profileImagePath,
    bool? isHavingUserPreferences,
  }) {
    return AuthenticationState(
      deviceId: deviceId ?? this.deviceId,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      name: name ?? this.name,
      isAdmin: isAdmin ?? this.isAdmin,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      isHavingUserPreferences:
          isHavingUserPreferences ?? this.isHavingUserPreferences,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, name: $name, isAdmin: $isAdmin, shouldChangePassword: $shouldChangePassword, profileImagePath: $profileImagePath, isHavingUserPreferences: $isHavingUserPreferences)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AuthenticationState &&
        other.deviceId == deviceId &&
        other.userId == userId &&
        other.userEmail == userEmail &&
        other.isAuthenticated == isAuthenticated &&
        other.name == name &&
        other.isAdmin == isAdmin &&
        other.shouldChangePassword == shouldChangePassword &&
        other.profileImagePath == profileImagePath &&
        other.isHavingUserPreferences == isHavingUserPreferences;
  }

  @override
  int get hashCode {
    return deviceId.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        isAuthenticated.hashCode ^
        name.hashCode ^
        isAdmin.hashCode ^
        shouldChangePassword.hashCode ^
        profileImagePath.hashCode ^
        isHavingUserPreferences.hashCode;
  }
}
