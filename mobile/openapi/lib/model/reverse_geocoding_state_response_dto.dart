//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ReverseGeocodingStateResponseDto {
  /// Returns a new [ReverseGeocodingStateResponseDto] instance.
  ReverseGeocodingStateResponseDto({
    required this.lastImportFileName,
    required this.lastUpdate,
  });

  String? lastImportFileName;

  String? lastUpdate;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ReverseGeocodingStateResponseDto &&
    other.lastImportFileName == lastImportFileName &&
    other.lastUpdate == lastUpdate;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (lastImportFileName == null ? 0 : lastImportFileName!.hashCode) +
    (lastUpdate == null ? 0 : lastUpdate!.hashCode);

  @override
  String toString() => 'ReverseGeocodingStateResponseDto[lastImportFileName=$lastImportFileName, lastUpdate=$lastUpdate]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.lastImportFileName != null) {
      json[r'lastImportFileName'] = this.lastImportFileName;
    } else {
    //  json[r'lastImportFileName'] = null;
    }
    if (this.lastUpdate != null) {
      json[r'lastUpdate'] = this.lastUpdate;
    } else {
    //  json[r'lastUpdate'] = null;
    }
    return json;
  }

  /// Returns a new [ReverseGeocodingStateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ReverseGeocodingStateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ReverseGeocodingStateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ReverseGeocodingStateResponseDto(
        lastImportFileName: mapValueOfType<String>(json, r'lastImportFileName'),
        lastUpdate: mapValueOfType<String>(json, r'lastUpdate'),
      );
    }
    return null;
  }

  static List<ReverseGeocodingStateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReverseGeocodingStateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReverseGeocodingStateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ReverseGeocodingStateResponseDto> mapFromJson(dynamic json) {
    final map = <String, ReverseGeocodingStateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ReverseGeocodingStateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ReverseGeocodingStateResponseDto-objects as value to a dart map
  static Map<String, List<ReverseGeocodingStateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ReverseGeocodingStateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ReverseGeocodingStateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'lastImportFileName',
    'lastUpdate',
  };
}

