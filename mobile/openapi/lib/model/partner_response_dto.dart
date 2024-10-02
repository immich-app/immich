//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PartnerResponseDto {
  /// Returns a new [PartnerResponseDto] instance.
  PartnerResponseDto({
    required this.avatarColor,
    required this.email,
    required this.id,
    this.inTimeline,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  UserAvatarColor avatarColor;

  String email;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inTimeline;

  String name;

  DateTime profileChangedAt;

  String profileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PartnerResponseDto &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.id == id &&
    other.inTimeline == inTimeline &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (avatarColor.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (inTimeline == null ? 0 : inTimeline!.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode);

  @override
  String toString() => 'PartnerResponseDto[avatarColor=$avatarColor, email=$email, id=$id, inTimeline=$inTimeline, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
      json[r'id'] = this.id;
    if (this.inTimeline != null) {
      json[r'inTimeline'] = this.inTimeline;
    } else {
    //  json[r'inTimeline'] = null;
    }
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    return json;
  }

  /// Returns a new [PartnerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PartnerResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PartnerResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PartnerResponseDto(
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        inTimeline: mapValueOfType<bool>(json, r'inTimeline'),
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
      );
    }
    return null;
  }

  static List<PartnerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PartnerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PartnerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PartnerResponseDto> mapFromJson(dynamic json) {
    final map = <String, PartnerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PartnerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PartnerResponseDto-objects as value to a dart map
  static Map<String, List<PartnerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PartnerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PartnerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'avatarColor',
    'email',
    'id',
    'name',
    'profileChangedAt',
    'profileImagePath',
  };
}

