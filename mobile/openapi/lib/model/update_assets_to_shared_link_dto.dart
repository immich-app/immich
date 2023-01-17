//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAssetsToSharedLinkDto {
  /// Returns a new [UpdateAssetsToSharedLinkDto] instance.
  UpdateAssetsToSharedLinkDto({
    this.assetIds = const [],
  });

  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAssetsToSharedLinkDto &&
     other.assetIds == assetIds;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode);

  @override
  String toString() => 'UpdateAssetsToSharedLinkDto[assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
    return json;
  }

  /// Returns a new [UpdateAssetsToSharedLinkDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAssetsToSharedLinkDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateAssetsToSharedLinkDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateAssetsToSharedLinkDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateAssetsToSharedLinkDto(
        assetIds: json[r'assetIds'] is List
            ? (json[r'assetIds'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<UpdateAssetsToSharedLinkDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetsToSharedLinkDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetsToSharedLinkDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAssetsToSharedLinkDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAssetsToSharedLinkDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetsToSharedLinkDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAssetsToSharedLinkDto-objects as value to a dart map
  static Map<String, List<UpdateAssetsToSharedLinkDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAssetsToSharedLinkDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetsToSharedLinkDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
  };
}

