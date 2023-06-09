//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUploadCheckItem {
  /// Returns a new [AssetBulkUploadCheckItem] instance.
  AssetBulkUploadCheckItem({
    required this.id,
    required this.checksum,
  });

  String id;

  /// base64 or hex encoded sha1 hash
  String checksum;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUploadCheckItem &&
     other.id == id &&
     other.checksum == checksum;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (checksum.hashCode);

  @override
  String toString() => 'AssetBulkUploadCheckItem[id=$id, checksum=$checksum]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'checksum'] = this.checksum;
    return json;
  }

  /// Returns a new [AssetBulkUploadCheckItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUploadCheckItem? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetBulkUploadCheckItem[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetBulkUploadCheckItem[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetBulkUploadCheckItem(
        id: mapValueOfType<String>(json, r'id')!,
        checksum: mapValueOfType<String>(json, r'checksum')!,
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
    'id',
    'checksum',
  };
}

