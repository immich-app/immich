// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigReverseGeocodingDto {
  const SystemConfigReverseGeocodingDto({required this.enabled});

  /// Enabled
  final bool enabled;

  static SystemConfigReverseGeocodingDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigReverseGeocodingDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    return json;
  }

  SystemConfigReverseGeocodingDto copyWith({bool? enabled}) {
    return .new(enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigReverseGeocodingDto && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled]);
  }

  @override
  String toString() => 'SystemConfigReverseGeocodingDto(enabled=$enabled)';
}
