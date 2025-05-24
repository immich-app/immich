class SessionCreateResponse {
  final String createdAt;
  final bool current;
  final String deviceOS;
  final String deviceType;
  final String? expiresAt;
  final String id;
  final String token;
  final String updatedAt;

  SessionCreateResponse({
    required this.createdAt,
    required this.current,
    required this.deviceOS,
    required this.deviceType,
    this.expiresAt,
    required this.id,
    required this.token,
    required this.updatedAt,
  });

  @override
  String toString() {
    return 'SessionCreateResponse[createdAt=$createdAt, current=$current, deviceOS=$deviceOS, deviceType=$deviceType, expiresAt=$expiresAt, id=$id, token=$token, updatedAt=$updatedAt]';
  }
}
