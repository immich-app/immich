//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUploadCheckItem {
  /// Returns a new [AssetBulkUploadCheckItem] instance.
  AssetBulkUploadCheckItem({
    required this.checksum,
    required this.id,
  });

  /// base64 or hex encoded sha1 hash
  String checksum;

  String id;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUploadCheckItem &&
    other.checksum == checksum &&
    other.id == id;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (id.hashCode);

  @override
  String toString() => 'AssetBulkUploadCheckItem[checksum=$checksum, id=$id]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'id'] = this.id;
    return json;
  }

  /// Returns a new [AssetBulkUploadCheckItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUploadCheckItem? fromJson(dynamic value) {
    upgradeDto(value, "AssetBulkUploadCheckItem");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUploadCheckItem(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        id: mapValueOfType<String>(json, r'id')!,
      );
    }
    return null;
  }

  static List<AssetBulkUploadCheckItem> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUploadCheckItem>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUploadCheckItem.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkUploadCheckItem> mapFromJson(dynamic json) {
    final map = <String, AssetBulkUploadCheckItem>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkUploadCheckItem.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkUploadCheckItem-objects as value to a dart map
  static Map<String, List<AssetBulkUploadCheckItem>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkUploadCheckItem>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkUploadCheckItem.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'id',
  };
}

