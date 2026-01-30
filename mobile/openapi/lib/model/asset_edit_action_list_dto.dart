//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionListDto {
  /// Returns a new [AssetEditActionListDto] instance.
  AssetEditActionListDto({
    this.edits = const [],
  });

  /// list of edits
  List<AssetEditActionListDtoEditsInner> edits;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionListDto &&
    _deepEquality.equals(other.edits, edits);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (edits.hashCode);

  @override
  String toString() => 'AssetEditActionListDto[edits=$edits]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'edits'] = this.edits;
    return json;
  }

  /// Returns a new [AssetEditActionListDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionListDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionListDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionListDto(
        edits: AssetEditActionListDtoEditsInner.listFromJson(json[r'edits']),
      );
    }
    return null;
  }

  static List<AssetEditActionListDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionListDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionListDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionListDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionListDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionListDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionListDto-objects as value to a dart map
  static Map<String, List<AssetEditActionListDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionListDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionListDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'edits',
  };
}

