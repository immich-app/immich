import 'package:openapi/api.dart';

class AuthenticationState {
  final String deviceId;
  final DeviceTypeEnum deviceType;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final String firstName;
  final String lastName;
  final bool isAdmin;
  final bool shouldChangePassword;
  final String profileImagePath;
  final DeviceInfoResponseDto deviceInfo;
  AuthenticationState({
    required this.deviceId,
    required this.deviceType,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.firstName,
    required this.lastName,
    required this.isAdmin,
    required this.shouldChangePassword,
    required this.profileImagePath,
    required this.deviceInfo,
  });

  AuthenticationState copyWith({
    String? deviceId,
    DeviceTypeEnum? deviceType,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    String? firstName,
    String? lastName,
    bool? isAdmin,
    bool? shouldChangePassword,
    String? profileImagePath,
    DeviceInfoResponseDto? deviceInfo,
  }) {
    return AuthenticationState(
      deviceId: deviceId ?? this.deviceId,
      deviceType: deviceType ?? this.deviceType,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      isAdmin: isAdmin ?? this.isAdmin,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      deviceInfo: deviceInfo ?? this.deviceInfo,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, deviceType: $deviceType, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, firstName: $firstName, lastName: $lastName, isAdmin: $isAdmin, shouldChangePassword: $shouldChangePassword, profileImagePath: $profileImagePath, deviceInfo: $deviceInfo)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AuthenticationState &&
        other.deviceId == deviceId &&
        other.deviceType == deviceType &&
        other.userId == userId &&
        other.userEmail == userEmail &&
        other.isAuthenticated == isAuthenticated &&
        other.firstName == firstName &&
        other.lastName == lastName &&
        other.isAdmin == isAdmin &&
        other.shouldChangePassword == shouldChangePassword &&
        other.profileImagePath == profileImagePath &&
        other.deviceInfo == deviceInfo;
  }

  @override
  int get hashCode {
    return deviceId.hashCode ^
        deviceType.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        isAuthenticated.hashCode ^
        firstName.hashCode ^
        lastName.hashCode ^
        isAdmin.hashCode ^
        shouldChangePassword.hashCode ^
        profileImagePath.hashCode ^
        deviceInfo.hashCode;
  }
}
