//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateProfileImageResponseDto {
  /// Returns a new [CreateProfileImageResponseDto] instance.
  CreateProfileImageResponseDto({
    required this.profileChangedAt,
    required this.profileImagePath,
    required this.userId,
  });

  DateTime profileChangedAt;

  String profileImagePath;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateProfileImageResponseDto &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'CreateProfileImageResponseDto[profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [CreateProfileImageResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateProfileImageResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "CreateProfileImageResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateProfileImageResponseDto(
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<CreateProfileImageResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateProfileImageResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateProfileImageResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateProfileImageResponseDto> mapFromJson(dynamic json) {
    final map = <String, CreateProfileImageResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateProfileImageResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateProfileImageResponseDto-objects as value to a dart map
  static Map<String, List<CreateProfileImageResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateProfileImageResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateProfileImageResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'profileChangedAt',
    'profileImagePath',
    'userId',
  };
}

