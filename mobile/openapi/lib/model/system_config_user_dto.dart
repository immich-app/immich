// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigUserDto {
  const SystemConfigUserDto({required this.deleteDelay});

  /// Delete delay
  final int deleteDelay;

  static SystemConfigUserDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigUserDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(deleteDelay: json[r'deleteDelay'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'deleteDelay'] = deleteDelay;
    return json;
  }

  SystemConfigUserDto copyWith({int? deleteDelay}) {
    return .new(deleteDelay: deleteDelay ?? this.deleteDelay);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigUserDto && deleteDelay == other.deleteDelay);
  }

  @override
  int get hashCode {
    return Object.hashAll([deleteDelay]);
  }

  @override
  String toString() => 'SystemConfigUserDto(deleteDelay=$deleteDelay)';
}
