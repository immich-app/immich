// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AddUsersDto {
  const AddUsersDto({required this.albumUsers});

  /// Album users to add
  final List<AlbumUserAddDto> albumUsers;

  static AddUsersDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AddUsersDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumUsers: ((json[r'albumUsers'] as List?)
          ?.map(($e) => (AlbumUserAddDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumUsers'] = albumUsers.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  AddUsersDto copyWith({List<AlbumUserAddDto>? albumUsers}) {
    return .new(albumUsers: albumUsers ?? this.albumUsers);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AddUsersDto && const DeepCollectionEquality().equals(albumUsers, other.albumUsers));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(albumUsers)]);
  }

  @override
  String toString() => 'AddUsersDto(albumUsers=$albumUsers)';
}
