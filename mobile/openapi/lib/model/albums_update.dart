//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumsUpdate {
  /// Returns a new [AlbumsUpdate] instance.
  AlbumsUpdate({
    this.defaultAssetOrder,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetOrder? defaultAssetOrder;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumsUpdate &&
    other.defaultAssetOrder == defaultAssetOrder;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (defaultAssetOrder == null ? 0 : defaultAssetOrder!.hashCode);

  @override
  String toString() => 'AlbumsUpdate[defaultAssetOrder=$defaultAssetOrder]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.defaultAssetOrder != null) {
      json[r'defaultAssetOrder'] = this.defaultAssetOrder;
    } else {
    //  json[r'defaultAssetOrder'] = null;
    }
    return json;
  }

  /// Returns a new [AlbumsUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumsUpdate? fromJson(dynamic value) {
    upgradeDto(value, "AlbumsUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumsUpdate(
        defaultAssetOrder: AssetOrder.fromJson(json[r'defaultAssetOrder']),
      );
    }
    return null;
  }

  static List<AlbumsUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumsUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumsUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumsUpdate> mapFromJson(dynamic json) {
    final map = <String, AlbumsUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumsUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumsUpdate-objects as value to a dart map
  static Map<String, List<AlbumsUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumsUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumsUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

