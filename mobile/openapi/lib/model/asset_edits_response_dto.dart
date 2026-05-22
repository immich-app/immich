//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditsResponseDto {
  /// Returns a new [AssetEditsResponseDto] instance.
  AssetEditsResponseDto({
    required this.assetId,
    this.edits = const [],
  });

  /// Asset ID these edits belong to
  String assetId;

  /// List of edit actions applied to the asset
  List<AssetEditActionItemResponseDto> edits;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditsResponseDto &&
    other.assetId == assetId &&
    _deepEquality.equals(other.edits, edits);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (edits.hashCode);

  @override
  String toString() => 'AssetEditsResponseDto[assetId=$assetId, edits=$edits]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'edits'] = this.edits;
    return json;
  }

  /// Returns a new [AssetEditsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditsResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        edits: AssetEditActionItemResponseDto.listFromJson(json[r'edits']),
      );
    }
    return null;
  }

  static List<AssetEditsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetEditsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditsResponseDto-objects as value to a dart map
  static Map<String, List<AssetEditsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditsResponseDto.listFromJson(entry.value, growable: growable,);
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

