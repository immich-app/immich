//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionItemDto {
  /// Returns a new [AssetEditActionItemDto] instance.
  AssetEditActionItemDto({
    required this.action,
    required this.parameters,
  });

  /// Type of edit action to perform
  AssetEditAction action;

  AssetEditActionItemDtoParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionItemDto &&
    other.action == action &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditActionItemDto[action=$action, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditActionItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionItemDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionItemDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionItemDto(
        action: AssetEditAction.fromJson(json[r'action'])!,
        parameters: AssetEditActionItemDtoParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionItemDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionItemDto-objects as value to a dart map
  static Map<String, List<AssetEditActionItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'parameters',
  };
}

