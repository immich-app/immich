import 'dart:convert';

import 'package:immich_mobile/shared/models/device_info.model.dart';

class AuthenticationState {
  final String deviceId;
  final String deviceType;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final String firstName;
  final String lastName;
  final bool isAdmin;
  final DeviceInfoRemote deviceInfo;

  AuthenticationState({
    required this.deviceId,
    required this.deviceType,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.firstName,
    required this.lastName,
    required this.isAdmin,
    required this.deviceInfo,
  });

  AuthenticationState copyWith({
    String? deviceId,
    String? deviceType,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    String? firstName,
    String? lastName,
    bool? isAdmin,
    DeviceInfoRemote? deviceInfo,
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
      deviceInfo: deviceInfo ?? this.deviceInfo,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, deviceType: $deviceType, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, firstName: $firstName, lastName: $lastName, isAdmin: $isAdmin, deviceInfo: $deviceInfo)';
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'deviceId': deviceId});
    result.addAll({'deviceType': deviceType});
    result.addAll({'userId': userId});
    result.addAll({'userEmail': userEmail});
    result.addAll({'isAuthenticated': isAuthenticated});
    result.addAll({'firstName': firstName});
    result.addAll({'lastName': lastName});
    result.addAll({'isAdmin': isAdmin});
    result.addAll({'deviceInfo': deviceInfo.toMap()});

    return result;
  }

  factory AuthenticationState.fromMap(Map<String, dynamic> map) {
    return AuthenticationState(
      deviceId: map['deviceId'] ?? '',
      deviceType: map['deviceType'] ?? '',
      userId: map['userId'] ?? '',
      userEmail: map['userEmail'] ?? '',
      isAuthenticated: map['isAuthenticated'] ?? false,
      firstName: map['firstName'] ?? '',
      lastName: map['lastName'] ?? '',
      isAdmin: map['isAdmin'] ?? false,
      deviceInfo: DeviceInfoRemote.fromMap(map['deviceInfo']),
    );
  }

  String toJson() => json.encode(toMap());

  factory AuthenticationState.fromJson(String source) => AuthenticationState.fromMap(json.decode(source));

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
        deviceInfo.hashCode;
  }
}
