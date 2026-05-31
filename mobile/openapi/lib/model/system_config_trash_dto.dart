// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigTrashDto {
  const SystemConfigTrashDto({required this.days, required this.enabled});

  /// Days
  final int days;

  /// Enabled
  final bool enabled;

  static SystemConfigTrashDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigTrashDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(days: json[r'days'] as int, enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'days'] = days;
    json[r'enabled'] = enabled;
    return json;
  }

  SystemConfigTrashDto copyWith({int? days, bool? enabled}) {
    return .new(days: days ?? this.days, enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigTrashDto && days == other.days && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([days, enabled]);
  }

  @override
  String toString() => 'SystemConfigTrashDto(days=$days, enabled=$enabled)';
}
