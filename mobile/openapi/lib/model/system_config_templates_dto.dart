// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigTemplatesDto {
  const SystemConfigTemplatesDto({required this.email});

  final SystemConfigTemplateEmailsDto email;

  static SystemConfigTemplatesDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigTemplatesDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(email: (SystemConfigTemplateEmailsDto.fromJson(json[r'email']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'email'] = email.toJson();
    return json;
  }

  SystemConfigTemplatesDto copyWith({SystemConfigTemplateEmailsDto? email}) {
    return .new(email: email ?? this.email);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigTemplatesDto && email == other.email);
  }

  @override
  int get hashCode {
    return Object.hashAll([email]);
  }

  @override
  String toString() => 'SystemConfigTemplatesDto(email=$email)';
}
