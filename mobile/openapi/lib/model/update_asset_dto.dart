//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAssetDto {
  /// Returns a new [UpdateAssetDto] instance.
  UpdateAssetDto({
    required this.isFavorite,
  });

  bool isFavorite;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAssetDto &&
     other.isFavorite == isFavorite;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isFavorite.hashCode);

  @override
  String toString() => 'UpdateAssetDto[isFavorite=$isFavorite]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'isFavorite'] = isFavorite;
    return _json;
  }

  /// Returns a new [UpdateAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateAssetDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateAssetDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateAssetDto(
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
      );
    }
    return null;
  }

  static List<UpdateAssetDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAssetDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAssetDto-objects as value to a dart map
  static Map<String, List<UpdateAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isFavorite',
  };
}

