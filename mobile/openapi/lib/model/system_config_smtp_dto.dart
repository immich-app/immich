// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigSmtpDto {
  const SystemConfigSmtpDto({
    required this.enabled,
    required this.from,
    required this.replyTo,
    required this.transport,
  });

  /// Whether SMTP email notifications are enabled
  final bool enabled;

  /// Email address to send from
  final String from;

  /// Email address for replies
  final String replyTo;

  final SystemConfigSmtpTransportDto transport;

  static SystemConfigSmtpDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigSmtpDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      from: json[r'from'] as String,
      replyTo: json[r'replyTo'] as String,
      transport: (SystemConfigSmtpTransportDto.fromJson(json[r'transport']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'from'] = from;
    json[r'replyTo'] = replyTo;
    json[r'transport'] = transport.toJson();
    return json;
  }

  SystemConfigSmtpDto copyWith({
    bool? enabled,
    String? from,
    String? replyTo,
    SystemConfigSmtpTransportDto? transport,
  }) {
    return .new(
      enabled: enabled ?? this.enabled,
      from: from ?? this.from,
      replyTo: replyTo ?? this.replyTo,
      transport: transport ?? this.transport,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigSmtpDto &&
            enabled == other.enabled &&
            from == other.from &&
            replyTo == other.replyTo &&
            transport == other.transport);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, from, replyTo, transport]);
  }

  @override
  String toString() => 'SystemConfigSmtpDto(enabled=$enabled, from=$from, replyTo=$replyTo, transport=$transport)';
}
