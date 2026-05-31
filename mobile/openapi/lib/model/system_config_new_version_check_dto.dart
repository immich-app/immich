// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigNewVersionCheckDto {
  const SystemConfigNewVersionCheckDto({required this.enabled});

  /// Enabled
  final bool enabled;

  static SystemConfigNewVersionCheckDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigNewVersionCheckDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    return json;
  }

  SystemConfigNewVersionCheckDto copyWith({bool? enabled}) {
    return .new(enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigNewVersionCheckDto && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled]);
  }

  @override
  String toString() => 'SystemConfigNewVersionCheckDto(enabled=$enabled)';
}
