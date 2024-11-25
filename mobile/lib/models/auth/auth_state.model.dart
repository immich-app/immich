class AuthState {
  final String deviceId;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final String name;
  final bool isAdmin;
  final String profileImagePath;

  AuthState({
    required this.deviceId,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.name,
    required this.isAdmin,
    required this.profileImagePath,
  });

  AuthState copyWith({
    String? deviceId,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    String? name,
    bool? isAdmin,
    String? profileImagePath,
  }) {
    return AuthState(
      deviceId: deviceId ?? this.deviceId,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      name: name ?? this.name,
      isAdmin: isAdmin ?? this.isAdmin,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, name: $name, isAdmin: $isAdmin, profileImagePath: $profileImagePath)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AuthState &&
        other.deviceId == deviceId &&
        other.userId == userId &&
        other.userEmail == userEmail &&
        other.isAuthenticated == isAuthenticated &&
        other.name == name &&
        other.isAdmin == isAdmin &&
        other.profileImagePath == profileImagePath;
  }

  @override
  int get hashCode {
    return deviceId.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        isAuthenticated.hashCode ^
        name.hashCode ^
        isAdmin.hashCode ^
        profileImagePath.hashCode;
  }
}
