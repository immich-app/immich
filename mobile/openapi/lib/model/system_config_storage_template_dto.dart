// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigStorageTemplateDto {
  const SystemConfigStorageTemplateDto({
    required this.enabled,
    required this.hashVerificationEnabled,
    required this.template,
  });

  /// Enabled
  final bool enabled;

  /// Hash verification enabled
  final bool hashVerificationEnabled;

  /// Template
  final String template;

  static SystemConfigStorageTemplateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigStorageTemplateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      enabled: json[r'enabled'] as bool,
      hashVerificationEnabled: json[r'hashVerificationEnabled'] as bool,
      template: json[r'template'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    json[r'hashVerificationEnabled'] = hashVerificationEnabled;
    json[r'template'] = template;
    return json;
  }

  SystemConfigStorageTemplateDto copyWith({bool? enabled, bool? hashVerificationEnabled, String? template}) {
    return .new(
      enabled: enabled ?? this.enabled,
      hashVerificationEnabled: hashVerificationEnabled ?? this.hashVerificationEnabled,
      template: template ?? this.template,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigStorageTemplateDto &&
            enabled == other.enabled &&
            hashVerificationEnabled == other.hashVerificationEnabled &&
            template == other.template);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled, hashVerificationEnabled, template]);
  }

  @override
  String toString() =>
      'SystemConfigStorageTemplateDto(enabled=$enabled, hashVerificationEnabled=$hashVerificationEnabled, template=$template)';
}
