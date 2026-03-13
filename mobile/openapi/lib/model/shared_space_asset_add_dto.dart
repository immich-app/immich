//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceAssetAddDto {
  /// Returns a new [SharedSpaceAssetAddDto] instance.
  SharedSpaceAssetAddDto({
    this.assetIds = const [],
  });

  /// Asset IDs
  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceAssetAddDto &&
    _deepEquality.equals(other.assetIds, assetIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode);

  @override
  String toString() => 'SharedSpaceAssetAddDto[assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
    return json;
  }

  /// Returns a new [SharedSpaceAssetAddDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceAssetAddDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceAssetAddDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceAssetAddDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SharedSpaceAssetAddDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceAssetAddDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceAssetAddDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceAssetAddDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceAssetAddDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceAssetAddDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceAssetAddDto-objects as value to a dart map
  static Map<String, List<SharedSpaceAssetAddDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceAssetAddDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceAssetAddDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
  };
}

