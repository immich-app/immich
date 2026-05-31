// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigFacesDto {
  const SystemConfigFacesDto({required this.import$});

  /// Import
  final bool import$;

  static SystemConfigFacesDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigFacesDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(import$: json[r'import'] as bool);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'import'] = import$;
    return json;
  }

  SystemConfigFacesDto copyWith({bool? import$}) {
    return .new(import$: import$ ?? this.import$);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigFacesDto && import$ == other.import$);
  }

  @override
  int get hashCode {
    return Object.hashAll([import$]);
  }

  @override
  String toString() => 'SystemConfigFacesDto(import\$=${import$})';
}
