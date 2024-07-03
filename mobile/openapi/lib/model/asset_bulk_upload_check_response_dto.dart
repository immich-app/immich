//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUploadCheckResponseDto {
  /// Returns a new [AssetBulkUploadCheckResponseDto] instance.
  AssetBulkUploadCheckResponseDto({
    this.results = const [],
  });

  List<AssetBulkUploadCheckResult> results;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUploadCheckResponseDto &&
    _deepEquality.equals(other.results, results);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (results.hashCode);

  @override
  String toString() => 'AssetBulkUploadCheckResponseDto[results=$results]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'results'] = this.results;
    return json;
  }

  /// Returns a new [AssetBulkUploadCheckResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUploadCheckResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUploadCheckResponseDto(
        results: AssetBulkUploadCheckResult.listFromJson(json[r'results']),
      );
    }
    return null;
  }

  static List<AssetBulkUploadCheckResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUploadCheckResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUploadCheckResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkUploadCheckResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkUploadCheckResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkUploadCheckResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkUploadCheckResponseDto-objects as value to a dart map
  static Map<String, List<AssetBulkUploadCheckResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkUploadCheckResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkUploadCheckResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'results',
  };
}

