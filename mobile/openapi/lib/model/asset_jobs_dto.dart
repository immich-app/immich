//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetJobsDto {
  /// Returns a new [AssetJobsDto] instance.
  AssetJobsDto({
    this.assetIds = const [],
    required this.name,
  });

  List<String> assetIds;

  AssetJobName name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetJobsDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'AssetJobsDto[assetIds=$assetIds, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [AssetJobsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetJobsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetJobsDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        name: AssetJobName.fromJson(json[r'name'])!,
      );
    }
    return null;
  }

  static List<AssetJobsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetJobsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetJobsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetJobsDto> mapFromJson(dynamic json) {
    final map = <String, AssetJobsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetJobsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetJobsDto-objects as value to a dart map
  static Map<String, List<AssetJobsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetJobsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetJobsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
    'name',
  };
}

