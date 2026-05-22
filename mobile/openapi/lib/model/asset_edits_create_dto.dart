//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditsCreateDto {
  /// Returns a new [AssetEditsCreateDto] instance.
  AssetEditsCreateDto({
    this.edits = const [],
  });

  /// List of edit actions to apply (crop, rotate, or mirror)
  List<AssetEditActionItemDto> edits;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditsCreateDto &&
    _deepEquality.equals(other.edits, edits);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (edits.hashCode);

  @override
  String toString() => 'AssetEditsCreateDto[edits=$edits]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'edits'] = this.edits;
    return json;
  }

  /// Returns a new [AssetEditsCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditsCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditsCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditsCreateDto(
        edits: AssetEditActionItemDto.listFromJson(json[r'edits']),
      );
    }
    return null;
  }

  static List<AssetEditsCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditsCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditsCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditsCreateDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditsCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditsCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditsCreateDto-objects as value to a dart map
  static Map<String, List<AssetEditsCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditsCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditsCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'edits',
  };
}

