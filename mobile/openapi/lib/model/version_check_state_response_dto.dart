//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class VersionCheckStateResponseDto {
  /// Returns a new [VersionCheckStateResponseDto] instance.
  VersionCheckStateResponseDto({
    required this.checkedAt,
    required this.releaseVersion,
  });

  String? checkedAt;

  String? releaseVersion;

  @override
  bool operator ==(Object other) => identical(this, other) || other is VersionCheckStateResponseDto &&
    other.checkedAt == checkedAt &&
    other.releaseVersion == releaseVersion;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checkedAt == null ? 0 : checkedAt!.hashCode) +
    (releaseVersion == null ? 0 : releaseVersion!.hashCode);

  @override
  String toString() => 'VersionCheckStateResponseDto[checkedAt=$checkedAt, releaseVersion=$releaseVersion]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.checkedAt != null) {
      json[r'checkedAt'] = this.checkedAt;
    } else {
    //  json[r'checkedAt'] = null;
    }
    if (this.releaseVersion != null) {
      json[r'releaseVersion'] = this.releaseVersion;
    } else {
    //  json[r'releaseVersion'] = null;
    }
    return json;
  }

  /// Returns a new [VersionCheckStateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static VersionCheckStateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "VersionCheckStateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return VersionCheckStateResponseDto(
        checkedAt: mapValueOfType<String>(json, r'checkedAt'),
        releaseVersion: mapValueOfType<String>(json, r'releaseVersion'),
      );
    }
    return null;
  }

  static List<VersionCheckStateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <VersionCheckStateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = VersionCheckStateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, VersionCheckStateResponseDto> mapFromJson(dynamic json) {
    final map = <String, VersionCheckStateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = VersionCheckStateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of VersionCheckStateResponseDto-objects as value to a dart map
  static Map<String, List<VersionCheckStateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<VersionCheckStateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = VersionCheckStateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checkedAt',
    'releaseVersion',
  };
}

