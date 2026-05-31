// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigMapDto {
  const SystemConfigMapDto({required this.darkStyle, required this.enabled, required this.lightStyle});

  /// Dark map style URL
  final String darkStyle;

  /// Enabled
  final bool enabled;

  /// Light map style URL
  final String lightStyle;

  static SystemConfigMapDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigMapDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      darkStyle: json[r'darkStyle'] as String,
      enabled: json[r'enabled'] as bool,
      lightStyle: json[r'lightStyle'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'darkStyle'] = darkStyle;
    json[r'enabled'] = enabled;
    json[r'lightStyle'] = lightStyle;
    return json;
  }

  SystemConfigMapDto copyWith({String? darkStyle, bool? enabled, String? lightStyle}) {
    return .new(
      darkStyle: darkStyle ?? this.darkStyle,
      enabled: enabled ?? this.enabled,
      lightStyle: lightStyle ?? this.lightStyle,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigMapDto &&
            darkStyle == other.darkStyle &&
            enabled == other.enabled &&
            lightStyle == other.lightStyle);
  }

  @override
  int get hashCode {
    return Object.hashAll([darkStyle, enabled, lightStyle]);
  }

  @override
  String toString() => 'SystemConfigMapDto(darkStyle=$darkStyle, enabled=$enabled, lightStyle=$lightStyle)';
}
