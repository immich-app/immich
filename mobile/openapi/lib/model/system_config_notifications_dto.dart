// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigNotificationsDto {
  const SystemConfigNotificationsDto({required this.smtp});

  final SystemConfigSmtpDto smtp;

  static SystemConfigNotificationsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigNotificationsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(smtp: (SystemConfigSmtpDto.fromJson(json[r'smtp']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'smtp'] = smtp.toJson();
    return json;
  }

  SystemConfigNotificationsDto copyWith({SystemConfigSmtpDto? smtp}) {
    return .new(smtp: smtp ?? this.smtp);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigNotificationsDto && smtp == other.smtp);
  }

  @override
  int get hashCode {
    return Object.hashAll([smtp]);
  }

  @override
  String toString() => 'SystemConfigNotificationsDto(smtp=$smtp)';
}
