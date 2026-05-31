// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UpdateAlbumUserDto {
  const UpdateAlbumUserDto({required this.role});

  final AlbumUserRole role;

  static UpdateAlbumUserDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UpdateAlbumUserDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(role: (AlbumUserRole.fromJson(json[r'role']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'role'] = role.toJson();
    return json;
  }

  UpdateAlbumUserDto copyWith({AlbumUserRole? role}) {
    return .new(role: role ?? this.role);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is UpdateAlbumUserDto && role == other.role);
  }

  @override
  int get hashCode {
    return Object.hashAll([role]);
  }

  @override
  String toString() => 'UpdateAlbumUserDto(role=$role)';
}
