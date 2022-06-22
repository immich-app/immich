import 'dart:convert';

class DeviceInfoRemote {
  final int id;
  final String userId;
  final String deviceId;
  final String deviceType;
  final String notificationToken;
  final String createdAt;
  final bool isAutoBackup;

  DeviceInfoRemote({
    required this.id,
    required this.userId,
    required this.deviceId,
    required this.deviceType,
    required this.notificationToken,
    required this.createdAt,
    required this.isAutoBackup,
  });

  DeviceInfoRemote copyWith({
    int? id,
    String? userId,
    String? deviceId,
    String? deviceType,
    String? notificationToken,
    String? createdAt,
    bool? isAutoBackup,
  }) {
    return DeviceInfoRemote(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      deviceId: deviceId ?? this.deviceId,
      deviceType: deviceType ?? this.deviceType,
      notificationToken: notificationToken ?? this.notificationToken,
      createdAt: createdAt ?? this.createdAt,
      isAutoBackup: isAutoBackup ?? this.isAutoBackup,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'deviceId': deviceId,
      'deviceType': deviceType,
      'notificationToken': notificationToken,
      'createdAt': createdAt,
      'isAutoBackup': isAutoBackup,
    };
  }

  factory DeviceInfoRemote.fromMap(Map<String, dynamic> map) {
    return DeviceInfoRemote(
      id: map['id']?.toInt() ?? 0,
      userId: map['userId'] ?? '',
      deviceId: map['deviceId'] ?? '',
      deviceType: map['deviceType'] ?? '',
      notificationToken: map['notificationToken'] ?? '',
      createdAt: map['createdAt'] ?? '',
      isAutoBackup: map['isAutoBackup'] ?? false,
    );
  }

  String toJson() => json.encode(toMap());

  factory DeviceInfoRemote.fromJson(String source) =>
      DeviceInfoRemote.fromMap(json.decode(source));

  @override
  String toString() {
    return 'DeviceInfo(id: $id, userId: $userId, deviceId: $deviceId, deviceType: $deviceType, notificationToken: $notificationToken, createdAt: $createdAt, isAutoBackup: $isAutoBackup)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is DeviceInfoRemote &&
        other.id == id &&
        other.userId == userId &&
        other.deviceId == deviceId &&
        other.deviceType == deviceType &&
        other.notificationToken == notificationToken &&
        other.createdAt == createdAt &&
        other.isAutoBackup == isAutoBackup;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        userId.hashCode ^
        deviceId.hashCode ^
        deviceType.hashCode ^
        notificationToken.hashCode ^
        createdAt.hashCode ^
        isAutoBackup.hashCode;
  }
}
