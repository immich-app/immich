//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryMeterDto {
  /// Returns a new [RepositoryMeterDto] instance.
  RepositoryMeterDto({
    this.lastUpdated = const Optional.absent(),
    required this.objectCount,
    required this.sizeBytes,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> lastUpdated;

  num objectCount;

  num sizeBytes;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryMeterDto &&
    other.lastUpdated == lastUpdated &&
    other.objectCount == objectCount &&
    other.sizeBytes == sizeBytes;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (lastUpdated == null ? 0 : lastUpdated!.hashCode) +
    (objectCount.hashCode) +
    (sizeBytes.hashCode);

  @override
  String toString() => 'RepositoryMeterDto[lastUpdated=$lastUpdated, objectCount=$objectCount, sizeBytes=$sizeBytes]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.lastUpdated.isPresent) {
      final value = this.lastUpdated.value;
      json[r'lastUpdated'] = value;
    }
      json[r'objectCount'] = this.objectCount;
      json[r'sizeBytes'] = this.sizeBytes;
    return json;
  }

  /// Returns a new [RepositoryMeterDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryMeterDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryMeterDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryMeterDto(
        lastUpdated: json.containsKey(r'lastUpdated') ? Optional.present(mapValueOfType<String>(json, r'lastUpdated')) : const Optional.absent(),
        objectCount: num.parse('${json[r'objectCount']}'),
        sizeBytes: num.parse('${json[r'sizeBytes']}'),
      );
    }
    return null;
  }

  static List<RepositoryMeterDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryMeterDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryMeterDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryMeterDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryMeterDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryMeterDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryMeterDto-objects as value to a dart map
  static Map<String, List<RepositoryMeterDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryMeterDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryMeterDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'objectCount',
    'sizeBytes',
  };
}

