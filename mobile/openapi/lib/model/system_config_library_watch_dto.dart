// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigLibraryWatchDto {
  const SystemConfigLibraryWatchDto({required this.enabled});

  /// Enabled
  final bool enabled;

  static SystemConfigLibraryWatchDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigLibraryWatchDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(enabled: json[r'enabled'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'enabled'] = enabled;
    return json;
  }

  SystemConfigLibraryWatchDto copyWith({bool? enabled}) {
    return .new(enabled: enabled ?? this.enabled);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigLibraryWatchDto && enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([enabled]);
  }

  @override
  String toString() => 'SystemConfigLibraryWatchDto(enabled=$enabled)';
}
