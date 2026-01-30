//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditsDto {
  /// Returns a new [AssetEditsDto] instance.
  AssetEditsDto({
    required this.assetId,
    this.edits = const [],
  });

  String assetId;

  /// list of edits
  List<AssetEditActionListDtoEditsInner> edits;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditsDto &&
    other.assetId == assetId &&
    _deepEquality.equals(other.edits, edits);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (edits.hashCode);

  @override
  String toString() => 'AssetEditsDto[assetId=$assetId, edits=$edits]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'edits'] = this.edits;
    return json;
  }

  /// Returns a new [AssetEditsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditsDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditsDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        edits: AssetEditActionListDtoEditsInner.listFromJson(json[r'edits']),
      );
    }
    return null;
  }

  static List<AssetEditsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditsDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditsDto-objects as value to a dart map
  static Map<String, List<AssetEditsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'edits',
  };
}

