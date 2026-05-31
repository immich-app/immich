// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumUserCreateDto {
  const AlbumUserCreateDto({required this.role, required this.userId});

  final AlbumUserRole role;

  /// User ID
  final String userId;

  static AlbumUserCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumUserCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(role: (AlbumUserRole.fromJson(json[r'role']))!, userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'role'] = role.toJson();
    json[r'userId'] = userId;
    return json;
  }

  AlbumUserCreateDto copyWith({AlbumUserRole? role, String? userId}) {
    return .new(role: role ?? this.role, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AlbumUserCreateDto && role == other.role && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([role, userId]);
  }

  @override
  String toString() => 'AlbumUserCreateDto(role=$role, userId=$userId)';
}
