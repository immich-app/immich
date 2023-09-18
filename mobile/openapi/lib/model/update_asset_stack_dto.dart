//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAssetStackDto {
  /// Returns a new [UpdateAssetStackDto] instance.
  UpdateAssetStackDto({
    required this.stackParentId,
    this.toAdd = const [],
    this.toRemove = const [],
  });

  String stackParentId;

  List<String> toAdd;

  List<String> toRemove;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAssetStackDto &&
     other.stackParentId == stackParentId &&
     other.toAdd == toAdd &&
     other.toRemove == toRemove;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (stackParentId.hashCode) +
    (toAdd.hashCode) +
    (toRemove.hashCode);

  @override
  String toString() => 'UpdateAssetStackDto[stackParentId=$stackParentId, toAdd=$toAdd, toRemove=$toRemove]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'stackParentId'] = this.stackParentId;
      json[r'toAdd'] = this.toAdd;
      json[r'toRemove'] = this.toRemove;
    return json;
  }

  /// Returns a new [UpdateAssetStackDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAssetStackDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateAssetStackDto(
        stackParentId: mapValueOfType<String>(json, r'stackParentId')!,
        toAdd: json[r'toAdd'] is List
            ? (json[r'toAdd'] as List).cast<String>()
            : const [],
        toRemove: json[r'toRemove'] is List
            ? (json[r'toRemove'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<UpdateAssetStackDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetStackDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetStackDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAssetStackDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAssetStackDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetStackDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAssetStackDto-objects as value to a dart map
  static Map<String, List<UpdateAssetStackDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAssetStackDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateAssetStackDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'stackParentId',
  };
}

