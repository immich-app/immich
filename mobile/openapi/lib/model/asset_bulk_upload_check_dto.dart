//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUploadCheckDto {
  /// Returns a new [AssetBulkUploadCheckDto] instance.
  AssetBulkUploadCheckDto({
    this.assets = const [],
  });

  List<AssetBulkUploadCheckItem> assets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUploadCheckDto &&
    _deepEquality.equals(other.assets, assets);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode);

  @override
  String toString() => 'AssetBulkUploadCheckDto[assets=$assets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
    return json;
  }

  /// Returns a new [AssetBulkUploadCheckDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUploadCheckDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUploadCheckDto(
        assets: AssetBulkUploadCheckItem.listFromJson(json[r'assets']),
      );
    }
    return null;
  }

  static List<AssetBulkUploadCheckDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUploadCheckDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUploadCheckDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkUploadCheckDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkUploadCheckDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkUploadCheckDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkUploadCheckDto-objects as value to a dart map
  static Map<String, List<AssetBulkUploadCheckDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkUploadCheckDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkUploadCheckDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
  };
}

