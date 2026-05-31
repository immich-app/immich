// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumUserAddDto {
  const AlbumUserAddDto({this.role = AlbumUserRole.editor, required this.userId});

  /// Album user role
  final AlbumUserRole role;

  /// User ID
  final String userId;

  static AlbumUserAddDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumUserAddDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(role: AlbumUserRole.fromJson(json[r'role']) ?? AlbumUserRole.editor, userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'role'] = role.toJson();
    json[r'userId'] = userId;
    return json;
  }

  AlbumUserAddDto copyWith({AlbumUserRole? role, String? userId}) {
    return .new(role: role ?? this.role, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AlbumUserAddDto && role == other.role && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([role, userId]);
  }

  @override
  String toString() => 'AlbumUserAddDto(role=$role, userId=$userId)';
}
