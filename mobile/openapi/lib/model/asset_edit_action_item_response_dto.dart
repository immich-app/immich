//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionItemResponseDto {
  /// Returns a new [AssetEditActionItemResponseDto] instance.
  AssetEditActionItemResponseDto({
    required this.action,
    required this.id,
    required this.parameters,
  });

  /// Type of edit action to perform
  AssetEditAction action;

  String id;

  AssetEditActionItemDtoParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionItemResponseDto &&
    other.action == action &&
    other.id == id &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (id.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditActionItemResponseDto[action=$action, id=$id, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'id'] = this.id;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditActionItemResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionItemResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionItemResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionItemResponseDto(
        action: AssetEditAction.fromJson(json[r'action'])!,
        id: mapValueOfType<String>(json, r'id')!,
        parameters: AssetEditActionItemDtoParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionItemResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionItemResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionItemResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionItemResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionItemResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionItemResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionItemResponseDto-objects as value to a dart map
  static Map<String, List<AssetEditActionItemResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionItemResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionItemResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'id',
    'parameters',
  };
}

