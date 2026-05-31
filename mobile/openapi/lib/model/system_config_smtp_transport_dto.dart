// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigSmtpTransportDto {
  const SystemConfigSmtpTransportDto({
    required this.host,
    required this.ignoreCert,
    required this.password,
    required this.port,
    required this.secure,
    required this.username,
  });

  /// SMTP server hostname
  final String host;

  /// Whether to ignore SSL certificate errors
  final bool ignoreCert;

  /// SMTP password
  final String password;

  /// SMTP server port
  final int port;

  /// Whether to use secure connection (TLS/SSL)
  final bool secure;

  /// SMTP username
  final String username;

  static SystemConfigSmtpTransportDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigSmtpTransportDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      host: json[r'host'] as String,
      ignoreCert: json[r'ignoreCert'] as bool,
      password: json[r'password'] as String,
      port: json[r'port'] as int,
      secure: json[r'secure'] as bool,
      username: json[r'username'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'host'] = host;
    json[r'ignoreCert'] = ignoreCert;
    json[r'password'] = password;
    json[r'port'] = port;
    json[r'secure'] = secure;
    json[r'username'] = username;
    return json;
  }

  SystemConfigSmtpTransportDto copyWith({
    String? host,
    bool? ignoreCert,
    String? password,
    int? port,
    bool? secure,
    String? username,
  }) {
    return .new(
      host: host ?? this.host,
      ignoreCert: ignoreCert ?? this.ignoreCert,
      password: password ?? this.password,
      port: port ?? this.port,
      secure: secure ?? this.secure,
      username: username ?? this.username,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigSmtpTransportDto &&
            host == other.host &&
            ignoreCert == other.ignoreCert &&
            password == other.password &&
            port == other.port &&
            secure == other.secure &&
            username == other.username);
  }

  @override
  int get hashCode {
    return Object.hashAll([host, ignoreCert, password, port, secure, username]);
  }

  @override
  String toString() =>
      'SystemConfigSmtpTransportDto(host=$host, ignoreCert=$ignoreCert, password=$password, port=$port, secure=$secure, username=$username)';
}
