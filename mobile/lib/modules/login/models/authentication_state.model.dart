import 'dart:convert';

import 'package:immich_mobile/shared/models/device_info.model.dart';

class AuthenticationState {
  final String deviceId;
  final String deviceType;
  final String userId;
  final String userEmail;
  final bool isAuthenticated;
  final DeviceInfoRemote deviceInfo;

  AuthenticationState({
    required this.deviceId,
    required this.deviceType,
    required this.userId,
    required this.userEmail,
    required this.isAuthenticated,
    required this.deviceInfo,
  });

  AuthenticationState copyWith({
    String? deviceId,
    String? deviceType,
    String? userId,
    String? userEmail,
    bool? isAuthenticated,
    DeviceInfoRemote? deviceInfo,
  }) {
    return AuthenticationState(
      deviceId: deviceId ?? this.deviceId,
      deviceType: deviceType ?? this.deviceType,
      userId: userId ?? this.userId,
      userEmail: userEmail ?? this.userEmail,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      deviceInfo: deviceInfo ?? this.deviceInfo,
    );
  }

  @override
  String toString() {
    return 'AuthenticationState(deviceId: $deviceId, deviceType: $deviceType, userId: $userId, userEmail: $userEmail, isAuthenticated: $isAuthenticated, deviceInfo: $deviceInfo)';
  }

  Map<String, dynamic> toMap() {
    return {
      'deviceId': deviceId,
      'deviceType': deviceType,
      'userId': userId,
      'userEmail': userEmail,
      'isAuthenticated': isAuthenticated,
      'deviceInfo': deviceInfo.toMap(),
    };
  }

  factory AuthenticationState.fromMap(Map<String, dynamic> map) {
    return AuthenticationState(
      deviceId: map['deviceId'] ?? '',
      deviceType: map['deviceType'] ?? '',
      userId: map['userId'] ?? '',
      userEmail: map['userEmail'] ?? '',
      isAuthenticated: map['isAuthenticated'] ?? false,
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
        other.deviceInfo == deviceInfo;
  }

  @override
  int get hashCode {
    return deviceId.hashCode ^
        deviceType.hashCode ^
        userId.hashCode ^
        userEmail.hashCode ^
        isAuthenticated.hashCode ^
        deviceInfo.hashCode;
  }
}
