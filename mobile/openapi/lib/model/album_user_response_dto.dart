// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumUserResponseDto {
  const AlbumUserResponseDto({required this.role, required this.user});

  final AlbumUserRole role;

  final UserResponseDto user;

  static AlbumUserResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumUserResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(role: (AlbumUserRole.fromJson(json[r'role']))!, user: (UserResponseDto.fromJson(json[r'user']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'role'] = role.toJson();
    json[r'user'] = user.toJson();
    return json;
  }

  AlbumUserResponseDto copyWith({AlbumUserRole? role, UserResponseDto? user}) {
    return .new(role: role ?? this.role, user: user ?? this.user);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is AlbumUserResponseDto && role == other.role && user == other.user);
  }

  @override
  int get hashCode {
    return Object.hashAll([role, user]);
  }

  @override
  String toString() => 'AlbumUserResponseDto(role=$role, user=$user)';
}
