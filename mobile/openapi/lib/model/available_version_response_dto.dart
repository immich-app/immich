//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AvailableVersionResponseDto {
  /// Returns a new [AvailableVersionResponseDto] instance.
  AvailableVersionResponseDto({
    required this.availableVersion,
  });

  SystemConfigImmichVersion? availableVersion;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AvailableVersionResponseDto &&
     other.availableVersion == availableVersion;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (availableVersion == null ? 0 : availableVersion!.hashCode);

  @override
  String toString() => 'AvailableVersionResponseDto[availableVersion=$availableVersion]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.availableVersion != null) {
      json[r'availableVersion'] = this.availableVersion;
    } else {
    //  json[r'availableVersion'] = null;
    }
    return json;
  }

  /// Returns a new [AvailableVersionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AvailableVersionResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AvailableVersionResponseDto(
        availableVersion: SystemConfigImmichVersion.fromJson(json[r'availableVersion']),
      );
    }
    return null;
  }

  static List<AvailableVersionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AvailableVersionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AvailableVersionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AvailableVersionResponseDto> mapFromJson(dynamic json) {
    final map = <String, AvailableVersionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AvailableVersionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AvailableVersionResponseDto-objects as value to a dart map
  static Map<String, List<AvailableVersionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AvailableVersionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AvailableVersionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'availableVersion',
  };
}

