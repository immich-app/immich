// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerVersionResponseDto {
  const ServerVersionResponseDto({required this.major, required this.minor, required this.patch});

  /// Major version number
  final int major;

  /// Minor version number
  final int minor;

  /// Patch version number
  final int patch;

  static ServerVersionResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerVersionResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(major: json[r'major'] as int, minor: json[r'minor'] as int, patch: json[r'patch'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'major'] = major;
    json[r'minor'] = minor;
    json[r'patch'] = patch;
    return json;
  }

  ServerVersionResponseDto copyWith({int? major, int? minor, int? patch}) {
    return .new(major: major ?? this.major, minor: minor ?? this.minor, patch: patch ?? this.patch);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerVersionResponseDto && major == other.major && minor == other.minor && patch == other.patch);
  }

  @override
  int get hashCode {
    return Object.hashAll([major, minor, patch]);
  }

  @override
  String toString() => 'ServerVersionResponseDto(major=$major, minor=$minor, patch=$patch)';
}
