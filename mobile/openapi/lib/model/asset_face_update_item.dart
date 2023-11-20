//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceUpdateItem {
  /// Returns a new [AssetFaceUpdateItem] instance.
  AssetFaceUpdateItem({
    this.assetFaceId,
    this.assetId,
    this.personId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetFaceId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? personId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceUpdateItem &&
     other.assetFaceId == assetFaceId &&
     other.assetId == assetId &&
     other.personId == personId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetFaceId == null ? 0 : assetFaceId!.hashCode) +
    (assetId == null ? 0 : assetId!.hashCode) +
    (personId == null ? 0 : personId!.hashCode);

  @override
  String toString() => 'AssetFaceUpdateItem[assetFaceId=$assetFaceId, assetId=$assetId, personId=$personId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.assetFaceId != null) {
      json[r'assetFaceId'] = this.assetFaceId;
    } else {
    //  json[r'assetFaceId'] = null;
    }
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
    if (this.personId != null) {
      json[r'personId'] = this.personId;
    } else {
    //  json[r'personId'] = null;
    }
    return json;
  }

  /// Returns a new [AssetFaceUpdateItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceUpdateItem? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceUpdateItem(
        assetFaceId: mapValueOfType<String>(json, r'assetFaceId'),
        assetId: mapValueOfType<String>(json, r'assetId'),
        personId: mapValueOfType<String>(json, r'personId'),
      );
    }
    return null;
  }

  static List<AssetFaceUpdateItem> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceUpdateItem>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceUpdateItem.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceUpdateItem> mapFromJson(dynamic json) {
    final map = <String, AssetFaceUpdateItem>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceUpdateItem.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceUpdateItem-objects as value to a dart map
  static Map<String, List<AssetFaceUpdateItem>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceUpdateItem>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceUpdateItem.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

