//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupUserResponseDto {
  /// Returns a new [GroupUserResponseDto] instance.
  GroupUserResponseDto({
    required this.avatarColor,
    required this.email,
    required this.id,
    required this.metadata,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  UserAvatarColor avatarColor;

  String email;

  String id;

  GroupUserMetadata metadata;

  String name;

  DateTime profileChangedAt;

  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupUserResponseDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.id == id &&
    other.metadata == metadata &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (metadata.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'GroupUserResponseDto[avatarColor=$avatarColor, email=$email, id=$id, metadata=$metadata, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'metadata'] = this.metadata;
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [GroupUserResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupUserResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "GroupUserResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupUserResponseDto(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        metadata: GroupUserMetadata.fromJson(json[r'metadata'])!,
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<GroupUserResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupUserResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupUserResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupUserResponseDto> mapFromJson(dynamic json) {
    final map = <String, GroupUserResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupUserResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupUserResponseDto-objects as value to a dart map
  static Map<String, List<GroupUserResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupUserResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupUserResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'email',
    'id',
    'metadata',
    'name',
    'profileChangedAt',
    'profileImagePath',
  };
}

