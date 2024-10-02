//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceUpdateDto {
  /// Returns a new [AssetFaceUpdateDto] instance.
  AssetFaceUpdateDto({
    this.data = const [],
  });

  List<AssetFaceUpdateItem> data;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceUpdateDto &&
    _deepEquality.equals(other.data, data);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode);

  @override
  String toString() => 'AssetFaceUpdateDto[data=$data]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'data'] = this.data;
    return json;
  }

  /// Returns a new [AssetFaceUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFaceUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceUpdateDto(
        data: AssetFaceUpdateItem.listFromJson(json[r'data']),
      );
    }
    return null;
  }

  static List<AssetFaceUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceUpdateDto> mapFromJson(dynamic json) {
    final map = <String, AssetFaceUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceUpdateDto-objects as value to a dart map
  static Map<String, List<AssetFaceUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'data',
  };
}

