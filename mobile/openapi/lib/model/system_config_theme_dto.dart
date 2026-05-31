// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigThemeDto {
  const SystemConfigThemeDto({required this.customCss});

  /// Custom CSS for theming
  final String customCss;

  static SystemConfigThemeDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigThemeDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(customCss: json[r'customCss'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'customCss'] = customCss;
    return json;
  }

  SystemConfigThemeDto copyWith({String? customCss}) {
    return .new(customCss: customCss ?? this.customCss);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigThemeDto && customCss == other.customCss);
  }

  @override
  int get hashCode {
    return Object.hashAll([customCss]);
  }

  @override
  String toString() => 'SystemConfigThemeDto(customCss=$customCss)';
}
