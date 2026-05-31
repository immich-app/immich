// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SessionCreateResponseDto {
  const SessionCreateResponseDto({
    required this.appVersion,
    required this.createdAt,
    required this.current,
    required this.deviceOs,
    required this.deviceType,
    this.expiresAt,
    required this.id,
    required this.isPendingSyncReset,
    required this.token,
    required this.updatedAt,
  });

  /// App version
  final String? appVersion;

  /// Creation date
  final String createdAt;

  /// Is current session
  final bool current;

  /// Device OS
  final String deviceOs;

  /// Device type
  final String deviceType;

  /// Expiration date
  final String? expiresAt;

  /// Session ID
  final String id;

  /// Is pending sync reset
  final bool isPendingSyncReset;

  /// Session token
  final String token;

  /// Last update date
  final String updatedAt;

  static const _undefined = Object();

  static SessionCreateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SessionCreateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      appVersion: (json[r'appVersion'] as String?),
      createdAt: json[r'createdAt'] as String,
      current: json[r'current'] as bool,
      deviceOs: json[r'deviceOS'] as String,
      deviceType: json[r'deviceType'] as String,
      expiresAt: (json[r'expiresAt'] as String?),
      id: json[r'id'] as String,
      isPendingSyncReset: json[r'isPendingSyncReset'] as bool,
      token: json[r'token'] as String,
      updatedAt: json[r'updatedAt'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (appVersion != null) {
      json[r'appVersion'] = appVersion!;
    }
    json[r'createdAt'] = createdAt;
    json[r'current'] = current;
    json[r'deviceOS'] = deviceOs;
    json[r'deviceType'] = deviceType;
    if (expiresAt != null) {
      json[r'expiresAt'] = expiresAt!;
    }
    json[r'id'] = id;
    json[r'isPendingSyncReset'] = isPendingSyncReset;
    json[r'token'] = token;
    json[r'updatedAt'] = updatedAt;
    return json;
  }

  SessionCreateResponseDto copyWith({
    Object? appVersion = _undefined,
    String? createdAt,
    bool? current,
    String? deviceOs,
    String? deviceType,
    Object? expiresAt = _undefined,
    String? id,
    bool? isPendingSyncReset,
    String? token,
    String? updatedAt,
  }) {
    return .new(
      appVersion: identical(appVersion, _undefined) ? this.appVersion : appVersion as String?,
      createdAt: createdAt ?? this.createdAt,
      current: current ?? this.current,
      deviceOs: deviceOs ?? this.deviceOs,
      deviceType: deviceType ?? this.deviceType,
      expiresAt: identical(expiresAt, _undefined) ? this.expiresAt : expiresAt as String?,
      id: id ?? this.id,
      isPendingSyncReset: isPendingSyncReset ?? this.isPendingSyncReset,
      token: token ?? this.token,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SessionCreateResponseDto &&
            appVersion == other.appVersion &&
            createdAt == other.createdAt &&
            current == other.current &&
            deviceOs == other.deviceOs &&
            deviceType == other.deviceType &&
            expiresAt == other.expiresAt &&
            id == other.id &&
            isPendingSyncReset == other.isPendingSyncReset &&
            token == other.token &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      appVersion,
      createdAt,
      current,
      deviceOs,
      deviceType,
      expiresAt,
      id,
      isPendingSyncReset,
      token,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'SessionCreateResponseDto(appVersion=$appVersion, createdAt=$createdAt, current=$current, deviceOs=$deviceOs, deviceType=$deviceType, expiresAt=$expiresAt, id=$id, isPendingSyncReset=$isPendingSyncReset, token=$token, updatedAt=$updatedAt)';
}
