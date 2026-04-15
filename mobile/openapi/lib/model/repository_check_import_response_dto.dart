//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryCheckImportResponseDto {
  /// Returns a new [RepositoryCheckImportResponseDto] instance.
  RepositoryCheckImportResponseDto({
    required this.readable,
  });

  bool readable;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryCheckImportResponseDto &&
    other.readable == readable;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (readable.hashCode);

  @override
  String toString() => 'RepositoryCheckImportResponseDto[readable=$readable]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'readable'] = this.readable;
    return json;
  }

  /// Returns a new [RepositoryCheckImportResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryCheckImportResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryCheckImportResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryCheckImportResponseDto(
        readable: mapValueOfType<bool>(json, r'readable')!,
      );
    }
    return null;
  }

  static List<RepositoryCheckImportResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryCheckImportResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryCheckImportResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryCheckImportResponseDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryCheckImportResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryCheckImportResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryCheckImportResponseDto-objects as value to a dart map
  static Map<String, List<RepositoryCheckImportResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryCheckImportResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryCheckImportResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'readable',
  };
}

